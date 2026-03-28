const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Adding quotation to document_patterns...");
    await pool.query(`
      INSERT INTO document_patterns (document_type, prefix, separator, include_year, include_month, digits, last_number)
      VALUES ('quotation', 'QT', '-', true, true, 4, 0)
      ON CONFLICT (document_type) DO NOTHING
    `);
    console.log("Success!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
main();
