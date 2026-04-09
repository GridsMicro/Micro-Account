-- =======================================================
-- MICRO-ACCOUNT LATEST SCHEMA MASTER (APRIL 2026)
-- Target Platform: Neon Database (PostgreSQL)
-- Architecture Era: Era 2 (Modern Entity Linking)
-- =======================================================

-- 1. SETTINGS & PATTERNS
CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    tax_id VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    vat_rate DECIMAL(5,2) DEFAULT 7.00,
    withholding_tax_rate DECIMAL(5,2) DEFAULT 3.00,
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    quotation_prefix VARCHAR(10) DEFAULT 'QT',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CHART OF ACCOUNTS
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id INTEGER PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name_th VARCHAR(255) NOT NULL,
    account_name_en VARCHAR(255),
    account_type VARCHAR(50), -- asset, liability, equity, revenue, expense
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. JOURNALS (Modern Single-Row Ledger)
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    reference_no VARCHAR(50),
    journal_type VARCHAR(20), -- sales, receipt, purchase, payment, general
    reference_type VARCHAR(50), -- invoice, expense, etc.
    reference_id INTEGER,
    debit_account_id INTEGER REFERENCES chart_of_accounts(id),
    credit_account_id INTEGER REFERENCES chart_of_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    fiscal_year INTEGER,
    fiscal_month INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SALES (Invoices)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    contact_id INTEGER,
    net_amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'sent', -- sent, paid, overdue
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. PURCHASES (Expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    expense_date DATE NOT NULL,
    title VARCHAR(255),
    category VARCHAR(100),
    vendor_name VARCHAR(255),
    contact_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid
    classification VARCHAR(50) DEFAULT 'OPEX'
);

-- 6. PAYMENTS (Accounts Receivable - Linking)
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_no VARCHAR(50) UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    contact_id INTEGER,
    invoice_id INTEGER REFERENCES invoices(id), -- Linked to Sales
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed'
);

-- 7. VOUCHERS (Accounts Payable - Linking)
CREATE TABLE IF NOT EXISTS payment_vouchers (
    id SERIAL PRIMARY KEY,
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    payee_name VARCHAR(255),
    issue_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    vat_amount DECIMAL(15,2) DEFAULT 0,
    expense_id INTEGER REFERENCES expenses(id), -- Linked to Purchases
    vendor_id INTEGER, -- Linked to Supplier
    payment_method VARCHAR(100),
    status VARCHAR(20) DEFAULT 'issued'
);

-- INDEXES FOR PERFORMANCE & AUDIT
CREATE INDEX IF NOT EXISTS idx_journal_ref ON journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_expense ON payment_vouchers(expense_id);
