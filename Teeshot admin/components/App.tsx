
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AppPreview from './components/AppPreview';
import EventCreate from './components/EventCreate';
import DiscountCreate from './components/DiscountCreate';
import RealtimeReservation from './components/RealtimeReservation';
import GolfCourseService from './components/GolfCourseService';
import Dashboard from './components/Dashboard';
import AnnualGroupReservation from './components/AnnualGroupReservation';
import ConfirmationModal from './components/ConfirmationModal';
import { MOCK_EVENTS, MOCK_RESERVATIONS, MOCK_DISCOUNT_PRODUCTS, MOCK_GOLF_COURSES } from '../constants';
import { EventStatus, EventType, GolfEvent, Reservation, ReservationStatus, DiscountProduct, DiscountProductStatus, GolfCourseInfo } from '../types';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  MapPin,
  ListFilter,
  Ticket,
  LayoutGrid,
  Calendar,
  ChevronDown,
  ArrowRight,
  AlertCircle,
  X,
  Info,
  BarChart3,
  Flag,
  Gift,
  ArrowUp
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const App: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('home');
  const [activeSubMenu, setActiveSubMenu] = useState('');
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'register_form'>('list');
  
  const [events, setEvents] = useState<GolfEvent[]>(MOCK_EVENTS);
  const [discountProducts, setDiscountProducts] = useState<DiscountProduct[]>(MOCK_DISCOUNT_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('전체 상태');
  const [typeTab, setTypeTab] = useState<'ALL' | EventType>('ALL');
  const [editingEvent, setEditingEvent] = useState<GolfEvent | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedGolfCourse, setSelectedGolfCourse] = useState<GolfCourseInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state for Discount Registration
  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'END' | 'DELETE' | 'BATCH_DELETE';
    eventId: string | null;
  }>({
    isOpen: false,
    type: 'END',
    eventId: null
  });

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.golfCourse.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === '전체 상태' || e.status === statusFilter;
      const matchType = typeTab === 'ALL' || e.type === typeTab;
      return matchSearch && matchStatus && matchType;
    });
  }, [events, searchTerm, statusFilter, typeTab]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const pagedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  const handleCreateSuccess = (savedEvent: GolfEvent) => {
    if (editingEvent || events.find(e => e.id === savedEvent.id)) {
      setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e));
    } else {
      setEvents([savedEvent, ...events]);
    }
    setEditingEvent(null);
    setView('list');
  };

  const handleEdit = (event: GolfEvent) => {
    setEditingEvent(event);
    setView('create');
  };

  const handleDetailClick = (res: Reservation) => {
    setSelectedReservation(res);
    setView('detail');
  };

  const handleGolfCourseClick = (course: GolfCourseInfo) => {
    setSelectedGolfCourse(course);
    setView('detail');
  };

  const navigateToOwnGolfCourse = () => {
    setSelectedGolfCourse(MOCK_GOLF_COURSES[0]);
    setView('detail');
    setActiveMenu('service');
    setActiveSubMenu('');
  };

  const openConfirmModal = (type: 'END' | 'DELETE' | 'BATCH_DELETE', id: string | null = null) => {
    setModalConfig({
      isOpen: true,
      type,
      eventId: id
    });
  };

  const closeConfirmModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
  };

  const handleConfirmAction = () => {
    const { type, eventId } = modalConfig;
    
    if (type === 'END' && eventId) {
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, status: EventStatus.ENDED } : e
      ));
    } else if (type === 'DELETE' && eventId) {
      setEvents(events.filter(e => e.id !== eventId));
    } else if (type === 'BATCH_DELETE') {
      setDiscountProducts(discountProducts.filter(p => !selectedDiscountIds.includes(p.id)));
      setSelectedDiscountIds([]);
    }
    closeConfirmModal();
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setView('create');
  };

  const handleMenuClick = (menuId: string, subMenuId?: string) => {
    setActiveMenu(menuId);
    if (subMenuId) setActiveSubMenu(subMenuId);
    else {
      if (menuId === 'discount') setActiveSubMenu('discount_history');
      if (menuId === 'realtime') setActiveSubMenu('realtime_history');
      if (menuId === 'event') setActiveSubMenu('event_manage');
      if (menuId === 'service') setActiveSubMenu('service_manage');
      if (menuId === 'group_year') setActiveSubMenu('group_year_history');
      if (menuId === 'home') setActiveSubMenu('');
    }
    setView('list');
    setSelectedDiscountIds([]); 
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status: ReservationStatus | DiscountProductStatus | EventStatus) => {
    switch (status) {
      case ReservationStatus.PENDING:
      case DiscountProductStatus.PENDING:
      case EventStatus.PENDING: return 'text-slate-500 border-slate-200 bg-slate-50';
      case EventStatus.PUBLISHED: return 'text-[#007BFF] border-[#007BFF]/30 bg-[#EBF5FF]'; 
      case ReservationStatus.CONFIRMED:
      case DiscountProductStatus.CONFIRMED: return 'text-blue-500 border-blue-200 bg-blue-50';
      case ReservationStatus.CANCELLED:
      case DiscountProductStatus.CANCELLED:
      case EventStatus.REJECTED: return 'text-red-600 border-red-200 bg-red-50';
      case ReservationStatus.EXPIRED:
      case DiscountProductStatus.EXPIRED:
      case ReservationStatus.VENDOR_CANCEL:
      case DiscountProductStatus.VENDOR_CANCEL: return 'text-orange-600 border-orange-200 bg-orange-50';
      case DiscountProductStatus.AVAILABLE: return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      case ReservationStatus.FINISHED:
      case DiscountProductStatus.FINISHED:
      case EventStatus.ENDED: return 'text-slate-500 border-slate-200 bg-slate-50';
      default: return 'text-slate-500 border-slate-200 bg-slate-50';
    }
  };

  const toggleDiscountSelect = (id: string) => {
    setSelectedDiscountIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllDiscountSelect = () => {
    if (selectedDiscountIds.length === discountProducts.length) {
      setSelectedDiscountIds([]);
    } else {
      setSelectedDiscountIds(discountProducts.map(p => p.id));
    }
  };

  const CustomCheckbox = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-5 h-5 rounded border transition-all cursor-pointer flex items-center justify-center ${
        checked ? 'bg-[#007BFF] border-[#007BFF]' : 'bg-white border-slate-300'
      }`}
    >
      {checked && (
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeMenuId={activeMenu} 
        activeSubMenuId={activeSubMenu} 
        onMenuClick={handleMenuClick} 
      />
      <Header activeMenu={activeMenu} activeSubMenu={activeSubMenu} />
      
      {/* Changed pt-20 to pt-32 to increase top spacing as requested */}
      <main className="ml-64 mt-16 px-8 pt-32 pb-8 flex-1 overflow-x-hidden">
        {/* Home Dashboard */}
        {activeMenu === 'home' && (
          <Dashboard onNavigate={handleMenuClick} onEditInfo={navigateToOwnGolfCourse} />
        )}

        {/* Annual Group Reservation */}
        {activeMenu === 'group_year' && activeSubMenu === 'group_year_history' && (
          <AnnualGroupReservation />
        )}

        {/* Real-time Reservation Section */}
        {activeMenu === 'realtime' && activeSubMenu === 'realtime_history' && (
          <RealtimeReservation />
        )}

        {/* Golf Course Service Section */}
        {activeMenu === 'service' && (
          <GolfCourseService 
            view={view === 'detail' ? 'detail' : 'list'}
            selectedCourse={selectedGolfCourse}
            onRowClick={handleGolfCourseClick}
            onBackToList={() => setView('list')}
          />
        )}

        {/* Module 1: Event Management */}
        {activeMenu === 'event' && activeSubMenu === 'event_manage' && (
          <>
            {view === 'list' ? (
              <div className="max-w-[1600px] mx-auto">
                <div className="flex gap-16 items-start">
                  <div className="w-[420px] shrink-0">
                    <AppPreview events={filteredEvents} />
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#004B49]/5 text-[#004B49] flex items-center justify-center">
                          <BarChart3 size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">총 조회수</p>
                          <p className="text-xl font-bold text-slate-900">1,175 <span className="text-xs font-normal text-slate-400">회</span></p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-[#004B49] font-bold text-xs">
                          <TrendingUp size={12} />
                          12%
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Flag size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">참여 골프장</p>
                          <p className="text-xl font-bold text-slate-900">20 <span className="text-xs font-normal text-slate-400">곳</span></p>
                        </div>
                      </div>
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                          <Gift size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">전체 이벤트</p>
                          <p className="text-xl font-bold text-slate-900">{events.length} <span className="text-xs font-normal text-slate-400">건</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-slate-800">이벤트 목록</h2>
                            <span className="text-sm text-slate-400 font-medium">검색결과 {filteredEvents.length}건</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <select 
                                value={statusFilter}
                                onChange={(e) => {
                                  setStatusFilter(e.target.value);
                                  setCurrentPage(1);
                                }}
                                className="appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004B49]/20"
                              >
                                <option>전체 상태</option>
                                <option>발행</option>
                                <option>승인대기</option>
                                <option>거절</option>
                                <option>종료</option>
                              </select>
                              <ListFilter className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" size={14} />
                            </div>

                            <div className="relative flex-1 min-w-[200px]">
                              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                              <input 
                                type="text" 
                                placeholder="골프장, 제목 검색..." 
                                value={searchTerm}
                                onChange={(e) => {
                                  setSearchTerm(e.target.value);
                                  setCurrentPage(1);
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B49]/20 placeholder-slate-400"
                              />
                            </div>
                            
                            <button 
                              onClick={handleAddNew}
                              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-orange-500/20 shrink-0"
                            >
                              <Plus size={16} />
                              이벤트 등록
                            </button>
                          </div>
                        </div>

                        <div className="flex border-b border-slate-100 -mb-6">
                          <button 
                            onClick={() => {
                              setTypeTab('ALL');
                              setCurrentPage(1);
                            }}
                            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 relative ${typeTab === 'ALL' ? 'text-[#004B49] border-[#004B49]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                          >
                            전체
                            {typeTab === 'ALL' && <div className="absolute inset-x-0 -bottom-px h-0.5 bg-[#004B49]"></div>}
                          </button>
                          <button 
                            onClick={() => {
                              setTypeTab(EventType.EVENT);
                              setCurrentPage(1);
                            }}
                            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 relative flex items-center gap-2 ${typeTab === EventType.EVENT ? 'text-[#004B49] border-[#004B49]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                          >
                            <LayoutGrid size={16} />
                            이벤트
                            {typeTab === EventType.EVENT && <div className="absolute inset-x-0 -bottom-px h-0.5 bg-[#004B49]"></div>}
                          </button>
                          <button 
                            onClick={() => {
                              setTypeTab(EventType.DISCOUNT);
                              setCurrentPage(1);
                            }}
                            className={`px-6 py-3 text-sm font-bold transition-all border-b-2 relative flex items-center gap-2 ${typeTab === EventType.DISCOUNT ? 'text-[#004B49] border-[#004B49]' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                          >
                            <Ticket size={16} />
                            그린피 할인
                            {typeTab === EventType.DISCOUNT && <div className="absolute inset-x-0 -bottom-px h-0.5 bg-[#004B49]"></div>}
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              <th className="px-6 py-4 border-b border-slate-100 w-12 text-center">NO</th>
                              <th className="px-6 py-4 border-b border-slate-100">골프장</th>
                              <th className="px-6 py-4 border-b border-slate-100">이벤트 정보</th>
                              <th className="px-6 py-4 border-b border-slate-100 text-center">유형</th>
                              <th className="px-6 py-4 border-b border-slate-100 text-center">상태</th>
                              <th className="px-6 py-4 border-b border-slate-100">이벤트 기간</th>
                              <th className="px-6 py-4 border-b border-slate-100 text-center">관리</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {pagedEvents.length > 0 ? (
                              pagedEvents.map((item, idx) => (
                                <tr 
                                  key={item.id} 
                                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                                  onClick={() => handleEdit(item)}
                                >
                                  <td className="px-6 py-4 text-xs text-slate-400 text-center">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                  <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-[#004B49] bg-[#004B49]/5 px-2 py-1 rounded">
                                      {item.golfCourse}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="min-w-0">
                                      <p className="text-sm font-bold text-slate-800 truncate mb-0.5">{item.title}</p>
                                      <p className="text-xs text-slate-500 truncate">{item.content}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-[11px] font-medium text-slate-900">{item.type}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(item.status)}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[11px] text-slate-600 font-medium">시작: {item.startDate}</span>
                                      <span className="text-[11px] text-slate-400">종료: {item.endDate}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        onClick={() => handleEdit(item)}
                                        title="수정"
                                        className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:text-[#004B49] hover:border-[#004B49]/30 transition-colors"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button 
                                        onClick={() => openConfirmModal('END', item.id)}
                                        disabled={item.status === EventStatus.ENDED}
                                        title="발행 중단"
                                        className={`p-1.5 rounded border transition-colors ${item.status === EventStatus.ENDED ? 'bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200'}`}
                                      >
                                        <XCircle size={14} />
                                      </button>
                                      <button 
                                        onClick={() => openConfirmModal('DELETE', item.id)}
                                        title="삭제"
                                        className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 text-sm">
                                  해당 조건의 이벤트가 존재하지 않습니다.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">표시 데이터 {filteredEvents.length > 0 ? `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}` : '0-0'}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`p-2 rounded hover:bg-slate-100 text-slate-400 ${currentPage === 1 && 'opacity-30 cursor-not-allowed'}`}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <button 
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-8 h-8 rounded text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-[#004B49] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                              {i + 1}
                            </button>
                          ))}

                          <button 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`p-2 rounded hover:bg-slate-100 text-slate-400 ${(currentPage === totalPages || totalPages === 0) && 'opacity-30 cursor-not-allowed'}`}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EventCreate 
                onBack={() => { setView('list'); setEditingEvent(null); }} 
                onSuccess={handleCreateSuccess} 
                initialData={editingEvent || undefined}
              />
            )}
          </>
        )}

        {/* Module 2: Discount Reservation History */}
        {activeMenu === 'discount' && activeSubMenu === 'discount_history' && (
          <div className="max-w-full space-y-6 animate-in fade-in duration-300">
            {view === 'list' ? (
              <>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input type="text" placeholder="조회 시작일" className="bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm w-44 text-slate-900 placeholder-slate-400" />
                      <Calendar size={18} className="absolute right-3 top-2.5 text-slate-400" />
                    </div>
                    <span className="text-slate-400">~</span>
                    <div className="relative">
                      <input type="text" placeholder="조회 종료일" className="bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm w-44 text-slate-900 placeholder-slate-400" />
                      <Calendar size={18} className="absolute right-3 top-2.5 text-slate-400" />
                    </div>
                  </div>
                  
                  <button className="bg-[#004B49] text-white px-6 py-2.5 rounded-lg text-sm font-bold ml-1 hover:bg-[#003a38] transition-colors">조회하기</button>

                  <div className="ml-auto flex items-center gap-6">
                    <span className="text-sm text-slate-600 whitespace-nowrap">전체 <span className="font-bold text-[#004B49]">250</span>건</span>
                    <div className="relative">
                      <select className="appearance-none bg-white border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-xs font-medium text-slate-600 min-w-[120px]">
                        <option>20개씩 정렬</option>
                        <option>50개씩 정렬</option>
                        <option>100개씩 정렬</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] text-left border-collapse min-w-[1400px]">
                      <thead>
                        <tr className="bg-[#004B49] text-white font-bold">
                          <th className="px-4 py-4 text-center border-r border-[#005a58] w-14">NO</th>
                          <th className="px-4 py-4 border-r border-[#005a58]">골프장명</th>
                          <th className="px-4 py-4 border-r border-[#005a58]">코스명</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">예약일자</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">예약자명</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">연락처</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">인원</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">그린피</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">캐디피</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">카트피</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">신청일자</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">처리상태</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">취소기한</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">취소일자</th>
                          <th className="px-4 py-4 text-center">예약상세</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {MOCK_RESERVATIONS.map((res) => (
                          <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 text-center text-slate-500 font-medium">{res.id}</td>
                            <td className="px-4 py-4">
                              <span className="font-bold text-slate-800">{res.golfCourse}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{res.courseName}</td>
                            <td className="px-4 py-4 font-bold text-slate-800 text-center">
                              {res.reservationDate.split(' ')[0]}<br/>
                              <span className="text-[#007BFF] font-normal">{res.reservationDate.split(' ')[1]} {res.reservationTime}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-700 font-medium text-center">{res.userName}</td>
                            <td className="px-4 py-4 text-slate-500 text-center">{res.userPhone}</td>
                            <td className="px-4 py-4 text-center text-slate-600">{res.peopleCount}</td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-medium text-slate-900">{res.greenFee.toLocaleString()}</span>
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-red-500">{(res.greenFee * (1 - res.discountRate / 100)).toLocaleString()}</span>
                                  <span className="text-[10px] text-red-500 font-bold leading-none mt-0.5">(↓ {res.discountRate}%)</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center text-slate-600">{res.caddyFee.toLocaleString()}</td>
                            <td className="px-4 py-4 text-center text-slate-600">{res.cartFee.toLocaleString()}</td>
                            <td className="px-4 py-4 text-slate-500 text-center">
                              {res.requestDate.split(' ')[0]}<br/>
                              <span className="text-[11px]">{res.requestDate.split(' ').slice(1).join(' ')}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusBadgeClass(res.status)}`}>
                                {res.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-center">
                              {res.cancelLimitDate.split(' ')[0]}<br/>
                              <span className="text-[11px]">{res.cancelLimitDate.split(' ').slice(1).join(' ')}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-center">
                              {res.cancelDate.split(' ')[0]}<br/>
                              <span className="text-[11px] font-bold text-red-400">{res.cancelDate.split(' ').slice(1).join(' ')}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button 
                                onClick={() => handleDetailClick(res)}
                                className="p-1.5 rounded-full border border-[#007BFF]/40 text-[#007BFF] hover:bg-[#007BFF]/5 transition-colors"
                              >
                                <ArrowRight size={14} strokeWidth={3} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 border-t border-slate-100 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded text-slate-400 hover:bg-slate-100"><ChevronLeft size={16} /></button>
                      <button className="w-8 h-8 rounded bg-[#004B49] text-white text-sm font-bold">1</button>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">2</button>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">3</button>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">4</button>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">5</button>
                      <span className="px-2 text-slate-300">...</span>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">10</button>
                      <button className="p-2 rounded text-slate-400 hover:bg-slate-100"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-16 animate-in slide-in-from-right duration-300 relative">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setView('list')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm"
                  >
                    <ChevronLeft size={18} />
                    예약내역
                  </button>
                  
                  <div className="relative group">
                    <button className="flex items-center gap-2 border border-red-400 text-red-500 px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm">
                      <X size={14} />
                      예약취소
                    </button>
                    
                    <div className="absolute right-0 bottom-full mb-3 w-[260px] bg-slate-800 text-white text-[11px] p-3 rounded-xl shadow-xl z-50 invisible group-hover:visible animate-in fade-in zoom-in-95 duration-200 origin-bottom-right border border-slate-700/50">
                      <div className="flex gap-2">
                        <Info size={14} className="text-red-400 shrink-0" />
                        <p className="leading-relaxed font-medium">
                          * 골프장측에서 취소된 예약내역일 경우에만 예약취소처리
                        </p>
                      </div>
                      <div className="absolute -bottom-1 right-10 w-2 h-2 bg-slate-800 rotate-45 border-r border-b border-slate-700/50"></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-12 bg-white">
                  <div className="bg-[#004B49] text-white p-8 grid grid-cols-6 gap-6">
                    <div className="border-r border-[#005a58] pr-6">
                      <p className="text-[11px] opacity-70 mb-2">골프장명</p>
                      <p className="text-lg font-bold">{selectedReservation?.golfCourse}</p>
                    </div>
                    <div className="border-r border-[#005a58] pr-6">
                      <p className="text-[11px] opacity-70 mb-2">코스명</p>
                      <p className="text-lg font-bold">{selectedReservation?.courseName} (18홀)</p>
                    </div>
                    <div className="border-r border-[#005a58] pr-6">
                      <p className="text-[11px] opacity-70 mb-2">예약자명</p>
                      <p className="text-lg font-bold">{selectedReservation?.userName}</p>
                    </div>
                    <div className="border-r border-[#005a58] pr-6">
                      <p className="text-[11px] opacity-70 mb-2">예약인원</p>
                      <p className="text-lg font-bold">{selectedReservation?.peopleCount}</p>
                    </div>
                    <div className="border-r border-[#005a58] pr-6">
                      <p className="text-[11px] opacity-70 mb-2">라운드 일자</p>
                      <p className="text-lg font-bold">2025.06.07 (목) 17:00</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[11px] opacity-70 mb-2">처리상태</p>
                      <div className="flex">
                        <span className={`px-3 py-1 rounded-md text-sm font-bold border ${getStatusBadgeClass(selectedReservation!.status)}`}>
                          {selectedReservation?.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <span className="text-xs font-bold text-slate-800 w-24 shrink-0">취소기한</span>
                          <span className="text-xs text-slate-600">2025.06.02 (토) 13:00 <span className="text-[#007BFF] font-bold ml-1">(10일 남음)</span></span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-bold text-slate-800 w-24 shrink-0">예약자</span>
                          <span className="text-xs text-slate-600">김형주 <span className="ml-3">010-2586-9848</span></span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <span className="text-xs font-bold text-slate-800 w-24 shrink-0">그린피</span>
                          <span className="text-xs text-slate-600">140,000원 (1인)</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-bold text-slate-800 w-24 shrink-0">카트피</span>
                          <span className="text-xs text-slate-600">68,000원 (팀)</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs font-bold text-slate-800 w-24 shrink-0">캐디피</span>
                          <span className="text-xs text-slate-600">150,000원 (팀)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                      <XCircle size={18} className="text-slate-900" />
                      <span>골프장 취소 및 위약규정</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[300px]">
                      <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>저희 골프장에 찾아주신 여러분들 감사합니다.</p>
                        <p>현재 인천그랜드 골프장의 주차장 확장 공사로 인해, 임시 주차장이 운영되고 있습니다.</p>
                        <p>임시 주차장 주소는 골프장 정문으로부터 200m 거리에 있으며, 주차 안내 직원이 상주하고 있습니다. 불편하시더라도 양해 부탁드리며 빠른 시일내에 공사를 완료하겠습니다.</p>
                        <p>-인천그랜드 골프장-</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                      <AlertCircle size={18} className="text-slate-900" />
                      <span>기타 공지사항</span>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[300px]">
                      <div className="text-sm text-slate-600 leading-relaxed space-y-4">
                        <p>저희 골프장에 찾아주신 여러분들 감사합니다.</p>
                        <p>현재 인천그랜드 골프장의 주차장 확장 공사로 인해, 임시 주차장이 운영되고 있습니다.</p>
                        <p>임시 주차장 주소는 골프장 정문으로부터 200m 거리에 있으며, 주차 안내 직원이 상주하고 있습니다. 돌발적인 공사로 불편을 드려 죄송합니다.</p>
                        <p>주차 안내 직원이 상주하고 있습니다.</p>
                        <p>불편하시더라도 양해 부탁드리며 빠른 시일내에 공사를 완료하겠습니다.</p>
                        <p>-인천그랜드 골프장-</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Module 3: Discount Registration */}
        {activeMenu === 'discount' && activeSubMenu === 'discount_register' && (
          <div className="max-w-full space-y-6 animate-in fade-in duration-300">
            {view === 'list' ? (
              <>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input type="text" placeholder="조회 시작일" className="bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm w-44 text-slate-900 placeholder-slate-400" />
                      <Calendar size={18} className="absolute right-3 top-2.5 text-slate-400" />
                    </div>
                    <span className="text-slate-400">~</span>
                    <div className="relative">
                      <input type="text" placeholder="조회 종료일" className="bg-slate-50 border border-slate-200 rounded-lg pl-4 pr-10 py-2.5 text-sm w-44 text-slate-900 placeholder-slate-400" />
                      <Calendar size={18} className="absolute right-3 top-2.5 text-slate-400" />
                    </div>
                  </div>
                  
                  <button className="bg-[#004B49] text-white px-6 py-2.5 rounded-lg text-sm font-bold ml-1 hover:bg-[#003a38] transition-colors">조회하기</button>

                  {selectedDiscountIds.length > 0 && (
                    <button 
                      onClick={() => openConfirmModal('BATCH_DELETE')}
                      className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-red-500/10 ml-2 animate-in fade-in slide-in-from-left-4 duration-300"
                      style={{ backgroundColor: '#FF4949' }}
                    >
                      <Trash2 size={16} />
                      선택 삭제 {selectedDiscountIds.length}
                    </button>
                  )}

                  <div className="ml-auto flex items-center gap-4">
                    <button 
                      onClick={() => setView('register_form')}
                      className="flex items-center gap-2 bg-[#007BFF] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#0069d9] transition-colors shadow-lg shadow-[#007BFF]/20"
                    >
                      <Plus size={16} />
                      할인예약 등록
                    </button>
                    <span className="text-sm text-slate-600 whitespace-nowrap ml-2">전체 <span className="font-bold text-[#004B49]">{discountProducts.length}</span>건</span>
                    <div className="relative">
                      <select className="appearance-none bg-white border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-xs font-medium text-slate-600 min-w-[120px]">
                        <option>20개씩 정렬</option>
                        <option>50개씩 정렬</option>
                        <option>100개씩 정렬</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px] text-left border-collapse min-w-[1400px]">
                      <thead>
                        <tr className="bg-[#004B49] text-white font-bold">
                          <th className="px-4 py-4 text-center border-r border-[#005a58] w-12">
                            <div className="flex justify-center">
                              <CustomCheckbox 
                                checked={selectedDiscountIds.length === discountProducts.length && discountProducts.length > 0} 
                                onChange={toggleAllDiscountSelect} 
                              />
                            </div>
                          </th>
                          <th className="px-4 py-4 text-center border-r border-[#005a58] w-14">NO</th>
                          <th className="px-4 py-4 border-r border-[#005a58]">골프장명</th>
                          <th className="px-4 py-4 border-r border-[#005a58]">코스명</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">홀수</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">라운드일자</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">인원</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">그린피</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">캐디피</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">카트피</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">처리상태</th>
                          <th className="px-4 py-4 border-r border-[#005a58] text-center">취소기한</th>
                          <th className="px-4 py-4 text-center">등록상세</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {discountProducts.map((prod) => (
                          <tr 
                            key={prod.id} 
                            className={`transition-colors cursor-pointer ${selectedDiscountIds.includes(prod.id) ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                            onClick={() => toggleDiscountSelect(prod.id)}
                          >
                            <td className="px-4 py-4 text-center border-r border-slate-50">
                              <div className="flex justify-center">
                                <CustomCheckbox 
                                  checked={selectedDiscountIds.includes(prod.id)} 
                                  onChange={() => toggleDiscountSelect(prod.id)} 
                                />
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center text-slate-500 font-medium">{prod.id}</td>
                            <td className="px-4 py-4">
                              <span className="font-bold text-slate-800">{prod.golfCourse}</span>
                            </td>
                            <td className="px-4 py-4 text-slate-600">{prod.courseName}</td>
                            <td className="px-4 py-4 text-center text-slate-600 font-medium">{prod.holes}</td>
                            <td className="px-4 py-4 font-bold text-slate-800 text-center">
                              {prod.reservationDate.split(' ')[0]}<br/>
                              <span className="text-[#007BFF] font-normal">{prod.reservationDate.split(' ')[1]} {prod.reservationTime}</span>
                            </td>
                            <td className="px-4 py-4 text-center text-slate-600">{prod.peopleCount}</td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="font-medium text-slate-900">{prod.originalGreenFee.toLocaleString()}</span>
                                <div className="flex flex-col items-center">
                                  <span className="font-bold text-red-500">{prod.discountedPrice.toLocaleString()}</span>
                                  <span className="text-[10px] text-red-500 font-bold leading-none mt-0.5">(↓ {prod.discountRate}%)</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-center text-slate-600">{prod.caddyFee.toLocaleString()}</td>
                            <td className="px-4 py-4 text-center text-slate-600">{prod.cartFee.toLocaleString()}</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${getStatusBadgeClass(prod.status)}`}>
                                {prod.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-500 text-center">
                              {prod.cancelLimitDate.split(' ')[0]}<br/>
                              <span className="text-[11px]">{prod.cancelLimitDate.split(' ').slice(1).join(' ')}</span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button className="p-1.5 rounded-full border border-[#007BFF]/40 text-[#007BFF] hover:bg-[#007BFF]/5 transition-colors" onClick={(e) => e.stopPropagation()}>
                                <ArrowRight size={14} strokeWidth={3} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-8 border-t border-slate-100 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded text-slate-400 hover:bg-slate-100"><ChevronLeft size={16} /></button>
                      <button className="w-8 h-8 rounded bg-[#004B49] text-white text-sm font-bold">1</button>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">2</button>
                      <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-sm">3</button>
                      <button className="p-2 rounded text-slate-400 hover:bg-slate-100"><ChevronRight size={16} /></button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <ConfirmationModal 
          isOpen={modalConfig.isOpen}
          type={modalConfig.type}
          onClose={closeConfirmModal}
          onConfirm={handleConfirmAction}
        />
      </main>
    </div>
  );
};

export default App;
