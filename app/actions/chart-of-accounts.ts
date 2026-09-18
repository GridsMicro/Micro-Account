"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getAccounts(search: string = "") {
  try {
    const queryStr = search
      ? `SELECT id, account_code as code, account_name_th as name, account_name_en, account_type, account_category 
         FROM chart_of_accounts 
         WHERE account_code ILIKE $1 OR account_name_th ILIKE $1 OR account_name_en ILIKE $1
         ORDER BY account_code ASC`
      : `SELECT id, account_code as code, account_name_th as name, account_name_en, account_type, account_category 
         FROM chart_of_accounts 
         ORDER BY account_code ASC`;
    
    const params = search ? [`%${search}%`] : [];
    const { rows } = await query(queryStr, params);
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAccount(data: any) {
  try {
    const { rows } = await query(
      `INSERT INTO chart_of_accounts (account_code, account_name_th, account_name_en, account_type, account_category)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.account_code, data.account_name_th, data.account_name_en || null, data.account_type, data.account_category]
    );
    revalidatePath("/admin/coa");
    return { success: true, id: rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAccount(id: number, data: any) {
  try {
    await query(
      `UPDATE chart_of_accounts 
       SET account_code=$1, account_name_th=$2, account_name_en=$3, account_type=$4, account_category=$5
       WHERE id=$6`,
      [data.account_code, data.account_name_th, data.account_name_en || null, data.account_type, data.account_category, id]
    );
    revalidatePath("/admin/coa");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAccount(id: number) {
  try {
    const usage = await query(
      `SELECT id FROM journal_entries WHERE debit_account_id = $1 OR credit_account_id = $1 LIMIT 1`,
      [id]
    );
    if (usage.rows.length > 0) {
      throw new Error("ไม่สามารถลบบัญชีนี้ได้เนื่องจากมีการใช้งานในสมุดรายวันแล้ว");
    }

    await query(`DELETE FROM chart_of_accounts WHERE id = $1`, [id]);
    revalidatePath("/admin/coa");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
