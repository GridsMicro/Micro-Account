"use server";

import { query } from "@/lib/db";
import { google } from "googleapis";
import * as ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { googleSheets, googleDrive } from "@/lib/google-server";
import { Readable } from "stream";
import {
  initializeRDClient,
  submitInvoiceToRD,
  submitWHTToRD,
  checkRDSubmissionStatus,
  batchSubmitToRD,
} from "@/lib/rd-api";
import { roundThaiTaxAmount } from "@/lib/tax";
import {
  contactMatchesUsage,
  mapContactTypeToLegacyValue,
  normalizeContactType,
} from "@/lib/contacts";
import { 
  createSalesJournalEntry,
  createReceiptJournalEntry,
  createExpenseJournalEntry,
  expandJournalRowsForPresentation
} from "@/lib/journaling";

// --- HELPERS ---

async function getOrCreateFolder(folderName: string) {
  try {
    const response = await googleDrive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id, name)",
      spaces: "drive",
    });
    const folders = response.data.files;
    if (folders && folders.length > 0) return folders[0].id;
    const folder = await googleDrive.files.create({
      requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder" },
      fields: "id",
    });
    return folder.data.id;
  } catch (error: any) {
    console.error("Folder Error:", error);
    return null;
  }
}

async function ensureContactsSchema() {
  try {
    await query(`
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS contact_type VARCHAR(20)
    `);
    await query(`
      UPDATE contacts
      SET contact_type = CASE
        WHEN LOWER(COALESCE(type, '')) IN ('vendor', 'supplier') THEN 'SUPPLIER'
        WHEN LOWER(COALESCE(type, '')) = 'both' THEN 'BOTH'
        WHEN LOWER(COALESCE(type, '')) = 'customer' THEN 'CUSTOMER'
        ELSE 'CUSTOMER'
      END
      WHERE contact_type IS NULL OR contact_type = ''
    `);
  } catch (e) {}
}

// --- CLOUD STORAGE & EXPORT ---

