import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useTranslation } from '../../utils/i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/dashboard/KPICard';
import { billingApi, expenseApi } from '../../utils/api';
import {
  SalesPurchaseDialog,
  PaymentDialog,
  ExpenseIncomeDialog,
  ReturnDialog,
  QuotationDialog,
  TransactionViewDialog,
  DeleteConfirmDialog,
  TransactionTable,
  TransactionType,
  TRANSACTION_TYPE_CONFIG,
} from '../../components/transactions';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiFileText,
  FiFilter,
  FiPlus,
  FiCalendar,
  FiChevronDown,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiRotateCcw,
  FiRotateCw,
  FiDollarSign,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';
import { toast } from 'react-hot-toast';

type Tab = 'all' | 'sales' | 'purchase' | 'payments' | 'returns' | 'expense';
type QuickFilter = 'today' | 'week' | 'month' | 'year' | 'custom';

export default function TransactionsPage() {
  const { t, c, n, language } = useTranslation();
  const { transactions, parties, deleteTransaction } = useDataStore();
  const navigate = useNavigate();

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewTransactionMenu, setShowNewTransactionMenu] = useState(false);

  // Dialog States
  const [salesDialog, setSalesDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [purchaseDialog, setPurchaseDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [paymentInDialog, setPaymentInDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [paymentOutDialog, setPaymentOutDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [incomeDialog, setIncomeDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [salesReturnDialog, setSalesReturnDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [purchaseReturnDialog, setPurchaseReturnDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [quotationDialog, setQuotationDialog] = useState<{ open: boolean; editData?: any }>({ open: false });
  const [viewDialog, setViewDialog] = useState<{ open: boolean; transaction?: any }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; transaction?: any }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick filter date ranges
  useEffect(() => {
    const today = new Date();
    const start = new Date();

    switch (quickFilter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'month':
        start.setDate(1);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'year':
        start.setMonth(0, 1);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        break;
      case 'custom':
        break;
    }
  }, [quickFilter]);

  // Data State
  const [apiTransactions, setApiTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const [billingsRes, expensesRes] = await Promise.all([
        billingApi.getAll(),
        expenseApi.getAll()
      ]);

      const billings = (billingsRes.results || []).map((b: any) => ({
        ...b,
        id: `billing-${b.id}`,
        dbId: b.id,
        type: 'selling', 
        transactionNumber: b.invoice_number,
        date: b.invoice_date || b.created_at,
        amount: parseFloat(b.total_amount),
        totalAmount: parseFloat(b.total_amount),
        paymentStatus: b.invoice_status?.toLowerCase() || 'unpaid',
        partyName: b.party_name || 'Walk-in Customer',
      }));

      const expenses = (expensesRes.results || []).map((e: any) => ({
        ...e,
        id: `expense-${e.id}`,
        dbId: e.id,
        type: 'expense',
        transactionNumber: `EXP-${e.id}`,
        date: e.date,
        amount: parseFloat(e.amount),
        totalAmount: parseFloat(e.amount),
        paymentStatus: 'paid',
        partyName: e.category,
      }));

      const combined = [...billings, ...expenses].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setApiTransactions(combined);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = apiTransactions;

    if (startDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      filtered = filtered.filter((t) => new Date(t.date) <= end);
    }

    switch (activeTab) {
      case 'sales':
        filtered = filtered.filter((t) => t.type === 'selling');
        break;
      case 'purchase':
        filtered = filtered.filter((t) => t.type === 'purchase');
        break;
      case 'payments':
        filtered = filtered.filter((t) => t.type === 'payment_in' || t.type === 'payment_out');
        break;
      case 'returns':
        filtered = filtered.filter((t) => t.type === 'sales_return' || t.type === 'purchase_return');
        break;
      case 'expense':
        filtered = filtered.filter((t) => t.type === 'expense' || t.type === 'income');
        break;
    }

    return filtered;
  }, [apiTransactions, activeTab, startDate, endDate]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => ['selling', 'payment_in', 'income', 'purchase_return'].includes(t.type))
      .reduce((sum, t) => sum + Number(t.totalAmount || t.amount || 0), 0);
    const expenses = filteredTransactions
      .filter((t) => ['purchase', 'payment_out', 'expense', 'sales_return'].includes(t.type))
      .reduce((sum, t) => sum + Number(t.totalAmount || t.amount || 0), 0);
    const balance = income - expenses;
    return { income, expenses, balance, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    alert(`Exporting ${filteredTransactions.length} transactions as ${format.toUpperCase()}`);
    setShowExportMenu(false);
  };

  const handleViewTransaction = useCallback((transaction: any) => {
    setViewDialog({ open: true, transaction });
  }, []);

  const handleEditTransaction = useCallback((transaction: any) => {
    const type = transaction.type;
    switch (type) {
      case 'selling':
      case 'sales':
        setSalesDialog({ open: true, editData: transaction });
        break;
      case 'purchase':
        setPurchaseDialog({ open: true, editData: transaction });
        break;
      case 'payment_in':
        setPaymentInDialog({ open: true, editData: transaction });
        break;
      case 'payment_out':
        setPaymentOutDialog({ open: true, editData: transaction });
        break;
      case 'expense':
        setExpenseDialog({ open: true, editData: transaction });
        break;
      case 'income':
        setIncomeDialog({ open: true, editData: transaction });
        break;
      case 'sales_return':
        setSalesReturnDialog({ open: true, editData: transaction });
        break;
      case 'purchase_return':
        setPurchaseReturnDialog({ open: true, editData: transaction });
        break;
      case 'quotation':
        setQuotationDialog({ open: true, editData: transaction });
        break;
    }
  }, []);

  const handleDeleteTransaction = useCallback((transaction: any) => {
    setDeleteDialog({ open: true, transaction });
  }, []);

  const confirmDelete = async () => {
    if (!deleteDialog.transaction) return;
    setIsDeleting(true);
    try {
      const trans = deleteDialog.transaction;
      if (trans.type === 'selling') {
        await billingApi.delete(trans.dbId);
      } else if (trans.type === 'expense') {
        await expenseApi.delete(trans.dbId);
      } else {
        deleteTransaction(trans.id);
      }
      toast.success('Transaction deleted');
      fetchTransactions();
      setDeleteDialog({ open: false });
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrintTransaction = useCallback((transaction: any) => {
    if (transaction.partyId) {
      navigate(`/billing?partyId=${transaction.partyId}&transactionId=${transaction.id}`);
    } else {
      navigate(`/billing?transactionId=${transaction.id}`);
    }
  }, [navigate]);

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { id: 'all', label: 'All Transactions', icon: FiFileText, count: apiTransactions.length, color: 'text-slate-500' },
    { id: 'sales', label: 'Sales', icon: FiShoppingCart, count: apiTransactions.filter((t) => t.type === 'selling').length, color: 'text-[#101B55]' },
    { id: 'purchase', label: 'Purchases', icon: FiPackage, count: apiTransactions.filter((t) => t.type === 'purchase').length, color: 'text-[#101B55]' },
    { id: 'payments', label: 'Payments', icon: FiCreditCard, count: apiTransactions.filter((t) => t.type === 'payment_in' || t.type === 'payment_out').length, color: 'text-emerald-500' },
    { id: 'returns', label: 'Returns', icon: FiRotateCcw, count: apiTransactions.filter((t) => t.type === 'sales_return' || t.type === 'purchase_return').length, color: 'text-orange-500' },
    { id: 'expense', label: 'Expense/Income', icon: FiTrendingDown, count: apiTransactions.filter((t) => t.type === 'expense' || t.type === 'income').length, color: 'text-rose-500' },
  ];

  const transactionMenuItems = [
    {
      id: 'sales',
      label: 'Add Sales',
      desc: 'Create sales invoice',
      icon: FiShoppingCart,
      color: 'bg-[#101B55]',
      onClick: () => setSalesDialog({ open: true })
    },
    {
      id: 'purchase',
      label: 'Add Purchase',
      desc: 'Record a purchase',
      icon: FiPackage,
      color: 'bg-[#101B55]',
      onClick: () => setPurchaseDialog({ open: true })
    },
    {
      id: 'payment_in',
      label: 'Payment In',
      desc: 'Receive payment from customer',
      icon: FiArrowDownLeft,
      color: 'bg-green-500',
      onClick: () => setPaymentInDialog({ open: true })
    },
    {
      id: 'payment_out',
      label: 'Payment Out',
      desc: 'Make payment to supplier',
      icon: FiArrowUpRight,
      color: 'bg-red-500',
      onClick: () => setPaymentOutDialog({ open: true })
    },
    {
      id: 'quotation',
      label: 'Create Quotation',
      desc: 'Generate a quotation/estimate',
      icon: FiFileText,
      color: 'bg-purple-500',
      onClick: () => setQuotationDialog({ open: true })
    },
    {
      id: 'sales_return',
      label: 'Sales Return',
      desc: 'Process customer return',
      icon: FiRotateCcw,
      color: 'bg-orange-500',
      onClick: () => setSalesReturnDialog({ open: true })
    },
    {
      id: 'purchase_return',
      label: 'Purchase Return',
      desc: 'Return goods to supplier',
      icon: FiRotateCw,
      color: 'bg-amber-500',
      onClick: () => setPurchaseReturnDialog({ open: true })
    },
    {
      id: 'expense',
      label: 'Add Expense',
      desc: 'Record business expense',
      icon: FiTrendingDown,
      color: 'bg-rose-500',
      onClick: () => setExpenseDialog({ open: true })
    },
    {
      id: 'income',
      label: 'Add Income',
      desc: 'Record other income',
      icon: FiTrendingUp,
      color: 'bg-emerald-500',
      onClick: () => setIncomeDialog({ open: true })
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D0E12] pb-8">
      <div className="max-w-[1300px] mx-auto px-4 py-6">
        
        {/* Header - Styled like Inventory */}
        <div className="relative mb-6 rounded-2xl bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
          <div className="relative px-6 py-6 sm:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-[#1C1D24] flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36]">
                  <FiCreditCard className="w-6 h-6 text-[#101B55] dark:text-[#F2DD50]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-[#EAE5DF] flex items-center gap-3">
                    Transactions
                    {isLoading ? (
                      <FiRefreshCw className="w-5 h-5 text-[#101B55] animate-spin" />
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-[#1C1D24] text-[#101B55] dark:text-[#F2DD50] border border-[#E2E8F0] dark:border-[#2A2B36]">
                        {n(apiTransactions.length)}
                      </span>
                    )}
                  </h1>
                  <p className="text-slate-500 dark:text-[#94A3B8] text-xs mt-1 max-w-md font-medium">
                    Monitor your sales, expenses, and business cash flow
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={fetchTransactions}
                  isLoading={isLoading}
                  className="rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36]"
                >
                  <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-[13px] font-medium text-[#475569] dark:text-[#EAE5DF] bg-white dark:bg-[#1C1D24] hover:bg-slate-50 dark:hover:bg-gray-700 border border-[#E2E8F0] dark:border-[#2A2B36] transition-all shadow-sm border-none cursor-pointer"
                >
                  <FiFilter className="w-4 h-4 mr-2" />
                  <span>Filters</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-[13px] font-medium text-[#475569] dark:text-[#EAE5DF] bg-white dark:bg-[#1C1D24] hover:bg-slate-50 dark:hover:bg-gray-700 border border-[#E2E8F0] dark:border-[#2A2B36] transition-all shadow-sm border-none cursor-pointer"
                  >
                    <FiDownload className="w-4 h-4 mr-2" />
                    <span>Export</span>
                    <FiChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#15161C] rounded-xl shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36] py-2 z-50">
                        {['pdf', 'excel', 'csv'].map((format) => (
                          <button
                            key={format}
                            onClick={() => handleExport(format as any)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#1C1D24] border-none bg-transparent cursor-pointer transition-colors"
                          >
                            <FiFileText className={`w-4 h-4 ${format === 'pdf' ? 'text-red-500' : format === 'excel' ? 'text-emerald-500' : 'text-[#F2DD50]'}`} />
                            Export as {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowNewTransactionMenu(!showNewTransactionMenu)}
                    className="inline-flex items-center px-4 py-2 rounded-lg text-[13px] font-medium bg-[#101B55] hover:bg-[#101B55]/90 text-white shadow-md transition-all border-none cursor-pointer"
                  >
                    <FiPlus className="w-5 h-5 mr-1.5" />
                    <span>New Transaction</span>
                    <FiChevronDown className="w-4 h-4 ml-1.5" />
                  </button>

                  {showNewTransactionMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowNewTransactionMenu(false)} />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#15161C] rounded-xl shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36] py-2 z-50 max-h-[70vh] overflow-y-auto">
                        <div className="px-4 py-2 border-b border-[#E2E8F0] dark:border-[#2A2B36] mb-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create Transaction</p>
                        </div>
                        {transactionMenuItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.onClick();
                              setShowNewTransactionMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#1C1D24] border-none bg-transparent cursor-pointer transition-colors"
                          >
                            <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-[13px] text-[#111827] dark:text-[#EAE5DF]">{item.label}</p>
                              <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards exactly styled like Inventory stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Income"
            value={stats.income}
            borderColor="emerald"
            icon={<FiTrendingUp className="w-5 h-5" />}
            subtitle={`${n(filteredTransactions.filter((t) => ['selling', 'payment_in', 'income'].includes(t.type)).length)} transactions`}
          />
          <KPICard
            title="Total Expenses"
            value={stats.expenses}
            borderColor="red"
            icon={<FiTrendingDown className="w-5 h-5" />}
            subtitle={`${n(filteredTransactions.filter((t) => ['purchase', 'payment_out', 'expense'].includes(t.type)).length)} transactions`}
          />
          <KPICard
            title="Net Balance"
            value={stats.balance}
            borderColor="blue"
            icon={<NepaliRupeeIcon className="w-5 h-5" />}
            subtitle={stats.balance >= 0 ? 'Profit' : 'Loss'}
          />
          <KPICard
            title="Transactions"
            value={stats.count}
            borderColor="purple"
            icon={<FiFileText className="w-5 h-5" />}
            subtitle={quickFilter === 'today' ? 'Today' : quickFilter === 'week' ? 'This Week' : quickFilter === 'month' ? 'This Month' : 'This Year'}
          />
        </div>

        {/* Period & Advanced Filters Bar */}
        <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 mb-6 shadow-sm space-y-4">
          {/* Quick Date Filters */}
          <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
            <div className="flex items-center gap-2 mr-2">
              <FiCalendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Period:</span>
            </div>
            {(['today', 'week', 'month', 'year', 'custom'] as QuickFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setQuickFilter(filter);
                  if (filter === 'custom') setShowFilters(true);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-none cursor-pointer ${
                  quickFilter === filter
                    ? 'bg-[#101B55] text-white shadow-md'
                    : 'bg-slate-100 dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] hover:bg-slate-200 dark:hover:bg-gray-700'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Navigation capsules like Status Pill tabs in Inventory */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                    isTabActive
                      ? 'bg-[#101B55] text-white border-transparent'
                      : 'bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36] hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${!isTabActive ? tab.color : 'text-white'}`} />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    isTabActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-[#2A2B36] text-[#475569] dark:text-[#EAE5DF]'
                  }`}>
                    {n(tab.count)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Advanced Date range selection */}
          {showFilters && (
            <div className="bg-slate-50 dark:bg-[#1C1D24] rounded-lg p-4 animate-in fade-in slide-in-from-top-2 border border-[#E2E8F0] dark:border-[#2A2B36]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Date Range</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 border-none bg-transparent cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setQuickFilter('custom');
                    }}
                    className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transactions Table Section */}
        <div className="relative">
          {isLoading && apiTransactions.length === 0 ? (
            <Card className="p-20 flex flex-col items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C]">
              <FiRefreshCw className="w-8 h-8 text-[#101B55] animate-spin mb-4" />
              <p className="text-slate-500 font-medium text-sm">Loading transactions...</p>
            </Card>
          ) : (
            <TransactionTable
              transactions={filteredTransactions}
              onView={handleViewTransaction}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
              onPrint={handlePrintTransaction}
              language={language}
            />
          )}
        </div>

        {/* Dialogs */}
        <SalesPurchaseDialog
          isOpen={salesDialog.open}
          onClose={() => setSalesDialog({ open: false })}
          type="sales"
          editData={salesDialog.editData}
          onSuccess={() => {
            setSalesDialog({ open: false });
            fetchTransactions();
          }}
        />

        <SalesPurchaseDialog
          isOpen={purchaseDialog.open}
          onClose={() => setPurchaseDialog({ open: false })}
          type="purchase"
          editData={purchaseDialog.editData}
          onSuccess={() => {
            setPurchaseDialog({ open: false });
            fetchTransactions();
          }}
        />

        <PaymentDialog
          isOpen={paymentInDialog.open}
          onClose={() => setPaymentInDialog({ open: false })}
          type="payment_in"
          editData={paymentInDialog.editData}
          onSuccess={() => setPaymentInDialog({ open: false })}
        />

        <PaymentDialog
          isOpen={paymentOutDialog.open}
          onClose={() => setPaymentOutDialog({ open: false })}
          type="payment_out"
          editData={paymentOutDialog.editData}
          onSuccess={() => setPaymentOutDialog({ open: false })}
        />

        <ExpenseIncomeDialog
          isOpen={expenseDialog.open}
          onClose={() => setExpenseDialog({ open: false })}
          type="expense"
          editData={expenseDialog.editData}
          onSuccess={() => {
            setExpenseDialog({ open: false });
            fetchTransactions();
          }}
        />

        <ExpenseIncomeDialog
          isOpen={incomeDialog.open}
          onClose={() => setIncomeDialog({ open: false })}
          type="income"
          editData={incomeDialog.editData}
          onSuccess={() => {
            setIncomeDialog({ open: false });
            fetchTransactions();
          }}
        />

        <ReturnDialog
          isOpen={salesReturnDialog.open}
          onClose={() => setSalesReturnDialog({ open: false })}
          type="sales_return"
          editData={salesReturnDialog.editData}
          onSuccess={() => setSalesReturnDialog({ open: false })}
        />

        <ReturnDialog
          isOpen={purchaseReturnDialog.open}
          onClose={() => setPurchaseReturnDialog({ open: false })}
          type="purchase_return"
          editData={purchaseReturnDialog.editData}
          onSuccess={() => setPurchaseReturnDialog({ open: false })}
        />

        <QuotationDialog
          isOpen={quotationDialog.open}
          onClose={() => setQuotationDialog({ open: false })}
          editData={quotationDialog.editData}
          onSuccess={() => setQuotationDialog({ open: false })}
        />

        <TransactionViewDialog
          isOpen={viewDialog.open}
          onClose={() => setViewDialog({ open: false })}
          transaction={viewDialog.transaction}
          onEdit={() => {
            setViewDialog({ open: false });
            if (viewDialog.transaction) {
              handleEditTransaction(viewDialog.transaction);
            }
          }}
          onPrint={() => {
            if (viewDialog.transaction) {
              handlePrintTransaction(viewDialog.transaction);
            }
          }}
        />

        <DeleteConfirmDialog
          isOpen={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false })}
          onConfirm={confirmDelete}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
          itemName={deleteDialog.transaction?.transactionNumber || deleteDialog.transaction?.description}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
