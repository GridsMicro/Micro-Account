-- =====================================================
-- Micro-Account: Fix Database Schema
-- Ensures all tables have the correct columns as documented
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- Drop and recreate expenses table with correct columns
DROP TABLE IF EXISTS expenses CASCADE;

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,                    -- Primary key for expense records
    title VARCHAR(255) NOT NULL,              -- Expense description/title
    category VARCHAR(100) NOT NULL DEFAULT 'อื่นๆ', -- Expense category
    amount DECIMAL(15,2) NOT NULL DEFAULT 0, -- CRITICAL: Expense amount for dashboard
    expense_date DATE NOT NULL,              -- Date when expense was incurred
    reference_no VARCHAR(100),               -- Reference number for tracking
    notes TEXT,                               -- Additional notes about expense
    status VARCHAR(50) DEFAULT 'paid',       -- Payment status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drop and recreate journal_entries table with correct columns
DROP TABLE IF EXISTS journal_entries CASCADE;

CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,                    -- Primary key for journal entries
    entry_date DATE NOT NULL,                 -- Date of accounting entry
    journal_type VARCHAR(20) NOT NULL,        -- Type of journal (sales, purchase, etc.)
    reference_type VARCHAR(50),               -- Type of reference document
    reference_id INTEGER,                     -- ID of reference document
    description TEXT,                         -- Description of the accounting transaction
    debit_account_id INTEGER NOT NULL,       -- CRITICAL: Debit account ID from chart_of_accounts
    credit_account_id INTEGER NOT NULL,      -- CRITICAL: Credit account ID from chart_of_accounts
    amount DECIMAL(15,2) NOT NULL,           -- CRITICAL: Transaction amount for P&L
    vat_rate DECIMAL(5,2) DEFAULT 0,         -- VAT rate percentage (typically 7%)
    vat_amount DECIMAL(15,2) DEFAULT 0,      -- VAT amount calculated
    withholding_rate DECIMAL(5,2) DEFAULT 0,  -- Withholding tax rate percentage
    withholding_amount DECIMAL(15,2) DEFAULT 0, -- Withholding tax amount calculated
    fiscal_year INTEGER,                     -- Fiscal year for reporting
    fiscal_month INTEGER,                    -- Fiscal month for reporting
    document_number VARCHAR(50),             -- Document number (INV-xxx, QT-xxx)
    notes TEXT,                               -- Additional notes about transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate chart_of_accounts table
DROP TABLE IF EXISTS chart_of_accounts CASCADE;

CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,                    -- Primary key used as foreign key in journal_entries
    account_code INTEGER NOT NULL UNIQUE,     -- Unique account code (1111, 4110, 5110, etc.)
    account_name VARCHAR(255) NOT NULL,        -- Human-readable account name
    account_type VARCHAR(50) NOT NULL,         -- Account type (asset, liability, equity, revenue, expense)
    parent_account_id INTEGER REFERENCES chart_of_accounts(id), -- Self-reference for hierarchical accounts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verify tables were created with correct columns
SELECT 'expenses' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses' AND table_schema = 'public' 
AND column_name IN ('id', 'title', 'category', 'amount', 'expense_date', 'reference_no', 'notes', 'status', 'created_at')
ORDER BY ordinal_position;

SELECT 'journal_entries' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'journal_entries' AND table_schema = 'public' 
AND column_name IN ('id', 'entry_date', 'journal_type', 'reference_type', 'reference_id', 'description', 'debit_account_id', 'credit_account_id', 'amount', 'vat_rate', 'vat_amount', 'withholding_rate', 'withholding_amount', 'fiscal_year', 'fiscal_month', 'document_number', 'notes', 'created_at')
ORDER BY ordinal_position;
