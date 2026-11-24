import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { InvoiceFormModal } from './InvoiceFormModal';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { generateInvoicePdf } from '@/services/pdfGenerator';
import type { Invoice } from '@/types';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  CreditCard,
  Printer,
  Download,
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export function InvoiceList() {
  const { can } = useUser();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partially_paid' | 'unpaid'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);

  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const reports = useLiveQuery(() => db.reports.toArray(), []) || [];

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const inv of invoices) {
      totalBilled += inv.grandTotal || 0;
      totalPaid += inv.amountPaid || 0;
      totalOutstanding += inv.balanceDue || 0;
    }

    return { totalBilled, totalPaid, totalOutstanding };
  }, [invoices]);

  // Filtered
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.reportIds?.some((r) => r.toLowerCase().includes(q));

      const matchesCustomer = selectedCustomer === 'all' || inv.customerId === selectedCustomer;
      const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter;

      return matchesSearch && matchesCustomer && matchesStatus;
    });
  }, [invoices, searchQuery, selectedCustomer, statusFilter]);

  const handleDownloadPdf = async (inv: Invoice) => {
    try {
      const [comp, billing] = await Promise.all([
        db.companySettings.get('default'),
        db.billingSettings.get('default'),
      ]);
      await generateInvoicePdf(inv, comp, billing, false);
      success('PDF Generated', `Invoice ${inv.invoiceNumber} PDF downloaded.`);
    } catch (err: any) {
      error('Failed to generate PDF', err?.message);
    }
  };

  const exportInvoicesCSV = () => {
    const headers = [
      'Invoice Number',
      'Customer Name',
      'Invoice Date',
      'Due Date',
      'Subtotal',
      'Discount',
      'Additional Charges',
      'Tax Amount',
      'Grand Total',
      'Amount Paid',
      'Balance Due',
      'Payment Status',
      'Created By',
    ];

    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.customerName}"`,
      `"${inv.invoiceDate}"`,
      `"${inv.dueDate}"`,
      inv.subtotal,
      inv.discountAmount,
      inv.additionalCharges,
      inv.taxAmount,
      inv.grandTotal,
      inv.amountPaid,
      inv.balanceDue,
      `"${inv.paymentStatus}"`,
      `"${inv.createdBy}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `invoices_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Invoices exported successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate tax invoices, link report batches, track payment balances, and issue receipts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={exportInvoicesCSV}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>
          {can('create_invoice') && (
            <Button variant="primary" size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Billed Revenue"
          value={formatCurrency(metrics.totalBilled)}
          subtitle={`${invoices.length} total invoices issued`}
          icon={Receipt}
          color="sky"
        />
        <StatCard
          title="Total Amount Collected"
          value={formatCurrency(metrics.totalPaid)}
          subtitle="Realized laboratory revenue"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(metrics.totalOutstanding)}
          subtitle="Pending customer balance"
          icon={AlertCircle}
          color="rose"
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, report #..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Linked Reports</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.customerName}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-sky-700">
                      {inv.reportIds?.join(', ') || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="py-3.5 px-4">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {formatCurrency(inv.balanceDue)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          inv.paymentStatus === 'paid'
                            ? 'success'
                            : inv.paymentStatus === 'partially_paid'
                            ? 'warning'
                            : 'danger'
                        }
                        dot
                      >
                        {inv.paymentStatus.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          title="View Invoice & Payments"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          title="Download Invoice PDF"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {inv.balanceDue > 0 && can('record_payment') && (
                          <button
                            onClick={() => setPaymentInvoice(inv)}
                            title="Record Payment"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Form Modal */}
      {isFormOpen && (
        <InvoiceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {}}
          customers={customers}
          reports={reports}
        />
      )}

      {/* Invoice Detail Modal */}
      {viewingInvoice && (
        <InvoiceDetailModal
          isOpen={Boolean(viewingInvoice)}
          onClose={() => setViewingInvoice(null)}
          invoice={viewingInvoice}
          onRecordPayment={(inv) => setPaymentInvoice(inv)}
        />
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentInvoice)}
          onClose={() => setPaymentInvoice(null)}
          onSuccess={() => {}}
          invoice={paymentInvoice}
        />
      )}
    </div>
  );
}
