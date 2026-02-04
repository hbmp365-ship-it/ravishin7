
import React, { useState } from 'react';
import { SIDEBAR_MENU } from '../constants';
import { ChevronRight, LogOut, MessageCircle } from 'lucide-react';

interface SidebarProps {
  activeMenuId: string;
  activeSubMenuId: string;
  onMenuClick: (menuId: string, subMenuId?: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMenuId, activeSubMenuId, onMenuClick }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['event', 'discount']);

  const toggleExpand = (id: string) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <aside className="w-64 bg-[#004B49] text-white flex flex-col h-screen fixed left-0 top-0 z-50 overflow-y-auto shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-[#004B49] rotate-45"></div>
        </div>
        <div className="leading-tight">
          <h1 className="font-bold text-lg tracking-tight uppercase">TeeShot</h1>
          <p className="text-[10px] opacity-70">골프친구 티샷</p>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-2">
        {SIDEBAR_MENU.map((item) => {
          const isExpanded = expandedMenus.includes(item.id);
          const isActive = activeMenuId === item.id;

          return (
            <div key={item.id} className="mb-1">
              <button 
                onClick={() => {
                  if (item.subMenu) {
                    toggleExpand(item.id);
                  } else {
                    onMenuClick(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#003a38] text-white font-bold' : 'text-emerald-100 hover:bg-[#003a38]'}`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold">{item.badge}</span>
                  )}
                </div>
                {item.subMenu && (
                  <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                )}
              </button>
              
              {item.subMenu && isExpanded && (
                <div className="ml-4 mt-1 border-l border-emerald-800/50">
                  {item.subMenu.map((sub) => {
                    const isSubActive = activeSubMenuId === sub.id;
                    return (
                      <button 
                        key={sub.id} 
                        onClick={() => onMenuClick(item.id, sub.id)}
                        className={`w-full flex items-center justify-between px-6 py-2.5 text-xs text-left transition-colors ${isSubActive ? 'text-white font-semibold bg-[#005a58]/40 rounded-r-lg' : 'text-emerald-200 hover:text-white'}`}
                      >
                        <span>{sub.label}</span>
                        {sub.notice && (
                          <span className="bg-orange-500 text-white w-4 h-4 flex items-center justify-center rounded-sm text-[10px] font-bold">{sub.notice}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-[#005a58] space-y-2">
        <button className="flex items-center gap-2 text-emerald-200 hover:text-white text-xs w-full px-2 py-2">
          <MessageCircle size={16} />
          <span>카카오톡 문의</span>
        </button>
        <button className="flex items-center gap-2 text-emerald-200 hover:text-white text-xs w-full px-2 py-2">
          <LogOut size={16} />
          <span>회원 접속로그</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
