import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report, Invoice, CompanySettings, ReportSettings, BillingSettings } from '@/types';
import { formatDate, formatCurrency } from '@/utils/formatters';

export async function generateReportPdf(
  report: Report,
  company?: CompanySettings,
  reportSettings?: ReportSettings,
  autoPrint = false
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const compName = company?.name || 'ALPHA TESTING SERVICES & RESEARCH LAB';
  const compTagline =
    company?.tagline || 'Government Approved & NABL Accredited Analytical Testing Laboratory';
  const compAddress =
    company?.address || 'Plot No. 42, Industrial Area, Phase-II, GT Road, Karnal - 132001 (Haryana)';
  const compPhone = company?.phone || '0184-2256789, +91 98765 43210';
  const compEmail = company?.email || 'lab.karnal@alphatesting.org';
  const compGstin = company?.gstin || '06AAACA1234F1Z5';

  // Header Banner
  doc.setFillColor(15, 44, 89); // Deep Navy
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Laboratory Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 44, 89);
  doc.text(compName, pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(compTagline, pageWidth / 2, 18.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`${compAddress} | Phone: ${compPhone} | Email: ${compEmail}`, pageWidth / 2, 22.5, {
    align: 'center',
  });
  doc.text(`GSTIN: ${compGstin}`, pageWidth / 2, 26, { align: 'center' });

  // Thin separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, 28, pageWidth - margin, 28);

  // Certificate / Report Title
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, 30, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 44, 89);
  doc.text('TEST REPORT / CERTIFICATE OF ANALYSIS', pageWidth / 2, 34.8, { align: 'center' });

  // Top Info Box (Report & Party details)
  const leftColX = margin + 2;
  const rightColX = pageWidth / 2 + 2;
  let cursorY = 42;

  // Box border
  doc.setDrawColor(210, 215, 225);
  doc.rect(margin, 38, pageWidth - margin * 2, 42);
  doc.line(pageWidth / 2, 38, pageWidth / 2, 80);

  doc.setFontSize(8);
  // Left Column: Client info
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('ISSUED TO / PARTY NAME:', leftColX, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(report.customerName || 'N/A', leftColX, cursorY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(report.partyName || '-', leftColX, cursorY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('BUYER / CONSIGNEE:', leftColX, cursorY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(report.buyerConsignee || 'Self / In-House Processing', leftColX, cursorY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('VEHICLE / TRANSPORT NO:', leftColX, cursorY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(report.vehicleNumber || 'N/A', leftColX + 45, cursorY + 28);

  doc.text('SAMPLING TYPE:', leftColX, cursorY + 34);
  doc.text(report.samplingType || 'Customer Submitted', leftColX + 45, cursorY + 34);

  // Right Column: Report Numbers & Dates
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('REPORT NUMBER:', rightColX, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text(report.reportNumber, rightColX + 38, cursorY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('JOB CARD NUMBER:', rightColX, cursorY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(report.jobCardNumber, rightColX + 38, cursorY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('SAMPLE RECEIVED DATE:', rightColX, cursorY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(formatDate(report.sampleReceivedDate), rightColX + 38, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('ANALYSIS PERIOD:', rightColX, cursorY + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(
    `${formatDate(report.analysisStartDate)} to ${formatDate(report.analysisEndDate)}`,
    rightColX + 38,
    cursorY + 18
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('REPORT ISSUE DATE:', rightColX, cursorY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(formatDate(report.issueDate), rightColX + 38, cursorY + 24);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('PACKING CONDITION:', rightColX, cursorY + 30);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(report.samplePackingCondition || 'Sealed Pack', rightColX + 38, cursorY + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('REPORT STATUS:', rightColX, cursorY + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(report.status === 'finalized' ? 22 : 180, report.status === 'finalized' ? 101 : 80, 50);
  doc.text(report.status.toUpperCase(), rightColX + 38, cursorY + 36);

  cursorY = 84;

  // Render each commodity section and its parameter results
  for (let i = 0; i < report.commodities.length; i++) {
    const comm = report.commodities[i];

    // Commodity banner
    doc.setFillColor(235, 240, 248);
    doc.rect(margin, cursorY, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 44, 89);
    doc.text(
      `COMMODITY ${i + 1}: ${comm.commodityName.toUpperCase()}`,
      margin + 3,
      cursorY + 4.5
    );

    // Commodity sample meta line
    cursorY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    const metaText = `Sample Code: ${comm.sampleCode || '-'} | Quantity: ${
      comm.quantityPerSample || '-'
    } | Bags: ${comm.numberOfBags || '-'} | Sample Date: ${formatDate(comm.sampleDate)}${
      comm.netWeight ? ` | Net Wt: ${comm.netWeight}` : ''
    }${comm.sampleMark ? ` | Mark: ${comm.sampleMark}` : ''}`;
    doc.text(metaText, margin + 2, cursorY);

    cursorY += 3;

    // Results Table
    const tableBody = comm.testResults.map((r, rIdx) => [
      String(rIdx + 1),
      r.parameterName,
      r.testMethod,
      r.unit,
      r.resultValue,
      r.status || 'CONFORMS',
    ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margin, right: margin },
      head: [['S.No.', 'Test Parameter', 'Test Method', 'Unit', 'Result Value', 'Conformance']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [30, 30, 30],
        lineColor: [210, 215, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 58, 102],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 50, fontStyle: 'bold' },
        2: { cellWidth: 45 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 32, fontStyle: 'bold', textColor: [15, 44, 89] },
        5: { cellWidth: 27, halign: 'center' },
      },
      didDrawPage: () => {
        // Keeps header on next pages if multi-page
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || cursorY + 20;
    cursorY = finalY + 5;
  }

  // Remarks / Declaration Box
  if (report.remarks) {
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text('REMARKS / OBSERVATIONS:', margin, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(report.remarks, margin, cursorY + 4, { maxWidth: pageWidth - margin * 2 });
    cursorY += 10;
  }

  // Page check for footer & signatures
  if (cursorY > pageHeight - 50) {
    doc.addPage();
    cursorY = 20;
  }

  // Signatures & Stamp area
  const sigY = pageHeight - 38;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY - 2, pageWidth - margin, sigY - 2);

  // Prepared by
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Prepared & Analyzed By:', margin + 5, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(report.createdBy || 'Laboratory Analyst', margin + 5, sigY + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Quality Control Division', margin + 5, sigY + 16);

  // Authorized Signatory
  const signatoryName = company?.authorizedSignatoryName || 'Dr. R. K. Sharma';
  const signatoryDesignation =
    company?.authorizedSignatoryDesignation || 'Chief Technical Director';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('For ALPHA TESTING SERVICES & RESEARCH LAB', pageWidth - margin - 65, sigY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 44, 89);
  doc.text(signatoryName, pageWidth - margin - 65, sigY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(signatoryDesignation, pageWidth - margin - 65, sigY + 19);

  // Stamp Box Placeholder
  doc.setDrawColor(180, 190, 210);
  doc.setLineDashPattern([1, 1], 0);
  doc.rect(pageWidth / 2 - 15, sigY + 1, 30, 18);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(6.5);
  doc.setTextColor(160, 170, 190);
  doc.text('OFFICIAL LAB SEAL', pageWidth / 2, sigY + 10, { align: 'center' });

  // Standard Legal Disclaimer in Bottom
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);

    const declText =
      reportSettings?.defaultDeclaration ||
      '1. Results refer only to tested sample. Total liability limited to invoice amount. 2. Report shall not be reproduced without written lab consent.';
    doc.text(declText, margin, pageHeight - 10, { maxWidth: pageWidth - margin * 2 - 30 });

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 15, pageHeight - 8);
  }

  if (autoPrint) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`TestReport_${report.reportNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
  }

  return doc;
}

export async function generateInvoicePdf(
  invoice: Invoice,
  company?: CompanySettings,
  billingSettings?: BillingSettings,
  autoPrint = false
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const compName = company?.name || 'ALPHA TESTING SERVICES & RESEARCH LAB';
  const compAddress =
    company?.address || 'Plot No. 42, Industrial Area, Phase-II, GT Road, Karnal - 132001';
  const compPhone = company?.phone || '+91 98765 43210';
  const compEmail = company?.email || 'accounts@alphatesting.org';
  const compGstin = company?.gstin || '06AAACA1234F1Z5';

  // Navy Top Accent
  doc.setFillColor(15, 44, 89);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 44, 89);
  doc.text(compName, margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(70, 70, 70);
  doc.text(`${compAddress} | Phone: ${compPhone}`, margin, 18.5);
  doc.text(`Email: ${compEmail} | GSTIN: ${compGstin}`, margin, 22.5);

  // TAX INVOICE title right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 44, 89);
  doc.text('TAX INVOICE', pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, pageWidth - margin, 24, { align: 'right' });

  // Border separator
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, 27, pageWidth - margin, 27);

  // Client & Payment Info Box
  doc.rect(margin, 30, pageWidth - margin * 2, 32);
  doc.line(pageWidth / 2, 30, pageWidth / 2, 62);

  // Left side: Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('BILLED TO / CUSTOMER:', margin + 3, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(invoice.customerName, margin + 3, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Linked Reports: ${invoice.reportIds?.join(', ') || 'N/A'}`, margin + 3, 46);

  // Right side: Payment Terms & Dates
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('PAYMENT DETAILS & STATUS:', pageWidth / 2 + 3, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text(`Payment Terms: ${invoice.paymentTerms || 'Due on Receipt'}`, pageWidth / 2 + 3, 40);
  doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, pageWidth / 2 + 3, 45);

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status: ', pageWidth / 2 + 3, 51);
  doc.setTextColor(
    invoice.paymentStatus === 'paid' ? 22 : invoice.paymentStatus === 'partially_paid' ? 180 : 200,
    invoice.paymentStatus === 'paid' ? 120 : 80,
    50
  );
  doc.text(invoice.paymentStatus.toUpperCase().replace('_', ' '), pageWidth / 2 + 28, 51);

  // Invoice Items Table
  const tableData = invoice.items.map((item, idx) => [
    String(idx + 1),
    item.description,
    item.reportNumber || '-',
    String(item.quantity),
    formatCurrency(item.unitPrice),
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    startY: 66,
    margin: { left: margin, right: margin },
    head: [['#', 'Item Description / Analytical Service', 'Ref Report', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 30, 30],
      lineColor: [210, 215, 225],
    },
    headStyles: {
      fillColor: [30, 58, 102],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  // Calculation Breakdown Box on Bottom Right
  const calcBoxX = pageWidth - margin - 75;
  let calcY = finalY + 6;

  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);

  doc.text('Subtotal:', calcBoxX, calcY);
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, calcY, { align: 'right' });

  if (invoice.additionalCharges > 0) {
    calcY += 5;
    doc.text('Additional Charges:', calcBoxX, calcY);
    doc.text(`+ ${formatCurrency(invoice.additionalCharges)}`, pageWidth - margin, calcY, {
      align: 'right',
    });
  }

  if (invoice.discountAmount > 0) {
    calcY += 5;
    doc.setTextColor(200, 40, 40);
    doc.text('Discount Applied:', calcBoxX, calcY);
    doc.text(`- ${formatCurrency(invoice.discountAmount)}`, pageWidth - margin, calcY, {
      align: 'right',
    });
    doc.setTextColor(60, 60, 60);
  }

  calcY += 5;
  doc.text(`GST (${invoice.taxRate}%):`, calcBoxX, calcY);
  doc.text(`+ ${formatCurrency(invoice.taxAmount)}`, pageWidth - margin, calcY, { align: 'right' });

  calcY += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(calcBoxX, calcY - 1, pageWidth - margin, calcY - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 44, 89);
  doc.text('Grand Total:', calcBoxX, calcY + 3);
  doc.text(formatCurrency(invoice.grandTotal), pageWidth - margin, calcY + 3, { align: 'right' });

  calcY += 8;
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('Amount Paid:', calcBoxX, calcY);
  doc.text(formatCurrency(invoice.amountPaid), pageWidth - margin, calcY, { align: 'right' });

  calcY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Balance Due:', calcBoxX, calcY);
  doc.text(formatCurrency(invoice.balanceDue), pageWidth - margin, calcY, { align: 'right' });

  // Bank & UPI details on Left
  const bankX = margin;
  let bankY = finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 44, 89);
  doc.text('BANK REMITTANCE DETAILS:', bankX, bankY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`Bank Name: ${billingSettings?.bankName || 'HDFC Bank Ltd, GT Road Branch'}`, bankX, bankY + 4);
  doc.text(`Account No: ${billingSettings?.accountNumber || '50200012345678'}`, bankX, bankY + 8);
  doc.text(`IFSC Code: ${billingSettings?.ifscCode || 'HDFC0001234'}`, bankX, bankY + 12);
  doc.text(`UPI ID: ${billingSettings?.upiId || 'alphatesting@hdfcbank'}`, bankX, bankY + 16);

  // Footer & Authorisation
  const footerY = pageHeight - 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Authorized Signatory', pageWidth - margin - 40, footerY);
  doc.text('Alpha Testing Services', pageWidth - margin - 40, footerY + 12);

  if (autoPrint) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`Invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
  }

  return doc;
}
