
import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ArrowRight, 
  Plus, 
  FileText, 
  UserPlus, 
  ChevronRight,
  HelpCircle,
  FileSearch,
  Users,
  Clock,
  Ticket,
  CalendarDays,
  CalendarRange,
  Zap,
  Info,
  XCircle,
  ShieldCheck,
  Image as ImageIcon
} from 'lucide-react';
import { MOCK_GOLF_COURSES } from '../constants';
import { GolfCourseInfo } from '../types';

interface GolfCourseServiceProps {
  onRowClick: (course: GolfCourseInfo) => void;
  selectedCourse: GolfCourseInfo | null;
  view: 'list' | 'detail';
  onBackToList: () => void;
}

const GolfCourseList: React.FC<{ onRowClick: (course: GolfCourseInfo) => void }> = ({ onRowClick }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">골프장 서비스</span>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-800 font-bold">골프장 관리</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <HelpCircle size={14} />
            <span>이용 가이드</span>
            <div className="w-8 h-4 bg-slate-200 rounded-full relative">
              <div className="w-3 h-3 bg-white rounded-full absolute left-0.5 top-0.5 shadow-sm"></div>
            </div>
          </div>
          <button className="bg-[#004B49] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-[#004B49]/10">
            골프대행 계약서
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <p className="text-sm text-slate-500 font-bold">전체 <span className="text-[#004B49]">{MOCK_GOLF_COURSES.length + 559}</span>건</p>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-slate-600 min-w-[130px] focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 shadow-sm">
              <option>20개씩 정렬</option>
              <option>50개씩 정렬</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute right-4 top-3 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder="골프장명 검색" 
            className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 transition-all placeholder:text-slate-300 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-[#004B49] text-white text-[10px] font-bold uppercase tracking-wider">
                <th className="px-4 py-5 text-center w-14 border-r border-[#005a58]/50">NO <ChevronDown size={10} className="inline ml-1" /></th>
                <th className="px-4 py-5 border-r border-[#005a58]/50">클럽코드</th>
                <th className="px-4 py-5 border-r border-[#005a58]/50">골프장명</th>
                <th className="px-4 py-5 border-r border-[#005a58]/50">주소</th>
                <th className="px-4 py-5 border-r border-[#005a58]/50">대표전화</th>
                <th className="px-4 py-5 text-center border-r border-[#005a58]/50">실시간 <ChevronDown size={10} className="inline ml-1" /></th>
                <th className="px-4 py-5 text-center border-r border-[#005a58]/50">연단체 <ChevronDown size={10} className="inline ml-1" /></th>
                <th className="px-4 py-5 text-center border-r border-[#005a58]/50">월단체 <ChevronDown size={10} className="inline ml-1" /></th>
                <th className="px-4 py-5 border-r border-[#005a58]/50">계약상태</th>
                <th className="px-4 py-5 border-r border-[#005a58]/50">등록일자</th>
                <th className="px-4 py-5 text-center">골프장정보</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_GOLF_COURSES.map((course) => (
                <tr 
                  key={course.id} 
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => onRowClick(course)}
                >
                  <td className="px-4 py-4 text-center text-slate-400 font-medium text-[11px]">{course.id}</td>
                  <td className="px-4 py-4 text-slate-800 text-[12px] font-medium">{course.clubCode}</td>
                  <td className="px-4 py-4 font-bold text-slate-800 text-[12px]">{course.name}</td>
                  <td className="px-4 py-4 text-slate-500 text-[11px] truncate max-w-[200px]">{course.address}</td>
                  <td className="px-4 py-4 text-slate-500 text-[11px]">{course.phone}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-[10px] font-bold ${course.realtime === 'OPEN' ? 'text-cyan-400' : 'text-rose-400'}`}>{course.realtime}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-[10px] font-bold ${course.annual === 'OPEN' ? 'text-cyan-400' : 'text-rose-400'}`}>{course.annual}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-[10px] font-bold ${course.monthly === 'OPEN' ? 'text-cyan-400' : 'text-rose-400'}`}>{course.monthly}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-500 text-[11px]">-</td>
                  <td className="px-4 py-4 text-slate-400 text-[11px]">{course.regDate}</td>
                  <td className="px-4 py-4 text-center">
                    <button className="p-1.5 rounded-full border border-blue-200 text-blue-400 hover:bg-blue-400 hover:text-white transition-all">
                      <ChevronRight size={14} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const GolfCourseDetail: React.FC<{ course: GolfCourseInfo; onBack: () => void }> = ({ course, onBack }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">골프장 서비스</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-400 cursor-pointer hover:text-slate-600" onClick={onBack}>골프장 관리</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-bold">골프장 정보</span>
      </div>

      {/* Top Warning Banner */}
      <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-5 flex items-center justify-between overflow-hidden relative">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
            <Info size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">골프장 정보를 입력해주세요. <span className="text-[11px] text-slate-400 font-normal ml-2">담당자 정보 입력 시, 스타벅스 쿠폰☕ 지급</span></h3>
            <p className="text-[11px] text-slate-500 mt-0.5">실시간 예약 · 단체 예약 · 할인 예약 · 이벤트 홍보대행 등 더 많은 티샷 운영 서비스를 이용하실 수 있습니다.</p>
          </div>
        </div>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md shadow-orange-500/20 active:scale-95 z-10">
          정보 입력하기 <ChevronRight size={16} className="inline ml-1" />
        </button>
      </div>

      {/* Basic Info Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-slate-900 font-bold">
            <FileText size={18} />
            <h4 className="text-sm">골프장 기본정보</h4>
          </div>
          <button className="bg-[#004B49] text-white px-4 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-2">
            <Zap size={12} fill="white" /> 부킹등록
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-[#004B49] text-white p-6 grid grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] opacity-60">골프장명</p>
              <p className="text-sm font-bold">{course.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] opacity-60">주소지</p>
              <p className="text-sm font-bold">{course.address}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] opacity-60">홈페이지 주소</p>
              <p className="text-sm font-bold">{course.homepage}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] opacity-60">이메일</p>
              <p className="text-sm font-bold">{course.email}</p>
            </div>
          </div>
          <div className="p-8 flex gap-12">
            <div className="w-[400px] h-[220px] rounded-xl overflow-hidden bg-slate-100 shadow-inner group relative">
              <img src={course.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Golf course" />
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-[#004B49] shadow-lg">
                   <ImageIcon size={20} />
                 </button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-y-10">
              <div>
                <p className="text-[10px] text-slate-400 mb-1">대표전화</p>
                <p className="text-sm font-bold text-slate-800">{course.phone}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">예약부서 연락처</p>
                <p className="text-sm font-bold text-slate-800">{course.reservationPhone}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">팩스번호</p>
                <p className="text-sm font-bold text-slate-800">{course.fax}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">은행명</p>
                <p className="text-sm font-bold text-slate-800">{course.bank}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">계좌번호</p>
                <p className="text-sm font-bold text-slate-800">{course.accountNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">예금주</p>
                <p className="text-sm font-bold text-slate-800">{course.accountHolder}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Info Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold px-1">
          <FileSearch size={18} />
          <h4 className="text-sm">골프장 세부정보</h4>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-10">
          <div className="space-y-6">
             <h5 className="text-[12px] font-bold text-slate-900">골프장 담당자 정보</h5>
             <div className="flex gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 w-56 flex flex-col gap-1 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-blue-50 rounded-full transition-transform group-hover:scale-110"></div>
                   <p className="text-[10px] text-slate-400">예약담당자 이름</p>
                   <p className="text-sm font-bold text-slate-800 mb-2">김명섭</p>
                   <p className="text-[10px] text-slate-400">예약담당자 휴대폰</p>
                   <p className="text-sm font-bold text-slate-800 mb-2">010-1234-5678</p>
                   <p className="text-[10px] text-slate-400">예약담당자 내선번호</p>
                   <p className="text-sm font-bold text-slate-800">02-1234-5678</p>
                </div>
                <button className="w-56 h-auto min-h-[160px] border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-3 bg-blue-50/20 hover:bg-blue-50 transition-colors group">
                   <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Plus size={20} />
                   </div>
                   <span className="text-xs font-bold text-blue-500">담당자 추가</span>
                </button>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h5 className="text-[12px] font-bold text-slate-900">티샷 담당자 정보</h5>
                <p className="text-[10px] text-slate-400">*관리자 서비스 관련 문의는 아래 티샷 담당자 정보로 연락주세요.</p>
             </div>
             <div className="grid grid-cols-6 gap-4">
                {[
                  { label: '대표전화', name: '02-2277-3489', color: 'bg-slate-50 border-slate-100' },
                  { label: '대표팀 이름', name: '정봉훈', phone: '010-7301-3489', color: 'bg-emerald-50/50 border-emerald-100' },
                  { label: '마케팅팀 이름', name: '장종후', phone: '010-8977-6864', color: 'bg-emerald-50/50 border-emerald-100' },
                  { label: '개발팀(백엔드) 이름', name: '서준호', phone: '010-8255-6595', color: 'bg-emerald-50/50 border-emerald-100' },
                  { label: '개발팀(프론트) 이름', name: '김나영', phone: '010-9961-5320', color: 'bg-emerald-50/50 border-emerald-100' },
                  { label: '디자인팀 이름', name: '신희엽', phone: '010-3220-0959', color: 'bg-emerald-50/50 border-emerald-100' },
                ].map((item, idx) => (
                  <div key={idx} className={`${item.color} border rounded-xl p-4 flex flex-col gap-1`}>
                    <p className="text-[9px] text-slate-400">{item.label}</p>
                    <p className="text-xs font-bold text-slate-800">{item.name}</p>
                    {item.phone && <p className="text-[10px] font-bold text-slate-700 mt-1">{item.phone}</p>}
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-4 gap-8 pt-6 border-t border-slate-100">
             <div className="space-y-5">
                <p className="text-[11px] font-bold text-slate-900">예약관리</p>
                <div className="space-y-4">
                   {[
                     { label: '실시간 예약', status: 'CLOSE', icon: <Clock size={16} /> },
                     { label: '할인 예약', status: 'CLOSE', icon: <Ticket size={16} /> },
                     { label: '월단체 예약', status: 'CLOSE', icon: <CalendarRange size={16} /> },
                     { label: '연단체 예약', status: 'CLOSE', icon: <CalendarDays size={16} /> },
                     { label: '비딩', status: 'CLOSE', icon: <Users size={16} /> },
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                           {item.icon}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] text-slate-400 leading-none mb-1">{item.label}</span>
                           <span className="text-xs font-bold text-slate-800 leading-none">{item.status}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="space-y-5">
                <p className="text-[11px] font-bold text-slate-900">코스관리</p>
                <div className="space-y-5">
                   {[
                     { label: '운영 유형', value: '대중제' },
                     { label: '홀수', value: '18홀' },
                     { label: '코스 1', value: '레이크' },
                     { label: '코스 2', value: '마운틴' },
                     { label: '코스 3', value: '썬' },
                   ].map((item, idx) => (
                     <div key={idx} className="flex flex-col gap-1">
                        <p className="text-[10px] text-slate-400">{item.label}</p>
                        <p className="text-xs font-bold text-slate-800">{item.value}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="space-y-5">
                <p className="text-[11px] font-bold text-slate-900">이용요금</p>
                <div className="space-y-5">
                   {[
                     { label: '캐디피', value: '100,000' },
                     { label: '카트피', value: '90,000' },
                   ].map((item, idx) => (
                     <div key={idx} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                           <p className="text-[10px] text-slate-400">{item.label}</p>
                        </div>
                        <p className="text-xs font-bold text-slate-800 pl-4">{item.value}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="space-y-5">
                <p className="text-[11px] font-bold text-slate-900">공지배너</p>
                <div className="flex gap-3">
                   <div className="w-32 h-44 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group cursor-zoom-in">
                      <img src="https://picsum.photos/seed/notice1/200/300" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Notice" />
                   </div>
                   <div className="w-32 h-44 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group cursor-zoom-in">
                      <img src="https://picsum.photos/seed/notice2/200/300" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Notice" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Policy Sections */}
      <div className="space-y-6">
        {[
          { label: '연 단체팀 이용수칙', icon: <CalendarDays size={18} /> },
          { label: '취소 및 위약규정', icon: <XCircle size={18} /> },
          { label: '개인정보 처리방침', icon: <ShieldCheck size={18} /> },
        ].map((item, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold px-1">
              {item.icon}
              <h4 className="text-sm">{item.label}</h4>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm min-h-[160px] flex items-center justify-center text-slate-300 italic text-sm">
              내용이 등록되지 않았습니다.
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GolfCourseService: React.FC<GolfCourseServiceProps> = ({ onRowClick, selectedCourse, view, onBackToList }) => {
  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      {view === 'list' ? (
        <GolfCourseList onRowClick={onRowClick} />
      ) : selectedCourse ? (
        <GolfCourseDetail course={selectedCourse} onBack={onBackToList} />
      ) : null}
    </div>
  );
};

export default GolfCourseService;
