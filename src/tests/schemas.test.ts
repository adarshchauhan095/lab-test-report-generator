import { describe, it, expect } from 'vitest';
import {
  customerSchema,
  commoditySchema,
  testParameterSchema,
  reportFormSchema,
  paymentFormSchema,
} from '@/schemas';

describe('Zod Validation Schemas', () => {
  it('should validate a valid customer object', () => {
    const validCustomer = {
      name: 'Naman Singhal',
      companyName: 'NAMAN INDUSTRIES',
      address: 'Near Old Grain Market',
      city: 'Karnal',
      state: 'Haryana',
      mobile: '9812012345',
      email: 'accounts@naman.com',
      gstin: '06AABCN1234D1Z2',
      openingBalance: 0,
      status: 'active' as const,
    };

    const result = customerSchema.safeParse(validCustomer);
    expect(result.success).toBe(true);
  });

  it('should reject a customer with invalid mobile or empty company name', () => {
    const invalidCustomer = {
      name: 'Naman',
      companyName: '',
      address: 'Karnal',
      city: 'Karnal',
      state: 'Haryana',
      mobile: '123', // too short
      email: 'invalid-email',
    };

    const result = customerSchema.safeParse(invalidCustomer);
    expect(result.success).toBe(false);
  });

  it('should validate commodity schema with default test parameters', () => {
    const validCommodity = {
      name: 'Rice Bran',
      category: 'Agro By-Products',
      defaultUnit: 'Bags',
      defaultTaxRate: 5,
      status: 'active' as const,
      defaultParameterIds: ['param-1', 'param-2'],
    };

    const result = commoditySchema.safeParse(validCommodity);
    expect(result.success).toBe(true);
  });

  it('should validate test parameters with IS/ISO method and numeric bounds', () => {
    const validParam = {
      name: 'Oil Content',
      testMethod: 'IS: 7874 (PART-1-1975)',
      unit: '%',
      resultType: 'numeric' as const,
      defaultCharge: 300,
      minLimit: 1.5,
      maxLimit: 15.0,
      status: 'active' as const,
    };

    const result = testParameterSchema.safeParse(validParam);
    expect(result.success).toBe(true);
  });

  it('should validate a multi-commodity report structure', () => {
    const validReport = {
      reportNumber: 'ATS/KNL/RB/A-10275',
      jobCardNumber: 'ATS/KNL/RB/A-10275',
      customerId: 'cust-1',
      customerName: 'NAMAN INDUSTRIES',
      partyName: 'Naman Industries, Taraori',
      buyerConsignee: 'Self',
      reportDate: '2026-09-24',
      issueDate: '2026-09-24',
      sampleReceivedDate: '2026-09-23',
      analysisStartDate: '2026-09-23',
      analysisEndDate: '2026-09-24',
      samplingType: 'Customer Submitted',
      samplePackingCondition: 'Sealed Polythene Pack',
      sampleType: 'Agricultural By-product',
      vehicleNumber: 'HR-45-B-8971',
      status: 'finalized' as const,
      remarks: 'Conforms to solvent recovery standards',
      financials: {
        testingCharges: 700,
        additionalCharges: 50,
        discountAmount: 0,
        taxRate: 18,
        taxAmount: 135,
        grandTotal: 885,
      },
      commodities: [
        {
          id: 'comm-1',
          commodityId: 'comm-rb',
          commodityName: 'RICE BRAN',
          sampleCode: 'ATS-RB-2026-0924',
          sampleDescription: 'Fresh Golden Brown Rice Bran Sample',
          sampleMark: 'LOT-A1 / 200 BAGS',
          numberOfBags: 200,
          quantityPerSample: '100 GM Approx',
          netWeight: '10.2 MT Approx',
          grossWeight: '10.4 MT Approx',
          sampleDate: '2026-09-22',
          commoditySubtotal: 700,
          testResults: [
            {
              id: 'res-1',
              parameterId: 'param-oil',
              parameterName: 'Oil Content',
              testMethod: 'IS: 7874',
              unit: '%',
              resultValue: '2.46',
              resultType: 'numeric' as const,
              charge: 300,
              status: 'CONFORMS' as const,
            },
            {
              id: 'res-2',
              parameterId: 'param-ffa',
              parameterName: 'Free Fatty Acid (FFA)',
              testMethod: 'ISO 6492',
              unit: '%',
              resultValue: '37.41',
              resultType: 'numeric' as const,
              charge: 250,
              status: 'CONFORMS' as const,
            },
          ],
        },
      ],
    };

    const result = reportFormSchema.safeParse(validReport);
    expect(result.success).toBe(true);
  });

  it('should reject payment with zero or negative amount', () => {
    const invalidPayment = {
      invoiceId: 'inv-1',
      customerId: 'cust-1',
      amount: -50,
      paymentDate: '2026-10-01',
      paymentMethod: 'cash' as const,
      referenceNumber: 'REF123',
    };

    const result = paymentFormSchema.safeParse(invalidPayment);
    expect(result.success).toBe(false);
  });
});
