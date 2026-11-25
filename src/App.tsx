import { useEffect, useState } from 'react';
import { initializeDatabase } from './database/seedData';
import { initializeSunshineDatabase } from './database/seedSunshineData';
import { ToastProvider } from './context/ToastContext';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { SunshineMainView } from './features/sunshine/SunshineMainView';

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    Promise.all([
      initializeDatabase().catch((e) => console.warn('Old db seed warning:', e)),
      initializeSunshineDatabase().catch((e) => console.warn('Sunshine seed warning:', e)),
    ])
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('Database initialization error:', err);
        setIsDbReady(true); // Still proceed to allow offline access
      });
  }, []);

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Initializing Sunshine Analytical Lab system..." />
      </div>
    );
  }

  return (
    <ToastProvider>
      <SunshineMainView />
    </ToastProvider>
  );
}
