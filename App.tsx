
import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ContentDisplay } from './components/ContentDisplay';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ImageGenerator } from './components/ImageGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import type { UserInput, GeneratedContent } from './types';
import { generateGolfContent } from './services/geminiService';

const App: React.FC = () => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'image' | 'video'>('content');
  const [imageGeneratorPrompt, setImageGeneratorPrompt] = useState<string>('');
  const [lastUserInput, setLastUserInput] = useState<UserInput | null>(null);
  const [suggestedKeyword, setSuggestedKeyword] = useState<string>('');


  const handleGenerate = useCallback(async (userInput: UserInput) => {
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setLastUserInput(userInput);
    if(suggestedKeyword) setSuggestedKeyword('');

    try {
      const result = await generateGolfContent(userInput);
      setGeneratedContent(result);
    } catch (e: any) {
      console.error(e);
      
      // 에러 타입에 따라 다른 메시지 표시
      const errorCode = e?.error?.code || e?.status || e?.statusCode;
      const errorMessage = e?.error?.message || e?.message || '';
      
      if (errorCode === 503) {
        setError('서버가 일시적으로 과부하 상태입니다. gemini-2.5-pro → gemini-1.5-pro → gemini-1.5-flash 순서로 자동으로 다른 모델을 시도 중입니다. 잠시만 기다려주세요.');
      } else if (errorCode === 401 || errorCode === 403) {
        setError('API 키가 유효하지 않거나 권한이 없습니다. .env 파일의 GEMINI_API_KEY를 확인해주세요.');
      } else if (errorCode === 429) {
        setError('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else if (errorMessage.includes('API_KEY')) {
        setError('API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.');
      } else {
        setError(`콘텐츠 생성 중 오류가 발생했습니다: ${errorMessage || '알 수 없는 오류'}. 잠시 후 다시 시도해주세요.`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [suggestedKeyword]);
  
  const handleSwitchToImageTab = useCallback((prompt: string) => {
    setImageGeneratorPrompt(prompt);
    setActiveTab('image');
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    if (lastUserInput) {
      const newUserInput: UserInput = {
        ...lastUserInput,
        keyword: suggestion,
        userText: '',
      };
      setSuggestedKeyword(suggestion);
      handleGenerate(newUserInput);
    }
  }, [lastUserInput, handleGenerate]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4">
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <InputForm 
                  onGenerate={handleGenerate} 
                  isLoading={isLoading} 
                  suggestedKeyword={suggestedKeyword}
                />
             </div>
          </div>
          <div className="lg:col-span-8">
            <ContentDisplay 
              content={generatedContent?.content ?? ''} 
              suggestions={generatedContent?.suggestions ?? []}
              sources={generatedContent?.sources ?? []}
              isLoading={isLoading} 
              error={error} 
              onSwitchToImageTab={handleSwitchToImageTab}
              onSuggestionClick={handleSuggestionClick}
              category={lastUserInput?.category}
              format={lastUserInput?.format}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;