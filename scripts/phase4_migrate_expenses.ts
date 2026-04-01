import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { query } from "@/lib/db";

/**
 * Phase 4 Migration: Add cost_price to products + Create expenses table
 */

async function runMigration() {
  console.log("🔄 Phase 4 Migration: Expenses Management + Cost Price");
  console.log("=" .repeat(60));

  try {
    // STEP 1: เพิ่ม cost_price ในตาราง products
    console.log("\n📦 STEP 1: เพิ่ม cost_price ในตาราง products...");
    await query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15, 2) DEFAULT 0
    `);
    console.log("   ✅ cost_price column added/verified");

    // STEP 2: สร้างตาราง expenses พร้อม categories
    console.log("\n💼 STEP 2: สร้างตาราง expenses...");
    await query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        expense_date DATE NOT NULL,
        reference_no VARCHAR(100),
        tax_invoice_no VARCHAR(100),
        tax_invoice_date DATE,
        vat_amount DECIMAL(15, 2) DEFAULT 0,
        description TEXT,
        status VARCHAR(50) DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("   ✅ expenses table created/verified");

    // STEP 3: สร้าง index สำหรับ query ที่เร็ว
    console.log("\n🔍 STEP 3: สร้าง indexes...");
    await query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category)
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)
    `);
    console.log("   ✅ Indexes created/verified");

    // STEP 4: ยืนยันข้อมูล
    console.log("\n✔️ STEP 4: ตรวจสอบสคีมา...");
    
    // Check products schema
    const productsCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name IN ('cost_price', 'price')
      ORDER BY ordinal_position
    `);
    console.log("   Products columns:");
    productsCheck.rows.forEach(row => {
      console.log(`     • ${row.column_name}: ${row.data_type}`);
    });

    // Check expenses schema
    const expensesCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'expenses'
      ORDER BY ordinal_position
    `);
    console.log("   Expenses columns:");
    expensesCheck.rows.forEach(row => {
      console.log(`     • ${row.column_name}: ${row.data_type}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ Phase 4 Migration Complete!");
    console.log("=" .repeat(60));
    console.log("\n📝 Next steps:");
    console.log("   1. ✅ cost_price added to products");
    console.log("   2. ✅ expenses table created");
    console.log("   3. → Add Server Actions for Expense CRUD");
    console.log("   4. → Create /expenses UI page");
    console.log("   5. → Update P&L Report to use real expense data");
    
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Migration Error:", error.message);
    console.error(error.code);
    process.exit(1);
  }
}

runMigration();
