// Migration: Add cost_price column to products table for Phase 4
// Adds cost_price column to calculate Gross Profit (Revenue - COGS)

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

async function addCostPriceColumn() {
  try {
    console.log("🚀 Starting cost_price column migration...");

    // Check if column already exists
    const columnExists = await query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'cost_price'
      )
    `);

    if (columnExists.rows[0].exists) {
      console.log("ℹ️ cost_price column already exists, skipping...");
    } else {
      // Add cost_price column to products table
      console.log("📊 Adding cost_price column to products table...");
      await query(`
        ALTER TABLE products
        ADD COLUMN cost_price DECIMAL(15, 2) DEFAULT 0
      `);
      console.log("✅ cost_price column added successfully!");
    }

    // Create index for performance
    console.log("🔍 Creating index for cost_price...");
    await query(`CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price)`);

    console.log("✅ Cost price migration completed successfully!");
    console.log("📊 Added column: cost_price DECIMAL(15,2) DEFAULT 0");

    // Close the pool
    await pool.end();

  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

// Run migration
addCostPriceColumn().then(() => {
  console.log("🎉 Cost price migration script completed!");
  process.exit(0);
}).catch(async (error) => {
  console.error("💥 Cost price migration script failed:", error);
  await pool.end();
  process.exit(1);
});