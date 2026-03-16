"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateContact(id: string, data: {
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  tax_id?: string;
}) {
  try {
    await query(
      `UPDATE contacts 
       SET name = $1, type = $2, email = $3, phone = $4, address = $5, tax_id = $6
       WHERE id = $7`,
      [data.name, data.type, data.email, data.phone, data.address, data.tax_id || null, id]
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
  type: string;
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
       SET name = $1, type = $2, sku_number = $3, source_info = $4, storage_location = $5, stock_quantity = $6, price = $7, product_notes = $8 
       WHERE id = $9`,
      [data.name, data.type, data.sku_number, data.source_info, data.storage_location, data.stock_quantity, data.price, data.product_notes, id]
    );
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update product:", error);
    return { success: false, error: error.message || "Failed to update database" };
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

export async function createContact(data: {
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  tax_id?: string;
}) {
  try {
    const res = await query(
      `INSERT INTO contacts (name, type, email, phone, address, tax_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.name, data.type, data.email, data.phone, data.address, data.tax_id || null]
    );
    revalidatePath("/contacts");
    return { success: true, id: res.rows[0].id };
  } catch (error) {
    console.error("Failed to create contact:", error);
    return { success: false, error: "Failed to create database entry" };
  }
}

export async function createProduct(data: {
  name: string;
  type: string;
  sku_number: string;
  source_info: string;
  storage_location: string;
  stock_quantity: number;
  price: number;
  product_notes: string;
}) {
  try {
    const res = await query(
      `INSERT INTO products (name, type, sku_number, source_info, storage_location, stock_quantity, price, product_notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [data.name, data.type, data.sku_number, data.source_info, data.storage_location, data.stock_quantity, data.price, data.product_notes]
    );
    revalidatePath("/inventory");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    console.error("Failed to create product:", error);
    return { success: false, error: error.message || "Failed to create database entry" };
  }
}

export async function createJournalEntry(data: {
  entry_date: string;
  reference_no: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  receipt_url?: string | null;
}) {
  try {
    const res = await query(
      `INSERT INTO journal_entries (entry_date, reference_no, account_name, description, debit, credit, receipt_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.entry_date, data.reference_no, data.account_name, data.description, data.debit, data.credit, data.receipt_url || null]
    );
    revalidatePath("/journals");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    console.error("Failed to create journal entry:", error);
    return { success: false, error: error.message || "Failed to create journal entry" };
  }
}
