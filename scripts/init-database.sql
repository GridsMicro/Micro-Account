-- =====================================================
-- Micro-Account: Database Initialization Script
-- Creates all required tables with proper schema
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- Company Settings Table
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Micro-Account',
    tax_id VARCHAR(50) NOT NULL DEFAULT '',
    address TEXT,
    logo_url TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chart of Accounts Table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code INTEGER NOT NULL UNIQUE,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    parent_account_id INTEGER REFERENCES chart_of_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert Standard COA Accounts
INSERT INTO chart_of_accounts (account_code, account_name, account_type) VALUES
(1111, 'เงินสด', 'asset'),
(1112, 'ธนาคารกรุงไทย', 'asset'),
(1113, 'ธนาคารกสิกรไทย', 'asset'),
(1121, 'ลูกหนี้การค้า', 'asset'),
(1131, 'สินค้าคงเหลือ', 'asset'),
(1140, 'ภาษีซื้อที่นำมาหักลดหย่อนได้', 'asset'),
(2111, 'เจ้าหนี้การค้า', 'liability'),
(2121, 'ภาษีมูลค่าเพิ่มที่ต้องจ่าย', 'liability'),
(2130, 'ภาษีหัก ณ ที่จ่ายที่ต้องจ่าย', 'liability'),
(2140, 'เงินเดือนที่ต้องจ่าย', 'liability'),
(3110, 'ทุนจดทะเบียนชำระแล้ว', 'equity'),
(3200, 'กำไรสะสม', 'equity'),
(4110, 'รายได้จากการขายสินค้า', 'revenue'),
(4120, 'ส่วนลดจากการขาย', 'revenue'),
(4210, 'ดอกเบี้ยรับ', 'revenue'),
(5110, 'ต้นทุนขายสินค้า', 'expense'),
(5210, 'ค่าโฆษณาและประชาสัมพันธ์', 'expense'),
(5220, 'ค่าคอมมิชชันขาย', 'expense'),
(5310, 'เงินเดือนและค่าจ้าง', 'expense'),
(5320, 'ค่าเช่าสถานที่', 'expense'),
(5330, 'ค่าสาธารณูปโภค', 'expense'),
(5340, 'ค่าเสื่อมราคา', 'expense'),
(5410, 'ดอกเบี้ยจ่าย', 'expense'),
(5510, 'ภาษีเงินได้นิติบุคคล', 'expense'),
(5998, 'ค่าใช้จ่ายเพิ่มค่าน้ำมันกับค่าอาหาร service ลูกค้า', 'expense'),
(5999, 'อื่นๆ', 'expense')
ON CONFLICT (account_code) DO NOTHING;

-- Journal Entries Table (with proper columns)
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    journal_type VARCHAR(20) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    description TEXT,
    debit_account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
    credit_account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 0,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    withholding_rate DECIMAL(5,2) DEFAULT 0,
    withholding_amount DECIMAL(15,2) DEFAULT 0,
    fiscal_year INTEGER,
    fiscal_month INTEGER,
    document_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'อื่นๆ',
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL,
    reference_no VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER,
    net_amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contacts Table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    type VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default company settings
INSERT INTO company_settings (company_name, tax_id, address) 
VALUES ('Micro-Account Professional', '', '123 Accounting Street, Bangkok, Thailand')
ON CONFLICT DO NOTHING;
