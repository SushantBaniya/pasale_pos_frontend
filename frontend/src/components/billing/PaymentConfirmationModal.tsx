import React, { useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  status: 'success' | 'failure';
  amount: number;
  method: string;
  message?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  status,
  amount,
  method,
  message,
  onClose,
  onRetry,
}) => {
  // Auto-close on success after 2.5s
  useEffect(() => {
    if (isOpen && status === 'success') {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-[#15161C] w-full max-w-sm rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36] overflow-hidden"
        style={{ animation: 'paymentModalIn 0.3s ease-out' }}
      >
        {/* Close button */}
        <div className="flex justify-end p-3 pb-0">
          <button
            onClick={onClose}
            className="p-1.5 text-[#94A3B8] hover:text-[#111827] dark:hover:text-white rounded-full hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors border-none cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center">
          {status === 'success' ? (
            <>
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F0FDF4] dark:bg-[#22C55E]/10 flex items-center justify-center"
                style={{ animation: 'paymentIconPop 0.4s ease-out 0.1s both' }}
              >
                <FiCheckCircle size={32} className="text-[#22C55E]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827] dark:text-[#EAE5DF] mb-1">Payment Recorded</h3>
              <p className="text-[13px] text-[#94A3B8] mb-3">
                Rs {amount.toLocaleString()} via {method}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] dark:bg-[#22C55E]/10 rounded-full">
                <span className="w-2 h-2 bg-[#22C55E] rounded-full" style={{ animation: 'paymentPulse 1s ease-in-out infinite' }} />
                <span className="text-[11px] font-medium text-[#16A34A]">Auto-closing...</span>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FEF2F2] dark:bg-[#EF4444]/10 flex items-center justify-center"
                style={{ animation: 'paymentIconPop 0.4s ease-out 0.1s both' }}
              >
                <FiXCircle size={32} className="text-[#EF4444]" />
              </div>
              <h3 className="text-lg font-bold text-[#111827] dark:text-[#EAE5DF] mb-1">Payment Failed</h3>
              <p className="text-[13px] text-[#94A3B8] mb-4">
                {message || 'Failed to process payment. Please try again.'}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[13px] font-medium text-[#475569] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors cursor-pointer bg-transparent"
                >
                  Dismiss
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-4 py-2 text-[13px] font-medium text-white bg-[#101B55] rounded-lg hover:bg-[#101B55]/90 transition-colors cursor-pointer border-none"
                  >
                    Retry
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes paymentModalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes paymentIconPop {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes paymentPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
