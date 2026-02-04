
import React, { useState } from 'react';
import { 
  ArrowRight,
  ShieldCheck,
  Eye,
  MessageCircle,
  ChevronRight,
  Zap,
  Settings,
  Clock,
  CalendarDays,
  CalendarRange,
  Ticket,
  SearchX,
  User,
  ArrowUpRight,
  Info,
  Instagram,
  Facebook,
  Youtube,
  Coffee,
  Globe,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { MOCK_RESERVATIONS, MOCK_EVENTS, MOCK_ANNUAL_GROUPS, MOCK_DISCOUNT_PRODUCTS, MOCK_MONTHLY_GROUPS } from '../constants';
import ManagerInfoModal from './ManagerInfoModal';
import ERPIntegrationModal from './ERPIntegrationModal';

const Dashboard: React.FC<{ 
  onNavigate: (menu: string, sub?: string) => void;
  onEditInfo: () => void;
}> = ({ onNavigate, onEditInfo }) => {
  const recentEvents = MOCK_EVENTS.slice(0, 3);
  const [activeTab, setActiveTab] = useState<'realtime' | 'annual' | 'monthly' | 'discount'>('realtime');
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isERPModalOpen, setIsERPModalOpen] = useState(false);

  const categories = [
    { id: 'realtime', label: '실시간 예약', icon: <Clock size={16} />, menu: 'realtime', sub: 'realtime_history' },
    { id: 'discount', label: '할인 예약', icon: <Ticket size={16} />, menu: 'discount', sub: 'discount_history' },
    { id: 'annual', label: '연 단체 예약', icon: <CalendarDays size={16} />, menu: 'group_year', sub: 'group_year_history' },
    { id: 'monthly', label: '월 단체 예약', icon: <CalendarRange size={16} />, menu: 'group_month', sub: '' },
  ];

  const snsChannels = [
    { 
      id: 'insta', 
      label: '인스타그램', 
      icon: <Instagram size={28} fill="currentColor" />, 
      brandColor: 'text-[#E4405F]', 
      shadow: 'group-hover:shadow-pink-500/10',
      url: 'https://www.instagram.com/teeshot_event'
    },
    { 
      id: 'facebook', 
      label: '페이스북', 
      icon: <Facebook size={28} fill="currentColor" />, 
      brandColor: 'text-[#1877F2]',
      shadow: 'group-hover:shadow-blue-500/10',
      url: 'https://www.facebook.com/teeshotevent'
    },
    { 
      id: 'cafe', 
      label: '네이버 카페', 
      icon: <Coffee size={28} fill="currentColor" />, 
      brandColor: 'text-[#2DB400]',
      shadow: 'group-hover:shadow-green-500/10',
      url: 'https://cafe.naver.com/teeshot'
    },
    { 
      id: 'blog', 
      label: '네이버 블로그', 
      icon: (
        <div className="font-[900] text-[22px] italic tracking-tighter text-[#2DB400] leading-none">blog</div>
      ), 
      brandColor: '', 
      shadow: 'group-hover:shadow-green-500/10',
      url: 'https://blog.naver.com/teeshotgolf-'
    },
    { 
      id: 'youtube', 
      label: '유튜브', 
      icon: <Youtube size={28} fill="currentColor" />, 
      brandColor: 'text-[#FF0000]',
      shadow: 'group-hover:shadow-red-500/10',
      url: 'https://www.youtube.com/@%ED%8B%B0%EC%83%B7%EC%88%8F%EC%B8%A0_'
    },
    { 
      id: 'kakao', 
      label: '카카오채널', 
      icon: <MessageSquare size={26} fill="currentColor" />, 
      brandColor: 'text-[#FEE500]',
      shadow: 'group-hover:shadow-yellow-500/20',
      url: 'https://pf.kakao.com/_WLrWd/posts'
    },
  ];

  const currentCategory = categories.find(c => c.id === activeTab);

  const getStatusStyle = (status: string) => {
    if (['예약신청', '예약대기', '예약', 'OPEN', '예약가능'].includes(status)) {
      return 'text-blue-500 bg-blue-50 border-blue-100';
    }
    if (['예약확정', '예약완료'].includes(status)) {
      return 'text-emerald-500 bg-emerald-50 border-emerald-100';
    }
    if (['신청승낙', '승낙'].includes(status)) {
      return 'text-orange-500 bg-orange-50 border-orange-100';
    }
    if (['신청거절', '거절', '예약취소', '신청취소', '미선정', '계약만료', '취소'].includes(status)) {
      return 'text-slate-400 bg-slate-50 border-slate-200';
    }
    return 'text-slate-500 bg-slate-50 border-slate-200';
  };

  const handleInfoInputClick = () => {
    setIsManagerModalOpen(true);
  };

  const handleModalConfirm = () => {
    setIsManagerModalOpen(false);
    onEditInfo();
  };

  const handleERPApplyClick = () => {
    setIsERPModalOpen(true);
  };

  const ReservationPreviewList = () => {
    let data: any[] = [];
    if (activeTab === 'realtime') data = MOCK_RESERVATIONS.slice(0, 5);
    else if (activeTab === 'annual') data = MOCK_ANNUAL_GROUPS.slice(0, 5);
    else if (activeTab === 'monthly') data = MOCK_MONTHLY_GROUPS.slice(0, 5);
    else if (activeTab === 'discount') data = MOCK_DISCOUNT_PRODUCTS.slice(0, 5);

    if (data.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border border-slate-100">
            <SearchX size={48} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-slate-800 tracking-tight">등록된 {currentCategory?.label} 내역이 없습니다.</p>
            <p className="text-sm text-slate-400 font-medium">관리 페이지에서 예약 정보를 등록하거나 실시간 현황을 확인해보세요.</p>
          </div>
          <button 
            onClick={() => onNavigate(currentCategory?.menu || 'home', currentCategory?.sub)}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#004B49] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#004B49]/10 hover:bg-[#003a38] transition-all active:scale-95"
          >
            {activeTab === 'realtime' ? '실시간 ERP 연동' : activeTab === 'discount' ? '할인 예약 등록하기' : `${currentCategory?.label} 관리하기`}
          </button>
        </div>
      );
    }

    const isGroupTab = activeTab === 'annual' || activeTab === 'monthly';

    return (
      <div className="flex-1 flex flex-col px-0 relative">
        <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden opacity-[0.08] pb-28">
          <div className="text-[40px] font-black rotate-[-35deg] whitespace-nowrap text-slate-900 select-none tracking-widest">
            EXAMPLE DATA
          </div>
        </div>

        <div className="overflow-hidden px-10 relative z-10">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-white/80 backdrop-blur-sm">
                <th className="w-[35%] py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isGroupTab ? '단체' : '골프장 / 코스'}
                </th>
                <th className="w-[20%] py-4 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">예약자</th>
                <th className="w-[25%] py-4 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">예약일시</th>
                <th className="w-[20%] py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, idx) => {
                const title = "크리스밸리CC";
                const subTitle = item.courseName || item.groupName;
                const user = item.userName || item.applicantName || '정보없음';
                const dateParts = (item.reservationDate || item.applyDate || '-').split(' ');
                const date = dateParts[0];
                const dayAndTime = dateParts.slice(1).join(' ') + (item.reservationTime ? ` ${item.reservationTime}` : '');
                const status = item.status || '-';

                return (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-all duration-200">
                    <td className="py-5 px-4 align-middle">
                      {isGroupTab ? (
                        <span className="text-sm font-bold text-[#004B49] group-hover:text-[#003a38] transition-colors truncate">
                          {subTitle}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-[#004B49] group-hover:text-[#003a38] transition-colors truncate">{title}</span>
                          <span className="text-[11px] font-medium text-slate-400 truncate">{subTitle}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-5 px-2 text-center align-middle">
                      <span className="text-sm font-bold text-slate-800">{user}</span>
                    </td>
                    <td className="py-5 px-2 text-center align-middle">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">{date}</span>
                        <span className="text-[10px] font-medium text-slate-400">{dayAndTime}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-center align-middle">
                      <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold border ${getStatusStyle(status)}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-auto px-10 pt-8 pb-16 flex justify-center">
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600 font-bold">
            <div className="flex items-center justify-center text-blue-600">
              <Info size={16} strokeWidth={3} />
            </div>
            <span>해당 예약내역은 서비스 이해를 돕기 위한 예시 데이터입니다.</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
      
      {/* 1. Welcome Section */}
      <div className="bg-white border border-slate-200/60 rounded-2xl py-16 px-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              안녕하세요, <span className="text-[#004B49]">크리스밸리CC</span>님!
            </h2>
            <p className="text-slate-400 text-base font-medium">티샷 관리자 센터에서 오늘의 운영 현황을 한눈에 확인하세요.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onEditInfo}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
            >
              <Settings size={20} className="text-slate-400" />
              골프장 정보 관리
            </button>
            <button 
              className="flex items-center gap-2 bg-[#004B49] hover:bg-[#003a38] text-white px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#004B49]/10"
            >
              <FileText size={20} />
              골프 예약 대행 계약서
            </button>
          </div>
        </div>
      </div>

      {/* 2. Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden bg-[#004B49] py-20 px-10 rounded-2xl shadow-xl shadow-[#004B49]/10 transition-all hover:-translate-y-1 flex flex-col justify-between min-h-[420px]">
          <ShieldCheck size={320} className="absolute -bottom-16 -right-16 text-emerald-100 opacity-[0.05] rotate-12 pointer-events-none" strokeWidth={1} fill="currentColor" />
          <div className="relative z-10 text-white">
            <h3 className="text-3xl font-bold leading-tight mb-4 tracking-tight">예약 담당자 정보 업데이트</h3>
            <p className="text-[17px] text-emerald-50 opacity-90 font-medium max-w-sm leading-relaxed">
              지금 골프장 정보를 입력하고,<br />더많은 예약관리 기능을 이용하세요.
            </p>
          </div>
          
          <div className="relative z-10 w-fit">
            <div className="absolute bottom-full left-0 mb-4 animate-float">
              <div className="bg-white text-[#004B49] px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-50 whitespace-nowrap text-sm font-bold flex items-center gap-2">
                담당자 정보 입력시, 스타벅스 쿠폰☕ 지급
              </div>
              <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-white border-r border-b border-emerald-50 rotate-45 shadow-sm"></div>
            </div>
            
            <button 
              onClick={handleInfoInputClick}
              className="flex items-center justify-between px-8 py-5 bg-white text-slate-800 rounded-xl text-lg font-bold shadow-lg hover:bg-slate-50 transition-all min-w-[300px]"
            >
              정보 입력하기 
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 ml-4 group-hover:bg-slate-100">
                 <ArrowRight size={20} className="text-black" strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-[#FF782E] to-[#F25A00] py-20 px-10 rounded-2xl shadow-xl shadow-orange-500/10 transition-all hover:-translate-y-1 flex flex-col justify-between min-h-[420px]">
          <Zap size={320} className="absolute -bottom-16 -right-16 text-white opacity-[0.1] -rotate-12 pointer-events-none" strokeWidth={1} fill="currentColor" />
          <div className="relative z-10 text-white">
            <h3 className="text-3xl font-bold leading-tight mb-4 tracking-tight">실시간 ERP 연동 신청</h3>
            <p className="text-[17px] text-orange-50 opacity-90 font-medium max-w-sm leading-relaxed">
              티샷 20만 회원을 대상으로,<br />티타임 판매율을 늘려보세요.
            </p>
          </div>

          <div className="relative z-10 w-fit">
            <div className="absolute bottom-full left-0 mb-4 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="bg-white text-[#F25A00] px-4 py-2.5 rounded-2xl shadow-xl border border-orange-50 whitespace-nowrap text-sm font-bold flex items-center gap-2">
                간단 연동 신청, 티타임 판매율 UP! 🚀
              </div>
              <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-white border-r border-b border-orange-50 rotate-45 shadow-sm"></div>
            </div>

            <button 
              onClick={handleERPApplyClick}
              className="flex items-center justify-between px-8 py-5 bg-white text-slate-800 rounded-xl text-lg font-bold shadow-lg hover:bg-slate-50 transition-all min-w-[300px]"
            >
              연동 신청하기
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 ml-4 group-hover:bg-slate-100">
                 <ArrowRight size={20} className="text-black" strokeWidth={3} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Event Row */}
      <div className="bg-white rounded-2xl border border-slate-100 pt-10 px-10 pb-12 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-base font-bold text-slate-800 tracking-tight">진행중인 이벤트</h3>
          <button 
            onClick={() => onNavigate('event', 'event_manage')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:text-[#004B49] hover:border-[#004B49]/30 transition-all shadow-sm active:scale-95"
          >
            이벤트 관리 바로가기
            <ChevronRight size={14} strokeWidth={3} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentEvents.map((event) => (
            <div key={event.id} className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-slate-200 transition-all group cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold bg-[#004B49] text-white px-2.5 py-1 rounded">
                  발행
                </span>
                <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-[#004B49] transition-colors">
                  <Eye size={14} />
                  <span className="text-xs font-bold">{event.views.toLocaleString()}</span>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{event.title}</h4>
              <p className="text-[11px] text-slate-400 font-medium">{event.startDate} ~ {event.endDate}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm flex flex-col h-full relative">
          <div className="pt-10 px-10 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">예약 현황</h3>
            </div>
            <button 
              onClick={() => onNavigate('realtime', 'realtime_history')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 hover:text-[#004B49] hover:border-[#004B49]/30 transition-all shadow-sm active:scale-95"
            >
              실시간 예약 바로가기
              <ChevronRight size={14} strokeWidth={3} />
            </button>
          </div>

          <div className="flex px-10 gap-0 border-b border-slate-50">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as any)}
                className={`flex items-center gap-2 px-8 py-4 text-[13px] font-bold transition-all relative ${
                  activeTab === cat.id 
                    ? 'text-[#004B49]' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {cat.icon}
                {cat.label}
                {activeTab === cat.id && (
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#004B49]"></div>
                )}
              </button>
            ))}
          </div>

          <ReservationPreviewList />
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 pt-10 px-10 pb-12 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">이벤트 SNS 바로가기</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-y-10 gap-x-4">
              {snsChannels.map((sns) => (
                <a 
                  key={sns.id} 
                  href={sns.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 group"
                  aria-label={`${sns.label} 공식 채널로 이동`}
                >
                  <div className={`
                    w-[66px] h-[66px] rounded-[22px] bg-white border border-slate-100
                    flex items-center justify-center shadow-sm 
                    group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300
                    relative overflow-hidden ${sns.shadow}
                  `}>
                    <div className="absolute inset-0 bg-slate-50/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className={`${sns.brandColor}`}>
                      {sns.icon}
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-full">
                    <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-800 transition-colors text-center">
                      {sns.label}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 pt-10 px-10 pb-10 shadow-sm flex-1 flex flex-col">
            <h3 className="text-base font-bold text-slate-800 tracking-tight mb-8">티샷 고객센터</h3>
            <div className="space-y-6 flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm font-medium text-slate-400">대표번호</span>
                <span className="text-lg font-bold text-slate-800 tracking-tight">02-2277-3489</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="text-sm font-medium text-slate-400">상담시간</span>
                <span className="text-sm font-bold text-slate-800">평일 09:00 - 18:00</span>
              </div>
              <div className="mt-auto pt-6">
                <button className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 group">
                  <MessageCircle size={18} fill="currentColor" className="text-slate-900" />
                  카톡 상담하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ManagerInfoModal 
        isOpen={isManagerModalOpen} 
        onClose={() => setIsManagerModalOpen(false)} 
        onConfirm={handleModalConfirm}
        golfCourseName="크리스밸리CC"
      />

      <ERPIntegrationModal 
        isOpen={isERPModalOpen} 
        onClose={() => setIsERPModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
