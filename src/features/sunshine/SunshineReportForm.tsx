import { useState, useEffect } from 'react';
import { Save, Download, Eye, Plus, Trash2, Printer, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { SunshineReport, TestParameterRow } from '@/types/sunshine';
import { DEFAULT_DECLARATION, LAB_DETAILS } from '@/types/sunshine';
import { db } from '@/database/db';
import { generateSunshinePdf } from '@/services/sunshinePdfGenerator';
import { SunshineReportModal } from './SunshineReportModal';
import { SUNSHINE_LOGO_BASE64 } from '@/assets/logoBase64';

interface SunshineReportFormProps {
  initialReport?: SunshineReport | null;
  onSaved?: (savedReport: SunshineReport) => void;
  onCancelEdit?: () => void;
}

const COMMON_PARAMETERS = [
  'Oil content',
  'Free Fatty Acid (FFA)',
  'Moisture',
  'Sand / Silica',
  'Protein',
  'Fiber',
  'Acid Value',
];

export function SunshineReportForm({ initialReport, onSaved, onCancelEdit }: SunshineReportFormProps) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<SunshineReport>>({
    reportNo: 'SSAL/KNL-1',
    issuedTo: '',
    buyer: '',
    commodity: 'Rice Bran',
    vehicleNo: '',
    noOfBags: '',
    netWeight: '',
    grossWeight: '',
    sampleCode: '',
    samplePackaging: 'Loose / sealed / Taped',
    sampleDate: getTodayStr(),
    sampleReceiveDate: getTodayStr(),
    reportIssueDate: getTodayStr(),
    declaration: DEFAULT_DECLARATION,
  });

  const [parameters, setParameters] = useState<TestParameterRow[]>([
    {
      id: 'p-1',
      srNo: 1,
      commodity: 'Rice Bran',
      parameterName: 'Oil content',
      result: '16.5',
    },
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // If editing an existing report, populate form
  useEffect(() => {
    if (initialReport) {
      setFormData({
        ...initialReport,
      });
      setParameters(initialReport.parameters || []);
      setIsEditing(true);
    } else {
      // Auto-determine next report number if new
      db.simpleReports
        .toArray()
        .then((all) => {
          if (all && all.length > 0) {
            const count = all.length + 1;
            setFormData((prev) => ({
              ...prev,
              reportNo: `SSAL/KNL-${count}`,
            }));
          }
        })
        .catch(() => {
          // Ignore offline DB initialization errors in mock/test
        });
      setIsEditing(false);
    }
  }, [initialReport]);

  const handleInputChange = (field: keyof SunshineReport, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // If commodity changed, update rows where commodity wasn't explicitly changed
    if (field === 'commodity') {
      setParameters((prev) =>
        prev.map((p) => (p.commodity === formData.commodity || !p.commodity ? { ...p, commodity: value } : p))
      );
    }
  };

  const handleParameterChange = (id: string, field: keyof TestParameterRow, value: string | number) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const addParameterRow = (paramName = '') => {
    const nextSr = parameters.length + 1;
    const newRow: TestParameterRow = {
      id: `param-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      srNo: nextSr,
      commodity: formData.commodity || 'Rice Bran',
      parameterName: paramName || '',
      result: '',
    };
    setParameters((prev) => [...prev, newRow]);
  };

  const removeParameterRow = (id: string) => {
    if (parameters.length <= 1) return;
    setParameters((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      return filtered.map((p, idx) => ({ ...p, srNo: idx + 1 }));
    });
  };

  const buildCurrentReportObject = (): SunshineReport => {
    return {
      id: formData.id || `report-${Date.now()}`,
      reportNo: formData.reportNo?.trim() || `SSAL/KNL-${Date.now()}`,
      issuedTo: formData.issuedTo?.trim() || '',
      buyer: formData.buyer?.trim() || '',
      commodity: formData.commodity?.trim() || 'Rice Bran',
      vehicleNo: formData.vehicleNo?.trim() || '',
      noOfBags: formData.noOfBags?.toString().trim() || '',
      netWeight: formData.netWeight?.trim() || '',
      grossWeight: formData.grossWeight?.trim() || '',
      sampleCode: formData.sampleCode?.trim() || '',
      samplePackaging: formData.samplePackaging?.trim() || 'Loose / sealed / Taped',
      sampleDate: formData.sampleDate || getTodayStr(),
      sampleReceiveDate: formData.sampleReceiveDate || getTodayStr(),
      reportIssueDate: formData.reportIssueDate || getTodayStr(),
      parameters,
      declaration: formData.declaration || DEFAULT_DECLARATION,
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = async () => {
    const report = buildCurrentReportObject();
    try {
      await db.simpleReports.put(report);
      setSaveSuccessMsg(`Report ${report.reportNo} saved successfully!`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      if (onSaved) {
        onSaved(report);
      }
    } catch (err: any) {
      alert(`Could not save report: ${err?.message || err}`);
    }
  };

  const handleDownload = () => {
    const report = buildCurrentReportObject();
    generateSunshinePdf(report, 'download');
  };

  const handlePrint = () => {
    const report = buildCurrentReportObject();
    generateSunshinePdf(report, 'print');
  };

  const handleReset = () => {
    if (window.confirm('Clear all form fields for a new report?')) {
      const resetState = (nextCount: number) => {
        setFormData({
          id: undefined,
          reportNo: `SSAL/KNL-${nextCount}`,
          issuedTo: '',
          buyer: '',
          commodity: 'Rice Bran',
          vehicleNo: '',
          noOfBags: '',
          netWeight: '',
          grossWeight: '',
          sampleCode: '',
          samplePackaging: 'Loose / sealed / Taped',
          sampleDate: getTodayStr(),
          sampleReceiveDate: getTodayStr(),
          reportIssueDate: getTodayStr(),
          declaration: DEFAULT_DECLARATION,
        });
        setParameters([
          {
            id: `p-${Date.now()}`,
            srNo: 1,
            commodity: 'Rice Bran',
            parameterName: 'Oil content',
            result: '',
          },
        ]);
        setIsEditing(false);
        if (onCancelEdit) onCancelEdit();
      };

      db.simpleReports
        .count()
        .then((c) => resetState(c + 1))
        .catch(() => resetState(1));
    }
  };

  const currentReport = buildCurrentReportObject();

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center">
            <img src={SUNSHINE_LOGO_BASE64} alt="Sunshine Logo" className="max-h-12 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {isEditing ? `Editing Report: ${formData.reportNo}` : 'Create Test Report'}
              </h2>
              {isEditing && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  EDIT MODE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill the fields below matching the laboratory document format and click Download or Save.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditing && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold cursor-pointer"
            >
              Cancel Edit
            </button>
          )}

          <button
            onClick={handleReset}
            title="Reset form for new report"
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Eye className="w-4 h-4 text-sky-600" />
            <span>Preview</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Update Report' : 'Save Report'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Form Fields: Mirroring Client Document Layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
            1. Report Header & Sample Particulars
          </h3>
          <span className="text-[11px] font-mono font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded border border-sky-200">
            {formData.reportNo}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
          {/* Issued To / Party */}
          <div className="lg:col-span-2 space-y-1">
            <label className="block font-bold text-slate-700">
              Issued To / Party <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.issuedTo || ''}
              onChange={(e) => handleInputChange('issuedTo', e.target.value)}
              placeholder="e.g. Bhwani Rice Mill (karnal)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-xs font-medium"
            />
          </div>

          {/* Report No */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Report No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reportNo || ''}
              onChange={(e) => handleInputChange('reportNo', e.target.value)}
              placeholder="e.g. SSAL/KNL-1"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-sky-700 focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Buyer / Consignee */}
          <div className="lg:col-span-2 space-y-1">
            <label className="block font-bold text-slate-700">
              Buyer / Consignee
            </label>
            <input
              type="text"
              value={formData.buyer || ''}
              onChange={(e) => handleInputChange('buyer', e.target.value)}
              placeholder="e.g. Ritesh Agro (khanna)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs font-medium"
            />
          </div>

          {/* Commodity / Product */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Commodity / Product <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.commodity || ''}
              onChange={(e) => handleInputChange('commodity', e.target.value)}
              placeholder="e.g. Rice Bran"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs font-semibold text-slate-900"
            />
          </div>

          {/* Vehicle No */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Vehicle no.
            </label>
            <input
              type="text"
              value={formData.vehicleNo || ''}
              onChange={(e) => handleInputChange('vehicleNo', e.target.value)}
              placeholder="e.g. HR06j3546"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 text-xs uppercase"
            />
          </div>

          {/* No Of Bags */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              No Of Bags.
            </label>
            <input
              type="text"
              value={formData.noOfBags || ''}
              onChange={(e) => handleInputChange('noOfBags', e.target.value)}
              placeholder="e.g. 501"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs font-mono"
            />
          </div>

          {/* Code */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Code (Sample Code)
            </label>
            <input
              type="text"
              value={formData.sampleCode || ''}
              onChange={(e) => handleInputChange('sampleCode', e.target.value)}
              placeholder="e.g. 23"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Net weight */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Net weight
            </label>
            <input
              type="text"
              value={formData.netWeight || ''}
              onChange={(e) => handleInputChange('netWeight', e.target.value)}
              placeholder="e.g. 250.50 Qtl"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Gross weight */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Gross weight
            </label>
            <input
              type="text"
              value={formData.grossWeight || ''}
              onChange={(e) => handleInputChange('grossWeight', e.target.value)}
              placeholder="e.g. 350.00 Qtl"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Sample Packaging Condition */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Sample Packaging condition
            </label>
            <input
              type="text"
              value={formData.samplePackaging || ''}
              onChange={(e) => handleInputChange('samplePackaging', e.target.value)}
              placeholder="e.g. Loose / sealed / Taped"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Date of sample */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Date of sample
            </label>
            <input
              type="date"
              value={formData.sampleDate || ''}
              onChange={(e) => handleInputChange('sampleDate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Sample Recive Date */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Sample Recive Date
            </label>
            <input
              type="date"
              value={formData.sampleReceiveDate || ''}
              onChange={(e) => handleInputChange('sampleReceiveDate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs"
            />
          </div>

          {/* Date of report Issue */}
          <div className="space-y-1">
            <label className="block font-bold text-slate-700">
              Date of report Issue
            </label>
            <input
              type="date"
              value={formData.reportIssueDate || ''}
              onChange={(e) => handleInputChange('reportIssueDate', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 text-xs font-semibold text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* 2. Analysis Test & Parameters Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              2. Analysis Test & Parameters Table
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add rows for each test parameter and result percentage
            </p>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Quick Add:</span>
            {COMMON_PARAMETERS.slice(0, 4).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addParameterRow(preset)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 text-[10px] font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse border border-slate-200 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5 border-r border-slate-200 text-center w-16">Sr no</th>
                <th className="p-2.5 border-r border-slate-200 text-left w-1/4">Category / commodity</th>
                <th className="p-2.5 border-r border-slate-200 text-left w-2/5">Test Parameters</th>
                <th className="p-2.5 border-r border-slate-200 text-center w-28">Result (%)</th>
                <th className="p-2.5 text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map((param, index) => (
                <tr key={param.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  {/* Sr no */}
                  <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">
                    {index + 1}
                  </td>

                  {/* Commodity */}
                  <td className="p-2 border-r border-slate-200">
                    <input
                      type="text"
                      value={param.commodity}
                      onChange={(e) => handleParameterChange(param.id, 'commodity', e.target.value)}
                      placeholder="e.g. Rice Bran"
                      className="w-full px-2 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-sky-500 text-xs"
                    />
                  </td>

                  {/* Parameter Name */}
                  <td className="p-2 border-r border-slate-200">
                    <input
                      type="text"
                      value={param.parameterName}
                      onChange={(e) => handleParameterChange(param.id, 'parameterName', e.target.value)}
                      placeholder="e.g. Oil content"
                      className="w-full px-2 py-1.5 rounded border border-slate-200 focus:ring-1 focus:ring-sky-500 text-xs font-semibold"
                    />
                  </td>

                  {/* Result (%) */}
                  <td className="p-2 border-r border-slate-200">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={param.result}
                        onChange={(e) => handleParameterChange(param.id, 'result', e.target.value)}
                        placeholder="16.5"
                        className="w-full px-2 py-1.5 pr-6 rounded border border-slate-200 focus:ring-1 focus:ring-sky-500 text-xs font-bold text-center text-sky-800 bg-sky-50/20"
                      />
                      <span className="absolute right-2 text-[11px] font-bold text-slate-400 pointer-events-none">%</span>
                    </div>
                  </td>

                  {/* Remove Button */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeParameterRow(param.id)}
                      disabled={parameters.length <= 1}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => addParameterRow()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-sky-300 text-sky-700 bg-sky-50/50 hover:bg-sky-50 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Parameter Row</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Total Parameters: {parameters.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Declarations & Footer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
            Declaration & Legal Terms (Editable):
          </label>
          <textarea
            rows={2}
            value={formData.declaration || ''}
            onChange={(e) => handleInputChange('declaration', e.target.value)}
            className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-600 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Authorised Signatory: <strong className="text-slate-800">For SUNSHINE ANALYTICAL LAB.</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Preview Document
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Save Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <SunshineReportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        report={currentReport}
      />
    </div>
  );
}
