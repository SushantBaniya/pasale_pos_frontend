import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../utils/i18n';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore, type Theme, type BankAccount } from '../../store/settingsStore';
import { useThemeStore } from '../../store/themeStore';
import {
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronRight,
  FiChevronDown,
  FiX,
  FiBriefcase,
  FiUsers,
  FiPackage,
  FiFileText,
  FiPrinter,
  FiArrowLeft,
  FiCheck,
  FiTrash2,
  FiEdit2,
  FiArchive,
  FiSearch,
  FiPlus,
  FiAlertTriangle,
} from 'react-icons/fi';

type SettingsSection =
  | 'general'
  | 'my-account'
  | 'personal-profile'
  | 'parties'
  | 'transactions';

const provinces = [
  'Koshi Province',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province',
];

const districtsByProvince: Record<string, string[]> = {
  'Koshi Province': ['Bhojpur', 'Dhankuta', 'Ilam', 'Jhapa', 'Khotang', 'Morang', 'Okhaldhunga', 'Panchthar', 'Sankhuwasabha', 'Solukhumbu', 'Sunsari', 'Taplejung', 'Terhathum', 'Udayapur'],
  'Madhesh Province': ['Bara', 'Dhanusha', 'Mahottari', 'Parsa', 'Rautahat', 'Saptari', 'Sarlahi', 'Siraha'],
  'Bagmati Province': ['Bhaktapur', 'Chitwan', 'Dhading', 'Dolakha', 'Kathmandu', 'Kavrepalanchok', 'Lalitpur', 'Makwanpur', 'Nuwakot', 'Ramechhap', 'Rasuwa', 'Sindhuli', 'Sindhupalchok'],
  'Gandaki Province': ['Baglung', 'Gorkha', 'Kaski', 'Lamjung', 'Mustang', 'Myagdi', 'Nawalpur', 'Parbat', 'Syangja', 'Tanahun'],
  'Lumbini Province': ['Arghakhanchi', 'Banke', 'Bardiya', 'Dang', 'Gulmi', 'Kapilvastu', 'Nawalparasi West', 'Palpa', 'Pyuthan', 'Rolpa', 'Rukum East', 'Rupandehi'],
  'Karnali Province': ['Dailekh', 'Dolpa', 'Humla', 'Jajarkot', 'Jumla', 'Kalikot', 'Mugu', 'Rukum West', 'Salyan', 'Surkhet'],
  'Sudurpashchim Province': ['Achham', 'Baitadi', 'Bajhang', 'Bajura', 'Dadeldhura', 'Darchula', 'Doti', 'Kailali', 'Kanchanpur'],
};

const businessCategories = [
  'Retail', 'Wholesale', 'Manufacturing', 'Services', 'Food & Beverage',
  'Clothing', 'Electronics', 'Pharmacy', 'Hardware', 'Grocery',
  'Information Technology', 'Other',
];

const defaultExpenseCategories = [
  'Clothing', 'Education', 'Entertainment', 'Food', 'Fuel',
  'General', 'Health', 'Maintenance', 'Other', 'Recharge',
  'Rent', 'Salary', 'Transport', 'Utilities',
];

