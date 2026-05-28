import React, { useState } from 'react';
import { FiDollarSign, FiCreditCard, FiSmartphone, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

// Payment method config
export type PaymentMethodType = 'Cash' | 'Card' | 'QR' | 'Mobile Wallet';

interface PaymentMethodConfig {
  id: PaymentMethodType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'Cash', label: 'Cash', icon: <FiDollarSign size={16} />, color: '#22C55E', bgColor: '#F0FDF4' },
  { id: 'Card', label: 'Card', icon: <FiCreditCard size={16} />, color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'QR', label: 'QR Pay', icon: <FiSmartphone size={16} />, color: '#8B5CF6', bgColor: '#FAF5FF' },
  { id: 'Mobile Wallet', label: 'Wallet', icon: <FiSmartphone size={16} />, color: '#F59E0B', bgColor: '#FFFBEB' },
];

export interface PaymentEntry {
  id: string;
  method: PaymentMethodType;
  amount: number;
}

interface PaymentSectionProps {
  totalAmount: number;
  existingPaidAmount: number;
  onPaymentSubmit: (entries: PaymentEntry[], totalPaid: number) => void;
  processing: boolean;
  isPaid: boolean;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  totalAmount,
  existingPaidAmount,
  onPaymentSubmit,
  processing,
  isPaid,
}) => {
  const [entries, setEntries] = useState<PaymentEntry[]>([
    { id: Math.random().toString(36).substring(2, 9), method: 'Cash', amount: 0 },
  ]);
  const [amountReceived, setAmountReceived] = useState<string>('');

  const outstandingAmount = Math.max(0, totalAmount - existingPaidAmount);
  const totalNewPayment = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPaidAfter = existingPaidAmount + totalNewPayment;
  const remainingAfter = Math.max(0, totalAmount - totalPaidAfter);

  // Change calculation for cash
  const cashEntry = entries.find((e) => e.method === 'Cash');
  const cashReceived = amountReceived ? parseFloat(amountReceived) : 0;
  const cashEntryAmount = cashEntry?.amount || 0;
  const changeToReturn = cashEntry && cashReceived > 0
    ? Math.max(0, cashReceived - cashEntryAmount)
    : 0;

  const isSingleMethod = entries.length === 1;
  const isValid = totalNewPayment > 0 && totalNewPayment <= outstandingAmount + 0.01;
  const isFullPayment = Math.abs(totalNewPayment - outstandingAmount) < 0.01;

  const addEntry = () => {
    const usedMethods = entries.map((e) => e.method);
    const available = PAYMENT_METHODS.find((m) => !usedMethods.includes(m.id));
    if (!available) return;
    setEntries([...entries, { id: Math.random().toString(36).substring(2, 9), method: available.id, amount: 0 }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 1) return;
    setEntries(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: 'method' | 'amount', value: any) => {
    setEntries(entries.map((e) => {
      if (e.id !== id) return e;
      if (field === 'method') return { ...e, method: value as PaymentMethodType };
      return { ...e, amount: parseFloat(value) || 0 };
    }));
  };

  const handleQuickFull = () => {
    if (entries.length === 1) {
      setEntries([{ ...entries[0], amount: outstandingAmount }]);
      if (entries[0].method === 'Cash') {
        setAmountReceived(String(outstandingAmount));
      }
    }
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onPaymentSubmit(entries, totalNewPayment);
  };

  if (isPaid) {
    return (
      <div className="p-4 bg-[#F0FDF4] dark:bg-[#22C55E]/10 border border-[#DCFCE7] dark:border-[#22C55E]/20 rounded-xl">
        <div className="flex items-center gap-2 text-[#16A34A]">
          <div className="w-6 h-6 bg-[#22C55E] rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="text-[13px] font-semibold">Fully Paid</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment</h3>
        {outstandingAmount > 0 && (
          <button
            onClick={handleQuickFull}
            className="text-[11px] font-medium text-[#101B55] dark:text-[#F2DD50] hover:underline cursor-pointer bg-transparent border-none"
          >
            Pay Full (Rs {outstandingAmount.toLocaleString()})
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-4 space-y-4">
        {/* Payment entries */}
        {entries.map((entry, idx) => {
          const methodConfig = PAYMENT_METHODS.find((m) => m.id === entry.method)!;
          const usedMethods = entries.filter((e) => e.id !== entry.id).map((e) => e.method);

          return (
            <div key={entry.id} className="space-y-2">
              {idx > 0 && <div className="border-t border-dashed border-[#E2E8F0] dark:border-[#2A2B36] pt-3" />}
              
              {/* Method selector */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {PAYMENT_METHODS.map((method) => {
                  const isUsed = usedMethods.includes(method.id);
                  const isSelected = entry.method === method.id;
                  return (
                    <button
                      key={method.id}
                      disabled={isUsed}
                      onClick={() => updateEntry(entry.id, 'method', method.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                        isSelected
                          ? 'border-transparent shadow-sm'
                          : isUsed
                          ? 'opacity-30 cursor-not-allowed border-[#E2E8F0] dark:border-[#2A2B36] bg-transparent'
                          : 'border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] hover:border-[#94A3B8]'
                      }`}
                      style={isSelected ? { background: method.bgColor, color: method.color, borderColor: method.color + '40' } : {}}
                    >
                      {method.icon}
                      {method.label}
                    </button>
                  );
                })}

                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-1.5 text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <FiTrash2 size={13} />
                  </button>
                )}
              </div>

              {/* Amount input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">Rs</span>
                <input
                  type="number"
                  placeholder="0"
                  value={entry.amount || ''}
                  onChange={(e) => updateEntry(entry.id, 'amount', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-[15px] font-semibold bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Cash received + change */}
              {entry.method === 'Cash' && entry.amount > 0 && (
                <div className="space-y-2 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#94A3B8] whitespace-nowrap">Received:</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#94A3B8]">Rs</span>
                      <input
                        type="number"
                        placeholder={String(entry.amount)}
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-[13px] font-medium bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#22C55E] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="0"
                      />
                    </div>
                  </div>
                  {cashReceived > 0 && changeToReturn > 0 && (
                    <div className="flex items-center justify-between bg-[#F0FDF4] dark:bg-[#22C55E]/10 px-3 py-1.5 rounded-lg">
                      <span className="text-[11px] font-medium text-[#16A34A]">Change to return</span>
                      <span className="text-[13px] font-bold text-[#16A34A]">Rs {changeToReturn.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* QR Payment reference */}
              {entry.method === 'QR' && entry.amount > 0 && (
                <div className="pl-1 space-y-2">
                  <div className="bg-[#FAF5FF] dark:bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[#8B5CF6] rounded flex items-center justify-center">
                        <FiSmartphone size={12} className="text-white" />
                      </div>
                      <span className="text-[12px] font-semibold text-[#8B5CF6]">QR Payment</span>
                    </div>
                    <p className="text-[11px] text-[#7C3AED] leading-relaxed">
                      Scan QR code to complete payment of Rs {entry.amount.toLocaleString()}. 
                      Mark as paid once the transaction is confirmed.
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile Wallet reference */}
              {entry.method === 'Mobile Wallet' && entry.amount > 0 && (
                <div className="pl-1 space-y-2">
                  <div className="bg-[#FFFBEB] dark:bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-[#F59E0B] rounded flex items-center justify-center">
                        <FiSmartphone size={12} className="text-white" />
                      </div>
                      <span className="text-[12px] font-semibold text-[#D97706]">Mobile Wallet</span>
                    </div>
                    <p className="text-[11px] text-[#B45309] leading-relaxed">
                      Accept payment of Rs {entry.amount.toLocaleString()} via eSewa, Khalti, or IME Pay.
                      Mark as paid once the transaction is confirmed.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add split payment */}
        {entries.length < PAYMENT_METHODS.length && (
          <button
            onClick={addEntry}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[#101B55] dark:text-[#F2DD50] hover:underline cursor-pointer bg-transparent border-none px-0"
          >
            <FiPlus size={13} /> Split Payment (add method)
          </button>
        )}

        {/* Payment summary */}
        <div className="border-t border-[#E2E8F0] dark:border-[#2A2B36] pt-3 space-y-2">
          <div className="flex justify-between text-[12px]">
            <span className="text-[#94A3B8]">Invoice Total</span>
            <span className="font-semibold text-[#111827] dark:text-[#EAE5DF]">Rs {totalAmount.toLocaleString()}</span>
          </div>
          {existingPaidAmount > 0 && (
            <div className="flex justify-between text-[12px]">
              <span className="text-[#94A3B8]">Previously Paid</span>
              <span className="font-medium text-[#22C55E]">Rs {existingPaidAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-[12px]">
            <span className="text-[#94A3B8]">This Payment</span>
            <span className={`font-semibold ${totalNewPayment > 0 ? 'text-[#3B82F6]' : 'text-[#94A3B8]'}`}>
              Rs {totalNewPayment.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-[13px] pt-1 border-t border-dashed border-[#E2E8F0] dark:border-[#2A2B36]">
            <span className="font-semibold text-[#111827] dark:text-[#EAE5DF]">
              {remainingAfter > 0 ? 'Remaining Due' : 'Balance'}
            </span>
            <span className={`font-bold ${remainingAfter > 0 ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
              Rs {remainingAfter.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Validation message */}
        {totalNewPayment > outstandingAmount + 0.01 && (
          <div className="text-[11px] text-[#EF4444] bg-[#FEF2F2] dark:bg-[#EF4444]/10 px-3 py-2 rounded-lg">
            Payment amount exceeds the outstanding balance of Rs {outstandingAmount.toLocaleString()}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!isValid || processing}
            className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer border-none ${
              isValid && !processing
                ? 'bg-[#101B55] text-white hover:bg-[#1e293b] shadow-lg'
                : 'bg-[#E2E8F0] dark:bg-[#2A2B36] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : isFullPayment ? (
              'Confirm Full Payment'
            ) : totalNewPayment > 0 ? (
              `Record Partial Payment (Rs ${totalNewPayment.toLocaleString()})`
            ) : (
              'Enter Payment Amount'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
