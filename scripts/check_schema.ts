
import { Pool } from 'pg';

async function checkAll() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    
    const tables = ['products', 'invoices', 'quotations'];
    for (const table of tables) {
      const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`Table ${table}:`, cols.rows);
    }
    
    client.release();
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkAll();
