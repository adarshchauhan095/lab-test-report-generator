import { useState, useEffect } from 'react';
import { db } from '@/database/db';
import { initializeDatabase } from '@/database/seedData';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import {
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
} from 'lucide-react';
import { formatDate } from '@/utils/formatters';

export function BackupView() {
  const { can, refreshUsers } = useUser();
  const { success, error, info } = useToast();

  const [storageInfo, setStorageInfo] = useState<{ usage: string; quota: string } | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem('labmanager_last_backup') || null;
  });

  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (usage !== undefined && quota !== undefined) {
          setStorageInfo({
            usage: (usage / (1024 * 1024)).toFixed(2) + ' MB',
            quota: (quota / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
          });
        }
      });
    }
  }, []);

  // 1. Export Complete Database as JSON
  const handleExportJSON = async () => {
    try {
      setIsProcessing(true);
      const [
        users,
        customers,
        commodities,
        testParameters,
        reports,
        reportRevisions,
        invoices,
        payments,
        companySettings,
        reportSettings,
        billingSettings,
        activityLogs,
      ] = await Promise.all([
        db.users.toArray(),
        db.customers.toArray(),
        db.commodities.toArray(),
        db.testParameters.toArray(),
        db.reports.toArray(),
        db.reportRevisions.toArray(),
        db.invoices.toArray(),
        db.payments.toArray(),
        db.companySettings.toArray(),
        db.reportSettings.toArray(),
        db.billingSettings.toArray(),
        db.activityLogs.toArray(),
      ]);

      const backupData = {
        app: 'Lab Manager',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tables: {
          users,
          customers,
          commodities,
          testParameters,
          reports,
          reportRevisions,
          invoices,
          payments,
          companySettings,
          reportSettings,
          billingSettings,
          activityLogs,
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `LabManager_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem('labmanager_last_backup', now);
      setLastBackupDate(now);

      success('Backup Created', `Full database backup exported to ${filename}.`);
    } catch (err: any) {
      error('Export Failed', err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Select & Parse JSON File for Import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.tables || !parsed.app) {
          throw new Error('Invalid backup file structure. Missing "tables" or "app" header.');
        }

        const counts = {
          reports: parsed.tables.reports?.length || 0,
          customers: parsed.tables.customers?.length || 0,
          commodities: parsed.tables.commodities?.length || 0,
          testParameters: parsed.tables.testParameters?.length || 0,
          invoices: parsed.tables.invoices?.length || 0,
          payments: parsed.tables.payments?.length || 0,
          users: parsed.tables.users?.length || 0,
        };

        setImportPreview({ data: parsed, counts });
        setIsImportConfirmOpen(true);
      } catch (err: any) {
        error('Invalid Backup File', err?.message || 'Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 3. Confirm Import & Restore
  const handleConfirmImport = async () => {
    if (!importPreview?.data?.tables) return;
    try {
      setIsProcessing(true);
      const tables = importPreview.data.tables;

      await db.transaction(
        'rw',
        [
          db.users,
          db.customers,
          db.commodities,
          db.testParameters,
          db.reports,
          db.reportRevisions,
          db.invoices,
          db.payments,
          db.companySettings,
          db.reportSettings,
          db.billingSettings,
          db.activityLogs,
        ],
        async () => {
          if (tables.users) await db.users.bulkPut(tables.users);
          if (tables.customers) await db.customers.bulkPut(tables.customers);
          if (tables.commodities) await db.commodities.bulkPut(tables.commodities);
          if (tables.testParameters) await db.testParameters.bulkPut(tables.testParameters);
          if (tables.reports) await db.reports.bulkPut(tables.reports);
          if (tables.reportRevisions) await db.reportRevisions.bulkPut(tables.reportRevisions);
          if (tables.invoices) await db.invoices.bulkPut(tables.invoices);
          if (tables.payments) await db.payments.bulkPut(tables.payments);
          if (tables.companySettings) await db.companySettings.bulkPut(tables.companySettings);
          if (tables.reportSettings) await db.reportSettings.bulkPut(tables.reportSettings);
          if (tables.billingSettings) await db.billingSettings.bulkPut(tables.billingSettings);
          if (tables.activityLogs) await db.activityLogs.bulkPut(tables.activityLogs);
        }
      );

      await refreshUsers();
      success('Database Restored', 'All records have been imported and synchronized.');
      setIsImportConfirmOpen(false);
      setImportPreview(null);
    } catch (err: any) {
      error('Import Failed', err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Reset Demo Data
  const handleResetDemoData = async () => {
    try {
      setIsProcessing(true);
      await initializeDatabase(true);
      await refreshUsers();
      success('Database Reseeded', 'Default demonstration records have been refreshed.');
      setIsResetConfirmOpen(false);
    } catch (err: any) {
      error('Reset Failed', err?.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Backup & Data Safety</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export your offline laboratory records to JSON, restore backups, or reset demonstration data
        </p>
      </div>

      {/* Offline Storage Notice Box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-900">
            Important Information on Offline-First Browser Persistence
          </p>
          <p className="text-amber-800 leading-relaxed">
            All records in this demonstration are stored locally in your browser’s encrypted IndexedDB storage.
            Data persists across refreshes and restarts on this device. Since this application runs without a backend
            on GitHub Pages, data does not automatically synchronize across other devices unless you export a JSON backup
            and restore it there.
          </p>
        </div>
      </div>

      {/* Storage & Backup Status Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-lg border border-sky-100">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Browser Storage Allocation
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {storageInfo ? `${storageInfo.usage} used` : 'IndexedDB Active'}
            </p>
            <p className="text-[11px] text-slate-400">
              {storageInfo ? `Allocated quota: ${storageInfo.quota}` : 'Offline persistence ready'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Last Backup Timestamp
            </span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {lastBackupDate ? formatDate(lastBackupDate, 'dd/MM/yyyy hh:mm a') : 'No backup taken yet'}
            </p>
            <p className="text-[11px] text-slate-400">Recommended weekly to prevent browser cache clearing</p>
          </div>
        </div>
      </div>

      {/* Backup & Restore Action Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Export Full Database Backup</h3>
              <p className="text-xs text-slate-500">Download a complete snapshot of all tables as a JSON file</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Includes all customers, commodities, parameters, report history, revisions, invoices, payments,
            and system settings. Can be imported into any browser or used for offline safe-keeping.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={handleExportJSON}
            isLoading={isProcessing}
            className="w-full"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Backup (JSON)</span>
          </Button>
        </div>

        {/* Import Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Restore Database from Backup</h3>
              <p className="text-xs text-slate-500">Upload a previously exported Lab Manager JSON file</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Validates file integrity and provides a detailed summary of records before committing changes.
            Existing duplicate records will be safely updated without wiping unrelated tables.
          </p>
          <label className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 shadow-sm cursor-pointer transition-colors gap-2">
            <Upload className="w-4 h-4 text-purple-600" />
            <span>Select JSON Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset Demo Data Zone */}
      <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-900">Reset & Reseed Demonstration Data</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Replaces existing records with the clean, NABL-compliant demo dataset (Naman Industries, Sunrise Agro, ATS certificates).
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsResetConfirmOpen(true)}
            isLoading={isProcessing}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Demo Data</span>
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <ConfirmDialog
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={handleResetDemoData}
          title="Reset Database to Demonstration State?"
          message="Are you sure you want to reset the database? This will clear all existing custom records and restore the default laboratory demo test reports, customers, and invoice samples."
          confirmLabel="Yes, Reset Database"
          variant="danger"
          isLoading={isProcessing}
        />
      )}

      {/* Import Confirmation Preview Dialog */}
      {isImportConfirmOpen && importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Preview Database Import Summary</h3>
            <p className="text-xs text-slate-500 mt-1">
              File verified: <strong>{importPreview.data.app}</strong> (Exported on {formatDate(importPreview.data.exportedAt)})
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Reports to restore:</span>
                <span className="font-bold text-sky-800">{importPreview.counts.reports}</span>
              </div>
              <div className="flex justify-between">
                <span>Customers to restore:</span>
                <span className="font-bold text-sky-800">{importPreview.counts.customers}</span>
              </div>
              <div className="flex justify-between">
                <span>Commodities to restore:</span>
                <span className="font-bold text-sky-800">{importPreview.counts.commodities}</span>
              </div>
              <div className="flex justify-between">
                <span>Test Parameters:</span>
                <span className="font-bold text-sky-800">{importPreview.counts.testParameters}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoices:</span>
                <span className="font-bold text-sky-800">{importPreview.counts.invoices}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Receipts:</span>
                <span className="font-bold text-sky-800">{importPreview.counts.payments}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsImportConfirmOpen(false);
                  setImportPreview(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmImport}
                isLoading={isProcessing}
              >
                Confirm & Restore Records
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
