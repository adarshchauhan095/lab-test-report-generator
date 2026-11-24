import { describe, it, expect } from 'vitest';
import { calculateBilling, calculateOutstanding, roundTo2 } from '@/services/billingEngine';

describe('Billing Engine & Monetary Arithmetic', () => {
  it('should round numbers to 2 decimal places accurately without floating point errors', () => {
    // 0.1 + 0.2 in JS is 0.30000000000000004
    expect(roundTo2(0.1 + 0.2)).toBe(0.3);
    expect(roundTo2(10.255)).toBe(10.26);
    expect(roundTo2(10.254)).toBe(10.25);
  });

  it('should correctly calculate subtotal, taxable amount, tax, and grand total', () => {
    const result = calculateBilling({
      testingCharges: 700,
      additionalCharges: 50,
      discountAmount: 0,
      taxRate: 18,
    });

    expect(result.testingCharges).toBe(700);
    expect(result.additionalCharges).toBe(50);
    expect(result.discountAmount).toBe(0);
    expect(result.taxableAmount).toBe(750);
    expect(result.taxAmount).toBe(135); // 750 * 0.18 = 135
    expect(result.grandTotal).toBe(885);
  });

  it('should correctly calculate with discount applied', () => {
    const result = calculateBilling({
      testingCharges: 1000,
      additionalCharges: 100,
      discountAmount: 100,
      taxRate: 18,
    });

    // Subtotal: 1000 + 100 = 1100. Taxable: 1100 - 100 = 1000. Tax: 180. Grand: 1180.
    expect(result.taxableAmount).toBe(1000);
    expect(result.taxAmount).toBe(180);
    expect(result.grandTotal).toBe(1180);
  });

  it('should calculate outstanding balance and payment statuses correctly', () => {
    // Unpaid
    const res1 = calculateOutstanding(885, 0);
    expect(res1.balanceDue).toBe(885);
    expect(res1.paymentStatus).toBe('unpaid');

    // Partially Paid
    const res2 = calculateOutstanding(885, 300);
    expect(res2.balanceDue).toBe(585);
    expect(res2.paymentStatus).toBe('partially_paid');

    // Fully Paid
    const res3 = calculateOutstanding(885, 885);
    expect(res3.balanceDue).toBe(0);
    expect(res3.paymentStatus).toBe('paid');

    // Overpayment clamped to 0 balance
    const res4 = calculateOutstanding(885, 900);
    expect(res4.balanceDue).toBe(0);
    expect(res4.paymentStatus).toBe('paid');
  });

  it('should handle zero charges and boundary conditions gracefully', () => {
    const res = calculateBilling({
      testingCharges: 0,
      additionalCharges: 0,
      discountAmount: 0,
      taxRate: 0,
    });

    expect(res.grandTotal).toBe(0);
    expect(res.taxAmount).toBe(0);
    expect(res.taxableAmount).toBe(0);
  });
});
