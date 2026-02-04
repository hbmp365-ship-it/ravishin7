
import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Users, 
  CircleDashed, 
  Check, 
  ChevronDown, 
  Download 
} from 'lucide-react';

interface ERPIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ERPIntegrationModal: React.FC<ERPIntegrationModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isDocsExpanded, setIsDocsExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#004B49] flex items-center justify-center text-white">
              <FileText size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">실시간 ERP 연동 신청</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step === 'form' ? (
            <div className="space-y-10">
              <div className="flex items-center justify-center gap-12 relative py-4">
                <div className="absolute top-[34px] left-12 right-12 h-px bg-slate-100 -z-10"></div>
                {[
                  { id: 1, label: '정보 입력', icon: <FileText size={16} />, active: true },
                  { id: 2, label: 'ERP 업체 협의', icon: <Users size={16} />, active: false },
                  { id: 3, label: '연동 개발', icon: <CircleDashed size={16} />, active: false },
                  { id: 4, label: '최종 오픈', icon: <Check size={16} />, active: false },
                ].map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${s.active ? 'bg-[#004B49] border-[#004B49] text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}>
                      {s.icon}
                    </div>
                    <span className={`text-[10px] font-bold ${s.active ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl border transition-all duration-300 ${isDocsExpanded ? 'border-blue-500/30 bg-blue-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                <button onClick={() => setIsDocsExpanded(!isDocsExpanded)} className="w-full px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-blue-500" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-800">회사소개 및 내부 품의용 자료</p>
                      <p className="text-[11px] text-slate-400">품의에 필요한 4종의 서류를 다운로드할 수 있습니다.</p>
                    </div>
                  </div>
                  <ChevronDown className={`text-slate-400 transition-transform duration-300 ${isDocsExpanded ? 'rotate-180' : ''}`} size={18} />
                </button>
                {isDocsExpanded && (
                  <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in zoom-in-95 duration-200">
                    {['회사소개서', '법인등본', '사업자등록', '연구소인정서'].map((doc) => (
                      <div key={doc} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-all cursor-pointer">
                        <span className="text-[10px] font-bold text-slate-700">{doc}</span>
                        <Download size={14} className="text-slate-300 group-hover:text-blue-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-900 border-l-4 border-[#004B49] pl-2">ERP 연동 정보</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">사용 중인 ERP 업체명 <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="예: 무노스, 그린잇 등" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">ERP 업체 담당자 연락처</label>
                      <input type="text" placeholder="알고 계신 경우 입력해주세요" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 transition-all" />
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-900 border-l-4 border-slate-400 pl-2">골프장 담당자 정보</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">담당자 성함 <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="성함을 입력해주세요" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600">담당자 연락처 (알림용) <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="010-0000-0000" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#004B49]/10 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <Check size={18} className="text-[#004B49] mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">ERP 업체 협의 대행 및 처리에 동의합니다. (필수)</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">원활한 서비스 제공을 위해 귀 골프장의 ERP 업체와 기술 협의 및 테스트를 티샷이 대행하여 진행하는 것에 동의합니다.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-[#004B49] rounded-full flex items-center justify-center text-white shadow-xl">
                <Check size={40} strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">ERP 연동 신청이 완료되었습니다!</h3>
                <p className="text-sm text-slate-500">담당자가 확인 후 입력해주신 연락처로 안내 드릴 예정입니다.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-center bg-slate-50/30">
          {step === 'form' ? (
            <button 
              onClick={() => setStep('success')}
              className="w-full max-w-sm bg-[#004B49] hover:bg-[#003a38] text-white py-4 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]"
            >
              연동 신청하기
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="w-full max-w-sm bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-xl font-bold transition-all"
            >
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ERPIntegrationModal;
