import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { counterApi, orderApi } from '../../utils/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import {
  FiPlus, FiMonitor, FiTrash2, FiAlertCircle,
  FiCheckCircle, FiChevronRight, FiBox,
  FiShoppingBag, FiArrowLeft, FiClock, FiCheck, FiX
} from 'react-icons/fi';

interface Counter {
  id: number;
  counter_number: number;
  description: string;
  is_active: boolean;
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function CountersPage() {
  const navigate = useNavigate();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    counter_number: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  // Detail view state
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchCounters(false),
        fetchStatuses()
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedCounter) {
      fetchPendingOrders(selectedCounter.id);
    }
  }, [selectedCounter]);

  const fetchCounters = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await counterApi.getAll();
      const results = data.results || data || [];
      setCounters(results);
    } catch (err: any) {
      setError('Failed to load counters');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const data = await orderApi.getStatuses();
      setStatuses(data.results || data || []);
    } catch (err) {
      console.error('Failed to load statuses', err);
    }
  };

  const fetchPendingOrders = async (counterId: number) => {
    try {
      setLoadingOrders(true);
      const data = await orderApi.getAll({ counterId, status: 'Pending' });
      const orders = data.results || data || [];
      setPendingOrders(orders);
    } catch (err: any) {
      setError('Failed to load pending orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    const completedStatus = statuses.find(s =>
      s.name.toLowerCase() === 'completed' || s.name.toLowerCase() === 'complete' || s.name.toLowerCase() === 'paid'
    );

    if (!completedStatus) {
      setError('Completed status ID not found. Please contact administrator.');
      return;
    }

    try {
      setCompletingId(orderId);
      const response = await orderApi.update(orderId, { status_id: completedStatus.id });
      const billingId = response?.billing_id;
      navigate(billingId ? `/billing?billingId=${billingId}` : `/billing?orderId=${orderId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to complete order');
    } finally {
      setCompletingId(null);
    }
  };

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.counter_number) {
      setError('Counter number is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await counterApi.create({
        counter_number: parseInt(formData.counter_number),
        description: formData.description
      });
      setFormData({ counter_number: '', description: '' });
      setShowAdd(false);
      fetchCounters();
    } catch (err: any) {
      setError(err.message || 'Failed to create counter');
    } finally {
      setSaving(false);
    }
  };

  if (selectedCounter) {
    return (
      <div className="p-6 max-w-5xl mx-auto animate-in slide-in-from-right duration-300">
        <button
          onClick={() => setSelectedCounter(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-[#101B55] dark:hover:text-[#F2DD50] mb-6 transition-colors border-none bg-transparent cursor-pointer font-bold text-xs uppercase tracking-wider"
        >
          <FiArrowLeft className="mr-1" /> Back to Counters
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-[#EAE5DF]">Counter {selectedCounter.counter_number}</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">{selectedCounter.description || 'Manage active orders for this counter'}</p>
          </div>
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-[#101B55] dark:text-[#F2DD50] rounded-xl text-xs font-bold border border-blue-100 dark:border-blue-800 uppercase tracking-wider">
            {pendingOrders.length} Pending Orders
          </div>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin"></div>
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl bg-white dark:bg-[#15161C]">
            <FiShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-400 mb-1">No pending orders</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">There are no active orders on this counter. New orders from the cart will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="border border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-[#15161C]">
                <div className="p-5 border-b border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between bg-slate-50 dark:bg-[#1C1D24]/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#101B55] text-white rounded-xl flex items-center justify-center shadow-sm">
                      <FiClock />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Reference</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-[#EAE5DF]">#{order.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount Due</p>
                    <p className="text-lg font-extrabold text-[#101B55] dark:text-[#F2DD50]">Rs. {order.total_amount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FiBox className="text-[#101B55]" /> Order Items
                  </h4>
                  <div className="space-y-2">
                    {order.items?.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl bg-slate-50 dark:bg-[#1C1D24]/30">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg flex items-center justify-center text-xs font-bold text-[#101B55] dark:text-[#F2DD50] shadow-sm">
                            {item.quantity}x
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF]">{item.product_name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF]">Rs. {item.total_price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between bg-slate-50 dark:bg-[#1C1D24]/50">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ready to finalize transaction?</p>
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    disabled={completingId === order.id}
                    className="bg-[#101B55] hover:bg-[#1e293b] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-none cursor-pointer disabled:opacity-50"
                  >
                    {completingId === order.id ? 'Processing...' : (
                      <>
                        <FiCheck className="w-4 h-4" /> Complete Order
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-[#EAE5DF]">Business Counters</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Manage your retail cash counters and active sales checkpoints</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#101B55] hover:bg-[#1e293b] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-none cursor-pointer shadow-sm transition-all"
        >
          <FiPlus className="w-4 h-4" /> Add Counter
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
          <FiAlertCircle className="shrink-0" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#101B55] rounded-full animate-spin"></div>
        </div>
      ) : counters.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl bg-white dark:bg-[#15161C]">
          <FiMonitor className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-400 mb-1">No counters defined</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">Add your first active counter checkpoint to begin tracking sales segments.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="border border-[#E2E8F0] dark:border-[#2A2B36] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-[#EAE5DF] px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer bg-white dark:bg-[#15161C]"
          >
            Create Counter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map(counter => (
            <div
              key={counter.id}
              className="p-5 border border-[#E2E8F0] dark:border-[#2A2B36] hover:border-slate-400 rounded-2xl hover:shadow-md transition-all duration-150 bg-white dark:bg-[#15161C] group cursor-pointer"
              onClick={() => setSelectedCounter(counter)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-slate-50 dark:bg-[#1C1D24] text-[#101B55] dark:text-[#F2DD50] rounded-xl flex items-center justify-center border border-[#E2E8F0] dark:border-[#2A2B36]">
                  <FiMonitor className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    counter.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {counter.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                  <FiChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-[#EAE5DF] mb-0.5">Counter {counter.counter_number}</h3>
              <p className="text-xs text-slate-400 mb-6">{counter.description || 'No description provided'}</p>
              <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VIEW PENDING ORDERS</span>
                <FiShoppingBag className="text-[#101B55] dark:text-[#F2DD50] opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Counter Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider">Add Counter</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCounter} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Counter Number</label>
                <input
                  type="number"
                  value={formData.counter_number}
                  onChange={(e) => setFormData({ ...formData, counter_number: e.target.value })}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. First Floor Checkout Point"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-sm bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] resize-none h-24"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl border-none transition-colors cursor-pointer"
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
