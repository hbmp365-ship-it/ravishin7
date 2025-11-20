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
      <div className="bg-gray-100 p-3 rounded-lg mt-2 flex items-center justify-center aspect-square">
        <svg className="animate-spin h-8 w-8 text-[#1FA77A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (status.error) {
     return (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mt-2 text-center text-sm flex flex-col items-center justify-center aspect-square">
            <p className="font-semibold">이미지 생성 실패</p>
            <button onClick={() => onGenerate(text)} className="text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md mt-2 transition-colors">재시도</button>
        </div>
     );
  }

  if (status.url) {
    const filename = text.substring(0, 40).replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpeg';
    return (
        <div className="bg-gray-100 rounded-lg mt-2 group relative aspect-square overflow-hidden border border-gray-200">
            <img src={status.url} alt={text} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                 <p className="text-white text-xs mb-4 leading-snug max-h-24 overflow-auto">{text}</p>
                 <a href={status.url} download={filename} className="text-sm bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-bold py-2 px-4 rounded-md transition-colors w-full text-center">다운로드</a>
                 <button onClick={() => onSwitchToImageTab(text)} className="mt-2 text-xs text-gray-200 hover:underline">프롬프트 수정</button>
            </div>
        </div>
    );
  }
  
  return (
    <div className="bg-gray-100 p-3 rounded-lg mt-2 flex items-center justify-between group">
      <p className="text-gray-700 text-sm font-mono flex-grow pr-2">📸 {text}</p>
      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onGenerate(text)} 
          title="이미지 생성하기" 
          className="text-sm bg-gray-200 hover:bg-[#1FA77A] text-gray-800 hover:text-white font-medium py-1 px-3 rounded-md transition-colors"
        >
          생성
        </button>
        <button onClick={handleCopy} title="프롬프트 복사" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition">
          {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
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
            // 각 이미지를 순차적으로 생성 (gemini-2.5-flash-image 모델 사용 - 빠른 생성)
            const base64Image = await generateImage(prompt, 'gemini-2.5-flash-image');
            
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

    // 제목을 30글자 이내로 제한하고, 10글자마다 줄바꿈하되 단어가 분리되지 않도록 처리하는 함수
    const formatTitleWithLineBreaks = (text: string, maxCharsPerLine: number = 10, maxTotalChars: number = 30): string => {
      if (!text) return '';
      
      // 30글자를 초과하면 잘라내기
      let trimmedText = text;
      if (text.length > maxTotalChars) {
        // 단어 단위로 자르기 위해 공백 기준으로 분리
        const words = text.split(' ');
        let result = '';
        for (const word of words) {
          const testResult = result ? `${result} ${word}` : word;
          if (testResult.length <= maxTotalChars) {
            result = testResult;
          } else {
            break;
          }
        }
        trimmedText = result || text.substring(0, maxTotalChars);
      }
      
      const words = trimmedText.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        
        if (testLine.length <= maxCharsPerLine) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // 단어 자체가 10글자를 초과하는 경우
            // 10글자씩 강제로 자르지 않고 그대로 한 줄에 추가 (단어 보존)
            lines.push(word);
            currentLine = '';
          }
        }
        
        // 최대 3줄까지만 허용
        if (lines.length >= 3) {
          break;
        }
      }

      // 마지막 줄 추가 (3줄 미만인 경우만)
      if (currentLine && lines.length < 3) {
        lines.push(currentLine);
      }

      return lines.slice(0, 3).join('\n');
    };

    let title = '';
    let coverPrompt = '';
    const cards: CardData[] = [];
    let hashtags: string[] = [];
    let postingText = '';
    let sourcesText = '';

    const lines = content.split('\n');
    let currentCard: CardData | null = null;
    let currentBodyParts: string[] = [];
    let isBeforeCards = true;
    let isParsingPostingText = false;
    let postingTextParts: string[] = [];
    let isParsingTitle = false;
    let titleParts: string[] = [];

    const pushCard = () => {
        if (currentCard) {
            currentCard.body = currentBodyParts.join('\n').trim();
            cards.push(currentCard);
            currentCard = null;
            currentBodyParts = [];
        }
    };

    lines.forEach(line => {
        if (line.startsWith('✍️ 포스팅 글')) {
            isParsingPostingText = true;
            isParsingTitle = false;
            if (titleParts.length > 0) {
                title = titleParts.join(' ').trim();
                titleParts = [];
            }
            pushCard(); 
            return; 
        }
        
        if (isParsingPostingText) {
             if (line.startsWith('후속 제안:') || line.startsWith('🔎 참고자료')) {
                isParsingPostingText = false;
            } else {
                postingTextParts.push(line);
            }
            return;
        }

        if (line.startsWith('제목:')) {
            isParsingTitle = true;
            const titleContent = line.replace(/^제목(\(.*\))?:\s*/, '').trim();
            if (titleContent) {
                titleParts.push(titleContent);
            }
        } else if (isParsingTitle && (line.startsWith('핵심 메시지') || line.startsWith('카드 수') || line.startsWith('📸 이미지 프롬프트:') || line.startsWith('[Card'))) {
            // 제목 파싱 종료
            isParsingTitle = false;
            title = titleParts.join(' ').trim();
            titleParts = [];
            
            // 현재 줄 처리 계속
            if (line.startsWith('📸 이미지 프롬프트:')) {
                if (isBeforeCards) {
                    coverPrompt = line.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim();
                }
            } else if (line.startsWith('[Card')) {
                isBeforeCards = false;
                pushCard();
                currentCard = { subtitle: '', body: '', prompt: '', source: '' };
            }
        } else if (isParsingTitle && line.trim() && !line.startsWith('#')) {
            // 제목의 추가 줄
            titleParts.push(line.trim());
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
    
    // 마지막에 제목이 완료되지 않은 경우 처리
    if (titleParts.length > 0) {
        title = titleParts.join(' ').trim();
    }
    
    pushCard();
    postingText = postingTextParts.join('\n').trim();

    const getFilename = (prompt: string) => {
        if (!prompt) return '';
        // S3 URL이 있으면 전체 URL 반환, 없으면 빈 문자열
        const s3Url = imageStatuses[prompt]?.s3Url;
        return s3Url || '';
    };

    // 제목을 10글자 단위로 줄바꿈 처리
    const formattedTitle = formatTitleWithLineBreaks(title, 10);

    const dataRow: string[] = [
        formattedTitle,
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
    
    // 참고자료 섹션 추출
    const sourcesMatch = content.match(/🔎 참고자료\n([\s\S]*?)(?=\n후속 제안:|$)/);
    if(sourcesMatch && sourcesMatch[1]) {
        sourcesText = sourcesMatch[1].trim();
    } else {
        sourcesText = sources.map(s => `${s.title} (${s.uri})`).join('\n');
    }

    // Column 58 (index 57) for postingText
    const postingTextColIndex = 57;
    let padding = postingTextColIndex - dataRow.length;
    if (padding > 0) dataRow.push(...Array(padding).fill(''));
    dataRow.push(postingText);

    // Column 60 (index 59) for sourceInfo
    const sourceInfoColIndex = 59;
    padding = sourceInfoColIndex - dataRow.length;
    if (padding > 0) dataRow.push(...Array(padding).fill(''));
    dataRow.push(sourcesText);

    // Column 62 (index 61) for full content
    const fullContentColIndex = 61;
    padding = fullContentColIndex - dataRow.length;
    if (padding > 0) dataRow.push(...Array(padding).fill(''));
    dataRow.push(content);

    const escapeTsvField = (field: string = '') => {
      const needsQuoting = field.includes('\t') || field.includes('\n') || field.includes('"');
      if (needsQuoting) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    const tsvContent = dataRow.map(escapeTsvField).join('\t');

    const success = await copyToClipboard(tsvContent);
    if (success) {
      setIsCsvCopied(true);
      setTimeout(() => setIsCsvCopied(false), 2000);
    }
}, [content, imageStatuses, category, sources]);


  const renderedContent = useMemo(() => {
    if (!content) return null;
  
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentCard: React.ReactNode[] = [];
    let inCard = false;
    let inPostingSection = false;
    let postingContent: React.ReactNode[] = [];
    let inTitle = false;
    let titleLines: string[] = [];
    let titleStartIndex = 0;

    const pushCard = () => {
      if (currentCard.length > 0) {
        elements.push(
          <div key={`card-container-${elements.length}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
            {currentCard}
          </div>
        );
        currentCard = [];
      }
    };

    const pushTitle = () => {
      if (titleLines.length > 0) {
        const titleContent = titleLines.join('\n');
        elements.push(
          <div key={`title-${titleStartIndex}`} className="mb-3 mt-4">
            <span className="text-sm font-medium text-gray-500">제목</span>
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight whitespace-pre-wrap">{titleContent}</h2>
          </div>
        );
        titleLines = [];
        inTitle = false;
      }
    };

    const pushPostingSection = () => {
      if (postingContent.length > 0) {
        elements.push(
          <div key={`posting-section-${elements.length}`} className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-[#1FA77A] mb-4">✍️ 포스팅 글</h3>
            <div className="space-y-3 text-gray-700">
              {postingContent}
            </div>
          </div>
        );
        postingContent = [];
      }
    };

    lines.forEach((line, index) => {
      const key = `line-${index}`;
      
      // 포스팅 글 섹션 시작
      if (line.startsWith('✍️ 포스팅 글')) {
        pushCard();
        pushPostingSection();
        inCard = false;
        inPostingSection = true;
        return;
      }
      
      // 포스팅 글 섹션 종료 조건
      if (inPostingSection && (line.startsWith('후속 제안') || line.startsWith('🔎 참고자료') || line.startsWith('🔎 참고'))) {
        pushPostingSection();
        inPostingSection = false;
        if (line.startsWith('후속 제안')) {
          return;
        }
      }
      
      // 포스팅 글 내용 처리
      if (inPostingSection) {
        if (line.startsWith('🎵 추천 BGM:') || line.startsWith('🎵')) {
          postingContent.push(
            <p key={key} className="text-gray-600 font-medium mt-2">
              {line}
            </p>
          );
        } else if (line.startsWith('#')) {
          postingContent.push(
            <p key={key} className="text-[#1FA77A] font-medium">
              {line}
            </p>
          );
        } else if (line.trim()) {
          postingContent.push(
            <p key={key} className="text-gray-700 whitespace-pre-wrap">
              {line}
            </p>
          );
        }
        return;
      }
      
      if (line.match(/^제목(\(.*\))?:/)) {
        pushCard();
        pushTitle();
        inCard = false;
        inTitle = true;
        titleStartIndex = index;
        const titleContent = line.replace(/^제목(\(.*\))?:\s*/, '').trim();
        if (titleContent) {
          titleLines.push(titleContent);
        }
      } else if (line.startsWith('핵심 메시지') || line.startsWith('카드 수')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(<p key={key} className="text-gray-600 mb-4">{line}</p>);
      } else if (line.startsWith('[Card') || line.startsWith('[Scene')) {
        pushTitle();
        pushCard();
        inCard = true;
        const title = line.replace(/\[|\]/g, '');
        currentCard.push(<h3 key={key} className="text-lg font-semibold text-[#1FA77A] mb-2">{title}</h3>);
      } else if (line.startsWith('💡 소제목:')) {
        pushTitle();
        const subtitle = line.replace('💡 소제목:', '').trim();
        (inCard ? currentCard : elements).push(<p key={key} className="font-bold text-gray-800">{`💡 ${subtitle}`}</p>);
      } else if (line.startsWith('📸 이미지 프롬프트:')) {
        pushTitle();
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
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(<p key={key} className="text-[#1FA77A] mt-4">{line}</p>);
      } else if (line.startsWith('후속 제안')) {
          pushTitle();
          return;
      } else if (line.startsWith('[섹션')) {
        pushTitle();
        pushCard();
        inCard = false;
        const sectionTitle = line.replace(/\[|\]/g, '');
        elements.push(
          <div key={key} className="mt-8 mb-4">
            <h3 className="text-xl font-extrabold text-gray-900 border-l-4 border-[#1FA77A] pl-4 py-2 bg-gradient-to-r from-gray-50 to-white">{sectionTitle}</h3>
          </div>
        );
      } else if (line.startsWith('✍️ 인트로')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(
          <div key={key} className="mt-6 mb-3 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-bold text-[#1FA77A] mb-3">{line}</h3>
          </div>
        );
      } else if (line.startsWith('📚 본문')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(
          <div key={key} className="mt-8 mb-4 pt-4 border-t-2 border-[#1FA77A]">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{line}</h3>
          </div>
        );
      } else if (line.startsWith('✅')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(
          <div key={key} className="mt-8 mb-3 pt-4 border-t border-gray-200">
            <h3 className="text-xl font-bold text-[#1FA77A] mb-3">{line}</h3>
          </div>
        );
      } else if (line.startsWith('🔎 참고자료')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(
          <div key={key} className="mt-6 mb-2 pt-3 border-t border-gray-300">
            <h4 className="text-base font-semibold text-gray-600 mb-2">{line}</h4>
          </div>
        );
      } else if (line.startsWith('🎬')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(<h3 key={key} className="text-xl font-semibold text-[#1FA77A] mt-6 mb-2">{line}</h3>);
      } else if (line.trim()) {
        if (inTitle) {
          // 제목이 여러 줄로 계속되는 경우
          titleLines.push(line.trim());
        } else {
          // 일반 본문 텍스트 - 줄 간격 및 패딩 추가
          const paragraphClass = inCard 
            ? "text-gray-700 whitespace-pre-wrap leading-relaxed mb-3"
            : "text-base text-gray-700 whitespace-pre-wrap leading-loose mb-4 pl-1";
          (inCard ? currentCard : elements).push(<p key={key} className={paragraphClass}>{line}</p>);
        }
      }
    });

    pushTitle();
    pushCard();
    pushPostingSection();
    return elements;
  }, [content, onSwitchToImageTab, imageStatuses, handleGenerateSingleImage]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[calc(100vh-13rem)] flex flex-col">
      {content && !isLoading && (
        <div className="self-end mb-4 flex flex-wrap gap-2 justify-end">
             {isInstagramCardFormat && (
                <button 
                    onClick={handleCopyToClipboardForSpreadsheet} 
                    className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                >
                    {isCsvCopied ? <CheckIcon className="w-4 h-4 mr-2 text-green-400" /> : <SpreadsheetIcon className="w-4 h-4 mr-2" />}
                    {isCsvCopied ? '복사 완료!' : '스프레드시트용 데이터 복사'}
                </button>
            )}
            {imagePrompts.length > 0 && (
                <button 
                    onClick={handleGenerateAllImages} 
                    disabled={isBatchGenerating} 
                    className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-300 disabled:cursor-wait"
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
          <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-20rem)]">
            <svg className="animate-spin h-12 w-12 text-[#1FA77A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-6 text-lg font-medium text-gray-700">AI가 열심히 콘텐츠를 만들고 있습니다...</p>
          </div>
        )}
        {error && <div className="text-red-600 text-center">{error}</div>}
        {!isLoading && !error && !content && (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 min-h-[calc(100vh-20rem)]">
             <div className="text-6xl mb-6">⛳️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">TeeShot 콘텐츠 생성기</h3>
            <p className="max-w-md text-base text-gray-600 leading-relaxed">왼쪽 양식을 작성하고 '콘텐츠 생성하기'를 클릭하여<br/>골프 관련 소셜 미디어 콘텐츠를 만들어보세요.</p>
          </div>
        )}
        {!isLoading && content && (
            <div className="space-y-4">
              {renderedContent}
              {suggestions && suggestions.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">다음 콘텐츠 제안:</h4>
                    <div className="flex flex-wrap gap-3">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-full text-sm transition-all duration-200 transform hover:scale-105"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
              )}
               {sources && sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">AI가 참고한 자료</h4>
                    <ul className="list-disc list-inside space-y-2">
                        {sources.map((source, index) => (
                            <li key={index} className="text-gray-600">
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