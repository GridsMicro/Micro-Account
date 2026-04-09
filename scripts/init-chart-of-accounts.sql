-- Standard Chart of Accounts for Microtronics (Thailand)
-- Era 2: Standardized Coding

INSERT INTO chart_of_accounts (id, account_code, account_name_th, account_name_en, account_type) VALUES
(1111, '1111', 'เงินสด', 'Cash', 'asset'),
(1112, '1112', 'เงินฝากธนาคาร', 'Bank Deposit', 'asset'),
(1121, '1121', 'ลูกหนี้การค้า', 'Accounts Receivable', 'asset'),
(1131, '1131', 'ภาษีซื้อ', 'Input VAT', 'asset'),
(1132, '1132', 'ภาษีซื้อรอใบกำกับ', 'Deferred Input VAT', 'asset'),
(1141, '1141', 'ภาษีเงินได้ถูกหัก ณ ที่จ่าย', 'Withholding Tax Receivable', 'asset'),
(2121, '2121', 'เจ้าหนี้การค้า', 'Accounts Payable', 'liability'),
(2131, '2131', 'ภาษีขาย', 'Output VAT', 'liability'),
(2141, '2141', 'ภาษีหัก ณ ที่จ่ายรอนำส่ง', 'Withholding Tax Payable', 'liability'),
(3111, '3111', 'ทุนจดทะเบียน', 'Authorized Capital', 'equity'),
(4111, '4111', 'รายได้หลัก/ค่า License', 'Main Revenue / Licensing', 'revenue'),
(5111, '5111', 'ต้นทุนขาย/บริการ', 'Cost of Goods Sold', 'expense'),
(5211, '5211', 'ค่าใช้จ่ายดำเนินงาน', 'Operating Expenses', 'expense'),
(6111, '6111', 'กำไรสะสม', 'Retained Earnings', 'equity')
ON CONFLICT (account_code) DO UPDATE SET 
    account_name_th = EXCLUDED.account_name_th,
    account_type = EXCLUDED.account_type;
