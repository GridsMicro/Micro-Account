-- Migration: Enhance recurring_invoices for subscription billing
-- Adds: billing_day, due_day, wht_rate, last_billed_at

BEGIN;

ALTER TABLE IF EXISTS recurring_invoices
  ADD COLUMN IF NOT EXISTS billing_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 17,
  ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5,4) DEFAULT 0.03,
  ADD COLUMN IF NOT EXISTS last_billed_at TIMESTAMP NULL;

-- Ensure an index for scheduler performance
CREATE INDEX IF NOT EXISTS idx_recurring_next_billing_date ON recurring_invoices (next_billing_date);
CREATE INDEX IF NOT EXISTS idx_recurring_status ON recurring_invoices (status);

COMMIT;

-- Usage: psql $DATABASE_URL -f scripts/migrate_recurring_add_columns.sql
