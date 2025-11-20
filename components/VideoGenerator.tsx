import React, { useState, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { SparklesIcon } from './icons';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // FIX: Removed `readonly` modifier to match the global declaration of `aistudio` and resolve the modifier mismatch error.
    aistudio: AIStudio;
  }
}

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('A golfer hitting a ball in slow motion, with the ball exploding into a shower of sparks');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio) {
          const keySelected = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(keySelected);
        }
      } catch (e) {
        console.error("Error checking for API key:", e);
      } finally {
        setIsCheckingApiKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    } catch (e) {
      console.error("Error opening API key selection:", e);
      setError("API 키 선택 창을 여는 데 실패했습니다.");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);
    setLoadingMessage('영상을 생성하고 있습니다...');

    const loadingMessages = [
        "이 작업은 몇 분 정도 소요될 수 있습니다. 페이지를 닫지 마세요.",
        "AI가 창의력을 발휘하는 중입니다...",
        "최적의 샷을 구성하고 있습니다...",
        "거의 다 됐습니다..."
    ];
    let messageIndex = 0;
    const intervalId = setInterval(() => {
        setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
        messageIndex++;
    }, 5000);

    try {
      const videoBlobUrl = await generateVideo(prompt, aspectRatio, resolution);
      setVideoUrl(videoBlobUrl);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found.")) {
        setError('유효한 API 키를 찾을 수 없습니다. 키를 다시 선택해주세요.');
        setHasApiKey(false);
      } else {
        setError('영상 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
      clearInterval(intervalId);
      setLoadingMessage('');
    }
  };

  const commonInputClass = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1FA77A] focus:border-[#1FA77A] transition-colors";

  const renderApiKeyScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h3 className="text-xl font-semibold text-white mb-2">API 키 선택 필요</h3>
        <p className="max-w-md text-gray-400">영상 생성 기능을 사용하려면 먼저 API 키를 선택해야 합니다. Veo 모델 사용 시 비용이 발생할 수 있습니다.</p>
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-[#1FA77A] hover:underline my-4">
            관련 문서 및 비용 안내
        </a>
        <button onClick={handleSelectKey} className="bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-bold py-2 px-6 rounded-md transition-colors">
            API 키 선택하기
        </button>
    </div>
  );

  return (
    <div className="bg-gray-800/50 p-6 rounded-b-xl rounded-r-xl shadow-lg border border-t-0 border-gray-700 min-h-[calc(100vh-13rem)] flex flex-col">
    {isCheckingApiKey ? <div className="flex-grow flex items-center justify-center text-gray-400">API 키 확인 중...</div> : !hasApiKey ? renderApiKeyScreen() :
      (<>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className='md:col-span-3'>
                <label htmlFor="videoPrompt" className="block text-sm font-medium text-gray-400 mb-1">영상 프롬프트</label>
                <textarea 
                id="videoPrompt" 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                className={`${commonInputClass} h-24 resize-none`} 
                placeholder="생성하고 싶은 영상에 대해 자세히 설명해주세요." 
                required 
                />
            </div>
             <div className='md:col-span-2 space-y-4'>
                <div>
                    <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-400 mb-1">종횡비</label>
                    <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className={commonInputClass}>
                        <option value="16:9">16:9 (가로)</option>
                        <option value="9:16">9:16 (세로)</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="resolution" className="block text-sm font-medium text-gray-400 mb-1">해상도</label>
                    <select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value as '720p' | '1080p')} className={commonInputClass}>
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                    </select>
                </div>
            </div>
        </div>

        <button type="submit" disabled={isLoading || !prompt.trim()} className="w-full flex items-center justify-center bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-bold py-2.5 px-4 rounded-md transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100">
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingMessage || '영상 생성 중...'}
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              영상 생성하기
            </>
          )}
        </button>
      </form>
      <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg p-4">
        {isLoading && (
           <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="animate-spin h-10 w-10 text-[#1FA77A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-gray-300">{loadingMessage || 'AI가 영상을 제작하고 있습니다...'}</p>
            </div>
        )}
        {error && <div className="text-red-400 text-center p-4">{error}</div>}
        {!isLoading && !error && !videoUrl && (
            <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-lg font-semibold text-gray-300">영상 생성</h3>
                <p className="max-w-md mt-1">프롬프트를 입력하여 세상에 없던 멋진 골프 영상을 만들어보세요.</p>
            </div>
        )}
        {!isLoading && videoUrl && (
          <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-[60vh] object-contain rounded-md shadow-lg" />
        )}
      </div>
      </>)
    }
    </div>
  );
};