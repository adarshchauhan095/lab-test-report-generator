import { db } from './db';
import type { SunshineReport } from '@/types/sunshine';
import { DEFAULT_DECLARATION } from '@/types/sunshine';

export const initialSunshineReports: SunshineReport[] = [
  {
    id: 'report-ssal-1',
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
        id: 'p-1',
        srNo: 1,
        commodity: 'Rice Bran',
        parameterName: 'Oil content',
        result: '16.5',
      },
      {
        id: 'p-2',
        srNo: 2,
        commodity: 'Rice Bran',
        parameterName: 'Moisture',
        result: '8.4',
      },
      {
        id: 'p-3',
        srNo: 3,
        commodity: 'Rice Bran',
        parameterName: 'Sand / Silica',
        result: '1.2',
      },
    ],
    declaration: DEFAULT_DECLARATION,
    createdAt: '2026-11-24T10:00:00Z',
    updatedAt: '2026-11-24T10:00:00Z',
  },
  {
    id: 'report-ssal-2',
    reportNo: 'SSAL/KNL-2',
    issuedTo: 'Sun Star Agro Ind. (Shamgarh)',
    buyer: 'Ritesh Agro',
    commodity: 'Rice Bran (RB)',
    vehicleNo: 'PB 11 AN 6461',
    noOfBags: '1038',
    netWeight: '519.00 Qtl',
    grossWeight: '725.50 Qtl',
    sampleCode: '11',
    samplePackaging: 'Sealed',
    sampleDate: '2026-11-21',
    sampleReceiveDate: '2026-11-22',
    reportIssueDate: '2026-11-23',
    parameters: [
      {
        id: 'p-201',
        srNo: 1,
        commodity: 'Rice Bran (RB)',
        parameterName: 'Free Fatty Acid (FFA)',
        result: '12.8',
      },
      {
        id: 'p-202',
        srNo: 2,
        commodity: 'Rice Bran (RB)',
        parameterName: 'Oil content',
        result: '17.2',
      },
    ],
    declaration: DEFAULT_DECLARATION,
    createdAt: '2026-11-23T11:30:00Z',
    updatedAt: '2026-11-23T11:30:00Z',
  },
];

export async function initializeSunshineDatabase() {
  try {
    const count = await db.simpleReports.count();
    if (count === 0) {
      await db.simpleReports.bulkAdd(initialSunshineReports);
      console.log('Successfully seeded Sunshine Analytical Lab demo reports');
    }
  } catch (err) {
    console.error('Error seeding Sunshine Analytical Lab reports:', err);
  }
}
