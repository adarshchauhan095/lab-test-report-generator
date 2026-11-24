import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import {
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Users2,
  Package,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export function AnalyticsView() {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'commodity' | 'user' | 'customer' | 'parameters' | 'revenue'>('commodity');

  const reports = useLiveQuery(() => db.reports.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const commodities = useLiveQuery(() => db.commodities.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];

  // 1. Commodity Analytics
  const commoditySummary = useMemo(() => {
    const map: Record<string, { name: string; reportCount: number; sampleCount: number; totalTestingCharges: number }> = {};
    for (const r of reports) {
      for (const c of r.commodities || []) {
        const name = c.commodityName || 'Unknown';
        if (!map[name]) {
          map[name] = { name, reportCount: 0, sampleCount: 0, totalTestingCharges: 0 };
        }
        map[name].reportCount += 1;
        map[name].sampleCount += c.numberOfBags || 1;
        map[name].totalTestingCharges += c.commoditySubtotal || 0;
      }
    }
    return Object.values(map);
  }, [reports]);

  // 2. User Analytics
  const userSummary = useMemo(() => {
    const map: Record<string, { user: string; reportsCount: number; testingCharges: number; invoicesGenerated: number; collections: number }> = {};

    for (const r of reports) {
      const u = r.createdBy || 'Unknown';
      if (!map[u]) {
        map[u] = { user: u, reportsCount: 0, testingCharges: 0, invoicesGenerated: 0, collections: 0 };
      }
      map[u].reportsCount += 1;
      map[u].testingCharges += r.financials?.testingCharges || 0;
    }

    for (const inv of invoices) {
      const u = inv.createdBy || 'Unknown';
      if (!map[u]) {
        map[u] = { user: u, reportsCount: 0, testingCharges: 0, invoicesGenerated: 0, collections: 0 };
      }
      map[u].invoicesGenerated += 1;
    }

    for (const p of payments) {
      const u = p.receivedBy || 'Unknown';
      if (!map[u]) {
        map[u] = { user: u, reportsCount: 0, testingCharges: 0, invoicesGenerated: 0, collections: 0 };
      }
      map[u].collections += p.amount || 0;
    }

    return Object.values(map);
  }, [reports, invoices, payments]);

  // 3. Customer Summary
  const customerSummary = useMemo(() => {
    const map: Record<string, { id: string; name: string; reportsCount: number; totalBilled: number; totalPaid: number; balanceDue: number }> = {};

    for (const c of customers) {
      map[c.id] = { id: c.id, name: c.companyName, reportsCount: 0, totalBilled: 0, totalPaid: 0, balanceDue: 0 };
    }

    for (const r of reports) {
      if (map[r.customerId]) {
        map[r.customerId].reportsCount += 1;
      }
    }

    for (const inv of invoices) {
      if (map[inv.customerId]) {
        map[inv.customerId].totalBilled += inv.grandTotal || 0;
        map[inv.customerId].totalPaid += inv.amountPaid || 0;
        map[inv.customerId].balanceDue += inv.balanceDue || 0;
      }
    }

    return Object.values(map);
  }, [customers, reports, invoices]);

  // 4. Test Parameters Frequency
  const parameterFrequency = useMemo(() => {
    const map: Record<string, { name: string; method: string; count: number; totalRevenue: number }> = {};

    for (const r of reports) {
      for (const c of r.commodities || []) {
        for (const res of c.testResults || []) {
          const key = res.parameterName;
          if (!map[key]) {
            map[key] = { name: res.parameterName, method: res.testMethod || 'Standard', count: 0, totalRevenue: 0 };
          }
          map[key].count += 1;
          map[key].totalRevenue += parseFloat(res.charge as any) || 0;
        }
      }
    }

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [reports]);

  // CSV Exporter for active view
  const exportActiveCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = `analytics_${activeTab}_${Date.now()}.csv`;

    if (activeTab === 'commodity') {
      headers = ['Commodity Name', 'Reports Count', 'Total Samples / Bags', 'Total Testing Charges'];
      rows = commoditySummary.map((c) => [`"${c.name}"`, c.reportCount, c.sampleCount, c.totalTestingCharges]);
    } else if (activeTab === 'user') {
      headers = ['User Name', 'Reports Created', 'Testing Charges Billed', 'Invoices Generated', 'Collections'];
      rows = userSummary.map((u) => [`"${u.user}"`, u.reportsCount, u.testingCharges, u.invoicesGenerated, u.collections]);
    } else if (activeTab === 'customer') {
      headers = ['Customer Name', 'Reports Count', 'Total Invoiced', 'Total Paid', 'Balance Due'];
      rows = customerSummary.map((c) => [`"${c.name}"`, c.reportsCount, c.totalBilled, c.totalPaid, c.balanceDue]);
    } else if (activeTab === 'parameters') {
      headers = ['Test Parameter', 'Standard Method', 'Test Frequency (Count)', 'Total Testing Revenue'];
      rows = parameterFrequency.map((p) => [`"${p.name}"`, `"${p.method}"`, p.count, p.totalRevenue]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', `${activeTab.toUpperCase()} analytics report downloaded.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Management Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Deep-dive operational metrics, client revenues, parameter test frequencies, and operator performance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportActiveCSV}>
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Active Report to CSV</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/70 rounded-xl max-w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab('commodity')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'commodity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Commodity Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'user' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users2 className="w-4 h-4" />
          <span>User-Wise Report Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('customer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'customer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Customer Ledger</span>
        </button>
        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'parameters' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Test Parameter Frequency</span>
        </button>
      </div>

      {/* TAB CONTENT: COMMODITY */}
      {activeTab === 'commodity' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Commodity Testing Charges Comparison
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commoditySummary} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val) || 0)} />
                  <Bar dataKey="totalTestingCharges" name="Testing Charges (₹)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Commodity Name</th>
                  <th className="py-3 px-4 text-center">Reports Count</th>
                  <th className="py-3 px-4 text-center">Total Bags / Quantity</th>
                  <th className="py-3 px-4 text-right">Total Testing Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commoditySummary.map((c) => (
                  <tr key={c.name} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{c.reportCount}</td>
                    <td className="py-3 px-4 text-center font-mono">{c.sampleCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-800">
                      {formatCurrency(c.totalTestingCharges)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: USER */}
      {activeTab === 'user' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Operator Testing Value Attributed
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userSummary} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="user" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val) || 0)} />
                  <Bar dataKey="testingCharges" name="Testing Charges (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Operator / User</th>
                  <th className="py-3 px-4 text-center">Reports Issued</th>
                  <th className="py-3 px-4 text-right">Testing Value</th>
                  <th className="py-3 px-4 text-center">Invoices Handled</th>
                  <th className="py-3 px-4 text-right">Collections Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userSummary.map((u) => (
                  <tr key={u.user} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.user}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{u.reportsCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(u.testingCharges)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{u.invoicesGenerated}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sky-800">
                      {formatCurrency(u.collections)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CUSTOMER */}
      {activeTab === 'customer' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-center">Reports</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerSummary.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4 text-center font-mono font-medium">{c.reportsCount}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(c.totalBilled)}</td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                    {formatCurrency(c.totalPaid)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    {formatCurrency(c.balanceDue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: PARAMETERS FREQUENCY */}
      {activeTab === 'parameters' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Most Frequently Tested Analytical Parameters
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={parameterFrequency} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Test Frequency" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Parameter Name</th>
                  <th className="py-3 px-4">Standard Method</th>
                  <th className="py-3 px-4 text-center">Frequency (Tests Run)</th>
                  <th className="py-3 px-4 text-right">Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parameterFrequency.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.method}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-purple-700">{p.count}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
