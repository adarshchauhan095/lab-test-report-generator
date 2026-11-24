import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '@/database/db';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FEATURE_FLAGS } from '@/config/features';
import {
  FileText,
  Users2,
  Package,
  Receipt,
  CreditCard,
  AlertCircle,
  Plus,
  ArrowUpRight,
  TrendingUp,
  FlaskConical,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';

const CHART_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export function Dashboard() {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'prevMonth'>('all');

  // Real database records
  const reports = useLiveQuery(() => db.reports.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const commodities = useLiveQuery(() => db.commodities.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // Filtered reports & invoices by dashboard time filter
  const { filteredReports, filteredInvoices, filteredPayments } = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const yestStr = format(subDays(now, 1), 'yyyy-MM-dd');

    const filterByDate = (dateStr: string) => {
      if (timeFilter === 'all') return true;
      if (!dateStr) return false;
      const d = parseISO(dateStr);

      if (timeFilter === 'today') return dateStr.startsWith(todayStr);
      if (timeFilter === 'yesterday') return dateStr.startsWith(yestStr);
      if (timeFilter === 'last7') return isWithinInterval(d, { start: subDays(now, 7), end: now });
      if (timeFilter === 'last30') return isWithinInterval(d, { start: subDays(now, 30), end: now });
      if (timeFilter === 'thisMonth')
        return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
      if (timeFilter === 'prevMonth') {
        const p = subMonths(now, 1);
        return isWithinInterval(d, { start: startOfMonth(p), end: endOfMonth(p) });
      }
      return true;
    };

    return {
      filteredReports: reports.filter((r) => filterByDate(r.reportDate)),
      filteredInvoices: invoices.filter((i) => filterByDate(i.invoiceDate)),
      filteredPayments: payments.filter((p) => filterByDate(p.paymentDate)),
    };
  }, [reports, invoices, payments, timeFilter]);

  // High-level statistics
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);

    const reportsToday = reports.filter((r) => r.reportDate?.startsWith(todayStr)).length;
    const reportsThisMonth = reports.filter((r) => {
      if (!r.reportDate) return false;
      const d = parseISO(r.reportDate);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    }).length;

    let totalSamples = 0;
    reports.forEach((r) => {
      totalSamples += r.commodities?.length || 0;
    });

    const totalBilled = filteredInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = filteredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

    return {
      totalReports: reports.length,
      reportsToday,
      reportsThisMonth,
      totalCustomers: customers.length,
      totalCommodities: commodities.length,
      totalSamples,
      totalBilled,
      totalPaid,
      totalOutstanding,
    };
  }, [reports, customers, commodities, invoices, filteredInvoices, filteredPayments]);

  // Commodity distribution data for pie chart
  const commodityChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filteredReports) {
      for (const c of r.commodities || []) {
        const name = c.commodityName || 'Other';
        counts[name] = (counts[name] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredReports]);

  // User-wise report creation data for bar chart
  const userChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of filteredReports) {
      const u = r.createdBy || 'Unknown';
      counts[u] = (counts[u] || 0) + 1;
    }
    return Object.entries(counts).map(([user, count]) => ({ user, count }));
  }, [filteredReports]);

  // Monthly revenue trend (last 6 months)
  const monthlyRevenueData = useMemo(() => {
    const monthsMap: Record<string, { month: string; billed: number; collected: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const mDate = subMonths(now, i);
      const key = format(mDate, 'MMM yyyy');
      monthsMap[key] = { month: key, billed: 0, collected: 0 };
    }

    invoices.forEach((inv) => {
      if (!inv.invoiceDate) return;
      try {
        const key = format(parseISO(inv.invoiceDate), 'MMM yyyy');
        if (monthsMap[key]) {
          monthsMap[key].billed += inv.grandTotal || 0;
        }
      } catch {}
    });

    payments.forEach((pay) => {
      if (!pay.paymentDate) return;
      try {
        const key = format(parseISO(pay.paymentDate), 'MMM yyyy');
        if (monthsMap[key]) {
          monthsMap[key].collected += pay.amount || 0;
        }
      } catch {}
    });

    return Object.values(monthsMap);
  }, [invoices, payments]);

  // Recent records
  const recentReports = useMemo(() => {
    return [...reports]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
  }, [reports]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);
  }, [invoices]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-sky-950 text-white p-6 rounded-2xl shadow-md">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-sky-400 bg-sky-900/60 px-2.5 py-0.5 rounded-full border border-sky-700/50">
            Real-Time Analytical Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2 text-white">
            Laboratory Operations & Revenue
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live metrics aggregated directly from client IndexedDB testing records. No dummy stats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Period: All Records</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7">Last 7 Days</option>
            <option value="last30">Last 30 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="prevMonth">Previous Month</option>
          </select>

          {FEATURE_FLAGS.newReport && (
            <Link to="/reports/new">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4" />
                <span>Create Report</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports Generated"
          value={stats.totalReports}
          subtitle={`${stats.reportsToday} today • ${stats.reportsThisMonth} this month`}
          icon={FileText}
          color="sky"
        />
        <StatCard
          title="Samples Analyzed"
          value={stats.totalSamples}
          subtitle={`Across ${stats.totalCommodities} commodities`}
          icon={FlaskConical}
          color="indigo"
        />
        {FEATURE_FLAGS.billingAndInvoices ? (
          <>
            <StatCard
              title="Period Revenue Billed"
              value={formatCurrency(stats.totalBilled)}
              subtitle={`Paid: ${formatCurrency(stats.totalPaid)}`}
              icon={Receipt}
              color="emerald"
            />
            <StatCard
              title="Total Receivables Outstanding"
              value={formatCurrency(stats.totalOutstanding)}
              subtitle="Pending customer invoices"
              icon={AlertCircle}
              color="rose"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Registered Clients"
              value={stats.totalCustomers}
              subtitle="Active testing parties"
              icon={Users2}
              color="emerald"
            />
            <StatCard
              title="Reports Issued Today"
              value={stats.reportsToday}
              subtitle={`${stats.reportsThisMonth} this month`}
              icon={Clock}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs">
        <div>
          <span className="text-slate-500 block text-[11px]">Registered Clients:</span>
          <span className="font-bold text-slate-900 text-base">{stats.totalCustomers}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[11px]">Commodity Catalogs:</span>
          <span className="font-bold text-slate-900 text-base">{stats.totalCommodities}</span>
        </div>
        {FEATURE_FLAGS.billingAndInvoices ? (
          <>
            <div>
              <span className="text-slate-500 block text-[11px]">Invoices Issued:</span>
              <span className="font-bold text-slate-900 text-base">{invoices.length}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Receipts Collected:</span>
              <span className="font-bold text-slate-900 text-base">{payments.length}</span>
            </div>
          </>
        ) : (
          <>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Tested Batches:</span>
              <span className="font-bold text-slate-900 text-base">{stats.totalSamples}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Reports This Month:</span>
              <span className="font-bold text-slate-900 text-base">{stats.reportsThisMonth}</span>
            </div>
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 ${FEATURE_FLAGS.billingAndInvoices ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-6`}>
        {/* Monthly Revenue Trend (Only if billing is enabled) */}
        {FEATURE_FLAGS.billingAndInvoices && (
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Monthly Invoicing & Revenue Realization
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Billed invoices vs received payments</p>
              </div>
              <TrendingUp className="w-4 h-4 text-sky-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="billed" name="Billed (₹)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Commodity Distribution Pie */}
        <div className={`bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col ${!FEATURE_FLAGS.billingAndInvoices && !FEATURE_FLAGS.userManagement ? 'lg:col-span-2' : ''}`}>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Commodity Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">Reports proportion by commodity</p>
          <div className="flex-1 min-h-[220px]">
            {commodityChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No reports for selected timeframe
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={commodityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {commodityChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Operator Report Production Chart (Only if user management is enabled or side by side with pie) */}
        {FEATURE_FLAGS.userManagement && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Operator Testing Throughput
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">Reports issued by laboratory operators</p>
            <div className="flex-1 min-h-[220px]">
              {userChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  No reports found for selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="user" type="category" tick={{ fontSize: 11 }} width={120} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="count" name="Reports Issued" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Records Grid (Reports & Invoices) */}
      <div className={`grid grid-cols-1 ${FEATURE_FLAGS.billingAndInvoices ? 'lg:grid-cols-2' : ''} gap-6`}>
        {/* Recent Reports */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Laboratory Reports
            </h3>
            <Link to="/reports" className="text-xs font-semibold text-sky-600 hover:underline">
              View All Reports →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentReports.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-mono font-bold text-sky-700">{r.reportNumber}</p>
                  <p className="text-slate-800 font-medium">{r.customerName}</p>
                  <p className="text-[10px] text-slate-400">
                    {r.commodities.map((c) => c.commodityName).join(', ')} • {formatDate(r.reportDate)}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={r.status === 'finalized' ? 'success' : 'warning'}>
                    {r.status}
                  </Badge>
                  <p className="font-bold text-slate-900 mt-1">
                    {formatCurrency(r.financials?.grandTotal || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices (Only if billing is enabled) */}
        {FEATURE_FLAGS.billingAndInvoices && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Recent Invoices & Payments
              </h3>
              <Link to="/invoices" className="text-xs font-semibold text-sky-600 hover:underline">
                View All Invoices →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</p>
                    <p className="text-slate-800 font-medium">{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400">Due: {formatDate(inv.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        inv.paymentStatus === 'paid'
                          ? 'success'
                          : inv.paymentStatus === 'partially_paid'
                          ? 'warning'
                          : 'danger'
                      }
                    >
                      {inv.paymentStatus.replace('_', ' ')}
                    </Badge>
                    <p className="font-bold text-slate-900 mt-1">
                      {formatCurrency(inv.grandTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
