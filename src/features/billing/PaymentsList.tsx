import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CreditCard, Search, FileSpreadsheet, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export function PaymentsList() {
  const { success } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const payments = useLiveQuery(() => db.payments.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers) {
      map.set(c.id, c.companyName);
    }
    return map;
  }, [customers]);

  const invoiceMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      map.set(inv.id, inv.invoiceNumber);
    }
    return map;
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const custName = customerMap.get(p.customerId) || '';
      const invNum = invoiceMap.get(p.invoiceId) || '';

      const matchesSearch =
        !q ||
        p.paymentNumber.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        invNum.toLowerCase().includes(q);

      const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [payments, searchQuery, methodFilter, customerMap, invoiceMap]);

  const totalCollected = useMemo(() => {
    return payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  }, [payments]);

  const exportPaymentsCSV = () => {
    const headers = [
      'Receipt Number',
      'Invoice Number',
      'Customer Name',
      'Payment Date',
      'Method',
      'Reference / UTR',
      'Amount',
      'Received By',
      'Notes',
    ];

    const rows = filteredPayments.map((p) => [
      `"${p.paymentNumber}"`,
      `"${invoiceMap.get(p.invoiceId) || ''}"`,
      `"${customerMap.get(p.customerId) || ''}"`,
      `"${p.paymentDate}"`,
      `"${p.paymentMethod}"`,
      `"${p.referenceNumber}"`,
      p.amount,
      `"${p.receivedBy}"`,
      `"${p.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payments_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Payments ledger exported successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Receipts Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time audit log of client remittances, bank transfers, UPI and cash transactions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportPaymentsCSV}>
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Payments CSV</span>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Receipts Recorded"
          value={payments.length}
          subtitle="All confirmed transactions"
          icon={CreditCard}
          color="sky"
        />
        <StatCard
          title="Total Funds Collected"
          value={formatCurrency(totalCollected)}
          subtitle="Across all payment modes"
          icon={ArrowDownLeft}
          color="emerald"
        />
        <StatCard
          title="Average Payment"
          value={formatCurrency(payments.length > 0 ? totalCollected / payments.length : 0)}
          subtitle="Per receipt transaction"
          icon={CheckCircle2}
          color="indigo"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt #, UTR, customer, invoice..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Mode:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 border rounded-lg border-slate-300 bg-white"
          >
            <option value="all">All Modes</option>
            <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Reference / UTR</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-sky-700">
                      {invoiceMap.get(p.invoiceId) || p.invoiceId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {customerMap.get(p.customerId) || p.customerId}
                    </td>
                    <td className="py-3.5 px-4">{formatDate(p.paymentDate)}</td>
                    <td className="py-3.5 px-4 font-mono uppercase text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{p.referenceNumber}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{p.receivedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
