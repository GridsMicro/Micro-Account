"use server";
import { requireActionPermission, requireActiveAction } from "@/lib/server-auth";


import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getReminders() {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI
  const __guard = await requireActiveAction();
  if (__guard) return __guard;
  try {
    const res = await query("SELECT * FROM reminders WHERE status != 'deleted' ORDER BY due_date ASC");
    return { success: true, data: res.rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createReminder(data: any) {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (calendar:create)
  const __guard = await requireActionPermission("calendar", "create");
  if (__guard) return __guard;
  try {
    const res = await query(
      `INSERT INTO reminders (title, description, due_date, status, type) 
       VALUES ($1, $2, $3, 'pending', 'manual') RETURNING id`,
      [data.title, data.description, data.due_date]
    );
    revalidatePath("/calendar");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReminderStatus(id: number | string, status: string) {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (calendar:update)
  const __guard = await requireActionPermission("calendar", "update");
  if (__guard) return __guard;
  try {
    await query(`UPDATE reminders SET status = $1 WHERE id = $2`, [status, id]);
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteReminder(id: number | string) {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (calendar:delete)
  const __guard = await requireActionPermission("calendar", "delete");
  if (__guard) return __guard;
  try {
    await query(`UPDATE reminders SET status = 'deleted' WHERE id = $1`, [id]);
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
