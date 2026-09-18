"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getServices() {
  try {
    const { rows } = await query("SELECT * FROM services ORDER BY name ASC");
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getService(id: string | number) {
  try {
    const { rows } = await query("SELECT * FROM services WHERE id = $1", [id]);
    if (rows.length === 0) throw new Error("Service not found");
    return { success: true, data: rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createService(data: any) {
  try {
    const res = await query(
      `INSERT INTO services (service_code, name, description, service_type, unit_price, is_wht_applicable) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [
        data.service_code,
        data.name,
        data.description,
        data.service_type || 'service',
        data.unit_price || 0,
        data.is_wht_applicable ?? true,
      ]
    );
    revalidatePath("/services");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateService(id: string | number, data: any) {
  try {
    await query(
      `UPDATE services 
       SET service_code=$1, name=$2, description=$3, service_type=$4, unit_price=$5, is_wht_applicable=$6, updated_at=NOW()
       WHERE id=$7`,
      [
        data.service_code,
        data.name,
        data.description,
        data.service_type,
        data.unit_price,
        data.is_wht_applicable,
        id,
      ]
    );
    revalidatePath("/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteService(id: string | number) {
  try {
    await query(`DELETE FROM services WHERE id = $1`, [id]);
    revalidatePath("/services");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
