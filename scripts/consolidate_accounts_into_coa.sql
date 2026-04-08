-- =====================================================
-- Consolidation: accounts -> chart_of_accounts
-- Safe additive migration. Does not delete legacy data.
-- =====================================================

BEGIN;

ALTER TABLE chart_of_accounts
ADD COLUMN IF NOT EXISTS legacy_code VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS ux_chart_of_accounts_legacy_code
ON chart_of_accounts(legacy_code)
WHERE legacy_code IS NOT NULL;

UPDATE chart_of_accounts SET legacy_code = '1101' WHERE account_code::text = '1111';
UPDATE chart_of_accounts SET legacy_code = '1102' WHERE account_code::text IN ('1110', '1112') AND legacy_code IS NULL;
UPDATE chart_of_accounts SET legacy_code = '1103' WHERE account_code::text = '1121';
UPDATE chart_of_accounts SET legacy_code = '2101' WHERE account_code::text = '2111';
UPDATE chart_of_accounts SET legacy_code = '2102' WHERE account_code::text = '1140';
UPDATE chart_of_accounts SET legacy_code = '4101' WHERE account_code::text = '4110';
UPDATE chart_of_accounts SET legacy_code = '5101' WHERE account_code::text = '5110';
UPDATE chart_of_accounts SET legacy_code = '5201' WHERE account_code::text = '5310';

INSERT INTO chart_of_accounts (
  account_code,
  account_name_th,
  account_name_en,
  account_type,
  account_category,
  description,
  legacy_code,
  is_active
) VALUES
('2103', 'เจ้าหนี้บริการ', 'Service Payable', 'liability', 'balance_sheet', 'หนี้ค้างจ่ายสำหรับค่าบริการ', '2103', TRUE),
('5111', 'ต้นทุนบริการ', 'Cost of Services', 'expense', 'income_statement', 'ต้นทุนโดยตรงของงานบริการ', NULL, TRUE),
('5331', 'ค่าซอฟต์แวร์ / ค่าบริการ IT', 'Software and IT Services Expense', 'expense', 'income_statement', 'ค่าใช้จ่ายซอฟต์แวร์และบริการ IT', NULL, TRUE),
('5332', 'ค่าส่งพัสดุ', 'Shipping Fee Expense', 'expense', 'income_statement', 'ค่าขนส่งพัสดุและค่าจัดส่ง', '5202', TRUE),
('5333', 'ค่ารับรอง', 'Entertainment Expense', 'expense', 'income_statement', 'ค่าใช้จ่ายเพื่อการรับรอง', '5203', TRUE),
('5334', 'ค่าวัสดุสำนักงาน', 'Office Supply Expense', 'expense', 'income_statement', 'ค่าใช้จ่ายวัสดุสำนักงาน', '5204', TRUE),
('5411', 'ค่าธรรมเนียมธนาคาร', 'Bank Fee Expense', 'expense', 'income_statement', 'ค่าธรรมเนียมและค่าบริการธนาคาร', '5205', TRUE)
ON CONFLICT (account_code) DO UPDATE
SET
  account_name_th = EXCLUDED.account_name_th,
  account_name_en = EXCLUDED.account_name_en,
  account_type = EXCLUDED.account_type,
  account_category = EXCLUDED.account_category,
  description = EXCLUDED.description,
  legacy_code = COALESCE(chart_of_accounts.legacy_code, EXCLUDED.legacy_code),
  is_active = TRUE;

COMMIT;
