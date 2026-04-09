require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function autoFixWht() {
  try {
    const { rows: invRows } = await pool.query(`
      SELECT id, invoice_number, net_amount, vat_amount 
      FROM invoices
      ORDER BY invoice_number
    `);
    
    console.table(invRows);

    const { rows: jeRows } = await pool.query(`
      SELECT id, reference_no, debit_account_id, amount, withholding_amount, withholding_rate, description
      FROM journal_entries
      WHERE reference_type = 'invoice' AND debit_account_id = 1141
      ORDER BY reference_no
    `);
    
    console.table(jeRows);
    
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

autoFixWht();
