import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { FEATURE_FLAGS } from '../config/features';

// Polyfill ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('App End-to-End Integration Tests', () => {
  it('mounts the application and renders navigation branding', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Lab Manager')).toBeTruthy();
    });
    expect(screen.getByText('Laboratory & Billing OS')).toBeTruthy();
  });

  it('renders only enabled main navigation items for client demo', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });

    // Enabled main features
    expect(screen.getAllByText('New Report').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Report History').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Customers').length).toBeGreaterThan(0);

    // Verify hidden features are absent from sidebar navigation when disabled
    if (!FEATURE_FLAGS.billingAndInvoices) {
      expect(screen.queryByText('Billing & Invoices')).toBeNull();
    }
    if (!FEATURE_FLAGS.commodities) {
      expect(screen.queryByText('Commodities')).toBeNull();
    }
    if (!FEATURE_FLAGS.testParameters) {
      expect(screen.queryByText('Test Parameters')).toBeNull();
    }
    if (!FEATURE_FLAGS.backupRestore) {
      expect(screen.queryByText('Backup & Restore')).toBeNull();
    }
    if (!FEATURE_FLAGS.userManagement) {
      expect(screen.queryByText('User Management')).toBeNull();
    }
    if (!FEATURE_FLAGS.settings) {
      expect(screen.queryByText('Settings')).toBeNull();
    }
  });

  it('renders user role badge and identity in header', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Rahul Sharma')).toBeTruthy();
    });
    expect(screen.getByText('Administrator')).toBeTruthy();
  });
});
