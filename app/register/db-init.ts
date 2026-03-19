"use server";

import { query } from "@/lib/db";

export async function checkAndInitUsersTable() {
  try {
    console.log("🔍 Running DB Initialization...");
    
    // Check if table exists
    const checkRes = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    const exists = checkRes.rows[0].exists;
    
    if (!exists) {
      console.log("❌ Table 'users' not found. Creating...");
      await query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'Tester', -- Changed default to Tester
          status VARCHAR(20) DEFAULT 'Pending', -- Changed default to Pending
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return { success: true, message: "สร้างตาราง users สำเร็จ" };
    } else {
      // If table exists, check for mandatory columns
      const colRes = await query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users';
      `);
      
      const columns = colRes.rows.map(r => r.column_name.toLowerCase());
      console.log("📊 Existing columns:", columns);
      
      const missing = [];
      if (!columns.includes('email')) missing.push("email VARCHAR(255) UNIQUE NOT NULL");
      if (!columns.includes('password')) missing.push("password VARCHAR(255) NOT NULL");
      if (!columns.includes('name')) missing.push("name VARCHAR(255)");
      if (!columns.includes('role')) missing.push("role VARCHAR(50) DEFAULT 'Tester'");
      if (!columns.includes('status')) missing.push("status VARCHAR(20) DEFAULT 'Pending'");

      if (missing.length > 0) {
        console.log("⚠️ Schema mismatch detected. Performing HARD RESET...");
        
        // 1. Rename old table to backup
        const timestamp = Date.now();
        await query(`ALTER TABLE users RENAME TO users_backup_${timestamp};`);
        
        // 2. Create fresh table
        await query(`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'Tester',
            status VARCHAR(20) DEFAULT 'Pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        return { success: true, message: "ล้างและสร้างตาราง users ใหม่เรียบร้อยแล้ว" };
      }
      
      return { success: true, message: "โครงสร้างตารางสมบูรณ์แล้ว" };
    }
  } catch (error: any) {
    console.error("❌ DB Init Error:", error);
    return { success: false, error: error.message };
  }
}

export async function promoteUserAction(email: string) {
  try {
    const res = await query(
      "UPDATE users SET name = 'Admin', role = 'superadmin', status = 'Active' WHERE email = $1 RETURNING id, name, role, status",
      [email]
    );

    if (res.rows.length > 0) {
      return { success: true, message: `เปลี่ยนชื่อเป็น Admin และใช้บทบาท Super Admin เรียบร้อยแล้ว!` };
    } else {
      return { success: false, error: `ไม่พบอีเมล ${email} ในระบบ` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
