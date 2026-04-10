"use server";

import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { checkUserLimit, getDefaultCompanyId } from "@/lib/auth";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password) {
    return { error: "กรุณากรอกข้อมูลให้ครบทุกช่อง" };
  }

  if (password !== confirmPassword) {
    return { error: "รหัสผ่านไม่ตรงกัน" };
  }

  if (password.length < 6) {
    return { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" };
  }

  try {
    // Check if user already exists
    const checkRes = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (checkRes.rows.length > 0) {
      return { error: "อีเมลนี้ถูกใช้งานไปแล้ว" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const companyId = await getDefaultCompanyId();
    const seatCheck = await checkUserLimit(companyId);
    if (!seatCheck.allowed) {
      return { error: "License Limit Reached: Please upgrade to add more users (300 THB/user/month)." };
    }

    // Insert user with core role standard and pending review status
    await query(
      "INSERT INTO users (name, email, password, role, status, company_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [name, email, hashedPassword, "user", "Pending", companyId]
    );

    // Redirect to login on success
    // We use a flag via return instead of direct redirect for better client handling
    return { success: true };
  } catch (error: any) {
    console.error("❌ Registration error full details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return { error: `เกิดข้อผิดพลาด: ${error.message || "กรุณาลองใหม่อีกครั้ง"}` };
  }
}
