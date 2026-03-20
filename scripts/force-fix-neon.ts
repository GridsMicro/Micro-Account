import { query } from "./lib/db";
import bcrypt from "bcryptjs";

async function forceFixNeonTable() {
  console.log("🔥 Force fixing Neon users table...");
  try {
    // 1. Rename old table to avoid data mismatch
    const timestamp = Date.now();
    await query(`ALTER TABLE IF EXISTS users RENAME TO users_old_${timestamp};`);
    console.log(`📦 Old table renamed to users_old_${timestamp}`);

    // 2. Create fresh correct table
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
    console.log("✅ New 'users' table created with correct schema.");

    // 3. Optional: Create default admin
    const hashed = await bcrypt.hash('admin123', 10);
    await query(`
      INSERT INTO users (email, password, name, role, status)
      VALUES ('admin@microtronic.biz', $1, 'System Administrator', 'admin', 'Active');
    `, [hashed]);
    console.log("✅ Admin user created (admin@microtronic.biz / admin123)");

  } catch (err: any) {
    console.error("❌ Neon Fix Error:", err.message);
  } finally {
    process.exit(0);
  }
}

forceFixNeonTable();
