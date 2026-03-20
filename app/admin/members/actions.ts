"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateUserAction(id: string, data: { name: string, email: string, role: string, status: string }) {
  try {
    // 1. Update the user in the database
    await query(
      `UPDATE users SET name = $1, email = $2, role = $3, status = $4 WHERE id = $5`,
      [data.name, data.email, data.role, data.status, id]
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
