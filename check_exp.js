require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function autoFixWht() {
  try {
    const { rows: expRows } = await pool.query(`
      SELECT * FROM expenses
    `);
    
    console.table(expRows);

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

autoFixWht();
