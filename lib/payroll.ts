import { query } from "@/lib/db";

export async function ensurePayrollSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS payroll_entries (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      employee_code VARCHAR(100),
      employee_name VARCHAR(255) NOT NULL,
      payroll_month DATE NOT NULL,
      gross_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      tax_withheld DECIMAL(15,2) NOT NULL DEFAULT 0,
      net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      currency VARCHAR(10) NOT NULL DEFAULT 'THB',
      source_system VARCHAR(100) NOT NULL DEFAULT 'manual',
      external_ref VARCHAR(150),
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_payroll_entries_company_month
    ON payroll_entries(company_id, payroll_month DESC)
  `);
}

