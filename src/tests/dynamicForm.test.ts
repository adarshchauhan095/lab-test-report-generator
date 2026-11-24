import { describe, it, expect } from 'vitest';
import type { ReportCommodityItem, ReportTestResult } from '@/types';

describe('Dynamic Multi-Commodity Data Operations', () => {
  it('should maintain independent subtotals across multiple commodity sections', () => {
    const comm1: ReportCommodityItem = {
      id: 'c1',
      commodityId: 'comm-rice-bran',
      commodityName: 'Rice Bran',
      sampleCode: 'ATS-RB-01',
      sampleDescription: '',
      sampleMark: '',
      numberOfBags: 200,
      quantityPerSample: '100 GM',
      netWeight: '',
      grossWeight: '',
      sampleDate: '2026-09-24',
      testResults: [
        {
          id: 'r1',
          parameterId: 'p1',
          parameterName: 'Oil Content',
          testMethod: 'IS: 7874',
          unit: '%',
          resultValue: '2.46',
          resultType: 'numeric',
          charge: 300,
        },
        {
          id: 'r2',
          parameterId: 'p2',
          parameterName: 'FFA',
          testMethod: 'ISO 6492',
          unit: '%',
          resultValue: '37.41',
          resultType: 'numeric',
          charge: 250,
        },
      ],
      commoditySubtotal: 550,
    };

    const comm2: ReportCommodityItem = {
      id: 'c2',
      commodityId: 'comm-wheat',
      commodityName: 'Wheat',
      sampleCode: 'ATS-WH-02',
      sampleDescription: '',
      sampleMark: '',
      numberOfBags: 500,
      quantityPerSample: '250 GM',
      netWeight: '',
      grossWeight: '',
      sampleDate: '2026-09-24',
      testResults: [
        {
          id: 'r3',
          parameterId: 'p3',
          parameterName: 'Moisture',
          testMethod: 'IS: 3579',
          unit: '%',
          resultValue: '10.5',
          resultType: 'numeric',
          charge: 150,
        },
      ],
      commoditySubtotal: 150,
    };

    const commodities = [comm1, comm2];
    const overallTestingTotal = commodities.reduce(
      (sum, c) => sum + c.testResults.reduce((pSum, r) => pSum + r.charge, 0),
      0
    );

    expect(overallTestingTotal).toBe(700);

    // Removing commodity 1 must not alter commodity 2's parameters or subtotal
    const remainingCommodities = commodities.filter((c) => c.id !== 'c1');
    expect(remainingCommodities.length).toBe(1);
    expect(remainingCommodities[0].commodityName).toBe('Wheat');
    expect(remainingCommodities[0].testResults.length).toBe(1);
    expect(remainingCommodities[0].testResults[0].charge).toBe(150);
  });

  it('should correctly add and remove parameters in a section without affecting other parameters', () => {
    let testResults: ReportTestResult[] = [
      {
        id: 'r1',
        parameterId: 'p1',
        parameterName: 'Oil Content',
        testMethod: 'IS: 7874',
        unit: '%',
        resultValue: '2.46',
        resultType: 'numeric',
        charge: 300,
      },
      {
        id: 'r2',
        parameterId: 'p2',
        parameterName: 'FFA',
        testMethod: 'ISO 6492',
        unit: '%',
        resultValue: '37.41',
        resultType: 'numeric',
        charge: 250,
      },
    ];

    // Add a 3rd parameter
    const newParam: ReportTestResult = {
      id: 'r3',
      parameterId: 'p3',
      parameterName: 'Moisture Content',
      testMethod: 'IS: 3579',
      unit: '%',
      resultValue: '9.82',
      resultType: 'numeric',
      charge: 150,
    };
    testResults = [...testResults, newParam];
    expect(testResults.length).toBe(3);

    // Remove the 1st parameter
    testResults = testResults.filter((r) => r.id !== 'r1');
    expect(testResults.length).toBe(2);
    expect(testResults[0].parameterName).toBe('FFA');
    expect(testResults[1].parameterName).toBe('Moisture Content');
  });
});
