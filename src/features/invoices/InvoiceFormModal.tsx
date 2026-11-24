import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema } from '@/schemas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { Invoice, Customer, Report } from '@/types';
import { db } from '@/database/db';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { calculateBilling } from '@/services/billingEngine';
import { formatCurrency, getTodayDateString } from '@/utils/formatters';
import { addDays, format } from 'date-fns';
import { Plus, Trash2, FileText, CheckCircle2 } from 'lucide-react';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice?: Invoice | null;
  customers: Customer[];
  reports: Report[];
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
  customers,
  reports,
}: InvoiceFormModalProps) {
  const { currentUser } = useUser();
  const { success, error } = useToast();

  const isEdit = Boolean(invoice);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: '',
      invoiceDate: getTodayDateString(),
      dueDate: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
      customerId: '',
      customerName: '',
      reportIds: [],
      items: [
        {
          id: 'item-' + Date.now(),
          description: 'Laboratory Analytical Testing Services',
          quantity: 1,
          unit: 'Report',
          unitPrice: 500,
          amount: 500,
        },
      ],
      subtotal: 500,
      additionalCharges: 0,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: 90,
      grandTotal: 590,
      paymentTerms: 'Payment due within 15 days of invoice date',
      notes: '',
      status: 'finalized',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Next invoice prefix and sequence
  useEffect(() => {
    if (invoice) {
      reset(invoice);
    } else {
      db.billingSettings.get('default').then((settings) => {
        const prefix = settings?.invoicePrefix || 'INV-2026-';
        const seq = settings?.nextInvoiceSequence || 1005;
        setValue('invoiceNumber', `${prefix}${seq}`);
        setValue('taxRate', settings?.defaultTaxRate || 18);
        setValue('paymentTerms', settings?.paymentTerms || 'Payment due within 15 days');
      });
    }
  }, [invoice, reset, setValue]);

  const selectedCustomerId = watch('customerId');

  // Find unbilled finalized reports for selected customer
  const availableReports = useMemo(() => {
    if (!selectedCustomerId) return [];
    return reports.filter(
      (r) => r.customerId === selectedCustomerId && r.status === 'finalized'
    );
  }, [reports, selectedCustomerId]);

  const handleCustomerSelect = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;
    setValue('customerId', cust.id);
    setValue('customerName', cust.companyName);
  };

  const handleAddReportToInvoice = (report: Report) => {
    const currentReportIds = watch('reportIds') || [];
    if (!currentReportIds.includes(report.reportNumber)) {
      setValue('reportIds', [...currentReportIds, report.reportNumber]);
    }

    // Add each commodity testing charges as an item
    for (const comm of report.commodities) {
      append({
        id: 'item-' + Math.random().toString(36).substring(2, 9),
        reportId: report.id,
        reportNumber: report.reportNumber,
        description: `Analytical Testing - ${comm.commodityName} (Report: ${report.reportNumber})`,
        commodityName: comm.commodityName,
        quantity: 1,
        unit: 'Sample',
        unitPrice: comm.commoditySubtotal,
        amount: comm.commoditySubtotal,
      });
    }
  };

  // Watch items and inputs for calculations
  const watchedItems = watch('items') || [];
  const additionalCharges = watch('additionalCharges') || 0;
  const discountAmount = watch('discountAmount') || 0;
  const taxRate = watch('taxRate') || 0;

  const itemsSubtotal = useMemo(() => {
    return watchedItems.reduce(
      (sum: number, it: any) => sum + (parseFloat(it.amount) || (parseFloat(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0)),
      0
    );
  }, [watchedItems]);

  const calculatedBilling = useMemo(() => {
    return calculateBilling({
      testingCharges: itemsSubtotal,
      additionalCharges: parseFloat(additionalCharges) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      taxRate: parseFloat(taxRate) || 0,
    });
  }, [itemsSubtotal, additionalCharges, discountAmount, taxRate]);

  useEffect(() => {
    setValue('subtotal', calculatedBilling.testingCharges);
    setValue('taxAmount', calculatedBilling.taxAmount);
    setValue('grandTotal', calculatedBilling.grandTotal);
  }, [calculatedBilling, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const now = new Date().toISOString();
      const invoiceData = {
        ...data,
        subtotal: calculatedBilling.testingCharges,
        additionalCharges: calculatedBilling.additionalCharges,
        discountAmount: calculatedBilling.discountAmount,
        taxRate: calculatedBilling.taxRate,
        taxAmount: calculatedBilling.taxAmount,
        grandTotal: calculatedBilling.grandTotal,
        amountPaid: invoice?.amountPaid || 0,
        balanceDue: Math.max(0, calculatedBilling.grandTotal - (invoice?.amountPaid || 0)),
        paymentStatus: invoice?.paymentStatus || 'unpaid',
      };

      if (isEdit && invoice) {
        await db.invoices.update(invoice.id, {
          ...invoiceData,
          updatedAt: now,
        });
        success('Invoice Updated', `${data.invoiceNumber} has been updated.`);
      } else {
        const id = 'inv-' + Date.now();
        await db.invoices.add({
          ...invoiceData,
          id,
          createdAt: now,
          updatedAt: now,
          createdBy: currentUser.fullName,
        });

        // Increment sequence in settings
        const settings = await db.billingSettings.get('default');
        if (settings) {
          await db.billingSettings.update('default', {
            nextInvoiceSequence: (settings.nextInvoiceSequence || 1005) + 1,
          });
        }

        // Link report with this invoice
        for (const repNum of data.reportIds || []) {
          const matched = reports.find((r) => r.reportNumber === repNum);
          if (matched) {
            await db.reports.update(matched.id, { invoiceId: id });
          }
        }

        success('Invoice Created', `Invoice ${data.invoiceNumber} generated successfully.`);
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save invoice', err?.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Invoice' : 'Generate Tax Invoice'}
      subtitle="Bill laboratory testing reports and analytical services"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer & Invoice Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Invoice Number <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('invoiceNumber')}
              placeholder="e.g. INV-2026-1005"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Party <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-[11px] text-rose-500 mt-1">{(errors.customerId as any).message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Date</label>
            <input
              type="date"
              {...register('invoiceDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              {...register('dueDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Quick-Import from Customer Reports */}
        {availableReports.length > 0 && (
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg text-xs">
            <span className="font-bold text-sky-900 block mb-1.5">
              Available Reports for this Customer (One-Click Bill Generation):
            </span>
            <div className="flex flex-wrap gap-2">
              {availableReports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleAddReportToInvoice(r)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-sky-800 border border-sky-300 hover:bg-sky-100 font-medium cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    {r.reportNumber} ({r.commodities.map((c) => c.commodityName).join(', ')}) -{' '}
                    {formatCurrency(r.financials?.grandTotal || 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Invoice Line Items ({fields.length})
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  id: 'item-' + Date.now(),
                  description: 'Analytical Testing Charges',
                  quantity: 1,
                  unit: 'Service',
                  unitPrice: 500,
                  amount: 500,
                })
              }
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Item</span>
            </Button>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] text-slate-700">
                <tr>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 w-28">Ref Report #</th>
                  <th className="py-2 px-3 w-16 text-center">Qty</th>
                  <th className="py-2 px-3 w-24 text-right">Rate (₹)</th>
                  <th className="py-2 px-3 w-28 text-right">Amount (₹)</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map((f, idx) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3">
                      <input
                        {...register(`items.${idx}.description`)}
                        placeholder="Description of testing or service"
                        className="w-full text-xs px-2 py-1 border rounded border-slate-300 font-medium"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        {...register(`items.${idx}.reportNumber`)}
                        placeholder="ATS/... (opt)"
                        className="w-full text-xs px-2 py-1 border rounded border-slate-300 font-mono text-[11px]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="any"
                        {...register(`items.${idx}.quantity`, {
                          onChange: (e) => {
                            const q = parseFloat(e.target.value) || 1;
                            const r = parseFloat(watch(`items.${idx}.unitPrice`)) || 0;
                            setValue(`items.${idx}.amount`, q * r);
                          },
                        })}
                        className="w-full text-xs px-2 py-1 border rounded border-slate-300 text-center"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="any"
                        {...register(`items.${idx}.unitPrice`, {
                          onChange: (e) => {
                            const r = parseFloat(e.target.value) || 0;
                            const q = parseFloat(watch(`items.${idx}.quantity`)) || 1;
                            setValue(`items.${idx}.amount`, q * r);
                          },
                        })}
                        className="w-full text-xs px-2 py-1 border rounded border-slate-300 text-right font-mono"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      <input
                        type="number"
                        step="any"
                        {...register(`items.${idx}.amount`)}
                        className="w-full text-xs px-2 py-1 border rounded border-slate-300 text-right font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        disabled={fields.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations breakdown & Terms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Additional (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('additionalCharges')}
                  className="w-full text-xs px-2 py-1.5 border rounded border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('discountAmount')}
                  className="w-full text-xs px-2 py-1.5 border rounded border-slate-300"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('taxRate')}
                  className="w-full text-xs px-2 py-1.5 border rounded border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Payment Terms</label>
              <input
                {...register('paymentTerms')}
                className="w-full text-xs px-3 py-1.5 border rounded border-slate-300"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(calculatedBilling.testingCharges)}
              </span>
            </div>
            {calculatedBilling.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Additional Charges:</span>
                <span className="font-semibold text-slate-800">
                  + {formatCurrency(calculatedBilling.additionalCharges)}
                </span>
              </div>
            )}
            {calculatedBilling.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount Applied:</span>
                <span className="font-semibold">
                  - {formatCurrency(calculatedBilling.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-medium text-slate-800">
                {formatCurrency(calculatedBilling.taxableAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST ({calculatedBilling.taxRate}%):</span>
              <span className="font-semibold text-slate-800">
                + {formatCurrency(calculatedBilling.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
              <span>Grand Total:</span>
              <span className="text-sky-700 text-base">
                {formatCurrency(calculatedBilling.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Generate Invoice'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
