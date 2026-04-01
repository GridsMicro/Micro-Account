-- =====================================================
-- Micro-Account: Database Indexing Script
-- Creates indexes for all tables to improve query performance
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- expenses table indexes
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(expense_date, category);

-- journal_entries table indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_entry_date ON journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_journal_type ON journal_entries(journal_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_debit_account_id ON journal_entries(debit_account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_credit_account_id ON journal_entries(credit_account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_amount ON journal_entries(amount);
CREATE INDEX IF NOT EXISTS idx_journal_entries_fiscal_year ON journal_entries(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_journal_entries_fiscal_month ON journal_entries(fiscal_month);
CREATE INDEX IF NOT EXISTS idx_journal_entries_document_number ON journal_entries(document_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_accounts_amount ON journal_entries(debit_account_id, credit_account_id, amount);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date_type ON journal_entries(entry_date, journal_type);

-- chart_of_accounts table indexes
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_code ON chart_of_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_account_type ON chart_of_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_parent_account_id ON chart_of_accounts(parent_account_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_type_code ON chart_of_accounts(account_type, account_code);

-- users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- company_settings table indexes
CREATE INDEX IF NOT EXISTS idx_company_settings_created_at ON company_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_company_settings_updated_at ON company_settings(updated_at);

-- invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_amount ON invoices(total_amount);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_date_status ON invoices(invoice_date, status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_date ON invoices(customer_id, invoice_date);

-- contacts table indexes
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_type_name ON contacts(type, name);

-- Composite indexes for common queries
-- Dashboard queries optimization
CREATE INDEX IF NOT EXISTS idx_journal_entries_dashboard ON journal_entries(entry_date, debit_account_id, amount);
CREATE INDEX IF NOT EXISTS idx_expenses_dashboard ON expenses(expense_date, amount, category);

-- P&L reporting optimization
CREATE INDEX IF NOT EXISTS idx_journal_entries_pl_report ON journal_entries(fiscal_year, fiscal_month, debit_account_id, credit_account_id, amount);

-- Cash flow optimization
CREATE INDEX IF NOT EXISTS idx_journal_entries_cashflow ON journal_entries(entry_date, amount, debit_account_id, credit_account_id);

-- Document search optimization
CREATE INDEX IF NOT EXISTS idx_journal_entries_document_search ON journal_entries(document_number, entry_date, journal_type);
CREATE INDEX IF NOT EXISTS idx_invoices_document_search ON invoices(invoice_number, invoice_date, status);

-- Customer/supplier optimization
CREATE INDEX IF NOT EXISTS idx_contacts_customer_optimization ON contacts(type, name, email);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_optimization ON invoices(customer_id, status, due_date);

-- Expense reporting optimization
CREATE INDEX IF NOT EXISTS idx_expenses_reporting ON expenses(expense_date, category, amount, status);

-- User management optimization
CREATE INDEX IF NOT EXISTS idx_users_management ON users(role, status, created_at);

-- Company settings optimization
CREATE INDEX IF NOT EXISTS idx_company_settings_optimization ON company_settings(created_at, updated_at);

-- Full-text search indexes (if needed)
-- CREATE INDEX IF NOT EXISTS idx_expenses_search ON expenses USING gin(to_tsvector('english', title || ' ' || COALESCE(notes, '')));
-- CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(address, '')));

-- Partial indexes for better performance on large datasets
CREATE INDEX IF NOT EXISTS idx_journal_entries_expense_accounts ON journal_entries(debit_account_id) WHERE debit_account_id IN (SELECT id FROM chart_of_accounts WHERE account_type = 'expense');
CREATE INDEX IF NOT EXISTS idx_journal_entries_revenue_accounts ON journal_entries(credit_account_id) WHERE credit_account_id IN (SELECT id FROM chart_of_accounts WHERE account_type = 'revenue');
CREATE INDEX IF NOT EXISTS idx_journal_entries_active_period ON journal_entries(entry_date) WHERE entry_date >= CURRENT_DATE - INTERVAL '2 years';
CREATE INDEX IF NOT EXISTS idx_expenses_current_year ON expenses(expense_date) WHERE expense_date >= CURRENT_DATE - INTERVAL '1 year';
CREATE INDEX IF NOT EXISTS idx_invoices_pending ON invoices(status) WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_users_active ON users(status) WHERE status = 'active';

-- Unique constraints (additional to primary keys)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chart_of_accounts_code_unique ON chart_of_accounts(account_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_unique ON invoices(invoice_number);

-- Performance monitoring query
-- SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Index usage statistics query
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes ORDER BY idx_scan DESC;

-- Table size and index size query
-- SELECT 
--     schemaname,
--     tablename,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
--     pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
--     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
