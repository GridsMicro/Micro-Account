-- Migration: Create subscription_invoices mapping table
BEGIN;

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  billing_period DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prevent duplicates for same subscription and billing period
CREATE UNIQUE INDEX IF NOT EXISTS ux_subscription_billing_period ON subscription_invoices (subscription_id, billing_period);

COMMIT;

-- Usage: psql $DATABASE_URL -f scripts/migrate_subscription_invoices.sql
