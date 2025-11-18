import React, { useState, useMemo, useCallback } from 'react';
import { CopyIcon, CheckIcon, SpreadsheetIcon } from './icons';
import { generateImage } from '../services/geminiService';
import { uploadImageToS3 } from '../services/s3Service';
 
// 희엽님 계정 테스트 
interface ContentDisplayProps {
  content: string;
  suggestions: string[];
  sources: { uri: string; title: string }[];
  isLoading: boolean;
  error: string | null;
  onSwitchToImageTab: (prompt: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  category?: string;
}

// FIX: Define a specific type for image status to help with type inference.
interface ImageStatus {
  url: string | null;
  s3Url: string | null; // S3 전체 URL 저장
  isLoading: boolean;
  error: string | null;
}

interface ImagePromptProps {
  text: string;
  onGenerate: (prompt: string) => Promise<void>;
  onSwitchToImageTab: (prompt: string) => void;
  status: ImageStatus;
}

// HTTP 환경에서도 동작하는 복사 함수
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // 먼저 Clipboard API 시도
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.log('Clipboard API 실패, fallback 사용:', err);
  }

  // Fallback: execCommand 사용
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('복사 실패:', err);
    return false;
  }
};

const ImagePrompt: React.FC<ImagePromptProps> = ({ text, onGenerate, onSwitchToImageTab, status }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (status.isLoading) {
    return (
      <div className="bg-gray-900/50 p-3 rounded-lg mt-2 flex items-center justify-center aspect-square">
        <svg className="animate-spin h-8 w-8 text-[#1FA77A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (status.error) {
     return (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg mt-2 text-center text-sm flex flex-col items-center justify-center aspect-square">
            <p className="font-semibold">이미지 생성 실패</p>
            <button onClick={() => onGenerate(text)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md mt-2 transition-colors">재시도</button>
        </div>
     );
  }

  if (status.url) {
    const filename = text.substring(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpeg';
    return (
        <div className="bg-gray-900 rounded-lg mt-2 group relative aspect-square overflow-hidden border border-gray-700">
            <img src={status.url} alt={text} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                 <p className="text-white text-xs mb-4 leading-snug max-h-24 overflow-auto">{text}</p>
                 <a href={status.url} download={filename} className="text-sm bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-bold py-2 px-4 rounded-md transition-colors w-full text-center">다운로드</a>
                 <button onClick={() => onSwitchToImageTab(text)} className="mt-2 text-xs text-gray-300 hover:underline">프롬프트 수정</button>
            </div>
        </div>
    );
  }
  
  return (
    <div className="bg-gray-800 p-3 rounded-lg mt-2 flex items-center justify-between group">
      <p className="text-gray-300 text-sm font-mono flex-grow pr-2">📸 {text}</p>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onGenerate(text)} 
          title="이미지 생성하기" 
          className="text-sm bg-gray-700 hover:bg-[#1FA77A] text-white font-medium py-1 px-3 rounded-md transition-colors"
        >
          생성
        </button>
        <button onClick={handleCopy} title="프롬프트 복사" className="p-1.5 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition">
          {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};


export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, suggestions, sources, isLoading, error, onSwitchToImageTab, onSuggestionClick, category }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [isCsvCopied, setIsCsvCopied] = useState(false);
  const [imageStatuses, setImageStatuses] = useState<Record<string, ImageStatus>>({});
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);

  const imagePrompts = useMemo(() => {
    if (!content) return [];
    const uniquePrompts = new Set(content.split('\n')
      .filter(line => line.startsWith('📸 이미지 프롬프트:'))
      .map(line => line.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim()));
    return Array.from(uniquePrompts);
  }, [content]);

  const generatedImageUrls = useMemo(() => {
    // FIX: Explicitly cast the result of Object.values to fix type inference issues where `s` is treated as `unknown`.
    return (Object.values(imageStatuses) as ImageStatus[]).map(s => s.url).filter((url): url is string => !!url);
  }, [imageStatuses]);
  
  const isInstagramCardFormat = useMemo(() => {
    if (!content) return false;
    return /\[Card\s*\d+\]/.test(content);
  }, [content]);

  const handleCopyAll = async () => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };
  
  const handleGenerateSingleImage = useCallback(async (prompt: string) => {
    setImageStatuses(prev => ({ ...prev, [prompt]: { url: null, s3Url: null, isLoading: true, error: null } }));
    try {
        const base64Image = await generateImage(prompt);
        
        // S3에 업로드하여 전체 URL 가져오기
        let s3Url: string | null = null;
        try {
            s3Url = await uploadImageToS3(base64Image, prompt);
        } catch (uploadErr) {
            console.error('S3 업로드 실패:', uploadErr);
            // S3 업로드 실패해도 base64 이미지는 표시
        }
        
        setImageStatuses(prev => ({
            ...prev,
            [prompt]: {
                url: `data:image/jpeg;base64,${base64Image}`,
                s3Url: s3Url,
                isLoading: false,
                error: null
            }
        }));
    } catch (e) {
        console.error("Single image generation failed:", e);
        setImageStatuses(prev => ({
            ...prev,
            [prompt]: { url: null, s3Url: null, isLoading: false, error: 'Image generation failed.' }
        }));
    }
  }, []);

  const handleGenerateAllImages = useCallback(async () => {
    if (!imagePrompts.length) return;

    setIsBatchGenerating(true);
    
    // 초기 상태 설정: 아직 생성되지 않은 이미지만 로딩 상태로 설정
    setImageStatuses(prev => {
        const newStatuses = {...prev};
        imagePrompts.forEach(p => {
            if (!newStatuses[p]?.url) { // Don't re-generate existing images
                 newStatuses[p] = { isLoading: true, url: null, s3Url: null, error: null };
            }
        });
        return newStatuses;
    });

    // 순차적으로 하나씩 처리 (병렬 처리 대신)
    for (const prompt of imagePrompts) {
        // 이미 생성된 이미지는 건너뛰기
        if (imageStatuses[prompt]?.url) {
            continue;
        }

        try {
            // 각 이미지를 순차적으로 생성
            const base64Image = await generateImage(prompt);
            
            // S3에 업로드하여 전체 URL 가져오기
            let s3Url: string | null = null;
            try {
                s3Url = await uploadImageToS3(base64Image, prompt);
            } catch (uploadErr) {
                console.error('S3 업로드 실패:', uploadErr);
                // S3 업로드 실패해도 base64 이미지는 표시
            }
            
            setImageStatuses(prev => ({
                ...prev,
                [prompt]: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    s3Url: s3Url,
                    isLoading: false,
                    error: null
                }
            }));
        } catch (e) {
            console.error(`Image generation failed for prompt: ${prompt}`, e);
            setImageStatuses(prev => ({
                ...prev,
                [prompt]: { url: null, s3Url: null, isLoading: false, error: 'Image generation failed.' }
            }));
        }
    }

    setIsBatchGenerating(false);
  }, [imagePrompts, imageStatuses]);
  
  const handleDownloadAll = useCallback(() => {
    generatedImageUrls.forEach((url, index) => {
        // FIX: Explicitly cast the result of Object.entries to fix type inference issues where `status` is treated as `unknown`.
        const entry = (Object.entries(imageStatuses) as [string, ImageStatus][]).find(([, status]) => status.url === url);
        const prompt = entry ? entry[0] : `image_${index + 1}`;
        const filename = prompt.substring(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpeg';
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  }, [generatedImageUrls, imageStatuses]);
  
  const handleCopyToClipboardForSpreadsheet = useCallback(async () => {
    if (!content) return;

    interface CardData {
      subtitle: string;
      body: string;
      prompt: string;
      source: string;
    }

    let title = '';
    let coverPrompt = '';
    const cards: CardData[] = [];
    let hashtags: string[] = [];

    const lines = content.split('\n');
    let currentCard: CardData | null = null;
    let currentBodyParts: string[] = [];
    let isBeforeCards = true;

    const pushCard = () => {
        if (currentCard) {
            currentCard.body = currentBodyParts.join(' ').trim();
            cards.push(currentCard);
            currentCard = null;
            currentBodyParts = [];
        }
    };

    lines.forEach(line => {
        if (line.startsWith('제목:')) {
            title = line.replace('제목:', '').trim();
        } else if (isBeforeCards && line.startsWith('📸 이미지 프롬프트:')) {
            coverPrompt = line.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim();
        } else if (line.startsWith('[Card')) {
            isBeforeCards = false;
            pushCard();
            currentCard = { subtitle: '', body: '', prompt: '', source: '' };
        } else if (line.startsWith('💡 소제목:')) {
            if (currentCard) currentCard.subtitle = line.replace('💡 소제목:', '').trim();
        } else if (!isBeforeCards && line.startsWith('📸 이미지 프롬프트:')) {
            if (currentCard) currentCard.prompt = line.replace('📸 이미지 프롬프트:', '').trim();
        } else if (!isBeforeCards && line.startsWith('🔎 출처:')) {
            if (currentCard) {
                const sourceText = line.replace('🔎 출처:', '').trim();
                currentCard.source = sourceText === '자체 정보' ? '' : sourceText;
            }
        } else if (line.startsWith('#')) {
            hashtags = line.replace(/#/g, '').split(' ').map(t => t.trim()).filter(Boolean);
        }
         else if (currentCard && line.trim() && !line.match(/카드 수:|카드별 콘텐츠/)) {
            currentBodyParts.push(line.trim());
        }
    });
    pushCard();

    const getFilename = (prompt: string) => {
        if (!prompt) return '';
        // S3 URL이 있으면 전체 URL 반환, 없으면 빈 문자열
        const s3Url = imageStatuses[prompt]?.s3Url;
        return s3Url || '';
    };

    const dataRow: string[] = [
        title,
        category || '',
        hashtags[0] || '',
        hashtags[1] || '',
        hashtags[2] || '',
        getFilename(coverPrompt),
        '' // Empty column separator after cover section
    ];

    for (let i = 0; i < 10; i++) {
        const card = cards[i];
        if (card) {
            dataRow.push(card.subtitle);      // 카드 소제목
            dataRow.push(card.body);          // 카드 본문
            dataRow.push(getFilename(card.prompt)); // 카드 썸네일
            dataRow.push(card.source);        // 카드 출처
        } else {
            // Fill empty for non-existent cards
            dataRow.push('', '', '', ''); 
        }

        // Add empty separator column after each card block, except for the last one
        if (i < 9) {
            dataRow.push('');
        }
    }
    
    const escapeTsvField = (field: string = '') => `${field.replace(/\t/g, ' ').replace(/\n/g, ' ')}`;
    
    const tsvContent = dataRow.map(escapeTsvField).join('\t');

    const success = await copyToClipboard(tsvContent);
    if (success) {
      setIsCsvCopied(true);
      setTimeout(() => setIsCsvCopied(false), 2000);
    }
}, [content, imageStatuses, category]);


  const renderedContent = useMemo(() => {
    if (!content) return null;
  
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentCard: React.ReactNode[] = [];
    let inCard = false;

    const pushCard = () => {
      if (currentCard.length > 0) {
        elements.push(
          <div key={`card-container-${elements.length}`} className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-2">
            {currentCard}
          </div>
        );
        currentCard = [];
      }
    };

    lines.forEach((line, index) => {
      const key = `line-${index}`;
      if (line.match(/^제목(\(.*\))?:/)) {
        pushCard();
        inCard = false;
        elements.push(<h2 key={key} className="text-2xl font-bold text-white mb-2 mt-4">{line}</h2>);
      } else if (line.startsWith('핵심 메시지') || line.startsWith('카드 수')) {
        pushCard();
        inCard = false;
        elements.push(<p key={key} className="text-gray-400 mb-4">{line}</p>);
      } else if (line.startsWith('[Card') || line.startsWith('[Scene')) {
        pushCard();
        inCard = true;
        const title = line.replace(/\[|\]/g, '');
        currentCard.push(<h3 key={key} className="text-lg font-semibold text-[#1FA77A] mb-2">{title}</h3>);
      } else if (line.startsWith('💡 소제목:')) {
        const subtitle = line.replace('💡 소제목:', '').trim();
        (inCard ? currentCard : elements).push(<p key={key} className="font-bold text-gray-200">{`💡 ${subtitle}`}</p>);
      } else if (line.startsWith('📸 이미지 프롬프트:')) {
        const prompt = line.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim();
        const status = imageStatuses[prompt] || { url: null, s3Url: null, isLoading: false, error: null };
        (inCard ? currentCard : elements).push(
            <ImagePrompt 
                key={`${key}-${prompt}`}
                text={prompt} 
                onGenerate={handleGenerateSingleImage} 
                onSwitchToImageTab={onSwitchToImageTab} 
                status={status} 
            />);
      } else if (line.startsWith('#')) {
        pushCard();
        inCard = false;
        elements.push(<p key={key} className="text-blue-400 mt-4">{line}</p>);
      } else if (line.startsWith('후속 제안')) {
          return;
      } else if (line.startsWith('[섹션')) {
        pushCard();
        inCard = false;
        elements.push(<h3 key={key} className="text-xl font-semibold text-white mt-6 mb-2">{line.replace(/\[|\]/g, '')}</h3>);
      } else if (line.startsWith('✍️') || line.startsWith('📚') || line.startsWith('✅') || line.startsWith('🔎') || line.startsWith('🎬')) {
        pushCard();
        inCard = false;
         // For card format, render '출처' inside the card
        if (inCard && line.startsWith('🔎')) {
            currentCard.push(<p key={key} className="text-xs text-gray-500 mt-2">{line}</p>)
        } else {
            elements.push(<h3 key={key} className="text-xl font-semibold text-[#1FA77A] mt-6 mb-2">{line}</h3>);
        }
      } else if (line.trim()) {
        (inCard ? currentCard : elements).push(<p key={key} className="text-gray-300 whitespace-pre-wrap">{line}</p>);
      }
    });

    pushCard();
    return elements;
  }, [content, onSwitchToImageTab, imageStatuses, handleGenerateSingleImage]);

  return (
    <div className="bg-gray-800/50 p-6 rounded-b-xl rounded-r-xl shadow-lg border border-t-0 border-gray-700 min-h-[calc(100vh-13rem)] flex flex-col">
      {content && !isLoading && (
        <div className="self-end mb-4 flex flex-wrap gap-2 justify-end">
             {isInstagramCardFormat && (
                <button 
                    onClick={handleCopyToClipboardForSpreadsheet} 
                    className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 px-4 rounded-md transition-colors"
                >
                    {isCsvCopied ? <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> : <SpreadsheetIcon className="w-4 h-4 mr-2" />}
                    {isCsvCopied ? '복사 완료!' : '스프레드시트용 데이터 복사'}
                </button>
            )}
            {imagePrompts.length > 0 && (
                <button 
                    onClick={handleGenerateAllImages} 
                    disabled={isBatchGenerating} 
                    className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-wait"
                >
                    {isBatchGenerating && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>}
                    {isBatchGenerating ? '생성 중...' : `이미지 일괄 생성 (${imagePrompts.length})`}
                </button>
            )}
            {generatedImageUrls.length > 0 && (
                 <button onClick={handleDownloadAll} className="flex items-center text-sm bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-medium py-2 px-4 rounded-md transition-colors">
                    {`생성된 이미지 다운로드 (${generatedImageUrls.length})`}
                 </button>
            )}
            <button onClick={handleCopyAll} className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 px-4 rounded-md transition-colors">
                {copiedAll ? <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> : <CopyIcon className="w-4 h-4 mr-2" />}
                {copiedAll ? '복사 완료!' : '전체 복사'}
            </button>
        </div>
      )}
      <div className="flex-grow">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <svg className="animate-spin h-10 w-10 text-[#1FA77A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-gray-400">AI가 열심히 콘텐츠를 만들고 있습니다...</p>
          </div>
        )}
        {error && <div className="text-red-400 text-center">{error}</div>}
        {!isLoading && !error && !content && (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
             <div className="text-4xl mb-4">⛳️</div>
            <h3 className="text-lg font-semibold text-gray-300">TeeShot 콘텐츠 생성기</h3>
            <p className="max-w-md mt-1">왼쪽 양식을 작성하고 '콘텐츠 생성하기'를 클릭하여 골프 관련 소셜 미디어 콘텐츠를 만들어보세요.</p>
          </div>
        )}
        {!isLoading && content && (
            <div className="space-y-4">
              {renderedContent}
              {suggestions && suggestions.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-300 mb-3">다음 콘텐츠 제안:</h4>
                    <div className="flex flex-wrap gap-3">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2 px-4 rounded-full text-sm transition-all duration-200 transform hover:scale-105"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
              )}
               {sources && sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <h4 className="text-lg font-semibold text-gray-300 mb-3">AI가 참고한 자료</h4>
                    <ul className="list-disc list-inside space-y-2">
                        {sources.map((source, index) => (
                            <li key={index} className="text-gray-400">
                                <a 
                                    href={source.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-400 hover:text-blue-300 hover:underline"
                                    title={source.uri}
                                >
                                    {source.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
              )}
            </div>
        )}
      </div>
    </div>
  );
};