/**
 * Decimal-safe monetary calculations to avoid IEEE 754 floating-point inaccuracies
 */

export function roundTo2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export interface CalculationInput {
  testingCharges: number;
  additionalCharges?: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface CalculationResult {
  testingCharges: number;
  additionalCharges: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
}

export function calculateBilling({
  testingCharges,
  additionalCharges = 0,
  discountAmount = 0,
  taxRate = 0,
}: CalculationInput): CalculationResult {
  const cleanTesting = roundTo2(Math.max(0, testingCharges || 0));
  const cleanAdditional = roundTo2(Math.max(0, additionalCharges || 0));
  const cleanDiscount = roundTo2(Math.max(0, discountAmount || 0));
  const cleanTaxRate = roundTo2(Math.max(0, Math.min(100, taxRate || 0)));

  // Taxable cannot be negative
  const grossSubtotal = roundTo2(cleanTesting + cleanAdditional);
  const taxableAmount = roundTo2(Math.max(0, grossSubtotal - cleanDiscount));
  const taxAmount = roundTo2((taxableAmount * cleanTaxRate) / 100);
  const grandTotal = roundTo2(taxableAmount + taxAmount);

  return {
    testingCharges: cleanTesting,
    additionalCharges: cleanAdditional,
    discountAmount: cleanDiscount,
    taxableAmount,
    taxRate: cleanTaxRate,
    taxAmount,
    grandTotal,
  };
}

export function calculateOutstanding(grandTotal: number, amountPaid: number): {
  balanceDue: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
} {
  const cleanTotal = roundTo2(Math.max(0, grandTotal || 0));
  const cleanPaid = roundTo2(Math.max(0, amountPaid || 0));
  const balanceDue = roundTo2(Math.max(0, cleanTotal - cleanPaid));

  let paymentStatus: 'unpaid' | 'partially_paid' | 'paid' = 'unpaid';
  if (cleanPaid >= cleanTotal && cleanTotal > 0) {
    paymentStatus = 'paid';
  } else if (cleanPaid > 0) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  return { balanceDue, paymentStatus };
}
