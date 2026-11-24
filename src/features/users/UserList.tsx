import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatCard } from '@/components/common/StatCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { UserFormModal } from './UserFormModal';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/utils/formatters';
import type { User, ActivityLog } from '@/types';
import { UserCog, Plus, Edit2, Power, History, Shield, CheckCircle2 } from 'lucide-react';

export function UserList() {
  const { currentUser, can, refreshUsers } = useUser();
  const { success, error } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');

  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const activityLogs =
    useLiveQuery(() => db.activityLogs.reverse().limit(30).toArray(), []) || [];

  const handleToggleStatus = async () => {
    if (!togglingUser) return;
    try {
      const nextStatus = togglingUser.status === 'active' ? 'inactive' : 'active';
      await db.users.update(togglingUser.id, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
      await refreshUsers();
      success('User Status Updated', `${togglingUser.fullName} is now ${nextStatus}.`);
      setTogglingUser(null);
    } catch (err: any) {
      error('Failed to update status', err?.message);
    }
  };

  const roleBadges: Record<string, { label: string; variant: 'danger' | 'info' | 'success' | 'neutral' }> = {
    admin: { label: 'Administrator', variant: 'danger' },
    lab_operator: { label: 'Lab Operator', variant: 'info' },
    billing_operator: { label: 'Billing Operator', variant: 'success' },
    viewer: { label: 'Viewer', variant: 'neutral' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management & Roles</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage laboratory staff, operators, authorization roles, and audit trail
          </p>
        </div>
        {can('manage_users') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingUser(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Users"
          value={users.length}
          subtitle={`${users.filter((u) => u.status === 'active').length} active operators`}
          icon={UserCog}
          color="sky"
        />
        <StatCard
          title="Active Session Identity"
          value={currentUser.fullName}
          subtitle={`Role: ${currentUser.role}`}
          icon={Shield}
          color="indigo"
        />
        <StatCard
          title="Audit Trail Entries"
          value={activityLogs.length}
          subtitle="Recent operational logs"
          icon={History}
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 cursor-pointer ${
            activeTab === 'users' ? 'border-b-2 border-sky-600 text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          Staff & Operator Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-2.5 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'activity' ? 'border-b-2 border-sky-600 text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Trail & Activity Logs</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {u.fullName}
                      {u.id === currentUser.id && (
                        <span className="ml-1.5 text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-normal">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{u.username}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={roleBadges[u.role]?.variant || 'neutral'}>
                        {roleBadges[u.role]?.label || u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{u.mobile}</td>
                    <td className="py-3.5 px-4">{u.email}</td>
                    <td className="py-3.5 px-4">{formatDate(u.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.status === 'active' ? 'success' : 'neutral'} dot>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {can('manage_users') && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setIsFormOpen(true);
                            }}
                            title="Edit User"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {u.id !== currentUser.id && (
                            <button
                              onClick={() => setTogglingUser(u)}
                              title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.userName}</td>
                    <td className="py-3 px-4 font-mono font-medium text-sky-700">{log.action}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFormOpen && (
        <UserFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
          onSuccess={() => {}}
          user={editingUser}
        />
      )}

      {togglingUser && (
        <ConfirmDialog
          isOpen={Boolean(togglingUser)}
          onClose={() => setTogglingUser(null)}
          onConfirm={handleToggleStatus}
          title={togglingUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
          message={`Are you sure you want to ${
            togglingUser.status === 'active' ? 'deactivate' : 'activate'
          } ${togglingUser.fullName}?`}
          confirmLabel={togglingUser.status === 'active' ? 'Deactivate' : 'Activate'}
          variant={togglingUser.status === 'active' ? 'warning' : 'primary'}
        />
      )}
    </div>
  );
}
