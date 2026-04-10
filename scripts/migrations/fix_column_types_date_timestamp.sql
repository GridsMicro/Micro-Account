-- Migration: Fix Column Types for Date/Timestamp Columns
-- Purpose: Convert varchar columns to proper DATE/TIMESTAMP types
-- Created: 2026-04-10
-- Safety: Requires backup before running

-- =======================================================
-- STEP 1: BACKUP DATA (Use pg_dump or database tool before running)
-- =======================================================
-- IMPORTANT: Please backup your database before running this migration
-- Use: pg_dump your_database > backup_before_migration.sql
-- Or use your database management tool to export data

-- =======================================================
-- STEP 2: ALTER COLUMN TYPES
-- =======================================================

-- Convert expense_date from varchar to DATE in expenses table
ALTER TABLE expenses 
ALTER COLUMN expense_date TYPE DATE USING expense_date::date;

-- Convert created_at from varchar to TIMESTAMP in invoices table
ALTER TABLE invoices 
ALTER COLUMN created_at TYPE TIMESTAMP USING created_at::timestamp;

-- Convert issue_date from varchar to DATE in payment_vouchers table
ALTER TABLE payment_vouchers 
ALTER COLUMN issue_date TYPE DATE USING issue_date::date;

-- =======================================================
-- STEP 3: VERIFICATION QUERIES (Optional - for manual testing)
-- =======================================================

-- Check if conversion was successful
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('expenses', 'invoices', 'payment_vouchers')
-- AND column_name IN ('expense_date', 'created_at', 'issue_date');

-- =======================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =======================================================
-- To rollback, restore from your backup file:
-- psql your_database < backup_before_migration.sql
-- Or use your database management tool to import the backup
