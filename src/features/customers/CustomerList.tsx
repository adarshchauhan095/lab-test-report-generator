import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/utils/formatters';
import type { Customer } from '@/types';
import {
  Users2,
  Plus,
  Search,
  Eye,
  Edit2,
  Archive,
  Building2,
  Phone,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';

export function CustomerList() {
  const { can } = useUser();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [archivingCustomer, setArchivingCustomer] = useState<Customer | null>(null);

  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray(), []) || [];
  const reports = useLiveQuery(() => db.reports.toArray(), []) || [];

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.city.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [customers, searchQuery, statusFilter]);

  // Outstanding balances calculation
  const customerBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    for (const inv of invoices) {
      balances[inv.customerId] = (balances[inv.customerId] || 0) + (inv.balanceDue || 0);
    }
    return balances;
  }, [invoices]);

  const totalOutstanding = useMemo(() => {
    return Object.values(customerBalances).reduce((a, b) => a + b, 0);
  }, [customerBalances]);

  const handleArchiveConfirm = async () => {
    if (!archivingCustomer) return;
    try {
      const nextStatus = archivingCustomer.status === 'active' ? 'archived' : 'active';
      await db.customers.update(archivingCustomer.id, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      success(
        nextStatus === 'archived' ? 'Customer Archived' : 'Customer Restored',
        `${archivingCustomer.name} has been set to ${nextStatus}.`
      );
      setArchivingCustomer(null);
    } catch (err: any) {
      error('Failed to change customer status', err?.message);
    }
  };

  const exportCustomersCSV = () => {
    const headers = ['Customer Code', 'Contact Name', 'Company Name', 'Mobile', 'Email', 'City', 'State', 'GSTIN', 'Status', 'Created Date'];
    const rows = filteredCustomers.map((c) => [
      `"${c.customerCode}"`,
      `"${c.name}"`,
      `"${c.companyName}"`,
      `"${c.mobile}"`,
      `"${c.email || ''}"`,
      `"${c.city}"`,
      `"${c.state}"`,
      `"${c.gstin || ''}"`,
      `"${c.status}"`,
      `"${formatDate(c.createdAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Filtered customers downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer / Party Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage clients, contact information, state GST details, and historical balances
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={exportCustomersCSV}>
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </Button>
          {can('manage_customers') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingCustomer(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Customers"
          value={customers.length}
          subtitle={`${customers.filter((c) => c.status === 'active').length} active`}
          icon={Users2}
          color="sky"
        />
        <StatCard
          title="Total Reports Linked"
          value={reports.length}
          subtitle="Issued across clients"
          icon={Building2}
          color="indigo"
        />
        <StatCard
          title="Total Outstanding Receivables"
          value={formatCurrency(totalOutstanding)}
          subtitle="Unpaid invoices"
          icon={Phone}
          color="amber"
        />
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, company, city, phone..."
            className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
          >
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Contact / Party</th>
                <th className="py-3 px-4">Phone / Email</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const bal = customerBalances[cust.id] || 0;
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-sky-700">
                        {cust.customerCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{cust.companyName}</p>
                        <p className="text-[11px] text-slate-500">{cust.name}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.mobile}</span>
                        </div>
                        {cust.email && <p className="text-[11px] text-slate-400 mt-0.5">{cust.email}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.city}, {cust.state}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {cust.gstin || <span className="text-slate-400">N/A</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold">
                        {bal > 0 ? (
                          <span className="text-rose-600">{formatCurrency(bal)}</span>
                        ) : (
                          <span className="text-emerald-600">₹ 0.00</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={cust.status === 'active' ? 'success' : 'neutral'} dot>
                          {cust.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            title="View Customer Profile"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {can('manage_customers') && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCustomer(cust);
                                  setIsFormOpen(true);
                                }}
                                title="Edit Customer"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-md cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setArchivingCustomer(cust)}
                                title={cust.status === 'active' ? 'Archive Customer' : 'Restore Customer'}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md cursor-pointer"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
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
      </div>

      {/* Customer Form Modal */}
      {isFormOpen && (
        <CustomerFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }}
          onSuccess={() => {}}
          customer={editingCustomer}
        />
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
        />
      )}

      {/* Archive / Status Confirmation */}
      {archivingCustomer && (
        <ConfirmDialog
          isOpen={Boolean(archivingCustomer)}
          onClose={() => setArchivingCustomer(null)}
          onConfirm={handleArchiveConfirm}
          title={archivingCustomer.status === 'active' ? 'Archive Customer' : 'Restore Customer'}
          message={`Are you sure you want to ${
            archivingCustomer.status === 'active' ? 'archive' : 'restore'
          } ${archivingCustomer.name}? Dependent reports and invoices will remain intact.`}
          confirmLabel={archivingCustomer.status === 'active' ? 'Archive' : 'Restore'}
          variant={archivingCustomer.status === 'active' ? 'warning' : 'primary'}
        />
      )}
    </div>
  );
}
