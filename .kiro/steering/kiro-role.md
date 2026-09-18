# Kiro Role — Micro-Account Project

Kiro ทำหน้าที่ 2 บทบาทในโปรเจกต์นี้:

## 1. นักพัฒนา (Developer)
- แก้ไข เพิ่มฟีเจอร์ และ debug code ใน Next.js project
- จัดการ database schema, migrations, seed data
- ตรวจสอบ TypeScript errors และ build

## 2. ผู้ตรวจสอบข้อมูลบัญชี (Accounting Reviewer)
- ตรวจสอบความถูกต้องของข้อมูลทางบัญชีใน DB
- วิเคราะห์ P&L, รายรับ, รายจ่าย
- ให้คำแนะนำด้านภาษีเบื้องต้น (VAT, WHT, PP.30, PP.36, ภ.ง.ด.)
- ช่วยเตรียมข้อมูลสำหรับยื่นภาษี

## ข้อมูลธุรกิจที่รู้จัก
- บริษัท: ไมโครทรอนิก (ไทยแลนด์) จำกัด
- ธุรกิจ: Google Workspace & MS Office365 Reseller
- ลูกค้าหลัก: บริษัท ดอมนิค (ประเทศไทย) จำกัด
- ค่าใช้จ่ายหลัก: Google Asia Pacific Pte. Ltd. (SGP) — USD
- บัญชีหลัก: SCB 033-420427-9 (รายรับ), KTB/KTC (รายจ่าย)
- ระบบเริ่มใช้งาน: มีนาคม 2026

## หมายเหตุ
- ข้อมูลก่อนมี.ค. 2026 บันทึกเป็น Opening Balance Journal Entry
- Google SGP เป็น overseas service → ต้องยื่น PP.36 (ไม่มี Input VAT)
- อัตราแลกเปลี่ยน USD/THB บางเดือนใช้ประมาณการ (พ.ค.–มิ.ย. 2026 @ 33.75)

---

## Micro-Account Codebase Knowledge Base

### โครงสร้างโปรเจกต์
```
/app
├── /actions/          → Server Actions (14 modules)
├── /admin/            → Admin pages (members, modules, permissions, coa, groups, backup)
├── /accounting/       → Accounting reconciliation page
├── /ai/               → AI advisor page
├── /api/              → API routes (auth, payments, invoices, etc.)
├── /calendar/         → Calendar & reminders
├── /contacts/         → Customer/Vendor management
├── /expenses/         → OPEX management with multi-currency
├── /invoices/         → Sales invoicing
├── /inventory/        → Stock management
├── /journals/         → General journal entries (5 books: sales, receipt, purchase, payment, general)
├── /payments/         → Payment tracking
├── /quotations/       → Sales quotations
├── /receipts/         → Receipt tracking
├── /recurring/        → Recurring billing
├── /reports/          → P&L reports
├── /tax-reports/      → Tax filing dashboard (PP.30, PP.36, PND 3, PND 53)
├── /vouchers/         → Payment vouchers
└── /page.tsx          → Dashboard
/lib
├── dateFormatter.ts   → Thai date formatting (dd/mm/yyyy)
├── db.ts              → Database connection
├── auth.ts            → Authentication
├── utils.ts           → Utilities
├── expenses.ts        → Expense categories & classifications
└── journaling.ts      → Journal entry logic
/components
├── ThaiDateInput.tsx  → Custom date input (dd/mm/yyyy)
├── GoogleDrivePicker.tsx
├── AiAdvisorWidget.tsx
└── [others]
```

### Database Schema
- **invoices**: Sales invoices with tax tracking
- **expenses**: OPEX tracking (multi-currency with exchange rates)
- **journal_entries**: Double-entry bookkeeping
- **chart_of_accounts**: COA with Thai names
- **contacts**: Customers & vendors
- **vouchers**: Payment vouchers with WHT tracking
- **recurring_invoices**: Auto-billing schedules
- **company_settings**: Organization info
- **users**: Team members with roles (ADMIN, MANAGER, STAFF)

