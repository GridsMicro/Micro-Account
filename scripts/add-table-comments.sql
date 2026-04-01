-- =====================================================
-- Micro-Account: Table Comments Script
-- Adds SQL comments to prevent future AI confusion
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- expenses table comment
COMMENT ON TABLE expenses IS 'For tracking raw business costs (Marketing, Office supplies, Utilities). Must have amount field for dashboard calculations.';

-- expenses columns comments
COMMENT ON COLUMN expenses.id IS 'Primary key for expense records';
COMMENT ON COLUMN expenses.title IS 'Expense description/title';
COMMENT ON COLUMN expenses.category IS 'Expense category (ค่าเช่าสถานที่, ค่าสาธารณูปโภค, etc.)';
COMMENT ON COLUMN expenses.amount IS 'CRITICAL: Expense amount in decimal format for dashboard calculations';
COMMENT ON COLUMN expenses.expense_date IS 'Date when expense was incurred';
COMMENT ON COLUMN expenses.reference_no IS 'Reference number for tracking';
COMMENT ON COLUMN expenses.notes IS 'Additional notes about expense';
COMMENT ON COLUMN expenses.status IS 'Payment status (paid, pending, etc.)';
COMMENT ON COLUMN expenses.created_at IS 'Timestamp when record was created';

-- journal_entries table comment
COMMENT ON TABLE journal_entries IS 'For double-entry accounting records. Must have debit_account_id, credit_account_id, and amount fields for P&L calculations.';

-- journal_entries columns comments
COMMENT ON COLUMN journal_entries.id IS 'Primary key for journal entries';
COMMENT ON COLUMN journal_entries.entry_date IS 'Date of the accounting entry';
COMMENT ON COLUMN journal_entries.journal_type IS 'Type of journal (sales, purchase, receipt, payment, general)';
COMMENT ON COLUMN journal_entries.reference_type IS 'Type of reference document (invoice, receipt, etc.)';
COMMENT ON COLUMN journal_entries.reference_id IS 'ID of the reference document';
COMMENT ON COLUMN journal_entries.description IS 'Description of the accounting transaction';
COMMENT ON COLUMN journal_entries.debit_account_id IS 'CRITICAL: Debit account ID from chart_of_accounts table';
COMMENT ON COLUMN journal_entries.credit_account_id IS 'CRITICAL: Credit account ID from chart_of_accounts table';
COMMENT ON COLUMN journal_entries.amount IS 'CRITICAL: Transaction amount for P&L and cash flow calculations';
COMMENT ON COLUMN journal_entries.vat_rate IS 'VAT rate percentage (typically 7%)';
COMMENT ON COLUMN journal_entries.vat_amount IS 'VAT amount calculated';
COMMENT ON COLUMN journal_entries.withholding_rate IS 'Withholding tax rate percentage';
COMMENT ON COLUMN journal_entries.withholding_amount IS 'Withholding tax amount calculated';
COMMENT ON COLUMN journal_entries.fiscal_year IS 'Fiscal year for reporting';
COMMENT ON COLUMN journal_entries.fiscal_month IS 'Fiscal month for reporting';
COMMENT ON COLUMN journal_entries.document_number IS 'Document number (INV-xxx, QT-xxx, etc.)';
COMMENT ON COLUMN journal_entries.notes IS 'Additional notes about the transaction';
COMMENT ON COLUMN journal_entries.created_at IS 'Timestamp when record was created';

-- chart_of_accounts table comment
COMMENT ON TABLE chart_of_accounts IS 'The master list of account codes for double-entry accounting. All account IDs referenced in journal_entries must exist here.';

-- chart_of_accounts columns comments
COMMENT ON COLUMN chart_of_accounts.id IS 'Primary key used as foreign key in journal_entries';
COMMENT ON COLUMN chart_of_accounts.account_code IS 'Unique account code (1111, 4110, 5110, etc.)';
COMMENT ON COLUMN chart_of_accounts.account_name IS 'Human-readable account name';
COMMENT ON COLUMN chart_of_accounts.account_type IS 'Account type (asset, liability, equity, revenue, expense)';
COMMENT ON COLUMN chart_of_accounts.parent_account_id IS 'Self-reference for hierarchical accounts';
COMMENT ON COLUMN chart_of_accounts.created_at IS 'Timestamp when record was created';

-- company_settings table comment
COMMENT ON TABLE company_settings IS 'Company branding and configuration settings for documents and dashboard display.';

-- company_settings columns comments
COMMENT ON COLUMN company_settings.id IS 'Primary key for company settings';
COMMENT ON COLUMN company_settings.company_name IS 'Company name displayed on dashboard and documents';
COMMENT ON COLUMN company_settings.tax_id IS 'Company tax identification number';
COMMENT ON COLUMN company_settings.address IS 'Company address for documents';
COMMENT ON COLUMN company_settings.logo_url IS 'URL to company logo for documents';
COMMENT ON COLUMN company_settings.phone IS 'Company phone number';
COMMENT ON COLUMN company_settings.email IS 'Company contact email';
COMMENT ON COLUMN company_settings.website IS 'Company website URL';
COMMENT ON COLUMN company_settings.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN company_settings.updated_at IS 'Timestamp when record was last updated';

-- invoices table comment
COMMENT ON TABLE invoices IS 'Customer invoices and billing records. Links to journal_entries for accounting.';

-- invoices columns comments
COMMENT ON COLUMN invoices.id IS 'Primary key for invoices';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number (INV-xxx format)';
COMMENT ON COLUMN invoices.customer_id IS 'Foreign key to contacts table';
COMMENT ON COLUMN invoices.net_amount IS 'Net amount before VAT';
COMMENT ON COLUMN invoices.vat_amount IS 'VAT amount calculated at 7%';
COMMENT ON COLUMN invoices.total_amount IS 'Total amount including VAT';
COMMENT ON COLUMN invoices.invoice_date IS 'Date invoice was issued';
COMMENT ON COLUMN invoices.due_date IS 'Payment due date';
COMMENT ON COLUMN invoices.status IS 'Invoice status (pending, paid, overdue)';
COMMENT ON COLUMN invoices.notes IS 'Additional notes about invoice';
COMMENT ON COLUMN invoices.created_at IS 'Timestamp when record was created';

-- contacts table comment
COMMENT ON TABLE contacts IS 'Customer and supplier contact information. Referenced by invoices and other documents.';

-- contacts columns comments
COMMENT ON COLUMN contacts.id IS 'Primary key for contacts';
COMMENT ON COLUMN contacts.name IS 'Contact person or company name';
COMMENT ON COLUMN contacts.email IS 'Contact email address';
COMMENT ON COLUMN contacts.phone IS 'Contact phone number';
COMMENT ON COLUMN contacts.address IS 'Contact address';
COMMENT ON COLUMN contacts.type IS 'Contact type (customer, supplier, vendor)';
COMMENT ON COLUMN contacts.created_at IS 'Timestamp when record was created';

-- users table comment
COMMENT ON TABLE users IS 'System users with role-based access control. Only superadmin and admin roles allowed.';

-- users columns comments
COMMENT ON COLUMN users.id IS 'Primary key for users';
COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.email IS 'User email (unique login)';
COMMENT ON COLUMN users.password IS 'Hashed password for authentication';
COMMENT ON COLUMN users.role IS 'CRITICAL: User role (superadmin, admin, user) - NO other roles allowed';
COMMENT ON COLUMN users.status IS 'User status (active, pending, inactive)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when record was created';
