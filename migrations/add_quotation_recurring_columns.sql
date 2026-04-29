-- Add recurring columns to quotations table
-- Migration: 2026-04-29-add-quotation-recurring-columns.sql

-- Add is_recurring column
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add recurring_interval column  
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20) DEFAULT 'none';

-- Add comments for documentation
COMMENT ON COLUMN quotations.is_recurring IS 'Flag to indicate if quotation is recurring';
COMMENT ON COLUMN quotations.recurring_interval IS 'Recurring interval: none, daily, weekly, monthly, yearly';
