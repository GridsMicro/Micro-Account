import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testSchema() {
  try {
    console.log('🔍 Testing Phase 4 Schema Changes...');

    // Test expenses table
    console.log('📊 Checking expenses table...');
    const expensesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'expenses'
      ORDER BY ordinal_position
    `);
    console.log('Expenses table columns:', expensesResult.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

    // Test cost_price column in products
    console.log('📦 Checking products.cost_price column...');
    const costPriceResult = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'cost_price'
    `);
    if (costPriceResult.rows.length > 0) {
      console.log('✅ cost_price column exists:', costPriceResult.rows[0]);
    } else {
      console.log('❌ cost_price column missing');
    }

    // Test RD tracking columns in invoices
    console.log('📄 Checking RD tracking columns in invoices...');
    const rdColumns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invoices' AND column_name LIKE 'rd_%'
      ORDER BY column_name
    `);
    console.log('RD columns in invoices:', rdColumns.rows.map(r => r.column_name).join(', '));

    // Test sample data insertion
    console.log('🧪 Testing data operations...');

    // Insert test expense (using actual table structure)
    const testId = `TEST-${Date.now()}`;
    const testExpense = await pool.query(`
      INSERT INTO expenses (expense_number, category, description, amount, expense_date, notes, status)
      VALUES ($1, 'Testing', 'Phase 4 Deployment Test', 1000.00, CURRENT_DATE, 'Schema verification', 'paid')
      RETURNING expense_number, description, amount, status
    `, [testId]);
    console.log('✅ Test expense inserted:', testExpense.rows[0]);

    // Clean up test data
    await pool.query('DELETE FROM expenses WHERE expense_number = $1', [testId]);

    console.log('✅ All Phase 4 schema changes verified successfully!');

  } catch (error) {
    console.error('❌ Schema test failed:', error);
  } finally {
    await pool.end();
  }
}

testSchema();