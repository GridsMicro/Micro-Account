-- =====================================================
-- Micro-Account: Basic Data Seed Script
-- Restores essential company settings after database reset
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- Restore Company Settings
INSERT INTO company_settings (company_name, tax_id, address, logo_url, phone, email, website) 
VALUES (
  'Micro-Account Professional', 
  '123456789012', 
  '123 Accounting Street, Bangkok, Thailand',
  'https://micro-account.com/logo.png',
  '+66-2-123-4567',
  'contact@micro-account.com',
  'https://micro-account.com'
) 
ON CONFLICT (company_name) DO UPDATE SET 
  tax_id = EXCLUDED.tax_id,
  address = EXCLUDED.address,
  logo_url = EXCLUDED.logo_url,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  website = EXCLUDED.website;

-- Sample Expense Data (for testing dashboard)
INSERT INTO expenses (title, category, amount, expense_date, reference_no, notes, status) 
VALUES 
  ('ค่าเช่าสำนัที่', 'ค่าเช่าสถานที่', 15000.00, CURRENT_DATE - INTERVAL '1 month', 'OFF-2026-001', 'เช่าออฟิศเดือนเมษายน', 'paid'),
  ('ค่าอาหาร', 'ค่าสาธารณูปโภค', 3000.00, CURRENT_DATE - INTERVAL '1 month', 'UTL-2026-001', 'ค่าไฟ้อินเทอร์มือนี้', 'paid'),
  ('ค่าใช้จ่าย', 'ค่าใช้จ่าย', 8000.00, CURRENT_DATE - INTERVAL '1 month', 'EXP-2026-001', 'ค่าน้ำมันและค่าอาหาร', 'paid');

-- Sample Journal Entry (for testing)
INSERT INTO journal_entries (entry_date, journal_type, reference_type, reference_id, description, debit_account_id, credit_account_id, amount, fiscal_year, fiscal_month, document_number, notes) 
VALUES 
  (CURRENT_DATE, 'general', NULL, NULL, 'ทดสอบยอัตโนมัติ', 1111, 4110, 5000.00, EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), 'GJ-2026-001', 'ตรวจสอบยอัตโนมัติ');

-- Verify Data Insertion
DO $$ 
BEGIN
    -- Update company settings verification
    UPDATE company_settings SET updated_at = CURRENT_TIMESTAMP WHERE company_name = 'Micro-Account Professional';
    
    -- Log successful seed
    INSERT INTO journal_entries (entry_date, journal_type, description, debit_account_id, credit_account_id, amount, fiscal_year, fiscal_month, document_number, notes) 
    VALUES (CURRENT_DATE, 'general', 'System seeded successfully', 1111, 4110, 0.01, EXTRACT(YEAR FROM CURRENT_DATE), EXTRACT(MONTH FROM CURRENT_DATE), 'SEED-2026-001', 'Database initialized with basic data');
END $$;

-- Display seed results
SELECT 'Company Settings Seeded' as result, 
       company_name as company,
       tax_id as tax_id,
       expense_count as expenses
FROM company_settings cs
CROSS JOIN LATERAL (
    SELECT COUNT(*) as expense_count FROM expenses
) ON true;