export async function uploadToGoogleDrive(base64Data: string, fileName: string, mimeType: string) {
  try {
    const folderId = await getOrCreateFolder("Micro Account Documents");
    const buffer = Buffer.from(base64Data.split(",")[1] || base64Data, "base64");
    const stream = Readable.from(buffer);
    const response = await googleDrive.files.create({
      requestBody: {
        name: `Receipt_${Date.now()}_${fileName}`,
        mimeType: mimeType,
        parents: folderId ? [folderId] : [],
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: "id, webViewLink",
    });
    const fileId = response.data.id;
    await googleDrive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    return { 
      success: true, 
      url: `https://drive.google.com/file/d/${fileId}/view`,
      fileName: fileName 
    };
  } catch (error: any) {
    console.error("Upload Error:", error);
    return { success: false, error: error.message };
  }
}

export async function exportJournalsToSheets() {
  try {
    const entries = await getJournalRowsForPresentation();
    if (entries.length === 0) throw new Error("ไม่มีข้อมูลให้ส่งออก");
    const folderId = await getOrCreateFolder('Micro Account Reports');
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Micro Account - รายงานสมุดรายวัน (${new Date().toLocaleDateString('th-TH')})`,
        },
      },
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("ไม่สามารถสร้างไฟล์ได้");
    if (folderId) {
      await googleDrive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        removeParents: 'root',
        fields: 'id, parents',
      });
    }
    const values = [
      ["วันที่", "เลขที่เอกสาร", "ชื่อบัญชี", "หมายเหตุ", "เดบิต (Dr.)", "เครดิต (Cr.)"],
      ...entries.map((e: any) => [
        new Date(e.entry_date).toLocaleDateString('th-TH'),
        e.reference_no || "-",
        e.account_name,
        e.description,
        Number(e.debit) || 0,
        Number(e.credit) || 0
      ])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });
    return { 
      success: true, 
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      message: `สร้างรายงานสำเร็จที่ ID: ${spreadsheetId}`
    };
  } catch (error: any) {
    console.error("❌ Google API Error:", error);
    return { success: false, error: error.message };
  }
}

// --- CONTACTS ACTIONS ---

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

// --- PRODUCTS & INVENTORY ---

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


// --- SERVICES ACTIONS ---

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


// --- INVOICES ACTIONS ---

export async function getCompanySettings() {
  try {
    const { rows } = await query(`SELECT * FROM company_settings LIMIT 1`);
    return { success: true, data: rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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

export async function getNextInvoiceNumber() {
  // Fallback prefix if settings fail
  let prefix = "INV";
  try {
    const sRes = await query(`SELECT invoice_prefix FROM company_settings LIMIT 1`);
    if (sRes.rows.length > 0) prefix = sRes.rows[0].invoice_prefix;
    
    const { rows } = await query(
      `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return { success: true, data: `${prefix}001` };
    const lastNum = parseInt(rows[0].invoice_number.replace(prefix, ""), 10);
    return { success: true, data: `${prefix}${String(isNaN(lastNum) ? 1 : lastNum + 1).padStart(3, "0")}` };
  } catch (error: any) {
    return { success: true, data: `${prefix}001` };
  }
}

async function hasModernJournalSchema(client: any) {
  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'journal_entries'
        AND column_name IN ('reference_type', 'reference_id')
    `
  );

  const columnNames = rows.map((row: any) => row.column_name);
  return columnNames.includes("reference_type") && columnNames.includes("reference_id");
}

async function assertModernJournalSchema(client: any) {
  const ready = await hasModernJournalSchema(client);
  if (!ready) {
    throw new Error("Modern journal schema is missing. Run scripts/migrate_journal_entries_neon.sql in Neon SQL Editor before creating new documents.");
  }
}

async function deleteInvoiceJournalEntries(client: any, invoiceId: number | string, invoiceNumber: string) {
  await client.query(
    `DELETE FROM journal_entries
     WHERE (reference_type = 'invoice' AND reference_id = $1)
        OR reference_no = $2
        OR document_number = $2`,
    [invoiceId, invoiceNumber]
  );
}

async function assertStableInvoiceJournal(
  client: any,
  invoiceId: number | string,
  invoiceNumber: string,
  netAmount: number,
  vatAmount: number
) {
  const { rows } = await client.query(
    `SELECT reference_no, document_number, credit_account_id, amount
     FROM journal_entries
     WHERE reference_type = 'invoice' AND reference_id = $1
     ORDER BY id ASC`,
    [invoiceId]
  );

  const revenueRows = rows.filter((row: any) => Number(row.credit_account_id || 0) === 4110);
  const vatRows = rows.filter((row: any) => Number(row.credit_account_id || 0) === 2121);

  const hasStableReference = rows.every(
    (row: any) => row.reference_no === invoiceNumber && row.document_number === invoiceNumber
  );

  if (
    rows.length !== (vatAmount > 0 ? 2 : 1) ||
    revenueRows.length !== 1 ||
    Number(revenueRows[0]?.amount || 0) !== Number(netAmount || 0) ||
    vatRows.length !== (vatAmount > 0 ? 1 : 0) ||
    Number(vatRows[0]?.amount || 0) !== Number(vatAmount || 0) ||
    !hasStableReference
  ) {
    throw new Error(`Invoice journal failed stability check for ${invoiceNumber}`);
  }
}

export async function createInvoice(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invRes = await client.query(
      `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date, quotation_id) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8) RETURNING id`,
      [
        data.invoice_number,
        data.contact_id,
        data.net_amount,
        data.vat_amount,
        data.status || "sent",
        data.due_date,
        data.date || new Date().toISOString().split("T")[0],
        data.quotation_id || null,
      ]
    );
    const invoiceId = invRes.rows[0].id;

    if (data.quotation_id) {
      await client.query("UPDATE quotations SET status = 'invoiced' WHERE id = $1", [data.quotation_id]);
    }

    for (const item of data.items) {
      const description = item.detail ? `${item.desc} (${item.detail})` : item.desc;
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoiceId,
          item.productId === "" || item.productId === "custom" ? null : item.productId,
          description,
          item.qty,
          item.price,
          Number(item.qty) * Number(item.price),
        ]
      );
    }
    const totalAmount = Number(data.net_amount) + Number(data.vat_amount);
    const invoiceDate = data.date || new Date().toISOString().split("T")[0];
    await assertModernJournalSchema(client);

    const journalResult = await createSalesJournalEntry(
      invoiceId,
      data.invoice_number,
      Number(data.contact_id),
      Number(data.net_amount),
      Number(data.vat_amount),
      totalAmount,
      invoiceDate,
      client,
      data.is_service === true 
    );

    if (!journalResult.success) {
      throw new Error(`Journal entry failed: ${journalResult.error}`);
    }
    await assertStableInvoiceJournal(
      client,
      invoiceId,
      data.invoice_number,
      Number(data.net_amount),
      Number(data.vat_amount)
    );
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true, id: invoiceId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Invoice Error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function createInvoiceRecord(data: any) { return createInvoice(data); }

export async function updateInvoice(id: string | number, data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE invoices SET status=$1, contact_id=$2, net_amount=$3, vat_amount=$4, due_date=$5, updated_at=NOW()
       WHERE id=$6`,
      [data.status, data.contact_id, data.net_amount, data.vat_amount, data.due_date, id]
    );
    await client.query(`DELETE FROM invoice_items WHERE invoice_id=$1`, [id]);
    for (const item of data.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, item.product_id || null, item.description, item.quantity, item.unit_price, item.total_price]
      );
    }
    await assertModernJournalSchema(client);
    const invRes = await client.query("SELECT invoice_number FROM invoices WHERE id = $1", [id]);
    const invNum = invRes.rows[0]?.invoice_number;
    if (invNum) {
      await deleteInvoiceJournalEntries(client, id, invNum);
      const journalResult = await createSalesJournalEntry(
        Number(id),
        invNum,
        Number(data.contact_id),
        Number(data.net_amount),
        Number(data.vat_amount),
        Number(data.net_amount) + Number(data.vat_amount),
        data.due_date,
        client
      );
      if (!journalResult.success) {
        throw new Error(`Journal entry failed: ${journalResult.error}`);
      }
      await assertStableInvoiceJournal(
        client,
        id,
        invNum,
        Number(data.net_amount),
        Number(data.vat_amount)
      );
    }
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function deleteInvoice(id: string | number) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query("SELECT invoice_number FROM invoices WHERE id = $1", [id]);
    if (r.rows.length === 0) return { success: false, error: "Not found" };
    await assertModernJournalSchema(client);
    const invNum = r.rows[0].invoice_number;
    await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [id]);
    if (invNum) await deleteInvoiceJournalEntries(client, id, invNum);
    await client.query("DELETE FROM invoices WHERE id = $1", [id]);
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function getInvoiceItems(id: string | number) {
  try {
    const { rows } = await query(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`, [id]);
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- QUOTATIONS ACTIONS ---

export async function getNextQuotationNumber() {
  const yearShort = new Date().getFullYear().toString().slice(-2);
  const prefix = `QT${yearShort}-`;
  try {
    const { rows } = await query(
      `SELECT quotation_number FROM quotations WHERE quotation_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return { success: true, data: `${prefix}001` };
    const lastNum = parseInt(rows[0].quotation_number.replace(prefix, ""), 10);
    return { success: true, data: `${prefix}${String(isNaN(lastNum) ? 1 : lastNum + 1).padStart(3, "0")}` };
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

// --- JOURNALS ACTIONS ---

export async function getJournalEntries() {
  try {
    return { success: true, data: await getJournalRowsForPresentation() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function getJournalRowsForPresentation() {
  const { rows } = await query(`
    SELECT
      je.*,
      inv.invoice_number,
      debit_acc.account_name_th AS debit_account_name_th,
      credit_acc.account_name_th AS credit_account_name_th
    FROM journal_entries je
    LEFT JOIN invoices inv ON je.reference_type = 'invoice' AND je.reference_id = inv.id
    LEFT JOIN chart_of_accounts debit_acc ON je.debit_account_id = debit_acc.id
    LEFT JOIN chart_of_accounts credit_acc ON je.credit_account_id = credit_acc.id
    ORDER BY je.entry_date DESC, COALESCE(je.reference_no, inv.invoice_number, je.document_number, '') ASC, je.id ASC
  `);

  return expandJournalRowsForPresentation(rows);
}

function extractAccountCode(accountLabel: string) {
  const value = String(accountLabel || "").trim();
  const bracketMatch = value.match(/^\[(.+?)\]/);
  if (bracketMatch?.[1]) return bracketMatch[1].trim();
  const codeMatch = value.match(/^(\d{3,10})\b/);
  if (codeMatch?.[1]) return codeMatch[1].trim();
  return "";
}

async function resolveChartAccount(accountLabel: string) {
  const accountCode = extractAccountCode(accountLabel);
  const normalized = String(accountLabel || "").replace(/^\[[^\]]+\]\s*/, "").trim();
  const params: any[] = [];
  let where = "";

  if (accountCode) {
    params.push(accountCode);
    where = `WHERE account_code::text = $1 OR legacy_code = $1`;
  } else if (normalized) {
    params.push(normalized);
    where = `
      WHERE COALESCE(account_name_th, '') ILIKE $1
         OR COALESCE(account_name_en, '') ILIKE $1
    `;
    params[0] = `%${normalized}%`;
  } else {
    return null;
  }

  const { rows } = await query(
    `
      SELECT
        id,
        account_code,
        legacy_code,
        COALESCE(account_name_th, account_name_en, account_code::text) AS account_name
      FROM chart_of_accounts
      ${where}
      ORDER BY account_code ASC
      LIMIT 1
    `,
    params
  );

  return rows[0] || null;
}

async function hasJournalAccountMappingColumns() {
  const { rows } = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'journal_entries'
        AND column_name IN ('debit_account_id', 'credit_account_id', 'amount', 'document_number')
    `
  );

  const names = rows.map((row: any) => row.column_name);
  return ["debit_account_id", "credit_account_id", "amount", "document_number"].every((name) =>
    names.includes(name)
  );
}

export async function createJournalEntry(data: any) {
  try {
    const account = await resolveChartAccount(data.account_name);
    const supportsMapping = await hasJournalAccountMappingColumns();
    const debit = Number(data.debit || 0);
    const credit = Number(data.credit || 0);
    const amount = debit > 0 ? debit : credit;
    const accountDisplayName = account
      ? `[${account.legacy_code || account.account_code}] ${account.account_name}`
      : data.account_name;

    const res = supportsMapping
      ? await query(
          `INSERT INTO journal_entries (
             entry_date, reference_no, account_name, description, debit, credit, receipt_url, journal_type,
             debit_account_id, credit_account_id, amount, document_number
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
          [
            data.entry_date,
            data.reference_no,
            accountDisplayName,
            data.description,
            debit,
            credit,
            data.receipt_url || null,
            data.journal_type || "general",
            debit > 0 ? account?.id || null : null,
            credit > 0 ? account?.id || null : null,
            amount,
            data.reference_no || null,
          ]
        )
      : await query(
          `INSERT INTO journal_entries (entry_date, reference_no, account_name, description, debit, credit, receipt_url, journal_type) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            data.entry_date,
            data.reference_no,
            accountDisplayName,
            data.description,
            debit,
            credit,
            data.receipt_url || null,
            data.journal_type || "general",
          ]
        );
    revalidatePath("/journals");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateJournalEntry(id: number | string, data: any) {
  try {
    const account = await resolveChartAccount(data.account_name);
    const supportsMapping = await hasJournalAccountMappingColumns();
    const debit = Number(data.debit || 0);
    const credit = Number(data.credit || 0);
    const amount = debit > 0 ? debit : credit;
    const accountDisplayName = account
      ? `[${account.legacy_code || account.account_code}] ${account.account_name}`
      : data.account_name;

    if (supportsMapping) {
      await query(
        `UPDATE journal_entries
         SET entry_date=$1,
             reference_no=$2,
             account_name=$3,
             description=$4,
             debit=$5,
             credit=$6,
             receipt_url=$7,
             debit_account_id=$8,
             credit_account_id=$9,
             amount=$10,
             document_number=$11
         WHERE id=$12`,
        [
          data.entry_date,
          data.reference_no,
          accountDisplayName,
          data.description,
          debit,
          credit,
          data.receipt_url || null,
          debit > 0 ? account?.id || null : null,
          credit > 0 ? account?.id || null : null,
          amount,
          data.reference_no || null,
          id,
        ]
      );
    } else {
      await query(
        `UPDATE journal_entries SET entry_date=$1, reference_no=$2, account_name=$3, description=$4, debit=$5, credit=$6, receipt_url=$7 
         WHERE id=$8`,
        [data.entry_date, data.reference_no, accountDisplayName, data.description, debit, credit, data.receipt_url || null, id]
      );
    }
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteJournalEntry(id: number | string) {
  try {
    await query("DELETE FROM journal_entries WHERE id = $1", [id]);
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportJournalsToExcel() {
  try {
    const entries = await getJournalRowsForPresentation();
    if (entries.length === 0) throw new Error("No data to export");
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Journals");
    
    worksheet.columns = [
      { header: "วันที่", key: "date", width: 15 },
      { header: "เอกสาร", key: "reference", width: 20 },
      { header: "ชื่อบัญชี", key: "account", width: 25 },
      { header: "รายการ", key: "description", width: 35 },
      { header: "เดบิต", key: "debit", width: 15 },
      { header: "เครดิต", key: "credit", width: 15 }
    ];
    
    entries.forEach((e: any) => {
      worksheet.addRow({
        date: new Date(e.entry_date).toLocaleDateString('th-TH'),
        reference: e.reference_no || "-",
        account: e.account_name,
        description: e.description,
        debit: Number(e.debit) || 0,
        credit: Number(e.credit) || 0
      });
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    worksheet.getColumn('debit').numFmt = '#,##0.00';
    worksheet.getColumn('credit').numFmt = '#,##0.00';
    
    const buffer = await workbook.xlsx.writeBuffer();
    return { success: true, data: Buffer.from(buffer).toString("base64"), filename: `Journal_${new Date().toISOString().split('T')[0]}.xlsx` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- VOUCHERS ACTIONS ---

export async function createPaymentVoucher(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const res = await client.query(
      `INSERT INTO payment_vouchers (
        voucher_no, payee_name, issue_date, amount, payment_method, 
        status, receipt_url, vat_amount, tax_id, expense_id, vendor_id, wht_amount
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        data.voucher_no, 
        data.payee_name, 
        data.issue_date, 
        data.amount, 
        data.payment_method, 
        data.status, 
        data.receipt_url || null,
        data.vat_amount || 0,
        data.tax_id || null,
        data.expense_id || null,
        data.vendor_id || null,
        data.withholding_amount || 0
      ]
    );
    const voucherId = res.rows[0].id;

    if (data.expense_id) {
      await client.query("UPDATE expenses SET status = 'paid' WHERE id = $1", [data.expense_id]);
    }

    const journalResult = await createExpenseJournalEntry(
      voucherId,
      data.vendor_id || 0, 
      Number(data.amount),
      Number(data.vat_amount || 0),
      data.category || "อื่นๆ",
      data.issue_date,
      Number(data.withholding_amount || 0),
      client
    );

    if (!journalResult.success) {
      throw new Error(`Auto-Journal failed: ${journalResult.error}`);
    }

    await client.query("COMMIT");
    revalidatePath("/vouchers");
    revalidatePath("/expenses");
    revalidatePath("/journals");
    return { success: true, id: voucherId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Voucher Error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function createPayment(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const res = await client.query(
      `INSERT INTO payments (
        payment_no, contact_id, invoice_id, amount, payment_date, 
        payment_method, status, notes
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7) RETURNING id`,
      [
        data.reference, 
        data.contactId, 
        data.invoiceId || null, 
        data.amount, 
        data.date, 
        data.paymentMethod, 
        data.description || null
      ]
    );
    const paymentId = res.rows[0].id;
    
    let vatAmount = 0;
    let isService = false;
    
    if (data.invoiceId) {
      const invRes = await client.query("SELECT vat_amount, is_service FROM invoices WHERE id = $1", [data.invoiceId]);
      if (invRes.rows.length > 0) {
        vatAmount = Number(invRes.rows[0].vat_amount || 0);
        isService = invRes.rows[0].is_service === true;
      }
      await client.query("UPDATE invoices SET status = 'paid' WHERE id = $1", [data.invoiceId]);
    }
    
    const journalResult = await createReceiptJournalEntry(
      paymentId,
      data.reference,
      Number(data.contactId),
      Number(data.amount),
      data.date,
      client,
      Number(data.withholdingAmount || 0),
      vatAmount,
      isService
    );

    if (!journalResult.success) {
      throw new Error(`Auto-Journal failed: ${journalResult.error}`);
    }

    await client.query("COMMIT");
    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath("/journals");
    return { success: true, id: paymentId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Payment Error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function markInvoiceAsPaid(id: number | string) {
  try {
    await query("UPDATE invoices SET status = 'paid' WHERE id = $1", [id]);
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPaymentVouchers() {
  try {
    const { rows } = await query(`SELECT * FROM payment_vouchers ORDER BY issue_date DESC`);
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- CHART OF ACCOUNTS CRUD ---

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

export async function exportVouchersToSheets() {
  try {
    const res = await query('SELECT * FROM payment_vouchers ORDER BY issue_date DESC, id ASC');
    const vouchers = res.rows;
    if (vouchers.length === 0) throw new Error("No data");
    const folderId = await getOrCreateFolder('Micro Account Reports');
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: { properties: { title: `Voucher Report ${new Date().toLocaleDateString('th-TH')}` } }
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const values = [
      ["Voucher No", "Payee", "Date", "Amount", "Method", "Status"],
      ...vouchers.map(v => [v.voucher_no, v.payee_name, new Date(v.issue_date).toLocaleDateString('th-TH'), v.amount, v.payment_method, v.status])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!, range: 'Sheet1!A1', valueInputOption: 'RAW', requestBody: { values }
    });
    return { success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` };
  } catch (err: any) { return { success: false, error: err.message }; }
}

// --- TAX & REPORTS ACTIONS ---

export async function getTaxSummary() {
  try {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const sRes = await query(`SELECT SUM(vat_amount) as v FROM invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`, [start, end]);
    const pRes = await query(`SELECT SUM(vat_amount) as v FROM payment_vouchers WHERE issue_date BETWEEN $1 AND $2`, [start, end]);
    const vs = Number(sRes.rows[0]?.v || 0);
    const vp = Number(pRes.rows[0]?.v || 0);
    return { success: true, data: { vatSales: vs, vatPurchase: vp, netVat: vs - vp, wht: 0 } };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getPP30Draft(month: number, year: number) {
  try {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    const sRes = await query(`SELECT COUNT(*)::int as c, COALESCE(SUM(net_amount),0) as s, COALESCE(SUM(vat_amount),0) as v FROM invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`, [start, end]);
    const pRes = await query(`SELECT COUNT(*)::int as c, COALESCE(SUM(amount),0) as s, COALESCE(SUM(amount * 0.07),0) as v FROM payment_vouchers WHERE issue_date BETWEEN $1 AND $2`, [start, end]);
    return {
      success: true,
      data: {
        sales: { documentCount: sRes.rows[0].c, taxableAmount: Number(sRes.rows[0].s), vatAmount: Number(sRes.rows[0].v) },
        purchases: { documentCount: pRes.rows[0].c, taxableAmount: Number(pRes.rows[0].s), vatAmount: Number(pRes.rows[0].v), items: [] },
        netVatPayable: Number(sRes.rows[0].v) - Number(pRes.rows[0].v)
      }
    };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getPNDReportDraft(type: string, month: number, year: number) {
  return { success: true, data: { items: [], totalWHT: 0 } };
}

export async function getPP36Draft(month: number, year: number) {
  return { success: true, data: { items: [], totalBase: 0, totalVat: 0 } };
}

export async function exportPP30ToTxt(month: number, year: number): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  return { success: true, data: Buffer.from("DUMMY").toString("base64"), filename: "PP30.txt" };
}

export async function exportPND53ToTxt(month: number, year: number): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  return { success: true, data: Buffer.from("DUMMY").toString("base64"), filename: "PND53.txt" };
}

export async function batchSubmitToRDPortal(ids: string[], type?: string): Promise<{ success: boolean; summary?: { successful: number; total: number }; results?: any[]; error?: string }> {
  return { success: true, summary: { successful: ids.length, total: ids.length } };
}

export async function setupRDAPI(config: any) {
  initializeRDClient(config);
  return { success: true };
}

export async function submitInvoiceToRDPortal(id: string) {
  const res = await submitInvoiceToRD(id);
  revalidatePath("/invoices");
  return res;
}

export async function exportMonthlySummaryToDrive() {
  try {
    const now = new Date();
    const folderId = await getOrCreateFolder("Micro Account Reports");
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: { properties: { title: `Budget Summary ${now.getMonth() + 1}/${now.getFullYear()}` } }
    });
    return { success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit` };
  } catch (err: any) { return { success: false, error: err.message }; }
}

// --- REMINDERS ACTIONS ---

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

// --- SETTINGS & DASHBOARD ---

export async function getDashboardAlerts() {
  try {
    const r = await query("SELECT * FROM reminders WHERE due_date >= NOW() AND status='pending' LIMIT 5");
    const i = await query("SELECT * FROM invoices WHERE status != 'paid' LIMIT 5");
    return { success: true, data: { reminders: r.rows, invoices: i.rows } };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function updateCompanySettings(data: any) {
  try {
    await query(
      `UPDATE company_settings SET name=$1, tax_id=$2, phone=$3, email=$4, address=$5, bank_name=$6, 
       bank_account_name=$7, bank_account_number=$8, bank_branch=$9, vat_rate=$10, withholding_tax_rate=$11, 
       is_vat_registered=$12, currency=$13, invoice_prefix=$14, quotation_prefix=$15,
       google_client_id=$16, google_client_secret=$17, google_refresh_token=$18, google_redirect_uri=$19, google_drive_enabled=$20
       WHERE id=(SELECT id FROM company_settings LIMIT 1)`,
      [data.name, data.tax_id, data.phone, data.email, data.address, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch, data.vat_rate, data.withholding_tax_rate, data.is_vat_registered, data.currency, data.invoice_prefix, data.quotation_prefix,
       data.google_client_id, data.google_client_secret, data.google_refresh_token, data.google_redirect_uri, data.google_drive_enabled]
    );
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getDocumentPatterns() {
  try {
    const res = await query("SELECT * FROM document_patterns ORDER BY id ASC");
    return { success: true, data: res.rows };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function updateDocumentPattern(id: number, data: any) {
  try {
    await query(
      `UPDATE document_patterns SET prefix=$1, include_year=$2, include_month=$3, separator=$4, digits=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6`,
      [data.prefix, data.include_year, data.include_month, data.separator, data.digits, id]
    );
    revalidatePath("/settings/patterns");
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getNextReferenceNo(type: string) {
  try {
    const journalType = type.toLowerCase();
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM journal_entries 
       WHERE journal_type = $1 AND fiscal_year = $2 AND fiscal_month = $3`,
      [journalType, year, month]
    );
    
    const prefix = type.toUpperCase().substring(0, 2);
    const nextNum = (parseInt(rows[0].count) + 1).toString().padStart(3, '0');
    const result = `${prefix}-${year}-${String(month).padStart(2, '0')}-${nextNum}`;
    
    return { success: true, data: result };
  } catch (error: any) {
    const fallback = `${type.toUpperCase().substring(0, 2)}-${new Date().getFullYear()}-001`;
    return { success: true, data: fallback };
  }
}
