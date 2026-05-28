import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiSearch, FiPlus, FiPhone, FiX, FiCheck, FiFileText, FiChevronDown } from 'react-icons/fi';
import { partyApi } from '../../utils/api';

interface CustomerSectionProps {
  selectedParty: any;
  onPartyChange: (party: any) => void;
  phone: string;
  onPhoneChange: (phone: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  selectedParty,
  onPartyChange,
  phone,
  onPhoneChange,
  notes,
  onNotesChange,
}) => {
  const [isWalkIn, setIsWalkIn] = useState(!selectedParty);
  const [parties, setParties] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({ name: '', phone_no: '', email: '', address: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const res = await partyApi.getAll('Customer');
      const data = res.results || res || [];
      setParties(data);
    } catch (err) {
      console.error('Failed to fetch parties:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredParties = parties.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.phone_no?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const handleSelectParty = (party: any) => {
    onPartyChange(party);
    onPhoneChange(party.phone_no || '');
    setIsWalkIn(false);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleWalkIn = () => {
    setIsWalkIn(true);
    onPartyChange(null);
    onPhoneChange('');
    setSearchQuery('');
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    try {
      setCreating(true);
      const created = await partyApi.create({
        ...newCustomer,
        Category_type: 'Customer',
        is_active: true,
      });
      await fetchParties();
      handleSelectParty(created);
      setShowAddModal(false);
      setNewCustomer({ name: '', phone_no: '', email: '', address: '' });
    } catch (err) {
      console.error('Failed to create customer:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</h3>
      <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl p-4">
        {/* Walk-in / Select toggle */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={handleWalkIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer border ${
              isWalkIn
                ? 'bg-[#101B55] text-white border-transparent'
                : 'bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36] hover:border-[#101B55]'
            }`}
          >
            <FiUser size={12} /> Walk-in
          </button>

          <div className="relative flex-1" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer border w-full justify-between ${
                !isWalkIn && selectedParty
                  ? 'bg-[#101B55] text-white border-transparent'
                  : 'bg-white dark:bg-[#1C1D24] text-[#475569] dark:text-[#EAE5DF] border-[#E2E8F0] dark:border-[#2A2B36] hover:border-[#101B55]'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <FiSearch size={12} />
                {!isWalkIn && selectedParty ? selectedParty.name : 'Select Customer'}
              </span>
              <FiChevronDown size={12} />
            </button>

            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl shadow-xl z-20 overflow-hidden max-h-[260px]">
                <div className="p-2 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                  <div className="relative">
                    <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={13} />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[170px]">
                  {loading ? (
                    <div className="p-4 text-center text-[12px] text-[#94A3B8]">Loading...</div>
                  ) : filteredParties.length === 0 ? (
                    <div className="p-4 text-center text-[12px] text-[#94A3B8]">No customers found</div>
                  ) : (
                    filteredParties.map((party) => (
                      <button
                        key={party.id}
                        onClick={() => handleSelectParty(party)}
                        className="w-full text-left px-3 py-2.5 hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors flex items-center justify-between border-none cursor-pointer bg-transparent"
                      >
                        <div>
                          <div className="text-[13px] font-medium text-[#111827] dark:text-[#EAE5DF]">{party.name}</div>
                          {party.phone_no && (
                            <div className="text-[11px] text-[#94A3B8]">{party.phone_no}</div>
                          )}
                        </div>
                        {selectedParty?.id === party.id && (
                          <FiCheck size={14} className="text-[#22C55E] flex-shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                <button
                  onClick={() => { setShowAddModal(true); setShowDropdown(false); }}
                  className="w-full px-3 py-2.5 text-left text-[12px] font-medium text-[#101B55] dark:text-[#F2DD50] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] border-t border-[#E2E8F0] dark:border-[#2A2B36] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-x-0 border-b-0"
                >
                  <FiPlus size={13} /> Add New Customer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phone field */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={13} />
            <input
              type="tel"
              placeholder="Customer phone number"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
            />
          </div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              showNotes ? 'bg-[#101B55] text-white border-transparent' : 'bg-white dark:bg-[#1C1D24] text-[#94A3B8] border-[#E2E8F0] dark:border-[#2A2B36] hover:text-[#101B55]'
            }`}
            title="Customer notes"
          >
            <FiFileText size={14} />
          </button>
        </div>

        {/* Notes */}
        {showNotes && (
          <textarea
            placeholder="Add notes for this invoice..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-[12px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55] resize-none mt-1"
          />
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#15161C] w-full max-w-md rounded-2xl shadow-2xl border border-[#E2E8F0] dark:border-[#2A2B36] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
              <h3 className="text-base font-bold text-[#111827] dark:text-[#EAE5DF]">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-[#94A3B8] hover:text-[#111827] dark:hover:text-white rounded-full hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors border-none cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-1 block">Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  placeholder="Customer name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-1 block">Phone</label>
                <input
                  type="tel"
                  value={newCustomer.phone_no}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone_no: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-1 block">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wider mb-1 block">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-[#F8FAFC] dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-[#111827] dark:text-[#EAE5DF] focus:outline-none focus:border-[#101B55]"
                  placeholder="Address"
                />
              </div>
            </div>

            <div className="p-5 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#475569] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#1C1D24] transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomer}
                disabled={!newCustomer.name.trim() || creating}
                className="px-4 py-2 text-[13px] font-medium text-white bg-[#101B55] rounded-lg hover:bg-[#101B55]/90 disabled:opacity-50 transition-colors cursor-pointer border-none"
              >
                {creating ? 'Creating...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
