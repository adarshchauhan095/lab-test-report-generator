import { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import type { Report, ReportRevision } from '@/types';
import { db } from '@/database/db';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Download, Printer, History, FileText, CheckCircle2 } from 'lucide-react';
import { generateReportPdf } from '@/services/pdfGenerator';
import { useToast } from '@/context/ToastContext';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
}

export function ReportDetailModal({ isOpen, onClose, report }: ReportDetailModalProps) {
  const { success, error } = useToast();
  const [revisions, setRevisions] = useState<ReportRevision[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'revisions'>('details');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    if (!report) return;
    db.reportRevisions
      .where('reportId')
      .equals(report.id)
      .reverse()
      .sortBy('revisionNumber')
      .then(setRevisions);
  }, [report]);

  if (!report) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      const [companySettings, reportSettings] = await Promise.all([
        db.companySettings.get('default'),
        db.reportSettings.get('default'),
      ]);
      await generateReportPdf(report, companySettings, reportSettings, false);
      success('PDF Downloaded', `Test report ${report.reportNumber} downloaded.`);
    } catch (err: any) {
      error('Failed to generate PDF', err?.message);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handlePrintPdf = async () => {
    try {
      setIsPdfGenerating(true);
      const [companySettings, reportSettings] = await Promise.all([
        db.companySettings.get('default'),
        db.reportSettings.get('default'),
      ]);
      await generateReportPdf(report, companySettings, reportSettings, true);
    } catch (err: any) {
      error('Failed to print PDF', err?.message);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Test Report: ${report.reportNumber}`}
      subtitle={`Job Card: ${report.jobCardNumber} • Issued To: ${report.customerName}`}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintPdf}
              isLoading={isPdfGenerating}
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Report</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleDownloadPdf}
              isLoading={isPdfGenerating}
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                report.status === 'finalized'
                  ? 'success'
                  : report.status === 'draft'
                  ? 'warning'
                  : 'neutral'
              }
              dot
            >
              Status: {report.status.toUpperCase()}
            </Badge>
            {report.revisionNumber > 0 && (
              <Badge variant="purple">Revision #{report.revisionNumber}</Badge>
            )}
            <span className="text-xs text-slate-500">
              Created by <strong>{report.createdBy}</strong> on {formatDate(report.reportDate)}
            </span>
          </div>

          {revisions.length > 0 && (
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1 cursor-pointer ${
                  activeTab === 'details' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500'
                }`}
              >
                Current Report
              </button>
              <button
                onClick={() => setActiveTab('revisions')}
                className={`px-3 py-1 cursor-pointer flex items-center gap-1 ${
                  activeTab === 'revisions' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-slate-500'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Revisions ({revisions.length})</span>
              </button>
            </div>
          )}
        </div>

        {activeTab === 'revisions' ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Formal Revision History Log
            </h4>
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-purple-700">Revision #{rev.revisionNumber}</span>
                  <span className="text-slate-500">{formatDate(rev.revisionDate)}</span>
                </div>
                <p className="text-slate-700">
                  <strong>Reason:</strong> {rev.reason}
                </p>
                <p className="text-slate-500 text-[11px]">Revised by: {rev.revisedBy}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Header / Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Customer / Issued To:</span>
                <span className="font-bold text-slate-900">{report.customerName}</span>
                <p className="text-slate-500 text-[11px]">{report.partyName}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Buyer / Consignee:</span>
                <span className="font-semibold text-slate-900">{report.buyerConsignee || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Vehicle / Transport:</span>
                <span className="font-mono font-medium text-slate-900">{report.vehicleNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sampling / Condition:</span>
                <span className="text-slate-900">{report.samplingType}</span>
                <p className="text-slate-500 text-[11px]">{report.samplePackingCondition}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Sample Received:</span>
                <span className="text-slate-800">{formatDate(report.sampleReceivedDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Analysis Period:</span>
                <span className="text-slate-800">
                  {formatDate(report.analysisStartDate)} to {formatDate(report.analysisEndDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Issue Date:</span>
                <span className="text-slate-800">{formatDate(report.issueDate)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Billed Grand Total:</span>
                <span className="font-bold text-sky-700">
                  {formatCurrency(report.financials?.grandTotal || 0)}
                </span>
              </div>
            </div>

            {/* Commodity Results Sections */}
            <div className="space-y-4">
              {report.commodities.map((comm, idx) => (
                <div
                  key={comm.id || idx}
                  className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                >
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 uppercase">
                        Commodity {idx + 1}: {comm.commodityName}
                      </span>
                      <span className="text-slate-500 ml-2 font-mono text-[11px]">
                        Code: {comm.sampleCode} • {comm.numberOfBags} Bags • {comm.quantityPerSample}
                        {comm.netWeight ? ` • Net: ${comm.netWeight}` : ''}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-700">
                      Subtotal: {formatCurrency(comm.commoditySubtotal || 0)}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/70 border-b border-slate-200 uppercase text-[10px] text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Test Parameter</th>
                        <th className="py-2 px-3">Test Method</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3">Result</th>
                        <th className="py-2 px-3">Conformance</th>
                        <th className="py-2 px-3 text-right">Testing Charge</th>
                        <th className="py-2 px-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {comm.testResults.map((r, rIdx) => (
                        <tr key={r.id || rIdx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-900">{r.parameterName}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{r.testMethod}</td>
                          <td className="py-2 px-3 font-mono">{r.unit}</td>
                          <td className="py-2 px-3 font-bold text-sky-800">{r.resultValue}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                r.status === 'PASS' || r.status === 'CONFORMS'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : r.status === 'FAIL'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {r.status || 'CONFORMS'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium">
                            {formatCurrency(r.charge || 0)}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px]">{r.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* General Remarks */}
            {report.remarks && (
              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs">
                <span className="font-bold text-amber-900">Lab Remarks / Declaration: </span>
                <span className="text-amber-800">{report.remarks}</span>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
