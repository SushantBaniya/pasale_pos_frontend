import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi } from '../../utils/api';
import { FiSearch, FiFilter, FiDownload, FiPlus, FiMoreHorizontal, FiFileText } from 'react-icons/fi';

export default function PurchasePage() {
  const navigate = useNavigate();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await billingApi.getAll();
      const records = res.results || res || [];
      // Filter only Purchase type
      const purchaseRecords = records
        .filter((b: any) => b.transaction_type === 'Purchase')
        .sort((a: any, b: any) => {
          const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
          const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
          return dateB - dateA;
        });
      setBillings(purchaseRecords);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = billings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.party?.name?.toLowerCase().includes(q) ||
      b.invoice_number?.toLowerCase().includes(q) ||
      String(b.id).includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMoney = (n: any) => {
    const val = Number(n || 0);
    return `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val)}`;
  };

  return (
    <div className="max-w-[1300px] mx-auto pb-10 mt-6 px-4">
      {/* Header */}
      <div className="relative mb-6 rounded-2xl bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
        <div className="relative px-6 py-6 sm:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#1C1D24] flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36]">
                <FiFileText className="w-6 h-6 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#EAE5DF]">
                  Purchase Bills
                </h1>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Manage incoming supplier invoices, credit purchases, and procurement logs
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] font-bold text-slate-600 bg-white hover:bg-slate-50 border-none cursor-pointer">
                <FiDownload size={14} /> Export
              </button>
              <button
                onClick={() => navigate('/purchase/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white rounded-lg text-[13px] font-bold border-none cursor-pointer shadow-sm"
              >
                <FiPlus size={15} /> Record Purchase Bill
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Search & Filter bar container */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#15161C] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by supplier name or bill number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#1C1D24] text-[13px] text-slate-800 dark:text-[#EAE5DF] placeholder-slate-400 focus:outline-none focus:border-[#101B55]"
          />
        </div>
        <button className="p-2 border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#1C1D24] rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
          <FiFilter className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">DATE</th>
                <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">BILL NO</th>
                <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">PARTY NAME</th>
                <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">STATUS</th>
                <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-right">AMOUNT</th>
                <th className="py-4 px-6 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider text-center" style={{ width: 100 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-6 h-6 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading purchase bills...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-sm font-bold text-slate-400 mb-3">No purchase bills found</p>
                    <button
                      onClick={() => navigate('/purchase/new')}
                      className="text-[#101B55] dark:text-[#F2DD50] text-xs font-bold hover:underline uppercase tracking-wider border-none bg-transparent cursor-pointer"
                    >
                      Record your first purchase
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((billing) => (
                  <tr
                    key={billing.id}
                    className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors"
                  >
                    <td className="py-4 px-6 text-xs font-bold text-slate-500">
                      {formatDate(billing.invoice_date)}
                    </td>
                    <td className="py-4 px-6 text-xs font-extrabold text-[#101B55] dark:text-[#F2DD50]">
                      #{billing.id}
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-800 dark:text-[#EAE5DF]">
                      {billing.party?.name || 'Unknown Supplier'}
                    </td>
                    <td className="py-4 px-6">
                      {billing.invoice_status?.toLowerCase() === 'paid' ? (
                        <span className="inline-flex px-2.5 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                          UNPAID
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-800 dark:text-[#EAE5DF] text-right">
                      {formatMoney(billing.total_amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                        <FiMoreHorizontal className="w-4 h-4 text-slate-400" />
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
  );
}
