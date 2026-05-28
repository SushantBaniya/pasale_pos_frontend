import React, { useState, useEffect, useRef, useMemo } from 'react';
import { expenseApi, ApiExpenseData } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiCalendar, FiCamera, FiChevronDown, FiLoader,
  FiArrowUp, FiArrowDown, FiAlertCircle, FiTrendingDown,
  FiCreditCard, FiDollarSign, FiActivity, FiBriefcase
} from 'react-icons/fi';

// Types
interface ExpenseRecord {
  id: number;
  expense_number?: number | string;
  category: string;
  date: string;
  payment_method: string;
  amount: number;
  description: string;
  is_necessary?: boolean;
}

// Constants
const CATEGORIES = [
  'Rent', 'Utilities', 'Salary', 'Inventory', 'Transport',
  'Food', 'Office Supplies', 'Marketing', 'Phone', 'Other',
];

const PAYMENT_METHODS = ['Cash', 'Card', 'QR / Online', 'Cheque', 'Bank Transfer'];

const fmt = (n: number) =>
  `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)}`;

const fmtDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
};

// Stat Card component matching Inventory style
const StatCard: React.FC<{ 
  label: string; 
  value: string | number; 
  icon: React.ReactNode; 
  iconBg: string; 
  iconColor: string;
}> = ({ label, value, icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-5 flex justify-between items-center shadow-sm">
    <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: iconColor }}>
      {icon}
    </div>
    <div className="text-right">
      <p className="text-[11px] font-medium text-[#94A3B8] dark:text-[#64748B] tracking-wider uppercase mb-1">{label}</p>
      <p className="text-[32px] font-medium text-[#111827] dark:text-[#EAE5DF] leading-none">{value}</p>
    </div>
  </div>
);

