"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  try {
    const { rows } = await query("SELECT * FROM products ORDER BY name ASC");
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextSkuNumber() {
  try {
    const { rows } = await query(
      `SELECT sku_number FROM products WHERE sku_number LIKE 'SKU-%' ORDER BY id DESC LIMIT 1`
    );
    if (rows.length > 0) {
      const match = rows[0].sku_number.match(/SKU-(\d+)/);
      if (match && match[1]) {
        const nextNum = parseInt(match[1], 10) + 1;
        return { success: true, sku: `SKU-${String(nextNum).padStart(6, "0")}` };
      }
    }
    return { success: true, sku: "SKU-000001" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: any) {
  try {
    const res = await query(
      `INSERT INTO products (name, category_name, type, sku_number, source_info, storage_location, stock_quantity, price, product_notes, supplier_cost, markup_rate) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [
        data.name,
        data.category_name,
        data.type,
        data.sku_number,
        data.source_info,
        data.storage_location,
        data.stock_quantity,
        data.price,
        data.product_notes,
        data.supplier_cost || 0,
        data.markup_rate || 0,
      ]
    );
    revalidatePath("/inventory");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProduct(id: string | number, data: any) {
  try {
    await query(
      `UPDATE products 
       SET name=$1, type=$2, sku_number=$3, source_info=$4, storage_location=$5, stock_quantity=$6, price=$7, product_notes=$8 
       WHERE id=$9`,
      [
        data.name,
        data.type,
        data.sku_number,
        data.source_info,
        data.storage_location,
        data.stock_quantity,
        data.price,
        data.product_notes,
        id,
      ]
    );
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProduct(id: string | number) {
  try {
    await query(`DELETE FROM products WHERE id = $1`, [id]);
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategories() {
  try {
    const { rows } = await query("SELECT * FROM product_categories ORDER BY name ASC");
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(name: string, description: string = "") {
  try {
    const { rows } = await query(
      `INSERT INTO product_categories (name, description) VALUES ($1, $2) RETURNING id`,
      [name, description]
    );
    return { success: true, id: rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCategory(id: number, name: string, description: string = "") {
  try {
    await query(
      `UPDATE product_categories SET name=$1, description=$2 WHERE id=$3`,
      [name, description, id]
    );
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCategory(id: number) {
  try {
    await query(`DELETE FROM product_categories WHERE id=$1`, [id]);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
