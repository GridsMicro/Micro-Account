"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  contactMatchesUsage,
  normalizeContactType,
} from "@/lib/contacts";
import { ensureContactsSchema } from "@/lib/actions-helpers";

export async function getContacts(usage: "invoice" | "expense" | "all" = "all") {
  try {
    await ensureContactsSchema();
    const { rows } = await query(`SELECT * FROM contacts ORDER BY name ASC`);
    const filtered = rows
      .map((row: any) => ({
        ...row,
        contact_type: normalizeContactType(row.contact_type || row.type),
      }))
      .filter((row: any) => contactMatchesUsage(row.contact_type, usage));
    return { success: true, data: filtered };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContact(data: any) {
  try {
    const res = await query(
      `INSERT INTO contacts (name, type, email, phone, address, tax_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.name, data.type || "CUSTOMER", data.email, data.phone, data.address, data.tax_id]
    );
    revalidatePath("/contacts");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateContact(id: string | number, data: any) {
  try {
    await query(
      `UPDATE contacts 
       SET name = $1, type = $2, email = $3, phone = $4, address = $5, tax_id = $6
       WHERE id = $7`,
      [data.name, data.type, data.email, data.phone, data.address, data.tax_id || null, id]
    );
    revalidatePath("/contacts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
