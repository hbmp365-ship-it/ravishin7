import React, { useState, useEffect } from 'react';
import type { UserInput } from '../types';
import { CATEGORIES, FORMATS, BLOG_LENGTHS, TONES, VIDEO_LENGTHS } from '../constants';
import { SparklesIcon } from './icons';

interface InputFormProps {
  onGenerate: (userInput: UserInput) => void;
  isLoading: boolean;
  suggestedKeyword: string;
}

export const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading, suggestedKeyword }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [keyword, setKeyword] = useState('드라이버 슬라이스, 그립 압력');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userInput: UserInput = {
      category,
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

  const commonInputClass = "w-full bg-gray-700 border border-gray-600 rounded-md py-2 pl-3 pr-10 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1FA77A] focus:border-[#1FA77A] transition-colors";
  const highlightedInputClass = "w-full bg-gray-700 border border-blue-500 rounded-md py-2 pl-3 pr-10 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1FA77A] focus:border-[#1FA77A] transition-colors";
  const commonLabelClass = "block text-sm font-medium text-gray-400 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4">콘텐츠 생성 설정</h2>
      
      <div>
        <label htmlFor="format" className={commonLabelClass}>포맷</label>
        <select id="format" value={format} onChange={(e) => setFormat(e.target.value)} className={highlightedInputClass}>
          {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      
      <div>
        <label htmlFor="category" className={commonLabelClass}>카테고리</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={highlightedInputClass}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {(format === '인스타 릴스' || format === '유튜브 숏츠') && (
        <>
          <div>
            <label htmlFor="videoLength" className={commonLabelClass}>영상 길이</label>
            <select id="videoLength" value={videoLength} onChange={(e) => setVideoLength(parseInt(e.target.value))} className={commonInputClass}>
              {VIDEO_LENGTHS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sceneCount" className={commonLabelClass}>장면 수</label>
            <input type="number" id="sceneCount" min="3" max="10" value={sceneCount} onChange={(e) => setSceneCount(parseInt(e.target.value))} className={commonInputClass} />
          </div>
        </>
      )}

      {format === '인스타 카드' && (
        <div>
          <label htmlFor="cardCount" className={commonLabelClass}>카드 수</label>
          <input type="number" id="cardCount" min="3" max="10" value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))} className={commonInputClass} />
        </div>
      )}

      {(format === '네이버 블로그' || format === '기타 커뮤니티') && (
         <div>
          <label htmlFor="blogLength" className={commonLabelClass}>텍스트 분량</label>
          <select id="blogLength" value={blogLength} onChange={(e) => setBlogLength(parseInt(e.target.value))} className={commonInputClass}>
            {BLOG_LENGTHS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
      )}
      
       <div>
        <label htmlFor="tone" className={commonLabelClass}>톤앤매너</label>
        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className={commonInputClass}>
          {TONES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="keyword" className={commonLabelClass}>키워드 / 주제 (선택)</label>
        <input type="text" id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} className={commonInputClass} placeholder="입력하지 않으면 AI가 추천합니다" />
      </div>
      
      <div>
        <label htmlFor="userText" className={commonLabelClass}>참고 텍스트 (선택)</label>
        <textarea id="userText" value={userText} onChange={(e) => setUserText(e.target.value)} className={`${commonInputClass} h-24`} placeholder="요약 또는 재구성이 필요한 원문을 입력하세요." />
      </div>

      <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-[#1FA77A] hover:bg-[#1a8c68] text-white font-bold py-3 px-4 rounded-md transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 disabled:scale-100">
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