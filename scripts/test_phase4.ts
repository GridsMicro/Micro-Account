import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });
import { query } from '../lib/db.js';

async function test() {
  try {
    console.log('🔄 Testing Phase 4 Implementation...');
    console.log('=' .repeat(50));

    console.log('\n📦 Testing expenses table...');
    const res = await query('SELECT COUNT(*) as count FROM expenses');
    console.log('✅ Expenses table exists, count:', res.rows[0].count);

    console.log('\n💰 Testing products cost_price...');
    const prodRes = await query('SELECT id, name, cost_price FROM products LIMIT 3');
    console.log('✅ Products with cost_price:', prodRes.rows);

    console.log('\n📊 Testing P&L calculation...');
    const incomeRes = await query("SELECT SUM(net_amount) as total FROM invoices WHERE status = 'paid'");
    const cogsRes = await query('SELECT SUM(ii.quantity * COALESCE(p.cost_price, 0)) as total_cogs FROM invoice_items ii LEFT JOIN products p ON ii.product_id = p.id LEFT JOIN invoices i ON ii.invoice_id = i.id WHERE i.status = \'paid\'');
    const expenseRes = await query('SELECT SUM(amount) as total FROM expenses');

    const income = Number(incomeRes.rows[0]?.total || 0);
    const cogs = Number(cogsRes.rows[0]?.total_cogs || 0);
    const expenses = Number(expenseRes.rows[0]?.total || 0);

    console.log('💰 Income (Revenue):', income);
    console.log('📦 COGS (Cost of Goods Sold):', cogs);
    console.log('💸 Operating Expenses:', expenses);

    const grossProfit = income - cogs;
    const netProfit = grossProfit - expenses;

    console.log('\n📈 Calculations:');
    console.log('   Gross Profit:', grossProfit);
    console.log('   Net Profit:', netProfit);
    console.log('   Gross Margin:', income > 0 ? ((grossProfit / income) * 100).toFixed(1) + '%' : 'N/A');
    console.log('   Net Margin:', income > 0 ? ((netProfit / income) * 100).toFixed(1) + '%' : 'N/A');

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Phase 4 Test Complete!');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.code);
  }
}

test();