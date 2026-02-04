
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ArrowUp, 
  Calendar,
  ChevronDown,
  Plus,
  XCircle,
  Smartphone,
  Instagram,
  Facebook,
  Globe,
  Home,
  Share2,
  CheckCircle2,
  Info,
  Save,
  Wand2,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { EventType, EventStatus, GolfEvent } from '../types';
import AppPreview from './AppPreview';
// Import GoogleGenAI from the correct package as per guidelines
import { GoogleGenAI } from "@google/genai";

interface EventCreateProps {
  onBack: () => void;
  onSuccess: (event: GolfEvent) => void;
  initialData?: GolfEvent;
}

const PLATFORMS = [
  { id: 'app', label: '티샷 앱', icon: <Smartphone size={15} />, color: 'text-[#004B49]', fixed: true },
  { id: 'insta', label: '인스타그램', icon: <Instagram size={15} />, color: 'text-pink-600' },
  { id: 'facebook', label: '페이스북', icon: <Facebook size={15} />, color: 'text-blue-600' },
  { id: 'blog', label: '네이버 블로그', icon: <Globe size={15} />, color: 'text-emerald-500' },
  { id: 'cafe', label: '네이버 카페', icon: <Home size={15} />, color: 'text-emerald-800' },
  { id: 'band', label: '네이버 밴드', icon: <Share2 size={15} />, color: 'text-green-600' },
];

