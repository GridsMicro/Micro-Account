import { query } from "./lib/db";

async function checkAndFixUsersTable() {
  console.log("🔍 Checking users table in Neon...");
  try {
    // 1. Check if table exists
    const res = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const exists = res.rows[0].exists;
    
    if (exists) {
      console.log("✅ Table 'users' already exists.");
      
      // Check column 'status' as it's used in our registration but might be missing in some schemas
      const colRes = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status';
      `);
      
      if (colRes.rows.length === 0) {
        console.log("⚠️ Missing 'status' column. Adding it...");
        await query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'Active';`);
        console.log("✅ 'status' column added.");
      }
    } else {
      console.log("❌ Table 'users' NOT found. Creating it now...");
      await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'User',
          status VARCHAR(20) DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Table 'users' created successfully.");
      
      // Insert a default admin for safety if the table was just created
      // Default password will be 'admin123' (hashed)
      const bcrypt = require('bcryptjs');
      const hashed = await bcrypt.hash('admin123', 10);
      await query(`
        INSERT INTO users (email, password, name, role, status)
        VALUES ('admin@microtronic.biz', $1, 'System Administrator', 'admin', 'Active')
        ON CONFLICT (email) DO NOTHING;
      `, [hashed]);
      console.log("✅ Local Admin user created (admin@microtronic.biz / admin123)");
    }
  } catch (err) {
    console.error("❌ Database Error:", err);
  } finally {
    process.exit(0);
  }
}

checkAndFixUsersTable();
