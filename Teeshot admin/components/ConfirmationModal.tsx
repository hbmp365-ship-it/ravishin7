import React from 'react';
import { XCircle, Trash2, X, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  type: 'END' | 'DELETE' | 'BATCH_DELETE';
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, type, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const isEnd = type === 'END';
  const isDelete = type === 'DELETE' || type === 'BATCH_DELETE';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 origin-center border border-slate-100">
        <div className="p-8 text-center">
          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border">
            {isEnd ? (
              <div className="bg-orange-50 text-orange-500 w-full h-full flex items-center justify-center rounded-2xl">
                <AlertCircle size={32} />
              </div>
            ) : (
              <div className="bg-red-50 text-red-500 w-full h-full flex items-center justify-center rounded-2xl">
                <Trash2 size={32} />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {isEnd ? '이벤트 발행 중단' : (type === 'BATCH_DELETE' ? '선택 항목 삭제' : '이벤트 삭제')}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-8 px-4">
            {isEnd 
              ? '정말로 해당 이벤트를 발행 중단하시겠습니까?\n중단된 이벤트는 앱에서 더 이상 노출되지 않습니다.'
              : (type === 'BATCH_DELETE' 
                ? '선택하신 모든 항목을 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.'
                : '해당 이벤트를 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.')}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                isEnd 
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' 
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              }`}
            >
              {isEnd ? '발행 중단하기' : '삭제하기'}
            </button>
          </div>
        </div>

        {/* Close Button Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-full hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;