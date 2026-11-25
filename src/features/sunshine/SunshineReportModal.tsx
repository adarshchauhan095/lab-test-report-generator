import { useRef } from 'react';
import { Download, Printer, X, FileText } from 'lucide-react';
import type { SunshineReport } from '@/types/sunshine';
import { generateSunshinePdf } from '@/services/sunshinePdfGenerator';
import { LAB_DETAILS } from '@/types/sunshine';
import { SUNSHINE_LOGO_BASE64 } from '@/assets/logoBase64';

interface SunshineReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: SunshineReport | null;
}

export function SunshineReportModal({ isOpen, onClose, report }: SunshineReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  const handlePrint = () => {
    generateSunshinePdf(report, 'print');
  };

  const handleDownload = () => {
    generateSunshinePdf(report, 'download');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Toolbar */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold tracking-tight">Test Report Preview</h2>
              <p className="text-[11px] text-slate-400 font-mono">{report.reportNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content - High-Fidelity Paper Simulation inside a clean scroll view */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-200/70">
          <div
            ref={printRef}
            className="mx-auto w-full max-w-3xl bg-white p-6 sm:p-10 md:p-12 shadow-xl border border-slate-300 rounded-sm font-sans text-slate-800 space-y-6"
          >
            {/* Header with Logo & Lab Details */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-800">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                <img
                  src={SUNSHINE_LOGO_BASE64}
                  alt="Sunshine Logo"
                  className="max-h-20 max-w-full object-contain"
                />
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                  {LAB_DETAILS.name}
                </h1>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {LAB_DETAILS.tagline}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {LAB_DETAILS.address}
                </p>
                <p className="text-[11px] font-bold text-slate-700 mt-1">
                  Phone: <span className="font-semibold text-slate-900">{LAB_DETAILS.phone}</span>
                  <span className="mx-2">|</span>
                  Email: <span className="font-semibold text-sky-700">{LAB_DETAILS.email}</span>
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-3">
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline decoration-slate-400 underline-offset-4">
                Test Report
              </h2>
            </div>

            {/* 13 Fields Excel-Style Bordered Grid */}
            <div className="border border-slate-300 rounded-sm overflow-hidden text-xs">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-2/5 p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Issued To / Party
                    </td>
                    <td className="w-3/5 p-2 font-semibold text-slate-900">
                      {report.issuedTo || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Buyer / Consignee
                    </td>
                    <td className="p-2 font-semibold text-slate-900">
                      {report.buyer || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Report No
                    </td>
                    <td className="p-2 font-mono font-bold text-sky-700">
                      {report.reportNo || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Commodity / Product
                    </td>
                    <td className="p-2 font-semibold text-slate-900">
                      {report.commodity || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Vehicle no.
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-900">
                      {report.vehicleNo || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      No Of Bags.
                    </td>
                    <td className="p-2 text-slate-900">
                      {report.noOfBags || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Net weight
                    </td>
                    <td className="p-2 text-slate-900">
                      {report.netWeight || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Gross weight
                    </td>
                    <td className="p-2 text-slate-900">
                      {report.grossWeight || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Code
                    </td>
                    <td className="p-2 font-mono text-slate-900">
                      {report.sampleCode || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Sample Packaging condition
                    </td>
                    <td className="p-2 text-slate-900">
                      {report.samplePackaging || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Date of sample
                    </td>
                    <td className="p-2 text-slate-900">
                      {report.sampleDate || '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Sample Recive Date
                    </td>
                    <td className="p-2 text-slate-900">
                      {report.sampleReceiveDate || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 text-slate-700 border-r border-slate-200">
                      Date of report Issue
                    </td>
                    <td className="p-2 font-bold text-slate-900">
                      {report.reportIssueDate || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Analysis Test & Parameters Table */}
            <div className="mt-6">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                Analysis Test & Parameters
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 text-center w-14">Sr no</th>
                    <th className="p-2 border-r border-slate-300 text-left">Category / commodity</th>
                    <th className="p-2 border-r border-slate-300 text-left">Test Parameters</th>
                    <th className="p-2 text-center w-28">Result (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.parameters && report.parameters.length > 0 ? (
                    report.parameters.map((param, index) => (
                      <tr key={param.id || index} className="border-b border-slate-200 last:border-b-0">
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-700">
                          {param.srNo || index + 1}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-slate-900">
                          {param.commodity || report.commodity || '-'}
                        </td>
                        <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                          {param.parameterName}
                        </td>
                        <td className="p-2 text-center font-bold text-sky-800 bg-sky-50/40">
                          {param.result ? `${param.result}%` : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-400">
                        No test parameters specified
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Section: Legal Terms & Authorised Signature */}
            <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-xs">
              <div className="sm:col-span-2">
                <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Declaration / Legal Terms:
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  {report.declaration || '1. The results listed refer only to the tested sample. 2. Total liability of our laboratory is limited to the invoiced amount. 3. This report cannot be reproduced wholly or in part without prior approval.'}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-[11px] font-bold text-slate-700">For SUNSHINE ANALYTICAL LAB.</p>
                <div className="h-12 flex items-center justify-center sm:justify-end">
                  <span className="text-[10px] italic text-slate-400">[Official Stamp & Signature]</span>
                </div>
                <p className="text-[11px] font-black text-slate-900 border-t border-slate-300 pt-1 inline-block min-w-[140px] text-center">
                  Authorised Signature
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
