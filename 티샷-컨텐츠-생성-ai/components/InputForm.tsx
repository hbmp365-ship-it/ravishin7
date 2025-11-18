import React, { useState, useEffect, useCallback } from 'react';
import type { UserInput } from '../types';
import { CATEGORIES, FORMATS, BLOG_LENGTHS, TONES, VIDEO_LENGTHS, CATEGORY_KEYWORDS, FORMAT_LABELS } from '../constants';
import { SparklesIcon, QuestionMarkCircleIcon, RefreshIcon, InstagramIcon, BlogIcon, YouTubeShortsIcon, BannerIcon } from './icons';

interface InputFormProps {
  onGenerate: (userInput: UserInput) => void;
  isLoading: boolean;
  suggestedKeyword: string;
}

const formatIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  'INSTAGRAM-CARD': InstagramIcon,
  'NAVER-BLOG/BAND': BlogIcon,
  'YOUTUBE-SHORTFORM': YouTubeShortsIcon,
  'ETC-BANNER': BannerIcon,
};


export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading, suggestedKeyword }) => {
  const [isGolfRelated, setIsGolfRelated] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [format, setFormat] = useState(FORMATS[0]);

  const getRandomKeywordForCategory = useCallback((cat: string): string => {
    const keywords = CATEGORY_KEYWORDS[cat] && CATEGORY_KEYWORDS[cat].length > 0 
      ? CATEGORY_KEYWORDS[cat]
      : CATEGORY_KEYWORDS[CATEGORIES[0].name];
    
    if (!keywords || keywords.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * keywords.length);
    return keywords[randomIndex];
  }, []);

  const [keyword, setKeyword] = useState(() => getRandomKeywordForCategory(CATEGORIES[0].name));
  const [userText, setUserText] = useState('');
  const [cardCount, setCardCount] = useState(6);
  const [blogLength, setBlogLength] = useState(2);
  const [videoLength, setVideoLength] = useState(2);
  const [sceneCount, setSceneCount] = useState(6);
  const [tone, setTone] = useState(TONES[0]);

  useEffect(() => {
    if (suggestedKeyword) {
      setKeyword(suggestedKeyword);
      setUserText('');
    }
  }, [suggestedKeyword]);

  useEffect(() => {
    if (isGolfRelated) {
      if (category === '직접 입력') {
        setKeyword('');
      } else {
        setKeyword(getRandomKeywordForCategory(category));
      }
    }
  }, [category, isGolfRelated, getRandomKeywordForCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userInput: UserInput = {
      isGolfRelated,
      category: category === '직접 입력' ? customCategory : category,
      format,
      keyword,
      userText,
      cardCount,
      blogLength,
      videoLength,
      sceneCount,
      tone,
    };
    onGenerate(userInput);
  };
  
  const handleRefreshKeyword = () => {
    if (category !== '직접 입력') {
        setKeyword(getRandomKeywordForCategory(category));
    }
  };

  const commonInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1FA77A] focus:border-[#1FA77A] transition-colors placeholder:text-gray-400";
  const commonLabelClass = "block text-sm font-medium text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 생성 설정</h2>
      
      <div>
        <label className={`${commonLabelClass} mb-2 flex items-center justify-between cursor-pointer`}>
            <span>골프 연관 컨텐츠 생성</span>
            <div
              role="switch"
              aria-checked={isGolfRelated}
              onClick={() => setIsGolfRelated(!isGolfRelated)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isGolfRelated ? 'bg-[#1FA77A]' : 'bg-gray-200'}`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isGolfRelated ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </div>
          </label>
      </div>

      <div>
        <label className={`${commonLabelClass} mb-2`}>포맷</label>
        <div className="grid grid-cols-4 gap-2">
          {FORMATS.map(f => {
            const Icon = formatIcons[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 text-sm font-medium rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1FA77A] aspect-square ${
                  format === f
                    ? 'bg-[#1FA77A] text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {Icon && <Icon className="w-6 h-6 flex-shrink-0" />}
                <span className="text-xs font-semibold leading-tight">{FORMAT_LABELS[f]}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {isGolfRelated && (
        <div>
          <div className="flex items-center mb-1">
              <label htmlFor="category" className={commonLabelClass}>카테고리</label>
              <div className="group relative ml-1.5">
                  <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 w-80 transform opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-white text-gray-700 text-sm rounded-lg shadow-xl p-3 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-2 text-base">카테고리 설명</h4>
                          <ul className="space-y-1.5 text-left">
                              {CATEGORIES.map(c => (
                                  <li key={c.name} className="flex">
                                      <strong className="text-[#1FA77A] font-semibold w-28 flex-shrink-0">{c.name}:</strong>
                                      <span className="text-gray-600">{c.description}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={commonInputClass}>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
           {category === '직접 입력' && (
            <div className="mt-2">
              <label htmlFor="customCategory" className={`${commonLabelClass} mb-1 sr-only`}>사용자 정의 카테고리</label>
              <input
                type="text"
                id="customCategory"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className={commonInputClass}
                placeholder="카테고리명을 입력하세요"
                required
              />
            </div>
          )}
        </div>
      )}

      {format === 'YOUTUBE-SHORTFORM' && (
        <>
          <div>
            <label htmlFor="videoLength" className={`${commonLabelClass} mb-1`}>영상 길이</label>
            <select id="videoLength" value={videoLength} onChange={(e) => setVideoLength(parseInt(e.target.value))} className={commonInputClass}>
              {VIDEO_LENGTHS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sceneCount" className={`${commonLabelClass} mb-1`}>장면 수</label>
            <input type="number" id="sceneCount" min="3" max="10" value={sceneCount} onChange={(e) => setSceneCount(parseInt(e.target.value))} className={commonInputClass} />
          </div>
        </>
      )}

      {format === 'INSTAGRAM-CARD' && (
        <div>
          <label htmlFor="cardCount" className={`${commonLabelClass} mb-1`}>카드 수</label>
          <input type="number" id="cardCount" min="3" max="10" value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))} className={commonInputClass} />
        </div>
      )}

      {format === 'NAVER-BLOG/BAND' && (
         <div>
          <label htmlFor="blogLength" className={`${commonLabelClass} mb-1`}>텍스트 분량</label>
          <select id="blogLength" value={blogLength} onChange={(e) => setBlogLength(parseInt(e.target.value))} className={commonInputClass}>
            {BLOG_LENGTHS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      )}
      
       <div>
        <label htmlFor="tone" className={`${commonLabelClass} mb-1`}>톤앤매너</label>
        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={commonInputClass}>
          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="keyword" className={`${commonLabelClass} mb-1`}>키워드 / 주제</label>
        <div className="relative flex items-center">
            <input 
                type="text" 
                id="keyword" 
                value={keyword} 
                onChange={(e) => setKeyword(e.target.value)} 
                className={`${commonInputClass} pr-10`}
                placeholder={isGolfRelated && category !== '직접 입력' ? "카테고리에 맞는 주제를 추천해드려요" : "생성할 콘텐츠의 주제를 입력하세요"} 
            />
            {isGolfRelated && category !== '직접 입력' && (
                <button 
                type="button" 
                onClick={handleRefreshKeyword} 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#1FA77A] transition-colors focus:outline-none"
                aria-label="새로운 키워드 추천받기"
                title="새로운 키워드 추천받기"
                >
                <RefreshIcon className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>
      
      <div>
        <label htmlFor="userText" className={`${commonLabelClass} mb-1`}>참고 텍스트 (선택)</label>
        <textarea id="userText" value={userText} onChange={(e) => setUserText(e.target.value)} className={`${commonInputClass} h-24`} placeholder="요약 또는 재구성이 필요한 원문을 입력하세요." />
      </div>

      <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-bold py-3 px-4 rounded-md transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100">
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            생성 중...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            콘텐츠 생성하기
          </>
        )}
      </button>
    </form>
  );
};
