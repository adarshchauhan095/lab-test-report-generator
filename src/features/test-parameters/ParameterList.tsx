import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ParameterFormModal } from './ParameterFormModal';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/utils/formatters';
import type { TestParameter } from '@/types';
import { SlidersHorizontal, Plus, Search, Edit2, Power } from 'lucide-react';

export function ParameterList() {
  const { can } = useUser();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<TestParameter | null>(null);
  const [togglingParam, setTogglingParam] = useState<TestParameter | null>(null);

  const parameters = useLiveQuery(() => db.testParameters.toArray(), []) || [];

  const filteredParams = useMemo(() => {
    return parameters.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.testMethod.toLowerCase().includes(q) ||
        p.unit.toLowerCase().includes(q)
      );
    });
  }, [parameters, searchQuery]);

  const handleToggleStatus = async () => {
    if (!togglingParam) return;
    try {
      const nextStatus = togglingParam.status === 'active' ? 'inactive' : 'active';
      await db.testParameters.update(togglingParam.id, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      success('Status Changed', `${togglingParam.name} is now ${nextStatus}.`);
      setTogglingParam(null);
    } catch (err: any) {
      error('Failed to change status', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Parameters Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage laboratory test procedures, national/international standards (IS/ISO), and standard testing rates
          </p>
        </div>
        {can('manage_commodities') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingParam(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Test Parameter</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Parameters"
          value={parameters.length}
          subtitle={`${parameters.filter((p) => p.status === 'active').length} active`}
          icon={SlidersHorizontal}
          color="sky"
        />
        <StatCard
          title="Average Testing Rate"
          value={formatCurrency(
            parameters.length > 0
              ? parameters.reduce((a, b) => a + (b.defaultCharge || 0), 0) / parameters.length
              : 0
          )}
          subtitle="Per parameter test"
          icon={SlidersHorizontal}
          color="emerald"
        />
        <StatCard
          title="Standard Methods"
          value={new Set(parameters.map((p) => p.testMethod)).size}
          subtitle="IS, ISO & ASTM specifications"
          icon={SlidersHorizontal}
          color="indigo"
        />
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parameter name, standard method, or unit..."
            className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Parameter Name</th>
                <th className="py-3 px-4">Test Method</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Acceptable Range</th>
                <th className="py-3 px-4 text-right">Standard Charge</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No test parameters found.
                  </td>
                </tr>
              ) : (
                filteredParams.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 font-mono font-medium text-sky-700">{p.testMethod}</td>
                    <td className="py-3.5 px-4 font-mono">{p.unit}</td>
                    <td className="py-3.5 px-4 capitalize">{p.resultType}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {p.minLimit !== null && p.minLimit !== undefined
                        ? `${p.minLimit} - ${p.maxLimit ?? '∞'} ${p.unit}`
                        : p.maxLimit !== null && p.maxLimit !== undefined
                        ? `Max ${p.maxLimit} ${p.unit}`
                        : <span className="text-slate-400">Not specified</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                      {formatCurrency(p.defaultCharge)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={p.status === 'active' ? 'success' : 'neutral'} dot>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {can('manage_commodities') && (
                          <>
                            <button
                              onClick={() => {
                                setEditingParam(p);
                                setIsFormOpen(true);
                              }}
                              title="Edit Parameter"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTogglingParam(p)}
                              title={p.status === 'active' ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-md cursor-pointer ${
                                p.status === 'active'
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <ParameterFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingParam(null);
          }}
          onSuccess={() => {}}
          parameter={editingParam}
        />
      )}

      {togglingParam && (
        <ConfirmDialog
          isOpen={Boolean(togglingParam)}
          onClose={() => setTogglingParam(null)}
          onConfirm={handleToggleStatus}
          title={togglingParam.status === 'active' ? 'Deactivate Parameter' : 'Activate Parameter'}
          message={`Are you sure you want to deactivate ${togglingParam.name}?`}
          confirmLabel={togglingParam.status === 'active' ? 'Deactivate' : 'Activate'}
          variant={togglingParam.status === 'active' ? 'warning' : 'primary'}
        />
      )}
    </div>
  );
}
