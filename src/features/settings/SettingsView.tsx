import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '@/database/db';
import { Button } from '@/components/common/Button';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/context/ToastContext';
import { Building2, FileText, Receipt, Save } from 'lucide-react';
import type { CompanySettings, ReportSettings, BillingSettings } from '@/types';

export function SettingsView() {
  const { can, currentUser } = useUser();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'company' | 'report' | 'billing'>('company');

  const { register: regCompany, handleSubmit: handleCompanySubmit, reset: resetCompany } =
    useForm<CompanySettings>();

  const { register: regReport, handleSubmit: handleReportSubmit, reset: resetReport } =
    useForm<ReportSettings>();

  const { register: regBilling, handleSubmit: handleBillingSubmit, reset: resetBilling } =
    useForm<BillingSettings>();

  useEffect(() => {
    db.companySettings.get('default').then((c) => c && resetCompany(c));
    db.reportSettings.get('default').then((r) => r && resetReport(r));
    db.billingSettings.get('default').then((b) => b && resetBilling(b));
  }, [resetCompany, resetReport, resetBilling]);

  const onSaveCompany = async (data: CompanySettings) => {
    try {
      await db.companySettings.put({ ...data, id: 'default' });
      await db.activityLogs.add({
        id: 'log-' + Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        action: 'SETTINGS_UPDATED',
        entityType: 'CompanySettings',
        entityId: 'default',
        details: 'Updated laboratory profile and legal signatory information',
        timestamp: new Date().toISOString(),
      });
      success('Company Settings Saved', 'Laboratory details updated and will reflect in all new PDFs.');
    } catch (err: any) {
      error('Failed to save settings', err?.message);
    }
  };

  const onSaveReport = async (data: ReportSettings) => {
    try {
      await db.reportSettings.put({ ...data, id: 'default' });
      success('Report Settings Saved', 'Report numbering formats and disclaimers updated.');
    } catch (err: any) {
      error('Failed to save report settings', err?.message);
    }
  };

  const onSaveBilling = async (data: BillingSettings) => {
    try {
      await db.billingSettings.put({ ...data, id: 'default' });
      success('Billing Settings Saved', 'Tax rates, invoice prefixes and remittance details updated.');
    } catch (err: any) {
      error('Failed to save billing settings', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Laboratory Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure laboratory credentials, NABL accreditation, certificate disclaimers, and invoice remittance
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-2.5 flex items-center gap-2 cursor-pointer ${
            activeTab === 'company' ? 'border-b-2 border-sky-600 text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Laboratory & Accreditation</span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`pb-2.5 flex items-center gap-2 cursor-pointer ${
            activeTab === 'report' ? 'border-b-2 border-sky-600 text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Report Numbering & Legal Terms</span>
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`pb-2.5 flex items-center gap-2 cursor-pointer ${
            activeTab === 'billing' ? 'border-b-2 border-sky-600 text-sky-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Billing, Tax & Banking</span>
        </button>
      </div>

      {/* COMPANY SETTINGS */}
      {activeTab === 'company' && (
        <form onSubmit={handleCompanySubmit(onSaveCompany)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Laboratory Branding & Contact Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Laboratory / Company Name</label>
              <input
                {...regCompany('name')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline / Accreditation</label>
              <input
                {...regCompany('tagline')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
            <input
              {...regCompany('address')}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                {...regCompany('city')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
              <input
                {...regCompany('state')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                {...regCompany('pincode')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                {...regCompany('phone')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
              <input
                {...regCompany('mobile')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
              <input
                {...regCompany('gstin')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                {...regCompany('email')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website</label>
              <input
                {...regCompany('website')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Signatory Name</label>
              <input
                {...regCompany('authorizedSignatoryName')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Signatory Designation</label>
              <input
                {...regCompany('authorizedSignatoryDesignation')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" size="sm" disabled={!can('manage_settings')}>
              <Save className="w-4 h-4" />
              <span>Save Laboratory Profile</span>
            </Button>
          </div>
        </form>
      )}

      {/* REPORT SETTINGS */}
      {activeTab === 'report' && (
        <form onSubmit={handleReportSubmit(onSaveReport)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Report Numbering & Legal Disclaimers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Report Number Prefix</label>
              <input
                {...regReport('reportNumberPrefix')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Card Prefix</label>
              <input
                {...regReport('jobCardPrefix')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Report Sequence</label>
              <input
                type="number"
                {...regReport('nextReportSequence')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Report Declaration</label>
            <textarea
              {...regReport('defaultDeclaration')}
              rows={3}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Retention Terms</label>
            <textarea
              {...regReport('legalTerms')}
              rows={2}
              className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" size="sm" disabled={!can('manage_settings')}>
              <Save className="w-4 h-4" />
              <span>Save Report Settings</span>
            </Button>
          </div>
        </form>
      )}

      {/* BILLING SETTINGS */}
      {activeTab === 'billing' && (
        <form onSubmit={handleBillingSubmit(onSaveBilling)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
            Invoice Formats, GST & Bank Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
              <input
                {...regBilling('currencySymbol')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default GST Rate (%)</label>
              <input
                type="number"
                step="any"
                {...regBilling('defaultTaxRate')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix</label>
              <input
                {...regBilling('invoicePrefix')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Invoice Sequence</label>
              <input
                type="number"
                {...regBilling('nextInvoiceSequence')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Prefix</label>
              <input
                {...regBilling('paymentReceiptPrefix')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
              <input
                {...regBilling('paymentTerms')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name & Branch</label>
              <input
                {...regBilling('bankName')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                {...regBilling('accountNumber')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                {...regBilling('ifscCode')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">UPI ID</label>
              <input
                {...regBilling('upiId')}
                className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-500 border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" size="sm" disabled={!can('manage_settings')}>
              <Save className="w-4 h-4" />
              <span>Save Billing Settings</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
