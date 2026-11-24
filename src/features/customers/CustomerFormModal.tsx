import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '@/schemas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { Customer } from '@/types';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/database/db';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
}

type CustomerFormData = {
  name: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  mobile: string;
  email: string;
  gstin?: string;
  openingBalance: number;
  notes?: string;
  status: 'active' | 'archived';
};

export function CustomerFormModal({ isOpen, onClose, onSuccess, customer }: CustomerFormModalProps) {
  const { currentUser } = useUser();
  const { success, error } = useToast();

  const isEdit = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as any,
    values: customer
      ? {
          name: customer.name,
          companyName: customer.companyName,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          mobile: customer.mobile,
          email: customer.email || '',
          gstin: customer.gstin || '',
          openingBalance: customer.openingBalance || 0,
          notes: customer.notes || '',
          status: customer.status,
        }
      : {
          name: '',
          companyName: '',
          address: '',
          city: '',
          state: 'Haryana',
          mobile: '',
          email: '',
          gstin: '',
          openingBalance: 0,
          notes: '',
          status: 'active',
        },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const now = new Date().toISOString();
      if (isEdit && customer) {
        await db.customers.update(customer.id, {
          ...data,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'CUSTOMER_UPDATED',
          entityType: 'Customer',
          entityId: customer.id,
          details: `Updated details for customer ${data.name} (${data.companyName})`,
          timestamp: now,
        });

        success('Customer Updated', `${data.name} details have been updated successfully.`);
      } else {
        const id = 'cust-' + Date.now();
        const count = await db.customers.count();
        const customerCode = `CUST-${String(count + 1).padStart(3, '0')}`;

        await db.customers.add({
          ...data,
          id,
          customerCode,
          createdAt: now,
          updatedAt: now,
          createdBy: currentUser.fullName,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'CUSTOMER_CREATED',
          entityType: 'Customer',
          entityId: id,
          details: `Created new customer ${data.name} with code ${customerCode}`,
          timestamp: now,
        });

        success('Customer Created', `Customer ${data.name} added with code ${customerCode}.`);
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save customer', err?.message || 'An error occurred while saving.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Customer / Party' : 'Add New Customer / Party'}
      subtitle="Enter client contact, billing details, and location"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact / Authorized Person Name <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Rahul Singhal"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company / Firm Name <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('companyName')}
              placeholder="e.g. NAMAN INDUSTRIES"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.companyName && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.companyName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('mobile')}
              placeholder="e.g. 9812012345"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.mobile && <p className="text-[11px] text-rose-500 mt-1">{errors.mobile.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="e.g. accounts@naman.com"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Street Address <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('address')}
            placeholder="e.g. Near Old Grain Market, Taraori"
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
          {errors.address && <p className="text-[11px] text-rose-500 mt-1">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              City <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('city')}
              placeholder="e.g. Karnal"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.city && <p className="text-[11px] text-rose-500 mt-1">{errors.city.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              State <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('state')}
              placeholder="e.g. Haryana"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.state && <p className="text-[11px] text-rose-500 mt-1">{errors.state.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN (Optional)</label>
            <input
              {...register('gstin')}
              placeholder="e.g. 06AABCN1234D1Z2"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
            <input
              {...register('openingBalance')}
              type="number"
              step="any"
              placeholder="0.00"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.openingBalance && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.openingBalance.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Special instructions, credit terms, key contacts..."
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
