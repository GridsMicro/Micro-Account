// Migration: Create expenses table for Phase 4
// Adds expenses table to track business operating expenses

import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: 'C:/Users/User/Documents/GitHub/GridsMicro/Micro-Account/.env.local' });

console.log('🔍 Environment check:');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

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

async function createExpensesTable() {
  try {
    console.log("🚀 Starting expenses table migration...");

    // Check if table already exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'expenses'
      )
    `);

    if (tableExists.rows[0].exists) {
      console.log("ℹ️ Expenses table already exists, checking columns...");

      // Check for missing columns and add them
      const columns = await query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'expenses'
        ORDER BY column_name
      `);

      const existingColumns = columns.rows.map(row => row.column_name);
      console.log("Existing columns:", existingColumns.join(', '));

      // Add missing columns
      if (!existingColumns.includes('status')) {
        console.log("➕ Adding status column...");
        await query(`ALTER TABLE expenses ADD COLUMN status VARCHAR(50) DEFAULT 'paid'`);
      }

      if (!existingColumns.includes('updated_at')) {
        console.log("➕ Adding updated_at column...");
        await query(`ALTER TABLE expenses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);
      }

    } else {
      // Create expenses table
      console.log("📊 Creating expenses table...");
      await query(`
        CREATE TABLE expenses (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          amount DECIMAL(15, 2) NOT NULL,
          expense_date DATE NOT NULL,
          reference_no VARCHAR(100),
          notes TEXT,
          status VARCHAR(50) DEFAULT 'paid',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("✅ Expenses table created successfully!");
    }

    // Create indexes (safe to run multiple times)
    console.log("🔍 Creating indexes for expenses...");
    await query(`CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status)`);

    console.log("✅ Expenses table migration completed successfully!");
    console.log("📊 Table structure: id, title, category, amount, expense_date, reference_no, notes, status, created_at, updated_at");

    // Close the pool
    await pool.end();

  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
createExpensesTable().then(() => {
  console.log("🎉 Expenses table migration script completed!");
  process.exit(0);
}).catch(async (error) => {
  console.error("💥 Expenses table migration script failed:", error);
  await pool.end();
  process.exit(1);
});