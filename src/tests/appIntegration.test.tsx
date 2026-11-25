import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IndexedDB database layer for JSDOM test runner
vi.mock('@/database/db', () => ({
  db: {
    simpleReports: {
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      put: vi.fn().mockResolvedValue('ok'),
      delete: vi.fn().mockResolvedValue('ok'),
    },
    reports: {
      toArray: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    users: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    customers: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    commodities: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    testParameters: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    invoices: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    payments: {
      toArray: vi.fn().mockResolvedValue([]),
    },
    companySettings: {
      get: vi.fn().mockResolvedValue(null),
    },
    reportSettings: {
      get: vi.fn().mockResolvedValue(null),
    },
    billingSettings: {
      get: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/database/seedData', () => ({
  initializeDatabase: vi.fn().mockResolvedValue(true),
  defaultUsers: [
    {
      id: 'admin',
      fullName: 'Rahul Sharma',
      username: 'admin',
      role: 'admin',
      mobile: '9876543210',
      email: 'admin@sunshine.org',
      status: 'active',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ],
}));

vi.mock('@/database/seedSunshineData', () => ({
  initializeSunshineDatabase: vi.fn().mockResolvedValue(true),
  initialSunshineReports: [],
}));

describe('Sunshine Analytical Lab - Simple Report System Integration', () => {
  it('mounts the application and renders Sunshine Analytical Lab branding', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getAllByText('SUNSHINE ANALYTICAL LAB.').length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Advanced Quality Testing & Commercial Analysis Facility/i)).toBeTruthy();
  });

  it('renders all 13 core report fields matching the client document format', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Issued To \/ Party/i)).toBeTruthy();
    });

    expect(screen.getByText(/Buyer \/ Consignee/i)).toBeTruthy();
    expect(screen.getByText(/Report No/i)).toBeTruthy();
    expect(screen.getByText(/Commodity \/ Product/i)).toBeTruthy();
    expect(screen.getByText(/Vehicle no\./i)).toBeTruthy();
    expect(screen.getByText(/No Of Bags\./i)).toBeTruthy();
    expect(screen.getByText(/Net weight/i)).toBeTruthy();
    expect(screen.getByText(/Gross weight/i)).toBeTruthy();
    expect(screen.getByText(/Code \(Sample Code\)/i)).toBeTruthy();
    expect(screen.getByText(/Sample Packaging condition/i)).toBeTruthy();
    expect(screen.getByText(/Date of sample/i)).toBeTruthy();
    expect(screen.getByText(/Sample Recive Date/i)).toBeTruthy();
    expect(screen.getByText(/Date of report Issue/i)).toBeTruthy();
  });

  it('renders the Analysis Test & Parameters table and action buttons', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('2. Analysis Test & Parameters Table')).toBeTruthy();
    });

    expect(screen.getByText('Sr no')).toBeTruthy();
    expect(screen.getByText('Category / commodity')).toBeTruthy();
    expect(screen.getByText('Test Parameters')).toBeTruthy();
    expect(screen.getByText('Result (%)')).toBeTruthy();

    // Action buttons
    expect(screen.getAllByText('Save Report').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Download PDF').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preview').length).toBeGreaterThan(0);
  });

  it('renders tab switching controls between form and saved database', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Saved Reports')).toBeTruthy();
    });
    expect(screen.getByText(/New Report Form|Editing Report/)).toBeTruthy();
  });
});
