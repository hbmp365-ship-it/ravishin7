import React, { useState, useEffect, useCallback } from 'react';
import type { UserInput } from '../types';
import { CATEGORIES, BLOG_CATEGORIES, FORMATS, BLOG_LENGTHS, TONES, VIDEO_LENGTHS, CATEGORY_KEYWORDS, BLOG_CATEGORY_KEYWORDS, FORMAT_LABELS, ASPECT_RATIOS, BANNER_STYLES, THEME_OPTIONS, IMAGE_GENERATOR_TOOLS, ALIGNMENT_OPTIONS } from '../constants';
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
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0].value);
  const [theme, setTheme] = useState(THEME_OPTIONS[0].value);
  const [style, setStyle] = useState(BANNER_STYLES[0].value);
  const [imageGeneratorTool, setImageGeneratorTool] = useState(IMAGE_GENERATOR_TOOLS[0].value);
  const [alignment, setAlignment] = useState(ALIGNMENT_OPTIONS[0].value); // Center aligned
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [bodyCopy, setBodyCopy] = useState('');
  const [cta, setCta] = useState('');

  useEffect(() => {
    if (suggestedKeyword) {
      setKeyword(suggestedKeyword);
      setUserText('');
    }
  }, [suggestedKeyword]);

  useEffect(() => {
    if (isGolfRelated && format !== 'ETC-BANNER') {
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
    const isBannerFormat = format === 'ETC-BANNER';
    if (isBlogFormat) {
      setBlogCategory(BLOG_CATEGORIES[0].name);
      setKeyword(getRandomKeywordForCategory(BLOG_CATEGORIES[0].name, true));
    } else if (!isBannerFormat) {
      setCategory(CATEGORIES[0].name);
      setKeyword(getRandomKeywordForCategory(CATEGORIES[0].name, false));
    }
  }, [format, getRandomKeywordForCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isBlogFormat = format === 'NAVER-BLOG/BAND';
    const isBannerFormat = format === 'ETC-BANNER';
    const currentCategory = isBlogFormat ? blogCategory : category;
    
    // 배너/포스터 포맷일 때 헤드라인 필수 체크
    if (isBannerFormat && !headline.trim()) {
      alert('헤드라인을 입력해주세요.');
      return;
    }
    
    const userInput: UserInput = {
      isGolfRelated,
      category: format === 'INSTAGRAM-CARD' ? '데일리 뉴스' : (currentCategory === '직접 입력' ? customCategory : currentCategory),
      format,
      keyword: isBannerFormat ? '' : keyword,
      userText: isBannerFormat ? '' : userText,
      cardCount,
      blogLength,
      sectionCount,
      videoLength,
      sceneCount,
      tone: isBannerFormat ? '' : tone,
      aspectRatio: isBannerFormat ? aspectRatio : undefined,
      theme: isBannerFormat ? theme : undefined,
      style: isBannerFormat ? style : undefined,
      imageGeneratorTool: isBannerFormat ? imageGeneratorTool : undefined,
      alignment: isBannerFormat ? alignment : undefined,
      headline: isBannerFormat ? headline : undefined,
      subheadline: isBannerFormat ? subheadline : undefined,
      bodyCopy: isBannerFormat ? bodyCopy : undefined,
      cta: isBannerFormat ? cta : undefined,
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

  const commonInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#004B49] focus:border-[#004B49] transition-colors placeholder:text-gray-400";
  const selectInputClass = "w-full bg-gray-100 border border-gray-300 rounded-md py-2 pl-3 pr-10 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#004B49] focus:border-[#004B49] transition-colors cursor-pointer";
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
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isGolfRelated ? 'bg-[#004B49]' : 'bg-gray-200'}`}
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
                                      <strong className="text-[#004B49] font-semibold w-28 flex-shrink-0">{c.name}:</strong>
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
      
      {isGolfRelated && format !== 'NAVER-BLOG/BAND' && format !== 'ETC-BANNER' && format !== 'INSTAGRAM-CARD' && (
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
                                      <strong className="text-[#004B49] font-semibold w-28 flex-shrink-0">{c.name}:</strong>
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{videoLength}초</span>
          </label>
          <input
            type="range"
            id="videoLength"
            min="5"
            max="60"
            step="5"
            value={videoLength}
            onChange={(e) => setVideoLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{cardCount}장</span>
          </label>
          <input
            type="range"
            id="cardCount"
            min="3"
            max="10"
            step="1"
            value={cardCount}
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{blogLength.toLocaleString()}자</span>
          </label>
          <input
            type="range"
            id="blogLength"
            min="500"
            max="4000"
            step="500"
            value={blogLength}
            onChange={(e) => setBlogLength(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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
            <span className="ml-2 text-lg font-bold text-[#004B49]">{sectionCount}개</span>
          </label>
          <input
            type="range"
            id="sectionCount"
            min="1"
            max="10"
            step="1"
            value={sectionCount}
            onChange={(e) => setSectionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#004B49] hover:accent-[#003A38] transition-colors"
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

      {format === 'ETC-BANNER' && (
        <>
          <div>
            <label htmlFor="aspectRatio" className={`${commonLabelClass} mb-1`}>기본 비율</label>
            <select id="aspectRatio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={selectInputClass}>
              {ASPECT_RATIOS.map(ratio => <option key={ratio.value} value={ratio.value}>{ratio.label}</option>)}
            </select>
          </div>
          <div>
            <label className={`${commonLabelClass} mb-2`}>테마 옵션</label>
            <div className="grid grid-cols-2 gap-3">
              {THEME_OPTIONS.map(themeOption => {
                const isSelected = theme === themeOption.value;
                const isDark = themeOption.value === '다크모드';
                const icon = isDark ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                );
                return (
                  <button
                    key={themeOption.value}
                    type="button"
                    onClick={() => setTheme(themeOption.value)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#004B49] bg-[#004B49]/5'
                        : 'border-gray-200 hover:border-[#004B49]/50'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${isSelected ? 'text-[#004B49]' : 'text-gray-600'}`}>
                      {icon}
                    </div>
                    <div className="text-left flex-1">
                      <div className={`text-sm font-semibold ${isSelected ? 'text-[#004B49]' : 'text-gray-700'}`}>
                        {themeOption.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {themeOption.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={`${commonLabelClass} mb-2`}>시각적 스타일</label>
            <div className="grid grid-cols-3 gap-2">
              {BANNER_STYLES.map(s => {
                const isSelected = style === s.value;
                let icon;
                if (s.value === '이미지 기반 스타일') {
                  icon = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  );
                } else if (s.value === '그래픽 기반 스타일') {
                  icon = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  );
                } else {
                  icon = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  );
                }
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#004B49] bg-[#004B49]/5 text-[#004B49]'
                        : 'border-gray-200 hover:border-[#004B49]/50 text-gray-600 hover:text-[#004B49]'
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-medium mt-1.5 text-center leading-tight">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className={`${commonLabelClass} mb-2`}>정렬 옵션</label>
            <div className="grid grid-cols-3 gap-2">
              {ALIGNMENT_OPTIONS.map(align => {
                const isSelected = alignment === align.value;
                let icon;
                if (align.value === 'Center aligned') {
                  icon = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  );
                } else if (align.value === 'Left aligned') {
                  icon = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h12M4 18h8" />
                    </svg>
                  );
                } else {
                  icon = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h12M12 18h8" />
                    </svg>
                  );
                }
                return (
                  <button
                    key={align.value}
                    type="button"
                    onClick={() => setAlignment(align.value)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-[#004B49] bg-[#004B49]/5 text-[#004B49]'
                        : 'border-gray-200 hover:border-[#004B49]/50 text-gray-600 hover:text-[#004B49]'
                    }`}
                  >
                    {icon}
                    <span className="text-xs font-medium mt-1.5">{align.label.replace(' aligned', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="imageGeneratorTool" className={`${commonLabelClass} mb-1`}>이미지 생성 프롬프트 모델</label>
            <select id="imageGeneratorTool" value={imageGeneratorTool} onChange={(e) => setImageGeneratorTool(e.target.value)} className={selectInputClass}>
              {IMAGE_GENERATOR_TOOLS.map(tool => <option key={tool.value} value={tool.value}>{tool.label}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-gray-500">
              💡 선택된 모델에 최적화된 프롬프트 제공
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="headline" className={commonLabelClass}>
                헤드라인 <span className="text-red-500">*</span>
              </label>
              <span className={`text-xs ${headline.length > 8 ? 'text-blue-600 font-medium' : headline.length > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                {headline.length}자 {headline.length > 8 ? '✓ 그대로 사용' : headline.length > 0 ? '→ 확장 가능' : ''}
              </span>
            </div>
            <input
              type="text"
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className={commonInputClass}
              placeholder="배너/포스터의 메인 메시지를 입력하세요"
              required
            />
            {headline.length > 0 && (
              <p className={`mt-1 text-xs ${headline.length > 8 ? 'text-blue-600' : 'text-orange-600'}`}>
                {headline.length > 8 
                  ? '✓ 입력하신 텍스트가 그대로 사용됩니다.' 
                  : '💡 8글자 이하이면 AI가 내용을 확장하여 생성합니다.'}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="subheadline" className={commonLabelClass}>
                서브헤드라인 <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              {subheadline.length > 0 && (
                <span className={`text-xs ${subheadline.length > 8 ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}`}>
                  {subheadline.length}자 {subheadline.length > 8 ? '✓ 그대로 사용' : '→ 확장 가능'}
                </span>
              )}
            </div>
            <input
              type="text"
              id="subheadline"
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              className={commonInputClass}
              placeholder="보조 메시지를 입력하세요 (입력하지 않으면 자동 생성)"
            />
            {subheadline.length > 0 && (
              <p className={`mt-1 text-xs ${subheadline.length > 8 ? 'text-blue-600' : 'text-orange-600'}`}>
                {subheadline.length > 8 
                  ? '✓ 입력하신 텍스트가 그대로 사용됩니다.' 
                  : '💡 8글자 이하이면 AI가 내용을 확장하여 생성합니다.'}
              </p>
            )}
            {subheadline.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                입력하지 않으면 헤드라인에 어울리는 서브헤드라인을 자동으로 생성합니다.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="bodyCopy" className={commonLabelClass}>
              바디카피 <span className="text-gray-400 text-xs">(선택)</span>
            </label>
            <textarea
              id="bodyCopy"
              value={bodyCopy}
              onChange={(e) => setBodyCopy(e.target.value)}
              className={`${commonInputClass} h-24`}
              placeholder="배너/포스터 본문 내용을 입력하세요 (입력하지 않으면 자동 생성)"
            />
            {bodyCopy.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                입력하지 않으면 헤드라인에 어울리는 바디카피를 자동으로 생성합니다.
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="cta" className={commonLabelClass}>
                CTA (행동 유도 문구) <span className="text-gray-400 text-xs">(선택)</span>
              </label>
              {cta.length > 0 && (
                <span className={`text-xs ${cta.length > 8 ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}`}>
                  {cta.length}자 {cta.length > 8 ? '✓ 그대로 사용' : '→ 확장 가능'}
                </span>
              )}
            </div>
            <input
              type="text"
              id="cta"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className={commonInputClass}
              placeholder="예: 지금 예약하기, 더 알아보기 등 (입력하지 않으면 자동 생성)"
            />
            {cta.length > 0 && (
              <p className={`mt-1 text-xs ${cta.length > 8 ? 'text-blue-600' : 'text-orange-600'}`}>
                {cta.length > 8 
                  ? '✓ 입력하신 텍스트가 그대로 사용됩니다.' 
                  : '💡 8글자 이하이면 AI가 내용을 확장하여 생성합니다.'}
              </p>
            )}
            {cta.length === 0 && (
              <p className="mt-1 text-xs text-gray-400">
                입력하지 않으면 헤드라인에 어울리는 CTA를 자동으로 생성합니다.
              </p>
            )}
          </div>
        </>
      )}
      
      {format !== 'ETC-BANNER' && (
        <div>
          <label htmlFor="tone" className={`${commonLabelClass} mb-1`}>톤앤매너</label>
          <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={selectInputClass}>
            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      {format !== 'ETC-BANNER' && (
        <>
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
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#004B49] transition-colors focus:outline-none"
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
        </>
      )}

      <div className="space-y-3">
        <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-gradient-to-r from-[#004B49] via-[#005855] to-[#004B49] hover:from-[#003A38] hover:via-[#004640] hover:to-[#003A38] text-white font-bold py-4 px-4 rounded-lg transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl">
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

