const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const { rows } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quotations'
    `);
    console.log("Quotations Table Schema:", rows);
    
    const itemsRows = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quotation_items'
    `);
    console.log("Quotation Items Schema:", itemsRows.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
