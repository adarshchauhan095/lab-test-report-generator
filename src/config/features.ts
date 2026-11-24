/**
 * ==============================================================================
 * DEMO & FEATURE FLAGS CONFIGURATION
 * ==============================================================================
 * 
 * FILE PATH: src/config/features.ts
 * 
 * Use this file to show or hide functionalities for client demonstrations.
 * Simply change any value to `true` to SHOW a feature, or `false` to HIDE it.
 * 
 * All underlying code, database schemas, and calculation engines remain intact.
 * When a feature is `false`, it is cleanly hidden from the UI, navigation menus,
 * and dashboard widgets without any broken links or errors.
 * ==============================================================================
 */

export const FEATURE_FLAGS = {
  // ============================================================================
  // MAIN CORE FUNCTIONALITIES (Active for Client Demo)
  // ============================================================================
  
  /**
   * Main Operational Dashboard:
   * Displays laboratory testing KPIs, sample counters, recent reports & activity.
   */
  dashboard: true,

  /**
   * New Report Generator:
   * Dynamic multi-commodity report creation form with real-time test parameters,
   * specifications, method selections, and automated numbering.
   */
  newReport: true,

  /**
   * Report History & Archive:
   * Filterable report register, 10-criteria search, revisions, and one-click
   * Certificate of Analysis PDF export.
   */
  reportHistory: true,

  /**
   * Customer / Party Directory:
   * Registered client ledger with addresses, GSTIN, and linked test reports.
   */
  customers: true,

  // ============================================================================
  // OPTIONAL / ADVANCED FUNCTIONALITIES (Hidden by Default for Simple Demo)
  // Change any flag to `true` whenever you want to demonstrate it to the client!
  // ============================================================================

  /**
   * Commodities Master:
   * Administrative screen to create/edit commodity categories (Rice, Wheat, Oil, etc.).
   * Note: Pre-seeded commodities remain fully available in reports even when false.
   */
  commodities: false,

  /**
   * Test Parameters Master:
   * Administrative screen to configure IS/ISO standard limits, units & methods.
   * Note: Pre-seeded parameters remain fully available in reports even when false.
   */
  testParameters: false,

  /**
   * Billing & Tax Invoices:
   * Automated GST invoice generator, tax breakdown, and professional invoice PDFs.
   */
  billingAndInvoices: false,

  /**
   * Payment Receipts & Ledger:
   * Payment collection logging, modes (NEFT, UPI, Cash), and balance tracking.
   */
  payments: false,

  /**
   * Advanced Analytics:
   * Revenue trends, operator attribution charts, and parameter frequency analysis.
   */
  analytics: false,

  /**
   * User & Role Management:
   * Administrative screen to create users, assign roles (Admin, Lab Operator, Viewer).
   */
  userManagement: false,

  /**
   * System & Lab Settings:
   * Laboratory NABL accreditation header, report prefix sequences, and legal disclaimers.
   */
  settings: false,

  /**
   * Offline Backup & Restore:
   * JSON database export, safe import validation, and demo data re-seeding.
   */
  backupRestore: false,

  /**
   * Top-Bar User Role Switcher:
   * Dropdown in the header allowing switching between demo personas (Admin, Operator).
   */
  userRoleSwitcher: false,
};

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
