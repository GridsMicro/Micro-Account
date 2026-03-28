import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('🔍 Testing Database Connection...');
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('POSTGRES_URL set:', !!process.env.POSTGRES_URL);

if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.error('❌ No database URL found in environment variables');
  process.exit(1);
}

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
console.log('Connection string exists:', !!connectionString);

// Test connection
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 10000,
});

async function testConnection() {
  try {
    console.log('⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');

    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📊 Query result:', result.rows[0]);

    client.release();
    console.log('✅ Connection test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();