// Premium Modal Component
function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-[#15161C] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#E2E8F0] dark:border-[#2A2B36] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <h2 className="text-base font-bold text-[#111827] dark:text-[#EAE5DF]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors border-none cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// Expense Form Component
interface ExpenseFormProps {
  initial?: Partial<ExpenseRecord>;
  onSave: (data: Omit<ApiExpenseData, never>) => Promise<void>;
  onClose: () => void;
  mode: 'add' | 'edit';
}

function ExpenseForm({ initial, onSave, onClose, mode }: ExpenseFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [expenseNo, setExpenseNo] = useState(initial?.expense_number?.toString() || '');
  const [date, setDate] = useState(initial?.date || today);
  const [category, setCategory] = useState(initial?.category || '');
  const [catSearch, setCatSearch] = useState(initial?.category || '');
  const [catOpen, setCatOpen] = useState(false);
  const [amount, setAmount] = useState(initial?.amount?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(initial?.payment_method || 'Cash');
  const [remarks, setRemarks] = useState(initial?.description || '');
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const filteredCats = CATEGORIES.filter(c =>
    c.toLowerCase().includes(catSearch.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = async () => {
    if (!category) { setError('Please select an expense category.'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        category: category as ApiExpenseData['category'],
        amount: parseFloat(amount),
        description: remarks,
        date,
        is_necessary: true,
        payment_method: paymentMethod,
        expense_number: expenseNo,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-[#64748B] uppercase tracking-wider">Expense No.</label>
          </div>
          <input
            type="text"
            value={expenseNo}
            onChange={e => setExpenseNo(e.target.value)}
            placeholder="Auto-generated"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div ref={catRef} className="relative">
        <label className="block text-xs font-bold text-gray-700 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Expense Category</label>
        <div
          className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus-within:border-[#101B55] cursor-pointer flex items-center justify-between"
          onClick={() => setCatOpen(v => !v)}
        >
          <input
            type="text"
            value={catSearch}
            onChange={e => { setCatSearch(e.target.value); setCatOpen(true); setCategory(''); }}
            placeholder="Search or select category"
            className="flex-1 bg-transparent outline-none text-[13px]"
            onClick={e => e.stopPropagation()}
          />
          <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
        </div>
        {catOpen && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg shadow-xl overflow-hidden max-h-[160px] overflow-y-auto">
            {filteredCats.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400">No categories found</div>
            ) : (
              filteredCats.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setCatSearch(cat); setCatOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-[#F2DD50]/15 ${category === cat ? 'bg-[#F1F5F9] dark:bg-[#F2DD50]/15 text-[#101B55] dark:text-[#F2DD50] font-bold' : 'text-gray-700 dark:text-[#64748B]'}`}
                >
                  {cat}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Total Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rs.</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-10 pr-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Payment Method</label>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2.5 pr-8 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] appearance-none"
            >
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-[#64748B] uppercase tracking-wider mb-1.5">Remarks</label>
        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          rows={3}
          placeholder="Enter remarks here..."
          className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] resize-none"
        />
      </div>

      <div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => setImages(Array.from(e.target.files || []))} />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 border-2 border-dashed border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#101B55] hover:text-[#101B55] transition-colors border-none cursor-pointer bg-slate-50 dark:bg-[#1C1D24]"
          >
            <FiCamera className="w-5 h-5 text-[#94A3B8]" />
            <span className="text-[9px] font-bold mt-0.5 text-[#94A3B8]">Photo</span>
          </button>
          {images.map((f, i) => (
            <div key={i} className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-center text-[9px] text-[#101B55] dark:text-[#F2DD50] font-medium text-center px-1 break-all">
              {f.name.slice(0, 10)}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg font-medium text-slate-600 border border-[#E2E8F0] hover:bg-slate-50 dark:text-slate-300 dark:border-[#2A2B36] dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-lg border-none cursor-pointer flex items-center gap-2"
        >
          {saving && <FiLoader className="w-4 h-4 animate-spin" />}
          {mode === 'add' ? 'Save Expense' : 'Update Expense'}
        </button>
      </div>
    </div>
  );
}

// Delete Confirm Component
function DeleteModal({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Delete Expense">
      <div className="space-y-5">
        <p className="text-sm text-[#475569] dark:text-[#64748B]">
          Are you sure you want to delete this expense? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-gray-700 transition-colors border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border-none cursor-pointer"
          >
            {loading && <FiLoader className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Main Page Component
export default function ExpenseMonitoringPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'expense_number'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadExpenses = async () => {
    try {
      const res = await expenseApi.getAll();
      const data: ExpenseRecord[] = (res.results || res || []).map((e: any, i: number) => ({
        id: e.id,
        expense_number: e.expense_number ?? e.id ?? i + 1,
        category: e.category,
        date: e.date,
        payment_method: e.payment_method || 'Cash',
        amount: parseFloat(e.amount || e.total_amount || 0),
        description: e.description || e.remarks || '',
        is_necessary: e.is_necessary,
      }));
      setExpenses(data);
    } catch (e) {
      console.error('Failed to load expenses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const filtered = useMemo(() => {
    let list = [...expenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        String(e.expense_number).includes(q)
      );
    }
    if (filterCategory) list = list.filter(e => e.category === filterCategory);
    if (filterPayment) list = list.filter(e => e.payment_method === filterPayment);
    if (filterDate) list = list.filter(e => e.date === filterDate);

    list.sort((a, b) => {
      let av: any = a[sortField];
      let bv: any = b[sortField];
      if (sortField === 'date') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (sortField === 'amount') { av = +av; bv = +bv; }
      if (sortField === 'expense_number') { av = +av; bv = +bv; }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return list;
  }, [expenses, search, filterCategory, filterPayment, filterDate, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleAdd = async (data: ApiExpenseData) => {
    await expenseApi.create(data);
    toast.success('Expense Added Successfully');
    setShowAdd(false);
    await loadExpenses();
  };

  const handleEdit = async (data: ApiExpenseData) => {
    if (!editTarget) return;
    await expenseApi.update(editTarget.id, data);
    toast.success('Expense Updated Successfully');
    setEditTarget(null);
    await loadExpenses();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseApi.delete(deleteTarget.id);
      toast.success('Expense Deleted');
      setDeleteTarget(null);
      await loadExpenses();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 inline-flex flex-col">
      <FiArrowUp className={`w-2.5 h-2.5 -mb-0.5 ${sortField === field && sortDir === 'asc' ? 'text-[#F2DD50]' : 'text-gray-300'}`} />
      <FiArrowDown className={`w-2.5 h-2.5 ${sortField === field && sortDir === 'desc' ? 'text-[#F2DD50]' : 'text-gray-300'}`} />
    </span>
  );

  // Financial aggregates for Stat Cards
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const utilitiesAmount = expenses
    .filter(e => e.category?.toLowerCase() === 'utilities' || e.category?.toLowerCase() === 'rent')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const salaryAmount = expenses
    .filter(e => e.category?.toLowerCase() === 'salary')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const officeAmount = expenses
    .filter(e => !['utilities', 'rent', 'salary'].includes(e.category?.toLowerCase() || ''))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="max-w-[1300px] mx-auto pb-10 mt-6 px-4">
      {/* Stat Cards matching Inventory layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="TOTAL EXPENSE" 
          value={fmt(totalExpenseAmount).replace('Rs. ', '')} 
          icon={<FiTrendingDown size={22} />} 
          iconBg="#FEF2F2" 
          iconColor="#EF4444" 
        />
        <StatCard 
          label="RENT & UTILITIES" 
          value={fmt(utilitiesAmount).replace('Rs. ', '')} 
          icon={<FiActivity size={22} />} 
          iconBg="#EFF6FF" 
          iconColor="#3B82F6" 
        />
        <StatCard 
          label="SALARY & STAFF" 
          value={fmt(salaryAmount).replace('Rs. ', '')} 
          icon={<FiBriefcase size={22} />} 
          iconBg="#F0FDF4" 
          iconColor="#22C55E" 
        />
        <StatCard 
          label="OTHER OPERATIONAL" 
          value={fmt(officeAmount).replace('Rs. ', '')} 
          icon={<FiCreditCard size={22} />} 
          iconBg="#FAF5FF" 
          iconColor="#A855F7" 
        />
      </div>

      {/* Action / Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-[#15161C] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            placeholder="Search Expense..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="py-2 px-3 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Payment filter */}
        <select
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value)}
          className="py-2 px-3 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] outline-none cursor-pointer"
        >
          <option value="">All Payment Modes</option>
          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Date filter */}
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="py-2 px-3 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] outline-none cursor-pointer"
        />

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#101B55]/90 text-white rounded-lg text-[13px] font-medium transition-colors border-none cursor-pointer shadow-sm"
        >
          <FiPlus size={15} /> Add Expense
        </button>
      </div>

      {/* Table Label / Status Tabs Area */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-5 flex-wrap">
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-wider uppercase whitespace-nowrap">
            TOTAL EXPENSES: <span className="text-[#101B55] dark:text-[#F2DD50]">{filtered.length}</span>
          </span>
          {(search || filterCategory || filterPayment || filterDate) && (
            <button
              onClick={() => { setSearch(''); setFilterCategory(''); setFilterPayment(''); setFilterDate(''); }}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-[11px] font-bold transition-colors border-none cursor-pointer"
            >
              <FiX className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table styled like Inventory */}
      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('expense_number')}>EXP NO. <SortIcon field="expense_number" /></th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">CATEGORY</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('date')}>DATE <SortIcon field="date" /></th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">PAYMENT MODE</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider cursor-pointer" onClick={() => toggleSort('amount')}>AMOUNT <SortIcon field="amount" /></th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">REMARKS</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="w-7 h-7 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[13px] text-[#94A3B8]">Loading expenses...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FiAlertCircle size={40} className="text-[#E2E8F0] mx-auto mb-3" />
                    <p className="text-[14px] font-medium text-[#94A3B8]">No expenses found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors"
                  >
                    <td className="py-4 px-6 text-[13px] font-medium text-[#111827] dark:text-[#EAE5DF]">
                      {expense.expense_number}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FAF5FF] dark:bg-[#2A2B36] text-[#A855F7] dark:text-[#EAE5DF] uppercase">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-slate-800 dark:text-[#EAE5DF]">
                      {fmtDate(expense.date)}
                    </td>
                    <td className="py-4 px-6 text-[13px] text-slate-800 dark:text-[#EAE5DF]">
                      {expense.payment_method}
                    </td>
                    <td className="py-4 px-6 text-[13px] font-medium text-red-500">
                      {fmt(expense.amount)}
                    </td>
                    <td className="py-4 px-6 text-[13px] text-slate-500 dark:text-[#94A3B8] max-w-[180px] truncate">
                      {expense.description || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-4">
                        <button
                          onClick={() => setEditTarget(expense)}
                          className="text-[#94A3B8] hover:text-[#101B55] transition-colors border-none cursor-pointer bg-transparent"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="text-[#EF4444] hover:text-red-700 transition-colors border-none cursor-pointer bg-transparent"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense">
        <ExpenseForm mode="add" onSave={handleAdd} onClose={() => setShowAdd(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Expense">
        {editTarget && (
          <ExpenseForm
            mode="edit"
            initial={editTarget}
            onSave={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        )}
      </Modal>

      {/* Delete Modal */}
      <DeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}