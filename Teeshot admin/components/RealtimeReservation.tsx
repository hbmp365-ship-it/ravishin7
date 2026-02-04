
import React, { useState } from 'react';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  ArrowRight
} from 'lucide-react';
import { MOCK_RESERVATIONS } from '../constants';
import ERPIntegrationModal from './ERPIntegrationModal';

const RealtimeReservation: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Banner matched to screenshot with updated text */}
      <div className="bg-white rounded-2xl border border-orange-200 shadow-lg shadow-orange-500/5 p-8 flex items-center justify-between overflow-hidden relative">
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">실시간 예약 ERP 연동하고, 30만 골퍼에게 예약을 노출시켜보세요.</h2>
          <p className="text-slate-500 text-sm font-medium">티샷 예약이 기존 ERP에 자동 반영되어 티타임 판매율은 늘고, 예약 관리는 쉬워집니다.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-orange-500/20 active:scale-95 z-10"
        >
          ERP 연동하기 <ChevronRight size={18} strokeWidth={3} />
        </button>
        {/* Subtle decorative background element */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-orange-50/30 rounded-full"></div>
      </div>

      {/* Filter Area matched to screenshot spacing */}
      <div className="flex items-center justify-between px-2">
        <div className="relative w-80">
          <Search className="absolute left-4 top-3 text-slate-300" size={16} />
          <input 
            type="text" 
            placeholder="골프장명, 신청자명 검색" 
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="flex items-center gap-6">
          <p className="text-sm text-slate-500 font-bold">전체 <span className="text-[#004B49]">250</span>건</p>
          <div className="relative">
            <select className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-slate-600 min-w-[130px] focus:outline-none focus:ring-2 focus:ring-[#004B49]/10">
              <option>20개씩 정렬</option>
              <option>50개씩 정렬</option>
              <option>100개씩 정렬</option>
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table matched to screenshot styling */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-[#004B49] text-white">
                <th className="px-4 py-5 text-center text-[10px] font-bold uppercase tracking-wider w-14 border-r border-[#005a58]/50">NO</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider border-r border-[#005a58]/50">골프장명</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider border-r border-[#005a58]/50">코스명</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">예약일자</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">예약자명</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">연락처</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">인원</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">그린피</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">캐디피</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">카트피</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">신청일자</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">처리상태</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">취소기한</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center border-r border-[#005a58]/50">취소일자</th>
                <th className="px-4 py-5 text-[10px] font-bold uppercase tracking-wider text-center">예약상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_RESERVATIONS.slice(0, 5).map((res) => (
                <tr key={res.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4 text-center text-slate-400 font-medium text-[11px]">{res.id}</td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-slate-800 text-[12px]">{res.golfCourse}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 text-[12px] font-medium">{res.courseName}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800">25.06.25 (수)</span>
                      <span className="text-[10px] text-slate-400">09:40</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-700 font-bold text-[12px]">{res.userName}</td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium text-[11px]">{res.userPhone}</td>
                  <td className="px-4 py-4 text-center text-slate-600 font-medium text-[11px]">{res.peopleCount}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-slate-800">{res.greenFee.toLocaleString()}</span>
                      {res.discountRate > 0 && <span className="text-[9px] text-red-500 font-bold">↓ {res.discountRate}%</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-600 text-[11px]">{res.caddyFee.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center text-slate-600 text-[11px]">{res.cartFee.toLocaleString()}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-800">25.06.25 (수)</span>
                      <span className="text-[10px] text-slate-400">09:40</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      res.status.includes('취소') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-blue-50 text-blue-500 border border-blue-100'
                    }`}>
                      {res.status === '예약취소' ? '취소' : '예약'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-slate-800">25.06.25 (수)</span>
                      <span className="text-[10px] text-slate-400">17:00</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-slate-800">25.06.25 (수)</span>
                      <span className="text-[10px] text-slate-400">09:40</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button className="p-1.5 rounded-full border border-blue-200 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm">
                      <ArrowRight size={14} strokeWidth={3} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ERPIntegrationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default RealtimeReservation;
