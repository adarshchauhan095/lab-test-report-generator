import { z } from 'zod';

export const userSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  role: z.enum(['admin', 'lab_operator', 'billing_operator', 'viewer']),
  mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
  email: z.string().email('Valid email address required'),
  status: z.enum(['active', 'inactive']),
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Contact name is required'),
  companyName: z.string().min(2, 'Company / Party name is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  mobile: z.string().min(10, 'Valid 10-digit mobile number is required'),
  email: z.string().email('Valid email address is required').or(z.literal('')),
  gstin: z.string().optional(),
  openingBalance: z.coerce.number().min(0, 'Opening balance cannot be negative').default(0),
  notes: z.string().optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

export const testParameterSchema = z.object({
  commodityId: z.string().optional(),
  name: z.string().min(2, 'Parameter name is required'),
  testMethod: z.string().min(2, 'Test method is required (e.g. IS: 7874)'),
  unit: z.string().min(1, 'Measurement unit is required (e.g. %, ppm)'),
  resultType: z.enum(['numeric', 'text', 'qualitative']).default('numeric'),
  defaultCharge: z.coerce.number().min(0, 'Charge must be zero or positive').default(0),
  minLimit: z.coerce.number().nullable().optional(),
  maxLimit: z.coerce.number().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  remarks: z.string().optional(),
});

export const commoditySchema = z.object({
  name: z.string().min(2, 'Commodity name is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().optional(),
  defaultUnit: z.string().min(1, 'Default unit is required (e.g. MT, Bags)'),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(5),
  status: z.enum(['active', 'inactive']).default('active'),
  defaultParameterIds: z.array(z.string()).default([]),
});

export const reportTestResultSchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  parameterName: z.string().min(1, 'Parameter name is required'),
  testMethod: z.string().min(1, 'Test method is required'),
  unit: z.string().default(''),
  resultValue: z.string().min(1, 'Result value is required'),
  resultType: z.enum(['numeric', 'text', 'qualitative']).default('numeric'),
  charge: z.coerce.number().min(0).default(0),
  minLimit: z.coerce.number().nullable().optional(),
  maxLimit: z.coerce.number().nullable().optional(),
  status: z.enum(['PASS', 'FAIL', 'CONFORMS', 'N/A']).optional(),
  remarks: z.string().optional(),
});

export const reportCommodityItemSchema = z.object({
  id: z.string(),
  commodityId: z.string().min(1, 'Commodity selection is required'),
  commodityName: z.string().min(1, 'Commodity name is required'),
  sampleCode: z.string().min(1, 'Sample code is required'),
  sampleDescription: z.string().default(''),
  sampleMark: z.string().default(''),
  numberOfBags: z.coerce.number().min(0).default(0),
  quantityPerSample: z.string().min(1, 'Quantity per sample required (e.g. 100 GM Approx)'),
  netWeight: z.string().default(''),
  grossWeight: z.string().default(''),
  sampleDate: z.string().min(1, 'Sample date is required'),
  testResults: z.array(reportTestResultSchema).min(1, 'At least one test parameter is required'),
  commoditySubtotal: z.coerce.number().min(0).default(0),
});

export const reportFormSchema = z.object({
  reportNumber: z.string().min(1, 'Report number is required'),
  jobCardNumber: z.string().min(1, 'Job card number is required'),
  customerId: z.string().min(1, 'Customer selection is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  partyName: z.string().default(''),
  buyerConsignee: z.string().default(''),
  reportDate: z.string().min(1, 'Report date is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  sampleReceivedDate: z.string().min(1, 'Sample received date is required'),
  analysisStartDate: z.string().min(1, 'Analysis start date is required'),
  analysisEndDate: z.string().min(1, 'Analysis end date is required'),
  samplingType: z.string().default('Customer Submitted'),
  samplePackingCondition: z.string().default('Sealed'),
  sampleType: z.string().default('Commodity Sample'),
  vehicleNumber: z.string().default(''),
  status: z.enum(['draft', 'finalized', 'revised', 'archived']).default('draft'),
  commodities: z.array(reportCommodityItemSchema).min(1, 'At least one commodity section is required'),
  remarks: z.string().default(''),
  financials: z.object({
    testingCharges: z.coerce.number().min(0).default(0),
    additionalCharges: z.coerce.number().min(0).default(0),
    discountAmount: z.coerce.number().min(0).default(0),
    taxRate: z.coerce.number().min(0).max(100).default(0),
    taxAmount: z.coerce.number().min(0).default(0),
    grandTotal: z.coerce.number().min(0).default(0),
  }),
});

export const invoiceItemSchema = z.object({
  id: z.string(),
  reportId: z.string().optional(),
  reportNumber: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  commodityName: z.string().optional(),
  quantity: z.coerce.number().min(1).default(1),
  unit: z.string().default('Service'),
  unitPrice: z.coerce.number().min(0).default(0),
  amount: z.coerce.number().min(0).default(0),
});

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  reportIds: z.array(z.string()).default([]),
  items: z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
  subtotal: z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  additionalCharges: z.coerce.number().min(0).default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  grandTotal: z.coerce.number().min(0).default(0),
  paymentTerms: z.string().default('Due on receipt'),
  notes: z.string().optional(),
  status: z.enum(['draft', 'finalized', 'cancelled']).default('draft'),
});

export const paymentFormSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  customerId: z.string().min(1, 'Customer is required'),
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'upi', 'cheque', 'other']),
  referenceNumber: z.string().min(1, 'Reference / Transaction / UTR number is required'),
  notes: z.string().optional(),
});

export const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  tagline: z.string().default(''),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  phone: z.string().default(''),
  mobile: z.string().min(10, 'Mobile number is required'),
  email: z.string().email('Valid email is required'),
  website: z.string().default(''),
  gstin: z.string().default(''),
  logoUrl: z.string().optional(),
  stampUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
  authorizedSignatoryName: z.string().min(2, 'Signatory name required'),
  authorizedSignatoryDesignation: z.string().min(2, 'Signatory designation required'),
});

export const reportSettingsSchema = z.object({
  reportNumberPrefix: z.string().default('ATS/KNL/RB/A-'),
  jobCardPrefix: z.string().default('ATS/KNL/RB/A-'),
  nextReportSequence: z.coerce.number().min(1).default(10276),
  defaultDeclaration: z.string().min(10, 'Declaration text required'),
  legalTerms: z.string().min(10, 'Legal terms required'),
  disclaimer: z.string().min(10, 'Disclaimer text required'),
});

export const billingSettingsSchema = z.object({
  currencySymbol: z.string().default('₹'),
  currencyCode: z.string().default('INR'),
  defaultTaxRate: z.coerce.number().min(0).max(100).default(18),
  invoicePrefix: z.string().default('INV-'),
  nextInvoiceSequence: z.coerce.number().min(1).default(1001),
  paymentReceiptPrefix: z.string().default('REC-'),
  nextReceiptSequence: z.coerce.number().min(1).default(1001),
  paymentTerms: z.string().default('Payment within 15 days of invoice date'),
  bankName: z.string().default(''),
  accountNumber: z.string().default(''),
  ifscCode: z.string().default(''),
  upiId: z.string().default(''),
});
