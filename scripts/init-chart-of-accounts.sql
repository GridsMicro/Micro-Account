-- =====================================================
-- Micro-Account: Chart of Accounts (COA) Initialization
-- Standard Thai Accounting System for SMEs
-- =====================================================

-- Create chart_of_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(10) UNIQUE NOT NULL,
    account_name_th VARCHAR(100) NOT NULL,
    account_name_en VARCHAR(100),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    account_category VARCHAR(50) NOT NULL,
    parent_id INTEGER REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    is_contra BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Standard Chart of Accounts for Thai SMEs
INSERT INTO chart_of_accounts (account_code, account_name_th, account_name_en, account_type, account_category, description) VALUES
-- Assets (สินทรัพย์)
('1000', 'สินทรัพย์', 'Assets', 'asset', 'balance_sheet', 'รวมสินทรัพย์ทั้งหมด'),
('1100', 'สินทรัพย์หมุนเวียน', 'Current Assets', 'asset', 'balance_sheet', 'สินทรัพย์ที่สามารถแปลงเป็นเงินสดได้ภายใน 1 ปี'),
('1110', 'เงินสดและเงินฝากธนาคาร', 'Cash and Bank Accounts', 'asset', 'balance_sheet', 'เงินสดในมือและเงินฝากธนาคาร'),
('1111', 'เงินสด', 'Cash on Hand', 'asset', 'balance_sheet', 'เงินสดในที่ทำการ'),
('1112', 'เงินฝากธนาคารกรุงไทย', 'Bank Deposit - KTB', 'asset', 'balance_sheet', 'เงินฝากธนาคารกรุงไทย'),
('1113', 'เงินฝากธนาคารกสิกรไทย', 'Bank Deposit - KBank', 'asset', 'balance_sheet', 'เงินฝากธนาคารกสิกรไทย'),
('1120', 'ลูกหนี้การค้า', 'Accounts Receivable', 'asset', 'balance_sheet', 'ลูกหนี้จากการขายเครดิต'),
('1121', 'ลูกหนี้การค้าทั่วไป', 'Trade Receivables', 'asset', 'balance_sheet', 'ลูกหนี้จากการขายสินค้า'),
('1130', 'สินค้าคงเหลือ', 'Inventory', 'asset', 'balance_sheet', 'สินค้าที่คงเหลือในคลัง'),
('1131', 'วัตถุดิบ', 'Raw Materials', 'asset', 'balance_sheet', 'วัตถุดิบสำหรับผลิตสินค้า'),
('1132', 'สินค้าสำเร็จรูป', 'Finished Goods', 'asset', 'balance_sheet', 'สินค้าที่ผลิตเสร็จพร้อมขาย'),
('1140', 'ภาษีซื้อที่นำมาหักลดหย่อนได้', 'Input VAT Deductible', 'asset', 'balance_sheet', 'ภาษีมูลค่าเพิ่มที่นำมาหักลดหย่อนได้'),
('1200', 'สินทรัพย์ไม่หมุนเวียน', 'Non-Current Assets', 'asset', 'balance_sheet', 'สินทรัพย์ที่ใช้งานนานกว่า 1 ปี'),
('1210', 'ที่ดิน สิ่งปลูกสร้าง และอุปกรณ์', 'Property, Plant & Equipment', 'asset', 'balance_sheet', 'สิ่งปลูกสร้างและอุปกรณ์ถาวร'),
('1211', 'อาคารสำนักงาน', 'Office Building', 'asset', 'balance_sheet', 'อาคารที่ใช้ทำสำนักงาน'),
('1212', 'รถยนต์', 'Motor Vehicles', 'asset', 'balance_sheet', 'รถยนต์ที่ใช้ในกิจการ'),

-- Liabilities (หนี้สิน)
('2000', 'หนี้สิน', 'Liabilities', 'liability', 'balance_sheet', 'รวมหนี้สินทั้งหมด'),
('2100', 'หนี้สินหมุนเวียน', 'Current Liabilities', 'liability', 'balance_sheet', 'หนี้สินที่ต้องชำระภายใน 1 ปี'),
('2110', 'เจ้าหนี้การค้า', 'Accounts Payable', 'liability', 'balance_sheet', 'เจ้าหนี้จากการซื้อเครดิต'),
('2111', 'เจ้าหนี้การค้าทั่วไป', 'Trade Payables', 'liability', 'balance_sheet', 'เจ้าหนี้จากการซื้อสินค้า'),
('2120', 'ภาษีมูลค่าเพิ่มที่ต้องจ่าย', 'VAT Payable', 'liability', 'balance_sheet', 'ภาษีมูลค่าเพิ่มที่ต้องชำระแก่กรมสรรพากร'),
('2130', 'ภาษีหัก ณ ที่จ่ายที่ต้องจ่าย', 'Withholding Tax Payable', 'liability', 'balance_sheet', 'ภาษีหัก ณ ที่จ่ายที่ต้องชำระ'),
('2140', 'เงินเดือนและค่าจ้างที่ต้องจ่าย', 'Wages Payable', 'liability', 'balance_sheet', 'เงินเดือนและค่าจ้างที่ค้างจ่าย'),

