-- =====================================================
-- Micro-Account: Schema Audit Script
-- Lists all tables and their columns with comments
-- Copyright (c) 2026 Micro-Account. All Rights Reserved.
-- =====================================================

-- List all tables
SELECT 'TABLES' as section, table_name as name, '' as details 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- List all columns for each table
SELECT 
  'COLUMNS' as section,
  table_name as name,
  column_name || ' (' || data_type || ')' as details
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
