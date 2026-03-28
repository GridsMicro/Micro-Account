const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

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
    fs.writeFileSync(path.join(__dirname, 'inv_schema.txt'), JSON.stringify(rows, null, 2));
  } catch (err) {
    fs.writeFileSync(path.join(__dirname, 'inv_schema.txt'), String(err));
  } finally {
    await pool.end();
  }
}
check();
