
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Smartphone, 
  Instagram, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  LayoutGrid, 
  List,
  Search, 
  PlusSquare, 
  Play, 
  UserCircle, 
  Home, 
  CalendarDays, 
  Gift,
  ChevronDown,
  Globe,
  MessageSquare,
  Share2
} from 'lucide-react';
import { GolfEvent, EventType } from '../types';

export type AppTab = 'EVENT' | 'DISCOUNT';

interface AppPreviewProps {
  events: GolfEvent[];
  activeTab?: AppTab;
  isInteractive?: boolean;
  hideInnerHeader?: boolean;
}

type AppLayoutMode = 'grid' | 'list';

const AppPreview: React.FC<AppPreviewProps> = ({ events, activeTab, isInteractive = true, hideInnerHeader = false }) => {
  const [appLayoutMode, setAppLayoutMode] = useState<AppLayoutMode>('list');
  const [internalAppTab, setInternalAppTab] = useState<AppTab>('EVENT');

  // Sync internal tab state with prop if provided
  const appTab = activeTab || internalAppTab;

  const filteredEventsForApp = useMemo(() => {
    const targetType = appTab === 'EVENT' ? EventType.EVENT : EventType.DISCOUNT;
    return events.filter(e => e.type === targetType);
  }, [events, appTab]);

  const handleTabClick = (tab: AppTab) => {
    if (!isInteractive) return;
    setInternalAppTab(tab);
  };

  const handleLayoutModeClick = (mode: AppLayoutMode) => {
    if (!isInteractive) return;
    setAppLayoutMode(mode);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 pt-6 flex flex-col gap-6 sticky top-22 overflow-hidden h-fit">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-black">티샷 앱 미리보기</h3>
      </div>

      {/* Device Mockup Section */}
      <div className="flex-1 flex items-center justify-center py-6 px-4 bg-slate-50 rounded-2xl">
        <div className="relative w-[310px] h-[640px] bg-slate-900 rounded-[3.5rem] p-2 shadow-2xl border-2 border-slate-800 shrink-0">
          {/* Top Notch/Speaker */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-10 flex items-center justify-center">
             <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
          </div>
          
          {/* Inner Mock Screen */}
          <div className="w-full h-full bg-white rounded-[3rem] overflow-hidden relative flex flex-col">
            {!hideInnerHeader && (
              <div className="pt-8 px-6 pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleTabClick('EVENT')}
                      className={`text-[14px] font-bold transition-all relative pb-1 ${appTab === 'EVENT' ? 'text-black' : 'text-slate-400'} ${!isInteractive && 'cursor-default'}`}
                    >
                      이벤트
                      {appTab === 'EVENT' && <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#004B49]"></div>}
                    </button>
                    <button 
                      onClick={() => handleTabClick('DISCOUNT')}
                      className={`text-[14px] font-bold transition-all relative pb-1 ${appTab === 'DISCOUNT' ? 'text-black' : 'text-slate-400'} ${!isInteractive && 'cursor-default'}`}
                    >
                      그린피 할인
                      {appTab === 'DISCOUNT' && <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#004B49]"></div>}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className={`flex-1 overflow-y-auto bg-slate-50 mobile-mock-scroll ${hideInnerHeader ? 'pt-10' : ''}`}>
              <div className="p-4 space-y-4">
                {filteredEventsForApp.slice(0, 8).map((event) => (
                  <div key={event.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-[12px] truncate leading-tight text-black`}>
                        {event.title || '제목을 입력해주세요'}
                      </h4>
                      <p className={`text-[10px] mt-1 line-clamp-2 leading-snug text-slate-800`}>
                        {event.content || '본문 내용을 입력해주세요'}
                      </p>
                      <div className={`mt-2 text-[9px] font-bold bg-[#004B49]/5 inline-block px-2 py-0.5 rounded text-[#004B49]`}>
                        {event.golfCourse || '골프장명'}
                      </div>
                    </div>
                    <img src={event.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-200" />
                  </div>
                ))}
                {filteredEventsForApp.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Search size={32} strokeWidth={1.5} />
                    <p className="text-[11px] mt-2">표시할 데이터가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-2">
        <p className="text-[11px] text-slate-400 font-medium text-center px-4 leading-relaxed">
          실제 티샷 앱 노출 화면 미리보기입니다.
        </p>
      </div>
    </div>
  );
};

export default AppPreview;
