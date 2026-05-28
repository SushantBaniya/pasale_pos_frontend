import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { billingApi } from '../../utils/api';
import { 
  FiSearch, FiRefreshCcw, FiEye, FiShoppingBag, 
  FiTag, FiCalendar, FiPrinter, FiX, FiCheckCircle, 
  FiDollarSign, FiClock, FiAlertCircle 
} from 'react-icons/fi';
import { CustomerSection } from '../../components/billing/CustomerSection';
import { PaymentSection, PaymentEntry } from '../../components/billing/PaymentSection';
import { PaymentConfirmationModal } from '../../components/billing/PaymentConfirmationModal';
import { QRPayment } from '../../components/billing/QRPayment';

// Helper for currency formatting
const formatMoney = (n: any) =>
  `Rs ${new Intl.NumberFormat('en-IN').format(Number(n || 0))}`;

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

export default function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');

  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Customer & payment modal state
  const [modalParty, setModalParty] = useState<any>(null);
  const [modalPhone, setModalPhone] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: 'success' | 'failure';
    amount: number;
    method: string;
    message?: string;
  }>({ isOpen: false, status: 'success', amount: 0, method: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const billingsRes = await billingApi.getAll();
      const records = billingsRes.results || billingsRes || [];

      const sortedBillings = [...records].sort((a: any, b: any) => {
        const dateA = new Date(a.invoice_date || a.created_at || 0).getTime();
        const dateB = new Date(b.invoice_date || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setBillings(sortedBillings);
    } catch (err: any) {
      console.error('Failed to fetch billings:', err);
      setError(err.message || 'Failed to load billings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBilling(null);
    setSearchParams({});
    setModalParty(null);
    setModalPhone('');
    setModalNotes('');
  };

  // Sync modal state when a billing is selected
  useEffect(() => {
    if (selectedBilling) {
      setModalParty(selectedBilling.party || null);
      setModalPhone(selectedBilling.phone || '');
      setModalNotes(selectedBilling.notes || '');
    }
  }, [selectedBilling]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const billingId = searchParams.get('billingId');
    if (billingId) {
      billingApi.getById(billingId)
        .then((billing) => {
          setSelectedBilling(billing);
          setIsModalOpen(true);
        })
        .catch((err) => {
          console.error('Failed to load billing by id:', err);
        });
    }
  }, [searchParams]);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId || billings.length === 0) return;

    const matchingBilling = billings.find((billing) => {
      const billingOrderId = typeof billing.order === 'object' ? billing.order?.id : billing.order;
      return String(billingOrderId) === String(orderId);
    });

    if (matchingBilling) {
      setSelectedBilling(matchingBilling);
      setIsModalOpen(true);
    }
  }, [billings, searchParams]);

  const handlePaymentSubmit = async (entries: PaymentEntry[], totalPaid: number) => {
    if (!selectedBilling) return;

    try {
      setProcessing(true);
      const newPaidAmount = Number(selectedBilling.paid_amount || 0) + totalPaid;
      const newDueAmount = Math.max(0, Number(selectedBilling.total_amount) - newPaidAmount);
      const isFullyPaid = newDueAmount < 0.01;

      // Build split payment note
      const splitNote = entries.length > 1
        ? `Split: ${entries.map(e => `${e.method} Rs ${e.amount.toLocaleString()}`).join(' + ')}`
        : `${entries[0].method} Rs ${entries[0].amount.toLocaleString()}`;
      const existingNotes = modalNotes ? modalNotes + '\n' : '';
      const paymentNote = `${existingNotes}[Payment ${new Date().toLocaleString()}] ${splitNote}`;

      const updateData: any = {
        invoice_status: isFullyPaid ? 'Paid' : 'Pending',
        paid_amount: newPaidAmount,
        due_amount: newDueAmount,
        payment_method: entries[0].method,
        notes: paymentNote,
      };

      // Update customer info if changed
      if (modalParty?.id) updateData.party = modalParty.id;
      if (modalPhone) updateData.phone = modalPhone;

      await billingApi.update(selectedBilling.id, updateData);

      setSelectedBilling({
        ...selectedBilling,
        ...updateData,
        party: modalParty || selectedBilling.party,
        notes: paymentNote,
      });

      setConfirmModal({
        isOpen: true,
        status: 'success',
        amount: totalPaid,
        method: entries.length > 1 ? 'Split Payment' : entries[0].method,
      });

      fetchData();
    } catch (err: any) {
      console.error('Failed to process payment:', err);
      setConfirmModal({
        isOpen: true,
        status: 'failure',
        amount: totalPaid,
        method: entries[0]?.method || 'Payment',
        message: err.message || 'Failed to process payment. Please try again.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePrint = () => {
    if (!selectedBilling) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemsHtml = selectedBilling.items?.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <div style="font-weight: 700; color: #101B55;">${item.product_name || 'Item'}</div>
          <div style="font-size: 11px; color: #64748b;">Qty: ${item.quantity} @ Rs. ${item.rate.toLocaleString()}</div>
        </td>
        <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #101B55; border-bottom: 1px solid #f1f5f9;">
          Rs. ${(item.total_price || item.quantity * item.rate).toLocaleString()}
        </td>
      </tr>
    `).join('') || '<tr><td colspan="2" style="padding: 20px 0; text-align: center; color: #94a3b8;">No items found</td></tr>';

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${selectedBilling.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 900; color: #F2DD50; text-transform: uppercase; letter-spacing: 2px; }
            .invoice-info { text-align: right; }
            .invoice-id { font-size: 20px; font-weight: 900; color: #101B55; }
            .customer-section { margin-bottom: 40px; }
            .section-title { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .customer-name { font-size: 16px; font-weight: 700; color: #101B55; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .totals-table { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
            .grand-total { font-size: 20px; font-weight: 900; color: #F2DD50; border-top: 2px solid #f1f5f9; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; }
            @media print { .print-btn { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Pasale</div>
            <div class="invoice-info">
              <div class="invoice-id">INVOICE #${String(selectedBilling.id).padStart(6, '0')}</div>
              <div style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px;">${new Date(selectedBilling.invoice_date).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="customer-section">
            <div class="section-title">Billed To</div>
            <div class="customer-name">${modalParty?.name || selectedBilling.party?.name || 'Walk-in Customer'}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${modalPhone || selectedBilling.phone || selectedBilling.address || 'Cash Transaction'}</div>
            ${selectedBilling.payment_method ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Payment: ${selectedBilling.payment_method}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 12px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #f1f5f9;">Description</th>
                <th style="text-align: right; padding-bottom: 12px; font-size: 11px; font-weight: 900; color: #94a3b8; text-transform: uppercase; border-bottom: 2px solid #f1f5f9;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-table">
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">Subtotal</span>
              <span style="font-weight: 700; color: #101B55;">Rs. ${selectedBilling.sub_total.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span style="color: #64748b; font-weight: 600;">Discount</span>
              <span style="font-weight: 700; color: #10B981;">- Rs. ${selectedBilling.discount.toLocaleString()}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Amount</span>
              <span>Rs. ${selectedBilling.total_amount.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <div style="font-weight: 700; color: #101B55; margin-bottom: 4px;">Thank you for shopping at Pasale!</div>
            <div>Please keep this receipt for your records.</div>
          </div>

          <script>
            window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredBillings = billings.filter((billing) => {
    const formattedId = `#${String(billing.id).padStart(6, '0')}`;
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      formattedId.includes(searchQuery) ||
      billing.invoice_number?.toLowerCase().includes(search) ||
      billing.party?.name?.toLowerCase().includes(search) ||
      billing.notes?.toLowerCase().includes(search);

    const billingStatus = billing.invoice_status?.toLowerCase() || '';
    const isPending = billingStatus === 'pending' || billingStatus === 'unpaid' || billingStatus === 'draft';
    const isPaid = billingStatus === 'paid';

    let matchesStatus = true;
    if (statusFilter === 'Pending') {
      matchesStatus = isPending;
    } else if (statusFilter === 'Paid') {
      matchesStatus = isPaid;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (statusName: string) => {
    const status = statusName?.toLowerCase() || '';
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#DCFCE7] text-[#16A34A]">
          PAID
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium bg-[#FEF9C3] text-[#CA8A04]">
        PENDING
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date
      .toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      .toUpperCase();
  };

  // Financial aggregates for Stat Cards
  const totalBillingsCount = billings.length;
  const totalRevenue = billings
    .filter(b => b.invoice_status?.toLowerCase() === 'paid')
    .reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
  const outstandingDues = billings
    .filter(b => b.invoice_status?.toLowerCase() !== 'paid')
    .reduce((sum, b) => sum + Number(b.due_amount || b.total_amount || 0), 0);
  const pendingCount = billings.filter(b => b.invoice_status?.toLowerCase() !== 'paid').length;

  return (
    <div className="max-w-[1300px] mx-auto pb-10 mt-6 px-4">
      {/* Stat Cards - Exactly matching Inventory design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          label="TOTAL BILLINGS" 
          value={totalBillingsCount} 
          icon={<FiShoppingBag size={22} />} 
          iconBg="#EFF6FF" 
          iconColor="#3B82F6" 
        />
        <StatCard 
          label="TOTAL PAID REVENUE" 
          value={formatMoney(totalRevenue).replace('Rs ', '')} 
          icon={<FiCheckCircle size={22} />} 
          iconBg="#F0FDF4" 
          iconColor="#22C55E" 
        />
        <StatCard 
          label="OUTSTANDING DUES" 
          value={formatMoney(outstandingDues).replace('Rs ', '')} 
          icon={<FiDollarSign size={22} />} 
          iconBg="#FAF5FF" 
          iconColor="#A855F7" 
        />
        <StatCard 
          label="PENDING INVOICES" 
          value={pendingCount} 
          icon={<FiClock size={22} />} 
          iconBg="#FEF2F2" 
          iconColor="#EF4444" 
        />
      </div>

      {/* Action Bar (Search + Dropdown + Refresh Button) */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white dark:bg-[#15161C] p-3 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94A3B8]" size={16} />
          <input
            type="text"
            placeholder="Search billings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[13px] bg-white dark:bg-[#1C1D24] text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
          />
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#101B55]/90 text-white rounded-lg text-[13px] font-medium transition-colors border-none cursor-pointer"
        >
          <FiRefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Status capsule tabs and total billings label */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-5 flex-wrap">
          <span className="text-[11px] font-medium text-[#94A3B8] tracking-wider uppercase whitespace-nowrap">
            TOTAL INVOICES: <span className="text-[#101B55] dark:text-[#F2DD50]">{filteredBillings.length}</span>
          </span>
          
          {/* Status Tabs exactly styled like Inventory */}
          <div className="flex flex-wrap items-center gap-2">
            {([
              ['All', `All ${billings.length}`],
              ['Paid', `Paid ${billings.filter(b => b.invoice_status?.toLowerCase() === 'paid').length}`],
              ['Pending', `Pending ${pendingCount}`]
            ] as const).map(([s, label]) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors cursor-pointer border ${
                  statusFilter === s 
                    ? 'bg-[#101B55] text-white border-transparent' 
                    : 'bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table styled like Inventory */}
      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white dark:bg-[#1C1D24] border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">INVOICE</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">CUSTOMER</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">SUMMARY</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">TOTAL AMOUNT</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">STATUS</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider">TIMELINE</th>
                <th className="py-4 px-6 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading && billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="w-7 h-7 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-[13px] text-[#94A3B8]">Loading billings...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FiAlertCircle size={40} className="text-[#EF4444] mx-auto mb-3" />
                    <p className="text-red-500 font-medium mb-3">{error}</p>
                    <button onClick={fetchData} className="px-4 py-2 bg-[#101B55] text-white rounded-lg text-xs font-medium hover:bg-[#101B55]/90 border-none cursor-pointer">
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <FiShoppingBag size={40} className="text-[#E2E8F0] mx-auto mb-3" />
                    <p className="text-[14px] font-medium text-[#94A3B8]">No billings found</p>
                  </td>
                </tr>
              ) : (
                filteredBillings.map((billing) => {
                  const itemsCount = billing.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
                  const firstItemName = billing.items?.[0]?.product_name || 'Items';

                  return (
                    <tr
                      key={billing.id}
                      className="border-b border-[#F8FAFC] dark:border-[#2A2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedBilling(billing);
                        setIsModalOpen(true);
                      }}
                    >
                      <td className="py-4 px-6 font-medium text-slate-800 dark:text-[#EAE5DF] text-[13px]">
                        #{String(billing.id).padStart(6, '0')}
                        <div className="text-[11px] font-medium text-slate-400 mt-1">{billing.invoice_number || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-800 dark:text-[#EAE5DF] text-[13px]">
                        {billing.party?.name || 'Walk-in Customer'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-800 dark:text-[#EAE5DF] text-[13px]">{itemsCount} items</div>
                        <div className="text-xs text-slate-400 truncate max-w-[150px]">
                          {firstItemName}
                          {billing.items?.length > 1 ? ' ...' : ''}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-[#22C55E] text-[13px]">
                        {formatMoney(billing.total_amount)}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(billing.invoice_status)}</td>
                      <td className="py-4 px-6 font-medium text-slate-800 dark:text-[#EAE5DF] text-[11px]">
                        {formatDate(billing.invoice_date)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button className="text-[#94A3B8] hover:text-[#101B55] transition-colors p-1.5 hover:bg-slate-50 dark:hover:bg-[#1C1D24] rounded-lg">
                          <FiEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {isModalOpen && selectedBilling && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#15161C] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-[#E2E8F0] dark:border-[#2A2B36] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-[#EAE5DF]">
                    Invoice #{String(selectedBilling.id).padStart(6, '0')}
                  </h2>
                  <p className="text-sm font-medium text-slate-500">{selectedBilling.party?.name || 'Walk-in Customer'}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors border-none cursor-pointer"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-[#0D0E12]/50">
              <div className="mb-6">{getStatusBadge(selectedBilling.invoice_status)}</div>

              {/* Customer Section */}
              <CustomerSection
                selectedParty={modalParty}
                onPartyChange={setModalParty}
                phone={modalPhone}
                onPhoneChange={setModalPhone}
                notes={modalNotes}
                onNotesChange={setModalNotes}
              />

              {/* Invoice dates */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-sm">
                  <FiCalendar className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Invoice:</span>
                  <span className="font-medium text-slate-900 dark:text-[#EAE5DF]">
                    {selectedBilling.invoice_date ? new Date(selectedBilling.invoice_date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FiTag className="text-slate-400 w-4 h-4" />
                  <span className="text-slate-500 w-20">Due:</span>
                  <span className="font-medium text-slate-900 dark:text-[#EAE5DF]">
                    {selectedBilling.due_date ? new Date(selectedBilling.due_date).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invoice Items</h3>
              <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden mb-8">
                {selectedBilling.items?.length ? (
                  selectedBilling.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-50 dark:border-[#2A2B36] last:border-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-[#EAE5DF] mb-1">{item.product_name || 'Item'}</p>
                        <p className="text-xs font-medium text-slate-500">
                          Qty: {item.quantity} @ Rs. {item.rate.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 dark:text-[#EAE5DF]">
                          Rs. {(item.total_price || item.quantity * item.rate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-500">No billing items available.</div>
                )}
              </div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Price Breakdown</h3>
              <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-4 space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Subtotal:</span>
                  <span className="font-medium text-slate-900 dark:text-[#EAE5DF]">Rs. {selectedBilling.sub_total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Discount:</span>
                  <span className="font-medium text-emerald-500">- Rs. {selectedBilling.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Paid:</span>
                  <span className="font-medium text-slate-900 dark:text-[#EAE5DF]">Rs. {selectedBilling.paid_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-500">Due:</span>
                  <span className="font-medium text-slate-900 dark:text-[#EAE5DF]">Rs. {selectedBilling.due_amount.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-[#EAE5DF]">Total Amount:</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">Rs. {selectedBilling.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Section */}
              <PaymentSection
                totalAmount={Number(selectedBilling.total_amount || 0)}
                existingPaidAmount={Number(selectedBilling.paid_amount || 0)}
                onPaymentSubmit={handlePaymentSubmit}
                processing={processing}
                isPaid={selectedBilling.invoice_status?.toLowerCase() === 'paid'}
              />
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#E2E8F0] dark:border-[#2A2B36] bg-white dark:bg-[#15161C] flex justify-end gap-3">
              {selectedBilling?.invoice_status?.toLowerCase() !== 'paid' && (
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="px-6 py-2.5 rounded-lg font-bold text-white transition-colors cursor-pointer border-none shadow-md flex items-center gap-2 bg-[#101B55] hover:bg-[#0a113a]"
                >
                  <span className="font-bold">QR</span> Pay via QR
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-lg font-medium text-slate-600 border border-[#E2E8F0] hover:bg-slate-50 dark:text-slate-300 dark:border-[#2A2B36] dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-lg font-medium text-[#111827] bg-[#F2DD50] hover:bg-[#F2DD50]/90 transition-colors flex items-center gap-2 border-none cursor-pointer shadow-sm"
              >
                <FiPrinter className="w-4 h-4" /> Print Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={confirmModal.isOpen}
        status={confirmModal.status}
        amount={confirmModal.amount}
        method={confirmModal.method}
        message={confirmModal.message}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onRetry={confirmModal.status === 'failure' ? () => setConfirmModal({ ...confirmModal, isOpen: false }) : undefined}
      />

      {/* QR Payment Modal */}
      <QRPayment
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        amount={selectedBilling ? Number(selectedBilling.total_amount) : 0}
        orderId={selectedBilling?.invoice_number || 'UNKNOWN'}
        merchantName="Pasale Store"
        onSuccess={(transactionId) => {
          // Simulate marking invoice as paid
          if (selectedBilling) {
            const updatedBillings = billings.map(b => 
              b.id === selectedBilling.id ? { ...b, invoice_status: 'Paid' } : b
            );
            setBillings(updatedBillings);
            setSelectedBilling({ ...selectedBilling, invoice_status: 'Paid' });
            
            // Re-fetch from server (in real app)
            // fetchData();
          }
        }}
      />
    </div>
  );
}

