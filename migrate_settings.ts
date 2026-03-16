
import { Pool } from 'pg';

async function migrateSettings() {
  console.log("🚀 Starting Database Migration for Settings...");
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    // Add new columns to company_settings if they don't exist
    const columns = [
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255)",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(255)",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100)",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(255)",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5, 2) DEFAULT 7.00",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS withholding_tax_rate DECIMAL(5, 2) DEFAULT 3.00",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT TRUE",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'THB'",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV'",
      "ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS quotation_prefix VARCHAR(20) DEFAULT 'QT'"
    ];

    for (const sql of columns) {
      await client.query(sql);
      console.log(`✅ Executed: ${sql.substring(0, 40)}...`);
    }

    client.release();
    console.log("✨ Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration Error:", err);
  } finally {
    await pool.end();
  }
}

migrateSettings();
