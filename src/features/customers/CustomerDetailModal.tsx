import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { Customer, Report, Invoice, Payment } from '@/types';
import { db } from '@/database/db';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Building2, Phone, Mail, MapPin, Receipt, FileText, CreditCard, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FEATURE_FLAGS } from '@/config/features';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerDetailModal({ isOpen, onClose, customer }: CustomerDetailModalProps) {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'invoices' | 'payments'>('reports');

  useEffect(() => {
    if (!customer) return;

    const loadCustomerData = async () => {
      const [reps, invs, pays] = await Promise.all([
        db.reports.where('customerId').equals(customer.id).toArray(),
        db.invoices.where('customerId').equals(customer.id).toArray(),
        db.payments.where('customerId').equals(customer.id).toArray(),
      ]);

      setReports(reps);
      setInvoices(invs);
      setPayments(pays);
    };

    loadCustomerData();
  }, [customer]);

  if (!customer) return null;

  const totalBilled = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalPaid = payments.reduce((acc, pay) => acc + pay.amount, 0);
  const netOutstanding = totalBilled + (customer.openingBalance || 0) - totalPaid;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${customer.name} - ${customer.companyName}`}
      subtitle={`Customer Code: ${customer.customerCode}`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/reports/new?customerId=${customer.id}`);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Create Report for Customer</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Contact info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Company:</strong> {customer.companyName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Mobile:</strong> {customer.mobile}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Email:</strong> {customer.email || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              <strong>Location:</strong> {customer.city}, {customer.state}
            </span>
          </div>
          {customer.gstin && (
            <div className="col-span-1 sm:col-span-2 text-slate-700 font-mono">
              <strong>GSTIN:</strong> {customer.gstin}
            </div>
          )}
        </div>

        {/* Financial Highlights (Only if billing is enabled) */}
        {FEATURE_FLAGS.billingAndInvoices && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg">
              <p className="text-[11px] font-medium text-sky-700 uppercase">Total Invoiced</p>
              <p className="text-base font-bold text-sky-900 mt-0.5">{formatCurrency(totalBilled)}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
              <p className="text-[11px] font-medium text-emerald-700 uppercase">Total Paid</p>
              <p className="text-base font-bold text-emerald-900 mt-0.5">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <p className="text-[11px] font-medium text-amber-700 uppercase">Outstanding Due</p>
              <p className="text-base font-bold text-amber-900 mt-0.5">
                {formatCurrency(Math.max(0, netOutstanding))}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-b-2 border-sky-600 text-sky-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports ({reports.length})</span>
            </button>
            {FEATURE_FLAGS.billingAndInvoices && (
              <>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'invoices'
                      ? 'border-b-2 border-sky-600 text-sky-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Invoices ({invoices.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeTab === 'payments'
                      ? 'border-b-2 border-sky-600 text-sky-600 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment Records ({payments.length})</span>
                </button>
              </>
            )}
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto">
            {activeTab === 'reports' && (
              reports.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No reports recorded for this customer yet.</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Report #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Commodities</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium text-sky-700">{r.reportNumber}</td>
                        <td className="p-2">{formatDate(r.reportDate)}</td>
                        <td className="p-2">{r.commodities.map((c) => c.commodityName).join(', ')}</td>
                        <td className="p-2">
                          <Badge
                            variant={
                              r.status === 'finalized' ? 'success' : r.status === 'draft' ? 'warning' : 'neutral'
                            }
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(r.financials?.grandTotal || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'invoices' && (
              invoices.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No invoices generated for this customer yet.</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Payment Status</th>
                      <th className="p-2 text-right">Grand Total</th>
                      <th className="p-2 text-right">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium text-slate-800">{inv.invoiceNumber}</td>
                        <td className="p-2">{formatDate(inv.invoiceDate)}</td>
                        <td className="p-2">
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
                        </td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(inv.grandTotal)}</td>
                        <td className="p-2 text-right font-bold text-rose-600">{formatCurrency(inv.balanceDue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'payments' && (
              payments.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No payments received from this customer yet.</p>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Receipt #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Mode</th>
                      <th className="p-2">Ref / UTR</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-medium text-slate-800">{p.paymentNumber}</td>
                        <td className="p-2">{formatDate(p.paymentDate)}</td>
                        <td className="p-2 uppercase font-mono text-[11px]">{p.paymentMethod.replace('_', ' ')}</td>
                        <td className="p-2 text-slate-500 font-mono text-[11px]">{p.referenceNumber}</td>
                        <td className="p-2 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
