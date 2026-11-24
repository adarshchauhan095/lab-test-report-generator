# Lab Manager
### Laboratory Management, Test Report Generation & Billing System (Offline-First)

[![Deploy to GitHub Pages](https://github.com/adarshchauhan095/lab-test-report-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/adarshchauhan095/lab-test-report-generator/actions/workflows/deploy.yml)
[![Tests Passing](https://img.shields.io/badge/tests-20%20passed-emerald)](https://github.com/adarshchauhan095/lab-test-report-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Live Demo:** [https://adarshchauhan095.github.io/lab-test-report-generator/](https://adarshchauhan095.github.io/lab-test-report-generator/)  
> **Architecture:** Desktop-first, 100% Offline-First Web Application (Client-Side Database via IndexedDB/Dexie.js). Deployable completely free on GitHub Pages without any backend server or paid API keys.

---

## 🔬 Overview

**Lab Manager** is a production-grade laboratory management, analytical test reporting, invoicing, and billing operating system. Designed for commercial laboratories, quality control facilities, agricultural testing centers, and food inspection agencies.

The application operates **100% offline-first**. All records, test results, customer profiles, audit histories, and configuration settings persist securely in the user's browser using **IndexedDB (via Dexie.js)**. No data leaves the browser, and no backend database or external APIs are required.

---

## 🚀 Key Modules & Capabilities

### 1. Dynamic Multi-Commodity Test Report Engine
- **Multiple Commodities per Report:** A single test certificate can hold multiple commodities (e.g. *Rice Bran*, *Wheat*, *Mustard*), each with independent sample codes, bag quantities, gross/net weights, sample marks, and individual testing parameter tables.
- **IS / ISO Method Binding:** Automatically maps parameters to standard testing standards (e.g., *Oil Content by IS: 7874*, *Free Fatty Acid by ISO 6492*, *Moisture by IS: 3579*, *Protein by IS: 7219*).
- **Independent Subtotals:** Adding or removing commodity sections or parameters calculates testing fees in real-time without cross-polluting neighboring sections.
- **Draft & Formal Revision Workflow:** Supports saving in-progress drafts, issuing finalized certificates, or initiating formal revision workflows with mandatory compliance reasons.

### 2. Professional PDF Generation (jsPDF + AutoTable)
- **Certificate of Analysis (COA):** Publication-grade laboratory certificates formatted for standard A4 printing.
- **Complete Reference Layout:** Company branding, NABL accreditation notice, Job Card #, Vehicle transport details, Customer & Consignee breakdown, structured bordered analysis tables, official seal stamp placeholder, and IT Act disclaimer.
- **Tax Invoices:** Itemized GST invoices generated dynamically from reports or custom service lines with bank account details, UPI ID, and payment terms.

### 3. Transparent Decimal-Safe Billing & Invoicing Engine
- **Accurate Financial Arithmetic:** Decimal-safe currency calculations avoiding floating-point inaccuracies.
- **Complete Billing Breakdown:** Commodity test charges, additional handling fees, configurable discounts, and tax/GST rates.
- **Payment Receipts & Ledgers:** Records receipts across Bank Transfer (NEFT/RTGS), UPI, Cash, and Cheque. Strictly validates against overpayments or negative amounts.

### 4. Advanced Multi-Criteria Combined Filtering
- Filter reports across **10 simultaneous criteria**:
  1. Operator / Creator
  2. Commodity type
  3. Customer / Party
  4. Global search across Report #, Job Card #, Customer, Vehicle, Sample Code
  5. Date Range (Today, Yesterday, Last 7/15/30 Days, This Month, Previous Month, This Year, Custom Date Range)
  6. Date Field selection (Report Date vs. Sample Received Date)
  7. Report Status (Draft, Finalized, Revised, Archived)
  8. Payment Status (Paid, Partially Paid, Unpaid)
  9. Amount Range (Min/Max values)
  10. Sorting & configurable pagination (10, 25, 50, 100 rows).
- Real-time aggregate banners displaying matching record counts, cumulative billing, and mean test values.
- One-click **CSV export** for all filtered views.

### 5. Management Dashboard & Analytics
- Live KPI statistics computed directly from IndexedDB records.
- Interactive **Recharts** visualizations:
  - Monthly Billed Revenue vs. Realized Collections
  - Commodity Distribution (Interactive Pie Chart)
  - Operator Report Production (Horizontal Bar Chart)
  - Customer Receivables & Outstanding Aging Ledger
  - Analytical Parameter Frequency Report

### 6. Offline Data Safety, Backup & Restore
- **Full JSON Database Export & Import:** Export a single JSON snapshot of all database tables.
- **Pre-Import Verification:** Displays record counts before committing changes to IndexedDB.
- **Demo Data Reseed:** Reset button with confirmation dialog to re-populate the realistic demonstration dataset (inspired by ATS/KNL/RB/A-10275 sample for NAMAN INDUSTRIES).

---

## 🛠 Technology Stack

- **Framework:** React 19 with TypeScript
- **Bundler & Tooling:** Vite 8
- **Styling:** Tailwind CSS v4
- **Navigation:** React Router v7 (`HashRouter` for zero-configuration GitHub Pages hosting)
- **Local Database:** IndexedDB via Dexie.js (typed schema with indexes)
- **Form Engine:** React Hook Form + Zod schema validation
- **PDF Engine:** jsPDF & jsPDF-AutoTable
- **Visualizations:** Recharts
- **Date Arithmetic:** date-fns
- **Icons:** Lucide React
- **Test Runner:** Vitest + React Testing Library (20 automated tests passing)

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/adarshchauhan095/lab-test-report-generator.git
cd lab-test-report-generator

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Automated Testing
```bash
# Run unit & validation test suite
npm test
```

### Production Build
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deploying to GitHub Pages Free Hosting

This repository includes an automated GitHub Actions deployment workflow at `.github/workflows/deploy.yml`.

To deploy:
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete Lab Manager offline-first web application"
   git push origin main
   ```
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. The workflow will automatically test, build, and deploy the application to:
   ```
   https://adarshchauhan095.github.io/lab-test-report-generator/
   ```

---

## 📄 License
This project is licensed under the MIT License.
