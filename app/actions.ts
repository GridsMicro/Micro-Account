"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateContact(id: string, data: {
  name: string;
  contact_type: string;
  email: string;
  phone: string;
  address: string;
}) {
  try {
    await query(
      `UPDATE contacts 
       SET name = $1, contact_type = $2, email = $3, phone = $4, address = $5 
       WHERE id = $6`,
      [data.name, data.contact_type, data.email, data.phone, data.address, id]
    );
    revalidatePath("/contacts");
    return { success: true };
  } catch (error) {
    console.error("Failed to update contact:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function updateProduct(id: string, data: {
  name: string;
  sku_number: string;
  source_info: string;
  storage_location: string;
  stock_quantity: number;
  price: number;
  product_notes: string;
}) {
  try {
    await query(
      `UPDATE products 
       SET name = $1, sku_number = $2, source_info = $3, storage_location = $4, stock_quantity = $5, price = $6, product_notes = $7 
       WHERE id = $8`,
      [data.name, data.sku_number, data.source_info, data.storage_location, data.stock_quantity, data.price, data.product_notes, id]
    );
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function updateInvoice(id: string, data: {
  status: string;
}) {
  try {
    await query(
      `UPDATE invoices SET status = $1 WHERE id = $2`,
      [data.status, id]
    );
    revalidatePath("/invoices");
    return { success: true };
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function updateQuotation(id: string, data: {
  status: string;
}) {
  try {
    await query(
      `UPDATE quotations SET status = $1 WHERE id = $2`,
      [data.status, id]
    );
    revalidatePath("/quotations");
    return { success: true };
  } catch (error) {
    console.error("Failed to update quotation:", error);
    return { success: false, error: "Failed to update database" };
  }
}

export async function updateCompanySettings(data: {
  name: string;
  tax_id: string;
  phone: string;
  email: string;
  address: string;
  bank_name?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_branch?: string;
  vat_rate?: number;
  withholding_tax_rate?: number;
  is_vat_registered?: boolean;
  currency?: string;
  invoice_prefix?: string;
  quotation_prefix?: string;
}) {
  try {
    await query(
      `UPDATE company_settings 
       SET name = $1, tax_id = $2, phone = $3, email = $4, address = $5,
           bank_name = $6, bank_account_name = $7, bank_account_number = $8, bank_branch = $9,
           vat_rate = $10, withholding_tax_rate = $11, is_vat_registered = $12,
           currency = $13, invoice_prefix = $14, quotation_prefix = $15
       WHERE id = (SELECT id FROM company_settings LIMIT 1)`,
      [
        data.name, data.tax_id, data.phone, data.email, data.address,
        data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch,
        data.vat_rate, data.withholding_tax_rate, data.is_vat_registered,
        data.currency, data.invoice_prefix, data.quotation_prefix
      ]
    );
    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to update company settings:", error);
    return { success: false, error: "Failed to update database" };
  }
}