-- Equity (ส่วนของเจ้าของ)
('3000', 'ส่วนของเจ้าของ', 'Equity', 'equity', 'balance_sheet', 'ส่วนของเจ้าของกิจการ'),
('3100', 'ทุนจดทะเบียน', 'Share Capital', 'equity', 'balance_sheet', 'ทุนจดทะเบียนของบริษัท'),
('3110', 'ทุนจดทะเบียนชำระแล้ว', 'Paid-up Capital', 'equity', 'balance_sheet', 'ทุนที่ผู้ถือหุ้นชำระแล้ว'),
('3200', 'กำไรสะสม', 'Retained Earnings', 'equity', 'balance_sheet', 'กำไรที่สะสมมาจากกิจการ'),
('3300', 'งบกำไรขาดทุนรวม', 'Comprehensive Income', 'equity', 'balance_sheet', 'รายการทุนอื่นๆ'),

-- Revenue (รายได้)
('4000', 'รายได้', 'Revenue', 'revenue', 'income_statement', 'รวมรายได้ทั้งหมด'),
('4100', 'รายได้จากการขายสินค้า', 'Sales Revenue', 'revenue', 'income_statement', 'รายได้จากการขายสินค้าและบริการ'),
('4110', 'รายได้จากการขายสินค้าทั่วไป', 'General Sales Revenue', 'revenue', 'income_statement', 'รายได้หลักจากการขายสินค้า'),
('4120', 'ส่วนลดจากการขาย', 'Sales Discounts', 'revenue', 'income_statement', 'ส่วนลดที่ให้แก่ลูกค้า'),
('4200', 'รายได้อื่นๆ', 'Other Revenue', 'revenue', 'income_statement', 'รายได้นอกเหนือจากการขายสินค้า'),
('4210', 'ดอกเบี้ยรับ', 'Interest Income', 'revenue', 'income_statement', 'ดอกเบี้ยที่ได้รับจากเงินฝาก'),

-- Expenses (ค่าใช้จ่าย)
('5000', 'ค่าใช้จ่าย', 'Expenses', 'expense', 'income_statement', 'รวมค่าใช้จ่ายทั้งหมด'),
('5100', 'ต้นทุนขายสินค้า', 'Cost of Goods Sold', 'expense', 'income_statement', 'ต้นทุนของสินค้าที่ขาย'),
('5110', 'ต้นทุนวัตถุดิบ', 'Raw Material Cost', 'expense', 'income_statement', 'ต้นทุนของวัตถุดิบที่ใช้ในการผลิต'),
('5120', 'ต้นทุนสินค้าสำเร็จรูป', 'Finished Goods Cost', 'expense', 'income_statement', 'ต้นทุนของสินค้าที่ขาย'),
('5200', 'ค่าใช้จ่ายในการขาย', 'Selling Expenses', 'expense', 'income_statement', 'ค่าใช้จ่ายเกี่ยวกับการขายและการตลาด'),
('5210', 'ค่าโฆษณาและประชาสัมพันธ์', 'Advertising & PR', 'expense', 'income_statement', 'ค่าโฆษณาและประชาสัมพันธ์'),
('5220', 'ค่าคอมมิชชันขาย', 'Sales Commission', 'expense', 'income_statement', 'ค่าคอมมิชชันที่จ่ายให้พนักงานขาย'),
('5300', 'ค่าใช้จ่ายในการบริหาร', 'Administrative Expenses', 'expense', 'income_statement', 'ค่าใช้จ่ายสำนักงานและบริหาร'),
('5310', 'เงินเดือนและค่าจ้าง', 'Salaries and Wages', 'expense', 'income_statement', 'เงินเดือนพนักงานและค่าจ้าง'),
('5320', 'ค่าเช่าสถานที่', 'Rent Expense', 'expense', 'income_statement', 'ค่าเช่าสำนักงานและโกดัง'),
('5330', 'ค่าสาธารณูปโภค', 'Utilities Expense', 'expense', 'income_statement', 'ค่าไฟฟ้า น้ำ โทรศัพท์'),
('5340', 'ค่าเสื่อมราคา', 'Depreciation Expense', 'expense', 'income_statement', 'ค่าเสื่อมราคาสินทรัพย์ถาวร'),
('5400', 'ค่าใช้จ่ายทางการเงิน', 'Financial Expenses', 'expense', 'income_statement', 'ค่าใช้จ่ายดอกเบี้ยและธนาคาร'),
('5410', 'ดอกเบี้ยจ่าย', 'Interest Expense', 'expense', 'income_statement', 'ดอกเบี้ยที่จ่ายให้ธนาคาร'),
('5500', 'ภาษี', 'Taxes', 'expense', 'income_statement', 'ภาษีต่างๆ ที่ต้องจ่าย'),
('5510', 'ภาษีเงินได้นิติบุคคล', 'Corporate Income Tax', 'expense', 'income_statement', 'ภาษีเงินได้ซึ่งต้องจ่ายแก่กรมสรรพากร')
ON CONFLICT (account_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_coa_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_coa_category ON chart_of_accounts(account_category);
CREATE INDEX IF NOT EXISTS idx_coa_active ON chart_of_accounts(is_active);

-- Verify COA initialization
SELECT 
    account_type,
    COUNT(*) as account_count,
    STRING_AGG(account_code, ', ' ORDER BY account_code) as accounts
FROM chart_of_accounts 
WHERE is_active = TRUE
GROUP BY account_type 
ORDER BY account_type;
