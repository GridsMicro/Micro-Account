-- Add issue_date column to quotations table
-- Migration: 2026-04-29-add-issue-date-column.sql

-- Add issue_date column as DATE type
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS issue_date DATE;

-- Update existing records to use created_at date as issue_date (extract date part)
UPDATE quotations 
SET issue_date = CASE 
  WHEN created_at IS NOT NULL AND created_at != '' THEN
    CASE 
      WHEN created_at ~ '^\d{4}-\d{2}-\d{2}' THEN created_at::DATE
      WHEN created_at ~ '^\d{4}-\d{2}-\d{2}T' THEN LEFT(created_at, 10)
      ELSE NULL
    END
  ELSE NULL;

-- Add comments for documentation
COMMENT ON COLUMN quotations.issue_date IS 'Date when quotation was issued to customer (format: YYYY-MM-DD)';
