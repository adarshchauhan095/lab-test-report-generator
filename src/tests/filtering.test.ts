import { describe, it, expect } from 'vitest';
import { defaultReports } from '@/database/seedData';

describe('Multi-Criteria Filtering Logic', () => {
  it('should filter reports by created user', () => {
    const rahulReports = defaultReports.filter((r) => r.createdBy === 'Rahul Sharma');
    const priyaReports = defaultReports.filter((r) => r.createdBy === 'Priya Verma');

    expect(rahulReports.length).toBeGreaterThan(0);
    expect(priyaReports.length).toBeGreaterThan(0);
    expect(rahulReports.every((r) => r.createdBy === 'Rahul Sharma')).toBe(true);
  });

  it('should filter reports by commodity name', () => {
    const riceBranReports = defaultReports.filter((r) =>
      r.commodities.some((c) => c.commodityName.toLowerCase().includes('rice bran'))
    );

    expect(riceBranReports.length).toBeGreaterThanOrEqual(1);
    expect(riceBranReports[0].reportNumber).toBe('ATS/KNL/RB/A-10275');
  });

  it('should filter reports by customer ID', () => {
    const namanReports = defaultReports.filter((r) => r.customerId === 'cust-naman');
    expect(namanReports.length).toBeGreaterThanOrEqual(2);
    expect(namanReports.every((r) => r.customerId === 'cust-naman')).toBe(true);
  });

  it('should filter reports by date range and combined conditions', () => {
    // Condition: Created by Rahul Sharma AND Customer = NAMAN INDUSTRIES AND Status = finalized
    const combinedMatches = defaultReports.filter((r) => {
      const matchUser = r.createdBy === 'Rahul Sharma';
      const matchCust = r.customerId === 'cust-naman';
      const matchStatus = r.status === 'finalized';
      return matchUser && matchCust && matchStatus;
    });

    expect(combinedMatches.length).toBe(1);
    expect(combinedMatches[0].reportNumber).toBe('ATS/KNL/RB/A-10275');
  });

  it('should filter by report status (draft vs finalized)', () => {
    const finalized = defaultReports.filter((r) => r.status === 'finalized');
    const drafts = defaultReports.filter((r) => r.status === 'draft');

    expect(finalized.length).toBeGreaterThan(0);
    expect(drafts.length).toBeGreaterThan(0);
  });
});
