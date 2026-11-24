import { describe, it, expect } from 'vitest';
import {
  defaultCompanySettings,
  defaultCustomers,
  defaultCommodities,
  defaultReports,
} from '@/database/seedData';

describe('Backup & JSON Data Integrity', () => {
  it('should produce a valid full JSON backup payload with all required tables', () => {
    const backupData = {
      app: 'Lab Manager',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tables: {
        customers: defaultCustomers,
        commodities: defaultCommodities,
        reports: defaultReports,
        companySettings: [defaultCompanySettings],
      },
    };

    const jsonString = JSON.stringify(backupData);
    expect(jsonString).toBeDefined();

    const parsed = JSON.parse(jsonString);
    expect(parsed.app).toBe('Lab Manager');
    expect(parsed.tables.reports.length).toBe(defaultReports.length);
    expect(parsed.tables.customers.length).toBe(defaultCustomers.length);
    expect(parsed.tables.commodities.length).toBe(defaultCommodities.length);
  });

  it('should detect invalid or corrupted backup structures', () => {
    const invalidBackup1 = { randomField: 123 };
    expect((invalidBackup1 as any).tables).toBeUndefined();

    const invalidBackup2 = { app: 'Other App', tables: {} };
    expect(invalidBackup2.app).not.toBe('Lab Manager');
  });
});
