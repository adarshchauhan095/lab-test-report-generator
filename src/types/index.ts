export type UserRole = 'admin' | 'lab_operator' | 'billing_operator' | 'viewer';

export interface User {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
  mobile: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  mobile: string;
  email: string;
  gstin?: string;
  openingBalance: number;
  notes?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TestParameter {
  id: string;
  commodityId?: string; // Optional: specific to a commodity or generic
  name: string;
  testMethod: string;
  unit: string;
  resultType: 'numeric' | 'text' | 'qualitative';
  defaultCharge: number;
  minLimit?: number | null;
  maxLimit?: number | null;
  status: 'active' | 'inactive';
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commodity {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultUnit: string;
  defaultTaxRate: number;
  status: 'active' | 'inactive';
  defaultParameterIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ReportTestResult {
  id: string;
  parameterId: string;
  parameterName: string;
  testMethod: string;
  unit: string;
  resultValue: string;
  resultType: 'numeric' | 'text' | 'qualitative';
  charge: number;
  minLimit?: number | null;
  maxLimit?: number | null;
  status?: 'PASS' | 'FAIL' | 'CONFORMS' | 'N/A';
  remarks?: string;
}

export interface ReportCommodityItem {
  id: string;
  commodityId: string;
  commodityName: string;
  sampleCode: string;
  sampleDescription: string;
  sampleMark: string;
  numberOfBags: number;
  quantityPerSample: string;
  netWeight: string;
  grossWeight: string;
  sampleDate: string;
  testResults: ReportTestResult[];
  commoditySubtotal: number;
}

export interface ReportFinancials {
  testingCharges: number;
  additionalCharges: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
}

export type ReportStatus = 'draft' | 'finalized' | 'revised' | 'archived';

export interface Report {
  id: string;
  reportNumber: string;
  jobCardNumber: string;
  customerId: string;
  customerName: string;
  partyName: string; // Issued To / Party Name
  buyerConsignee: string; // Buyer / Consignee
  reportDate: string; // YYYY-MM-DD
  issueDate: string; // YYYY-MM-DD
  sampleReceivedDate: string; // YYYY-MM-DD
  analysisStartDate: string; // YYYY-MM-DD
  analysisEndDate: string; // YYYY-MM-DD
  samplingType: string; // e.g. Customer Submitted, Laboratory Collected, Third Party Collected
  samplePackingCondition: string; // e.g. Sealed, Loose, Other
  sampleType: string;
  vehicleNumber: string;
  status: ReportStatus;
  commodities: ReportCommodityItem[];
  remarks: string;
  financials: ReportFinancials;
  invoiceId?: string | null;
  revisionNumber: number;
  revisionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface ReportRevision {
  id: string;
  reportId: string;
  revisionNumber: number;
  revisionDate: string;
  revisedBy: string;
  reason: string;
  snapshot: Report;
}

export interface InvoiceItem {
  id: string;
  reportId?: string;
  reportNumber?: string;
  description: string;
  commodityName?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  reportIds: string[];
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  additionalCharges: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentTerms: string;
  notes?: string;
  status: 'draft' | 'finalized' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'other';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  gstin: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
}

export interface ReportSettings {
  id: string;
  reportNumberPrefix: string;
  jobCardPrefix: string;
  nextReportSequence: number;
  defaultDeclaration: string;
  legalTerms: string;
  disclaimer: string;
}

export interface BillingSettings {
  id: string;
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  invoicePrefix: string;
  nextInvoiceSequence: number;
  paymentReceiptPrefix: string;
  nextReceiptSequence: number;
  paymentTerms: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}
