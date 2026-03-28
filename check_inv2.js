const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

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
      WHERE table_name = 'invoices'
    `);
    fs.writeFileSync('c:/tmp/inv_schema.txt', JSON.stringify(rows));
  } catch (err) {
    fs.writeFileSync('c:/tmp/inv_schema.txt', err.toString());
  } finally {
    await pool.end();
  }
}
check();
