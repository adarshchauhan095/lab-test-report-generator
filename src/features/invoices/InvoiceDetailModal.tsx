import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { Invoice, Payment } from '@/types';
import { db } from '@/database/db';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { generateInvoicePdf } from '@/services/pdfGenerator';
import { useToast } from '@/context/ToastContext';
import { Printer, Download, CreditCard, Building2, Calendar, FileText } from 'lucide-react';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onRecordPayment: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  invoice,
  onRecordPayment,
}: InvoiceDetailModalProps) {
  const { success, error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    db.payments.where('invoiceId').equals(invoice.id).reverse().sortBy('paymentDate').then(setPayments);
  }, [invoice]);

  if (!invoice) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      const [company, billing] = await Promise.all([
        db.companySettings.get('default'),
        db.billingSettings.get('default'),
      ]);
      await generateInvoicePdf(invoice, company, billing, false);
      success('PDF Downloaded', `Invoice ${invoice.invoiceNumber} PDF downloaded.`);
    } catch (err: any) {
      error('Failed to generate PDF', err?.message);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsPdfGenerating(true);
      const [company, billing] = await Promise.all([
        db.companySettings.get('default'),
        db.billingSettings.get('default'),
      ]);
      await generateInvoicePdf(invoice, company, billing, true);
    } catch (err: any) {
      error('Failed to print PDF', err?.message);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice: ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customerName} • Date: ${formatDate(invoice.invoiceDate)}`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePrintPdf} isLoading={isPdfGenerating}>
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadPdf} isLoading={isPdfGenerating}>
              <Download className="w-4 h-4 text-slate-600" />
              <span>Download PDF</span>
            </Button>
            {invoice.balanceDue > 0 && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  onRecordPayment(invoice);
                }}
              >
                <CreditCard className="w-4 h-4" />
                <span>Record Payment</span>
              </Button>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Billed To:</span>
            <span className="font-bold text-slate-900">{invoice.customerName}</span>
            {invoice.reportIds?.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                Linked Reports: {invoice.reportIds.join(', ')}
              </p>
            )}
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Invoice & Due Date:</span>
            <span className="text-slate-800">
              {formatDate(invoice.invoiceDate)} (Due: {formatDate(invoice.dueDate)})
            </span>
            <p className="text-[11px] text-slate-500 mt-1">{invoice.paymentTerms}</p>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Payment Status:</span>
            <div className="mt-0.5">
              <Badge
                variant={
                  invoice.paymentStatus === 'paid'
                    ? 'success'
                    : invoice.paymentStatus === 'partially_paid'
                    ? 'warning'
                    : 'danger'
                }
                dot
              >
                {invoice.paymentStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Created by {invoice.createdBy}</p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 font-semibold text-slate-700 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Ref Report</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{item.description}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{item.reportNumber || '-'}</td>
                  <td className="py-2.5 px-3 text-center">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex justify-end">
          <div className="w-full sm:w-80 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Additional Charges:</span>
                <span className="font-semibold">+ {formatCurrency(invoice.additionalCharges)}</span>
              </div>
            )}
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-semibold">- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>GST ({invoice.taxRate}%):</span>
              <span className="font-semibold">+ {formatCurrency(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200 text-sm">
              <span>Grand Total:</span>
              <span className="text-sky-800">{formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Amount Paid:</span>
              <span>{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200 text-sm">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.balanceDue)}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Payment Receipts / Transactions ({payments.length})
          </h4>
          {payments.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-lg">
              No payments recorded for this invoice yet.
            </p>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-semibold text-slate-700">
                  <tr>
                    <th className="py-2 px-3">Receipt #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Reference / UTR</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-medium text-slate-800">{p.paymentNumber}</td>
                      <td className="py-2 px-3">{formatDate(p.paymentDate)}</td>
                      <td className="py-2 px-3 uppercase text-[11px] font-mono">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{p.referenceNumber}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600 font-mono">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{p.receivedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
