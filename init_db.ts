
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
        tax_id VARCHAR(50),
        contact_person VARCHAR(255),
        contact_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Contacts table ensured.");

    // 3. Categories Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'product',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Categories table ensured.");

    // 4. Products/Inventory Table
    await client.query(`
       CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku_number VARCHAR(100) UNIQUE,
        category_id INTEGER REFERENCES categories(id),
        type VARCHAR(50) DEFAULT 'product',
        source_info TEXT,
        storage_location VARCHAR(255),
        stock_quantity INTEGER DEFAULT 0,
        price DECIMAL(15, 2) DEFAULT 0.00,
        product_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Products table ensured.");

    // 4.1 Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        user_id INTEGER REFERENCES users(id),
        qty INTEGER DEFAULT 1,
        status VARCHAR(50) DEFAULT 'reserved',
        booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expiry_at TIMESTAMP WITH TIME ZONE
      )
    `);
    console.log("✅ Bookings table ensured.");

    // 4.2 Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "user" VARCHAR(255),
        action VARCHAR(255),
        detail TEXT
      )
    `);
    console.log("✅ Audit Logs table ensured.");

    // 4. Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(100) UNIQUE,
        contact_id INTEGER REFERENCES contacts(id),
        status VARCHAR(50) DEFAULT 'draft',
        net_amount DECIMAL(15, 2) DEFAULT 0.00,
        vat_amount DECIMAL(15, 2) DEFAULT 0.00,
        issue_date DATE,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Invoices table ensured.");

    // 4.3 Recurring Invoices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_invoices (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        cycle VARCHAR(50) DEFAULT 'Monthly',
        amount DECIMAL(15, 2) DEFAULT 0.00,
        next_billing_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Recurring Invoices table ensured.");

    // 4.4 Payment Vouchers ( PV ) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_vouchers (
        id SERIAL PRIMARY KEY,
        voucher_no VARCHAR(100) UNIQUE,
        payee_name VARCHAR(255),
        issue_date DATE,
        amount DECIMAL(15, 2) DEFAULT 0.00,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Payment Vouchers table ensured.");

    // 4.5 Invoice Items Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        description TEXT,
        qty DECIMAL(15, 2) DEFAULT 1.00,
        unit_price DECIMAL(15, 2) DEFAULT 0.00,
        total DECIMAL(15, 2) DEFAULT 0.00
      )
    `);
    console.log("✅ Invoice Items table ensured.");

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

    // 6. Accounts (Chart of Accounts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Accounts table ensured.");

    // 7. Journal Entries
    await client.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        entry_date DATE NOT NULL,
        reference_no VARCHAR(100),
        account_name VARCHAR(255),
        account_id INTEGER REFERENCES accounts(id),
        description TEXT,
        debit DECIMAL(15, 2) DEFAULT 0.00,
        credit DECIMAL(15, 2) DEFAULT 0.00,
        journal_type VARCHAR(50) DEFAULT 'general',
        receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Journal Entries table ensured.");

    // 8. Payments
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        payment_date DATE NOT NULL,
        contact_id INTEGER REFERENCES contacts(id),
        amount DECIMAL(15, 2) NOT NULL,
        reference_number VARCHAR(100),
        method VARCHAR(50) DEFAULT 'Bank Transfer',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Payments table ensured.");

    // 9. Document Numbering Patterns
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_patterns (
        id SERIAL PRIMARY KEY,
        document_type VARCHAR(50) UNIQUE NOT NULL,
        prefix VARCHAR(10) NOT NULL,
        separator VARCHAR(1) DEFAULT '-',
        include_year BOOLEAN DEFAULT TRUE,
        include_month BOOLEAN DEFAULT TRUE,
        digits INTEGER DEFAULT 4,
        last_number INTEGER DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Document Patterns table ensured.");

    // 10. Company Settings Table (Advanced)
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
        vat_rate DECIMAL(5, 2) DEFAULT 7.00,
        withholding_tax_rate DECIMAL(5, 2) DEFAULT 3.00,
        is_vat_registered BOOLEAN DEFAULT TRUE,
        currency VARCHAR(10) DEFAULT '฿',
        bank_name VARCHAR(255),
        bank_account_name VARCHAR(255),
        bank_account_number VARCHAR(100),
        bank_branch VARCHAR(255),
        invoice_prefix VARCHAR(10) DEFAULT 'INV',
        quotation_prefix VARCHAR(10) DEFAULT 'QT',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Company Settings table ensured.");

    // Seed default company if empty
    const checkCompany = await client.query("SELECT COUNT(*) FROM company_settings");
    if (parseInt(checkCompany.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO company_settings (name, email, website, vat_rate, currency) 
        VALUES ('Microtronic Tech (Thailand)', 'contact@microtronic.biz', 'www.microtronic.biz', 7.00, '฿')
      `);
      console.log("🌱 Seeded default company data.");
    }

    // Seed default patterns if empty
    const checkPatterns = await client.query("SELECT COUNT(*) FROM document_patterns");
    if (parseInt(checkPatterns.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO document_patterns (document_type, prefix) VALUES 
        ('quotation', 'QT'),
        ('invoice', 'INV'),
        ('receipt', 'REC'),
        ('journal', 'JV')
      `);
      console.log("🌱 Seeded default document patterns.");
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
