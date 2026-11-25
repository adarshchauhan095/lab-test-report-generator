import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import type { SunshineReport } from '@/types/sunshine';
import { generateSunshinePdf } from '@/services/sunshinePdfGenerator';
import { SunshineReportModal } from './SunshineReportModal';
import {
  Search,
  Download,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SunshineReportListProps {
  onEditReport: (report: SunshineReport) => void;
  onNewReport: () => void;
}

export function SunshineReportList({ onEditReport, onNewReport }: SunshineReportListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<SunshineReport | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Live query from IndexedDB with safe catch
  const reports = useLiveQuery(async () => {
    try {
      return await db.simpleReports.toArray();
    } catch {
      return [];
    }
  }, []) || [];

  // Unique commodities for filter
  const commodities = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.commodity) set.add(r.commodity);
    });
    return Array.from(set);
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reports
      .filter((r) => {
        // Commodity filter
        if (commodityFilter !== 'ALL' && r.commodity !== commodityFilter) {
          return false;
        }

        // Search query across serial number, buyer, party, report no, vehicle, code
        if (!q) return true;
        return (
          (r.reportNo || '').toLowerCase().includes(q) ||
          (r.issuedTo || '').toLowerCase().includes(q) ||
          (r.buyer || '').toLowerCase().includes(q) ||
          (r.commodity || '').toLowerCase().includes(q) ||
          (r.vehicleNo || '').toLowerCase().includes(q) ||
          (r.sampleCode || '').toLowerCase().includes(q) ||
          (r.reportIssueDate || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [reports, searchQuery, commodityFilter]);

  const handleDelete = async (id: string) => {
    try {
      await db.simpleReports.delete(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      alert(`Could not delete report: ${err?.message || err}`);
    }
  };

  const handleDownloadPdf = (report: SunshineReport) => {
    generateSunshinePdf(report, 'download');
  };

  const handleOpenPreview = (report: SunshineReport) => {
    setSelectedReport(report);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Search, Filter & New Report */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Saved Test Reports ({reports.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search or filter reports by report number, buyer, party, or vehicle number.
          </p>
        </div>

        <button
          onClick={onNewReport}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Report</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Report No, Buyer, Party, Commodity, Vehicle No..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-xs"
          />
        </div>

        {/* Commodity Filter */}
        {commodities.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-700 shadow-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Commodities ({commodities.length})</option>
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No reports match your search criteria</p>
            <p className="text-xs text-slate-400 mt-1">
              Try searching with a different keyword or create a new report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Report No</th>
                  <th className="p-3">Issued To / Party</th>
                  <th className="p-3">Buyer / Consignee</th>
                  <th className="p-3">Commodity</th>
                  <th className="p-3">Vehicle No</th>
                  <th className="p-3">Bags / Wt</th>
                  <th className="p-3">Parameters Tested</th>
                  <th className="p-3">Issue Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Report No */}
                    <td className="p-3 font-mono font-bold text-sky-700 whitespace-nowrap">
                      {report.reportNo}
                    </td>

                    {/* Issued To / Party */}
                    <td className="p-3 font-medium text-slate-900 max-w-[180px] truncate">
                      {report.issuedTo || '-'}
                    </td>

                    {/* Buyer / Consignee */}
                    <td className="p-3 text-slate-700 max-w-[180px] truncate">
                      {report.buyer || '-'}
                    </td>

                    {/* Commodity */}
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {report.commodity || '-'}
                      </span>
                    </td>

                    {/* Vehicle No */}
                    <td className="p-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {report.vehicleNo || '-'}
                    </td>

                    {/* Bags / Weight */}
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {report.noOfBags ? `${report.noOfBags} Bags` : ''}
                      {report.netWeight ? ` • ${report.netWeight}` : ''}
                      {!report.noOfBags && !report.netWeight && '-'}
                    </td>

                    {/* Parameters Tested Summary */}
                    <td className="p-3 max-w-[200px]">
                      <div className="space-y-0.5">
                        {report.parameters?.slice(0, 2).map((p, idx) => (
                          <div key={idx} className="text-[11px] text-slate-600 truncate">
                            <span className="font-semibold text-slate-800">{p.parameterName}:</span>{' '}
                            <span className="font-bold text-sky-800">{p.result}%</span>
                          </div>
                        ))}
                        {(report.parameters?.length || 0) > 2 && (
                          <span className="text-[10px] text-slate-400">
                            +{report.parameters.length - 2} more...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="p-3 whitespace-nowrap text-slate-600 font-medium">
                      {report.reportIssueDate || '-'}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(report)}
                          title="Preview Report"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-sky-600 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(report)}
                          title="Download PDF"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-600 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditReport(report)}
                          title="Edit Report"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(report.id)}
                          title="Delete Report"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm">Delete Test Report?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white cursor-pointer shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <SunshineReportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        report={selectedReport}
      />
    </div>
  );
}
