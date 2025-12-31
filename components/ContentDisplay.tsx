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
  format?: string;
  keyword?: string;
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


export const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, suggestions, sources, isLoading, error, onSwitchToImageTab, onSuggestionClick, category, format, keyword }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [isCsvCopied, setIsCsvCopied] = useState(false);
  const [imageStatuses, setImageStatuses] = useState<Record<string, ImageStatus>>({});
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isBannerImageGenerating, setIsBannerImageGenerating] = useState(false);
  const [bannerPromptCopied, setBannerPromptCopied] = useState(false);

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

  // 유튜브 숏폼 포맷일 때 생성된 이미지 개수 계산 (s3Url 또는 url이 있으면 생성된 것으로 간주)
  const generatedImageCount = useMemo(() => {
    if (format === 'YOUTUBE-SHORTFORM') {
      return (Object.values(imageStatuses) as ImageStatus[]).filter(s => s.url || s.s3Url).length;
    }
    return generatedImageUrls.length;
  }, [imageStatuses, format, generatedImageUrls.length]);
  
  const isInstagramCardFormat = useMemo(() => {
    if (!content) return false;
    return /\[Card\s*\d+\]/.test(content);
  }, [content]);

  const isNaverBlogFormat = useMemo(() => {
    if (format === 'NAVER-BLOG/BAND') return true;
    if (!content) return false;
    return /\[섹션\s*\d+\s*제목\]/.test(content) || /✍️ 인트로/.test(content) || /✅\s*1\.\s*제목/.test(content);
  }, [content, format]);

  const isBannerFormat = useMemo(() => {
    if (format === 'ETC-BANNER') return true;
    if (!content) return false;
    return /기본 비율:|스타일:|📐 디자인 컨셉|📝 주요 텍스트 요소/.test(content);
  }, [content, format]);

  // 배너/포스터 포맷의 AI 이미지 생성 프롬프트 추출
  const bannerImagePrompt = useMemo(() => {
    if (!isBannerFormat || !content) return '';
    const lines = content.split('\n');
    let inPromptSection = false;
    let promptLines: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('🎨 AI 이미지 생성 프롬프트')) {
        inPromptSection = true;
        continue;
      }
      if (inPromptSection) {
        if (line.startsWith('💡 디자인 가이드라인') || line.startsWith('후속 제안') || line.trim() === '') {
          break;
        }
        if (line.trim() && !line.startsWith('🎨')) {
          promptLines.push(line.trim());
        }
      }
    }
    
    return promptLines.join('\n').trim();
  }, [content, isBannerFormat]);

  const showSpreadsheetButton = useMemo(() => {
    return isInstagramCardFormat || isNaverBlogFormat;
  }, [isInstagramCardFormat, isNaverBlogFormat]);

  const handleCopyAll = async () => {
    const success = await copyToClipboard(content);
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const handleCopyBannerPrompt = async () => {
    if (!bannerImagePrompt) return;
    const success = await copyToClipboard(bannerImagePrompt);
    if (success) {
      setBannerPromptCopied(true);
      setTimeout(() => setBannerPromptCopied(false), 2000);
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

  const handleGenerateBannerImage = useCallback(async () => {
    if (!bannerImagePrompt) return;
    
    setIsBannerImageGenerating(true);
    try {
      await handleGenerateSingleImage(bannerImagePrompt);
    } catch (error) {
      console.error('배너 이미지 생성 실패:', error);
    } finally {
      setIsBannerImageGenerating(false);
    }
  }, [bannerImagePrompt, handleGenerateSingleImage]);

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
  
  const handleDownloadAll = useCallback(async () => {
    // 유튜브 숏폼 포맷인 경우 webhook으로 전송 (이미지 생성 없이 내용만 전송)
    if (format === 'YOUTUBE-SHORTFORM') {
      try {
        const webhookUrl = 'https://teeshot.app.n8n.cloud/webhook-test/dc153347-2c55-4d24-8686-439c01703034';
        
        // content 파싱하여 구조화된 데이터 생성
        let title = '';
        let videoLength = '';
        const scenes: { number: number; content: string; postingText?: string; bgm?: string; tags?: string[] }[] = [];
        
        if (content) {
          const lines = content.split('\n');
          let currentScene: { number: number; content: string; postingText?: string; bgm?: string; tags?: string[] } | null = null;
          let isParsingTitle = false;
          let titleParts: string[] = [];
          let isInScene = false;
          let isParsingPostingText = false;
          let postingTextParts: string[] = [];
          let isParsingBgm = false;
          let bgmText = '';
          let isParsingTags = false;
          let tags: string[] = [];
          
          for (const line of lines) {
            // Scene 파싱 (먼저 체크하여 Scene 내부의 다른 패턴과 구분)
            const sceneMatch = line.match(/\[Scene\s*(\d+)\]|Scene\s*(\d+)[:\s]/i);
            if (sceneMatch) {
              // 제목 파싱 종료
              if (isParsingTitle) {
                title = titleParts.join(' ').trim();
                titleParts = [];
                isParsingTitle = false;
              }
              
              // 이전 Scene 저장
              if (currentScene) {
                scenes.push(currentScene);
              }
              const sceneNumber = parseInt(sceneMatch[1] || sceneMatch[2] || '0');
              currentScene = {
                number: sceneNumber,
                content: ''
              };
              isInScene = true;
              
              // Scene 제목 뒤의 내용도 포함
              const sceneContent = line.replace(/\[Scene\s*\d+\]|Scene\s*\d+[:\s]*/i, '').trim();
              if (sceneContent) {
                currentScene.content = sceneContent;
              }
              continue;
            }
            
            // 제목 파싱
            if (line.startsWith('제목:')) {
              isParsingTitle = true;
              const titleContent = line.replace(/^제목(\(.*\))?:\s*/, '').trim();
              if (titleContent) {
                titleParts.push(titleContent);
              }
            } else if (isParsingTitle) {
              // 제목이 여러 줄일 수 있음
              // Scene이나 다른 섹션이 시작되면 제목 파싱 종료
              if (line.trim() && !line.startsWith('[') && !line.startsWith('영상 길이') && !line.startsWith('Scene') && !line.match(/^Scene\s*\d+/i) && !line.startsWith('후속 제안')) {
                titleParts.push(line.trim());
              } else {
                // 제목 파싱 종료
                title = titleParts.join(' ').trim();
                titleParts = [];
                isParsingTitle = false;
              }
            }
            
            // 영상 길이 파싱
            if (line.includes('영상 길이') || line.includes('영상길이') || line.includes('video_length') || line.includes('video length') || line.match(/^\d+\s*초/) || line.match(/^\d+\s*$/)) {
              // 다양한 패턴으로 숫자 추출
              const lengthMatch = line.match(/(\d+)\s*초/) || 
                                  line.match(/video_length[:\s]*(\d+)/i) || 
                                  line.match(/video\s*length[:\s]*(\d+)/i) ||
                                  line.match(/영상\s*길이[:\s]*(\d+)/i) ||
                                  line.match(/영상길이[:\s]*(\d+)/i) ||
                                  line.match(/^(\d+)\s*$/);
              if (lengthMatch) {
                videoLength = lengthMatch[1]; // '초' 제거
              }
            }
            
            // 포스팅 글 섹션 시작
            if (line.startsWith('✍️ 포스팅 글') || line.startsWith('✍️')) {
              isParsingPostingText = true;
              isParsingBgm = false;
              isParsingTags = false;
              postingTextParts = [];
              continue;
            }
            
            // BGM 섹션 시작
            if (line.startsWith('🎵 추천 BGM:') || line.startsWith('🎵')) {
              isParsingPostingText = false;
              isParsingBgm = true;
              isParsingTags = false;
              const bgmContent = line.replace(/^🎵\s*(추천\s*BGM:?)?\s*/, '').trim();
              if (bgmContent) {
                bgmText = bgmContent;
              }
              continue;
            }
            
            // 태그 섹션 시작 (해시태그로 시작하는 줄)
            if (line.startsWith('#') && !isInScene) {
              isParsingPostingText = false;
              isParsingBgm = false;
              isParsingTags = true;
              const tagLine = line.trim();
              const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
              const newTags = extractedTags.map(tag => tag.replace('#', ''));
              tags.push(...newTags);
              // 중복 제거
              tags = [...new Set(tags)];
              continue;
            }
            
            // 포스팅 글 내용 수집
            if (isParsingPostingText) {
              if (line.trim() && !line.startsWith('🎵') && !line.startsWith('#')) {
                postingTextParts.push(line.trim());
              } else if (line.startsWith('🎵') || line.startsWith('#')) {
                isParsingPostingText = false;
                // BGM이나 태그 섹션으로 넘어감
                if (line.startsWith('🎵')) {
                  isParsingBgm = true;
                  const bgmContent = line.replace(/^🎵\s*(추천\s*BGM:?)?\s*/, '').trim();
                  if (bgmContent) {
                    bgmText = bgmContent;
                  }
                } else if (line.startsWith('#')) {
                  isParsingTags = true;
                  const tagLine = line.trim();
                  const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                  const newTags = extractedTags.map(tag => tag.replace('#', ''));
                  tags.push(...newTags);
                  // 중복 제거
                  tags = [...new Set(tags)];
                }
              }
            }
            
            // BGM 내용 수집
            if (isParsingBgm) {
              if (line.trim() && !line.startsWith('#') && !line.startsWith('후속 제안')) {
                if (bgmText) {
                  bgmText += ' ' + line.trim();
                } else {
                  bgmText = line.trim();
                }
              } else if (line.startsWith('#') || line.startsWith('후속 제안')) {
                isParsingBgm = false;
                if (line.startsWith('#')) {
                  isParsingTags = true;
                  const tagLine = line.trim();
                  const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                  const newTags = extractedTags.map(tag => tag.replace('#', ''));
                  tags.push(...newTags);
                  // 중복 제거
                  tags = [...new Set(tags)];
                }
              }
            }
            
            // 태그 수집
            if (isParsingTags) {
              if (line.startsWith('#')) {
                const tagLine = line.trim();
                const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                const newTags = extractedTags.map(tag => tag.replace('#', ''));
                tags.push(...newTags);
                // 중복 제거
                tags = [...new Set(tags)];
              } else if (line.startsWith('후속 제안') || line.trim() === '') {
                isParsingTags = false;
              }
            }
            
            // Scene 내용 수집
            if (isInScene && currentScene) {
              // 씬5의 경우 포스팅 글, BGM, 태그를 분리
              if (currentScene.number === 5) {
                // 포스팅 글 섹션 시작
                if (line.startsWith('✍️ 포스팅 글') || line.startsWith('✍️')) {
                  isParsingPostingText = true;
                  isParsingBgm = false;
                  isParsingTags = false;
                  postingTextParts = [];
                  continue;
                }
                
                // BGM 섹션 시작
                if (line.startsWith('🎵 추천 BGM:') || line.startsWith('🎵')) {
                  isParsingPostingText = false;
                  isParsingBgm = true;
                  isParsingTags = false;
                  const bgmContent = line.replace(/^🎵\s*(추천\s*BGM:?)?\s*/, '').trim();
                  if (bgmContent) {
                    bgmText = bgmContent;
                  }
                  continue;
                }
                
                // 태그 섹션 시작 (해시태그로 시작하는 줄)
                if (line.startsWith('#')) {
                  isParsingPostingText = false;
                  isParsingBgm = false;
                  isParsingTags = true;
                  const tagLine = line.trim();
                  const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                  const newTags = extractedTags.map(tag => tag.replace('#', ''));
                  tags.push(...newTags);
                  // 중복 제거
                  tags = [...new Set(tags)];
                  continue;
                }
                
                // 포스팅 글 내용 수집 (씬5 내부)
                if (isParsingPostingText) {
                  if (line.trim() && !line.startsWith('🎵') && !line.startsWith('#')) {
                    postingTextParts.push(line.trim());
                  } else if (line.startsWith('🎵') || line.startsWith('#')) {
                    isParsingPostingText = false;
                    if (line.startsWith('🎵')) {
                      isParsingBgm = true;
                      const bgmContent = line.replace(/^🎵\s*(추천\s*BGM:?)?\s*/, '').trim();
                      if (bgmContent) {
                        bgmText = bgmContent;
                      }
                    } else if (line.startsWith('#')) {
                      isParsingTags = true;
                      const tagLine = line.trim();
                      const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                      const newTags = extractedTags.map(tag => tag.replace('#', ''));
                      tags.push(...newTags);
                      // 중복 제거
                      tags = [...new Set(tags)];
                    }
                  }
                  continue;
                }
                
                // BGM 내용 수집 (씬5 내부)
                if (isParsingBgm) {
                  if (line.trim() && !line.startsWith('#') && !line.startsWith('후속 제안')) {
                    if (bgmText) {
                      bgmText += ' ' + line.trim();
                    } else {
                      bgmText = line.trim();
                    }
                  } else if (line.startsWith('#') || line.startsWith('후속 제안')) {
                    isParsingBgm = false;
                    if (line.startsWith('#')) {
                      isParsingTags = true;
                      const tagLine = line.trim();
                      const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                      const newTags = extractedTags.map(tag => tag.replace('#', ''));
                      tags.push(...newTags);
                      // 중복 제거
                      tags = [...new Set(tags)];
                    }
                  }
                  continue;
                }
                
                // 태그 수집 (씬5 내부)
                if (isParsingTags) {
                  if (line.startsWith('#')) {
                    const tagLine = line.trim();
                    const extractedTags = tagLine.match(/#[\w가-힣]+/g) || [];
                    const newTags = extractedTags.map(tag => tag.replace('#', ''));
                    tags.push(...newTags);
                    // 중복 제거
                    tags = [...new Set(tags)];
                  } else if (line.startsWith('후속 제안') || line.trim() === '') {
                    isParsingTags = false;
                  }
                  continue;
                }
              }
              
              // Scene 내용 수집 (다음 Scene이나 섹션이 시작되기 전까지)
              // 씬5의 경우 포스팅 글, BGM, 태그 관련 줄은 제외
              if (line.trim() && !line.startsWith('[') && !line.match(/^Scene\s*\d+/i) && !line.startsWith('후속 제안') && !line.startsWith('🔎') && !line.startsWith('✍️') && !line.startsWith('🎵') && !line.startsWith('#')) {
                if (currentScene.content) {
                  currentScene.content += '\n' + line.trim();
                } else {
                  currentScene.content = line.trim();
                }
              } else if (line.startsWith('[') || line.match(/^Scene\s*\d+/i) || line.startsWith('후속 제안')) {
                // 다음 Scene 시작 또는 섹션 종료
                // 씬5인 경우 포스팅 글, BGM, 태그 정보를 씬5에 저장
                if (currentScene.number === 5) {
                  const scene5PostingText = postingTextParts.join('\n').trim();
                  if (scene5PostingText) {
                    currentScene.postingText = scene5PostingText;
                  }
                  if (bgmText) {
                    currentScene.bgm = bgmText;
                  }
                  if (tags.length > 0) {
                    currentScene.tags = [...new Set(tags)];
                  }
                  // 씬5 전용 변수 초기화
                  postingTextParts = [];
                  bgmText = '';
                  tags = [];
                  isParsingPostingText = false;
                  isParsingBgm = false;
                  isParsingTags = false;
                }
                scenes.push(currentScene);
                currentScene = null;
                isInScene = false;
              }
            }
          }
          
          // 마지막 Scene 저장
          if (currentScene) {
            // 씬5인 경우 포스팅 글, BGM, 태그 정보를 씬5에 저장
            if (currentScene.number === 5) {
              const scene5PostingText = postingTextParts.join('\n').trim();
              if (scene5PostingText) {
                currentScene.postingText = scene5PostingText;
              }
              if (bgmText) {
                currentScene.bgm = bgmText;
              }
              if (tags.length > 0) {
                currentScene.tags = [...new Set(tags)];
              }
            }
            scenes.push(currentScene);
          }
          
          // 제목이 아직 파싱되지 않았으면 마지막으로 처리
          if (isParsingTitle && titleParts.length > 0) {
            title = titleParts.join(' ').trim();
          }
          
          // 씬5 이후의 씬들에 포스팅 글, BGM, 태그 정보 추가 (씬5에서 분리되지 않은 경우)
          const postingText = postingTextParts.join('\n').trim();
          scenes.forEach(scene => {
            if (scene.number > 5) {
              if (postingText && !scene.postingText) {
                scene.postingText = postingText;
              }
              if (bgmText && !scene.bgm) {
                scene.bgm = bgmText;
              }
              if (tags.length > 0 && !scene.tags) {
                scene.tags = [...new Set(tags)];
              }
            }
          });
        }
        
        const payload = {
          format: format || '',
          category: category || '',
          keyword: keyword || '',
          title: title,
          videoLength: videoLength,
          scenes: scenes,
          content: content || '', // 원본 content도 함께 전송
          timestamp: new Date().toISOString(),
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        console.log('유튜브 숏폼 콘텐츠 webhook 전송 완료', payload);
        alert('콘텐츠가 성공적으로 전송되었습니다.');
      } catch (error) {
        console.error('웹훅 전송 실패:', error);
        alert('콘텐츠 전송 중 오류가 발생했습니다.');
      }
    } else {
      // 기존 다운로드 로직 (다른 포맷)
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
    }
  }, [generatedImageUrls, imageStatuses, format, category, keyword, content]);
  
  const handleCopyToClipboardForSpreadsheet = useCallback(async () => {
    if (!content) return;

    // JSON 블록과 불필요한 메타데이터 제거
    let cleanedContent = content;
    cleanedContent = cleanedContent.replace(/```json[\s\S]*?```/g, '');
    cleanedContent = cleanedContent.replace(/^[A-D]\)\s+(INSTAGRAM-CARD|NAVER-BLOG\/BAND|YOUTUBE-SHORTFORM|ETC-BANNER):\s*/gm, '');
    cleanedContent = cleanedContent.replace(/^\{[\s\S]*?"생성요청"[\s\S]*?\}/gm, '');
    cleanedContent = cleanedContent.trim();

    interface CardData {
      subtitle: string;
      body: string;
      prompt: string;
      source: string;
    }

    interface BlogSectionData {
      title: string;
      body: string;
      prompt: string;
    }

    // 제목을 30글자 이내로 제한하고, 8~10글자마다 줄바꿈하되 자연스럽게 처리하는 함수
    const formatTitleWithLineBreaks = (text: string, maxCharsPerLine: number = 10, maxTotalChars: number = 30): string => {
      if (!text) return '';
      
      // 30글자를 초과하면 잘라내기 (공백 제외)
      let trimmedText = text.trim();
      if (trimmedText.length > maxTotalChars) {
        trimmedText = trimmedText.substring(0, maxTotalChars).trim();
      }
      
      // 줄바꿈 처리: 8~10글자마다 띄어쓰기 위치에서 줄바꿈
      const lines: string[] = [];
      let currentLine = '';
      let charCount = 0;

      for (let i = 0; i < trimmedText.length; i++) {
        const char = trimmedText[i];
        currentLine += char;
        charCount++;
        
        // 8글자 이상이고, 현재 문자가 공백이거나 다음 문자가 공백인 경우
        if (charCount >= 8 && (char === ' ' || (i < trimmedText.length - 1 && trimmedText[i + 1] === ' '))) {
          lines.push(currentLine.trim());
          currentLine = '';
          charCount = 0;
          // 다음 문자가 공백이면 스킵
          if (i < trimmedText.length - 1 && trimmedText[i + 1] === ' ') {
            i++;
          }
        }
        // 10글자를 초과하면 강제로 줄바꿈 (띄어쓰기가 없는 경우)
        else if (charCount >= maxCharsPerLine) {
          lines.push(currentLine.trim());
          currentLine = '';
          charCount = 0;
        }
        
        // 최대 3줄까지만
        if (lines.length >= 3) {
          break;
        }
      }

      // 남은 텍스트 추가
      if (currentLine.trim() && lines.length < 3) {
        lines.push(currentLine.trim());
      }

      return lines.join('\n');
    };

    let title = '';
    let coverPrompt = '';
    const cards: CardData[] = [];
    let hashtags: string[] = [];
    let postingText = '';
    let sourcesText = '';
    let keywords = '';

    const lines = cleanedContent.split('\n');
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
             if (line.startsWith('후속 제안:') || line.startsWith('🔎 참고자료') || line.startsWith('🔑 핵심키워드:') || line.startsWith('🔑')) {
                isParsingPostingText = false;
                // 키워드 추출
                if (line.startsWith('🔑 핵심키워드:') || line.startsWith('🔑')) {
                    keywords = line.replace('🔑 핵심키워드:', '').replace('🔑', '').trim();
                }
            } else {
                postingTextParts.push(line);
            }
            return;
        }
        
        // 키워드 추출 (포스팅 글 밖에서도)
        if (line.startsWith('🔑 핵심키워드:') || line.startsWith('🔑')) {
            keywords = line.replace('🔑 핵심키워드:', '').replace('🔑', '').trim();
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

    // 제목을 8~10글자 단위로 줄바꿈 처리 (최대 30자)
    const formattedTitle = formatTitleWithLineBreaks(title, 10, 30);

    // 참고자료 섹션 추출
    const sourcesMatch = content.match(/🔎 참고자료\n([\s\S]*?)(?=\n후속 제안:|$)/);
    if(sourcesMatch && sourcesMatch[1]) {
        sourcesText = sourcesMatch[1].trim();
    } else {
        sourcesText = sources.map(s => `${s.title} (${s.uri})`).join('\n');
    }

    // 요청된 컬럼 구조에 맞게 데이터 구성
    const dataRow: string[] = [
        formattedTitle,                    // 1. 타이틀
        category || '',                     // 2. 카테고리
        hashtags[0] || '',                 // 3. 키워드1
        hashtags[1] || '',                 // 4. 키워드2
        hashtags[2] || '',                 // 5. 키워드3
        getFilename(coverPrompt),          // 6. 표지 썸네일
        ''                                 // 7. 빈 컬럼
    ];

    // 카드1~10 데이터 추가 (각 카드마다: 소제목, 본문, 썸네일, 출처, 빈 컬럼)
    for (let i = 0; i < 10; i++) {
        const card = cards[i];
        if (card) {
            dataRow.push(card.subtitle);                    // 카드 소제목
            dataRow.push(card.body);                        // 카드 본문
            dataRow.push(getFilename(card.prompt));         // 카드 썸네일
            dataRow.push(card.source);                      // 카드 출처
        } else {
            // 카드가 없으면 빈 값으로 채움
            dataRow.push('', '', '', '');
        }
        
        // 각 카드 블록 뒤에 빈 컬럼 추가 (마지막 카드 제외)
        if (i < 9) {
            dataRow.push('');
        }
    }
    
    // 컨텐츠를 절반으로 나누기
    const contentLength = content.length;
    const halfLength = Math.ceil(contentLength / 2);
    const fullContent1 = content.substring(0, halfLength);
    const fullContent2 = content.substring(halfLength);
    
    // 포스팅 글, 핵심 키워드, 컨텐츠 출처, 빈 컬럼, 컨텐츠 생성 내용 전체 (절반씩 2개)
    dataRow.push(postingText);             // 포스팅 글
    dataRow.push(keywords);                // 핵심 키워드
    dataRow.push(sourcesText);             // 컨텐츠 출처
    dataRow.push('');                      // 빈 컬럼
    dataRow.push(fullContent1);            // 컨텐츠 생성 내용 전체 (첫 번째 절반)
    dataRow.push(fullContent2);            // 컨텐츠 생성 내용 전체 (두 번째 절반)

    const escapeTsvField = (field: string = '') => {
      const needsQuoting = field.includes('\t') || field.includes('\n') || field.includes('"');
      if (needsQuoting) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    
    let tsvContent = '';
    
    // 네이버 블로그 포맷용 변수 선언 (웹훅 전송에서도 사용)
    let blogTitle = '';
    let intro = '';
    let summary = '';
    let conclusion = '';
    let references = '';
    let tags = '';
    let allImageUrls: string[] = [];

    // 네이버 블로그 포맷 처리
    if (format === 'NAVER-BLOG/BAND') {
      const sections: BlogSectionData[] = [];
      
      const blogLines = cleanedContent.split('\n');
      let currentSection: BlogSectionData | null = null;
      let currentBodyParts: string[] = [];
      let isInIntro = false;
      let isInSection = false;
      let isInSummary = false;
      let isInConclusion = false;
      let isInReferences = false;
      let isInTags = false;
      let isParsingBlogTitle = false;
      let blogTitleParts: string[] = [];
      
      const pushSection = () => {
        if (currentSection) {
          currentSection.body = currentBodyParts.join('\n').trim();
          sections.push(currentSection);
          currentSection = null;
          currentBodyParts = [];
        }
      };
      
      blogLines.forEach(line => {
        // 제목 파싱 (✅ 1. 제목 형식 또는 제목: 형식)
        if (line.match(/^✅\s*1\.\s*제목/) || line.startsWith('제목:')) {
          isParsingBlogTitle = true;
          const titleContent = line.replace(/^✅\s*1\.\s*제목\s*/, '').replace(/^제목(\(.*\))?:\s*/, '').trim();
          if (titleContent) {
            blogTitleParts.push(titleContent);
          }
        } else if (isParsingBlogTitle && (line.startsWith('✔️') || line.startsWith('✍️ 인트로') || line.startsWith('📚 본문') || line.startsWith('[섹션') || line.startsWith('🔹'))) {
          isParsingBlogTitle = false;
          blogTitle = blogTitleParts.join(' ').trim();
          blogTitleParts = [];
          
          if (line.startsWith('✔️') || line.startsWith('✍️ 인트로')) {
            isInIntro = true;
            isInSection = false;
            isInSummary = false;
            isInConclusion = false;
            isInReferences = false;
          } else if (line.startsWith('[섹션') || line.startsWith('🔹')) {
            pushSection();
            const sectionTitle = line.replace(/^\[섹션\s+\d+\s+제목\]\s*/, '').replace(/^🔹\s*\d+\.\s*/, '').split('–')[0].trim();
            currentSection = { title: sectionTitle, body: '', prompt: '' };
            isInIntro = false;
            isInSection = true;
            isInSummary = false;
            isInConclusion = false;
            isInReferences = false;
          }
        } else if (isParsingBlogTitle && line.trim() && !line.startsWith('#') && !line.match(/^[✔️✅🟧🟪🔎🟫]/)) {
          blogTitleParts.push(line.trim());
        } else if (line.startsWith('✔️') || line.startsWith('✍️ 인트로')) {
          pushSection();
          isInIntro = true;
          isInSection = false;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = false;
        } else if (line.startsWith('[목차]') || (line.startsWith('📌') && line.includes('목차'))) {
          // 목차 시작 - 서론 종료
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = false;
        } else if (line.startsWith('📚 본문') || line.startsWith('🟦')) {
          // 본문 구성 시작 - 서론 종료
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = false;
        } else if (line.startsWith('[섹션') || (line.startsWith('🔹') && /^\d+\./.test(line.substring(1).trim()))) {
          // 본문 섹션 시작 - 서론 종료
          pushSection();
          const sectionTitle = line.replace(/^\[섹션\s+\d+\s+제목\]\s*/, '').replace(/^🔹\s*\d+\.\s*/, '').split('–')[0].trim();
          currentSection = { title: sectionTitle, body: '', prompt: '' };
          isInIntro = false;
          isInSection = true;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = false;
        } else if (line.startsWith('🟧') || (line.startsWith('핵심 요약') || line.includes('핵심 요약'))) {
          // 핵심 요약 시작 - 서론 종료
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = true;
          isInConclusion = false;
          isInReferences = false;
        } else if (line.startsWith('🟪') || (line.startsWith('결론') && !line.includes('참고'))) {
          // 결론 시작 - 서론 종료
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = false;
          isInConclusion = true;
          isInReferences = false;
        } else if (line.startsWith('🔎 참고자료')) {
          // 참고자료 시작 - 서론 종료
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = true;
          isInTags = false;
        } else if (line.startsWith('🟫') || (line.startsWith('태그') && line.includes('태그'))) {
          // 태그 시작 - 참고자료와 함께 수집
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = false;
          isInTags = true;
        } else if (line.startsWith('📸 이미지 프롬프트:')) {
          if (currentSection) {
            currentSection.prompt = line.replace('📸 이미지 프롬프트:', '').trim();
          }
        } else if (line.startsWith('후속 제안:')) {
          // End all parsing
          pushSection();
          isInIntro = false;
          isInSection = false;
          isInSummary = false;
          isInConclusion = false;
          isInReferences = false;
          isInTags = false;
        } else if (line.trim() && !line.match(/^[✅✔️📸📌🟦🟧🟪🔎🟫🔹]/) && !line.match(/^\[\s*목차\s*\]/i)) {
          // 서론은 다른 섹션이 시작되기 전까지만 수집
          // 목차 형식([목차] 또는 숫자로 시작하는 목차 항목)은 제외
          const isTocItem = /^\d+\.\s/.test(line.trim());
          if (isInIntro && !isInSection && !isInSummary && !isInConclusion && !isInReferences && !isTocItem) {
            const lineText = line.trim();
            // 설명 텍스트 필터링
            if (!lineText.match(/^[✔️✅]\s*(문제|해결책|핵심키워드|키워드)/) && 
                !lineText.match(/\(첫 문단\)|가장 중요한 영역|키워드 총.*회/) &&
                !lineText.match(/^[•\-\*]\s*(문제|해결책)/)) {
              intro += (intro ? '\n' : '') + lineText;
            }
          } else if (isInSection && currentSection) {
            currentBodyParts.push(line.trim());
          } else if (isInSummary) {
            summary += (summary ? '\n' : '') + line.trim();
          } else if (isInConclusion) {
            conclusion += (conclusion ? '\n' : '') + line.trim();
          } else if (isInReferences) {
            references += (references ? '\n' : '') + line.trim();
          } else if (isInTags) {
            // 태그 수집 (해시태그 포함)
            if (line.trim()) {
              tags += (tags ? '\n' : '') + line.trim();
            }
          }
        }
      });
      
      if (blogTitleParts.length > 0) {
        blogTitle = blogTitleParts.join(' ').trim();
      }
      pushSection();
      
      // 모든 이미지 프롬프트에서 S3 URL 수집 (cleanedContent에서 직접 추출)
      allImageUrls = [];
      const imagePromptLines = cleanedContent.split('\n').filter(line => line.startsWith('📸 이미지 프롬프트:'));
      
      imagePromptLines.forEach(line => {
        const prompt = line.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim();
        if (prompt) {
          const s3Url = imageStatuses[prompt]?.s3Url;
          if (s3Url) {
            allImageUrls.push(s3Url);
          }
        }
      });
      
      // 참고자료와 태그를 하나의 데이터열에 합치기
      const referencesAndTags = [references, tags].filter(Boolean).join('\n\n');
      
      // 컨텐츠를 절반으로 나누기
      const contentLength = content.length;
      const halfLength = Math.ceil(contentLength / 2);
      const fullContent1 = content.substring(0, halfLength);
      const fullContent2 = content.substring(halfLength);
      
      // [카테고리]-[제목]-[서론]-[컨텐츠내용전체1]-[컨텐츠내용전체2]-[참고자료및태그]-[핵심요약]-[결론]-[이미지1]-[이미지2]-[이미지3]...
      const blogDataRow: string[] = [
        category || '',                      // 1. 카테고리
        blogTitle,                           // 2. 제목
        intro,                               // 3. 서론
        fullContent1,                        // 4. 컨텐츠내용 전체 (첫 번째 절반)
        fullContent2,                        // 5. 컨텐츠내용 전체 (두 번째 절반)
        referencesAndTags,                   // 6. 참고자료 및 태그
        summary,                             // 7. 핵심요약
        conclusion,                          // 8. 결론
        ...allImageUrls                      // 9~N. 이미지1,2,3...
      ];
      
      tsvContent = blogDataRow.map(escapeTsvField).join('\t');
    } else {
      // 기존 인스타 카드 포맷 처리
      tsvContent = dataRow.map(escapeTsvField).join('\t');
    }

    const success = await copyToClipboard(tsvContent);
    if (success) {
      setIsCsvCopied(true);
      setTimeout(() => setIsCsvCopied(false), 2000);
    }

    // 웹훅으로 데이터 전송 - 컬럼별로 나눠서 전송
    try {
      // 포맷별로 다른 웹훅 URL 사용
      const webhookUrl = format === 'NAVER-BLOG/BAND' 
        ? 'https://teeshot.app.n8n.cloud/webhook/7fb31582-4fc2-47cd-8fbc-c14478443446'  // 네이버 블로그 포맷용 URL
        : 'https://teeshot.app.n8n.cloud/webhook/a1053b39-6daa-4553-88d3-e567e051ceda'; // 인스타그램 카드 포맷용 URL (다른 URL로 변경 필요)
      
      let tsvData: Record<string, any> = {};
      
      // 네이버 블로그 포맷 처리
      if (format === 'NAVER-BLOG/BAND') {
        // 참고자료와 태그를 하나의 데이터열에 합치기
        const referencesAndTags = [references, tags].filter(Boolean).join('\n\n');
        
        // 컨텐츠를 절반으로 나누기
        const contentLength = content.length;
        const halfLength = Math.ceil(contentLength / 2);
        const fullContent1 = content.substring(0, halfLength);
        const fullContent2 = content.substring(halfLength);
        
        // 네이버 블로그 포맷 컬럼별 데이터 구성
        tsvData = {
          category: category || '',
          title: blogTitle,
          intro: intro,
          fullContent1: fullContent1,
          fullContent2: fullContent2,
          referencesAndTags: referencesAndTags,
          summary: summary,
          conclusion: conclusion,
          images: allImageUrls
        };
      } else {
        // 인스타그램 카드 포맷 컬럼별 데이터 구성
        const cardsData: Record<string, any>[] = [];
        for (let i = 0; i < 10; i++) {
          const card = cards[i];
          if (card) {
            cardsData.push({
              subtitle: card.subtitle,
              body: card.body,
              thumbnail: getFilename(card.prompt),
              source: card.source
            });
          } else {
            cardsData.push({
              subtitle: '',
              body: '',
              thumbnail: '',
              source: ''
            });
          }
        }
        
        // 컨텐츠를 절반으로 나누기
        const contentLength = content.length;
        const halfLength = Math.ceil(contentLength / 2);
        const fullContent1 = content.substring(0, halfLength);
        const fullContent2 = content.substring(halfLength);
        
        tsvData = {
          title: formattedTitle,
          category: category || '',
          keyword1: hashtags[0] || '',
          keyword2: hashtags[1] || '',
          keyword3: hashtags[2] || '',
          coverThumbnail: getFilename(coverPrompt),
          cards: cardsData,
          postingText: postingText,
          coreKeywords: keywords,
          contentSources: sourcesText,
          fullContent1: fullContent1,
          fullContent2: fullContent2
        };
      }
      
      // YYYYMMDDHHMM 형식의 ID 생성
      const generateId = (): string => {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        return `${year}${month}${day}${hours}${minutes}`;
      };

      const payload = {
        ...tsvData,
        id: generateId(),
        format: format || '',
        keyword: keyword || '',
        timestamp: new Date().toISOString(),
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('웹훅 전송 실패:', error);
      // 웹훅 전송 실패해도 사용자에게는 알리지 않음 (복사 기능은 정상 동작)
    }
}, [content, imageStatuses, category, sources, format, keyword]);


  const renderedContent = useMemo(() => {
    if (!content) return null;
  
    // JSON 블록과 불필요한 메타데이터 제거
    let cleanedContent = content;
    
    // 1. JSON 코드블록 제거 (```json ... ```)
    cleanedContent = cleanedContent.replace(/```json[\s\S]*?```/g, '');
    
    // 2. 포맷 레이블 제거 (A) INSTAGRAM-CARD:, B) NAVER-BLOG: 등)
    cleanedContent = cleanedContent.replace(/^[A-D]\)\s+(INSTAGRAM-CARD|NAVER-BLOG\/BAND|YOUTUBE-SHORTFORM|ETC-BANNER):\s*/gm, '');
    
    // 3. 단독으로 나타나는 JSON 객체 제거
    cleanedContent = cleanedContent.replace(/^\{[\s\S]*?"생성요청"[\s\S]*?\}/gm, '');
    
    // 4. 앞뒤 공백 정리
    cleanedContent = cleanedContent.trim();
    
    const lines = cleanedContent.split('\n');
    const elements: React.ReactNode[] = [];
    let currentCard: React.ReactNode[] = [];
    let inCard = false;
    let inPostingSection = false;
    let postingContent: React.ReactNode[] = [];
    let inTitle = false;
    let titleLines: string[] = [];
    let titleStartIndex = 0;
    let inSummarySection = false;
    let inConclusionSection = false;
    
    // 네이버 블로그 포맷 섹션별 내용 수집
    let inIntroSection = false;
    let introContent: React.ReactNode[] = [];
    let inTocSection = false;
    let tocContent: React.ReactNode[] = [];
    let inBodySection = false;
    let bodyContent: React.ReactNode[] = [];
    let currentSectionTitle = '';
    let currentSectionContent: React.ReactNode[] = [];
    let summaryContent: React.ReactNode[] = [];
    let conclusionContent: React.ReactNode[] = [];
    let inReferencesSection = false;
    let referencesContent: React.ReactNode[] = [];
    let inTagsSection = false;
    let tagsContent: React.ReactNode[] = [];

    // 배너/포스터 포맷 섹션별 내용 수집
    let inBannerTitle = false;
    let bannerTitleContent: string[] = [];
    let inBannerAspectRatio = false;
    let bannerAspectRatioContent: string[] = [];
    let inBannerStyle = false;
    let bannerStyleContent: string[] = [];
    let inBannerDesignConcept = false;
    let bannerDesignConceptContent: React.ReactNode[] = [];
    let inBannerTextElements = false;
    let bannerTextElementsContent: React.ReactNode[] = [];
    let inBannerImagePrompt = false;
    let bannerImagePromptContent: React.ReactNode[] = [];
    let inBannerGuidelines = false;
    let bannerGuidelinesContent: React.ReactNode[] = [];

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
        
        // 네이버 블로그 포맷이고 키워드가 있으면 키워드를 강조
        let titleElement;
        if (isNaverBlogFormat && keyword) {
          // 키워드를 찾아서 강조 표시
          const keywordRegex = new RegExp(`(${keyword})`, 'gi');
          const parts = titleContent.split(keywordRegex);
          
          titleElement = (
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight whitespace-pre-wrap">
              {parts.map((part, index) => 
                part.toLowerCase() === keyword.toLowerCase() ? (
                  <span key={index} className="text-[#1FA77A]">{part}</span>
                ) : (
                  <React.Fragment key={index}>{part}</React.Fragment>
                )
              )}
            </h2>
          );
        } else {
          titleElement = (
            <h2 className="text-3xl font-extrabold text-gray-900 leading-tight whitespace-pre-wrap">{titleContent}</h2>
          );
        }
        
        // 네이버 블로그 포맷인 경우 제목 스타일 강화
        if (isNaverBlogFormat) {
          // 키워드 강조 처리
          let titleDisplay;
          if (keyword) {
            const keywordRegex = new RegExp(`(${keyword})`, 'gi');
            const parts = titleContent.split(keywordRegex);
            titleDisplay = (
              <h1 className="text-5xl font-black text-gray-900 leading-tight mb-0">
                {parts.map((part, index) => 
                  part.toLowerCase() === keyword.toLowerCase() ? (
                    <span key={index} className="text-[#1FA77A]">{part}</span>
                  ) : (
                    <React.Fragment key={index}>{part}</React.Fragment>
                  )
                )}
              </h1>
            );
          } else {
            titleDisplay = <h1 className="text-5xl font-black text-gray-900 leading-tight mb-0">{titleContent}</h1>;
          }
          elements.push(
            <div key={`title-${titleStartIndex}`} className="mb-12 mt-8">
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-500">제목</span>
              </div>
              {titleDisplay}
            </div>
          );
        } else {
          elements.push(
            <div key={`title-${titleStartIndex}`} className="mb-3 mt-4">
              <span className="text-sm font-medium text-gray-500">제목</span>
              {titleElement}
            </div>
          );
        }
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

    // 네이버 블로그 포맷 섹션별 처리
    const pushIntroSection = () => {
      if (inIntroSection && introContent.length > 0) {
        // 서론 라벨과 내용 표시
        elements.push(
          <div key={`intro-content-${elements.length}`} className="mb-16 mt-12">
            <div className="mb-3">
              <span className="text-sm font-medium text-gray-500">서론</span>
            </div>
            <div className="space-y-5 text-base text-gray-700 leading-relaxed">
              {introContent}
            </div>
          </div>
        );
        introContent = [];
        inIntroSection = false;
      }
    };

    const pushTocSection = () => {
      // 네이버 블로그 포맷에서는 소제목 나열(목차)만 표시하지 않음
      // 본문 구성 섹션의 실제 내용은 그대로 표시됨
      if (inTocSection) {
        if (tocContent.length > 0 && !isNaverBlogFormat) {
          // 다른 포맷에서는 목차 표시
          elements.push(
            <div key={`toc-section-${elements.length}`} className="mt-16 mb-0 pt-8 border-t-2 border-gray-300 pb-8 border-b-2 border-gray-300">
              <h3 className="text-base font-normal text-gray-500 mb-5 uppercase tracking-wide">본문</h3>
              <div className="text-base text-gray-600 space-y-2">
                {tocContent}
              </div>
            </div>
          );
        }
        // 네이버 블로그 포맷이면 목차 내용만 초기화하고 표시하지 않음
        tocContent = [];
        inTocSection = false;
      }
    };


    const pushCurrentSection = () => {
      if (currentSectionTitle && currentSectionContent.length > 0) {
        // 본문 구성 섹션의 첫 번째 섹션인지 확인
        const isFirstSection = !elements.some(el => 
          React.isValidElement(el) && 
          el.key && 
          String(el.key).startsWith('section-')
        );
        
        // 다음에 핵심 요약이 올지 확인 (마지막 섹션인지)
        // 이건 나중에 핵심 요약이 push될 때 확인하므로 여기서는 일반적으로 처리
        
        elements.push(
          <div key={`section-${elements.length}`} className={isFirstSection ? "mt-6 mb-24" : "mt-24 mb-24 pt-10 border-t-2 border-gray-300"}>
            <h3 className="text-xl font-semibold text-gray-800 mb-6">{currentSectionTitle}</h3>
            <div className="space-y-5 text-base text-gray-700 leading-relaxed">
              {currentSectionContent}
            </div>
          </div>
        );
        currentSectionTitle = '';
        currentSectionContent = [];
      }
    };

    const pushSummarySection = () => {
      if (inSummarySection && summaryContent.length > 0) {
        // 본문 구성 섹션이 있는지 확인
        const hasBodySection = elements.some(el => 
          React.isValidElement(el) && 
          el.key && 
          String(el.key).startsWith('section-')
        );
        
        // 본문 구성 섹션이 있으면 상단 구분선 제거 (본문 구성의 마지막 섹션에 하단 구분선이 있음)
        // 본문 구성 섹션이 없으면 구분선 포함
        elements.push(
          <div key={`summary-section-${elements.length}`} className={`${hasBodySection ? 'mt-16 mb-6 pt-8' : 'mt-16 mb-6 pt-8 border-t-2 border-gray-300'}`}>
            <h3 className="text-base font-normal text-gray-500 mb-5 uppercase tracking-wide">핵심 요약</h3>
            <div className="text-base text-gray-700 space-y-3">
              {summaryContent}
            </div>
          </div>
        );
        summaryContent = [];
        inSummarySection = false;
      }
    };

    const pushConclusionSection = () => {
      if (inConclusionSection && conclusionContent.length > 0) {
        elements.push(
          <div key={`conclusion-section-${elements.length}`} className="mt-16 mb-6 pt-8 border-t-2 border-gray-300">
            <h3 className="text-base font-normal text-gray-500 mb-5 uppercase tracking-wide">결론</h3>
            <div className="text-base text-gray-700 space-y-3">
              {conclusionContent}
            </div>
          </div>
        );
        conclusionContent = [];
        inConclusionSection = false;
      }
    };

    const pushReferencesSection = () => {
      if (inReferencesSection || (isNaverBlogFormat && referencesContent.length > 0)) {
        const hasContent = referencesContent.length > 0;
        const hasSources = isNaverBlogFormat && sources && sources.length > 0;
        
        if (hasContent || hasSources) {
          elements.push(
            <div key={`references-section-${elements.length}`} className="mt-16 mb-6 pt-8 border-t-2 border-gray-300">
              <h4 className="text-base font-normal text-gray-500 mb-5 uppercase tracking-wide">참고자료</h4>
              <div className="text-sm text-gray-600 space-y-3">
                {hasContent && referencesContent}
                {hasSources && (
                  <ul className="list-none space-y-2">
                    {sources.map((source, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-[#1FA77A] mr-2">•</span>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-500 hover:underline break-all"
                          title={source.uri}
                        >
                          {source.title || source.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        }
        referencesContent = [];
        inReferencesSection = false;
      }
    };

    const pushTagsSection = () => {
      if (inTagsSection && tagsContent.length > 0) {
        elements.push(
          <div key={`tags-section-${elements.length}`} className="mt-16 mb-4 pt-8 border-t-2 border-gray-300">
            <h4 className="text-base font-normal text-gray-500 mb-4 uppercase tracking-wide">키워드</h4>
            <div className="text-sm">
              {tagsContent}
            </div>
          </div>
        );
        tagsContent = [];
        inTagsSection = false;
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
      if (inPostingSection && (line.startsWith('후속 제안') || line.startsWith('🔎 참고자료') || line.startsWith('🔎 참고') || line.startsWith('🔑 핵심키워드') || line.startsWith('🔑'))) {
        pushPostingSection();
        inPostingSection = false;
        if (line.startsWith('후속 제안')) {
          return;
        }
      }
      
      // 핵심키워드 처리
      if (line.startsWith('🔑 핵심키워드:') || line.startsWith('🔑')) {
        pushCard();
        pushPostingSection();
        inCard = false;
        inPostingSection = false;
        elements.push(
          <div key={key} className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="font-bold text-gray-800">{line}</p>
          </div>
        );
        return;
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
      
      // 배너/포스터 포맷 처리
      if (isBannerFormat) {
        if (line.match(/^제목(\(.*\))?:/)) {
          pushCard();
          pushTitle();
          inCard = false;
          inBannerTitle = true;
          bannerTitleContent = [];
          const titleContent = line.replace(/^제목(\(.*\))?:\s*/, '').trim();
          if (titleContent) {
            bannerTitleContent.push(titleContent);
          }
        } else if (inBannerTitle && line.trim() && !line.startsWith('기본 비율:') && !line.startsWith('스타일:') && !line.startsWith('📐') && !line.startsWith('📝') && !line.startsWith('🎨') && !line.startsWith('💡')) {
          bannerTitleContent.push(line.trim());
        } else if (line.startsWith('기본 비율:')) {
          inBannerTitle = false;
          inBannerAspectRatio = true;
          bannerAspectRatioContent = [];
          const ratioContent = line.replace(/^기본 비율:\s*/, '').trim();
          if (ratioContent) {
            bannerAspectRatioContent.push(ratioContent);
          }
        } else if (inBannerAspectRatio && line.trim() && !line.startsWith('스타일:') && !line.startsWith('📐') && !line.startsWith('📝') && !line.startsWith('🎨') && !line.startsWith('💡')) {
          bannerAspectRatioContent.push(line.trim());
        } else if (line.startsWith('스타일:')) {
          inBannerAspectRatio = false;
          inBannerStyle = true;
          bannerStyleContent = [];
          const styleContent = line.replace(/^스타일:\s*/, '').trim();
          if (styleContent) {
            bannerStyleContent.push(styleContent);
          }
        } else if (inBannerStyle && line.trim() && !line.startsWith('📐') && !line.startsWith('📝') && !line.startsWith('🎨') && !line.startsWith('💡')) {
          bannerStyleContent.push(line.trim());
        } else if (line.startsWith('📐 디자인 컨셉')) {
          inBannerTitle = false;
          inBannerAspectRatio = false;
          inBannerStyle = false;
          inBannerDesignConcept = true;
          bannerDesignConceptContent = [];
        } else if (line.startsWith('📝 주요 텍스트 요소')) {
          inBannerDesignConcept = false;
          inBannerTextElements = true;
          bannerTextElementsContent = [];
        } else if (line.startsWith('🎨 AI 이미지 생성 프롬프트')) {
          inBannerTextElements = false;
          inBannerImagePrompt = true;
          bannerImagePromptContent = [];
        } else if (line.startsWith('💡 디자인 가이드라인')) {
          inBannerImagePrompt = false;
          inBannerGuidelines = true;
          bannerGuidelinesContent = [];
        } else if (line.startsWith('후속 제안')) {
          inBannerGuidelines = false;
          return;
        } else if (inBannerTitle && bannerTitleContent.length > 0) {
          // 배너 제목 렌더링
          elements.push(
            <div key="banner-title" className="mb-8 mt-4">
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">헤드라인</span>
              </div>
              <h1 className="text-4xl font-black text-gray-900 leading-tight">{bannerTitleContent.join(' ')}</h1>
            </div>
          );
          bannerTitleContent = [];
          inBannerTitle = false;
        } else if (inBannerAspectRatio && bannerAspectRatioContent.length > 0) {
          // 기본 비율 렌더링
          elements.push(
            <div key="banner-aspect-ratio" className="mb-6">
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">기본 비율</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">{bannerAspectRatioContent.join(' ')}</p>
            </div>
          );
          bannerAspectRatioContent = [];
          inBannerAspectRatio = false;
        } else if (inBannerStyle && bannerStyleContent.length > 0) {
          // 스타일 렌더링
          elements.push(
            <div key="banner-style" className="mb-8">
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">스타일</span>
              </div>
              <p className="text-lg font-semibold text-gray-800">{bannerStyleContent.join(' ')}</p>
            </div>
          );
          bannerStyleContent = [];
          inBannerStyle = false;
        } else if (inBannerDesignConcept && line.trim() && !line.startsWith('📐')) {
          const isListItem = /^[-•]\s/.test(line.trim());
          const textElement = isListItem ? (
            <li key={key} className="text-base text-gray-700 mb-2 ml-4">{line.trim().replace(/^[-•]\s/, '')}</li>
          ) : (
            <p key={key} className="text-base text-gray-700 mb-3 leading-relaxed">{line.trim()}</p>
          );
          bannerDesignConceptContent.push(textElement);
        } else if (inBannerTextElements && line.trim() && !line.startsWith('📝')) {
          // 헤드라인, 서브헤드라인, CTA 파싱
          if (line.match(/^[-•]\s*헤드라인:/)) {
            const headlineText = line.replace(/^[-•]\s*헤드라인:\s*/, '').trim();
            bannerTextElementsContent.push(
              <div key="banner-headline" className="mb-4">
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">헤드라인</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{headlineText}</p>
              </div>
            );
          } else if (line.match(/^[-•]\s*서브헤드라인:/)) {
            const subheadlineText = line.replace(/^[-•]\s*서브헤드라인:\s*/, '').trim();
            bannerTextElementsContent.push(
              <div key="banner-subheadline" className="mb-4">
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">서브헤드라인</span>
                </div>
                <p className="text-xl font-semibold text-gray-800">{subheadlineText}</p>
              </div>
            );
          } else if (line.match(/^[-•]\s*바디카피:/)) {
            const bodyCopyText = line.replace(/^[-•]\s*바디카피:\s*/, '').trim();
            bannerTextElementsContent.push(
              <div key="banner-bodycopy" className="mb-4">
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">바디카피</span>
                </div>
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{bodyCopyText}</p>
              </div>
            );
          } else if (line.match(/^[-•]\s*CTA 문구:/)) {
            const ctaText = line.replace(/^[-•]\s*CTA 문구:\s*/, '').trim();
            bannerTextElementsContent.push(
              <div key="banner-cta" className="mb-4">
                <div className="mb-1">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">CTA</span>
                </div>
                <p className="text-lg font-semibold text-[#1FA77A]">{ctaText}</p>
              </div>
            );
          } else if (line.trim()) {
            const isListItem = /^[-•]\s/.test(line.trim());
            const textElement = isListItem ? (
              <li key={key} className="text-base text-gray-700 mb-2 ml-4">{line.trim().replace(/^[-•]\s/, '')}</li>
            ) : (
              <p key={key} className="text-base text-gray-700 mb-3 leading-relaxed">{line.trim()}</p>
            );
            bannerTextElementsContent.push(textElement);
          }
        } else if (inBannerImagePrompt && line.trim() && !line.startsWith('🎨')) {
          const textElement = <p key={key} className="text-base text-gray-700 mb-3 leading-relaxed font-mono bg-gray-50 p-3 rounded border border-gray-200">{line.trim()}</p>;
          bannerImagePromptContent.push(textElement);
        } else if (inBannerGuidelines && line.trim() && !line.startsWith('💡')) {
          const isListItem = /^[-•]\s/.test(line.trim());
          const textElement = isListItem ? (
            <li key={key} className="text-base text-gray-700 mb-2 ml-4">{line.trim().replace(/^[-•]\s/, '')}</li>
          ) : (
            <p key={key} className="text-base text-gray-700 mb-3 leading-relaxed">{line.trim()}</p>
          );
          bannerGuidelinesContent.push(textElement);
        }
        return; // 배너 포맷 처리 후 다른 로직 실행하지 않음
      }

      if (line.match(/^제목(\(.*\))?:/) || (isNaverBlogFormat && line.match(/^✅\s*1\.\s*제목/))) {
        pushCard();
        pushTitle();
        inCard = false;
        inTitle = true;
        titleStartIndex = index;
        if (isNaverBlogFormat && line.match(/^✅\s*1\.\s*제목/)) {
          // 네이버 블로그 포맷: "✅ 1. 제목" 다음 줄부터 제목 내용
          // 이 줄은 제목 내용이 아니므로 titleLines에 추가하지 않음
        } else {
          const titleContent = line.replace(/^제목(\(.*\))?:\s*/, '').trim();
          if (titleContent) {
            titleLines.push(titleContent);
          }
        }
      } else if (inTitle && isNaverBlogFormat && line.trim() && !line.startsWith('✔️') && !line.startsWith('📸') && !line.startsWith('📌') && !line.startsWith('🟦') && !line.startsWith('✍️') && !line.match(/^\[.*\]$/) && !line.startsWith('예:')) {
        // 네이버 블로그 포맷: "✅ 1. 제목" 다음 줄이 실제 제목 내용
        titleLines.push(line.trim());
      } else if (inTitle && (line.startsWith('✔️') || line.startsWith('✍️') || line.startsWith('📸 대표') || line.startsWith('📌') || line.startsWith('🟦'))) {
        // 네이버 블로그 포맷: 제목 파싱 종료
        pushTitle();
        inTitle = false;
        // 현재 줄 처리 계속
        if (line.startsWith('✍️ 인트로')) {
          pushCard();
          pushIntroSection();
          pushSummarySection();
          pushTocSection();
          pushCurrentSection();
          inCard = false;
          inIntroSection = true;
          introContent = [];
        } else if (line.startsWith('📸 대표 이미지') || (line.startsWith('📸') && line.includes('대표'))) {
          pushCard();
          inCard = false;
          elements.push(
            <div key={key} className="mt-12 mb-12 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
              <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">📸</span>
                대표 이미지
              </h3>
            </div>
          );
        } else if (line.startsWith('[목차]') || (line.startsWith('📌') && line.includes('목차'))) {
          pushCard();
          pushIntroSection();
          pushSummarySection();
          pushTocSection();
          pushCurrentSection();
          inCard = false;
          inTocSection = true;
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
        const prompt = line.replace('📸 이미지 프롬프트:', '').replace('(표지용)', '').trim();
        const status = imageStatuses[prompt] || { url: null, s3Url: null, isLoading: false, error: null };
        
        // 네이버 블로그 포맷이고 현재 섹션이 있으면 섹션 내용에 이미지 프롬프트 추가
        if (isNaverBlogFormat && currentSectionTitle) {
          currentSectionContent.push(
            <ImagePrompt 
              key={`${key}-${prompt}`}
              text={prompt} 
              onGenerate={handleGenerateSingleImage} 
              onSwitchToImageTab={onSwitchToImageTab} 
              status={status} 
            />
          );
        } else {
          pushTitle();
          (inCard ? currentCard : elements).push(
            <ImagePrompt 
              key={`${key}-${prompt}`}
              text={prompt} 
              onGenerate={handleGenerateSingleImage} 
              onSwitchToImageTab={onSwitchToImageTab} 
              status={status} 
            />
          );
        }
      } else if (line.startsWith('#')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(<p key={key} className="text-[#1FA77A] mt-4">{line}</p>);
      } else if (line.startsWith('후속 제안')) {
          pushTitle();
          return;
      } else if (line.startsWith('[목차]') || (line.startsWith('📌') && line.includes('목차'))) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        inCard = false;
        inTocSection = true;
      } else if (line.startsWith('[섹션') || (line.startsWith('🔹') && /^\d+\./.test(line.substring(1).trim()))) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        inCard = false;
        inTocSection = false; // 섹션이 시작되면 목차 섹션 종료
        inIntroSection = false; // 섹션이 시작되면 서론 섹션 종료
        
        // 목차 다음에 본문 구성 헤더 추가 (첫 번째 섹션 시작 전)
        const hasBodyHeader = elements.some(el => 
          React.isValidElement(el) && 
          el.key && 
          String(el.key) === 'body-section-header'
        );
        if (!hasBodyHeader && isNaverBlogFormat) {
          // 목차 섹션이 표시되었는지 확인 (네이버 블로그에서는 목차 내용만 숨김)
          const hasTocSection = elements.some(el => 
            React.isValidElement(el) && 
            el.key && 
            String(el.key).includes('toc-section')
          );
          elements.push(
            <div key="body-section-header" className={`${hasTocSection ? 'mt-0' : 'mt-16'} mb-6 pt-8 border-t-2 border-gray-300`}>
              <h3 className="text-base font-normal text-gray-500 mb-5 uppercase tracking-wide">본문 구성</h3>
            </div>
          );
        }
        
        let sectionTitle = '';
        if (line.startsWith('[섹션')) {
          sectionTitle = line.replace(/\[|\]/g, '').replace(/섹션\s+\d+\s+제목/, '').trim();
        } else if (line.startsWith('🔹')) {
          // 🔹 1. {소제목1 – 사용자의 문제 정의/원인 분석} 형식 파싱
          sectionTitle = line.replace(/^🔹\s*\d+\.\s*/, '').split('–')[0].trim();
        }
        currentSectionTitle = sectionTitle;
        currentSectionContent = [];
      } else if (line.startsWith('✍️ 인트로')) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        inCard = false;
        inIntroSection = true;
        introContent = [];
        // 서론 헤더 제거: 본문과 동일한 스타일로 표시
      } else if (line.startsWith('📸 대표 이미지') || (line.startsWith('📸') && line.includes('대표'))) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(
          <div key={key} className="mt-12 mb-12 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-2 flex items-center">
              <span className="mr-2">📸</span>
              대표 이미지
            </h3>
          </div>
        );
      } else if (line.startsWith('📚 본문') || line.startsWith('🟦')) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        inCard = false;
        inTocSection = false;
        inIntroSection = false;
        // 본문 구성 헤더는 표시하지 않음 (섹션 제목으로 대체)
      } else if (line.startsWith('🟧') || (line.startsWith('핵심 요약') || line.includes('핵심 요약'))) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection(); // 본문 구성 섹션들을 먼저 push
        inCard = false;
        inSummarySection = true;
        inConclusionSection = false;
        summaryContent = [];
      } else if (line.startsWith('🟪') || (line.startsWith('결론') && !line.includes('참고'))) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        pushConclusionSection();
        inCard = false;
        inSummarySection = false;
        inConclusionSection = true;
        conclusionContent = [];
      } else if (line.startsWith('✅')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(
          <div key={key} className="mt-8 mb-6 p-5 bg-green-50 rounded-lg border-l-4 border-green-400 shadow-sm">
            <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center">
              <span className="mr-2">✅</span>
              {line.replace('✅', '').trim() || '마무리'}
            </h3>
          </div>
        );
      } else if (line.startsWith('🔎 참고자료')) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        pushConclusionSection();
        pushTagsSection();
        inCard = false;
        inSummarySection = false;
        inConclusionSection = false;
        inReferencesSection = true;
        referencesContent = [];
      } else if (line.startsWith('🟫') || (line.startsWith('태그') && line.includes('태그'))) {
        pushTitle();
        pushCard();
        pushIntroSection();
        pushSummarySection();
        pushTocSection();
        pushCurrentSection();
        pushConclusionSection();
        pushReferencesSection();
        inCard = false;
        inTagsSection = true;
        tagsContent = [];
      } else if (line.startsWith('🎬')) {
        pushTitle();
        pushCard();
        inCard = false;
        elements.push(<h3 key={key} className="text-xl font-semibold text-[#1FA77A] mt-6 mb-2">{line}</h3>);
      } else if (line.trim()) {
        if (inTitle) {
          // 제목이 여러 줄로 계속되는 경우
          titleLines.push(line.trim());
        } else if (inSummarySection) {
          // 핵심 요약 섹션 내용 수집
          const isListItem = /^[•\-\-]\s/.test(line.trim());
          if (isListItem) {
            summaryContent.push(
              <div key={key} className="mb-3">
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{line.trim()}</p>
              </div>
            );
          } else {
            summaryContent.push(
              <p key={key} className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{line.trim()}</p>
            );
          }
        } else if (inConclusionSection) {
          // 결론 섹션 내용 수집
          conclusionContent.push(
            <p key={key} className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{line.trim()}</p>
          );
        } else {
          // 네이버 블로그 포맷 섹션별 내용 수집
          if (isNaverBlogFormat) {
            // 현재 섹션이 있으면 섹션 내용에 우선 추가 (다른 조건보다 우선)
            if (currentSectionTitle) {
              const isListItem = /^[•\-\*]\s/.test(line.trim());
              const textElement = isListItem ? (
                <div key={key} className="mb-2 ml-4 pl-4 border-l-2 border-[#1FA77A]/30 py-1">
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{line.trim()}</p>
                </div>
              ) : (
                <p key={key} className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{line.trim()}</p>
              );
              currentSectionContent.push(textElement);
            } else if (inIntroSection) {
              // 설명 텍스트 필터링: "(첫 문단)", "가장 중요한 영역", "키워드 총" 등의 설명 제거
              const lineText = line.trim();
              const isListItem = /^[•\-\*]\s/.test(lineText);
              const textElement = isListItem ? (
                <div key={key} className="mb-2 ml-4 pl-4 border-l-2 border-[#1FA77A]/30 py-1">
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{lineText}</p>
                </div>
              ) : (
                <p key={key} className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{lineText}</p>
              );
              if (!lineText.match(/^[✔️✅]\s*(문제|해결책|핵심키워드|키워드)/) && 
                  !lineText.match(/\(첫 문단\)|가장 중요한 영역|키워드 총.*회/) &&
                  !lineText.match(/^[•\-\*]\s*(문제|해결책)/)) {
                introContent.push(textElement);
              }
            } else if (inTocSection) {
              // 목차 섹션
              const isListItem = /^[•\-\*]\s/.test(line.trim());
              const textElement = isListItem ? (
                <div key={key} className="mb-2 ml-4 pl-4 border-l-2 border-[#1FA77A]/30 py-1">
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{line.trim()}</p>
                </div>
              ) : (
                <p key={key} className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed mb-3">{line.trim()}</p>
              );
              tocContent.push(textElement);
            } else if (inReferencesSection) {
              referencesContent.push(<p key={key} className="text-sm text-gray-600 mb-2">{line.trim()}</p>);
            } else if (inTagsSection) {
              if (line.startsWith('#')) {
                tagsContent.push(<span key={key} className="text-[#1FA77A] font-medium mr-2">{line}</span>);
              } else {
                tagsContent.push(<p key={key} className="text-[#1FA77A] font-medium">{line.trim()}</p>);
              }
            } else {
              // 일반 본문 텍스트
              const paragraphClass = inCard 
                ? "text-gray-700 whitespace-pre-wrap leading-relaxed mb-3"
                : "text-base text-gray-700 whitespace-pre-wrap leading-relaxed mb-4 pl-2 border-l-2 border-gray-200 py-1";
              (inCard ? currentCard : elements).push(<p key={key} className={paragraphClass}>{line}</p>);
            }
          } else {
            // 일반 포맷 처리
            const isListItem = /^[•\-\*]\s/.test(line.trim());
            
            if (isListItem) {
              (inCard ? currentCard : elements).push(
                <div key={key} className="mb-2 ml-4 pl-4 border-l-2 border-[#1FA77A]/30 py-1">
                  <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{line.trim()}</p>
                </div>
              );
            } else {
              const paragraphClass = inCard 
                ? "text-gray-700 whitespace-pre-wrap leading-relaxed mb-3"
                : "text-base text-gray-700 whitespace-pre-wrap leading-loose mb-4 pl-1";
              (inCard ? currentCard : elements).push(<p key={key} className={paragraphClass}>{line}</p>);
            }
          }
        }
      }
    });

    // 배너/포스터 포맷 섹션 push
    if (isBannerFormat) {
      if (bannerTitleContent.length > 0) {
        elements.push(
          <div key="banner-title-final" className="mb-8 mt-4">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">헤드라인</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight">{bannerTitleContent.join(' ')}</h1>
          </div>
        );
      }
      if (bannerAspectRatioContent.length > 0) {
        elements.push(
          <div key="banner-aspect-ratio-final" className="mb-6">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">기본 비율</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">{bannerAspectRatioContent.join(' ')}</p>
          </div>
        );
      }
      if (bannerStyleContent.length > 0) {
        elements.push(
          <div key="banner-style-final" className="mb-8">
            <div className="mb-2">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">스타일</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">{bannerStyleContent.join(' ')}</p>
          </div>
        );
      }
      if (bannerDesignConceptContent.length > 0) {
        elements.push(
          <div key="banner-design-concept" className="mb-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📐</span>
              디자인 컨셉
            </h3>
            <div className="space-y-3">
              {bannerDesignConceptContent}
            </div>
          </div>
        );
      }
      if (bannerTextElementsContent.length > 0) {
        elements.push(
          <div key="banner-text-elements" className="mb-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📝</span>
              주요 텍스트 요소
            </h3>
            <div className="space-y-4">
              {bannerTextElementsContent}
            </div>
          </div>
        );
      }
      if (bannerImagePromptContent.length > 0) {
        const bannerImageStatus = bannerImagePrompt ? (imageStatuses[bannerImagePrompt] || { url: null, s3Url: null, isLoading: false, error: null }) : null;
        elements.push(
          <div key="banner-image-prompt" className="mb-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🎨</span>
              AI 이미지 생성 프롬프트 (구글 나노바나나 등)
            </h3>
            <div className="space-y-3">
              {bannerImagePromptContent}
              {bannerImagePrompt && bannerImageStatus && (
                <div className="mt-4">
                  <ImagePrompt 
                    text={bannerImagePrompt} 
                    onGenerate={handleGenerateSingleImage} 
                    onSwitchToImageTab={onSwitchToImageTab} 
                    status={bannerImageStatus} 
                  />
                </div>
              )}
            </div>
          </div>
        );
      }
      if (bannerGuidelinesContent.length > 0) {
        elements.push(
          <div key="banner-guidelines" className="mb-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              디자인 가이드라인
            </h3>
            <div className="space-y-3">
              {bannerGuidelinesContent}
            </div>
          </div>
        );
      }
      return elements;
    }

    // 배너 포맷이 아닐 때만 기존 로직 실행
    pushTitle();
    pushCard();
    pushPostingSection();
    pushIntroSection();
    pushTocSection();
    pushCurrentSection(); // 본문 구성 섹션들을 먼저 push
    
    // 본문 구성의 마지막 섹션에 하단 구분선 추가 (핵심 요약과 구분)
    if (isNaverBlogFormat) {
      let lastSectionIndex = -1;
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (React.isValidElement(el) && el.key && String(el.key).startsWith('section-')) {
          lastSectionIndex = i;
          break;
        }
      }
      if (lastSectionIndex !== -1) {
        const lastSection = elements[lastSectionIndex];
        if (React.isValidElement(lastSection)) {
          const currentClassName = lastSection.props.className || '';
          // mb-24를 mb-0으로 변경하고 하단 구분선 추가
          const newClassName = currentClassName.replace('mb-24', 'mb-0 pb-8 border-b-2 border-gray-300');
          elements[lastSectionIndex] = React.cloneElement(lastSection, { className: newClassName });
        }
      }
    }
    
    pushSummarySection(); // 이제 핵심 요약 push (상단 구분선 없이)
    pushConclusionSection();
    pushReferencesSection();
    pushTagsSection();
    
    // 네이버 블로그 포맷일 때 sources가 있고 참고자료 섹션이 없으면 추가
    if (isNaverBlogFormat && sources && sources.length > 0) {
      const hasReferencesSection = elements.some(el => 
        React.isValidElement(el) && 
        el.key && 
        String(el.key).includes('references-section')
      );
      
      if (!hasReferencesSection) {
        elements.push(
          <div key={`references-section-sources-${elements.length}`} className="mt-14 mb-6 pt-8 border-t-2 border-gray-300">
            <h4 className="text-base font-normal text-gray-500 mb-5 uppercase tracking-wide">참고자료</h4>
            <div className="text-sm text-gray-600 space-y-3">
              <ul className="list-none space-y-2">
                {sources.map((source, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-[#1FA77A] mr-2">•</span>
                    <a 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-500 hover:underline break-all"
                      title={source.uri}
                    >
                      {source.title || source.uri}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
    }
    
    return elements;
  }, [content, onSwitchToImageTab, imageStatuses, handleGenerateSingleImage, isNaverBlogFormat, isBannerFormat, bannerImagePrompt, sources]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[calc(100vh-13rem)] flex flex-col">
      {content && !isLoading && (
        <div className="self-end mb-4 flex flex-wrap gap-2 justify-end">
             {showSpreadsheetButton && (
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
            {format === 'YOUTUBE-SHORTFORM' ? (
                 <button onClick={handleDownloadAll} className="flex items-center text-sm bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-medium py-2 px-4 rounded-md transition-colors">
                    콘텐츠 전송
                 </button>
            ) : generatedImageUrls.length > 0 && (
                 <button onClick={handleDownloadAll} className="flex items-center text-sm bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-medium py-2 px-4 rounded-md transition-colors">
                    {`생성된 이미지 다운로드 (${generatedImageUrls.length})`}
                 </button>
            )}
            {isBannerFormat && bannerImagePrompt && (
              <>
                <button 
                  onClick={handleGenerateBannerImage} 
                  disabled={isBannerImageGenerating}
                  className="flex items-center text-sm bg-[#FF9500] hover:bg-[#e88500] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isBannerImageGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      이미지 생성
                    </>
                  )}
                </button>
                <button 
                  onClick={handleCopyBannerPrompt} 
                  className="flex items-center text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {bannerPromptCopied ? <CheckIcon className="w-4 h-4 mr-2 text-green-500" /> : <CopyIcon className="w-4 h-4 mr-2" />}
                  {bannerPromptCopied ? '복사 완료!' : '프롬프트 복사'}
                </button>
              </>
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
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">연관 키워드 / 주제 추천</h4>
                {suggestions && suggestions.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {suggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="bg-gradient-to-r from-[#1FA77A] to-[#1FB88A] hover:from-[#1a8c68] hover:to-[#1a9d78] text-white font-medium py-2.5 px-5 rounded-full text-sm transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      // content에서 키워드 추출 시도
                      const keywordMatch = content.match(/🔑 핵심키워드:\s*(.+)/);
                      const extractedKeywords = keywordMatch 
                        ? keywordMatch[1].split(',').map(k => k.trim()).filter(k => k).slice(0, 3)
                        : [];
                      
                      if (extractedKeywords.length > 0) {
                        return extractedKeywords.map((keyword, index) => (
                          <button
                            key={index}
                            onClick={() => onSuggestionClick(keyword)}
                            className="bg-gradient-to-r from-[#1FA77A] to-[#1FB88A] hover:from-[#1a8c68] hover:to-[#1a9d78] text-white font-medium py-2.5 px-5 rounded-full text-sm transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                          >
                            {keyword}
                          </button>
                        ));
                      }
                      
                      // 키워드를 추출할 수 없을 때 기본 메시지
                      return (
                        <p className="text-gray-500 text-sm">연관 키워드를 생성 중입니다...</p>
                      );
                    })()}
                  </div>
                )}
              </div>
               {/* 네이버 블로그 포맷이 아닐 때만 sources 표시 (네이버 블로그는 참고자료 섹션에 포함) */}
               {sources && sources.length > 0 && !isNaverBlogFormat && (
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