import { useFieldArray, type Control, type UseFormSetValue, type UseFormWatch } from 'react-hook-form';
import { Button } from '@/components/common/Button';
import type { Commodity, TestParameter } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Plus, Trash2, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface CommoditySectionProps {
  nestIndex: number;
  control: Control<any>;
  register: any;
  errors: any;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  commodities: Commodity[];
  allParameters: TestParameter[];
  onRemoveSection: () => void;
  canRemove: boolean;
}

export function CommoditySection({
  nestIndex,
  control,
  register,
  errors,
  setValue,
  watch,
  commodities,
  allParameters,
  onRemoveSection,
  canRemove,
}: CommoditySectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `commodities.${nestIndex}.testResults`,
  });

  const sectionPrefix = `commodities.${nestIndex}`;
  const currentCommodityId = watch(`${sectionPrefix}.commodityId`);
  const currentTestResults = watch(`${sectionPrefix}.testResults`) || [];

  // Calculate commodity subtotal dynamically
  const commoditySubtotal = currentTestResults.reduce(
    (sum: number, res: any) => sum + (parseFloat(res.charge) || 0),
    0
  );

  // Update commodity subtotal in form state
  const handleChargeChange = () => {
    setValue(`${sectionPrefix}.commoditySubtotal`, commoditySubtotal);
  };

  const handleCommoditySelect = (commId: string) => {
    const selectedComm = commodities.find((c) => c.id === commId);
    if (!selectedComm) return;

    setValue(`${sectionPrefix}.commodityId`, selectedComm.id);
    setValue(`${sectionPrefix}.commodityName`, selectedComm.name);

    // If test results are empty or only default, populate from commodity defaults
    if (selectedComm.defaultParameterIds && selectedComm.defaultParameterIds.length > 0) {
      const defaultParams = allParameters.filter((p) =>
        selectedComm.defaultParameterIds.includes(p.id)
      );

      // Map to report test results
      const newResults = defaultParams.map((p) => ({
        id: 'res-' + Math.random().toString(36).substring(2, 9),
        parameterId: p.id,
        parameterName: p.name,
        testMethod: p.testMethod,
        unit: p.unit,
        resultValue: '',
        resultType: p.resultType,
        charge: p.defaultCharge,
        minLimit: p.minLimit ?? null,
        maxLimit: p.maxLimit ?? null,
        status: 'CONFORMS',
        remarks: p.remarks || '',
      }));

      setValue(`${sectionPrefix}.testResults`, newResults);
      const newSubtotal = newResults.reduce((sum, r) => sum + (r.charge || 0), 0);
      setValue(`${sectionPrefix}.commoditySubtotal`, newSubtotal);
    }
  };

  const handleAddParameter = (paramId?: string) => {
    if (paramId) {
      const param = allParameters.find((p) => p.id === paramId);
      if (param) {
        append({
          id: 'res-' + Math.random().toString(36).substring(2, 9),
          parameterId: param.id,
          parameterName: param.name,
          testMethod: param.testMethod,
          unit: param.unit,
          resultValue: '',
          resultType: param.resultType,
          charge: param.defaultCharge,
          minLimit: param.minLimit ?? null,
          maxLimit: param.maxLimit ?? null,
          status: 'CONFORMS',
          remarks: param.remarks || '',
        });
        return;
      }
    }

    // Custom parameter
    append({
      id: 'res-' + Math.random().toString(36).substring(2, 9),
      parameterId: 'custom-' + Date.now(),
      parameterName: '',
      testMethod: 'IS / In-House',
      unit: '%',
      resultValue: '',
      resultType: 'numeric',
      charge: 200,
      minLimit: null,
      maxLimit: null,
      status: 'CONFORMS',
      remarks: '',
    });
  };

  const sectionErrors = errors?.commodities?.[nestIndex];

  return (
    <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden transition-all">
      {/* Section Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-100/90 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-sky-600 text-white rounded-md">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Commodity #{nestIndex + 1}: {watch(`${sectionPrefix}.commodityName`) || 'Unspecified'}
            </h3>
            <p className="text-[10px] text-slate-500">
              Independent sample details, analytical parameters & testing rates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
            Subtotal: <strong className="text-sky-700 font-bold">{formatCurrency(commoditySubtotal)}</strong>
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemoveSection}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              title="Remove this entire commodity section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Commodity & Sample Spec Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Commodity <span className="text-rose-500">*</span>
            </label>
            <select
              {...register(`${sectionPrefix}.commodityId`)}
              value={currentCommodityId || ''}
              onChange={(e) => handleCommoditySelect(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="">-- Choose Commodity --</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category})
                </option>
              ))}
            </select>
            {sectionErrors?.commodityId && (
              <p className="text-[11px] text-rose-500 mt-1">{sectionErrors.commodityId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sample Code <span className="text-rose-500">*</span>
            </label>
            <input
              {...register(`${sectionPrefix}.sampleCode`)}
              placeholder="e.g. ATS-RB-2026-0924"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
            />
            {sectionErrors?.sampleCode && (
              <p className="text-[11px] text-rose-500 mt-1">{sectionErrors.sampleCode.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sample Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              {...register(`${sectionPrefix}.sampleDate`)}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Bags</label>
            <input
              type="number"
              {...register(`${sectionPrefix}.numberOfBags`)}
              placeholder="e.g. 200"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantity Per Sample <span className="text-rose-500">*</span>
            </label>
            <input
              {...register(`${sectionPrefix}.quantityPerSample`)}
              placeholder="e.g. 100 GM Approx"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Net Weight</label>
            <input
              {...register(`${sectionPrefix}.netWeight`)}
              placeholder="e.g. 10.2 MT Approx"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Gross Weight</label>
            <input
              {...register(`${sectionPrefix}.grossWeight`)}
              placeholder="e.g. 10.4 MT Approx"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Mark</label>
            <input
              {...register(`${sectionPrefix}.sampleMark`)}
              placeholder="e.g. LOT-A1 / 200 BAGS or Brand Mark"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Description</label>
            <input
              {...register(`${sectionPrefix}.sampleDescription`)}
              placeholder="e.g. Fresh Golden Brown Rice Bran Sample"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>
        </div>

        {/* Test Parameters Sub-Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Analytical Test Parameters & Results ({fields.length})
            </span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddParameter(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs px-2.5 py-1 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
              >
                <option value="">+ Add Existing Parameter...</option>
                {allParameters
                  .filter((p) => p.status === 'active')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.testMethod}) - ₹{p.defaultCharge}
                    </option>
                  ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddParameter()}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Param</span>
              </Button>
            </div>
          </div>

          {fields.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
              No test parameters added yet. Select a commodity or click "+ Add Existing Parameter".
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[160px]">Test Parameter</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Test Method</th>
                    <th className="py-2.5 px-3 w-16">Unit</th>
                    <th className="py-2.5 px-3 min-w-[110px]">
                      Test Result <span className="text-rose-500">*</span>
                    </th>
                    <th className="py-2.5 px-3 min-w-[110px]">Conformance</th>
                    <th className="py-2.5 px-3 w-24 text-right">Charge (₹)</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Remarks</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((field, pIndex) => {
                    const rowPrefix = `${sectionPrefix}.testResults.${pIndex}`;
                    const resError = sectionErrors?.testResults?.[pIndex];
                    return (
                      <tr key={field.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <input
                            {...register(`${rowPrefix}.parameterName`)}
                            placeholder="Parameter Name"
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-slate-300 font-medium text-slate-900"
                          />
                          {resError?.parameterName && (
                            <p className="text-[10px] text-rose-500 mt-0.5">{resError.parameterName.message}</p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            {...register(`${rowPrefix}.testMethod`)}
                            placeholder="Method (e.g. IS: 7874)"
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-slate-300 font-mono text-[11px]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            {...register(`${rowPrefix}.unit`)}
                            placeholder="%"
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-slate-300 font-mono text-center"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            {...register(`${rowPrefix}.resultValue`)}
                            placeholder="e.g. 2.46"
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-sky-400 bg-sky-50/30 font-bold text-sky-900"
                          />
                          {resError?.resultValue && (
                            <p className="text-[10px] text-rose-500 mt-0.5">{resError.resultValue.message}</p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            {...register(`${rowPrefix}.status`)}
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-slate-300 bg-white"
                          >
                            <option value="CONFORMS">CONFORMS</option>
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                            <option value="N/A">N/A</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            {...register(`${rowPrefix}.charge`, {
                              onChange: handleChargeChange,
                            })}
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-slate-300 text-right font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            {...register(`${rowPrefix}.remarks`)}
                            placeholder="Acceptable solvent recovery"
                            className="w-full text-xs px-2 py-1 border rounded focus:ring-1 focus:ring-sky-500 border-slate-300 text-slate-500"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              remove(pIndex);
                              handleChargeChange();
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            title="Remove parameter"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
