
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Attempting to connect to database...');
    const client = await pool.connect();
    console.log("Successfully connected to database");

    // Check columns of quotations
    console.log('Checking quotations table columns...');
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations'
    `);
    
    const columns = res.rows.map(r => r.column_name);
    console.log("Current columns in 'quotations':", columns);

    if (!columns.includes('contact_id')) {
      console.log("Adding 'contact_id' to 'quotations'...");
      await client.query(`ALTER TABLE quotations ADD COLUMN contact_id INTEGER REFERENCES contacts(id)`);
      console.log("Column 'contact_id' added.");
    } else {
      console.log("Column 'contact_id' already exists.");
    }

    client.release();
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

migrate();
