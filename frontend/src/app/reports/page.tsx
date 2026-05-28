import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../utils/i18n';
import { reportApi } from '../../utils/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import {
  FiSearch,
  FiBell,
  FiRefreshCw,
  FiDownload,
  FiPrinter,
  FiUsers,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiTarget,
  FiPercent,
  FiSliders,
  FiActivity,
  FiFileText,
  FiBarChart2,
} from 'react-icons/fi';
import { NepaliRupeeIcon } from '../../components/ui/NepaliRupeeIcon';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';

//  Types 

interface DateRange { startDate: string; endDate: string }
type QuickRange = 'week' | 'month' | 'quarter' | 'year';

interface ReportSummary {
  total_sales: number;
  total_expenses: number;
  net_profit: number;
  order_count: number;
  low_stock_count: number;
}
interface DailyPoint   { label: string; inflow: number; outflow: number }
interface CategoryItem { name: string; value: number }
interface TopProduct   { name: string; quantity: number }
interface TopCustomer  { name: string; orders: number; spent: number }

interface ReportData {
  summary: ReportSummary;
  cashflow: { daily: DailyPoint[] };
  category_distribution: CategoryItem[];
  top_products: TopProduct[];
  top_customers: TopCustomer[];
}

//  Helpers 

function toISO(d: Date) { return d.toISOString().split('T')[0]; }

function getStartDate(range: QuickRange): Date {
  const today = new Date();
  switch (range) {
    case 'week':    { const d = new Date(today); d.setDate(today.getDate() - 7); return d; }
    case 'month':   return new Date(today.getFullYear(), today.getMonth(), 1);
    case 'quarter': return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    case 'year':    return new Date(today.getFullYear(), 0, 1);
  }
}

// Premium brand colors matching Navy/Yellow aesthetic
const PIE_COLORS = ['#101B55', '#10B981', '#F2DD50', '#8b5cf6', '#ef4444', '#06b6d4'];

//  Reusable primitives 

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-[#15161C] rounded-2xl border border-[#E2E8F0] dark:border-[#2A2B36] ${className}`}
    >
      {children}
    </div>
  );
}

function ChartHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xs font-bold text-slate-700 dark:text-[#64748B] uppercase tracking-wider">{title}</h3>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  warning = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  warning?: boolean;
}) {
  return (
    <Card
      className={`p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-shadow ${
        warning ? 'border-amber-200 dark:border-amber-800 bg-amber-50/20' : ''
      }`}
    >
      <div>
        <p className="text-[24px] font-extrabold leading-none text-[#111827] dark:text-[#EAE5DF]">
          {value}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">{label}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        warning ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 dark:bg-[#1C1D24] text-slate-400'
      }`}>
        <Icon className="w-5 h-5 flex-shrink-0" />
      </div>
    </Card>
  );
}

//  Main component 

export default function ReportsPage() {
  const { t, n, c } = useTranslation();
  const [quickRange, setQuickRange] = useState<QuickRange>('month');
  const [dateRange, setDateRange]   = useState<DateRange>({
    startDate: toISO(getStartDate('month')),
    endDate:   toISO(new Date()),
  });
  const [data, setData]     = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Sync date range whenever quick-range changes
  useEffect(() => {
    setDateRange({
      startDate: toISO(getStartDate(quickRange)),
      endDate:   toISO(new Date()),
    });
  }, [quickRange]);

  // Fetch on every date range change
  useEffect(() => { fetchReport(); }, [dateRange.startDate, dateRange.endDate]);

  async function fetchReport() {
    setLoading(true);
    setError(null);
    try {
      const response: ReportData = await reportApi.getSummary({
        start_date: dateRange.startDate,
        end_date:   dateRange.endDate,
      });
      setData(response);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  // Derived chart series
  const chartData = useMemo(
    () =>
      (data?.cashflow?.daily ?? []).map((p) => ({
        date:     p.label,
        sales:    p.inflow  ?? 0,
        expenses: p.outflow ?? 0,
        profit:   (p.inflow ?? 0) - (p.outflow ?? 0),
      })),
    [data],
  );

  const statCards = useMemo(() => {
    if (!data?.summary) return [];
    const s   = data.summary;
    const aov = s.order_count > 0 ? s.total_sales / s.order_count : 0;
    return [
      { label: t('reports.totalRevenue'),  value: c(s.total_sales),   icon: FiTrendingUp,   warning: false },
      { label: t('reports.totalExpenses'), value: c(s.total_expenses), icon: FiTrendingDown, warning: false },
      { label: t('reports.grossProfit'),   value: c(s.net_profit),     icon: NepaliRupeeIcon,warning: false },
      { label: 'Avg. order value',         value: c(aov),              icon: FiTarget,       warning: false },
      { label: 'Total orders',             value: n(s.order_count),    icon: FiUsers,        warning: false },
      {
        label:   'Low stock alerts',
        value:   n(s.low_stock_count),
        icon:    FiPackage,
        warning: s.low_stock_count > 0,
      },
    ];
  }, [data, t, c, n]);

  function handleExport(format: 'pdf' | 'excel') {
    if (!data) return;
    const payload = {
      title:       'Business performance report',
      dateRange,
      companyName: 'Pasale',
      stats:       statCards.map((k) => ({ label: k.label, value: k.value })),
    };
    if (format === 'pdf')   exportToPDF(payload);
    if (format === 'excel') exportToExcel(payload);
  }

  const margin = data?.summary?.total_sales
    ? ((data.summary.net_profit / data.summary.total_sales) * 100).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4">
      <div className="max-w-[1280px] mx-auto space-y-4">

        {/* 
            TOP BAR   search · actions · avatar
         */}
        <Card className="px-6 py-4 flex items-center justify-between print:hidden shadow-sm">

          {/* search pill */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-full px-4 py-2 w-60">
            <FiSearch className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Insights</span>
          </div>

          {/* right actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={fetchReport}
              disabled={loading}
              aria-label="Refresh"
              className="text-slate-400 hover:text-[#101B55] dark:hover:text-[#F2DD50] transition-colors border-none bg-transparent cursor-pointer"
            >
              <FiRefreshCw className={`w-[18px] h-[18px] ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => window.print()}
              aria-label="Print"
              className="text-slate-400 hover:text-[#101B55] dark:hover:text-[#F2DD50] transition-colors border-none bg-transparent cursor-pointer"
            >
              <FiPrinter className="w-[18px] h-[18px]" />
            </button>

            <FiBell className="w-[18px] h-[18px] text-slate-400" />

            {/* export dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#EAE5DF] bg-white dark:bg-[#1C1D24] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-xl px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors">
                <FiDownload className="w-3.5 h-3.5" />
                Export
              </button>
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-[#15161C] border border-[#E2E8F0] dark:border-[#2A2B36] rounded-2xl shadow-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-slate-600 dark:text-[#EAE5DF] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer uppercase tracking-wider"
                >
                  <FiFileText className="w-4 h-4 text-rose-500" />
                  PDF document
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-slate-600 dark:text-[#EAE5DF] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer uppercase tracking-wider"
                >
                  <FiBarChart2 className="w-4 h-4 text-[#F2DD50]" />
                  Excel spreadsheet
                </button>
              </div>
            </div>

            {/* avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#101B55] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                BI
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 dark:text-[#EAE5DF] leading-tight">Business</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Intelligence</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 
            ERROR BANNER
         */}
        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 print:hidden">
            <div className="flex items-center gap-2">
              <FiActivity className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
            <button onClick={fetchReport} className="underline hover:no-underline font-bold border-none bg-transparent cursor-pointer uppercase tracking-wider">
              Retry
            </button>
          </div>
        )}

        {/* 
            BODY  content
         */}
        <div className="space-y-4">

            {/*  ROW 1: 6 stat cards  */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statCards.length > 0
                ? statCards.map((card, i) => (
                    <StatCard
                      key={i}
                      label={card.label}
                      value={card.value}
                      icon={card.icon}
                      warning={card.warning}
                    />
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-4 animate-pulse">
                      <div className="h-7 w-14 bg-slate-100 dark:bg-[#1C1D24] rounded mb-2" />
                      <div className="h-3 w-20 bg-slate-100 dark:bg-[#1C1D24] rounded" />
                    </Card>
                  ))}
            </div>

            {/*  ROW 2: Revenue area chart + Category pie  */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

              {/* Area chart  "Attendance comparison chart" equivalent */}
              <Card className="p-5">
                <ChartHeader
                  title="Revenue & profit trajectory"
                  right={
                    <>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#101B55] inline-block" />
                          Revenue
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                          Profit
                        </span>
                      </div>
                      <FiSliders className="w-4 h-4 text-slate-300 ml-2" />
                    </>
                  }
                />
                <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                        dy={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                        tickFormatter={(v) => `${v >= 1000 ? `${v / 1000}k` : v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '0.5px solid #e5e7eb',
                          fontSize: 11,
                          fontWeight: 'bold',
                          boxShadow: 'none',
                        }}
                        formatter={(v: any) => [c(v), '']}
                      />
                      <defs>
                        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#101B55" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#101B55" stopOpacity={0}    />
                        </linearGradient>
                        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10B981" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#101B55"
                        strokeWidth={2}
                        fill="url(#gS)"
                        dot={{ r: 3, fill: '#101B55', strokeWidth: 0 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#gP)"
                        dot={false}
                        strokeDasharray="4 3"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Pie  "Weekly attendance" equivalent */}
              <Card className="p-5">
                <ChartHeader
                  title="Sales by category"
                  right={<FiSliders className="w-4 h-4 text-slate-300" />}
                />
                <div className="h-44 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.category_distribution ?? []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {(data?.category_distribution ?? []).map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '12px',
                          border: '0.5px solid #e5e7eb',
                          fontSize: 11,
                          fontWeight: 'bold',
                          boxShadow: 'none',
                        }}
                        formatter={(v: any) => [c(v), '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* legend rows */}
                <div className="space-y-2 mt-4">
                  {(data?.category_distribution ?? []).slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-slate-500 truncate">{item.name}</span>
                      </div>
                      <span className="text-slate-800 dark:text-[#EAE5DF] ml-3 flex-shrink-0">
                        {c(item.value)}
                      </span>
                    </div>
                  ))}
                  {!data?.category_distribution?.length && (
                    <p className="text-xs text-slate-400 text-center py-4">No data</p>
                  )}
                </div>
              </Card>
            </div>

            {/*  ROW 3: Best sellers progress bars + Top customers table  */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">

              {/* Best sellers  horizontal progress bars */}
              <Card className="p-5">
                <ChartHeader
                  title="Best sellers"
                  right={<FiSliders className="w-4 h-4 text-slate-300" />}
                />
                <div className="space-y-4 mt-2">
                  {(data?.top_products ?? []).map((p, i) => {
                    const maxQty = data?.top_products?.[0]?.quantity ?? 1;
                    const pct    = Math.round((p.quantity / maxQty) * 100);
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1.5 text-xs font-bold uppercase tracking-wider">
                          <span className="text-slate-500 truncate pr-3">
                            {p.name}
                          </span>
                          <span className="text-slate-800 dark:text-[#EAE5DF] whitespace-nowrap">
                            {n(p.quantity)} units
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-[#1C1D24] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width:      `${pct}%`,
                              backgroundColor: i === 0 ? '#101B55' : '#F2DD50',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!data?.top_products?.length && (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No product data available
                    </p>
                  )}
                </div>
              </Card>

              {/* Top customers */}
              <Card className="p-5">
                <ChartHeader
                  title="Top customers"
                  right={<FiSliders className="w-4 h-4 text-slate-300" />}
                />
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col />
                      <col style={{ width: '80px' }} />
                      <col style={{ width: '110px' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-[#E2E8F0] dark:border-[#2A2B36] uppercase tracking-wider">
                        <th className="pb-3 text-left font-bold text-slate-400">
                          Customer
                        </th>
                        <th className="pb-3 text-right font-bold text-slate-400">
                          Orders
                        </th>
                        <th className="pb-3 text-right font-bold text-slate-400">
                          Spent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                      {(data?.top_customers ?? []).map((cust, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-[#1C1D24] transition-colors"
                        >
                          <td className="py-3 text-slate-600 dark:text-[#EAE5DF] font-bold uppercase truncate">
                            {cust.name}
                          </td>
                          <td className="py-3 text-right text-slate-400 font-semibold">
                            {n(cust.orders)}
                          </td>
                          <td className="py-3 text-right font-extrabold text-[#101B55] dark:text-[#F2DD50]">
                            {c(cust.spent)}
                          </td>
                        </tr>
                      ))}
                      {!data?.top_customers?.length && (
                        <tr>
                          <td
                            colSpan={3}
                            className="py-8 text-center text-slate-400"
                          >
                            No customer data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/*  ROW 4: Three health metric cards  */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Total orders */}
              <Card className="p-5 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
                  <FiTarget className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total orders
                  </p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-[#EAE5DF] mt-1 leading-none">
                    {n(data?.summary?.order_count ?? 0)}
                  </p>
                </div>
              </Card>

              {/* Low stock */}
              <Card
                className={`p-5 flex items-center gap-4 shadow-sm ${
                  (data?.summary?.low_stock_count ?? 0) > 0
                    ? 'border-amber-200 dark:border-amber-800'
                    : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    (data?.summary?.low_stock_count ?? 0) > 0
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'bg-slate-50 dark:bg-[#1C1D24]'
                  }`}
                >
                  <FiPackage
                    className={`w-5 h-5 ${
                      (data?.summary?.low_stock_count ?? 0) > 0
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Low stock alerts
                  </p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-[#EAE5DF] mt-1 leading-none">
                    {n(data?.summary?.low_stock_count ?? 0)}
                  </p>
                </div>
              </Card>

              {/* Profit margin */}
              <Card className="p-5 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <FiPercent className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Profit margin
                  </p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-[#EAE5DF] mt-1 leading-none">
                    {margin !== null ? `${margin}%` : ''}
                  </p>
                </div>
              </Card>
            </div>

            {/* ROW 5: Top Products */}
            <Card>
              <ChartHeader title="Top Selling Products" />
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b-2 border-[#E2E8F0] dark:border-[#2A2B36] uppercase tracking-wider text-xs">
                      <th className="pb-3 pt-2 text-left font-semibold text-slate-500 dark:text-slate-400">Product</th>
                      <th className="pb-3 pt-2 text-right font-semibold text-slate-500 dark:text-slate-400">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.top_products?.length > 0 ? (
                      data.top_products.map((product, i) => (
                        <tr key={i} className="border-b border-[#F1F5F9] dark:border-[#23252E] last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 pr-4 font-medium text-slate-700 dark:text-slate-200 truncate">{product.name}</td>
                          <td className="py-3.5 pl-4 text-right font-semibold text-slate-800 dark:text-slate-100">{n(product.quantity)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-10 text-center text-slate-500">
                          No product data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
        </div>
      </div>
    </div>
  );
}