require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkInvoice() {
  try {
    const res = await pool.query("SELECT * FROM invoices WHERE invoice_number LIKE '%INV%002%' OR invoice_number LIKE '%INV-0002%'");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkInvoice();
