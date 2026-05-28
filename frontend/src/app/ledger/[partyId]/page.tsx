import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../../store/dataStore';
import { formatDate } from '../../../utils/nepaliDate';
import { useTranslation } from '../../../utils/i18n';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FiArrowLeft, FiDownload, FiPrinter, FiSearch, FiBook, FiTrendingUp, FiTrendingDown, FiDollarSign } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LedgerPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const navigate = useNavigate();
  const { transactions, parties } = useDataStore();
  const { t, c, n, d, language } = useTranslation();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<'all' | 'selling' | 'purchase' | 'expense'>('all');

  const party = parties.find((p) => p.id === partyId);

  const ledgerEntries = useMemo(() => {
    if (!party) return [];

    const entries = transactions
      .filter((t) => {
        if (t.partyId !== party.id && t.partyName?.toLowerCase() !== party.name.toLowerCase()) {
          return false;
        }
        if (transactionType !== 'all' && t.type !== transactionType) return false;
        if (startDate && new Date(t.date) < new Date(startDate)) return false;
        if (endDate) {
          const txEnd = new Date(endDate);
          txEnd.setHours(23, 59, 59);
          if (new Date(t.date) > txEnd) return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!t.description.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = party.balance;
    const entriesWithBalance = entries.map((entry) => {
      const debit = entry.type === 'selling' ? entry.amount : 0;
      const credit = entry.type === 'purchase' || entry.type === 'expense' ? entry.amount : 0;
      runningBalance = runningBalance + debit - credit;
      return {
        ...entry,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return entriesWithBalance;
  }, [transactions, party, transactionType, startDate, endDate, searchQuery]);

  const openingBalance = party?.balance || 0;
  const closingBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : openingBalance;

  const chartData = useMemo(() => {
    return ledgerEntries.map((entry) => ({
      date: formatDate(entry.date, language).split(' ')[0],
      balance: entry.balance,
    }));
  }, [ledgerEntries, language]);

  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting ledger as ${format}`);
    alert(`Exporting ledger as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!party) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-6">
        <button
          onClick={() => navigate('/parties')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#101B55] dark:hover:text-[#F2DD50] mb-6 transition-colors border-none bg-transparent cursor-pointer font-bold text-xs uppercase tracking-wider"
        >
          <FiArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </button>
        <div className="text-center py-16 border border-dashed border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl bg-white dark:bg-[#15161C]">
          <p className="text-sm font-bold text-slate-400">{t('parties.noParties')}</p>
        </div>
      </div>
    );
  }

  const debitSum = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
  const creditSum = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4">
      <div className="max-w-[1280px] mx-auto space-y-4">
        {/* Header */}
        <div className="relative mb-6 rounded-2xl bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
          <div className="relative px-6 py-6 sm:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/parties')}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C1D24] flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36] text-slate-500 hover:text-[#101B55] cursor-pointer"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-xl bg-[#101B55] flex items-center justify-center shadow-sm">
                  <FiBook className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-[#EAE5DF]">
                    {t('ledger.title')}: {party.name}
                  </h1>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    {t('ledger.partyLedgerDesc')} {party.type === 'customer' ? t('parties.customer') : t('parties.supplier')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  <FiDownload size={14} /> PDF
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white rounded-lg text-[13px] font-bold border-none cursor-pointer shadow-sm"
                >
                  <FiPrinter size={15} /> Print
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 flex justify-between items-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
              <FiDollarSign size={20} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-1">{t('ledger.openingBalance')}</p>
              <p className="text-2xl font-extrabold text-[#111827] dark:text-[#EAE5DF] leading-none">{c(openingBalance)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 flex justify-between items-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
              <FiTrendingUp size={20} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-1">{t('ledger.totalDebit')}</p>
              <p className="text-2xl font-extrabold text-green-600 leading-none">{c(debitSum)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 flex justify-between items-center shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600">
              <FiTrendingDown size={20} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-1">{t('ledger.totalCredit')}</p>
              <p className="text-2xl font-extrabold text-red-600 leading-none">{c(creditSum)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[#15161C] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('transactions.type')}
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF]"
              >
                <option value="all">{t('transactions.all')}</option>
                <option value="selling">{t('transactions.sales')}</option>
                <option value="purchase">{t('transactions.purchases')}</option>
                <option value="expense">{t('transactions.expenses')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('transactions.from')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('transactions.to')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {t('common.search')}
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('ledger.searchDescription')}
                  className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-[#15161C] p-6 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider mb-4">
              {t('ledger.balanceOverTime')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="balance" stroke="#101B55" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Ledger Table */}
        <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                  <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {t('ledger.date')}
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {t('transactions.type')}
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {t('common.description')}
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">
                    {t('ledger.debit')}
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">
                    {t('ledger.credit')}
                  </th>
                  <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">
                    {t('ledger.balance')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {/* Opening Balance Row */}
                <tr className="bg-blue-50/30 dark:bg-blue-900/10 font-bold">
                  <td className="py-4 px-6 text-slate-800 dark:text-[#EAE5DF]">
                    {t('ledger.opening')}
                  </td>
                  <td className="py-4 px-6 text-slate-400">—</td>
                  <td className="py-4 px-6 text-slate-500 uppercase text-xs">{t('ledger.openingBalance')}</td>
                  <td className="py-4 px-6 text-right text-slate-400">—</td>
                  <td className="py-4 px-6 text-right text-slate-400">—</td>
                  <td className="py-4 px-6 text-right text-[#101B55] dark:text-[#F2DD50]">
                    {c(openingBalance)}
                  </td>
                </tr>

                {ledgerEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#1C1D24] transition-colors"
                  >
                    <td className="py-4 px-6 text-slate-600 dark:text-[#EAE5DF]">
                      {d(entry.date)}
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-[#EAE5DF] capitalize font-medium text-xs">
                      {entry.type === 'selling' ? t('transactions.sales') : entry.type === 'purchase' ? t('transactions.purchases') : t('transactions.expenses')}
                    </td>
                    <td className="py-4 px-6 text-slate-700 dark:text-[#EAE5DF] font-bold text-xs uppercase tracking-wider">
                      {entry.description}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-green-600">
                      {entry.debit > 0 ? c(entry.debit) : '—'}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-red-600">
                      {entry.credit > 0 ? c(entry.credit) : '—'}
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-800 dark:text-[#EAE5DF]">
                      {c(entry.balance)}
                    </td>
                  </tr>
                ))}

                {/* Closing Balance Row */}
                <tr className="bg-slate-50/50 dark:bg-[#1C1D24]/50 font-bold border-t-2 border-slate-300 dark:border-[#2A2B36]">
                  <td className="py-4 px-6 text-slate-800 dark:text-[#EAE5DF]">
                    {t('ledger.closing')}
                  </td>
                  <td className="py-4 px-6 text-slate-400">—</td>
                  <td className="py-4 px-6 text-slate-500 uppercase text-xs">
                    {t('ledger.closingBalance')}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-400">—</td>
                  <td className="py-4 px-6 text-right text-slate-400">—</td>
                  <td className="py-4 px-6 text-right font-extrabold text-[#101B55] dark:text-[#F2DD50] text-base">
                    {c(closingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
