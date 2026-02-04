
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  ChevronDown, 
  Calendar, 
  Clock, 
  Info,
  FileText,
  Trash2,
  Check
} from 'lucide-react';
import { DiscountProduct, DiscountProductStatus } from '../types';

interface DiscountCreateProps {
  onBack: () => void;
  onSuccess: (product: DiscountProduct) => void;
}

const DiscountCreate: React.FC<DiscountCreateProps> = ({ onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    golfCourse: '',
    courseName: '',
    holes: '18홀',
    minPeople: '4인',
    startDate: '',
    endDate: '',
    noCancel: false,
    cancelDays: '00',
    cancelTime: '00',
    startTime: '00:00',
    endTime: '00:00',
    interval: '6분',
    discountPrice: '',
    originalPrice: '',
    caddyFee: '',
    cartFee: '',
    condition: '',
    benefit: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const originalPriceNum = parseInt(formData.originalPrice.replace(/,/g, '')) || 0;
    const discountedPriceNum = parseInt(formData.discountPrice.replace(/,/g, '')) || 0;
    const discountRate = originalPriceNum > 0 ? Math.round(((originalPriceNum - discountedPriceNum) / originalPriceNum) * 100) : 0;

    const newProduct: DiscountProduct = {
      id: Math.floor(Math.random() * 1000).toString(),
      golfCourse: formData.golfCourse || '선택안함',
      courseName: formData.courseName || '코스명 미입력',
      holes: formData.holes,
      reservationDate: formData.startDate || '25.06.25 (수)',
      reservationTime: formData.startTime,
      peopleCount: formData.minPeople + '이상',
      originalGreenFee: originalPriceNum,
      discountedPrice: discountedPriceNum,
      discountRate: discountRate,
      caddyFee: parseInt(formData.caddyFee.replace(/,/g, '')) || 120000,
      cartFee: parseInt(formData.cartFee.replace(/,/g, '')) || 150000,
      status: DiscountProductStatus.AVAILABLE,
      cancelLimitDate: `${formData.startDate} ${formData.cancelTime}:00`,
      minPeople: formData.minPeople,
      benefits: formData.benefit
    };

    onSuccess(newProduct);
  };

  const InputField = ({ label, placeholder, value, onChange, type = "text" }: any) => (
    <div className="flex flex-col gap-2 flex-1 min-w-[120px]">
      <label className="text-[11px] font-bold text-black">{label}</label>
      <input 
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#004B49] text-black font-medium placeholder-slate-300"
      />
    </div>
  );

  const SelectField = ({ label, value, options, onChange }: any) => (
    <div className="flex flex-col gap-2 flex-1 min-w-[120px]">
      <label className="text-[11px] font-bold text-black">{label}</label>
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-white border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#004B49] transition-all ${!value || value.includes('선택') || value.includes('검색') ? 'text-slate-300' : 'text-black font-bold'}`}
        >
          {options.map((opt: string) => <option key={opt} value={opt} className={opt.includes('선택') || opt.includes('검색') ? 'text-slate-300' : 'text-black font-bold'}>{opt}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-2.5 text-slate-300 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-black transition-colors font-bold text-sm"
        >
          <ChevronLeft size={18} />
          할인등록
        </button>
      </div>

      {/* Main Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-black" />
          <h2 className="text-lg font-bold text-black">할인예약 등록</h2>
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-[#004B49] hover:bg-[#003a38] text-white px-5 py-2 rounded-md text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus size={16} />
          할인예약 생성
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
        <div className="p-10 space-y-8">
          <div className="flex flex-wrap gap-4">
            <SelectField label="골프장명" value={formData.golfCourse} onChange={(v: any) => setFormData({...formData, golfCourse: v})} options={['골프장명 검색', '블랙스톤벨포레', '몽베르CC', '블루원상주', '인천그랜드']} />
            <InputField label="코스명" placeholder="코스명 입력" value={formData.courseName} onChange={(v: any) => setFormData({...formData, courseName: v})} />
            <SelectField label="홀수" value={formData.holes} onChange={(v: any) => setFormData({...formData, holes: v})} options={['18홀', '9홀', '27홀', '36홀']} />
            <SelectField label="최소인원" value={formData.minPeople} onChange={(v: any) => setFormData({...formData, minPeople: v})} options={['4인', '3인', '2인']} />
            <div className="flex flex-col gap-2 min-w-[280px]">
              <label className="text-[11px] font-bold text-black">라운드 일자</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input type="text" placeholder="연도. 월. 일." value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-black font-medium placeholder-slate-300" />
                  <Calendar size={14} className="absolute right-2 top-2.5 text-slate-300" />
                </div>
                <span className="text-slate-400">~</span>
                <div className="relative flex-1">
                  <input type="text" placeholder="연도. 월. 일." value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-black font-medium placeholder-slate-300" />
                  <Calendar size={14} className="absolute right-2 top-2.5 text-slate-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountCreate;
