import { useState } from 'react';
import { Menu, Plus, ShieldCheck, UserCheck, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/common/Button';
import type { UserRole } from '@/types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { currentUser, setCurrentUser, availableUsers } = useUser();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Administrator', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    lab_operator: { label: 'Lab Operator', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    billing_operator: { label: 'Billing Operator', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            DEMO MODE (LOCAL PERSISTENT STORAGE)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Report Action */}
        <Link to="/reports/new">
          <Button size="sm" variant="primary" className="hidden sm:inline-flex">
            <Plus className="w-4 h-4" />
            <span>New Report</span>
          </Button>
        </Link>

        {/* Active Demo User Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.fullName}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-medium mt-1 border ${roleLabels[currentUser.role].color}`}>
                {roleLabels[currentUser.role].label}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-40">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Demo User Profile
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Demonstrates role permissions & audit attribution
                  </p>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {availableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{user.fullName}</p>
                        <p className="text-[10px] text-slate-500">
                          {roleLabels[user.role].label} • {user.email}
                        </p>
                      </div>
                      {user.id === currentUser.id && (
                        <Check className="w-4 h-4 text-sky-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="px-3.5 pt-2 pb-1 border-t border-slate-100 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                  <span>Client-side session simulation</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
