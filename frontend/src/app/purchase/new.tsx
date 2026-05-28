import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingApi, productApi, partyApi } from '../../utils/api';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface InvoiceItem {
  product_id: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function CreatePurchaseBillPage() {
  const navigate = useNavigate();
  const [parties, setParties] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceStatus, setInvoiceStatus] = useState('Unpaid');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(13);
  const [items, setItems] = useState<InvoiceItem[]>([
    { product_id: '', product_name: '', quantity: 1, rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [partiesRes, productsRes] = await Promise.all([
          partyApi.getAll('Supplier'),
          productApi.getAll(),
        ]);
        setParties(partiesRes.results || partiesRes || []);
        setProducts(productsRes.results || productsRes || []);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchData();
  }, []);

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'product_id') {
        const product = products.find((p: any) => String(p.id) === String(value));
        if (product) {
          updated[index] = {
            ...updated[index],
            product_id: String(product.id),
            product_name: product.product_name,
            rate: product.cost_price || product.unit_price || 0,
            amount: (updated[index].quantity || 1) * (product.cost_price || product.unit_price || 0),
          };
        }
      } else if (field === 'quantity') {
        const qty = Math.max(1, parseInt(value) || 1);
        updated[index] = { ...updated[index], quantity: qty, amount: qty * updated[index].rate };
      } else if (field === 'rate') {
        const rate = parseFloat(value) || 0;
        updated[index] = { ...updated[index], rate, amount: updated[index].quantity * rate };
      }
      return updated;
    });
  };

  const addRow = () => {
    setItems(prev => [...prev, { product_id: '', product_name: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discount || 0;
  const taxAmount = ((subtotal - discountAmount) * taxPercent) / 100;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const handleSubmit = async () => {
    if (items.every(i => !i.product_id)) {
      toast.error('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        transaction_type: 'Purchase',
        invoice_number: `PUR-${Date.now()}`,
        invoice_date: date,
        invoice_status: invoiceStatus,
        party: partyId ? parseInt(partyId) : null,
        notes: remarks,
        discount: discountAmount,
        tax: taxAmount,
        sub_total: subtotal,
        total_amount: grandTotal,
        payment_method: paymentMethod,
        business_id: localStorage.getItem('business_id'),
        items: items
          .filter(i => i.product_id)
          .map(i => ({
            item: parseInt(i.product_id),
            quantity: i.quantity,
            rate: i.rate,
            total_price: i.amount,
          })),
      };

      await billingApi.create(payload);

      // Add stock for each purchased item
      for (const item of items.filter(i => i.product_id)) {
        const product = products.find((p: any) => String(p.id) === item.product_id);
        if (product) {
          const newQty = (product.quantity || 0) + item.quantity;
          await productApi.update(item.product_id, { quantity: newQty });
        }
      }

      toast.success('Purchase bill recorded successfully!');
      navigate('/purchase');
    } catch (err: any) {
      console.error('Error creating purchase bill:', err);
      toast.error(err.message || 'Failed to record purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto pb-10 mt-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/purchase')}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#1C1D24] flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36] text-slate-500 hover:text-[#101B55] cursor-pointer"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF]">Record Purchase Bill</h1>
          <p className="text-xs text-slate-400 mt-0.5">Input details to log raw stock purchases or business materials</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-hidden shadow-sm">
        
        {/* Supplier, Date, Status */}
        <div className="p-6 border-b border-[#E2E8F0] dark:border-[#2A2B36] bg-slate-50/50 dark:bg-[#1C1D24]/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">
                Supplier / Party
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] text-sm focus:outline-none"
              >
                <option value="">Cash Purchase</option>
                {parties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Status</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] text-sm focus:outline-none"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="p-6 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <h3 className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-4">Invoice Items</h3>
          
          <div className="grid grid-cols-[2fr_80px_100px_100px_40px] gap-3 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ITEM</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">QTY</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">RATE</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">AMOUNT</span>
            <span></span>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[2fr_80px_100px_100px_40px] gap-3 items-center">
                <select
                  value={item.product_id}
                  onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] text-xs focus:outline-none"
                >
                  <option value="">Select item</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-full px-2 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-xs text-center text-slate-800 dark:text-[#EAE5DF] focus:outline-none font-bold"
                />
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                  className="w-full px-2 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-xs text-center text-slate-800 dark:text-[#EAE5DF] focus:outline-none font-bold"
                />
                <div className="text-xs font-extrabold text-slate-800 dark:text-[#EAE5DF] text-right py-2">
                  {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <button
                  onClick={() => removeRow(index)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-[#101B55] dark:text-[#F2DD50] text-xs font-bold hover:underline uppercase tracking-wider mt-4 border-none bg-transparent cursor-pointer"
          >
            <FiPlus className="w-4 h-4" /> Add Row
          </button>
        </div>

        {/* Payment & Summary */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-[#1C1D24]/10">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] text-xs focus:outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Remarks / Notes</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add purchase notes..."
                className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 bg-white dark:bg-[#1C1D24]/40 p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36]">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">Subtotal</span>
              <span className="text-slate-700 dark:text-[#EAE5DF]">
                {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">Discount (Rs.)</span>
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-md bg-white dark:bg-[#15161C] text-xs text-right text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-slate-400">Tax (%)</span>
              <input
                type="number"
                min={0}
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-md bg-white dark:bg-[#15161C] text-xs text-right text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
              />
            </div>
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between font-bold uppercase tracking-wider">
              <span className="text-slate-700 dark:text-[#EAE5DF]">Grand Total</span>
              <span className="text-base font-extrabold text-[#101B55] dark:text-[#F2DD50]">
                {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-[#1C1D24]/30">
          <button
            onClick={() => navigate('/purchase')}
            className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-100 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg border-none cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Purchase Bill'}
          </button>
        </div>
      </div>
    </div>
  );
}
