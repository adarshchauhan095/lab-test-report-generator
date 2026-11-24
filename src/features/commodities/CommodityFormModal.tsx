import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { commoditySchema } from '@/schemas';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import type { Commodity, TestParameter } from '@/types';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { db } from '@/database/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface CommodityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  commodity?: Commodity | null;
}

type CommodityFormData = {
  name: string;
  category: string;
  description?: string;
  defaultUnit: string;
  defaultTaxRate: number;
  status: 'active' | 'inactive';
  defaultParameterIds: string[];
};

export function CommodityFormModal({
  isOpen,
  onClose,
  onSuccess,
  commodity,
}: CommodityFormModalProps) {
  const { currentUser } = useUser();
  const { success, error } = useToast();

  const isEdit = Boolean(commodity);
  const parameters = useLiveQuery(() => db.testParameters.toArray(), []) || [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommodityFormData>({
    resolver: zodResolver(commoditySchema) as any,
    values: commodity
      ? {
          name: commodity.name,
          category: commodity.category,
          description: commodity.description || '',
          defaultUnit: commodity.defaultUnit,
          defaultTaxRate: commodity.defaultTaxRate,
          status: commodity.status,
          defaultParameterIds: commodity.defaultParameterIds || [],
        }
      : {
          name: '',
          category: 'Agro By-Products',
          description: '',
          defaultUnit: 'Bags',
          defaultTaxRate: 5,
          status: 'active',
          defaultParameterIds: [],
        },
  });

  const selectedParamIds = watch('defaultParameterIds') || [];

  const toggleParam = (paramId: string) => {
    if (selectedParamIds.includes(paramId)) {
      setValue(
        'defaultParameterIds',
        selectedParamIds.filter((id) => id !== paramId)
      );
    } else {
      setValue('defaultParameterIds', [...selectedParamIds, paramId]);
    }
  };

  const onSubmit = async (data: CommodityFormData) => {
    try {
      const now = new Date().toISOString();
      const cleanData = {
        ...data,
        description: data.description || '',
      };
      if (isEdit && commodity) {
        await db.commodities.update(commodity.id, {
          ...cleanData,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'COMMODITY_UPDATED',
          entityType: 'Commodity',
          entityId: commodity.id,
          details: `Updated commodity ${data.name}`,
          timestamp: now,
        });

        success('Commodity Updated', `${data.name} configuration saved successfully.`);
      } else {
        const id = 'comm-' + Date.now();
        await db.commodities.add({
          ...cleanData,
          id,
          createdAt: now,
          updatedAt: now,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: 'COMMODITY_CREATED',
          entityType: 'Commodity',
          entityId: id,
          details: `Created new commodity ${data.name}`,
          timestamp: now,
        });

        success('Commodity Created', `${data.name} created successfully.`);
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to save commodity', err?.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Commodity' : 'Add New Commodity'}
      subtitle="Configure testing pricing, measurement unit and default parameters"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Commodity Name <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Rice Bran, Mustard, Wheat"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('category')}
              placeholder="e.g. Agro By-Products, Oilseeds, Cereals"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.category && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.category.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Billing Unit <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('defaultUnit')}
              placeholder="e.g. Bags, MT, Sample, KG"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
            {errors.defaultUnit && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.defaultUnit.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Tax / GST Rate (%)
            </label>
            <input
              {...register('defaultTaxRate')}
              type="number"
              step="any"
              placeholder="5"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Standard grades, extraction methods, handling notes..."
            className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        {/* Default Parameters Assignment */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Assign Default Test Parameters
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-lg">
            {parameters.map((param) => {
              const isChecked = selectedParamIds.includes(param.id);
              return (
                <label
                  key={param.id}
                  onClick={() => toggleParam(param.id)}
                  className={`flex items-start gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-sky-50 border-sky-300 text-sky-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <div>
                    <p className="font-semibold">{param.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {param.testMethod} • ₹{param.defaultCharge}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            These parameters will be automatically pre-filled when this commodity is selected in a test report.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Commodity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
