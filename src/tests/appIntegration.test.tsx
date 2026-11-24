import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

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

  it('renders core navigation items and dashboard widgets', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('New Report').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Report History').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Customers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Commodities').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Test Parameters').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Billing & Invoices').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Payments').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Analytics').length).toBeGreaterThan(0);
    expect(screen.getAllByText('User Management').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Backup & Restore').length).toBeGreaterThan(0);
  });

  it('renders user role badge and identity selector in header', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Rahul Sharma')).toBeTruthy();
    });
    expect(screen.getByText('Administrator')).toBeTruthy();
  });
});
