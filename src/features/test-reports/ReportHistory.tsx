import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ReportDetailModal } from './ReportDetailModal';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { generateReportPdf } from '@/services/pdfGenerator';
import type { Report } from '@/types';
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Copy,
  Printer,
  Download,
  Archive,
  RotateCcw,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function ReportHistory() {
  const navigate = useNavigate();
  const { currentUser, can } = useUser();
  const { success, error } = useToast();

  // Master records
  const reports = useLiveQuery(() => db.reports.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const commodities = useLiveQuery(() => db.commodities.toArray(), []) || [];
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [dateField, setDateField] = useState<'reportDate' | 'sampleReceivedDate'>('reportDate');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'reportDate' | 'reportNumber' | 'grandTotal' | 'customerName'>('reportDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [archivingReport, setArchivingReport] = useState<Report | null>(null);

  // Map invoice payment status by report ID or report number
  const reportPaymentStatusMap = useMemo(() => {
    const map = new Map<string, 'unpaid' | 'partially_paid' | 'paid'>();
    for (const inv of invoices) {
      for (const repId of inv.reportIds || []) {
        map.set(repId, inv.paymentStatus);
      }
    }
    return map;
  }, [invoices]);

  // Combined Multi-Criteria Filtering Engine
  const filteredReports = useMemo(() => {
    const now = new Date();

    return reports.filter((rep) => {
      // 1. Search query (report #, job card #, customer, vehicle, sample codes)
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesReportNum = rep.reportNumber.toLowerCase().includes(q);
        const matchesJobCard = rep.jobCardNumber.toLowerCase().includes(q);
        const matchesCustomer = rep.customerName.toLowerCase().includes(q);
        const matchesVehicle = rep.vehicleNumber?.toLowerCase().includes(q);
        const matchesSampleCode = rep.commodities?.some((c) =>
          c.sampleCode?.toLowerCase().includes(q)
        );
        if (!matchesReportNum && !matchesJobCard && !matchesCustomer && !matchesVehicle && !matchesSampleCode) {
          return false;
        }
      }

      // 2. User-wise filter
      if (selectedUser !== 'all') {
        if (rep.createdBy !== selectedUser) {
          return false;
        }
      }

      // 3. Customer-wise filter
      if (selectedCustomer !== 'all') {
        if (rep.customerId !== selectedCustomer) {
          return false;
        }
      }

      // 4. Commodity-wise filter
      if (selectedCommodity !== 'all') {
        const hasComm = rep.commodities?.some(
          (c) => c.commodityId === selectedCommodity || c.commodityName.toLowerCase() === selectedCommodity.toLowerCase()
        );
        if (!hasComm) return false;
      }

      // 5. Report status filter
      if (selectedStatus !== 'all') {
        if (rep.status !== selectedStatus) return false;
      }

      // 6. Payment status filter
      if (selectedPaymentStatus !== 'all') {
        const payStatus = reportPaymentStatusMap.get(rep.reportNumber) || reportPaymentStatusMap.get(rep.id) || 'unpaid';
        if (payStatus !== selectedPaymentStatus) return false;
      }

      // 7. Amount Range filter
      const total = rep.financials?.grandTotal || 0;
      if (minAmount && total < parseFloat(minAmount)) return false;
      if (maxAmount && total > parseFloat(maxAmount)) return false;

      // 8. Date-wise filter
      const targetDateStr = rep[dateField];
      if (dateFilterType !== 'all' && targetDateStr) {
        try {
          const d = parseISO(targetDateStr);
          if (dateFilterType === 'today') {
            const todayStr = now.toISOString().slice(0, 10);
            if (targetDateStr.slice(0, 10) !== todayStr) return false;
          } else if (dateFilterType === 'yesterday') {
            const yestStr = subDays(now, 1).toISOString().slice(0, 10);
            if (targetDateStr.slice(0, 10) !== yestStr) return false;
          } else if (dateFilterType === 'last7') {
            const start = subDays(now, 7);
            if (!isWithinInterval(d, { start, end: now })) return false;
          } else if (dateFilterType === 'last15') {
            const start = subDays(now, 15);
            if (!isWithinInterval(d, { start, end: now })) return false;
          } else if (dateFilterType === 'last30') {
            const start = subDays(now, 30);
            if (!isWithinInterval(d, { start, end: now })) return false;
          } else if (dateFilterType === 'thisMonth') {
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            if (!isWithinInterval(d, { start, end })) return false;
          } else if (dateFilterType === 'prevMonth') {
            const prev = subMonths(now, 1);
            const start = startOfMonth(prev);
            const end = endOfMonth(prev);
            if (!isWithinInterval(d, { start, end })) return false;
          } else if (dateFilterType === 'thisYear') {
            const start = startOfYear(now);
            if (!isWithinInterval(d, { start, end: now })) return false;
          } else if (dateFilterType === 'custom') {
            if (customFromDate && targetDateStr < customFromDate) return false;
            if (customToDate && targetDateStr > customToDate) return false;
          }
        } catch {
          // ignore invalid date
        }
      }

      return true;
    });
  }, [
    reports,
    searchQuery,
    selectedUser,
    selectedCustomer,
    selectedCommodity,
    selectedStatus,
    selectedPaymentStatus,
    minAmount,
    maxAmount,
    dateFilterType,
    dateField,
    customFromDate,
    customToDate,
    reportPaymentStatusMap,
  ]);

  // Sorting
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'grandTotal') {
        valA = a.financials?.grandTotal || 0;
        valB = b.financials?.grandTotal || 0;
      } else {
        valA = (a as any)[sortField];
        valB = (b as any)[sortField];
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredReports, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize));
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedReports.slice(start, start + pageSize);
  }, [sortedReports, currentPage, pageSize]);

  // Aggregate Metrics on Filtered Data
  const filteredMetrics = useMemo(() => {
    const totalCount = filteredReports.length;
    const totalAmount = filteredReports.reduce(
      (sum, r) => sum + (r.financials?.grandTotal || 0),
      0
    );
    const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    return { totalCount, totalAmount, avgAmount };
  }, [filteredReports]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedUser('all');
    setSelectedCustomer('all');
    setSelectedCommodity('all');
    setSelectedStatus('all');
    setSelectedPaymentStatus('all');
    setDateFilterType('all');
    setCustomFromDate('');
    setCustomToDate('');
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
  };

  const handleSortToggle = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportFilteredCSV = () => {
    const headers = [
      'Report Number',
      'Job Card Number',
      'Customer Name',
      'Commodities',
      'Sample Codes',
      'Report Date',
      'Sample Received Date',
      'Vehicle Number',
      'Status',
      'Created By',
      'Testing Charges',
      'Additional Charges',
      'Discount',
      'Tax Amount',
      'Grand Total',
    ];

    const rows = filteredReports.map((r) => [
      `"${r.reportNumber}"`,
      `"${r.jobCardNumber}"`,
      `"${r.customerName}"`,
      `"${r.commodities.map((c) => c.commodityName).join('; ')}"`,
      `"${r.commodities.map((c) => c.sampleCode).join('; ')}"`,
      `"${r.reportDate}"`,
      `"${r.sampleReceivedDate}"`,
      `"${r.vehicleNumber || ''}"`,
      `"${r.status}"`,
      `"${r.createdBy}"`,
      r.financials?.testingCharges || 0,
      r.financials?.additionalCharges || 0,
      r.financials?.discountAmount || 0,
      r.financials?.taxAmount || 0,
      r.financials?.grandTotal || 0,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reports_history_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', `${filteredReports.length} reports exported to CSV.`);
  };

  const handleArchiveConfirm = async () => {
    if (!archivingReport) return;
    try {
      const nextStatus = archivingReport.status === 'archived' ? 'draft' : 'archived';
      await db.reports.update(archivingReport.id, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.fullName,
      });
      success(
        nextStatus === 'archived' ? 'Report Archived' : 'Report Restored',
        `Report ${archivingReport.reportNumber} status set to ${nextStatus}.`
      );
      setArchivingReport(null);
    } catch (err: any) {
      error('Failed to update status', err?.message);
    }
  };

  const handleDownloadPdf = async (report: Report) => {
    try {
      const [comp, repSet] = await Promise.all([
        db.companySettings.get('default'),
        db.reportSettings.get('default'),
      ]);
      await generateReportPdf(report, comp, repSet, false);
      success('PDF Generated', `Report ${report.reportNumber} PDF downloaded.`);
    } catch (err: any) {
      error('Failed to generate PDF', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report History & Records</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, filter, audit, print, and export laboratory test certifications
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={exportFilteredCSV}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>
          <Link to="/reports/new">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Create Report</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Aggregate Filtered Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-sky-700 uppercase">Filtered Reports</p>
          <p className="text-2xl font-bold text-sky-950 mt-1">{filteredMetrics.totalCount}</p>
          <p className="text-[11px] text-sky-600 mt-0.5">Matching all active filter rules</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Total Filtered Value</p>
          <p className="text-2xl font-bold text-emerald-950 mt-1">
            {formatCurrency(filteredMetrics.totalAmount)}
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Cumulative billing for matched records</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-700 uppercase">Average Report Value</p>
          <p className="text-2xl font-bold text-purple-950 mt-1">
            {formatCurrency(filteredMetrics.avgAmount)}
          </p>
          <p className="text-[11px] text-purple-600 mt-0.5">Mean testing value per certificate</p>
        </div>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Combined Multi-Criteria Filters</span>
          </div>
          <button
            onClick={resetAllFilters}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

        {/* Search & Select Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Quick Search */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Search by Report #, Job Card, Customer, Sample Code
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. ATS/KNL/RB/A-10275, Naman, LOT-A1..."
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Operator / Created By</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Users & Operators</option>
              {users.map((u) => (
                <option key={u.id} value={u.fullName}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer / Party</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Commodity Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Commodity</label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Report Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Report Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="finalized">Finalized</option>
              <option value="revised">Revised</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Status</label>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid / Pending</option>
            </select>
          </div>

          {/* Date Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date Range</label>
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="last15">Last 15 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="prevMonth">Previous Month</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range & Amount Filter Row */}
        {dateFilterType === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date Field</label>
              <select
                value={dateField}
                onChange={(e) => setDateField(e.target.value as any)}
                className="w-full px-3 py-1.5 border rounded-lg border-slate-300 bg-white"
              >
                <option value="reportDate">Report Issue Date</option>
                <option value="sampleReceivedDate">Sample Received Date</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Date</label>
              <input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Date</label>
              <input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg border-slate-300 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">
              <tr>
                <th
                  onClick={() => handleSortToggle('reportNumber')}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Report #</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Job Card</th>
                <th
                  onClick={() => handleSortToggle('customerName')}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Commodity / Samples</th>
                <th
                  onClick={() => handleSortToggle('reportDate')}
                  className="py-3 px-4 cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Report Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Operator</th>
                <th
                  onClick={() => handleSortToggle('grandTotal')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-sky-600"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-400">
                    No reports match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((rep) => {
                  const payStatus =
                    reportPaymentStatusMap.get(rep.reportNumber) ||
                    reportPaymentStatusMap.get(rep.id) ||
                    'unpaid';

                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                        {rep.reportNumber}
                        {rep.revisionNumber > 0 && (
                          <span className="ml-1 text-[10px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                            R{rep.revisionNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {rep.jobCardNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{rep.customerName}</p>
                        <p className="text-[11px] text-slate-400">{rep.partyName}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rep.commodities.map((c, i) => (
                            <span
                              key={i}
                              className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                            >
                              {c.commodityName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{formatDate(rep.reportDate)}</td>
                      <td className="py-3.5 px-4 text-slate-700">{rep.createdBy}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(rep.financials?.grandTotal || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            rep.status === 'finalized'
                              ? 'success'
                              : rep.status === 'draft'
                              ? 'warning'
                              : 'neutral'
                          }
                          dot
                        >
                          {rep.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            payStatus === 'paid'
                              ? 'success'
                              : payStatus === 'partially_paid'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {payStatus.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingReport(rep)}
                            title="View Full Report"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(rep)}
                            title="Download PDF"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {can('edit_report') && (
                            <button
                              onClick={() => navigate(`/reports/${rep.id}/edit`)}
                              title="Edit Report"
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/reports/new?duplicateFrom=${rep.id}`)}
                            title="Duplicate as New Report"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {can('delete_report') && (
                            <button
                              onClick={() => setArchivingReport(rep)}
                              title={rep.status === 'archived' ? 'Restore' : 'Archive'}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border rounded border-slate-300 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {filteredReports.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredReports.length)} of {filteredReports.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            <span className="font-semibold px-2 text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Report Detail Modal */}
      {viewingReport && (
        <ReportDetailModal
          isOpen={Boolean(viewingReport)}
          onClose={() => setViewingReport(null)}
          report={viewingReport}
        />
      )}

      {/* Archive / Restore Confirmation */}
      {archivingReport && (
        <ConfirmDialog
          isOpen={Boolean(archivingReport)}
          onClose={() => setArchivingReport(null)}
          onConfirm={handleArchiveConfirm}
          title={archivingReport.status === 'archived' ? 'Restore Report' : 'Archive Report'}
          message={`Are you sure you want to ${
            archivingReport.status === 'archived' ? 'restore' : 'archive'
          } report ${archivingReport.reportNumber}?`}
          confirmLabel={archivingReport.status === 'archived' ? 'Restore' : 'Archive'}
          variant={archivingReport.status === 'archived' ? 'primary' : 'danger'}
        />
      )}
    </div>
  );
}
