import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema } from '@/schemas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { User, UserRole } from '@/types';
import { db } from '@/database/db';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

export function UserFormModal({ isOpen, onClose, onSuccess, user }: UserFormModalProps) {
  const { currentUser, refreshUsers } = useUser();
  const { success, error } = useToast();

  const isEdit = Boolean(user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(userSchema),
    values: user
      ? {
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          mobile: user.mobile,
          email: user.email,
          status: user.status,
        }
      : {
          fullName: '',
          username: '',
          role: 'lab_operator' as UserRole,
          mobile: '',
          email: '',
          status: 'active',
        },
  });

  const onSubmit = async (data: any) => {
    try {
      const now = new Date().toISOString();
      if (isEdit && user) {
        await db.users.update(user.id, {
          ...data,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'USER_UPDATED',
          entityType: 'User',
          entityId: user.id,
          details: `Updated user ${data.fullName} (${data.role})`,
          timestamp: now,
        });

        success('User Updated', `${data.fullName} profile updated successfully.`);
      } else {
        const id = 'user-' + Date.now();
        await db.users.add({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'USER_CREATED',
          entityType: 'User',
          entityId: id,
          details: `Created new user ${data.fullName} with role ${data.role}`,
          timestamp: now,
        });

        success('User Created', `User ${data.fullName} has been added.`);
      }

      await refreshUsers();
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save user', err?.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit User Profile' : 'Add New User'}
      subtitle="Configure staff identity, operational role, and system access"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('fullName')}
            placeholder="e.g. Ramesh Kumar"
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
          {errors.fullName && (
            <p className="text-[11px] text-rose-500 mt-1">{(errors.fullName as any).message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('username')}
              placeholder="e.g. ramesh.lab"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
            />
            {errors.username && (
              <p className="text-[11px] text-rose-500 mt-1">{(errors.username as any).message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role / Permission <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('role')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="admin">Administrator (Full Control)</option>
              <option value="lab_operator">Laboratory Operator (Testing)</option>
              <option value="billing_operator">Billing Operator (Invoicing)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('mobile')}
              placeholder="e.g. 9812345678"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.mobile && (
              <p className="text-[11px] text-rose-500 mt-1">{(errors.mobile as any).message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="e.g. ramesh@alphatesting.org"
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
          {errors.email && (
            <p className="text-[11px] text-rose-500 mt-1">{(errors.email as any).message}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
