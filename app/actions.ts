"use server";

import { query } from "@/lib/db";
import { google } from "googleapis";
import * as xlsx from "xlsx";
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
  createExpenseJournalEntry
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
    const res = await query('SELECT * FROM journal_entries ORDER BY entry_date DESC, id ASC');
    const entries = res.rows;
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

// --- INVOICES ACTIONS ---

export async function getCompanySettings() {
  try {
    const { rows } = await query(`SELECT * FROM company_settings LIMIT 1`);
    return { success: true, data: rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextInvoiceNumber() {
  const yearShort = new Date().getFullYear().toString().slice(-2);
  const prefix = `INV${yearShort}-`;
  try {
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

export async function createInvoice(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invRes = await client.query(
      `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING id`,
      [
        data.invoice_number,
        data.contact_id,
        data.net_amount,
        data.vat_amount,
        data.status || "sent",
        data.due_date,
        data.date || new Date().toISOString().split("T")[0],
      ]
    );
    const invoiceId = invRes.rows[0].id;
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
    // Create automated journal entries using new system
    const totalAmount = Number(data.net_amount) + Number(data.vat_amount);
    const journalResult = await createSalesJournalEntry(
      invoiceId,
      data.invoice_number,
      data.contact_id,
      Number(data.net_amount),
      Number(data.vat_amount),
      totalAmount,
      data.date || new Date().toISOString().split("T")[0]
    );
    
    if (!journalResult.success) {
      throw new Error(`Journal entry failed: ${journalResult.error}`);
    }
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true, id: invoiceId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
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
    const invRes = await client.query("SELECT invoice_number FROM invoices WHERE id = $1", [id]);
    const invNum = invRes.rows[0]?.invoice_number;
    if (invNum) {
      await client.query(`DELETE FROM journal_entries WHERE reference_no=$1`, [invNum]);
      const total = Number(data.net_amount) + Number(data.vat_amount);
      await client.query(
        `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit) 
         VALUES ($1, $2, $3, 'ลูกหนี้การค้า', $4, 0)`,
        [data.due_date, invNum, `ลูกหนี้ #${invNum} (แก้ไข)`, total]
      );
      await client.query(
        `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit) 
         VALUES ($1, $2, $3, 'รายได้จากการขาย/บริการ', 0, $4)`,
        [data.due_date, invNum, `รายได้ #${invNum} (แก้ไข)`, data.net_amount]
      );
      if (Number(data.vat_amount) > 0) {
        await client.query(
          `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit) 
           VALUES ($1, $2, $3, 'ภาษีขาย', 0, $4)`,
          [data.due_date, invNum, `ภาษีขาย #${invNum} (แก้ไข)`, data.vat_amount]
        );
      }
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
    const invNum = r.rows[0].invoice_number;
    await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [id]);
    if (invNum) await client.query("DELETE FROM journal_entries WHERE reference_no = $1", [invNum]);
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
    const { rows } = await query(`SELECT * FROM journal_entries ORDER BY entry_date DESC, id ASC`);
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createJournalEntry(data: any) {
  try {
    const res = await query(
      `INSERT INTO journal_entries (entry_date, reference_no, account_name, description, debit, credit, receipt_url, journal_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        data.entry_date,
        data.reference_no,
        data.account_name,
        data.description,
        data.debit,
        data.credit,
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
    await query(
      `UPDATE journal_entries SET entry_date=$1, reference_no=$2, account_name=$3, description=$4, debit=$5, credit=$6, receipt_url=$7 
       WHERE id=$8`,
      [data.entry_date, data.reference_no, data.account_name, data.description, data.debit, data.credit, data.receipt_url || null, id]
    );
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

export async function getAccounts(search: string = "") {
  try {
    let q = "SELECT * FROM accounts";
    const params: any[] = [];
    if (search) {
      q += " WHERE code ILIKE $1 OR name ILIKE $1";
      params.push(`%${search}%`);
    }
    q += " ORDER BY code ASC LIMIT 50";
    const res = await query(q, params);
    return { success: true, data: res.rows };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function exportJournalsToExcel() {
  try {
    const res = await query('SELECT * FROM journal_entries ORDER BY entry_date DESC, id ASC');
    const entries = res.rows;
    if (entries.length === 0) throw new Error("No data to export");
    const data = entries.map(e => ({
      "วันที่": new Date(e.entry_date).toLocaleDateString('th-TH'),
      "เอกสาร": e.reference_no || "-",
      "ชื่อบัญชี": e.account_name,
      "รายการ": e.description,
      "เดบิต": Number(e.debit) || 0,
      "เครดิต": Number(e.credit) || 0
    }));
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Journals");
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    return { success: true, data: buffer.toString("base64"), filename: `Journal_${new Date().toISOString().split('T')[0]}.xlsx` };
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
      `INSERT INTO payment_vouchers (voucher_no, payee_name, issue_date, amount, payment_method, status, receipt_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.voucher_no, data.payee_name, data.issue_date, data.amount, data.payment_method, data.status, data.receipt_url || null]
    );
    await client.query(
      `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit) 
       VALUES ($1, $2, $3, 'ค่าใช้จ่ายทั่วไป', $4, 0)`,
      [data.issue_date, data.voucher_no, `จ่ายให้ ${data.payee_name}`, data.amount]
    );
    const bankAcc = data.payment_method === "Transfer" ? "เงินฝากธนาคาร" : "เงินสด";
    await client.query(
      `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit) 
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [data.issue_date, data.voucher_no, `จ่ายโดย ${data.payment_method}`, bankAcc, data.amount]
    );
    await client.query("COMMIT");
    revalidatePath("/vouchers");
    revalidatePath("/journals");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function getPaymentVouchers() {
  try {
    const { rows } = await query('SELECT * FROM payment_vouchers ORDER BY issue_date DESC, id ASC');
    return { success: true, data: rows };
  } catch (err: any) { return { success: false, error: err.message }; }
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
       is_vat_registered=$12, currency=$13, invoice_prefix=$14, quotation_prefix=$15 WHERE id=(SELECT id FROM company_settings LIMIT 1)`,
      [data.name, data.tax_id, data.phone, data.email, data.address, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch, data.vat_rate, data.withholding_tax_rate, data.is_vat_registered, data.currency, data.invoice_prefix, data.quotation_prefix]
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
  return { success: true, data: `${type.toUpperCase()}-001` };
}