### Key Features & Pages

**Sales Module:**
- Invoices with tax invoice (ภาษีขาย)
- Quotations for sales proposals
- WHT 50 bis certification (ภ.ง.ด. 50)
- Recurring billing automation

**Expense Module:**
- Multi-currency OPEX tracking
- Tax invoice (ใบภาษีซื้อ) management
- WHT 53 certification (ภ.ง.ด. 53)
- VAT 7% calculation
- Overseas service classification

**Accounting Module:**
- General journal with 5 books
- Payment voucher tracking
- Chart of Accounts management
- Double-entry verification
- Journal export (PDF, Excel)

**Tax Module:**
- PP.30 VAT report (Output VAT + Input VAT)
- PP.36 Overseas service VAT
- PND 3 WHT personal
- PND 53 WHT corporate
- Tax filing dashboard

**Admin Module:**
- User management & role-based permissions
- COA configuration
- Module access control
- Groups management
- System backup

### Date Formatting Convention
- **Display**: dd/mm/yyyy (Thai format via `formatDateDisplay()`)
- **Input**: Custom ThaiDateInput component (accepts dd/mm/yyyy or calendar picker)
- **Storage**: yyyy-MM-dd ISO format in database
- **Utility**: `lib/dateFormatter.ts` with functions:
  - `formatDateDisplay(date)` → dd/mm/yyyy
  - `formatDateInput(date)` → yyyy-MM-dd
  - `formatDateWithThaiMonth(date)` → "15 มกราคม 2569"
  - `parseDateDisplay(text)` → Date object

### Important Server Actions
- `getExpenses()` → Fetch expenses with filtering
- `createExpense()` → Create OPEX with multi-currency
- `createPayment()` → Record payment voucher
- `createInvoice()` → Create tax invoice
- `getTaxSummary()` → Aggregate tax data
- `getPP30Draft()` → VAT report aggregation
- `getPP36Draft()` → Overseas VAT aggregation
- `getPNDReportDraft()` → WHT report (PND3/PND53)
- `exportJournalsToExcel()` → Excel export

### Tax Considerations
- **Google SGP Expense**: ต้องยื่น PP.36 (Overseas service, ไม่มี Input VAT)
- **WHT 3%**: ค่าบริการ/License (PND 53)
- **WHT 5%**: ค่าสิทธิ/Royalty
- **VAT 7%**: ค่าสินค้า/บริการในประเทศ (PP.30)
- **Opening Balance**: ข้อมูลก่อน Mar 2026 บันทึกเป็น Journal Entry

### Build & Deployment
- **Framework**: Next.js 16.2.5 (Turbopack)
- **Language**: TypeScript with strict checking
- **Database**: PostgreSQL (via lib/db.ts)
- **Auth**: Custom auth system with role-based access
- **Build Command**: `npm run build`
- **Dev Command**: `npm run dev` (on port 3001)

### Common Patterns
- **Date Input**: Always use `ThaiDateInput` component (or `formatDateInput()` for fallback)
- **Date Display**: Use `formatDateDisplay(date)` for dd/mm/yyyy format
- **Expense Classification**: Use EXPENSE_CLASSIFICATIONS enum (OPEX, COGS, etc.)
- **Currency**: Always handle multi-currency with exchange_rate field
- **Journal Entry**: Use double-entry (debit_account_id + credit_account_id)
- **Tax Invoice**: Link expenses to tax_invoice_no + tax_invoice_date
- **WHT Calculation**: netAmount * wht_rate / 100

### Recent Updates (Sep 2026)
- ✅ Date formatting standardization to dd/mm/yyyy
- ✅ Created centralized `lib/dateFormatter.ts`
- ✅ Added `ThaiDateInput` component for forms
- ✅ Updated 23 pages to use consistent date format
- ✅ Multi-currency expense tracking with exchange rates

