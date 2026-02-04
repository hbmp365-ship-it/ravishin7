
import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Plus
} from 'lucide-react';
import { MOCK_ANNUAL_GROUPS } from '../constants';

const AnnualGroupReservation: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['584', '583', '582', '581']);
  const [activeTab, setActiveTab] = useState('전체보기');

  const tabs = [
    { label: '전체보기', count: 200 },
    { label: '예약신청', count: 116 },
    { label: '신청승낙', count: 52 },
    { label: '예약확정', count: 32 },
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-[10px] font-bold border text-center min-w-[70px]";
    switch (status) {
      case '예약신청': return `${baseClasses} bg-[#007BFF] text-white border-[#007BFF]`;
      case '예약확정': return `${baseClasses} bg-[#28A745] text-white border-[#28A745]`;
      case '신청승낙': return `${baseClasses} bg-[#FD7E14] text-white border-[#FD7E14]`;
      case '신청거절': return `${baseClasses} bg-white text-[#333] border-slate-300`;
      case '신청취소': return `${baseClasses} bg-white text-[#333] border-slate-300`;
      case '미선정': return `${baseClasses} bg-[#F1F3F5] text-[#868E96] border-[#DEE2E6]`;
      case '계약만료': return `${baseClasses} bg-[#F1F3F5] text-[#868E96] border-[#DEE2E6]`;
      default: return `${baseClasses} bg-slate-50 text-slate-500 border-slate-200`;
    }
  };

  return (
    <div className="max-w-full space-y-6 animate-in fade-in duration-500">
      {/* Tab Header Area */}
      <div className="flex items-end justify-between border-b border-slate-200 bg-white pt-4">
        <div className="flex items-center px-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`px-5 py-4 text-sm font-bold relative transition-all flex items-center gap-2 ${
                activeTab === tab.label 
                  ? 'text-[#004B49]' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded font-black ${
                activeTab === tab.label ? 'bg-[#004B49] text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.label && (
                <div className="absolute inset-x-0 bottom-0 h-[3px] bg-[#004B49]"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 pb-3">
          <button className="flex items-center gap-2 bg-[#007BFF] text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-[#007BFF]/20 hover:bg-[#0069d9] transition-all">
            <Download size={16} />
            신청서 다운 (4)
          </button>
          
          <div className="relative">
            <button className="flex items-center gap-6 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-4 py-2.5 rounded-lg">
              20개씩 정렬 <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden min-w-[320px]">
            <input 
              type="text" 
              placeholder="골프장명, 단체명 검색" 
              className="px-4 py-2.5 text-xs w-full focus:outline-none placeholder:text-slate-300"
            />
            <button className="p-2.5 text-slate-400 border-l border-slate-100 bg-white">
              <Search size={16} />
            </button>
          </div>

          <div className="relative">
             <button className="flex items-center gap-8 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-4 py-2.5 rounded-lg min-w-[120px] justify-between">
              전체내역 <ChevronDown size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1400px] table-fixed">
            <thead>
              <tr className="bg-[#004B49] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="w-12 px-4 py-5 border-r border-[#005a58]/50 text-center">
                   <div className="flex justify-center items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 bg-white checked:bg-blue-500" 
                      checked={selectedIds.length === MOCK_ANNUAL_GROUPS.length} 
                      readOnly 
                    />
                  </div>
                </th>
                <th className="w-14 px-4 py-5 border-r border-[#005a58]/50 text-center">NO</th>
                <th className="w-[12%] px-4 py-5 border-r border-[#005a58]/50">골프장명</th>
                <th className="w-[12%] px-4 py-5 border-r border-[#005a58]/50">단체명</th>
                <th className="w-20 px-4 py-5 border-r border-[#005a58]/50 text-center">신청팀 수</th>
                <th className="w-24 px-4 py-5 border-r border-[#005a58]/50 text-center">신청자명</th>
                <th className="w-32 px-4 py-5 border-r border-[#005a58]/50 text-center">연락처</th>
                <th className="w-[10%] px-4 py-5 border-r border-[#005a58]/50 text-center">신청일자</th>
                <th className="w-24 px-4 py-5 border-r border-[#005a58]/50 text-center">처리자</th>
                <th className="w-[10%] px-4 py-5 border-r border-[#005a58]/50 text-center">처리일자</th>
                <th className="w-[10%] px-4 py-5 text-center">처리상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_ANNUAL_GROUPS.map((item) => (
                <tr 
                  key={item.id} 
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedIds.includes(item.id) ? 'bg-[#EBF5FF]' : ''}`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <td className="px-4 py-4 text-center border-r border-slate-50">
                    <div className="flex justify-center items-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 accent-[#007BFF]" 
                        checked={selectedIds.includes(item.id)} 
                        onChange={() => {}} 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium text-[12px] border-r border-slate-50">{item.id}</td>
                  <td className="px-4 py-4 border-r border-slate-50">
                    <span className="font-bold text-slate-800 text-[12px] truncate block">{item.golfCourse}</span>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-50">
                    <span className="font-bold text-slate-800 text-[12px] truncate block">{item.groupName}</span>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-700 text-[12px] border-r border-slate-50">{item.teamCount}</td>
                  <td className="px-4 py-4 text-center border-r border-slate-50">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[12px] font-bold text-slate-800">{item.applicantName}</span>
                      <span className="w-4 h-4 flex items-center justify-center bg-[#EBF5FF] text-[#007BFF] rounded-sm text-[10px] font-black border border-[#CCE5FF]">S</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium text-[12px] border-r border-slate-50">{item.contact}</td>
                  <td className="px-4 py-4 text-center border-r border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-slate-800">{item.applyDate.split(' ')[0]} {item.applyDate.split(' ')[1]}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{item.applyDate.split(' ')[2]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-slate-500 font-medium text-[12px] border-r border-slate-50">{item.processor}</td>
                  <td className="px-4 py-4 text-center border-r border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-slate-800">{item.processDate.split(' ')[0]} {item.processDate.split(' ')[1]}</span>
                      <span className="text-[11px] text-slate-400 font-medium">{item.processDate.split(' ')[2]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center">
                      <span className={getStatusBadge(item.status)}>{item.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div className="p-10 border-t border-slate-100 flex items-center justify-center bg-slate-50/20">
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded text-slate-400 hover:bg-slate-200 transition-colors"><ChevronLeft size={18} /></button>
            <button className="w-8 h-8 rounded bg-[#004B49] text-white text-xs font-bold shadow-md">1</button>
            <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">2</button>
            <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">3</button>
            <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">4</button>
            <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">5</button>
            <span className="px-2 text-slate-300">...</span>
            <button className="w-8 h-8 rounded hover:bg-slate-100 text-slate-600 text-xs font-bold">10</button>
            <button className="p-2 rounded text-slate-400 hover:bg-slate-200 transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualGroupReservation;