const EventCreate: React.FC<EventCreateProps> = ({ onBack, onSuccess, initialData }) => {
  const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '.').slice(2);

  const [formData, setFormData] = useState({
    golfCourse: initialData?.golfCourse || '',
    title: initialData?.title || '',
    content: initialData?.content || '',
    type: initialData?.type || EventType.EVENT,
    startDate: initialData?.startDate || todayStr,
    endDate: initialData?.endDate || todayStr,
    imageUrl: initialData?.imageUrl || '',
    platforms: PLATFORMS.map(p => p.id) // All platforms selected by default
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const isEdit = !!initialData;

  const handleTypeChange = (newType: EventType) => {
    setFormData({
      ...formData, 
      type: newType,
      imageUrl: '' // Clear image when switching types
    });
  };

  // Fix for AI Image generation: Integrated Google Gemini API (gemini-2.5-flash-image)
  // to generate promotional golf images based on the event title.
  const handleGenerateImage = async () => {
    if (!formData.title) {
      alert('이미지 자동 생성을 위해 제목을 먼저 입력해주세요.');
      return;
    }
    
    setIsGenerating(true);
    try {
      // Create a new GoogleGenAI instance right before making an API call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ 
            text: `A high-quality, professional, and bright photograph of a golf course, suitable for a mobile app promotion. The event title is "${formData.title}" and the category is ${formData.type === EventType.DISCOUNT ? 'Green Fee Discount' : 'General Golf Event'}. Style: Cinematic lighting, luxury atmosphere.` 
          }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      // Find the image part in the response as per guidelines (nano banana series may return multiple parts)
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            setFormData(prev => ({ 
              ...prev, 
              imageUrl: `data:${mimeType};base64,${base64Data}` 
            }));
            break;
          }
        }
      }
    } catch (error) {
      console.error("AI Image generation failed:", error);
      // Fallback to random image on failure for demo stability
      setFormData(prev => ({
        ...prev, 
        imageUrl: `https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=800&auto=format&fit=crop&sig=${Math.random()}` 
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = (newStatus: EventStatus) => {
    if (!formData.golfCourse || !formData.title || !formData.startDate || !formData.endDate || !formData.imageUrl) {
      alert('필수 항목을 모두 입력해주세요 (이미지 포함).');
      return;
    }

    const eventToSave: GolfEvent = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      golfCourse: formData.golfCourse,
      title: formData.title,
      content: formData.content,
      imageUrl: formData.imageUrl,
      status: newStatus,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      regDate: initialData?.regDate || todayStr,
      views: initialData?.views || 0
    };
    onSuccess(eventToSave);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleStatusChange(initialData?.status || EventStatus.PUBLISHED);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-black transition-colors font-bold text-sm"
        >
          <ChevronLeft size={18} />
          이벤트 관리
        </button>
        <div className="flex items-center gap-3">
          {isEdit && (
            <>
              <button 
                onClick={() => handleStatusChange(EventStatus.REJECTED)}
                className="flex items-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                <X size={16} />
                거절
              </button>
              <button 
                onClick={() => handleStatusChange(EventStatus.PUBLISHED)}
                className="flex items-center gap-2 bg-[#004B49] hover:bg-[#003a38] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#004B49]/10"
              >
                <Check size={16} />
                승인
              </button>
            </>
          )}
          {!isEdit && (
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-[#004B49] hover:bg-[#003a38] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#004B49]/10"
            >
              <ArrowUp size={16} />
              이벤트 발행
            </button>
          )}
          {isEdit && (
            <button 
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
            >
              <Save size={16} />
              수정사항 저장
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left: Preview Section */}
        <div className="w-[420px] shrink-0">
          <AppPreview 
            isInteractive={false}
            hideInnerHeader={true}
            activeTab={formData.type === EventType.EVENT ? 'EVENT' : 'DISCOUNT'}
            events={[{
              id: 'preview',
              golfCourse: formData.golfCourse,
              title: formData.title,
              content: formData.content,
              imageUrl: formData.imageUrl || 'https://via.placeholder.com/400?text=Preview',
              status: isEdit ? initialData!.status : EventStatus.PUBLISHED,
              type: formData.type,
              startDate: formData.startDate || '시작일',
              endDate: formData.endDate || '종료일',
              regDate: '',
              views: initialData?.views || 0
            }]} 
          />
        </div>

        {/* Right: Form Section */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 pt-6 space-y-8 shadow-sm">
          <form className="space-y-8" onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold text-black">{isEdit ? '이벤트 상세 및 승인' : '새 이벤트 등록'}</h2>
            
            {/* 1. 이벤트 유형 (Event Type) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-black">
                이벤트 유형 <span className="text-red-500 font-normal">(필수)</span>
              </label>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => handleTypeChange(EventType.EVENT)}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    formData.type === EventType.EVENT 
                      ? 'border-[#004B49] bg-[#004B49]/5 text-[#004B49]' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  이벤트·프로모션
                </button>
                <button 
                  type="button"
                  onClick={() => handleTypeChange(EventType.DISCOUNT)}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border-2 transition-all font-bold text-sm ${
                    formData.type === EventType.DISCOUNT 
                      ? 'border-[#004B49] bg-[#004B49]/5 text-[#004B49]' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  그린피 할인
                </button>
              </div>
            </div>

            {/* 2. 발행 플랫폼 (Platforms) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-black">
                  발행 플랫폼 <span className="text-slate-400 font-normal">(중복 선택 가능)</span>
                </label>
                
                <div className="relative group flex items-center gap-1 cursor-help">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md transition-colors group-hover:bg-slate-200 group-hover:text-black font-medium">
                    <Info size={12} />
                    업로드 가이드
                  </div>
                  <div className="absolute right-0 bottom-full mb-2 w-[300px] bg-slate-900 text-white text-[11px] p-4 rounded-2xl shadow-2xl z-50 invisible group-hover:visible animate-in fade-in zoom-in-95 duration-200 origin-bottom-right border border-white/10">
                    <div className="space-y-4 text-left">
                      <div>
                        <div className="font-bold mb-1 text-pink-400">인스타그램</div>
                        <p className="leading-relaxed opacity-80">이미지 비율 1:1, 3:4 권장</p>
                      </div>
                      <div className="border-t border-white/10 pt-3">
                        <div className="font-bold mb-1 text-emerald-400">네이버 블로그</div>
                        <p className="leading-relaxed opacity-80">최대 24시간 소요</p>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 right-10 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3">
                {PLATFORMS.map((platform) => {
                  return (
                    <div
                      key={platform.id}
                      className="relative flex items-center gap-3 py-3 px-4 rounded-xl border-2 border-[#004B49] bg-[#004B49]/5 cursor-default group"
                    >
                      <div className="text-[#004B49]">
                        <CheckCircle2 size={14} fill="white" />
                      </div>
                      <div className="p-1.5 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        {/* Fix for line 258: Resolve "No overload matches this call" error in React.cloneElement
                            by casting the element to React.ReactElement<any> to allow 'className' prop mapping. */}
                        {React.cloneElement(platform.icon as React.ReactElement<any>, { 
                          className: platform.color 
                        })}
                      </div>
                      <span className="text-[12px] font-bold text-[#004B49] truncate">
                        {platform.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* 3. 골프장명 */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black">
                  골프장명 <span className="text-red-500 font-normal">(필수)</span>
                </label>
                <div className="relative">
                  <select 
                    value={formData.golfCourse}
                    onChange={(e) => setFormData({...formData, golfCourse: e.target.value})}
                    className={`w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/20 transition-all ${formData.golfCourse === "" ? 'text-slate-400' : 'text-black font-medium'}`}
                  >
                    <option value="" className="text-slate-400">골프장명을 검색해 입력해주세요.</option>
                    <option value="오창에딘버러(P9)">오창에딘버러(P9)</option>
                    <option value="에이원">에이원</option>
                    <option value="어등산">어등산</option>
                    <option value="양산동원로얄(P9)">양산동원로얄(P9)</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. 이벤트 기간 */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-black">
                  이벤트 기간 <span className="text-red-500 font-normal">(필수)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="YY.MM.DD" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/20 text-black font-medium placeholder-slate-300"
                    />
                    <Calendar size={16} className="absolute right-4 top-3.5 text-slate-300" />
                  </div>
                  <span className="text-slate-400">~</span>
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="YY.MM.DD" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/20 text-black font-medium placeholder-slate-300"
                    />
                    <Calendar size={16} className="absolute right-4 top-3.5 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. 제목 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">
                제목 <span className="text-red-500 font-normal">(필수)</span>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="이벤트 제목을 작성해주세요."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/20 text-black font-bold placeholder-slate-300"
                />
              </div>
            </div>

            {/* 6. 본문 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-black">본문</label>
              <textarea 
                placeholder="이벤트 본문을 작성해주세요."
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-5 text-sm min-h-[160px] focus:outline-none focus:ring-2 focus:ring-[#004B49]/20 text-black font-medium leading-relaxed placeholder-slate-300"
              ></textarea>
            </div>

            {/* 7. 이미지 등록 (Conditional Rendering) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-black">
                이미지 등록 <span className="text-red-500 font-normal">(필수)</span>
              </label>
              
              <div className="flex gap-4 items-start">
                {formData.type === EventType.EVENT ? (
                  /* Normal Upload for Events */
                  <div 
                    onClick={() => setFormData({...formData, imageUrl: 'https://picsum.photos/seed/' + Math.random() + '/400/400'})}
                    className="w-44 h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer group"
                  >
                    <Plus className="text-slate-300 group-hover:text-black transition-colors" size={32} />
                    <span className="text-xs font-bold text-slate-400">이미지 업로드</span>
                  </div>
                ) : (
                  /* AI generation Button for Discount using GoogleGenAI */
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateImage}
                      className={`w-44 h-44 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 shadow-sm ${
                        isGenerating 
                          ? 'bg-slate-50 border-slate-100 cursor-not-allowed' 
                          : 'bg-[#004B49]/5 border-[#004B49]/20 hover:bg-[#004B49]/10 hover:border-[#004B49]/40 text-[#004B49]'
                      }`}
                    >
                      {isGenerating ? (
                        <Loader2 className="animate-spin text-[#004B49]" size={32} />
                      ) : (
                        <Wand2 size={32} />
                      )}
                      <div className="text-center">
                        <span className="text-xs font-bold block">이미지 자동 생성</span>
                        <span className="text-[10px] opacity-60 font-medium">AI 기반 골프 이미지</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Shared Image Preview Area */}
                {formData.imageUrl && (
                  <div className="w-44 h-44 rounded-2xl overflow-hidden border border-slate-200 relative animate-in fade-in zoom-in duration-300">
                     <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Event preview" />
                     <button 
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute top-2 right-2 w-6 h-6 bg-slate-900/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-red-500 transition-colors"
                     >
                        <XCircle size={14} />
                     </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventCreate;
