import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Users2,
  Package,
  SlidersHorizontal,
  Receipt,
  CreditCard,
  BarChart3,
  UserCog,
  Settings,
  Database,
  FlaskConical,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/reports/new', label: 'New Report', icon: FilePlus, highlight: true },
    { to: '/reports', label: 'Report History', icon: FileText },
    { to: '/customers', label: 'Customers', icon: Users2 },
    { to: '/commodities', label: 'Commodities', icon: Package },
    { to: '/test-parameters', label: 'Test Parameters', icon: SlidersHorizontal },
    { to: '/invoices', label: 'Billing & Invoices', icon: Receipt },
    { to: '/payments', label: 'Payments', icon: CreditCard },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/users', label: 'User Management', icon: UserCog },
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/backup', label: 'Backup & Restore', icon: Database },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="p-2 bg-sky-600 rounded-lg text-white shadow-md">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">Lab Manager</h1>
            <p className="text-[11px] text-sky-400 font-medium mt-1">Laboratory & Billing OS</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold shadow-xs'
                      : item.highlight
                      ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Offline Badge & Version */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span>Storage</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
              IndexedDB
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Offline Ready</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">v1.0.0 • Free for GitHub Pages</p>
        </div>
      </aside>
    </>
  );
}
