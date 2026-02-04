
import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface ManagerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  golfCourseName: string;
}

const ManagerInfoModal: React.FC<ManagerInfoModalProps> = ({ isOpen, onClose, onConfirm, golfCourseName }) => {
  const [formData, setFormData] = useState({
    role: '예약담당자',
    name: '',
    phone: '',
    extension: '',
    email: ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-[480px] bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-10">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-slate-900 leading-[1.3] tracking-tight">
              {golfCourseName} 담당자님,<br />
              우리 <span className="text-blue-600">골프장 정보</span> 입력하셨나요?
            </h2>
            <p className="text-slate-500 mt-3 text-base font-medium">
              지금 담당자 정보를 입력하면, 스타벅스 쿠폰☕ 지급!
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">담당 업무</label>
              <div className="relative">
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full appearance-none bg-white border-2 border-blue-500 rounded-xl px-4 py-3.5 text-base font-bold text-slate-800 focus:outline-none"
                >
                  <option>예약담당자</option>
                  <option>마케팅담당자</option>
                  <option>운영담당자</option>
                </select>
                <ChevronDown size={20} className="absolute right-4 top-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">이름</label>
              <input 
                type="text"
                placeholder="이름을 입력해주세요"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white border-2 border-blue-500 rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 placeholder-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">휴대폰 연락처</label>
              <input 
                type="text"
                placeholder="010.0000.0000"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-white border-2 border-blue-500 rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 placeholder-slate-300 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 flex items-center gap-1">
                내선 전화번호 <span className="text-slate-300 font-normal">(선택)</span>
              </label>
              <input 
                type="text"
                placeholder="내선 전화번호를 입력해주세요."
                value={formData.extension}
                onChange={(e) => setFormData({...formData, extension: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 flex items-center gap-1">
                이메일 <span className="text-slate-300 font-normal">(선택)</span>
              </label>
              <input 
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Starbucks Text */}
          <div className="mt-8 mb-8 text-center">
            <p className="text-blue-600 font-bold text-base">스타벅스 커피 쿠폰☕ 지급!</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 rounded-xl border border-slate-300 text-lg font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              다음에
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-4 px-6 rounded-xl bg-[#a0b4f8] text-white text-lg font-bold shadow-lg shadow-blue-500/10 hover:brightness-105 active:scale-[0.98] transition-all"
            >
              등록하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerInfoModal;
