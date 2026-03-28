const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("Creating product_categories table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Adding category_name to products...");
    try {
        await pool.query(`ALTER TABLE products ADD COLUMN category_name VARCHAR(255)`);
    } catch(e) {
        if (e.code === '42701') {
            console.log("Column category_name already exists.");
        } else {
            throw e;
        }
    }
    
    // Create an initial default category
    await pool.query(`
        INSERT INTO product_categories (name, description)
        VALUES ('หมวดหมู่ทั่วไป (General)', 'หมวดหมู่เริ่มต้น')
        ON CONFLICT (name) DO NOTHING
    `);

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}
migrate();
