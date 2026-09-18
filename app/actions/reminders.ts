"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getReminders() {
  try {
    const res = await query("SELECT * FROM reminders WHERE status != 'deleted' ORDER BY due_date ASC");
    return { success: true, data: res.rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createReminder(data: any) {
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
  try {
    await query(`UPDATE reminders SET status = $1 WHERE id = $2`, [status, id]);
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteReminder(id: number | string) {
  try {
    await query(`UPDATE reminders SET status = 'deleted' WHERE id = $1`, [id]);
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
