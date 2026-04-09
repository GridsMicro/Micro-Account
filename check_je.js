require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkJournal() {
  try {
    const res = await pool.query("SELECT * FROM journal_entries WHERE reference_no LIKE '%INV%002%' OR reference_type = 'invoice' AND reference_id = 5");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkJournal();
