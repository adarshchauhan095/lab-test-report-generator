import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { testParameterSchema } from '@/schemas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { TestParameter } from '@/types';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/database/db';

interface ParameterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  parameter?: TestParameter | null;
}

type ParameterFormData = {
  name: string;
  testMethod: string;
  unit: string;
  resultType: 'numeric' | 'text' | 'qualitative';
  defaultCharge: number;
  minLimit?: number | null;
  maxLimit?: number | null;
  status: 'active' | 'inactive';
  remarks?: string;
};

export function ParameterFormModal({
  isOpen,
  onClose,
  onSuccess,
  parameter,
}: ParameterFormModalProps) {
  const { currentUser } = useUser();
  const { success, error } = useToast();

  const isEdit = Boolean(parameter);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ParameterFormData>({
    resolver: zodResolver(testParameterSchema) as any,
    values: parameter
      ? {
          name: parameter.name,
          testMethod: parameter.testMethod,
          unit: parameter.unit,
          resultType: parameter.resultType,
          defaultCharge: parameter.defaultCharge,
          minLimit: parameter.minLimit ?? null,
          maxLimit: parameter.maxLimit ?? null,
          status: parameter.status,
          remarks: parameter.remarks || '',
        }
      : {
          name: '',
          testMethod: 'IS: 7874',
          unit: '%',
          resultType: 'numeric',
          defaultCharge: 250,
          minLimit: null,
          maxLimit: null,
          status: 'active',
          remarks: '',
        },
  });

  const currentResultType = watch('resultType');

  const onSubmit = async (data: ParameterFormData) => {
    try {
      const now = new Date().toISOString();
      if (isEdit && parameter) {
        await db.testParameters.update(parameter.id, {
          ...data,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'PARAMETER_UPDATED',
          entityType: 'TestParameter',
          entityId: parameter.id,
          details: `Updated test parameter ${data.name}`,
          timestamp: now,
        });

        success('Parameter Updated', `${data.name} saved successfully.`);
      } else {
        const id = 'param-' + Date.now();
        await db.testParameters.add({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'PARAMETER_CREATED',
          entityType: 'TestParameter',
          entityId: id,
          details: `Created new test parameter ${data.name}`,
          timestamp: now,
        });

        success('Parameter Created', `${data.name} added successfully.`);
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save parameter', err?.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Test Parameter' : 'Add New Test Parameter'}
      subtitle="Define analytical test specification, standard method, and testing charges"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Parameter Name <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Oil Content, Moisture, Free Fatty Acid"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Standard Test Method <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('testMethod')}
              placeholder="e.g. IS: 7874 (PART-1-1975) or ISO 6492"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.testMethod && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.testMethod.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Measurement Unit <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('unit')}
              placeholder="e.g. %, mg/kg, ppm, g/100g"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.unit && <p className="text-[11px] text-rose-500 mt-1">{errors.unit.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Result Type
            </label>
            <select
              {...register('resultType')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="numeric">Numeric (decimal/number)</option>
              <option value="text">Free Text</option>
              <option value="qualitative">Qualitative (Positive/Negative)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Testing Charge (₹)
            </label>
            <input
              {...register('defaultCharge')}
              type="number"
              step="any"
              placeholder="250.00"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>
        </div>

        {currentResultType === 'numeric' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Acceptable Min Limit (Optional)
              </label>
              <input
                {...register('minLimit')}
                type="number"
                step="any"
                placeholder="e.g. 1.50"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Acceptable Max Limit (Optional)
              </label>
              <input
                {...register('maxLimit')}
                type="number"
                step="any"
                placeholder="e.g. 15.00"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Method Notes / Standard Remarks
          </label>
          <input
            {...register('remarks')}
            placeholder="e.g. Soxhlet Extraction, Kjeldahl Method, Oven Drying"
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Parameter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
