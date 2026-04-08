-- =====================================================
-- Micro-Account: Neon Journal Schema Migration
-- Purpose:
-- 1. Preserve legacy journal_entries columns
-- 2. Add modern journaling columns required by lib/journaling.ts
-- 3. Create chart_of_accounts with IDs matching account codes used in code
-- Safe to run in Neon SQL Editor
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1) Create chart_of_accounts if missing
-- Important:
-- The application currently writes debit_account_id / credit_account_id
-- using Thai account codes directly (1121, 4110, etc.).
-- So this table must use those codes as PRIMARY KEY ids.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INTEGER PRIMARY KEY,
    account_code VARCHAR(10) UNIQUE NOT NULL,
    account_name_th VARCHAR(255) NOT NULL,
    account_name_en VARCHAR(255),
    account_type VARCHAR(20) NOT NULL,
    account_category VARCHAR(50),
    parent_id INTEGER REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_contra BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO chart_of_accounts (id, account_code, account_name_th, account_name_en, account_type, account_category, description)
VALUES
    (1111, '1111', 'เงินสด', 'Cash on Hand', 'asset', 'balance_sheet', 'Cash on hand'),
    (1112, '1112', 'เงินฝากธนาคารกรุงไทย', 'Bank Deposit - KTB', 'asset', 'balance_sheet', 'Krung Thai Bank'),
    (1113, '1113', 'เงินฝากธนาคารกสิกรไทย', 'Bank Deposit - KBank', 'asset', 'balance_sheet', 'Kasikorn Bank'),
    (1121, '1121', 'ลูกหนี้การค้าทั่วไป', 'Trade Receivables', 'asset', 'balance_sheet', 'Accounts receivable'),
    (1131, '1131', 'วัตถุดิบ', 'Raw Materials', 'asset', 'balance_sheet', 'Inventory / raw materials'),
    (1140, '1140', 'ภาษีซื้อที่นำมาหักลดหย่อนได้', 'Input VAT Deductible', 'asset', 'balance_sheet', 'Input VAT'),
    (2111, '2111', 'เจ้าหนี้การค้าทั่วไป', 'Trade Payables', 'liability', 'balance_sheet', 'Accounts payable'),
    (2121, '2121', 'ภาษีมูลค่าเพิ่มที่ต้องจ่าย', 'VAT Payable', 'liability', 'balance_sheet', 'Output VAT payable'),
    (2130, '2130', 'ภาษีหัก ณ ที่จ่ายที่ต้องจ่าย', 'Withholding Tax Payable', 'liability', 'balance_sheet', 'WHT payable'),
    (2140, '2140', 'เงินเดือนและค่าจ้างที่ต้องจ่าย', 'Wages Payable', 'liability', 'balance_sheet', 'Wages payable'),
    (3110, '3110', 'ทุนจดทะเบียนชำระแล้ว', 'Paid-up Capital', 'equity', 'balance_sheet', 'Paid-up capital'),
    (3200, '3200', 'กำไรสะสม', 'Retained Earnings', 'equity', 'balance_sheet', 'Retained earnings'),
    (4110, '4110', 'รายได้จากการขายสินค้าทั่วไป', 'General Sales Revenue', 'revenue', 'income_statement', 'Sales revenue'),
    (4120, '4120', 'ส่วนลดจากการขาย', 'Sales Discounts', 'revenue', 'income_statement', 'Sales discounts'),
    (4210, '4210', 'ดอกเบี้ยรับ', 'Interest Income', 'revenue', 'income_statement', 'Interest income'),
    (5110, '5110', 'ต้นทุนวัตถุดิบ', 'Raw Material Cost', 'expense', 'income_statement', 'COGS / raw materials'),
    (5210, '5210', 'ค่าโฆษณาและประชาสัมพันธ์', 'Advertising & PR', 'expense', 'income_statement', 'Advertising'),
    (5220, '5220', 'ค่าคอมมิชชั่นขาย', 'Sales Commission', 'expense', 'income_statement', 'Sales commission'),
    (5310, '5310', 'เงินเดือนและค่าจ้าง', 'Salaries and Wages', 'expense', 'income_statement', 'Salaries'),
    (5320, '5320', 'ค่าเช่าสถานที่', 'Rent Expense', 'expense', 'income_statement', 'Rent'),
    (5330, '5330', 'ค่าสาธารณูปโภค', 'Utilities Expense', 'expense', 'income_statement', 'Utilities'),
    (5340, '5340', 'ค่าเสื่อมราคา', 'Depreciation Expense', 'expense', 'income_statement', 'Depreciation'),
    (5410, '5410', 'ดอกเบี้ยจ่าย', 'Interest Expense', 'expense', 'income_statement', 'Interest expense'),
    (5510, '5510', 'ภาษีเงินได้นิติบุคคล', 'Corporate Income Tax', 'expense', 'income_statement', 'Corporate income tax'),
    (5998, '5998', 'ค่าใช้จ่ายเพิ่มค่าน้ำมันกับค่าอาหาร service ลูกค้า', 'Service Extra Expense', 'expense', 'income_statement', 'Service-related expense'),
    (5999, '5999', 'อื่นๆ', 'Other Expense', 'expense', 'income_statement', 'Other expense')
ON CONFLICT (id) DO UPDATE SET
    account_code = EXCLUDED.account_code,
    account_name_th = EXCLUDED.account_name_th,
    account_name_en = EXCLUDED.account_name_en,
    account_type = EXCLUDED.account_type,
    account_category = EXCLUDED.account_category,
    description = EXCLUDED.description,
    is_active = TRUE;

