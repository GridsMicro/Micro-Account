
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log("Connected to database");

    // Check columns of quotations
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
