import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CommodityFormModal } from './CommodityFormModal';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import type { Commodity } from '@/types';
import { Package, Plus, Search, Edit2, Power } from 'lucide-react';

export function CommodityList() {
  const { can } = useUser();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);
  const [togglingCommodity, setTogglingCommodity] = useState<Commodity | null>(null);

  const commodities = useLiveQuery(() => db.commodities.toArray(), []) || [];
  const parameters = useLiveQuery(() => db.testParameters.toArray(), []) || [];

  const paramMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of parameters) {
      map.set(p.id, p.name);
    }
    return map;
  }, [parameters]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    commodities.forEach((c) => cats.add(c.category));
    return Array.from(cats);
  }, [commodities]);

  const filteredCommodities = useMemo(() => {
    return commodities.filter((c) => {
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [commodities, searchQuery, selectedCategory]);

  const handleToggleStatus = async () => {
    if (!togglingCommodity) return;
    try {
      const nextStatus = togglingCommodity.status === 'active' ? 'inactive' : 'active';
      await db.commodities.update(togglingCommodity.id, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      success(
        'Commodity Status Changed',
        `${togglingCommodity.name} is now ${nextStatus}.`
      );
      setTogglingCommodity(null);
    } catch (err: any) {
      error('Failed to change status', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Commodity Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure testable commodities, default test parameters, units, and tax rates
          </p>
        </div>
        {can('manage_commodities') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCommodity(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add Commodity</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Commodities"
          value={commodities.length}
          subtitle={`${commodities.filter((c) => c.status === 'active').length} active`}
          icon={Package}
          color="sky"
        />
        <StatCard
          title="Product Categories"
          value={categories.length}
          subtitle="Distinct commodity types"
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Configured Parameters"
          value={parameters.length}
          subtitle="Available laboratory methods"
          icon={Package}
          color="emerald"
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commodity name or category..."
            className="w-full text-xs pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Commodity Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Default Unit</th>
                <th className="py-3 px-4">Tax Rate</th>
                <th className="py-3 px-4">Default Test Parameters</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCommodities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No commodities found.
                  </td>
                </tr>
              ) : (
                filteredCommodities.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{comm.name}</p>
                      {comm.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {comm.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{comm.category}</td>
                    <td className="py-3.5 px-4 font-mono">{comm.defaultUnit}</td>
                    <td className="py-3.5 px-4 font-mono">{comm.defaultTaxRate}%</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {comm.defaultParameterIds?.length > 0 ? (
                          comm.defaultParameterIds.map((pid) => (
                            <span
                              key={pid}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {paramMap.get(pid) || pid}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">None assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={comm.status === 'active' ? 'success' : 'neutral'} dot>
                        {comm.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {can('manage_commodities') && (
                          <>
                            <button
                              onClick={() => {
                                setEditingCommodity(comm);
                                setIsFormOpen(true);
                              }}
                              title="Edit Commodity"
                              className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-md cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setTogglingCommodity(comm)}
                              title={comm.status === 'active' ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-md cursor-pointer ${
                                comm.status === 'active'
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
        <CommodityFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCommodity(null);
          }}
          onSuccess={() => {}}
          commodity={editingCommodity}
        />
      )}

      {togglingCommodity && (
        <ConfirmDialog
          isOpen={Boolean(togglingCommodity)}
          onClose={() => setTogglingCommodity(null)}
          onConfirm={handleToggleStatus}
          title={togglingCommodity.status === 'active' ? 'Deactivate Commodity' : 'Activate Commodity'}
          message={`Are you sure you want to mark ${togglingCommodity.name} as ${
            togglingCommodity.status === 'active' ? 'inactive' : 'active'
          }?`}
          confirmLabel={togglingCommodity.status === 'active' ? 'Deactivate' : 'Activate'}
          variant={togglingCommodity.status === 'active' ? 'warning' : 'primary'}
        />
      )}
    </div>
  );
}