const defaultIncomeCategories = [
  'Business Revenue', 'Dividend', 'Freelance', 'Gift',
  'Interest', 'Investment', 'Other', 'Rental Income', 'Salary',
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userProfile, updateUserProfile, logout } = useAuthStore();
  const {
    general,
    businessProfile,
    featureSettings,
    updateGeneralSettings,
    updateBusinessProfile,
    updatePartySettings,
    updateTransactionSettings,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
  } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [featureExpanded, setFeatureExpanded] = useState(false);
  const [transactionSubView, setTransactionSubView] = useState<'main' | 'income' | 'expense'>('main');
  const [success, setSuccess] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ name: string; index: number } | null>(null);

  const [expenseCategories, setExpenseCategories] = useState(
    defaultExpenseCategories.map(name => ({ name, total: 0 }))
  );
  const [incomeCategories, setIncomeCategories] = useState(
    defaultIncomeCategories.map(name => ({ name, total: 0 }))
  );

  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branch: '',
    isPrimary: false,
  });

  const [accountForm, setAccountForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || '',
    photo: userProfile?.photo || null as string | null,
  });

  const [businessForm, setBusinessForm] = useState({
    businessName: businessProfile?.businessName || '',
    businessCategory: businessProfile?.businessCategory || '',
    businessAddress: businessProfile?.streetAddress || '',
    businessLogo: businessProfile?.businessLogo || null as string | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const businessLogoRef = useRef<HTMLInputElement>(null);

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
      navigate('/');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAccountForm({ ...accountForm, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleBusinessLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBusinessForm({ ...businessForm, businessLogo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBankAccount = () => {
    if (editingBank) {
      updateBankAccount(editingBank.id, bankForm);
    } else {
      addBankAccount(bankForm);
    }
    setShowBankModal(false);
    setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false });
    setEditingBank(null);
    showSuccessMessage('Bank account saved successfully!');
  };

  const handleEditBank = (bank: BankAccount) => {
    setEditingBank(bank);
    setBankForm({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolderName: bank.accountHolderName,
      branch: bank.branch || '',
      isPrimary: bank.isPrimary,
    });
    setShowBankModal(true);
  };

  const handleDeleteBank = (id: string) => {
    if (window.confirm('Delete this bank account?')) {
      deleteBankAccount(id);
      showSuccessMessage('Bank account deleted!');
    }
  };

  //  Reusable UI Primitives 

  const Toggle = ({
    enabled,
    onChange,
    label,
    description,
  }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] last:border-0">
      <div className="flex-1 pr-8">
        <p className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-1 font-medium">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none border-none cursor-pointer ${enabled ? 'bg-[#101B55] dark:bg-[#F2DD50]' : 'bg-slate-200 dark:bg-slate-700'}`}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );

  const RowSelect = ({
    label,
    description,
    value,
    onChange,
    options,
  }: {
    label: string;
    description?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-center justify-between py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] last:border-0">
      <div className="flex-1 pr-8">
        <p className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-1 font-medium">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg px-3 py-1.5 focus:outline-none dark:text-[#EAE5DF] dark:bg-[#15161C]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  const SectionCard = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm overflow-hidden mb-6 dark:bg-[#15161C]">
      {title && (
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] bg-slate-50/40 dark:bg-[#1C1D24]/10">
          <h3 className="text-xs font-bold text-slate-600 dark:text-[#64748B] uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="px-6">{children}</div>
    </div>
  );

  const PageTitle = ({ title }: { title: string }) => (
    <h2 className="text-base font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-6">{title}</h2>
  );

  const SaveBtn = ({ onClick, label = 'Save Settings' }: { onClick: () => void; label?: string }) => (
    <div className="flex justify-end mt-4 mb-6">
      <button
        onClick={onClick}
        className="px-6 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border-none cursor-pointer shadow-sm"
      >
        {label}
      </button>
    </div>
  );

  //  GENERAL SETTINGS 
  const renderGeneral = () => (
    <div>
      <PageTitle title="General Settings" />

      {/* Appearance */}
      <SectionCard title="Appearance">
        <div className="py-4">
          <p className="text-xs text-slate-400 mb-4 font-medium">Choose your primary user interface appearance template</p>
          <div className="flex flex-wrap gap-4">
            {(['light', 'classic', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTheme(t as any); updateGeneralSettings({ appearance: t }); }}
                className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-transparent ${theme === t ? 'border-[#101B55] dark:border-[#F2DD50]' : 'border-[#E2E8F0] dark:border-[#2A2B36] hover:border-slate-400'}`}
              >
                <div className={`w-28 h-20 ${t === 'light' ? 'bg-white' : t === 'classic' ? 'bg-slate-600' : 'bg-gray-900'}`}>
                  <div className="flex h-full">
                    <div className={`w-8 h-full ${t === 'light' ? 'bg-slate-50 border-r border-[#E2E8F0]' : t === 'classic' ? 'bg-slate-700' : 'bg-gray-800'}`} />
                    <div className="flex-1 p-2">
                      <div className={`h-1.5 w-10 rounded mb-1 ${t === 'light' ? 'bg-slate-300' : 'bg-slate-600'}`} />
                      <div className={`h-1.5 w-7 rounded ${t === 'light' ? 'bg-slate-200' : 'bg-slate-700'}`} />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 w-4 h-4 rounded bg-[#101B55] dark:bg-[#F2DD50]" />
                </div>
                {theme === t && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#101B55] dark:bg-[#F2DD50] rounded-full flex items-center justify-center">
                    <FiCheck className="w-3 h-3 text-white dark:text-gray-950" />
                  </div>
                )}
                <p className={`text-center py-2 text-[10px] font-bold uppercase tracking-wider ${theme === t ? 'text-[#101B55] dark:text-[#F2DD50]' : 'text-slate-500'}`}>
                  {t === 'light' ? 'Light Theme' : t === 'classic' ? 'Classic' : 'Dark Theme'}
                </p>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Language & Currency */}
      <SectionCard>
        <RowSelect
          label="Language"
          description="Adjust standard locale settings and system languages"
          value={general.language}
          onChange={(v) => updateGeneralSettings({ language: v as 'en' | 'np' })}
          options={[{ value: 'en', label: 'English' }, { value: 'np', label: 'नेपाली' }]}
        />
        <RowSelect
          label="Currency"
          description="Select base currency for ledger calculations and pos orders"
          value={general.currency}
          onChange={(v) => updateGeneralSettings({ currency: v as any })}
          options={[
            { value: 'NPR', label: 'Rs.  Nepali Rupee' },
            { value: 'INR', label: '  Indian Rupee' },
            { value: 'USD', label: '$  US Dollar' },
          ]}
        />
        <RowSelect
          label="Currency Position"
          value={general.currencyPosition}
          onChange={(v) => updateGeneralSettings({ currencyPosition: v as 'start' | 'end' })}
          options={[{ value: 'start', label: 'Start' }, { value: 'end', label: 'End' }]}
        />
      </SectionCard>

      {/* Calendar & Format */}
      <SectionCard>
        <div className="flex items-center justify-between py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider">Calendar</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Configure date format calendar engine</p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5 dark:bg-slate-800">
            {(['AD', 'BS'] as const).map((cal) => (
              <button
                key={cal}
                onClick={() => updateGeneralSettings({ calendarType: cal })}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase cursor-pointer border-none transition-colors ${general.calendarType === cal ? 'bg-[#101B55] dark:bg-[#F2DD50] text-white dark:text-gray-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-[#EAE5DF]'}`}
              >
                {cal}
              </button>
            ))}
          </div>
        </div>
        <RowSelect
          label="Date Format"
          value={general.dateFormat}
          onChange={(v) => updateGeneralSettings({ dateFormat: v as any })}
          options={[
            { value: 'BS', label: 'DD MMM YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
          ]}
        />
        <RowSelect
          label="Time Format"
          value={general.timeFormat}
          onChange={(v) => updateGeneralSettings({ timeFormat: v as '12h' | '24h' })}
          options={[{ value: '12h', label: '7:41 PM' }, { value: '24h', label: '19:41' }]}
        />
        <RowSelect
          label="Number Format"
          description="Adjust separator formatting standard (e.g. Indian/International)"
          value={general.numberFormat}
          onChange={(v) => updateGeneralSettings({ numberFormat: v as any })}
          options={[{ value: 'indian', label: '1,00,000' }, { value: 'international', label: '1,000,000' }]}
        />
      </SectionCard>

      {/* Privacy & App Lock */}
      <SectionCard>
        <Toggle
          enabled={general.privacyMode}
          onChange={(v) => updateGeneralSettings({ privacyMode: v })}
          label="Privacy Mode"
          description="Hides business stats from homepage & item purchase price."
        />
        <Toggle
          enabled={general.appLock}
          onChange={(v) => updateGeneralSettings({ appLock: v })}
          label="App Lock"
          description="Secure your business access with a lock screen"
        />
      </SectionCard>

      <SaveBtn onClick={() => showSuccessMessage('Settings saved!')} />
    </div>
  );

  //  MY ACCOUNT 
  const renderMyAccount = () => (
    <div>
      <PageTitle title="My Account" />

      <SectionCard>
        {/* Profile Header */}
        <div className="py-5 flex items-center gap-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <div className="relative">
            {accountForm.photo ? (
              <img src={accountForm.photo} alt="Profile" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#101B55]/10 dark:bg-[#F2DD50]/15 flex items-center justify-center">
                <FiUser className="w-6 h-6 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#101B55] dark:bg-[#F2DD50] rounded-full flex items-center justify-center shadow border-none cursor-pointer"
            >
              <FiEdit2 className="w-3 h-3 text-white dark:text-gray-950" />
            </button>
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-[#EAE5DF]">{accountForm.name || 'Your Name'}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">{accountForm.email}</p>
            <p className="text-[10px] font-bold text-[#101B55] dark:text-[#F2DD50] uppercase mt-1">Signed in via Google</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </div>

        {/* Full Name */}
        <div className="py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Full Name</label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
            />
          </div>
        </div>

        {/* Email */}
        <div className="py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Email Address</label>
          <input
            value={accountForm.email}
            disabled
            className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-[#1C1D24]"
          />
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Email cannot be changed</p>
        </div>

        {/* Phone */}
        <div className="py-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Phone Number</label>
          <input
            value={accountForm.phone}
            onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
            placeholder="Enter your phone number"
            className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
          />
        </div>
      </SectionCard>

      <div className="flex items-center justify-between mt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-600 text-xs font-bold uppercase tracking-wider border-none bg-transparent cursor-pointer"
        >
          <FiLogOut className="w-4 h-4" />
          Sign Out
        </button>
        <button
          onClick={() => { updateUserProfile({ name: accountForm.name, phone: accountForm.phone, email: accountForm.email, photo: accountForm.photo }); showSuccessMessage('Account updated!'); }}
          className="px-6 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border-none cursor-pointer shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  );

  //  PERSONAL PROFILE (Business Profile) 
  const renderPersonalProfile = () => (
    <div>
      <PageTitle title="Personal Profile" />

      <SectionCard>
        {/* Business Logo & Name Header */}
        <div className="py-5 flex items-center gap-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <div className="relative">
            {businessForm.businessLogo ? (
              <img src={businessForm.businessLogo} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#101B55]/10 dark:bg-[#F2DD50]/15 flex items-center justify-center">
                <FiBriefcase className="w-7 h-7 text-[#101B55] dark:text-[#F2DD50]" />
              </div>
            )}
            <button
              onClick={() => businessLogoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#101B55] dark:bg-[#F2DD50] rounded-full flex items-center justify-center shadow border-none cursor-pointer"
            >
              <FiEdit2 className="w-3 h-3 text-white dark:text-gray-950" />
            </button>
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-[#EAE5DF]">{businessForm.businessName || 'Business Name'}</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Click update icon to change logo</p>
          </div>
          <input ref={businessLogoRef} type="file" accept="image/*" onChange={handleBusinessLogoUpload} className="hidden" />
        </div>

        {/* Business Name */}
        <div className="py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Business Name</label>
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={businessForm.businessName}
              onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
              className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
            />
          </div>
        </div>

        {/* Business Category */}
        <div className="py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Business Category</label>
          <select
            value={businessForm.businessCategory}
            onChange={(e) => setBusinessForm({ ...businessForm, businessCategory: e.target.value })}
            className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
          >
            <option value="">Select Category</option>
            {businessCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Business Address */}
        <div className="py-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Business Address</label>
          <input
            value={businessForm.businessAddress}
            onChange={(e) => setBusinessForm({ ...businessForm, businessAddress: e.target.value })}
            placeholder="Enter business address"
            className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
          />
        </div>
      </SectionCard>

      <SaveBtn
        label="Save Profile"
        onClick={() => {
          updateBusinessProfile({ ...businessProfile, businessName: businessForm.businessName, businessCategory: businessForm.businessCategory, streetAddress: businessForm.businessAddress, businessLogo: businessForm.businessLogo });
          showSuccessMessage('Profile saved!');
        }}
      />
    </div>
  );

  //  PARTIES FEATURE SETTINGS 
  const renderParties = () => (
    <div>
      <PageTitle title="Party Feature Settings" />
      <SectionCard>
        <Toggle
          enabled={featureSettings.parties.partyCategory ?? true}
          onChange={(v) => updatePartySettings({ partyCategory: v })}
          label="Send Payment Reminders"
          description="Enable sending payment reminders to parties via notifications"
        />
        <Toggle
          enabled={featureSettings.parties.uploadPartyImage ?? true}
          onChange={(v) => updatePartySettings({ uploadPartyImage: v })}
          label="Opening Balance"
          description="Allow setting opening balance when creating a new party"
        />
        <Toggle
          enabled={true}
          onChange={() => {}}
          label="Party Photo Upload"
          description="Allow uploading photos for parties"
        />
        <Toggle
          enabled={true}
          onChange={() => {}}
          label="PAN Number Field"
          description="Show PAN number field in party form"
        />
      </SectionCard>
      <SaveBtn onClick={() => showSuccessMessage('Party settings saved!')} />
    </div>
  );

  //  TRANSACTION SETTINGS 
  const CategoryManager = ({
    title,
    categories,
    setCategories,
    onBack,
  }: {
    title: string;
    categories: { name: string; total: number }[];
    setCategories: React.Dispatch<React.SetStateAction<{ name: string; total: number }[]>>;
    onBack: () => void;
  }) => {
    const filtered = categories.filter(c =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-9 h-9 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl flex items-center justify-center bg-white dark:bg-[#15161C] text-slate-500 hover:text-[#101B55] cursor-pointer">
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider flex-1">{title}</h2>
          <button
            onClick={() => { setShowAddCategory(true); setNewCategory(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border-none cursor-pointer shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm overflow-hidden dark:bg-[#15161C]">
          <div className="grid grid-cols-3 px-6 py-3 border-b border-[#E2E8F0] dark:border-[#2A2B36] bg-slate-50/40 dark:bg-[#1C1D24]/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Name</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Total Amount</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Action</span>
          </div>

          {filtered.map((cat, i) => (
            <div key={cat.name} className="grid grid-cols-3 px-6 py-4 border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/30 transition-colors items-center">
              {editingCategory?.index === i ? (
                <>
                  <input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="text-xs border border-blue-500 rounded-lg px-2 py-1.5 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-xs font-bold text-slate-700 text-right">Rs. {cat.total}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setCategories(prev => prev.map((c, idx) => idx === i ? { ...c, name: editingCategory.name } : c));
                        setEditingCategory(null);
                      }}
                      className="text-[#101B55] dark:text-[#F2DD50] p-1 border-none bg-transparent cursor-pointer"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600 p-1 border-none bg-transparent cursor-pointer">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF]">{cat.name}</span>
                  <span className="text-xs font-medium text-slate-500 text-right">Rs. {cat.total}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCategory({ name: cat.name, index: i })}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${cat.name}"?`)) {
                          setCategories(prev => prev.filter((_, idx) => idx !== i));
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500 border-none bg-transparent cursor-pointer"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No categories found</div>
          )}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider mb-4">Add Category</h3>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Category name"
                className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] mb-4 focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategory.trim()) {
                    setCategories(prev => [...prev, { name: newCategory.trim(), total: 0 }]);
                    setShowAddCategory(false);
                    setNewCategory('');
                    showSuccessMessage('Category added!');
                  }
                }}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowAddCategory(false)} className="flex-1 py-2 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer bg-white">Cancel</button>
                <button
                  onClick={() => {
                    if (newCategory.trim()) {
                      setCategories(prev => [...prev, { name: newCategory.trim(), total: 0 }]);
                      setShowAddCategory(false);
                      setNewCategory('');
                      showSuccessMessage('Category added!');
                    }
                  }}
                  className="flex-1 py-2 bg-[#101B55] hover:bg-[#1e293b] text-white rounded-lg text-xs font-bold uppercase tracking-wider border-none cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransactions = () => {
    if (transactionSubView === 'income') {
      return (
        <CategoryManager
          title="Income Categories"
          categories={incomeCategories}
          setCategories={setIncomeCategories}
          onBack={() => { setTransactionSubView('main'); setCategorySearch(''); }}
        />
      );
    }
    if (transactionSubView === 'expense') {
      return (
        <CategoryManager
          title="Expense Categories"
          categories={expenseCategories}
          setCategories={setExpenseCategories}
          onBack={() => { setTransactionSubView('main'); setCategorySearch(''); }}
        />
      );
    }
    return (
      <div>
        <PageTitle title="Transaction Settings" />
        <div className="bg-white rounded-xl border border-[#E2E8F0] dark:border-[#2A2B36] shadow-sm overflow-hidden dark:bg-[#15161C]">
          <button
            onClick={() => setTransactionSubView('income')}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#2A2B36] hover:bg-slate-50/50 bg-white dark:bg-[#15161C] border-none cursor-pointer transition-colors"
          >
            <span className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider">Manage Income Categories</span>
            <FiChevronRight className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => setTransactionSubView('expense')}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 bg-white dark:bg-[#15161C] border-none cursor-pointer transition-colors"
          >
            <span className="text-xs font-bold text-slate-700 dark:text-[#EAE5DF] uppercase tracking-wider">Manage Expense Categories</span>
            <FiChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneral();
      case 'my-account': return renderMyAccount();
      case 'personal-profile': return renderPersonalProfile();
      case 'parties': return renderParties();
      case 'transactions': return renderTransactions();
      default: return renderGeneral();
    }
  };

  const sidebarItems = [
    { id: 'general' as const, label: 'General', icon: FiSettings },
    { id: 'my-account' as const, label: 'My Account', icon: FiUser },
    { id: 'personal-profile' as const, label: 'Personal Profile', icon: FiBriefcase },
  ];

  const featureItems = [
    { id: 'parties' as const, label: 'Parties', icon: FiUsers },
    { id: 'transactions' as const, label: 'Transactions', icon: FiFileText },
  ];

  const isFeatureActive = featureItems.some(f => f.id === activeSection);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex text-slate-800 dark:text-[#EAE5DF]">
      {/* Success Toast */}
      {success && (
        <div className="fixed top-5 right-5 z-[100] flex items-center gap-2 px-4 py-3 bg-white border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl shadow-lg text-xs font-bold uppercase tracking-wider text-slate-700 animate-in slide-in-from-top-2 duration-300 dark:bg-[#15161C]">
          <div className="w-5 h-5 bg-[#101B55] dark:bg-[#F2DD50] rounded-full flex items-center justify-center flex-shrink-0">
            <FiCheck className="w-3 h-3 text-white dark:text-gray-950" />
          </div>
          {success}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E2E8F0] dark:border-[#2A2B36] flex flex-col py-6 flex-shrink-0 min-h-screen dark:bg-[#15161C]">
        {/* Back & Title */}
        <div className="px-4 mb-6 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-[#E2E8F0] dark:border-[#2A2B36] flex items-center justify-center bg-white dark:bg-[#15161C] text-slate-500 hover:text-[#101B55] cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider text-xs">Settings</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setFeatureExpanded(false); setTransactionSubView('main'); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer ${ active ? 'bg-[#101B55]/10 text-[#101B55] dark:text-[#F2DD50]' : 'text-slate-500 hover:bg-slate-50 bg-white dark:bg-[#15161C] dark:hover:bg-[#1C1D24]' }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#101B55] dark:text-[#F2DD50]' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}

          {/* Feature Settings Accordion */}
          <div className="pt-1">
            <button
              onClick={() => setFeatureExpanded(!featureExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs font-bold uppercase tracking-wider transition-colors border-none cursor-pointer ${ featureExpanded || isFeatureActive ? 'text-slate-800 dark:text-[#EAE5DF]' : 'text-slate-500 hover:bg-slate-50 bg-white dark:bg-[#15161C] dark:hover:bg-[#1C1D24]' }`}
            >
              <div className="flex items-center gap-3">
                <FiSettings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                Feature Settings
              </div>
              {featureExpanded ? <FiChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {(featureExpanded || isFeatureActive) && (
              <div className="mt-1 ml-4 space-y-1">
                {featureItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setTransactionSubView('main'); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-[11px] font-bold uppercase tracking-wider transition-colors border-none cursor-pointer ${ active ? 'bg-[#101B55]/10 text-[#101B55] dark:text-[#F2DD50]' : 'text-slate-400 hover:bg-slate-50 bg-white dark:bg-[#15161C] dark:hover:bg-[#1C1D24]' }`}
                    >
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-[#101B55] dark:text-[#F2DD50]' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {renderContent()}
        </div>
      </main>

      {/* Bank Account Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
              <h3 className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] uppercase tracking-wider">{editingBank ? 'Edit Bank Account' : 'Bank Accounts'}</h3>
              <button
                onClick={() => { setShowBankModal(false); setEditingBank(null); setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false }); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-[#1C1D24] text-slate-400 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Existing Accounts */}
              {!editingBank && businessProfile.bankAccounts?.length > 0 && (
                <div className="space-y-2 pb-4 border-b border-[#E2E8F0] dark:border-[#2A2B36]">
                  {businessProfile.bankAccounts.map((bank) => (
                    <div key={bank.id} className="flex items-center justify-between p-3 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl bg-slate-50 dark:bg-[#1C1D24]/30">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF]">{bank.bankName}</p>
                        <p className="text-xs text-slate-400 font-medium">{bank.accountNumber}</p>
                        {bank.isPrimary && <span className="text-[10px] font-bold text-[#101B55] dark:text-[#F2DD50] uppercase tracking-wider">Primary</span>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditBank(bank)} className="p-1.5 hover:bg-white rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                          <FiEdit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => handleDeleteBank(bank.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer">
                          <FiTrash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {[
                { label: 'Bank Name', key: 'bankName', placeholder: 'e.g. Nepal Bank Limited' },
                { label: 'Account Number', key: 'accountNumber', placeholder: 'Enter account number' },
                { label: 'Account Holder Name', key: 'accountHolderName', placeholder: 'As on bank documents' },
                { label: 'Branch (Optional)', key: 'branch', placeholder: 'Enter branch name' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider mb-1.5 block">{label}</label>
                  <input
                    value={(bankForm as any)[key]}
                    onChange={(e) => setBankForm({ ...bankForm, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-lg text-xs bg-white dark:bg-[#15161C] text-slate-800 dark:text-[#EAE5DF] focus:outline-none"
                  />
                </div>
              ))}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bankForm.isPrimary}
                  onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#101B55] dark:text-[#F2DD50] focus:ring-none accent-[#101B55]"
                />
                <span className="text-xs text-slate-700 dark:text-[#EAE5DF] font-bold uppercase tracking-wider">Set as primary account</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#2A2B36] flex gap-3 bg-slate-50 dark:bg-[#1C1D24]/20">
              <button
                onClick={() => { setShowBankModal(false); setEditingBank(null); setBankForm({ bankName: '', accountNumber: '', accountHolderName: '', branch: '', isPrimary: false }); }}
                className="flex-1 py-2.5 border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl text-xs font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 cursor-pointer bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBankAccount}
                disabled={!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolderName}
                className="flex-1 py-2.5 bg-[#101B55] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold uppercase tracking-wider border-none cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingBank ? 'Save Changes' : 'Add Bank'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}