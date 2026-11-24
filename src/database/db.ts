import Dexie, { type Table } from 'dexie';
import type {
  User,
  Customer,
  Commodity,
  TestParameter,
  Report,
  ReportRevision,
  Invoice,
  Payment,
  CompanySettings,
  ReportSettings,
  BillingSettings,
  ActivityLog,
} from '@/types';

export class LabManagerDatabase extends Dexie {
  users!: Table<User, string>;
  customers!: Table<Customer, string>;
  commodities!: Table<Commodity, string>;
  testParameters!: Table<TestParameter, string>;
  reports!: Table<Report, string>;
  reportRevisions!: Table<ReportRevision, string>;
  invoices!: Table<Invoice, string>;
  payments!: Table<Payment, string>;
  companySettings!: Table<CompanySettings, string>;
  reportSettings!: Table<ReportSettings, string>;
  billingSettings!: Table<BillingSettings, string>;
  activityLogs!: Table<ActivityLog, string>;

  constructor() {
    super('LabManagerDB');

    this.version(1).stores({
      users: 'id, username, role, status, createdAt',
      customers: 'id, customerCode, name, companyName, mobile, status, createdAt',
      commodities: 'id, name, category, status, createdAt',
      testParameters: 'id, name, commodityId, status, createdAt',
      reports: 'id, &reportNumber, &jobCardNumber, customerId, status, reportDate, sampleReceivedDate, createdBy, invoiceId, createdAt',
      reportRevisions: 'id, reportId, revisionNumber, revisionDate',
      invoices: 'id, &invoiceNumber, customerId, paymentStatus, invoiceDate, dueDate, status, createdBy, createdAt',
      payments: 'id, &paymentNumber, invoiceId, customerId, paymentDate, createdAt',
      companySettings: 'id',
      reportSettings: 'id',
      billingSettings: 'id',
      activityLogs: 'id, userId, action, entityType, timestamp',
    });
  }
}

export const db = new LabManagerDatabase();
