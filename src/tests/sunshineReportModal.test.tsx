import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SunshineReportModal } from '../features/sunshine/SunshineReportModal';
import type { SunshineReport } from '@/types/sunshine';

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const sampleReport: SunshineReport = {
  id: 'test-report-1',
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
    {
      id: 'p2',
      srNo: 2,
      commodity: 'Rice Bran 2',
      parameterName: 'Moisture',
      result: '8.4',
    },
  ],
  declaration: '1. The results listed refer only to the tested sample.',
  createdAt: '2026-11-24T10:00:00.000Z',
  updatedAt: '2026-11-24T10:00:00.000Z',
};

describe('SunshineReportModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SunshineReportModal isOpen={false} onClose={() => {}} report={sampleReport} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with lab identity, 13 fields, test parameters, and footer when isOpen is true', () => {
    render(
      <SunshineReportModal isOpen={true} onClose={() => {}} report={sampleReport} />
    );

    // Modal title & report number
    expect(screen.getByText('Test Report Preview')).toBeTruthy();
    expect(screen.getAllByText('SSAL/KNL-1').length).toBeGreaterThan(0);

    // Header lab details
    expect(screen.getByText('SUNSHINE ANALYTICAL LAB.')).toBeTruthy();
    expect(screen.getByText('Advanced Quality Testing & Commercial Analysis Facility')).toBeTruthy();

    // 13 Fields
    expect(screen.getByText('Issued To / Party')).toBeTruthy();
    expect(screen.getByText('Bhwani Rice Mill (karnal)')).toBeTruthy();
    expect(screen.getByText('Buyer / Consignee')).toBeTruthy();
    expect(screen.getByText('Ritesh Agro (khanna)')).toBeTruthy();
    expect(screen.getByText('Commodity / Product')).toBeTruthy();
    expect(screen.getAllByText('Rice Bran').length).toBeGreaterThan(0);
    expect(screen.getByText('Vehicle no.')).toBeTruthy();
    expect(screen.getByText('HR06j3546')).toBeTruthy();
    expect(screen.getByText('No Of Bags.')).toBeTruthy();
    expect(screen.getByText('501')).toBeTruthy();
    expect(screen.getByText('Net weight')).toBeTruthy();
    expect(screen.getByText('250.50 Qtl')).toBeTruthy();
    expect(screen.getByText('Gross weight')).toBeTruthy();
    expect(screen.getByText('350.00 Qtl')).toBeTruthy();
    expect(screen.getByText('Code')).toBeTruthy();
    expect(screen.getByText('23')).toBeTruthy();
    expect(screen.getByText('Sample Packaging condition')).toBeTruthy();
    expect(screen.getByText('Loose / sealed / Taped')).toBeTruthy();
    expect(screen.getByText('Date of sample')).toBeTruthy();
    expect(screen.getByText('2026-11-22')).toBeTruthy();
    expect(screen.getByText('Sample Recive Date')).toBeTruthy();
    expect(screen.getByText('2026-11-23')).toBeTruthy();
    expect(screen.getByText('Date of report Issue')).toBeTruthy();
    expect(screen.getByText('2026-11-24')).toBeTruthy();

    // Test parameters table
    expect(screen.getByText('Analysis Test & Parameters')).toBeTruthy();
    expect(screen.getByText('Oil content')).toBeTruthy();
    expect(screen.getByText('16.5%')).toBeTruthy();
    expect(screen.getByText('Moisture')).toBeTruthy();
    expect(screen.getByText('8.4%')).toBeTruthy();

    // Declaration and signature
    expect(screen.getByText('Declaration / Legal Terms:')).toBeTruthy();
    expect(screen.getByText(/The results listed refer only to the tested sample/i)).toBeTruthy();
    expect(screen.getByText('For SUNSHINE ANALYTICAL LAB.')).toBeTruthy();
    expect(screen.getByText('Authorised Signature')).toBeTruthy();

    // Action buttons
    expect(screen.getByText('Download PDF')).toBeTruthy();
    expect(screen.getByText('Print')).toBeTruthy();
  });

  it('triggers onClose callback when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <SunshineReportModal isOpen={true} onClose={handleClose} report={sampleReport} />
    );

    const closeButtons = screen.getAllByRole('button');
    // Find close button by X icon or click last button
    fireEvent.click(closeButtons[closeButtons.length - 1]);
    expect(handleClose).toHaveBeenCalled();
  });
});
