import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { reportFormSchema } from '@/schemas';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { CommoditySection } from './CommoditySection';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { calculateBilling } from '@/services/billingEngine';
import { formatCurrency, getTodayDateString } from '@/utils/formatters';
import type { Report, ReportCommodityItem } from '@/types';
import {
  FileText,
  Save,
  CheckCircle,
  Plus,
  ArrowLeft,
  Calculator,
  Building2,
  FileCheck2,
} from 'lucide-react';

export function ReportForm() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get('duplicateFrom');
  const preselectedCustomerId = searchParams.get('customerId');

  const navigate = useNavigate();
  const { currentUser, can } = useUser();
  const { success, error } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const commodities = useLiveQuery(() => db.commodities.toArray(), []) || [];
  const allParameters = useLiveQuery(() => db.testParameters.toArray(), []) || [];
  const reportSettings = useLiveQuery(() => db.reportSettings.get('default'), []);
  const billingSettings = useLiveQuery(() => db.billingSettings.get('default'), []);

  const [existingReport, setExistingReport] = useState<Report | null>(null);
  const isEdit = Boolean(id);

  // Form setup
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportNumber: '',
      jobCardNumber: '',
      customerId: '',
      customerName: '',
      partyName: '',
      buyerConsignee: '',
      reportDate: getTodayDateString(),
      issueDate: getTodayDateString(),
      sampleReceivedDate: getTodayDateString(),
      analysisStartDate: getTodayDateString(),
      analysisEndDate: getTodayDateString(),
      samplingType: 'Customer Submitted',
      samplePackingCondition: 'Sealed Polythene Pack',
      sampleType: 'Agricultural Commodity',
      vehicleNumber: '',
      status: 'draft',
      remarks: '',
      financials: {
        testingCharges: 0,
        additionalCharges: 0,
        discountAmount: 0,
        taxRate: 18,
        taxAmount: 0,
        grandTotal: 0,
      },
      commodities: [
        {
          id: 'comm-' + Date.now(),
          commodityId: '',
          commodityName: '',
          sampleCode: 'ATS-SAMPLE-01',
          sampleDescription: '',
          sampleMark: '',
          numberOfBags: 100,
          quantityPerSample: '100 GM Approx',
          netWeight: '',
          grossWeight: '',
          sampleDate: getTodayDateString(),
          testResults: [],
          commoditySubtotal: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'commodities',
  });

  // Load existing or duplicate data
  useEffect(() => {
    const targetId = id || duplicateFromId;
    if (targetId) {
      db.reports.get(targetId).then((rep) => {
        if (rep) {
          setExistingReport(rep);
          if (duplicateFromId) {
            // New report duplicated from previous
            const nextSeq = reportSettings?.nextReportSequence || 10280;
            const prefix = reportSettings?.reportNumberPrefix || 'ATS/KNL/RB/A-';
            reset({
              ...rep,
              id: undefined,
              reportNumber: `${prefix}${nextSeq}`,
              jobCardNumber: `${prefix}${nextSeq}`,
              reportDate: getTodayDateString(),
              issueDate: getTodayDateString(),
              status: 'draft',
              invoiceId: null,
              revisionNumber: 0,
              revisionReason: null,
            });
          } else {
            // Edit existing
            reset(rep);
          }
        }
      });
    } else if (reportSettings && !isEdit) {
      // New report code generation
      const nextSeq = reportSettings.nextReportSequence || 10280;
      const prefix = reportSettings.reportNumberPrefix || 'ATS/KNL/RB/A-';
      setValue('reportNumber', `${prefix}${nextSeq}`);
      setValue('jobCardNumber', `${prefix}${nextSeq}`);

      if (billingSettings) {
        setValue('financials.taxRate', billingSettings.defaultTaxRate);
      }

      if (preselectedCustomerId && customers.length > 0) {
        const c = customers.find((cust) => cust.id === preselectedCustomerId);
        if (c) {
          setValue('customerId', c.id);
          setValue('customerName', c.name);
          setValue('partyName', `${c.companyName}, ${c.city}`);
        }
      }
    }
  }, [id, duplicateFromId, reportSettings, billingSettings, customers, preselectedCustomerId, reset, setValue, isEdit]);

  // Handle customer selection change
  const handleCustomerChange = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setValue('customerId', cust.id);
      setValue('customerName', cust.name);
      setValue('partyName', `${cust.companyName}, ${cust.city}`);
      if (!watch('buyerConsignee')) {
        setValue('buyerConsignee', `${cust.companyName}`);
      }
    }
  };

  // Watch dynamic commodity subtotals and financials inputs
  const watchedCommodities = watch('commodities') || [];
  const additionalCharges = watch('financials.additionalCharges') || 0;
  const discountAmount = watch('financials.discountAmount') || 0;
  const taxRate = watch('financials.taxRate') || 0;

  // Compute overall totals
  const totalTestingCharges = useMemo(() => {
    return watchedCommodities.reduce((sum: number, comm: any) => {
      const results = comm?.testResults || [];
      const commSum = results.reduce(
        (pSum: number, r: any) => pSum + (parseFloat(r.charge) || 0),
        0
      );
      return sum + commSum;
    }, 0);
  }, [watchedCommodities]);

  const billingCalculations = useMemo(() => {
    return calculateBilling({
      testingCharges: totalTestingCharges,
      additionalCharges: parseFloat(additionalCharges) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      taxRate: parseFloat(taxRate) || 0,
    });
  }, [totalTestingCharges, additionalCharges, discountAmount, taxRate]);

  // Keep form financials updated
  useEffect(() => {
    setValue('financials.testingCharges', billingCalculations.testingCharges);
    setValue('financials.taxAmount', billingCalculations.taxAmount);
    setValue('financials.grandTotal', billingCalculations.grandTotal);
  }, [billingCalculations, setValue]);

  const handleAddCommoditySection = () => {
    append({
      id: 'comm-' + Date.now(),
      commodityId: '',
      commodityName: '',
      sampleCode: `ATS-SAMPLE-${String(fields.length + 1).padStart(2, '0')}`,
      sampleDescription: '',
      sampleMark: '',
      numberOfBags: 100,
      quantityPerSample: '100 GM Approx',
      netWeight: '',
      grossWeight: '',
      sampleDate: getTodayDateString(),
      testResults: [],
      commoditySubtotal: 0,
    });
  };

  const saveReport = async (formData: any, finalize: boolean, revReason?: string) => {
    try {
      setIsSubmitting(true);
      const now = new Date().toISOString();
      const reportStatus = finalize ? 'finalized' : 'draft';

      const financialsData = {
        testingCharges: billingCalculations.testingCharges,
        additionalCharges: billingCalculations.additionalCharges,
        discountAmount: billingCalculations.discountAmount,
        taxRate: billingCalculations.taxRate,
        taxAmount: billingCalculations.taxAmount,
        grandTotal: billingCalculations.grandTotal,
      };

      if (isEdit && existingReport) {
        // If it was already finalized and being edited, create a revision snapshot
        if (existingReport.status === 'finalized') {
          const revNum = (existingReport.revisionNumber || 0) + 1;
          await db.reportRevisions.add({
            id: 'rev-' + Date.now(),
            reportId: existingReport.id,
            revisionNumber: revNum,
            revisionDate: now,
            revisedBy: currentUser.fullName,
            reason: revReason || 'Report updated with formal revision',
            snapshot: existingReport,
          });

          formData.revisionNumber = revNum;
          formData.revisionReason = revReason;
        }

        await db.reports.update(existingReport.id, {
          ...formData,
          status: reportStatus,
          financials: financialsData,
          updatedAt: now,
          updatedBy: currentUser.fullName,
        });

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: finalize ? 'REPORT_FINALIZED' : 'REPORT_UPDATED',
          entityType: 'Report',
          entityId: existingReport.id,
          details: `${finalize ? 'Finalized' : 'Updated'} report ${formData.reportNumber}`,
          timestamp: now,
        });

        success(
          finalize ? 'Report Finalized' : 'Draft Saved',
          `Report ${formData.reportNumber} has been ${finalize ? 'finalized' : 'saved'}.`
        );
      } else {
        // New report
        const newId = 'rep-' + Date.now();
        await db.reports.add({
          ...formData,
          id: newId,
          status: reportStatus,
          financials: financialsData,
          revisionNumber: 0,
          createdAt: now,
          updatedAt: now,
          createdBy: currentUser.fullName,
          updatedBy: currentUser.fullName,
        });

        // Increment sequence in settings
        if (reportSettings) {
          await db.reportSettings.update('default', {
            nextReportSequence: (reportSettings.nextReportSequence || 10280) + 1,
          });
        }

        await db.activityLogs.add({
          id: 'log-' + Date.now(),
          userId: currentUser.id,
          userName: currentUser.fullName,
          action: finalize ? 'REPORT_CREATED_FINAL' : 'REPORT_CREATED_DRAFT',
          entityType: 'Report',
          entityId: newId,
          details: `Created report ${formData.reportNumber} (${reportStatus})`,
          timestamp: now,
        });

        success(
          finalize ? 'Report Created & Finalized' : 'Draft Created',
          `Report ${formData.reportNumber} saved successfully.`
        );
      }

      navigate('/reports');
    } catch (err: any) {
      error('Failed to save report', err?.message || 'Check form fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onFormSubmit = (data: any) => {
    // If modifying an already finalized report, prompt for revision reason
    if (existingReport && existingReport.status === 'finalized') {
      setRevisionModalOpen(true);
      return;
    }
    saveReport(data, false);
  };

  const handleFinalizeClick = () => {
    handleSubmit((data) => {
      if (existingReport && existingReport.status === 'finalized') {
        setRevisionModalOpen(true);
        return;
      }
      saveReport(data, true);
    })();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/reports')}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isEdit ? `Edit Report (${watch('reportNumber')})` : 'Create Laboratory Test Report'}
              </h1>
              <Badge variant={watch('status') === 'finalized' ? 'success' : 'warning'}>
                {watch('status')}
              </Badge>
              {existingReport?.revisionNumber ? (
                <Badge variant="purple">Rev #{existingReport.revisionNumber}</Badge>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multi-commodity sample testing report with automatic ISO/IS method binding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            isLoading={isSubmitting}
            disabled={!can('create_report')}
          >
            <Save className="w-4 h-4" />
            <span>Save as Draft</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleFinalizeClick}
            isLoading={isSubmitting}
            disabled={!can('finalize_report')}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Finalize & Issue Report</span>
          </Button>
        </div>
      </div>

      {/* Report Header Information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
          <Building2 className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Report Header & Client Consignment Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Number <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('reportNumber')}
              placeholder="e.g. ATS/KNL/RB/A-10275"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono font-bold text-sky-900 bg-sky-50/30"
            />
            {errors.reportNumber && (
              <p className="text-[11px] text-rose-500 mt-1">{(errors.reportNumber as any).message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Card Number <span className="text-rose-500">*</span>
            </label>
            <input
              {...register('jobCardNumber')}
              placeholder="e.g. ATS/KNL/RB/A-10275"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
            />
            {errors.jobCardNumber && (
              <p className="text-[11px] text-rose-500 mt-1">{(errors.jobCardNumber as any).message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer / Issued To <span className="text-rose-500">*</span>
            </label>
            <select
              {...register('customerId')}
              value={watch('customerId') || ''}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="">-- Select Registered Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} ({c.name})
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-[11px] text-rose-500 mt-1">{(errors.customerId as any).message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Party / Issued To (Display)</label>
            <input
              {...register('partyName')}
              placeholder="e.g. Naman Industries, Taraori"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer / Consignee</label>
            <input
              {...register('buyerConsignee')}
              placeholder="e.g. Self / Processing Plant"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle / Transport #</label>
            <input
              {...register('vehicleNumber')}
              placeholder="e.g. HR-45-B-8971"
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Date</label>
            <input
              type="date"
              {...register('reportDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
            <input
              type="date"
              {...register('issueDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>
        </div>

        {/* Sample Handling Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sampling Type</label>
            <select
              {...register('samplingType')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="Customer Submitted">Customer Submitted</option>
              <option value="Laboratory Collected">Laboratory Collected</option>
              <option value="Third Party Collected">Third Party Collected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Packing Condition</label>
            <select
              {...register('samplePackingCondition')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="Sealed Polythene Pack">Sealed Polythene Pack</option>
              <option value="Sealed Jute Bag">Sealed Jute Bag</option>
              <option value="Loose Sample">Loose Sample</option>
              <option value="Sealed HDPE Bottle">Sealed HDPE Bottle</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Analysis Start Date</label>
            <input
              type="date"
              {...register('analysisStartDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Analysis End Date</label>
            <input
              type="date"
              {...register('analysisEndDate')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* DYNAMIC MULTI-COMMODITY SECTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Commodity Analysis Sections ({fields.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Each commodity maintains independent parameters, sample weight, codes, and subtotals
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCommoditySection}
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>Add Another Commodity</span>
          </Button>
        </div>

        {fields.map((field, index) => (
          <CommoditySection
            key={field.id}
            nestIndex={index}
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            commodities={commodities}
            allParameters={allParameters}
            onRemoveSection={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      {/* Billing & Calculation Engine Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
          <Calculator className="w-4 h-4 text-sky-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Billing & Dynamic Charges Calculation
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Service Charges (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('financials.additionalCharges')}
                  placeholder="0.00"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  {...register('financials.discountAmount')}
                  placeholder="0.00"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax / GST Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  {...register('financials.taxRate')}
                  placeholder="18"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Laboratory Remarks / Findings Declaration
              </label>
              <textarea
                {...register('remarks')}
                rows={2}
                placeholder="The sample conforms to commercial grade solvent extraction standards..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-2 border-b border-slate-200">
              Calculation Summary
            </h3>
            <div className="flex justify-between text-slate-600">
              <span>Total Commodity Testing Charges:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(billingCalculations.testingCharges)}
              </span>
            </div>
            {billingCalculations.additionalCharges > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Additional Service Charges:</span>
                <span className="font-semibold text-slate-800">
                  + {formatCurrency(billingCalculations.additionalCharges)}
                </span>
              </div>
            )}
            {billingCalculations.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount Applied:</span>
                <span className="font-semibold">
                  - {formatCurrency(billingCalculations.discountAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-700 font-medium pt-1 border-t border-slate-200">
              <span>Taxable Value:</span>
              <span>{formatCurrency(billingCalculations.taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST ({billingCalculations.taxRate}%):</span>
              <span className="font-semibold text-slate-800">
                + {formatCurrency(billingCalculations.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-slate-900 text-sm font-bold pt-2 border-t-2 border-slate-300">
              <span>Estimated Grand Total:</span>
              <span className="text-sky-700 text-base">
                {formatCurrency(billingCalculations.grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Revision Dialog for Finalized Reports */}
      {revisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Formal Report Revision Workflow</h3>
            <p className="text-xs text-slate-500 mt-1">
              This report has already been finalized. Laboratory compliance requires documenting the reason for revision. A historical snapshot will be archived.
            </p>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Revision <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Moisture re-tested on client request; vehicle number correction..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevisionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={!revisionReason.trim()}
                onClick={() => {
                  setRevisionModalOpen(false);
                  saveReport(watch(), true, revisionReason);
                }}
              >
                Confirm & Issue Revision
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
