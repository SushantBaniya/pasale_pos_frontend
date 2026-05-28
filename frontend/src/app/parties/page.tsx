import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { formatDate } from '../../utils/nepaliDate';
import { useTranslation } from '../../utils/i18n';
import {
  FiSearch,
  FiPlus,
  FiPrinter,
  FiBell,
  FiMoreVertical,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiUser,
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { AddPaymentModal } from '../../components/parties/AddPaymentModal';
import { EditPartyModal } from '../../components/parties/EditPartyModal';

// Helper for currency formatting
const formatMoney = (n: any) =>
  `Rs. ${new Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

// Mini Stat Card matching Inventory style
const MiniStatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  iconBg: string; 
  iconColor: string;
}> = ({ label, value, icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-4 flex justify-between items-center shadow-sm flex-1 min-w-[150px]">
    <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
      {icon}
    </div>
    <div className="text-right">
      <p className="text-[10px] font-bold text-[#94A3B8] dark:text-[#64748B] tracking-wider uppercase mb-0.5">{label}</p>
      <p className="text-[20px] font-bold text-[#111827] dark:text-[#EAE5DF] leading-none">{value}</p>
    </div>
  </div>
);

export default function PartiesPage() {
  const { t, c, n, language } = useTranslation();
  const { parties, transactions } = useDataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [showEditPartyModal, setShowEditPartyModal] = useState(false);
  const [showPaymentInModal, setShowPaymentInModal] = useState(false);
  const [showPaymentOutModal, setShowPaymentOutModal] = useState(false);

  // Filtered parties list for sidebar
  const filteredParties = useMemo(() => {
    return parties.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [parties, searchQuery]);

  const selectedParty = useMemo(() => {
    return parties.find(p => p.id === selectedPartyId) || null;
  }, [parties, selectedPartyId]);

  const partyTransactions = useMemo(() => {
    if (!selectedPartyId) return [];
    return transactions
      .filter(tx => tx.partyId === selectedPartyId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPartyId]);

  const getPartyBalance = (partyId: string) => {
    const party = parties.find(p => p.id === partyId);
    if (!party) return 0;
    return party.balance; 
  };

  const balance = selectedParty ? getPartyBalance(selectedParty.id) : 0;
  const isReceivable = balance >= 0;

  // Mini summary values
  const totalIn = partyTransactions
    .filter(tx => tx.type === 'payment_in')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalOut = partyTransactions
    .filter(tx => tx.type === 'payment_out')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#0D0E12] pt-16 overflow-hidden">
      {/* Left Sidebar - Parties List */}
      <div className="w-80 bg-white dark:bg-[#15161C] border-r border-[#E2E8F0] dark:border-[#2A2B36] flex flex-col h-full z-10">
        
        <div className="p-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#111827] dark:text-[#EAE5DF] flex items-center gap-2">
              Parties ({filteredParties.length})
            </h2>
            <button
              onClick={() => {
                setSelectedPartyId(null);
                setShowAddPartyModal(true);
              }}
              className="flex items-center px-3 py-1.5 bg-[#101B55] hover:bg-[#101B55]/90 text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
            >
              <FiPlus className="w-3.5 h-3.5 mr-1" /> Add Party
            </button>
          </div>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search parties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredParties.length === 0 ? (
             <div className="p-8 text-center text-slate-400 text-xs">No parties found</div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 list-none p-0 m-0">
              {filteredParties.map((party) => {
                const partyBal = getPartyBalance(party.id);
                const isSelected = selectedPartyId === party.id;
                return (
                  <li
                    key={party.id}
                    onClick={() => setSelectedPartyId(party.id)}
                    className={`p-4 cursor-pointer transition-colors border-l-4 ${
                      isSelected
                        ? 'bg-slate-50 dark:bg-[#F2DD50]/15 border-[#101B55] dark:border-[#F2DD50]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#1C1D24] border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C1D24] text-[#101B55] dark:text-[#F2DD50] flex items-center justify-center font-bold shrink-0 text-sm">
                          {party.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[13px] text-[#111827] dark:text-[#EAE5DF] truncate">{party.name}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                         <p className={`font-bold text-[13px] ${
                           partyBal > 0 ? 'text-[#CA8A04]' : partyBal < 0 ? 'text-red-500' : 'text-slate-400'
                         }`}>
                           {formatMoney(Math.abs(partyBal)).replace('Rs. ', '')}
                         </p>
                         <p className={`text-[9px] uppercase font-bold tracking-wider ${
                           partyBal > 0 ? 'text-[#CA8A04]' : partyBal < 0 ? 'text-red-500' : 'text-gray-400'
                         }`}>
                           {partyBal > 0 ? 'Receive' : partyBal < 0 ? 'Give' : 'Settled'}
                         </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right Content - Party Details */}
      <div className="flex-1 bg-slate-50 dark:bg-[#0D0E12] h-full overflow-y-auto">
        {!selectedParty ? (
           <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FiUser className="w-16 h-16 mb-4 text-slate-300" />
              <h2 className="text-lg font-bold">Select a party to view details</h2>
           </div>
        ) : (
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Party Header rounded card */}
            <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-[#1C1D24] text-[#101B55] dark:text-[#F2DD50] flex items-center justify-center text-xl font-bold">
                     {selectedParty.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                     <h1 className="text-xl font-bold text-slate-900 dark:text-[#EAE5DF]">{selectedParty.name}</h1>
                     <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                        <button onClick={() => setShowEditPartyModal(true)} className="hover:text-[#101B55] font-bold border-none bg-transparent cursor-pointer">Manage Party</button>
                        <span className="text-slate-300">|</span>
                        <button className="hover:text-slate-800 flex items-center gap-1 border-none bg-transparent cursor-pointer"><FiPrinter className="w-3.5 h-3.5"/> Print Profile</button>
                     </div>
                  </div>
               </div>
               
               <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{isReceivable ? 'Receivable Balance' : 'Payable Balance'}</p>
                  <p className={`text-2xl font-bold ${isReceivable ? 'text-[#16A34A]' : 'text-red-500'}`}>
                     {formatMoney(Math.abs(balance))}
                  </p>
                  <button className="text-[#CA8A04] hover:underline text-xs font-bold flex items-center justify-end gap-1 w-full mt-2 border-none bg-transparent cursor-pointer">
                     <FiBell className="w-3.5 h-3.5"/> Send Payment Reminder
                  </button>
               </div>
            </div>

            {/* Mini Stats Grid matching Inventory Page */}
            <div className="flex flex-wrap gap-4">
              <MiniStatCard 
                label="TOTAL PAYMENTS IN" 
                value={formatMoney(totalIn).replace('Rs. ', '')} 
                icon={<FiTrendingUp size={18} />} 
                iconBg="#F0FDF4" 
                iconColor="#22C55E" 
              />
              <MiniStatCard 
                label="TOTAL PAYMENTS OUT" 
                value={formatMoney(totalOut).replace('Rs. ', '')} 
                icon={<FiTrendingDown size={18} />} 
                iconBg="#FEF2F2" 
                iconColor="#EF4444" 
              />
              <MiniStatCard 
                label="TRANSACTIONS COUNT" 
                value={partyTransactions.length} 
                icon={<FiDollarSign size={18} />} 
                iconBg="#EFF6FF" 
                iconColor="#3B82F6" 
              />
            </div>

            {/* Transactions Section */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-[#EAE5DF]">
                     Transactions History ({partyTransactions.length})
                  </h3>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => setShowPaymentInModal(true)}
                        className="flex items-center px-4 py-2 bg-[#F2DD50] hover:bg-[#F2DD50]/90 text-[#111827] text-xs font-bold rounded-lg shadow-sm border-none cursor-pointer transition-colors"
                     >
                        <FiArrowDownLeft className="w-4 h-4 mr-2" /> Payment In
                     </button>
                     <button 
                        onClick={() => setShowPaymentOutModal(true)}
                        className="flex items-center px-4 py-2 bg-[#101B55] hover:bg-[#101B55]/90 text-white text-xs font-bold rounded-lg shadow-sm border-none cursor-pointer transition-colors"
                     >
                        <FiArrowUpRight className="w-4 h-4 mr-2" /> Payment Out
                     </button>
                  </div>
               </div>

               {/* Transaction table matching Inventory */}
               <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">TYPE</th>
                              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">DATE</th>
                              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-right">TOTAL</th>
                              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-right">RUNNING BALANCE</th>
                              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">REMARKS</th>
                              <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center">ACTIONS</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                           {partyTransactions.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="py-12 text-center text-slate-400 text-sm font-medium">No transactions found</td>
                              </tr>
                           ) : (
                              partyTransactions.map((tx) => (
                                 <tr key={tx.id} className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors">
                                    <td className="py-4 px-6 text-[13px] font-medium text-[#111827] dark:text-[#EAE5DF]">
                                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                          tx.type === 'payment_in' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'
                                       }`}>
                                          {tx.type === 'payment_in' ? 'Payment In' : 'Payment Out'}
                                       </span>
                                       <span className="text-gray-400 font-normal text-xs ml-2">#{tx.id.substring(tx.id.length - 4)}</span>
                                    </td>
                                    <td className="py-4 px-6 text-[13px] text-slate-600 dark:text-[#EAE5DF]">
                                       {formatDate(tx.date, language)}
                                    </td>
                                    <td className={`py-4 px-6 text-[13px] text-right font-bold ${tx.type === 'payment_in' ? 'text-[#16A34A]' : 'text-red-500'}`}>
                                       {tx.type === 'payment_in' ? '+' : '-'} {formatMoney(tx.amount)}
                                    </td>
                                    <td className={`py-4 px-6 text-[13px] text-right font-bold ${balance >= 0 ? 'text-[#16A34A]' : 'text-red-500'}`}>
                                       {formatMoney(Math.abs(balance))}
                                    </td>
                                    <td className="py-4 px-6 text-[13px] text-slate-500 dark:text-[#94A3B8] truncate max-w-[150px]">
                                       {tx.description || '-'}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                       <button className="text-[#94A3B8] hover:text-[#101B55] transition-colors p-1.5 hover:bg-slate-50 dark:hover:bg-[#1C1D24] rounded-lg border-none bg-transparent cursor-pointer">
                                          <FiMoreVertical />
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPaymentModal
        isOpen={showPaymentInModal}
        onClose={() => setShowPaymentInModal(false)}
        type="payment_in"
        defaultPartyId={selectedPartyId || undefined}
      />
      
      <AddPaymentModal
        isOpen={showPaymentOutModal}
        onClose={() => setShowPaymentOutModal(false)}
        type="payment_out"
        defaultPartyId={selectedPartyId || undefined}
      />

      <EditPartyModal
        isOpen={showAddPartyModal}
        onClose={() => setShowAddPartyModal(false)}
      />

      <EditPartyModal
        isOpen={showEditPartyModal}
        onClose={() => setShowEditPartyModal(false)}
        party={selectedParty || undefined}
      />
    </div>
  );
}
