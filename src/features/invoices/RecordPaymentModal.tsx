import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentFormSchema } from '@/schemas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { Invoice, PaymentMethod } from '@/types';
import { db } from '@/database/db';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, getTodayDateString } from '@/utils/formatters';
import { calculateOutstanding } from '@/services/billingEngine';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  invoice: Invoice | null;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  invoice,
}: RecordPaymentModalProps) {
  const { currentUser } = useUser();
  const { success, error } = useToast();

  const [receiptNumber, setReceiptNumber] = useState('');

  useEffect(() => {
    db.billingSettings.get('default').then((settings) => {
      const prefix = settings?.paymentReceiptPrefix || 'REC-2026-';
      const seq = settings?.nextReceiptSequence || 1005;
      setReceiptNumber(`${prefix}${seq}`);
    });
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(paymentFormSchema),
    values: invoice
      ? {
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: invoice.balanceDue,
          paymentDate: getTodayDateString(),
          paymentMethod: 'bank_transfer',
          referenceNumber: '',
          notes: '',
        }
      : undefined,
  });

  if (!invoice) return null;

  const onSubmit = async (data: any) => {
    try {
      const payAmount = parseFloat(data.amount);

      // Validation
      if (payAmount <= 0) {
        error('Invalid Amount', 'Payment amount must be greater than zero.');
        return;
      }

      if (payAmount > invoice.balanceDue) {
        error(
          'Overpayment Not Allowed',
          `Payment amount (${formatCurrency(payAmount)}) cannot exceed outstanding balance of ${formatCurrency(
            invoice.balanceDue
          )}.`
        );
        return;
      }

      const now = new Date().toISOString();
      const paymentId = 'pay-' + Date.now();

      // 1. Create Payment record
      await db.payments.add({
        id: paymentId,
        paymentNumber: receiptNumber,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        amount: payAmount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod as PaymentMethod,
        referenceNumber: data.referenceNumber,
        notes: data.notes || '',
        receivedBy: currentUser.fullName,
        createdAt: now,
      });

      // 2. Increment receipt sequence
      const billSettings = await db.billingSettings.get('default');
      if (billSettings) {
        await db.billingSettings.update('default', {
          nextReceiptSequence: (billSettings.nextReceiptSequence || 1005) + 1,
        });
      }

      // 3. Atomically update Invoice
      const newAmountPaid = (invoice.amountPaid || 0) + payAmount;
      const { balanceDue, paymentStatus } = calculateOutstanding(invoice.grandTotal, newAmountPaid);

      await db.invoices.update(invoice.id, {
        amountPaid: newAmountPaid,
        balanceDue,
        paymentStatus,
        updatedAt: now,
      });

      // 4. Log Activity
      await db.activityLogs.add({
        id: 'log-' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: paymentId,
        details: `Recorded payment of ${formatCurrency(payAmount)} for invoice ${invoice.invoiceNumber}`,
        timestamp: now,
      });

      success(
        'Payment Recorded',
        `Received ${formatCurrency(payAmount)} for ${invoice.invoiceNumber}. Balance: ${formatCurrency(
          balanceDue
        )}.`
      );

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to record payment', err?.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customerName} • Receipt: ${receiptNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Invoice Summary Box */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Invoice Grand Total:</span>
            <span className="font-semibold text-slate-800">{formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Previously Paid:</span>
            <span className="font-semibold text-emerald-700">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
            <span className="text-slate-800">Current Balance Due:</span>
            <span className="text-rose-600 text-sm">{formatCurrency(invoice.balanceDue)}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Payment Amount (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              {...register('amount')}
              className="flex-1 text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-bold text-slate-900"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('amount', invoice.balanceDue)}
            >
              Full Balance
            </Button>
          </div>
          {errors.amount && (
            <p className="text-[11px] text-rose-500 mt-1">{(errors.amount as any).message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              {...register('paymentDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('paymentMethod')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
              <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
              <option value="cash">Cash Receipt</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reference / UTR / Transaction # <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('referenceNumber')}
            placeholder="e.g. UTR-HDFC26112401 or UPI/328900411290"
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
          />
          {errors.referenceNumber && (
            <p className="text-[11px] text-rose-500 mt-1">
              {(errors.referenceNumber as any).message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
          <input
            {...register('notes')}
            placeholder="e.g. Settlement of batch testing charges"
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Record Payment Receipt
          </Button>
        </div>
      </form>
    </Modal>
  );
}
