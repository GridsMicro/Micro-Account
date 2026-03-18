import pool from './lib/db';

async function testConnection() {
  try {
    console.log("Testing connection to Neon Postgres...");
    const client = await pool.connect();
    console.log("✅ Successfully connected to Postgres!");
    
    const res = await client.query('SELECT current_database(), current_user');
    console.log("DB Info:", res.rows[0]);
    
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection failed:", err);
    process.exit(1);
  }
}

testConnection();
