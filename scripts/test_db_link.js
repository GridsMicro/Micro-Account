require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL.replace(/^"|"$/g, ''),
  ssl: {
    rejectUnauthorized: false
  },
  max: 1,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    console.log("Testing connection to Neon Postgres...");
    console.log("URL:", process.env.DATABASE_URL?.substring(0, 30) + "...");
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