-- -----------------------------------------------------
-- 2) Extend legacy journal_entries table with modern columns
-- Keep old columns: reference_no, account_name, debit, credit
-- -----------------------------------------------------
ALTER TABLE journal_entries
    ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS reference_id INTEGER,
    ADD COLUMN IF NOT EXISTS debit_account_id INTEGER,
    ADD COLUMN IF NOT EXISTS credit_account_id INTEGER,
    ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2),
    ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS withholding_rate DECIMAL(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS withholding_amount DECIMAL(15,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fiscal_year INTEGER,
    ADD COLUMN IF NOT EXISTS fiscal_month INTEGER,
    ADD COLUMN IF NOT EXISTS document_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- -----------------------------------------------------
-- 3) Backfill modern fields from legacy data where possible
-- -----------------------------------------------------
UPDATE journal_entries
SET
    amount = COALESCE(amount, GREATEST(COALESCE(debit, 0), COALESCE(credit, 0))),
    fiscal_year = COALESCE(fiscal_year, EXTRACT(YEAR FROM entry_date)::INTEGER),
    fiscal_month = COALESCE(fiscal_month, EXTRACT(MONTH FROM entry_date)::INTEGER),
    document_number = COALESCE(document_number, reference_no)
WHERE
    amount IS NULL
    OR fiscal_year IS NULL
    OR fiscal_month IS NULL
    OR document_number IS NULL;

-- Map common legacy account names to modern account ids
UPDATE journal_entries
SET debit_account_id = 1121
WHERE debit_account_id IS NULL AND account_name = 'ลูกหนี้การค้า' AND COALESCE(debit, 0) > 0;

UPDATE journal_entries
SET credit_account_id = 1121
WHERE credit_account_id IS NULL AND account_name = 'ลูกหนี้การค้า' AND COALESCE(credit, 0) > 0;

UPDATE journal_entries
SET debit_account_id = 4110
WHERE debit_account_id IS NULL AND account_name = 'รายได้จากการขาย/บริการ' AND COALESCE(debit, 0) > 0;

UPDATE journal_entries
SET credit_account_id = 4110
WHERE credit_account_id IS NULL AND account_name = 'รายได้จากการขาย/บริการ' AND COALESCE(credit, 0) > 0;

UPDATE journal_entries
SET debit_account_id = 2121
WHERE debit_account_id IS NULL AND account_name = 'ภาษีขาย' AND COALESCE(debit, 0) > 0;

UPDATE journal_entries
SET credit_account_id = 2121
WHERE credit_account_id IS NULL AND account_name = 'ภาษีขาย' AND COALESCE(credit, 0) > 0;

UPDATE journal_entries
SET debit_account_id = 1111
WHERE debit_account_id IS NULL AND account_name IN ('เงินสด/ธนาคาร', 'เงินสด') AND COALESCE(debit, 0) > 0;

UPDATE journal_entries
SET credit_account_id = 1111
WHERE credit_account_id IS NULL AND account_name IN ('เงินสด/ธนาคาร', 'เงินสด') AND COALESCE(credit, 0) > 0;

UPDATE journal_entries
SET debit_account_id = 5999
WHERE debit_account_id IS NULL AND COALESCE(debit, 0) > 0 AND account_name NOT IN ('ลูกหนี้การค้า', 'รายได้จากการขาย/บริการ', 'ภาษีขาย', 'เงินสด/ธนาคาร', 'เงินสด');

UPDATE journal_entries
SET credit_account_id = 5999
WHERE credit_account_id IS NULL AND COALESCE(credit, 0) > 0 AND account_name NOT IN ('ลูกหนี้การค้า', 'รายได้จากการขาย/บริการ', 'ภาษีขาย', 'เงินสด/ธนาคาร', 'เงินสด');

-- Infer journal type for old rows if missing
UPDATE journal_entries
SET journal_type = 'general'
WHERE journal_type IS NULL OR journal_type = '';

UPDATE journal_entries
SET journal_type = 'sales'
WHERE journal_type = 'general'
  AND (
      description ILIKE '%ใบแจ้งหนี้%'
      OR description ILIKE '%invoice%'
      OR reference_no ILIKE 'INV%'
  );

UPDATE journal_entries
SET reference_type = COALESCE(reference_type, 'invoice')
WHERE reference_type IS NULL
  AND (
      reference_no ILIKE 'INV%'
      OR document_number ILIKE 'INV%'
  );

-- -----------------------------------------------------
-- 4) Helpful indexes for new journaling flow
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference_type_id
    ON journal_entries(reference_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_document_number
    ON journal_entries(document_number);

CREATE INDEX IF NOT EXISTS idx_journal_entries_fiscal_year_month
    ON journal_entries(fiscal_year, fiscal_month);

CREATE INDEX IF NOT EXISTS idx_journal_entries_debit_account_id
    ON journal_entries(debit_account_id);

CREATE INDEX IF NOT EXISTS idx_journal_entries_credit_account_id
    ON journal_entries(credit_account_id);

COMMIT;

-- -----------------------------------------------------
-- 5) Verification output
-- -----------------------------------------------------
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('journal_entries', 'chart_of_accounts')
  AND column_name IN (
    'reference_no', 'account_name', 'debit', 'credit',
    'reference_type', 'reference_id', 'debit_account_id', 'credit_account_id',
    'amount', 'document_number'
  )
ORDER BY table_name, ordinal_position;
