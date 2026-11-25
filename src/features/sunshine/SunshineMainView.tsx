import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/database/db';
import type { SunshineReport } from '@/types/sunshine';
import { SunshineReportForm } from './SunshineReportForm';
import { SunshineReportList } from './SunshineReportList';
import { SUNSHINE_LOGO_BASE64 } from '@/assets/logoBase64';
import { LAB_DETAILS } from '@/types/sunshine';
import { FilePlus, Database, Phone, Mail, MapPin } from 'lucide-react';

export function SunshineMainView() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [editingReport, setEditingReport] = useState<SunshineReport | null>(null);

  // Live count of reports with safe catch
  const totalReportsCount =
    useLiveQuery(async () => {
      try {
        return await db.simpleReports.count();
      } catch {
        return 0;
      }
    }, []) || 0;

  const handleEditReport = (report: SunshineReport) => {
    setEditingReport(report);
    setActiveTab('create');
  };

  const handleNewReport = () => {
    setEditingReport(null);
    setActiveTab('create');
  };

  const handleReportSaved = () => {
    // Optionally switch to list or keep on form
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16">
      {/* Top Laboratory Brand Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Lab Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={SUNSHINE_LOGO_BASE64}
                alt="Sunshine Analytical Lab Logo"
                className="max-h-10 max-w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                  {LAB_DETAILS.name}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  OFFLINE READY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {LAB_DETAILS.tagline} • Phone: {LAB_DETAILS.phone}
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={handleNewReport}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <FilePlus className="w-4 h-4" />
              <span>{editingReport ? 'Editing Report' : 'New Report Form'}</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Saved Reports</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'list' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {totalReportsCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {activeTab === 'create' ? (
          <SunshineReportForm
            initialReport={editingReport}
            onSaved={handleReportSaved}
            onCancelEdit={() => setEditingReport(null)}
          />
        ) : (
          <SunshineReportList
            onEditReport={handleEditReport}
            onNewReport={handleNewReport}
          />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400">
        <p>
          {LAB_DETAILS.name} • {LAB_DETAILS.address} • Email: {LAB_DETAILS.email}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Simple Laboratory Test Report Generator • 100% Offline with Persistent Local Storage
        </p>
      </footer>
    </div>
  );
}
