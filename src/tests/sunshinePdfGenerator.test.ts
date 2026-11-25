import { describe, it, expect } from 'vitest';
import { generateSunshinePdf } from '../services/sunshinePdfGenerator';
import type { SunshineReport } from '../types/sunshine';
import { DEFAULT_DECLARATION } from '../types/sunshine';

describe('Sunshine PDF Generator Unit Tests', () => {
  const sampleReport: SunshineReport = {
    id: 'test-1',
    reportNo: 'SSAL/KNL-1',
    issuedTo: 'Bhwani Rice Mill (karnal)',
    buyer: 'Ritesh Agro (khanna)',
    commodity: 'Rice Bran',
    vehicleNo: 'HR06j3546',
    noOfBags: '501',
    netWeight: '250.50 Qtl',
    grossWeight: '350.00 Qtl',
    sampleCode: '23',
    samplePackaging: 'Loose / sealed / Taped',
    sampleDate: '2026-11-22',
    sampleReceiveDate: '2026-11-23',
    reportIssueDate: '2026-11-24',
    parameters: [
      {
        id: 'p1',
        srNo: 1,
        commodity: 'Rice Bran',
        parameterName: 'Oil content',
        result: '16.5',
      },
    ],
    declaration: DEFAULT_DECLARATION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('generates a valid jsPDF document object without throwing errors', () => {
    const doc = generateSunshinePdf(sampleReport, 'blob');
    expect(doc).toBeTruthy();
    expect(Math.round(doc.internal.pageSize.getWidth())).toBe(210); // A4 portrait width in mm
    expect(Math.round(doc.internal.pageSize.getHeight())).toBe(297); // A4 portrait height in mm
  });

  it('handles reports with multiple parameters', () => {
    const multiParamReport: SunshineReport = {
      ...sampleReport,
      parameters: [
        { id: '1', srNo: 1, commodity: 'Rice Bran', parameterName: 'Oil content', result: '16.5' },
        { id: '2', srNo: 2, commodity: 'Rice Bran', parameterName: 'Moisture', result: '8.2' },
        { id: '3', srNo: 3, commodity: 'Rice Bran', parameterName: 'FFA', result: '11.4' },
      ],
    };

    const doc = generateSunshinePdf(multiParamReport, 'blob');
    expect(doc).toBeTruthy();
  });

  it('handles empty parameter array gracefully without crashing', () => {
    const emptyParamReport: SunshineReport = {
      ...sampleReport,
      parameters: [],
    };

    const doc = generateSunshinePdf(emptyParamReport, 'blob');
    expect(doc).toBeTruthy();
  });
});
