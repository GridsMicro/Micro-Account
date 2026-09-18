"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getQuotation(id: number | string) {
  try {
    const qRes = await query(`SELECT * FROM quotations WHERE id = $1`, [id]);
    if (qRes.rows.length === 0) throw new Error("Quotation not found");
    const iRes = await query(`SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC`, [id]);
    return { success: true, data: { ...qRes.rows[0], items: iRes.rows } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextQuotationNumber() {
  const yearShort = new Date().getFullYear().toString().slice(-2);
  const prefix = `QT${yearShort}-`;
  try {
    const { rows } = await query(
      `SELECT quotation_number FROM quotations ORDER BY quotation_number DESC LIMIT 1`
    );
    if (rows.length === 0) return { success: true, data: `${prefix}001` };
    
    const lastQuotation = rows[0].quotation_number;
    
    if (lastQuotation.startsWith(prefix)) {
      const lastNum = parseInt(lastQuotation.replace(prefix, ""), 10);
      if (!isNaN(lastNum)) {
        return { success: true, data: `${prefix}${String(lastNum + 1).padStart(3, "0")}` };
      }
    }
    
    const oldFormatMatch = lastQuotation.match(/-(\d+)$/);
    if (oldFormatMatch) {
      const lastNum = parseInt(oldFormatMatch[1], 10);
      if (!isNaN(lastNum)) {
        return { success: true, data: `${prefix}${String(lastNum + 1).padStart(3, "0")}` };
      }
    }
    
    return { success: true, data: `${prefix}001` };
  } catch (error: any) {
    return { success: true, data: `${prefix}001` };
  }
}

export async function createQuotation(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const qRes = await client.query(
      `INSERT INTO quotations (quotation_number, contact_id, total_amount, vat_amount, net_amount, notes, status, is_recurring, recurring_interval) 
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8) RETURNING id`,
      [
        data.quotation_number,
        data.contact_id,
        data.total_amount,
        data.vat_amount,
        data.net_amount,
        data.notes,
        data.is_recurring || false,
        data.recurring_interval || "none",
      ]
    );
    const qId = qRes.rows[0].id;
    for (const item of data.items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5)`,
        [qId, item.desc, item.qty, item.price, Number(item.qty) * Number(item.price)]
      );
    }
    await client.query("COMMIT");
    revalidatePath("/quotations");
    return { success: true, id: qId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function updateQuotation(id: number | string, data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE quotations SET contact_id=$1, total_amount=$2, vat_amount=$3, net_amount=$4, notes=$5, status=$6, is_recurring=$7, recurring_interval=$8
       WHERE id=$9`,
      [data.contact_id, data.total_amount, data.vat_amount, data.net_amount, data.notes, data.status, data.is_recurring || false, data.recurring_interval || 'none', id]
    );
    await client.query(`DELETE FROM quotation_items WHERE quotation_id=$1`, [id]);
    for (const item of data.items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.desc, item.qty, item.price, Number(item.qty) * Number(item.price)]
      );
    }
    await client.query("COMMIT");
    revalidatePath("/quotations");
    return { success: true };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function deleteQuotation(id: number | string) {
  try {
    await query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [id]);
    await query(`DELETE FROM quotations WHERE id = $1`, [id]);
    revalidatePath("/quotations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateQuotationStatus(id: number | string, status: string) {
  try {
    await query(`UPDATE quotations SET status = $1 WHERE id = $2`, [status, id]);
    revalidatePath("/quotations");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
