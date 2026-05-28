import React, { useState, useEffect } from 'react';
import { FiX, FiCheckCircle, FiAlertCircle, FiClock, FiPrinter } from 'react-icons/fi';
import confetti from 'canvas-confetti';

interface QRPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  merchantName: string;
  onSuccess: (transactionId: string) => void;
}

type PaymentState = 'generating' | 'waiting' | 'success' | 'timeout' | 'cancelled';

export const QRPayment: React.FC<QRPaymentProps> = ({
  isOpen,
  onClose,
  amount,
  orderId,
  merchantName,
  onSuccess
}) => {
  const [state, setState] = useState<PaymentState>('generating');
  const [timeLeft, setTimeLeft] = useState(120);
  const [transactionId, setTransactionId] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Generate a random transaction ID
  const generateTransactionId = () => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `FP-${timestamp}-${random}`;
  };

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setState('generating');
      setTimeLeft(120);
      setTransactionId(generateTransactionId());
      setShowCancelConfirm(false);

      // Simulate generating delay
      const generateTimer = setTimeout(() => {
        setState('waiting');
      }, 1000);

      return () => clearTimeout(generateTimer);
    }
  }, [isOpen]);

  // Countdown timer logic
  useEffect(() => {
    if (state !== 'waiting') return;

    if (timeLeft <= 0) {
      setState('timeout');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [state, timeLeft]);

  // Auto-simulate successful payment (random between 5-8 seconds)
  useEffect(() => {
    if (state !== 'waiting') return;

    const delay = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;
    
    const paymentTimer = setTimeout(() => {
      if (state === 'waiting') {
        setState('success');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#60BB46', '#F2DD50', '#101B55']
        });
      }
    }, delay);

    return () => clearTimeout(paymentTimer);
  }, [state]);

  const handleClose = () => {
    if (state === 'waiting') {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmCancel = () => {
    setState('cancelled');
    setShowCancelConfirm(false);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleSuccessDone = () => {
    onSuccess(transactionId);
    onClose();
  };

  if (!isOpen) return null;

  // QR Data URL
  const qrData = `QRPAY-${orderId}-${amount}-${transactionId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&margin=10`;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-[#15161C] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative transition-all transform scale-100">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800 bg-[#101B55] text-white">
          <h2 className="text-lg font-semibold">QR Payment</h2>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Cancel Confirmation Overlay */}
        {showCancelConfirm && (
          <div className="absolute inset-0 z-10 bg-white/95 dark:bg-[#15161C]/95 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <FiAlertCircle size={48} className="text-amber-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Cancel Payment?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Are you sure you want to cancel? The customer has not been charged.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition-colors"
              >
                Keep Waiting
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        )}

        <div className="p-6 flex flex-col items-center flex-1">
          
          {/* Generating State */}
          {state === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 animate-pulse">
              <div className="w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-xl mb-6 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#F2DD50] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Generating Secure QR Code...</p>
            </div>
          )}

          {/* Waiting/Scanning State */}
          {state === 'waiting' && (
            <div className="flex flex-col items-center w-full animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold mb-1">Total Amount</p>
                <h3 className="text-4xl font-black text-[#101B55] dark:text-white tracking-tight">
                  <span className="text-2xl text-gray-400 dark:text-gray-500 font-bold mr-1">Rs.</span>
                  {amount.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Paying to <span className="text-gray-800 dark:text-gray-200 font-bold">{merchantName}</span></p>
              </div>

              <div className="relative p-2 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] mb-6 border border-gray-100">
                <img 
                  src={qrUrl} 
                  alt="Payment QR Code" 
                  className="w-48 h-48 object-contain"
                />
                {/* Scanner animation line */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-xl">
                  <div className="w-full h-1 bg-[#60BB46]/50 shadow-[0_0_10px_#60BB46] animate-scanLine absolute top-0 left-0"></div>
                </div>
              </div>

              <div className="flex gap-4 items-center justify-center mb-6 w-full">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">eSewa</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">Khalti</span>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">Any Banking App</span>
              </div>

              {/* Timer */}
              <div className="w-full max-w-[240px]">
                <div className="flex justify-between text-sm font-medium mb-1.5">
                  <span className={`${timeLeft < 30 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'} flex items-center gap-1.5`}>
                    <FiClock className={timeLeft < 30 ? 'animate-pulse' : ''} />
                    {timeLeft < 30 ? 'Expiring soon!' : 'Waiting for payment...'}
                  </span>
                  <span className={`${timeLeft < 30 ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft < 30 ? 'bg-red-500' : 'bg-[#101B55]'}`}
                    style={{ width: `${(timeLeft / 120) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <div className="flex flex-col items-center py-6 w-full animate-fadeIn">
              <div className="w-20 h-20 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center mb-4 transform animate-[scaleIn_0.5s_ease-out]">
                <FiCheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">The customer has completed the payment.</p>

              <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Amount Paid</span>
                  <span className="font-bold text-gray-900 dark:text-white">Rs. {amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Transaction ID</span>
                  <span className="font-mono text-gray-900 dark:text-white">{transactionId}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Date & Time</span>
                  <span className="text-gray-900 dark:text-white">{new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleSuccessDone}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors"
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button
                  onClick={handleSuccessDone}
                  className="flex-1 py-3 bg-[#60BB46] hover:bg-[#4a9e35] text-white font-bold rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Timeout State */}
          {state === 'timeout' && (
            <div className="flex flex-col items-center py-8 w-full animate-fadeIn">
              <div className="w-20 h-20 bg-[#FEE2E2] text-[#DC2626] rounded-full flex items-center justify-center mb-4">
                <FiX size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">QR Code Expired</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-center px-4">
                The payment time limit was reached. If the customer still wants to pay, generate a new QR code.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-gray-700 dark:text-gray-300 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setState('generating')}
                  className="flex-[2] py-3 bg-[#101B55] hover:bg-[#0a113a] text-white font-bold rounded-xl transition-colors"
                >
                  Generate New QR
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes scanLine {
          0% { transform: translateY(0); }
          50% { transform: translateY(192px); opacity: 1; }
          51% { opacity: 0; }
          100% { transform: translateY(0); opacity: 0; }
        }
        .animate-scanLine {
          animation: scanLine 2s linear infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
