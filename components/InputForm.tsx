import React, { useState, useEffect, useCallback } from 'react';
import type { UserInput } from '../types';
import { CATEGORIES, BLOG_CATEGORIES, FORMATS, BLOG_LENGTHS, TONES, VIDEO_LENGTHS, CATEGORY_KEYWORDS, BLOG_CATEGORY_KEYWORDS, FORMAT_LABELS } from '../constants';
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
  const [format, setFormat] = useState(FORMATS[0]);
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [blogCategory, setBlogCategory] = useState(BLOG_CATEGORIES[0].name);
  const [customCategory, setCustomCategory] = useState('');

  const getRandomKeywordForCategory = useCallback((cat: string, isBlogFormat: boolean = false): string => {
    const keywordSource = isBlogFormat ? BLOG_CATEGORY_KEYWORDS : CATEGORY_KEYWORDS;
    const defaultCategory = isBlogFormat ? BLOG_CATEGORIES[0].name : CATEGORIES[0].name;
    
    const keywords = keywordSource[cat] && keywordSource[cat].length > 0 
      ? keywordSource[cat]
      : keywordSource[defaultCategory];
    
    if (!keywords || keywords.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * keywords.length);
    return keywords[randomIndex];
  }, []);

  const [keyword, setKeyword] = useState(() => getRandomKeywordForCategory(CATEGORIES[0].name, false));
  const [userText, setUserText] = useState('');
  const [cardCount, setCardCount] = useState(6);
  const [blogLength, setBlogLength] = useState(1000);
  const [sectionCount, setSectionCount] = useState(5);
  const [videoLength, setVideoLength] = useState(30);
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
      const isBlogFormat = format === 'NAVER-BLOG/BAND';
      const currentCategory = isBlogFormat ? blogCategory : category;
      
      if (currentCategory === '직접 입력') {
        setKeyword('');
      } else {
        setKeyword(getRandomKeywordForCategory(currentCategory, isBlogFormat));
      }
    }
  }, [category, blogCategory, format, isGolfRelated, getRandomKeywordForCategory]);
  
  // 포맷 변경 시 카테고리와 키워드 초기화
  useEffect(() => {
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    if (isBlogFormat) {
      setBlogCategory(BLOG_CATEGORIES[0].name);
      setKeyword(getRandomKeywordForCategory(BLOG_CATEGORIES[0].name, true));
    } else {
      setCategory(CATEGORIES[0].name);
      setKeyword(getRandomKeywordForCategory(CATEGORIES[0].name, false));
    }
  }, [format, getRandomKeywordForCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    const currentCategory = isBlogFormat ? blogCategory : category;
    
    const userInput: UserInput = {
      isGolfRelated,
      category: currentCategory === '직접 입력' ? customCategory : currentCategory,
      format,
      keyword,
      userText,
      cardCount,
      blogLength,
      sectionCount,
      videoLength,
      sceneCount,
      tone,
    };
    onGenerate(userInput);
  };
  
  const handleRefreshKeyword = () => {
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    const currentCategory = isBlogFormat ? blogCategory : category;
    
    if (currentCategory !== '직접 입력') {
        setKeyword(getRandomKeywordForCategory(currentCategory, isBlogFormat));
    }
  };

  const handleQuickGenerate = () => {
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    
    // 카테고리 무작위 선택 (직접 입력 제외)
    const availableCategories = isBlogFormat 
      ? BLOG_CATEGORIES.filter(c => c.name !== '직접 입력')
      : CATEGORIES.filter(c => c.name !== '직접 입력');
    const randomCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    
    // 키워드 무작위 선택
    const randomKeyword = getRandomKeywordForCategory(randomCategory.name, isBlogFormat);
    
    // 카드 수 무작위 선택 (3-10)
    const randomCardCount = Math.floor(Math.random() * 8) + 3;
    
    // 블로그 길이 무작위 선택 (500, 1000, 1500, 2000, 2500, 3000, 3500, 4000)
    const blogLengths = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000];
    const randomBlogLength = blogLengths[Math.floor(Math.random() * blogLengths.length)];
    
    // 섹션 수 무작위 선택 (1-10)
    const randomSectionCount = Math.floor(Math.random() * 10) + 1;
    
    // 톤앤매너 무작위 선택
    const randomTone = TONES[Math.floor(Math.random() * TONES.length)];
    
    const userInput: UserInput = {
      isGolfRelated: true,
      category: randomCategory.name,
      format,
      keyword: randomKeyword,
      userText: '',
      cardCount: randomCardCount,
      blogLength: randomBlogLength,
      sectionCount: randomSectionCount,
      videoLength: 30,
      sceneCount: 6,
      tone: randomTone,
    };
    
    onGenerate(userInput);
  };

  const commonInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1FA77A] focus:border-[#1FA77A] transition-colors placeholder:text-gray-400";
  const selectInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 pl-3 pr-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1FA77A] focus:border-[#1FA77A] transition-colors cursor-pointer";
  const commonLabelClass = "block text-sm font-medium text-gray-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">컨텐츠 생성 옵션</h2>
      
      <div>
        <label className={`${commonLabelClass} mb-2 flex items-center justify-between cursor-pointer`}>
            <span>골프 관련 컨텐츠</span>
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
            
            // 포맷별 색상 정의
            const formatColors = {
              'INSTAGRAM-CARD': {
                selected: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg',
                unselected: 'bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100'
              },
              'NAVER-BLOG/BAND': {
                selected: 'bg-[#03C75A] text-white shadow-lg',
                unselected: 'bg-green-50 text-[#03C75A] hover:bg-green-100'
              },
              'YOUTUBE-SHORTFORM': {
                selected: 'bg-[#FF0000] text-white shadow-lg',
                unselected: 'bg-red-50 text-[#FF0000] hover:bg-red-100'
              },
              'ETC-BANNER': {
                selected: 'bg-[#FF9500] text-white shadow-lg',
                unselected: 'bg-orange-50 text-[#FF9500] hover:bg-orange-100'
              }
            };
            
            const colorClass = format === f 
              ? formatColors[f].selected 
              : formatColors[f].unselected;
            
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex flex-col items-center justify-center gap-1.5 p-2 text-sm font-medium rounded-lg text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 aspect-square ${colorClass} ${
                  format === f ? 'scale-105 ring-2 ring-white ring-offset-2' : 'scale-100'
                }`}
              >
                {Icon && <Icon className="w-6 h-6 flex-shrink-0" />}
                <span className="text-xs font-semibold leading-tight">{FORMAT_LABELS[f]}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      {isGolfRelated && format === 'NAVER-BLOG/BAND' && (
        <div>
          <div className="flex items-center mb-1">
              <label htmlFor="blogCategory" className={commonLabelClass}>카테고리</label>
              <div className="group relative ml-1.5">
                  <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute top-full left-1/2 z-20 mt-2 -translate-x-1/2 w-80 transform opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-white text-gray-700 text-sm rounded-lg shadow-xl p-3 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-2 text-base">카테고리 설명</h4>
                          <ul className="space-y-1.5 text-left">
                              {BLOG_CATEGORIES.map(c => (
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
          <select id="blogCategory" value={blogCategory} onChange={(e) => setBlogCategory(e.target.value)} className={selectInputClass}>
            {BLOG_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
           {blogCategory === '직접 입력' && (
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
      
      {isGolfRelated && format !== 'NAVER-BLOG/BAND' && (
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
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectInputClass}>
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
        <div>
          <label htmlFor="videoLength" className={`${commonLabelClass} mb-2`}>
            영상 길이
            <span className="ml-2 text-lg font-bold text-[#1FA77A]">{videoLength}초</span>
          </label>
          <input
            type="range"
            id="videoLength"
            min="5"
            max="60"
            step="5"
            value={videoLength}
            onChange={(e) => setVideoLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FA77A] hover:accent-[#178860] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5초</span>
            <span>10초</span>
            <span>15초</span>
            <span>20초</span>
            <span>25초</span>
            <span>30초</span>
            <span>35초</span>
            <span>40초</span>
            <span>45초</span>
            <span>50초</span>
            <span>55초</span>
            <span>60초</span>
          </div>
        </div>
      )}

      {format === 'INSTAGRAM-CARD' && (
        <div>
          <label htmlFor="cardCount" className={`${commonLabelClass} mb-2`}>
            카드 수
            <span className="ml-2 text-lg font-bold text-[#1FA77A]">{cardCount}장</span>
          </label>
          <input
            type="range"
            id="cardCount"
            min="3"
            max="10"
            step="1"
            value={cardCount}
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FA77A] hover:accent-[#178860] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3장</span>
            <span>4장</span>
            <span>5장</span>
            <span>6장</span>
            <span>7장</span>
            <span>8장</span>
            <span>9장</span>
            <span>10장</span>
          </div>
        </div>
      )}

      {format === 'NAVER-BLOG/BAND' && (
        <>
         <div>
          <label htmlFor="blogLength" className={`${commonLabelClass} mb-2`}>
            텍스트 분량
            <span className="ml-2 text-lg font-bold text-[#1FA77A]">{blogLength.toLocaleString()}자</span>
          </label>
          <input
            type="range"
            id="blogLength"
            min="500"
            max="4000"
            step="500"
            value={blogLength}
            onChange={(e) => setBlogLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FA77A] hover:accent-[#178860] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>500자</span>
            <span>1000자</span>
            <span>1500자</span>
            <span>2000자</span>
            <span>2500자</span>
            <span>3000자</span>
            <span>3500자</span>
            <span>4000자</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="sectionCount" className={`${commonLabelClass} mb-2`}>
            본문 섹션 수
            <span className="ml-2 text-lg font-bold text-[#1FA77A]">{sectionCount}개</span>
          </label>
          <input
            type="range"
            id="sectionCount"
            min="1"
            max="10"
            step="1"
            value={sectionCount}
            onChange={(e) => setSectionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FA77A] hover:accent-[#178860] transition-colors"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1개</span>
            <span>2개</span>
            <span>3개</span>
            <span>4개</span>
            <span>5개</span>
            <span>6개</span>
            <span>7개</span>
            <span>8개</span>
            <span>9개</span>
            <span>10개</span>
          </div>
        </div>
        </>
      )}
      
       <div>
        <label htmlFor="tone" className={`${commonLabelClass} mb-1`}>톤앤매너</label>
        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={selectInputClass}>
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

      <div className="space-y-3">
        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-[#1FA77A] via-[#1FB88A] to-[#1FA77A] hover:from-[#1a8c68] hover:via-[#1a9d78] hover:to-[#1a8c68] text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl">
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
              컨텐츠 생성하기
            </>
          )}
        </button>

        {(format === 'INSTAGRAM-CARD' || format === 'NAVER-BLOG/BAND') && (
          <button 
            type="button" 
            onClick={handleQuickGenerate} 
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 hover:from-orange-600 hover:via-orange-500 hover:to-orange-600 text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
          >
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
              빠른 컨텐츠 생성하기(랜덤)
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};

