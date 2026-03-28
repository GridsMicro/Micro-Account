const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const fs = require('fs');
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices'")
  .then(res => fs.writeFileSync('invoices_schema_dump.json', JSON.stringify(res.rows, null, 2)))
  .catch(err => fs.writeFileSync('invoices_schema_dump.json', JSON.stringify({error: err.message})))
  .finally(() => pool.end());
