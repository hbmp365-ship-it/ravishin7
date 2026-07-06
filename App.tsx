
import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ContentDisplay } from './components/ContentDisplay';
import { DesignHubPage } from './components/DesignHubPage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import type { UserInput, GeneratedContent } from './types';
import type { AppPage, HubSection } from './types/appPage';
import { generateGolfContent } from './services/geminiService';

const isHubView = (page: AppPage): boolean =>
  page === 'hub' || page === 'design-system' || page === 'version-info';

const App: React.FC = () => {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserInput, setLastUserInput] = useState<UserInput | null>(null);
  const [suggestedKeyword, setSuggestedKeyword] = useState<string>('');
  const [instaCardPrefill, setInstaCardPrefill] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<AppPage>('hub');
  const [hubScrollSection, setHubScrollSection] = useState<HubSection | null>(null);

  const handleNavigate = useCallback((page: AppPage, section?: HubSection) => {
    if (page === 'content-generator') {
      setActivePage('content-generator');
      setHubScrollSection(null);
      return;
    }

    setHubScrollSection(section ?? null);
    if (section === 'design-system') {
      setActivePage('design-system');
    } else if (section === 'version-info') {
      setActivePage('version-info');
    } else {
      setActivePage('hub');
    }
  }, []);

  const handleGenerate = useCallback(async (userInput: UserInput) => {
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setLastUserInput(userInput);
    if (suggestedKeyword) setSuggestedKeyword('');

    try {
      const result = await generateGolfContent(userInput);
      setGeneratedContent(result);
    } catch (e: any) {
      console.error(e);

      const errorCode = e?.error?.code || e?.status || e?.statusCode;
      const errorMessage = e?.error?.message || e?.message || '';

      if (errorCode === 503) {
        setError('서버가 일시적으로 과부하 상태입니다. 다른 모델로 자동 재시도 중입니다.');
      } else if (errorCode === 401 || errorCode === 403) {
        setError('API 키가 유효하지 않거나 권한이 없습니다. .env 파일의 GEMINI_API_KEY를 확인해주세요.');
      } else if (errorCode === 429) {
        setError('API 요청 한도에 도달했습니다. 30초~1분 후에 다시 시도해주세요.');
      } else if (errorMessage.includes('API_KEY')) {
        setError('API 키가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.');
      } else {
        setError(`콘텐츠 생성 중 오류가 발생했습니다: ${errorMessage || '알 수 없는 오류'}. 잠시 후 다시 시도해주세요.`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [suggestedKeyword]);

  const handleSwitchToImageTab = useCallback((_prompt: string) => {
    // 이미지 탭은 현재 GNB 구조에서 미사용 — 시그니처 유지
  }, []);

  const handleConsumeInstaCardPrefill = useCallback(() => {
    setInstaCardPrefill(null);
  }, []);

  const handleRequestInstaCardWithReferenceText = useCallback((text: string) => {
    setInstaCardPrefill(text);
    handleNavigate('content-generator');
  }, [handleNavigate]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (lastUserInput) {
        const newUserInput: UserInput = {
          ...lastUserInput,
          keyword: suggestion,
          userText: '',
        };
        setSuggestedKeyword(suggestion);
        handleGenerate(newUserInput);
      }
    },
    [lastUserInput, handleGenerate]
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col dark:bg-black">
      <Header activePage={activePage} onNavigate={handleNavigate} />
      <main
        className={`flex-grow pb-8 ${
          isHubView(activePage) ? 'px-0 pt-0' : 'container mx-auto px-4 pt-16'
        }`}
      >
        {isHubView(activePage) ? (
          <DesignHubPage scrollToSection={hubScrollSection} onNavigate={handleNavigate} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-stretch">
            <div className="lg:col-span-4">
              <div className="h-full bg-white p-6 rounded-xl shadow-lg border border-gray-200 dark:bg-black dark:border-gray-800 dark:shadow-black/20">
                <InputForm
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  suggestedKeyword={suggestedKeyword}
                  instaCardPrefill={instaCardPrefill}
                  onConsumeInstaCardPrefill={handleConsumeInstaCardPrefill}
                />
              </div>
            </div>
            <div className="lg:col-span-8 h-full min-h-0">
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
                keyword={lastUserInput?.keyword}
                cutCount={lastUserInput?.cutCount}
                cutTexts={lastUserInput?.cutTexts}
                bannerContentType={lastUserInput?.bannerContentType}
                bannerAspectRatio={lastUserInput?.aspectRatio}
                bannerHeadline={lastUserInput?.headline}
                bannerSubheadline={lastUserInput?.subheadline}
                bannerBodyCopy={lastUserInput?.bodyCopy}
                bannerCta={lastUserInput?.cta}
                bannerDesignReferenceImage={lastUserInput?.bannerDesignReferenceImage}
                bannerAiImagePromptHint={lastUserInput?.bannerAiImagePromptHint}
                aiPromptCustomReferenceImage={lastUserInput?.aiPromptCustomReferenceImage}
                aiPromptTeeshotCameraDistance={lastUserInput?.aiPromptTeeshotCameraDistance}
                onRequestInstaCardWithReferenceText={handleRequestInstaCardWithReferenceText}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
