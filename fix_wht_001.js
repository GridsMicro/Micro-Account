require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function autoFixWht() {
  try {
    console.log("Fixing INV26-001 WHT...");
    // Net amount for INV26-001 is 43335. WHT 3% is 1300.05
    await pool.query(`UPDATE journal_entries SET withholding_rate = 3.00, withholding_amount = 1300.05 WHERE reference_no = 'INV26-001' AND debit_account_id = 1141`);
    console.log("INV26-001 fixed.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

autoFixWht();
