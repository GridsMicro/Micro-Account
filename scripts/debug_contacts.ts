
import { Pool } from 'pg';

async function debugUpdate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    const res = await client.query("SELECT * FROM contacts LIMIT 1");
    console.log("Contacts sample:", res.rows[0]);
    
    // Check columns
    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contacts'");
    console.log("Columns:", cols.rows);
    
    client.release();
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}

debugUpdate();
