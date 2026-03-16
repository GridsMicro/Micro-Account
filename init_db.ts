
import { Pool } from 'pg';

async function setupDatabase() {
  console.log("🚀 Starting Database Schema Initialization...");
  
  // Try to connect WITHOUT SSL first if local
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add logic to handle local vs production SSL
    ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    console.log("✅ Database Connected.");

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'Member',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table ensured.");

    // 2. Contacts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        contact_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Contacts table ensured.");

    // 3. Products/Inventory Table
    await client.query(`
       CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku_number VARCHAR(100) UNIQUE,
        source_info TEXT,
        storage_location VARCHAR(255),
        stock_quantity INTEGER DEFAULT 0,
        price DECIMAL(15, 2) DEFAULT 0.00,
        product_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Products table ensured.");

    // 4. Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE,
        contact_id INTEGER REFERENCES contacts(id),
        status VARCHAR(50) DEFAULT 'draft',
        net_amount DECIMAL(15, 2) DEFAULT 0.00,
        issue_date DATE,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Invoices table ensured.");

    // 5. Quotations Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        quotation_number VARCHAR(100) UNIQUE,
        contact_id INTEGER REFERENCES contacts(id),
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(15, 2) DEFAULT 0.00,
        issue_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Quotations table ensured.");

    // 6. Company Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        tax_id VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(255),
        logo_url TEXT,
        website VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Company Settings table ensured.");

    // Seed default company if empty
    const checkCompany = await client.query("SELECT COUNT(*) FROM company_settings");
    if (parseInt(checkCompany.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO company_settings (name, email, website) 
        VALUES ('Microtronic Tech (Thailand)', 'contact@microtronic.biz', 'www.microtronic.biz')
      `);
      console.log("🌱 Seeded default company data.");
    }

    client.release();
    console.log("✨ Database initialization completed successfully!");
  } catch (err) {
    console.error("❌ Database Error during setup:", err);
  } finally {
    await pool.end();
  }
}

setupDatabase();
