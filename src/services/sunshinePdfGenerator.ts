import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SunshineReport } from '@/types/sunshine';
import { SUNSHINE_LOGO_BASE64 } from '@/assets/logoBase64';
import { LAB_DETAILS } from '@/types/sunshine';

export function generateSunshinePdf(report: SunshineReport, action: 'download' | 'print' | 'blob' = 'download'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Outer Page Border
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, doc.internal.pageSize.getHeight() - (margin * 2 - 8));

  let currentY = margin;

  // Header Logo (Top-Left)
  try {
    doc.addImage(SUNSHINE_LOGO_BASE64, 'PNG', margin, currentY - 1, 22, 20);
  } catch (err) {
    console.warn('Could not load logo into PDF:', err);
  }

  // Header Lab Information (Center aligned)
  doc.setTextColor(20, 30, 50);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(LAB_DETAILS.name, margin + 26 + (contentWidth - 26) / 2, currentY + 3, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 80, 95);
  doc.text(LAB_DETAILS.tagline, margin + 26 + (contentWidth - 26) / 2, currentY + 8, { align: 'center' });
  doc.text(LAB_DETAILS.address, margin + 26 + (contentWidth - 26) / 2, currentY + 12.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(40, 50, 70);
  doc.text(`Phone: ${LAB_DETAILS.phone}       Email: ${LAB_DETAILS.email}`, margin + 26 + (contentWidth - 26) / 2, currentY + 17, { align: 'center' });

  currentY += 21;

  // Dividing Line
  doc.setDrawColor(40, 60, 90);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, margin + contentWidth, currentY);

  currentY += 4;

  // Title: Test Report
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Test Report', pageWidth / 2, currentY, { align: 'center' });

  currentY += 3;

  // 1. Details Table (Two Columns: Label & Value, matching client excel)
  const detailRows = [
    ['Issued To / Party', report.issuedTo || '-'],
    ['Buyer / Consignee', report.buyer || '-'],
    ['Report No', report.reportNo || '-'],
    ['Commodity / Product', report.commodity || '-'],
    ['Vehicle no.', report.vehicleNo || '-'],
    ['No Of Bags.', report.noOfBags || '-'],
    ['Net weight', report.netWeight || '-'],
    ['Gross weight', report.grossWeight || '-'],
    ['Code', report.sampleCode || '-'],
    ['Sample Packaging condition', report.samplePackaging || '-'],
    ['Date of sample', report.sampleDate || '-'],
    ['Sample Recive Date', report.sampleReceiveDate || '-'],
    ['Date of report Issue', report.reportIssueDate || '-'],
  ];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 1.5,
      textColor: [20, 20, 20],
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      font: 'helvetica',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
    },
    body: detailRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // 2. Title for Parameters Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Analysis Test & Parameters', margin, currentY);

  currentY += 2;

  // 3. Parameters Table
  const paramRows = (report.parameters && report.parameters.length > 0)
    ? report.parameters.map((p, idx) => [
        p.srNo || idx + 1,
        p.commodity || report.commodity || '-',
        p.parameterName || '-',
        p.result ? `${p.result}%` : '-',
      ])
    : [[1, report.commodity || 'Sample', 'Test', '-']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['Sr no', 'Category / commodity', 'Test Parameters', 'Result (%)']],
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      textColor: [20, 20, 20],
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      font: 'helvetica',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 60 },
      2: { cellWidth: 65 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 'auto' },
    },
    body: paramRows,
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Ensure footer fits on current page or add page
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = margin + 5;
  }

  // 4. Footer: Declaration / Legal terms & Authorised Signature
  const footerWidth = contentWidth;
  const leftColWidth = footerWidth * 0.65;
  const rightColWidth = footerWidth * 0.35;

  // Left: Legal Declaration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Declaration / Legal Terms:', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  const declarationText = report.declaration || 
    '1. The results listed refer only to the tested sample. 2. Liability limited to invoiced amount. 3. This report cannot be reproduced wholly or in part without approval.';
  const splitDeclaration = doc.splitTextToSize(declarationText, leftColWidth - 4);
  doc.text(splitDeclaration, margin, currentY + 4);

  // Right: Signature Box
  const rightColX = margin + leftColWidth;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 40, 60);
  doc.text('For SUNSHINE ANALYTICAL LAB.', rightColX + rightColWidth / 2, currentY, { align: 'center' });

  // Signature space
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Authorised Signature', rightColX + rightColWidth / 2, currentY + 16, { align: 'center' });

  // Handle Action
  const filename = `${report.reportNo.replace(/[^a-zA-Z0-9_-]/g, '_')}_Test_Report.pdf`;
  if (action === 'download') {
    doc.save(filename);
  } else if (action === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  }

  return doc;
}
