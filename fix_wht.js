require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixJournal() {
  try {
    const coa = await pool.query('SELECT * FROM chart_of_accounts ORDER BY id');
    console.log(JSON.stringify(coa.rows, null, 2));
    
    // We need to add WHT 3% for INV26-002
    // If net is 205400, WHT 3% = 6162
    
    // Update the WHT values in the DB
    await pool.query(`UPDATE journal_entries SET withholding_rate = 3.00, withholding_amount = 6162.00 WHERE reference_no = 'INV26-002' AND debit_account_id = 1141`);
    
    console.log('Update done.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

fixJournal();
