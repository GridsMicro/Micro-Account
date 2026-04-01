-- =====================================================
-- Micro-Account: Check Actual Database Schema
-- Verifies what columns actually exist in the database
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- Check expenses table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check journal_entries table structure  
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'journal_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('expenses', 'journal_entries', 'chart_of_accounts', 'users', 'company_settings', 'invoices', 'contacts')
ORDER BY table_name;
