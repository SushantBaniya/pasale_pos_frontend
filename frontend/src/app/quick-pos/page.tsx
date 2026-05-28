import React, { useState, useEffect, useRef } from 'react';
import { productApi, partyApi, billingApi } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiSearch, FiPlus, FiMinus, FiTrash2, FiEdit2,
  FiX, FiCalendar, FiCamera, FiPrinter, FiSave,
  FiChevronDown, FiInfo, FiLink, FiPackage
} from 'react-icons/fi';

//  Types 

interface Product {
  id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  category?: string;
}

interface Party {
  id: number;
  name: string;
  balance?: number;
}

interface BillingItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  unit?: string;
}

//  Helpers 

const fmt = (n: number) =>
  `Rs. ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`;

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = [
  '#101B55', '#2563EB', '#E97B54', '#9B6DE8', '#F2DD50', '#0891B2'
];
const avatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const roundTo = (value: number, places = 2) => Number(value.toFixed(places));
const countDigits = (value: number, places = 2) => {
  const normalized = Math.abs(value).toFixed(places);
  return normalized.replace('.', '').length;
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
};

const openInvoicePrintWindow = (data: {
  invoiceNumber: string;
  invoiceDate: string;
  partyName: string;
  paymentMethod: string;
  notes: string;
  items: Array<{ name: string; qty: number; rate: number; total: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}) => {
  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return;

  const itemsHtml = data.items.map((item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
        <div style="font-weight: 700; color: #101B55;">${item.name}</div>
      </td>
      <td style="padding: 10px 0; text-align: center; border-bottom: 1px solid #e2e8f0;">${item.qty}</td>
      <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e2e8f0;">Rs. ${item.rate.toLocaleString()}</td>
      <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700;">Rs. ${item.total.toLocaleString()}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="padding: 20px 0; text-align: center; color: #94a3b8;">No items</td></tr>';

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice ${data.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
          .brand { font-size: 22px; font-weight: 900; color: #101B55; letter-spacing: 1px; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          .meta strong { display: block; font-size: 16px; color: #101B55; margin-bottom: 6px; }
          .section { margin-top: 18px; }
          .label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
          th:nth-child(2) { text-align: center; }
          th:nth-child(3), th:nth-child(4) { text-align: right; }
          .totals { margin-top: 18px; width: 320px; margin-left: auto; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .total-strong { font-size: 18px; font-weight: 900; color: #101B55; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 6px; }
          .note { margin-top: 24px; font-size: 12px; color: #64748b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Pasale</div>
          <div class="meta">
            <strong>INVOICE</strong>
            <div>${data.invoiceNumber}</div>
            <div>${formatDate(data.invoiceDate)}</div>
          </div>
        </div>

        <div class="section">
          <div class="label">Billed To</div>
          <div style="font-weight: 700; margin-top: 6px;">${data.partyName}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Payment: ${data.paymentMethod}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row"><span>Subtotal</span><span>Rs. ${data.subtotal.toLocaleString()}</span></div>
          <div class="totals-row"><span>Discount</span><span>- Rs. ${data.discount.toLocaleString()}</span></div>
          <div class="totals-row"><span>Tax</span><span>Rs. ${data.tax.toLocaleString()}</span></div>
          <div class="totals-row total-strong"><span>Total</span><span>Rs. ${data.total.toLocaleString()}</span></div>
        </div>

        ${data.notes ? `<div class="note"><strong>Notes:</strong> ${data.notes}</div>` : ''}

        <script>
          window.onload = function () { window.print(); };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

//  Sub-components 

function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-[#15161C] rounded-2xl shadow-2xl w-full mx-4 border border-[#E2E8F0] dark:border-[#2A2B36] ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <h2 className="text-base font-bold text-slate-800 dark:text-[#EAE5DF]">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

//  Apply Discount Modal 

function DiscountModal({ open, onClose, subtotal, onApply }: {
  open: boolean; onClose: () => void; subtotal: number;
  onApply: (pct: number, amt: number) => void;
}) {
  const [pct, setPct] = useState('');
  const [amt, setAmt] = useState('');
  const [linked, setLinked] = useState(true);

  const handlePctChange = (v: string) => {
    setPct(v);
    if (linked) {
      const p = parseFloat(v) || 0;
      setAmt(((subtotal * p) / 100).toFixed(2));
    }
  };
  const handleAmtChange = (v: string) => {
    setAmt(v);
    if (linked) {
      const a = parseFloat(v) || 0;
      setPct(((a / subtotal) * 100).toFixed(2));
    }
  };

  const handleApply = () => {
    onApply(parseFloat(pct) || 0, parseFloat(amt) || 0);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Apply Discount">
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
          <span className="text-sm font-bold text-slate-800 dark:text-[#EAE5DF]">{fmt(subtotal)}</span>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Discount Value</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder="0"
                value={pct}
                onChange={e => handlePctChange(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
            <button
              onClick={() => setLinked(!linked)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                linked ? 'border-[#101B55] bg-blue-50 dark:bg-blue-900/20 text-[#101B55]' : 'border-[#E2E8F0] dark:border-[#2A2B36] text-slate-400'
              }`}
            >
              <FiLink className="w-4 h-4" />
            </button>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                placeholder="0.00"
                value={amt}
                onChange={e => handleAmtChange(e.target.value)}
                className="w-full px-3 py-2.5 pl-10 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer border-none"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </Modal>
  );
}

//  VAT Modal 

function VATModal({ open, onClose, taxableAmount, onApply }: {
  open: boolean; onClose: () => void; taxableAmount: number;
  onApply: (pct: number) => void;
}) {
  const [pct, setPct] = useState('13');

  return (
    <Modal open={open} onClose={onClose} title="Apply VAT / Tax">
      <div className="space-y-4">
        <div className="bg-slate-50 dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxable Amount</span>
          <span className="text-sm font-bold text-slate-800 dark:text-[#EAE5DF]">{fmt(taxableAmount)}</span>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Tax Rate</label>
          <div className="relative">
            <input
              type="number"
              value={pct}
              onChange={e => setPct(e.target.value)}
              className="w-full px-3 py-2.5 pr-8 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
          </div>
          <div className="flex gap-2 mt-2">
            {['0', '5', '13', '15'].map(v => (
              <button
                key={v}
                onClick={() => setPct(v)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border-none ${
                  pct === v ? 'bg-[#101B55] text-white' : 'bg-slate-100 dark:bg-[#1C1D24] text-slate-600 dark:text-[#EAE5DF]'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => { onApply(parseFloat(pct) || 0); onClose(); }}
            className="flex-1 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-colors border-none cursor-pointer"
          >
            Apply VAT
          </button>
        </div>
      </div>
    </Modal>
  );
}

//  Add New Item Modal 

function AddNewItemModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    product_name: '', category: 'General', item_type: 'Product',
    unit_price: '', purchase_price: '', quantity: '', unit: 'PIECES (PCS)',
    item_code: '', hs_code: '', description: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.product_name) { toast.error('Item name is required'); return; }
    setSaving(true);
    try {
      await onSave({
        product_name: form.product_name,
        category: form.category,
        unit_price: parseFloat(form.unit_price) || 0,
        purchase_price: parseFloat(form.purchase_price) || 0,
        quantity: parseInt(form.quantity) || 0,
        unit: form.unit,
        item_code: form.item_code,
        hs_code: form.hs_code,
        description: form.description,
      });
      setForm({ product_name: '', category: 'General', item_type: 'Product', unit_price: '', purchase_price: '', quantity: '', unit: 'PIECES (PCS)', item_code: '', hs_code: '', description: '' });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const generateCode = () => set('item_code', `ITEM-${Math.floor(Math.random() * 90000) + 10000}`);

  return (
    <Modal open={open} onClose={onClose} title="Add New Item" wide>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Name</label>
          <input
            type="text"
            value={form.product_name}
            onChange={e => set('product_name', e.target.value)}
            placeholder="Enter item name"
            className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            >
              <option>General</option>
              <option>Electronics</option>
              <option>Food</option>
              <option>Clothing</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Type</label>
            <div className="flex gap-2">
              {['Product', 'Service'].map(t => (
                <button
                  key={t}
                  onClick={() => set('item_type', t)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl border transition-colors cursor-pointer ${
                    form.item_type === t ? 'border-[#101B55] bg-blue-50 dark:bg-blue-900/20 text-[#101B55]' : 'border-[#E2E8F0] dark:border-[#2A2B36] text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sales Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                value={form.unit_price}
                onChange={e => set('unit_price', e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-12 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/PCS</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Purchase Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                value={form.purchase_price}
                onChange={e => set('purchase_price', e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-12 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/PCS</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Opening Stock</label>
            <div className="relative">
              <input
                type="number"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                placeholder="0"
                className="w-full px-3 pr-12 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">PCS</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primary Unit</label>
            <select
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            >
              <option>PIECES (PCS)</option>
              <option>KILOGRAMS (KG)</option>
              <option>LITERS (L)</option>
              <option>METERS (M)</option>
              <option>BOXES (BOX)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.item_code}
                onChange={e => set('item_code', e.target.value)}
                placeholder="Enter item code"
                className="flex-1 px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
              <button
                onClick={generateCode}
                className="px-3 py-2.5 bg-slate-100 dark:bg-[#1C1D24] text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors border-none cursor-pointer"
              >
                Generate
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">HS Code</label>
            <input
              type="text"
              value={form.hs_code}
              onChange={e => set('hs_code', e.target.value)}
              placeholder="Enter HS code"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Write description here..."
            rows={3}
            className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl border-none disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

//  Edit Item Price Modal 

function EditItemModal({ open, onClose, item, onSave }: {
  open: boolean; onClose: () => void;
  item: BillingItem | null;
  onSave: (id: number, price: number, qty: number) => void;
}) {
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('');

  useEffect(() => {
    if (item) { setPrice(item.price.toString()); setQty(item.quantity.toString()); }
  }, [item]);

  if (!item) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Edit  ${item.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rate / Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-[#101B55] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quantity</label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
          <button
            onClick={() => { onSave(item.id, parseFloat(price) || 0, parseInt(qty) || 1); onClose(); }}
            className="flex-1 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl border-none transition-colors cursor-pointer"
          >
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
}

//  Confirm Sale Modal 

function ConfirmSaleModal({ open, onClose, total, parties, onConfirm }: {
  open: boolean; onClose: () => void; total: number;
  parties: Party[]; onConfirm: (data: any) => Promise<void>;
}) {
  const today = new Date();

  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today.toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(total.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setReceivedAmount(total.toFixed(2));
  }, [total]);

  const handleConfirm = async (print: boolean) => {
    setSaving(true);
    try {
      await onConfirm({ invoiceNo, invoiceDate, partyId, receivedAmount: parseFloat(receivedAmount), paymentMethod, notes, print });
    } finally {
      setSaving(false);
    }
  };

  const selectedParty = parties.find(p => p.id === parseInt(partyId));
  const balance = selectedParty?.balance ?? 0;

  return (
    <Modal open={open} onClose={onClose} title="Confirm Sale" wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Invoice No
            </label>
            <input
              type="text"
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              placeholder="Auto-generated"
              className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Date</label>
            <div className="relative">
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill To Party</label>
            <span className="text-xs font-medium text-slate-400">Balance: Rs. {balance.toFixed(2)}</span>
          </div>
          <div className="relative">
            <select
              value={partyId}
              onChange={e => setPartyId(e.target.value)}
              className="w-full px-3 py-2.5 pr-8 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] appearance-none"
            >
              <option value="">Walk-in Customer</option>
              {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl px-4 py-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales Invoice Amount: </span>
          <span className="text-sm font-bold text-slate-800 dark:text-[#EAE5DF]">{fmt(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Received Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs.</span>
              <input
                type="number"
                value={receivedAmount}
                onChange={e => setReceivedAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Method</label>
            <div className="relative">
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 pr-8 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] appearance-none"
              >
                <option>Cash</option>
                <option>Card</option>
                <option>QR / Online</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remarks / Internal Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attach Receipt Image</label>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => setImages(Array.from(e.target.files || []))} />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 border border-dashed border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-[#101B55] hover:text-[#101B55] transition-colors bg-transparent cursor-pointer"
            >
              <FiCamera className="w-5 h-5" />
            </button>
            {images.map((f, i) => (
              <div key={i} className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-bold truncate px-1 text-center border border-[#E2E8F0] dark:border-[#2A2B36]">
                {f.name.slice(0, 8)}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-600 bg-white rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-700 bg-white dark:bg-[#15161C] rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <FiSave className="w-4 h-4" /> Save Draft
          </button>
          <button
            onClick={() => handleConfirm(true)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl border-none disabled:opacity-50 transition-colors cursor-pointer"
          >
            <FiPrinter className="w-4 h-4" /> Print Invoice
          </button>
        </div>
      </div>
    </Modal>
  );
}

//  Main Page 

export default function QuickPOSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Billing items
  const [items, setItems] = useState<BillingItem[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAmt, setDiscountAmt] = useState(0);
  const [taxPct, setTaxPct] = useState(13);

  // Modal states
  const [showDiscount, setShowDiscount] = useState(false);
  const [showVAT, setShowVAT] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editItem, setEditItem] = useState<BillingItem | null>(null);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [pr, par] = await Promise.all([productApi.getAll(), partyApi.getAll()]);
        setProducts(pr.results || pr || []);
        setParties(par.results || par || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Categories derived from products
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'General').filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || (p.category || 'General') === activeCategory;
    const matchSearch = !search || p.product_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Cart ops
  const addItem = (p: Product) => {
    setItems(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        if (ex.quantity >= ex.stock) { toast.error(`Only ${ex.stock} in stock`); return prev; }
        return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: p.id, name: p.product_name, price: p.unit_price, quantity: 1, stock: p.quantity }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nq = i.quantity + delta;
      if (nq <= 0) return i;
      if (nq > i.stock) { toast.error(`Only ${i.stock} in stock`); return i; }
      return { ...i, quantity: nq };
    }));
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const updateItemPriceQty = (id: number, price: number, qty: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, price, quantity: qty } : i));
  };

  // Totals
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const finalDiscount = discountAmt || (subtotal * discountPct) / 100;
  const taxable = subtotal - finalDiscount;
  const taxAmount = (taxable * taxPct) / 100;
  const grandTotal = taxable + taxAmount;

  // Add new item to inventory
  const handleAddNewItem = async (data: any) => {
    try {
      await productApi.create(data);
      toast.success('Item Added Successfully');
      const pr = await productApi.getAll();
      setProducts(pr.results || pr || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to add item');
      throw e;
    }
  };

  // Confirm sale
  const handleConfirmSale = async (opts: any) => {
    try {
      const isDraft = opts.print === false;
      const subTotalForPayload = roundTo(subtotal, 2);
      const totalForPayload = roundTo(grandTotal, 2);
      const taxForPayload = roundTo(taxAmount, 2);

      if (countDigits(subTotalForPayload, 2) > 12) {
        toast.error('Sub total must be 12 digits or fewer.');
        return;
      }

      if (isDraft && countDigits(taxForPayload, 2) > 12) {
        toast.error('Tax must be 12 digits or fewer for a draft.');
        return;
      }

      const payload = {
        transaction_type: 'Sales',
        invoice_number: opts.invoiceNo || `POS-${Date.now()}`,
        invoice_date: opts.invoiceDate,
        invoice_status: 'Paid',
        party: opts.partyId ? parseInt(opts.partyId) : null,
        notes: opts.notes,
        discount: finalDiscount,
        tax: taxForPayload,
        sub_total: subTotalForPayload,
        total_amount: totalForPayload,
        payment_method: opts.paymentMethod,
        business_id: localStorage.getItem('business_id'),
        items: items.map(i => ({
          item: i.id,
          quantity: i.quantity,
          rate: i.price,
          total_price: i.price * i.quantity,
        })),
      };
      await billingApi.create(payload);

      toast.success('Sales Invoice Added Successfully');
      setItems([]);
      setDiscountPct(0);
      setDiscountAmt(0);
      setShowConfirm(false);

      const pr = await productApi.getAll();
      setProducts(pr.results || pr || []);

      if (opts.print) {
        openInvoicePrintWindow({
          invoiceNumber: payload.invoice_number,
          invoiceDate: payload.invoice_date,
          partyName: opts.partyId
            ? (parties.find(p => p.id === parseInt(opts.partyId))?.name || 'Customer')
            : 'Walk-in Customer',
          paymentMethod: payload.payment_method,
          notes: payload.notes || '',
          items: items.map(i => ({
            name: i.name,
            qty: i.quantity,
            rate: i.price,
            total: roundTo(i.price * i.quantity, 2),
          })),
          subtotal: subTotalForPayload,
          discount: roundTo(finalDiscount, 2),
          tax: taxForPayload,
          total: totalForPayload,
        });
      }
    } catch (e: any) {
      toast.error(e.message || 'Checkout failed');
      throw e;
    }
  };

  const clearAll = () => {
    setItems([]);
    setDiscountPct(0);
    setDiscountAmt(0);
    setTaxPct(13);
  };

  return (
    <div className="quick-pos-root flex h-[calc(100vh-64px)] bg-slate-50 dark:bg-gray-950 overflow-hidden">

      {/*  LEFT: Product Catalog  */}
      <div className="no-print flex-1 flex flex-col min-w-0 px-6 py-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-slate-800 dark:text-[#EAE5DF]">Quick POS Cashier Counter</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search inventory items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] w-56 transition-all"
              />
            </div>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] text-slate-700 dark:text-[#EAE5DF] text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FiPlus className="w-4 h-4" /> Add New Item
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-0.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                activeCategory === cat
                  ? 'bg-[#101B55] text-white border-transparent'
                  : 'bg-white dark:bg-[#15161C] text-slate-600 dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FiPackage className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No items found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-[#2A2B36] bg-slate-50/50 dark:bg-[#1C1D24]">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item ↑</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selling Price</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Cart Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2A2B36]">
                  {filtered.map(p => {
                    const inCart = items.find(i => i.id === p.id);
                    const outOfStock = p.quantity <= 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group bg-white dark:bg-[#15161C]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-[13px] font-bold text-slate-800 dark:text-[#EAE5DF]">{p.product_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider">#{p.id.toString().padStart(3, '0')}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{p.category || 'General'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[13px] font-bold text-emerald-500 dark:text-emerald-400">{fmt(p.unit_price)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[13px] font-bold text-slate-800 dark:text-[#EAE5DF]">{p.quantity} <span className="text-[11px] text-slate-400 font-medium ml-1">units</span></span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {outOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 tracking-wider">
                              OUT OF STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 tracking-wider">
                              AVAILABLE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {inCart ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center gap-1 bg-white dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg p-0.5">
                                <button
                                  onClick={() => { if (inCart.quantity <= 1) removeItem(p.id); else updateQty(p.id, -1); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  <FiMinus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] w-5 text-center">{inCart.quantity}</span>
                                <button
                                  onClick={() => updateQty(p.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                                >
                                  <FiPlus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                onClick={() => removeItem(p.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer border-none bg-transparent ml-1"
                                title="Remove from cart"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => !outOfStock && addItem(p)}
                              disabled={outOfStock}
                              className={`px-5 py-2 text-[11px] font-bold rounded-lg border transition-colors uppercase tracking-wider ${
                                outOfStock 
                                  ? 'border-[#E2E8F0] dark:border-[#2A2B36] text-slate-400 cursor-not-allowed bg-slate-50 dark:bg-slate-900' 
                                  : 'border-[#101B55] text-[#101B55] dark:border-[#F2DD50] dark:text-[#F2DD50] hover:bg-blue-50 dark:hover:bg-yellow-950/20 cursor-pointer bg-transparent'
                              }`}
                            >
                              Add to Cart
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/*  RIGHT: Billing Panel  */}
      <div className="quick-pos-receipt w-[320px] shrink-0 bg-white dark:bg-[#15161C] border-l border-[#E2E8F0] dark:border-[#2A2B36] flex flex-col">
        {/* Billing Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#EAE5DF]">
              Billing Cart {items.length > 0 && `(${items.length})`}
            </span>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearAll}
              className="no-print text-xs font-bold text-red-500 hover:text-red-700 transition-colors border-none bg-transparent cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Billing Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 mb-4 opacity-20">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="8" width="60" height="64" rx="4" fill="#94a3b8" />
                  <rect x="20" y="20" width="40" height="4" rx="2" fill="white" />
                  <rect x="20" y="30" width="30" height="4" rx="2" fill="white" />
                  <rect x="20" y="40" width="35" height="4" rx="2" fill="white" />
                  <rect x="20" y="50" width="25" height="4" rx="2" fill="white" />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Items Added</p>
              <p className="text-[11px] text-slate-400 mt-1">Select products on the left to start billing.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-3 bg-slate-50 dark:bg-[#1C1D24]/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.quantity} PCS x {fmt(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => setEditItem(item)}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-[#101B55] transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36] rounded-md text-slate-500 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <FiMinus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36] rounded-md text-slate-500 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <FiPlus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-[#101B55] dark:text-[#F2DD50]">{fmt(item.price * item.quantity)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Section */}
        <div className="border-t border-[#E2E8F0] dark:border-[#2A2B36] px-5 py-4 space-y-2.5 bg-slate-50 dark:bg-[#1C1D24]">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <span>Sub Total</span>
            <span className="text-slate-800 dark:text-[#EAE5DF]">{fmt(subtotal)}</span>
          </div>

          {/* Discount row */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <div className="flex items-center gap-1.5">
              <span>Discount</span>
              <button onClick={() => setShowDiscount(true)} className="text-slate-400 hover:text-[#101B55] transition-colors border-none bg-transparent cursor-pointer">
                <FiEdit2 className="w-3 h-3" />
              </button>
              {finalDiscount > 0 && (
                <button onClick={() => { setDiscountPct(0); setDiscountAmt(0); }} className="text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {finalDiscount > 0 ? (
              <span className="text-red-600 font-bold">-{fmt(finalDiscount)}</span>
            ) : (
              <button onClick={() => setShowDiscount(true)} className="text-[10px] font-bold text-[#101B55] hover:underline border-none bg-transparent cursor-pointer uppercase">
                + Add Discount
              </button>
            )}
          </div>

          {/* VAT row */}
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase">
            <div className="flex items-center gap-1.5">
              <span>VAT {taxPct > 0 ? `${taxPct}%` : ''}</span>
              <button onClick={() => setShowVAT(true)} className="text-slate-400 hover:text-[#101B55] transition-colors border-none bg-transparent cursor-pointer">
                <FiEdit2 className="w-3 h-3" />
              </button>
              {taxPct > 0 && (
                <button onClick={() => setTaxPct(0)} className="text-slate-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer">
                  <FiTrash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {taxAmount > 0 ? (
              <span className="text-slate-800 dark:text-[#EAE5DF]">{fmt(taxAmount)}</span>
            ) : (
              <button onClick={() => setShowVAT(true)} className="text-[10px] font-bold text-[#101B55] hover:underline border-none bg-transparent cursor-pointer uppercase">
                + Add Tax
              </button>
            )}
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-center pt-2.5 border-t border-[#E2E8F0] dark:border-[#2A2B36]">
            <span className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider">Net Amount</span>
            <span className="text-base font-extrabold text-[#101B55] dark:text-[#F2DD50]">{fmt(grandTotal)}</span>
          </div>

          {/* Continue Billing */}
          <button
            onClick={() => { if (items.length === 0) { toast.error('Add items first'); return; } setShowConfirm(true); }}
            className={`no-print w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all mt-2 border-none cursor-pointer ${
              items.length > 0
                ? 'bg-[#101B55] hover:bg-[#1e293b] text-white shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Checkout Sale
          </button>
        </div>
      </div>

      {/*  Modals  */}
      <DiscountModal
        open={showDiscount}
        onClose={() => setShowDiscount(false)}
        subtotal={subtotal}
        onApply={(pct, amt) => { setDiscountPct(pct); setDiscountAmt(amt); }}
      />
      <VATModal
        open={showVAT}
        onClose={() => setShowVAT(false)}
        taxableAmount={taxable}
        onApply={pct => setTaxPct(pct)}
      />
      <AddNewItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        onSave={handleAddNewItem}
      />
      <EditItemModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        onSave={updateItemPriceQty}
      />
      <ConfirmSaleModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        total={grandTotal}
        parties={parties}
        onConfirm={handleConfirmSale}
      />

      <style>{`
        @media print {
          .quick-pos-root { display: block; height: auto; }
          .quick-pos-receipt { width: 100% !important; max-width: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}