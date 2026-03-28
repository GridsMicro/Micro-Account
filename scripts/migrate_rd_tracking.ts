// Migration: Add RD API Portal tracking columns
// Adds columns to track RD API submissions for invoices and payment vouchers

import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: 'C:/Users/User/Documents/GitHub/GridsMicro/Micro-Account/.env.local' });

console.log('🔍 Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
console.log('Connection string preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');

// Create direct database connection for migration
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 1,
  connectionTimeoutMillis: 10000,
});

const query = async (text: string, params?: any[]) => {
  const res = await pool.query(text, params);
  return res;
};

async function addRDTrackingColumns() {
  try {
    console.log("🚀 Starting RD API tracking migration...");

    // Add RD tracking columns to invoices table
    console.log("📄 Adding RD tracking columns to invoices table...");
    await query(`
      ALTER TABLE invoices
      ADD COLUMN IF NOT EXISTS rd_submission_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS rd_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS rd_submitted_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS rd_error_message TEXT
    `);

    // Add RD tracking columns to payment_vouchers table
    console.log("💰 Adding RD tracking columns to payment_vouchers table...");
    await query(`
      ALTER TABLE payment_vouchers
      ADD COLUMN IF NOT EXISTS rd_submission_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS rd_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS rd_submitted_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS rd_error_message TEXT
    `);

    // Create index for faster queries
    console.log("🔍 Creating indexes for RD tracking...");
    await query(`CREATE INDEX IF NOT EXISTS idx_invoices_rd_submission ON invoices(rd_submission_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vouchers_rd_submission ON payment_vouchers(rd_submission_id)`);

    console.log("✅ RD API tracking migration completed successfully!");
    console.log("📊 Added columns: rd_submission_id, rd_status, rd_submitted_at, rd_error_message");
    console.log("🔍 Added indexes for performance");

    // Close the pool
    await pool.end();

  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
addRDTrackingColumns().then(async () => {
  console.log("🎉 Migration script completed!");
  await pool.end();
  process.exit(0);
}).catch(async (error) => {
  console.error("💥 Migration script failed:", error);
  await pool.end();
  process.exit(1);
});