import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { initializeDatabase } from './database/seedData';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

import { FEATURE_FLAGS } from './config/features';

// Pages / Feature Views
import { Dashboard } from './features/dashboard/Dashboard';
import { ReportForm } from './features/test-reports/ReportForm';
import { ReportHistory } from './features/test-reports/ReportHistory';
import { CustomerList } from './features/customers/CustomerList';
import { CommodityList } from './features/commodities/CommodityList';
import { ParameterList } from './features/test-parameters/ParameterList';
import { InvoiceList } from './features/invoices/InvoiceList';
import { PaymentsList } from './features/billing/PaymentsList';
import { AnalyticsView } from './features/analytics/AnalyticsView';
import { UserList } from './features/users/UserList';
import { SettingsView } from './features/settings/SettingsView';
import { BackupView } from './features/backup/BackupView';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Database initialization error:', err);
        setIsDbReady(true); // Still proceed to allow offline access
      });
  }, []);

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Initializing offline laboratory database..." />
      </div>
    );
  }

  return (
    <UserProvider>
      <ToastProvider>
        <HashRouter>
          <MainLayout>
            <Routes>
              {FEATURE_FLAGS.dashboard && <Route path="/" element={<Dashboard />} />}
              {FEATURE_FLAGS.reportHistory && <Route path="/reports" element={<ReportHistory />} />}
              {FEATURE_FLAGS.newReport && <Route path="/reports/new" element={<ReportForm />} />}
              {FEATURE_FLAGS.newReport && <Route path="/reports/:id/edit" element={<ReportForm />} />}
              {FEATURE_FLAGS.customers && <Route path="/customers" element={<CustomerList />} />}
              {FEATURE_FLAGS.commodities && <Route path="/commodities" element={<CommodityList />} />}
              {FEATURE_FLAGS.testParameters && <Route path="/test-parameters" element={<ParameterList />} />}
              {FEATURE_FLAGS.billingAndInvoices && <Route path="/invoices" element={<InvoiceList />} />}
              {FEATURE_FLAGS.payments && <Route path="/payments" element={<PaymentsList />} />}
              {FEATURE_FLAGS.analytics && <Route path="/analytics" element={<AnalyticsView />} />}
              {FEATURE_FLAGS.userManagement && <Route path="/users" element={<UserList />} />}
              {FEATURE_FLAGS.settings && <Route path="/settings" element={<SettingsView />} />}
              {FEATURE_FLAGS.backupRestore && <Route path="/backup" element={<BackupView />} />}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </HashRouter>
      </ToastProvider>
    </UserProvider>
  );
}
