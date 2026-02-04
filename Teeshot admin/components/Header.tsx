
import React from 'react';
import { Bell, HelpCircle, Menu, User } from 'lucide-react';

interface HeaderProps {
  activeMenu: string;
  activeSubMenu: string;
}

const Header: React.FC<HeaderProps> = ({ activeMenu, activeSubMenu }) => {
  const getBreadcrumb = () => {
    switch (activeMenu) {
      case 'home': return '대시보드';
      case 'group_year': return '연 단체 예약';
      case 'group_month': return '월 단체 예약';
      case 'realtime': return '실시간 예약';
      case 'discount': return '할인 예약';
      case 'event': return '이벤트';
      case 'service': return '골프장 서비스';
      default: return '홈';
    }
  };

  const getSubBreadcrumb = () => {
    switch (activeSubMenu) {
      case 'group_year_history': return '신청내역';
      case 'group_year_history_confirmed': return '예약내역';
      case 'group_year_manage': return '단체관리';
      case 'discount_history': return '예약내역';
      case 'discount_register': return '할인등록';
      case 'realtime_history': return '예약내역';
      case 'event_manage': return '이벤트 관리';
      default: return '';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-40">
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-400 font-medium">{getBreadcrumb()}</span>
        {getSubBreadcrumb() && (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold">{getSubBreadcrumb()}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          <HelpCircle size={14} />
          <span>관리자 이용 가이드</span>
          <div className="w-8 h-4 bg-slate-300 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l pl-6 border-slate-200">
          <div className="relative">
            <Bell size={20} className="text-slate-500 cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">3</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-[#004B49]/10 flex items-center justify-center text-[#004B49] font-bold text-xs uppercase group-hover:bg-[#004B49]/20 transition-colors">
              CEO
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 leading-none">Teeshot365님</span>
            </div>
            <User size={18} className="text-slate-400 ml-2" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
