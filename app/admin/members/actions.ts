"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth, checkUserLimit, getUserCompanyId } from "@/lib/auth";
import { canAccessAdmin, normalizeRole } from "@/lib/core-standards";

function hasMemberAdminAccess(role?: string | null) {
  return canAccessAdmin(role);
}

export async function createUserAction(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || !hasMemberAdminAccess((session.user as any).role)) {
      return { success: false, error: "Unauthorized: admin access required" };
    }

    if (!data.name || !data.email || !data.password) {
      return { success: false, error: "กรุณากรอกชื่อ อีเมล และรหัสผ่านให้ครบถ้วน" };
    }

    if (data.password.length < 6) {
      return { success: false, error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" };
    }

    const companyId = await getUserCompanyId((session.user as any).id);
    // superadmin bypasses user seat limit
    const isSuperAdmin = normalizeRole((session.user as any).role) === "superadmin";
    if (!isSuperAdmin) {
      const seatCheck = await checkUserLimit(companyId);
      if (!seatCheck.allowed) {
        return {
          success: false,
          error: "License Limit Reached: Please upgrade to add more users (300 THB/user/month).",
        };
      }
    }

    const existingUser = await query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [data.email]);
    if (existingUser.rows.length > 0) {
      return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    await query(
      `
        INSERT INTO users (name, email, password, role, status, company_id)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [data.name, data.email, hashedPassword, normalizeRole(data.role), data.status, companyId]
    );

    revalidatePath("/admin/members");
    return { success: true };
  } catch (error: any) {
    console.error("Create User Error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน" };
  }
}

export async function updateUserAction(id: string, data: { name: string, email: string, role: string, status: string }) {
  try {
    const session = await auth();
    if (!session?.user || !hasMemberAdminAccess((session.user as any).role)) {
      return { success: false, error: "Unauthorized: admin access required" };
    }

    // 1. Update the user in the database
    await query(
      `UPDATE users SET name = $1, email = $2, role = $3, status = $4 WHERE id = $5`,
      [data.name, data.email, normalizeRole(data.role), data.status, id]
    );

    // 2. Revalidate paths to show fresh data
    revalidatePath("/admin/members");
    revalidatePath(`/admin/members/edit/${id}`);

    return { success: true, message: "อัปเดตข้อมูลและสิทธิ์ผู้ใช้งานสำเร็จ" };
  } catch (error: any) {
    console.error("Update User Error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" };
  }
}
