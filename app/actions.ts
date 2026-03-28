"use server";
// Force recompile 1

import { query } from "@/lib/db";
import { sql } from "@vercel/postgres";
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
  batchSubmitToRD
} from "@/lib/rd-api";

/**
 * ฟังก์ชันช่วยหาหรือสร้างโฟลเดอร์ใน Google Drive
 */
async function getOrCreateFolder(folderName: string) {
  try {
    // 1. ค้นหาโฟลเดอร์ตามชื่อ
    const response = await googleDrive.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const folders = response.data.files;
    if (folders && folders.length > 0) {
      return folders[0].id; // คืนค่า ID ถ้าเจอแล้ว
    }

    // 2. ถ้าไม่เจอ ให้สร้างใหม่
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folder = await googleDrive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    console.log(`📂 Created new folder: ${folderName} (ID: ${folder.data.id})`);
    return folder.data.id;
  } catch (error: any) {
    console.error("Folder Creation Error:", error);
    return null; // Fallback to root if folder creation fails
  }
}

/**
 * Server Action: อัปโหลดไฟล์จากเครื่องขึ้น Google Drive (Autonomous Storage)
 */
export async function uploadToGoogleDrive(base64Data: string, fileName: string, mimeType: string) {
  try {
    // 1. เตรียมโฟลเดอร์เป้าหมาย
    const folderId = await getOrCreateFolder('Micro Account Documents');

    // 2. แปลงไฟล์จาก Base64 เป็น Buffer
    const buffer = Buffer.from(base64Data.split(",")[1] || base64Data, "base64");
    const stream = Readable.from(buffer);

    // 3. ยิงขึ้น Drive
    const response = await googleDrive.files.create({
      requestBody: {
        name: `Receipt_${Date.now()}_${fileName}`,
        mimeType: mimeType,
        parents: folderId ? [folderId] : [], // ใส่ในโฟลเดอร์ถ้ามี
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: "id, webViewLink",
    });

    const fileId = response.data.id;

    // 4. ปรับสิทธิ์ให้ดูได้ (หรือแชร์เฉพาะคนตามระบบเรา)
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

// ส่งออกรายการสมุดรายวันไปยัง Google Sheets
export async function exportJournalsToSheets() {
  try {
    // 1. ดึงข้อมูลจาก DB
    const res = await query('SELECT * FROM journal_entries ORDER BY entry_date DESC, id ASC');
    const entries = res.rows;

    if (entries.length === 0) {
      throw new Error("ไม่มีข้อมูลให้ส่งออก");
    }

    // 2. เตรียมโฟลเดอร์เป้าหมาย
    const folderId = await getOrCreateFolder('Micro Account Reports');

    // 3. สร้าง Spreadsheet ใหม่
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Micro Account - รายงานสมุดรายวัน (${new Date().toLocaleDateString('th-TH')})`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("ไม่สามารถสร้างไฟล์ได้");

    // ย้ายไฟล์เข้าโฟลเดอร์ (Sheets API สร้างไฟล์แล้วต้องใช้ Drive API ย้าย)
    if (folderId) {
      await googleDrive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        removeParents: 'root', // Remove from root if necessary
        fields: 'id, parents',
      });
    }

    // 4. เตรียมข้อมูล
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

    // 5. เขียนข้อมูลลงใน Sheet
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    // 6. ดึงอีเมลผู้รับจากฐานข้อมูล (User ที่เป็น admin คนแรก)
    const memberRes = await query("SELECT email FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1");
    const targetEmail = memberRes.rows[0]?.email || "grids@microtronic.biz";

    // 6. ตั้งค่าสิทธิ์แบบใครมีลิงก์ก็ดูได้ (เทสเข้มข้น)
    try {
      await googleDrive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError: any) {
      console.warn("Permission Error (Non-fatal):", permError.message);
      // ถ้าแชร์ไม่ได้ ไม่เป็นไร แต่อย่างน้อยไฟล์ต้องสร้างสำเร็จ
    }

    return { 
      success: true, 
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      message: `สร้างรายงานสำเร็จที่ ID: ${spreadsheetId}`
    };
  } catch (error: any) {
    console.error("❌ Google API Error:", error);
    
    // พ่น Raw Error ออกมาให้พี่เห็นชัดๆ
    let rawMsg = error.message;
    let errorMsg = "❌ เกิดปัญหา: " + rawMsg;
    
    if (rawMsg.includes("permission") || rawMsg.includes("access_denied")) {
      errorMsg = "❌ สิทธิ์ไม่พอ (Permission Denied): บอทยังไม่มีสิทธิ์สร้างไฟล์ใน Domain ของพี่ [" + rawMsg + "]\n💡 วิธีแก้: รบกวนพี่ไปที่หน้า IAM แล้วเพิ่ม Role 'Editor' ให้กับ finance-sync-bot@microtronic-finance-bot.iam.gserviceaccount.com ครับ";
    } else if (rawMsg.includes("invalid_grant")) {
      errorMsg = "❌ กุญแจ JSON มีปัญหา: กรุณาตรวจสอบค่าใน Vercel [" + rawMsg + "]";
    }
    
    return { success: false, error: errorMsg };
  }
}

// ส่งออกใบสำคัญจ่ายไปยัง Google Sheets
export async function exportVouchersToSheets() {
  try {
    const res = await query('SELECT * FROM payment_vouchers ORDER BY issue_date DESC, id ASC');
    const vouchers = res.rows;

    if (vouchers.length === 0) {
      throw new Error("ไม่มีข้อมูลใบสำคัญจ่ายให้ส่งออก");
    }

    const folderId = await getOrCreateFolder('Micro Account Reports');
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Micro Account - รายงานใบสำคัญจ่าย (${new Date().toLocaleDateString('th-TH')})`,
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
      ["เลขที่ใบสำคัญ", "ผู้รับเงิน", "วันที่ออก", "จำนวนเงิน", "ช่องทาง", "สถานะ"],
      ...vouchers.map((v: any) => [
        v.voucher_no || `PV-${String(v.id).padStart(5, '0')}`,
        v.payee_name || "-",
        new Date(v.issue_date).toLocaleDateString('th-TH'),
        Number(v.amount) || 0,
        v.payment_method || "Cash",
        v.status || "Pending"
      ])
    ];

    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    try {
      await googleDrive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (e) {}

    return { 
      success: true, 
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      message: `ส่งออกใบสำคัญจ่ายสำเร็จ`
    };
  } catch (error: any) {
    console.error("❌ Export Vouchers Error:", error);
    return { success: false, error: "❌ ไม่สามารถส่งออกข้อมูลได้: " + error.message };
  }
}

// ฟังก์ชันส่งออกเป็น Excel (ดาวน์โหลดลงเครื่อง)
export async function exportJournalsToExcel() {
  try {
    const { rows: entries } = await sql`
      SELECT entry_date, reference_no, account_name, description, debit, credit 
      FROM journal_entries 
      ORDER BY entry_date DESC, id ASC
    `;

    if (entries.length === 0) {
      throw new Error("ไม่มีข้อมูลสำหรับส่งออก");
    }

    // สร้าง Header และข้อมูลให้ตรงกับที่แสดงหน้าเว็บ
    const data = entries.map(entry => ({
      "วันที่": new Date(entry.entry_date).toLocaleDateString('th-TH'),
      "เอกสารอ้างอิง": entry.reference_no || "-",
      "ชื่อบัญชี": entry.account_name,
      "รายการ": entry.description,
      "เดบิต (Dr.)": Number(entry.debit) || 0,
      "เครดิต (Cr.)": Number(entry.credit) || 0
    }));

    // สร้าง Workbook
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Journal Entries");

    // แปลงเป็น Base64 หรือ Buffer
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
    const base64 = buffer.toString("base64");

    return { success: true, data: base64, filename: `Journal_Export_${new Date().toISOString().split('T')[0]}.xlsx` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ฟังก์ชันดึงข้อมูลทั้งหมดสำหรับสร้าง PDF/รายงานหน้าบ้าน
export async function getJournalEntries() {
  try {
    const { rows } = await sql`
      SELECT entry_date, reference_no, account_name, description, debit, credit 
      FROM journal_entries 
      ORDER BY entry_date DESC, id ASC
    `;
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ดึงรายชื่อผู้ติดต่อ (เพื่อใช้เลือกในหน้าจัดการเงิน)
export async function getContacts() {
  try {
    const { rows } = await sql`SELECT * FROM contacts ORDER BY name ASC`;
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ดึงข้อมูลบริษัทปัจจุบัน (สำหรับหัวกระดาษใบเสร็จ)
export async function getCompanySettings() {
  try {
    const { rows } = await sql`SELECT * FROM company_settings LIMIT 1`;
    return { success: true, data: rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ดึงเลขที่ใบแจ้งหนี้ถัดไป (รูปแบบสั้น: INV26-001)
export async function getNextInvoiceNumber() {
  const yearShort = new Date().getFullYear().toString().slice(-2); // e.g. "26"
  const prefix = `INV${yearShort}-`; // e.g. "INV26-"
  try {
    const { rows } = await query(
      `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    if (rows.length === 0) {
      return { success: true, data: `${prefix}001` };
    }

    const lastRef = rows[0].invoice_number as string;
    const lastNum = parseInt(lastRef.replace(prefix, ''), 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    const formattedNum = nextNum.toString().padStart(3, '0');

    return { success: true, data: `${prefix}${formattedNum}` };
  } catch (error: any) {
    return { success: true, data: `${prefix}001` }; // Fallback
  }
}

// บันทึกใบแจ้งหนี้ลงตาราง invoices + บันทึกบัญชีอัตโนมัติ
export async function createInvoiceRecord(data: {
  invoice_number: string;
  contact_id: string;
  net_amount: number;
  vat_amount: number;
  status: string;
  due_date: string;
}) {
  try {
    const totalAmount = Number(data.net_amount) + Number(data.vat_amount);
    // 1. ตรวจสอบ/เพิ่มคอลัมน์ contact_id ก่อนบันทึก Invoice
    try {
      await query("SELECT contact_id FROM invoices LIMIT 1");
    } catch (e: any) {
      if (e.code === '42703') { // undefined_column
        await query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contact_id INTEGER");
      } else if (e.code === '42P01') { // undefined_table
        await query(`
          CREATE TABLE IF NOT EXISTS invoices (
            id SERIAL PRIMARY KEY,
            invoice_number VARCHAR(100) UNIQUE,
            contact_id INTEGER,
            status VARCHAR(50) DEFAULT 'draft',
            net_amount DECIMAL(15, 2) DEFAULT 0.00,
            vat_amount DECIMAL(15, 2) DEFAULT 0.00,
            issue_date DATE,
            due_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }
    }

    // 2. บันทึก Invoice
    await query(
      `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [data.invoice_number, data.contact_id, data.net_amount, data.vat_amount, data.status, data.due_date]
    );

    // 2. บันทึกบัญชีอัตโนมัติ (Journal Entry)
    // Dr. ลูกหนี้การค้า
    await query(
      `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit)
       VALUES (NOW(), $1, $2, 'ลูกหนี้การค้า', $3, 0)`,
      [data.invoice_number, `รายได้จากใบแจ้งหนี้ #${data.invoice_number}`, totalAmount]
    );

    // Cr. รายได้จากการขาย/บริการ
    await query(
      `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit)
       VALUES (NOW(), $1, $2, 'รายได้จากการขาย/บริการ', 0, $3)`,
      [data.invoice_number, `รายได้จากใบแจ้งหนี้ #${data.invoice_number}`, data.net_amount]
    );

    // Cr. ภาษีขาย (ถ้ามี VAT)
    if (data.vat_amount > 0) {
      await query(
        `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit)
         VALUES (NOW(), $1, $2, 'ภาษีขาย', 0, $3)`,
        [data.invoice_number, `ภาษีขายจาก #"${data.invoice_number}`, data.vat_amount]
      );
    }

    revalidatePath("/invoices");
    revalidatePath("/journals");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error creating invoice record:", error);
    return { success: false, error: error.message };
  }
}

export async function getNextQuotationNumber() {
  const yearShort = new Date().getFullYear().toString().slice(-2); // e.g. "26"
  const prefix = `QT${yearShort}-`; // e.g. "QT26-"
  try {
    // Find latest quotation with this year prefix
    const { rows } = await query(`
      SELECT quotation_number FROM quotations 
      WHERE quotation_number LIKE $1 
      ORDER BY id DESC LIMIT 1
    `, [`${prefix}%`]);

    if (rows.length === 0) {
      return { success: true, data: `${prefix}001` };
    }

    const lastRef = rows[0].quotation_number as string;
    const lastNum = parseInt(lastRef.replace(prefix, ''), 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    const formattedNum = nextNum.toString().padStart(3, '0');

    return { success: true, data: `${prefix}${formattedNum}` };
  } catch (error: any) {
    return { success: true, data: `${prefix}001` };
  }
}

export async function createQuotation(data: {
  quotation_number: string;
  contact_id: number;
  total_amount: number;
  vat_amount: number;
  net_amount: number;
  notes: string;
  items: any[];
  is_recurring?: boolean;
  recurring_interval?: string;
}) {
  const pool = (await import('@/lib/db')).default;
  const client = await pool.connect();

  try {
    // One-time check for recurring columns if they might be missing
    try {
      await client.query("SELECT is_recurring FROM quotations LIMIT 1");
    } catch (e: any) {
      if (e.code === '42703') { // undefined_column
        await client.query("ALTER TABLE quotations ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE");
        await client.query("ALTER TABLE quotations ADD COLUMN IF NOT EXISTS recurring_interval VARCHAR(20) DEFAULT 'none'");
      }
    }

    await client.query('BEGIN');
    
    // Insert into quotations
    const qRes = await client.query(
      `INSERT INTO quotations (quotation_number, contact_id, total_amount, vat_amount, net_amount, notes, status, created_at, is_recurring, recurring_interval)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW(), $7, $8) RETURNING id`,
      [data.quotation_number, data.contact_id, data.total_amount, data.vat_amount, data.net_amount, data.notes, data.is_recurring || false, data.recurring_interval || 'none']
    );
    const quotationId = qRes.rows[0].id;

    // Insert items
    for (const item of data.items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [quotationId, item.desc, item.qty, item.price, item.qty * item.price]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/quotations');
    revalidatePath(`/quotations/${quotationId}/preview`, 'page');
    revalidatePath(`/quotations/edit/${quotationId}`, 'page');
    return { success: true, id: quotationId };
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch {}
    
    // Auto-migration block if tables are missing some columns or don't exist
    if (error.code === '42P01') {
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS quotations (
            id SERIAL PRIMARY KEY,
            quotation_number VARCHAR(100),
            contact_id INT,
            total_amount FLOAT,
            vat_amount FLOAT,
            net_amount FLOAT,
            notes TEXT,
            status VARCHAR(50),
            is_recurring BOOLEAN DEFAULT FALSE,
            recurring_interval VARCHAR(20) DEFAULT 'none',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS quotation_items (
            id SERIAL PRIMARY KEY,
            quotation_id INT,
            description TEXT,
            quantity INT,
            unit_price FLOAT,
            total_price FLOAT
          );
        `);
        // Retry
        await client.query('BEGIN');
        const qResRetry = await client.query(
          `INSERT INTO quotations (quotation_number, contact_id, total_amount, vat_amount, net_amount, notes, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW()) RETURNING id`,
          [data.quotation_number, data.contact_id, data.total_amount, data.vat_amount, data.net_amount, data.notes]
        );
        const retryId = qResRetry.rows[0].id;
        for (const item of data.items) {
          await client.query(
            `INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [retryId, item.desc, item.qty, item.price, item.qty * item.price]
          );
        }
        await client.query('COMMIT');
        revalidatePath('/quotations');
        return { success: true, id: retryId };
      } catch (e2) {
        console.error("Migration/Retry Failed:", e2);
      }
    }
    
    console.error("Failed to create quotation:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function updateQuotation(id: number, data: {
  contact_id: number;
  total_amount: number;
  vat_amount: number;
  net_amount: number;
  notes: string;
  items: any[];
  is_recurring?: boolean;
  recurring_interval?: string;
  status: string;
}) {
  const pool = (await import('@/lib/db')).default;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Update main quotation
    await client.query(
      `UPDATE quotations 
       SET contact_id = $1, total_amount = $2, vat_amount = $3, net_amount = $4, notes = $5, status = $6, is_recurring = $7, recurring_interval = $8
       WHERE id = $9`,
      [data.contact_id, data.total_amount, data.vat_amount, data.net_amount, data.notes, data.status, data.is_recurring || false, data.recurring_interval || 'none', id]
    );

    // Delete old items and insert new ones (simpler than syncing)
    await client.query(`DELETE FROM quotation_items WHERE quotation_id = $1`, [id]);
    
    for (const item of data.items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.desc, item.qty, item.price, item.qty * item.price]
      );
    }

    await client.query('COMMIT');
    revalidatePath('/quotations');
    revalidatePath(`/quotations/${id}/preview`, 'page');
    revalidatePath(`/quotations/edit/${id}`, 'page');
    return { success: true };
  } catch (error: any) {
    try { await client.query('ROLLBACK'); } catch {}
    console.error("Failed to update quotation:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}




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

export async function getProducts() {
  try {
    const { rows } = await query('SELECT * FROM products ORDER BY name ASC');
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextSkuNumber() {
  try {
    const { rows } = await query(`
      SELECT sku_number FROM products 
      WHERE sku_number LIKE 'SKU-%' 
      ORDER BY id DESC LIMIT 1
    `);
    if (rows.length > 0 && rows[0].sku_number) {
      const match = rows[0].sku_number.match(/SKU-(\d+)/);
      if (match && match[1]) {
        const nextNum = parseInt(match[1], 10) + 1;
        return { success: true, sku: `SKU-${String(nextNum).padStart(6, '0')}` };
      }
    }
    return { success: true, sku: 'SKU-000001' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCategories() {
  try {
    const { rows } = await query('SELECT * FROM product_categories ORDER BY name ASC');
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCategory(name: string, description: string = '') {
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
  category_name?: string;
  type: string;
  sku_number: string;
  source_info: string;
  storage_location: string;
  stock_quantity: number;
  price: number;
  product_notes: string;
}) {
  // Import pool for transaction support
  const pool = (await import('@/lib/db')).default;
  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Try to insert
    const res = await client.query(
      `INSERT INTO products (name, category_name, type, sku_number, source_info, storage_location, stock_quantity, price, product_notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [data.name, data.category_name || null, data.type, data.sku_number, data.source_info, data.storage_location, data.stock_quantity, data.price, data.product_notes]
    );

    await client.query('COMMIT');
    revalidatePath("/inventory");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Ignore rollback errors
    }

    let isHandled = false;

    // Handle missing columns error
    if (error.code === '42703' && /sku_number|source_info|storage_location|stock_quantity|product_notes/i.test(error.message || '')) {
      isHandled = true;
      console.log('⚠️ ตรวจพบตารางไม่ครบ: กำลังปรับปรุงคอลัมน์อัตโนมัติ (Auto-Migration)...');
      try {
        await client.query(`
          ALTER TABLE products
          ADD COLUMN IF NOT EXISTS sku_number VARCHAR(100),
          ADD COLUMN IF NOT EXISTS source_info TEXT,
          ADD COLUMN IF NOT EXISTS storage_location TEXT,
          ADD COLUMN IF NOT EXISTS stock_quantity INT DEFAULT 0,
          ADD COLUMN IF NOT EXISTS product_notes TEXT;
        `);

        try {
          await client.query(`
            ALTER TABLE products
            ADD CONSTRAINT products_sku_number_unique UNIQUE (sku_number);
          `);
        } catch {
          // Constraint might already exist
        }
      } catch (alterError: any) {
        console.error('Failed to alter table:', alterError);
      }
    }

    // Handle primary key conflict by resetting sequence
    if (error.code === '23505' && error.constraint === 'products_pkey') {
      isHandled = true;
      console.log('⚠️ ตรวจพบเลข ID ซ้ำ (Sequence Out of Sync): กำลังรีเซ็ต Sequence ให้ตรงกับตารางปัจจุบันอัตโนมัติ...');
      try {
        // Reset sequence to max(id) -> Next value generated will be max(id) + 1
        await client.query(`
          SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
        `);
      } catch (seqError: any) {
        console.error('Failed to reset sequence:', seqError);
      }
    }

    if (!isHandled) {
      console.error("❌ Failed to create product (Unhandled error):", error);
    }

    // Retry insertion after fixes
    try {
      await client.query('BEGIN');
      const resRetry = await client.query(
        `INSERT INTO products (name, category_name, type, sku_number, source_info, storage_location, stock_quantity, price, product_notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [data.name, data.category_name || null, data.type, data.sku_number, data.source_info, data.storage_location, data.stock_quantity, data.price, data.product_notes]
      );
      await client.query('COMMIT');
      revalidatePath('/inventory');
      return { success: true, id: resRetry.rows[0].id };
    } catch (retryError: any) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // Ignore rollback errors
      }
      console.error('Failed to create product after retry:', retryError);
      return { success: false, error: retryError.message || 'Failed to create database entry' };
    }
  } finally {
    client.release();
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
  journal_type?: string;
}) {
  try {
    const res = await query(
      `INSERT INTO journal_entries (entry_date, reference_no, account_name, description, debit, credit, receipt_url, journal_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [data.entry_date, data.reference_no, data.account_name, data.description, data.debit, data.credit, data.receipt_url || null, data.journal_type || 'general']
    );
    revalidatePath("/journals");
    if (res.rows && res.rows[0]) {
      return { success: true, id: res.rows[0].id };
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create journal entry:", error);
    return { success: false, error: error.message || "Failed to create journal entry" };
  }
}

// ลบรายการบัญชีรายวัน (Fix: ใช้ @vercel/postgres sql เพื่อความชัวร์บน Vercel)
export async function deleteJournalEntry(id: number | string) {
  try {
    console.log(`🗑️ [DELETE ACTION] Target ID: ${id}`);
    
    // ลองใช้ sql ตรงๆ จาก @vercel/postgres เพราะมักจะจัดการ Connection Pool ได้ดีกว่าในเคส Delete
    const { rowCount } = await sql`DELETE FROM journal_entries WHERE id = ${id}`;
    
    console.log(`✅ [DELETE ACTION] Result: Deleted ${rowCount} rows`);
    
    if (rowCount === 0) {
      // ลองค้นหาดูก่อนว่ามี ID นี้จริงไหม (เพื่อ Debug)
      const checkRes = await sql`SELECT id FROM journal_entries WHERE id = ${id}`;
      if (checkRes.rowCount === 0) {
        return { success: false, error: `ไม่บพบรายการ ID: ${id} ในฐานข้อมูล` };
      }
      return { success: false, error: "ไม่สามารถลบได้ แม้จะมีข้อมูลอยู่ (Database Constraint?)" };
    }

    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    console.error("❌ [DELETE ACTION] Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: " + error.message };
  }
}

// แก้ไขรายการบัญชีรายวัน
export async function updateJournalEntry(id: number, data: {
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
      `UPDATE journal_entries 
       SET entry_date=$1, reference_no=$2, account_name=$3, description=$4, debit=$5, credit=$6, receipt_url=$7
       WHERE id=$8`,
      [data.entry_date, data.reference_no, data.account_name, data.description, data.debit, data.credit, data.receipt_url || null, id]
    );
    
    if (res.rowCount === 0) {
      return { success: false, error: "ไม่พบรายการที่ต้องการแก้ไข" };
    }

    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    console.error("Update Journal Error:", error);
    return { success: false, error: error.message };
  }
}

// ดึงรายการผังบัญชี (Chart of Accounts)
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
    console.error("Get Accounts Error:", err);
    return { success: false, error: err.message };
  }
}
// ดึงการตั้งค่าแพทเทิร์นเอกสารทั้งหมด
export async function getDocumentPatterns() {
  try {
    const res = await query("SELECT * FROM document_patterns ORDER BY id ASC");
    return { success: true, data: res.rows };
  } catch (err: any) {
    console.error("Get Patterns Error:", err);
    return { success: false, error: err.message };
  }
}

// อัปเดตแพทเทิร์นเอกสาร
export async function updateDocumentPattern(id: number, data: {
  prefix: string,
  include_year: boolean,
  include_month: boolean,
  separator: string,
  digits: number
}) {
  try {
    await query(
      `UPDATE document_patterns 
       SET prefix=$1, include_year=$2, include_month=$3, separator=$4, digits=$5, updated_at=CURRENT_TIMESTAMP
       WHERE id=$6`,
      [data.prefix, data.include_year, data.include_month, data.separator, data.digits, id]
    );
    revalidatePath("/settings/patterns");
    return { success: true };
  } catch (err: any) {
    console.error("Update Pattern Error:", err);
    return { success: false, error: err.message };
  }
}
// เจนเลขที่เอกสารลำดับถัดไป
export async function getNextReferenceNo(type: string) {
  try {
    const res = await query("SELECT * FROM document_patterns WHERE document_type = $1", [type]);
    if (res.rows.length === 0) return { success: false, error: "Pattern not found" };
    
    const p = res.rows[0];
    const nextNum = (p.last_number || 0) + 1;
    
    // Format: PREFIX-YYYY-MM-0001
    const year = p.include_year ? new Date().getFullYear().toString() : "";
    const month = p.include_month ? (new Date().getMonth() + 1).toString().padStart(2, '0') : "";
    const digits = nextNum.toString().padStart(p.digits, '0');
    
    const parts = [p.prefix, year, month].filter(Boolean);
    const refNo = parts.join(p.separator) + (p.separator || "") + digits;
    
    return { success: true, data: refNo };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- Payment Vouchers Actions ---

// บันทึกใบสำคัญจ่าย + บันทึกบัญชีอัตโนมัติ
export async function createPaymentVoucher(data: {
  voucher_no: string;
  payee_name: string;
  issue_date: string;
  amount: number;
  payment_method: string;
  status: string;
  receipt_url?: string;
}) {
  try {
    // 1. บันทึก Voucher
    const res = await query(
      `INSERT INTO payment_vouchers (voucher_no, payee_name, issue_date, amount, payment_method, status, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [data.voucher_no, data.payee_name, data.issue_date, data.amount, data.payment_method, data.status, data.receipt_url || null]
    );

    // 2. บันทึกบัญชีอัตโนมัติ (Journal Entry)
    // เพิ่มคำอธิบายว่าแนบบิลมาด้วย (ถ้ามี)
    const description = `จ่ายเงินให้: ${data.payee_name}${data.receipt_url ? ' (แนบบิลแล้ว)' : ''}`;
    
    await query(
      `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit, receipt_url)
       VALUES ($1, $2, $3, 'ค่าใช้จ่ายทั่วไป/ซื้อสินค้า', $4, 0, $5)`,
      [data.issue_date, data.voucher_no, description, data.amount, data.receipt_url || null]
    );

    // ... (ส่วนที่เหลือของสมุดรายวัน)

    // Cr. เงินสด หรือ เงินฝากธนาคาร (ตามช่องทางหลัก)
    const bankAccount = data.payment_method === "Transfer" ? "เงินฝากธนาคาร" : "เงินสด";
    await query(
      `INSERT INTO journal_entries (entry_date, reference_no, description, account_name, debit, credit)
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [data.issue_date, data.voucher_no, `จ่ายโอน/เงินสดให้: ${data.payee_name}`, bankAccount, data.amount]
    );

    revalidatePath("/vouchers");
    revalidatePath("/journals");
    revalidatePath("/");
    
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    console.error("Failed to create payment voucher:", error);
    return { success: false, error: error.message || "Failed to create database entry" };
  }
}

export async function getPaymentVouchers() {
  try {
    const { rows } = await query('SELECT * FROM payment_vouchers ORDER BY issue_date DESC, id ASC');
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

//สรุปข้อมูลภาษีสำหรับ Dashboard
export async function getTaxSummary() {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
      // 1. คำนวณภาษีขายจาก Invoices
      const salesRes = await query(`
        SELECT SUM(vat_amount) as total_vat_sales 
        FROM invoices 
        WHERE created_at >= $1 OR created_on >= $1
      `, [firstDayOfMonth]);
  
      // 2. คำนวณภาษีซื้อจาก Payment Vouchers (สมมติว่ามีการเก็บ VAT ใน Vouchers)
      // หากยังไม่มี column vat ใน vouchers จะปรับให้ดึงจาก Journal Entries ที่ระบุเป็น 'Purchase VAT'
      const purchaseRes = await query(`
        SELECT SUM(debit) as total_vat_purchase 
        FROM journal_entries 
        WHERE (account_name ILIKE '%ภาษีซื้อ%' OR account_name ILIKE '%Purchase VAT%')
        AND entry_date >= $1
      `, [firstDayOfMonth]);
  
      // 3. คำนวณภาษีหัก ณ ที่จ่าย (WHT) จากรายการจ่าย
      const whtRes = await query(`
        SELECT SUM(credit) as total_wht 
        FROM journal_entries 
        WHERE (account_name ILIKE '%ภาษีหัก ณ ที่จ่าย%' OR account_name ILIKE '%Withholding%')
        AND entry_date >= $1
      `, [firstDayOfMonth]);
  
      const vatSales = Number(salesRes.rows[0]?.total_vat_sales || 0);
      const vatPurchase = Number(purchaseRes.rows[0]?.total_vat_purchase || 0);
      const wht = Number(whtRes.rows[0]?.total_wht || 0);
      const netVat = vatSales - vatPurchase;
  
      return {
        success: true,
        data: {
          vatSales,
          vatPurchase,
          wht,
          netVat
        }
      };
    } catch (error: any) {
      console.error("Tax Summary Error:", error);
      return { success: false, error: error.message };
    }
  }

// --- RD E-Filing Export Logic (AccRevo Standard) ---

// 1. Export ภ.พ. 30 (ภาษีมูลค่าเพิ่ม)
export async function exportPP30ToTxt(month: number, year: number) {
  try {
    const firstDay = new Date(year, month - 1, 1).toISOString();
    const lastDay = new Date(year, month, 0, 23, 59, 59).toISOString();

    // ดึงภาษีขาย
    const sales = await query(`
      SELECT i.*, c.name, c.tax_id 
      FROM invoices i 
      JOIN contacts c ON i.contact_id = c.id::text
      WHERE i.created_at BETWEEN $1 AND $2 AND i.status = 'paid'
    `, [firstDay, lastDay]);

    // Format: TAXID|NAME|BRANCH|DATE|INV_NO|AMOUNT|VAT
    let content = sales.rows.map(r => {
      const date = new Date(r.created_at || r.created_on).toLocaleDateString('th-TH');
      return `${r.tax_id || '0000000000000'}|${r.name}|00000|${date}|${r.invoice_number}|${r.net_amount}|${r.vat_amount}`;
    }).join("\n");

    if (!content) content = "NO DATA FOR THIS MONTH";

    const base64 = Buffer.from(content).toString("base64");
    return { 
      success: true, 
      data: base64, 
      filename: `PP30_Export_${year}_${month}.txt` 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 2. Export ภ.ง.ด. 53 (ภาษีหัก ณ ที่จ่าย - License/Service)
export async function exportPND53ToTxt(month: number, year: number) {
  try {
    const firstDay = new Date(year, month - 1, 1).toISOString();
    const lastDay = new Date(year, month, 0, 23, 59, 59).toISOString();

    // ดึงรายการจ่ายเงินที่มี WHT (หัก ณ ที่จ่าย 53)
    const whtItems = await query(`
      SELECT j.*, c.name, c.tax_id, c.address
      FROM journal_entries j
      LEFT JOIN contacts c ON j.description ILIKE '%' || c.name || '%'
      WHERE j.entry_date BETWEEN $1 AND $2 
      AND (j.account_name ILIKE '%หัก ณ ที่จ่าย%')
    `, [firstDay, lastDay]);

    // RD Format (Pipe Separated Example)
    let content = whtItems.rows.map(r => {
      const date = new Date(r.entry_date).toLocaleDateString('th-TH');
      return `${r.tax_id || '0000000000000'}|${r.name}|${r.address || '-'}|${date}|5%|${r.credit}`;
    }).join("\n");

    if (!content) content = "NO DATA FOR THIS MONTH";

    const base64 = Buffer.from(content).toString("base64");
    return { 
      success: true, 
      data: base64, 
      filename: `PND53_Export_${year}_${month}.txt` 
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// 🏆 สรุปรายเดือนแบบพรีเมียม (Monthly Financial Snapshot on Drive)
export async function exportMonthlySummaryToDrive() {
  try {
    const now = new Date();
    const monthYear = (now.getMonth() + 1) + '/' + now.getFullYear();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const invoices = (await query('SELECT * FROM invoices WHERE created_at >= $1', [firstDay])).rows;
    const vouchers = (await query('SELECT * FROM payment_vouchers WHERE issue_date >= $1', [firstDay])).rows;
    
    const folderId = await getOrCreateFolder('Micro Account Reports/Summaries');
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: {
        properties: { title: 'สรุปงานบัญชีประจำเดือน ' + monthYear + ' - Microtronic' },
        sheets: [
          { properties: { title: 'สรุปรายได้ (Invoices)' } },
          { properties: { title: 'สรุปค่าใช้จ่าย (Expenses)' } }
        ]
      }
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error('Cloud Sync Failed');

    const invoiceValues = [
      ['ลำดับ', 'เลขที่ใบแจ้งหนี้', 'ยอดก่อน VAT', 'VAT', 'ยอดรวมสุทธิ', 'สถานะ'],
      ...invoices.map((i: any, idx: number) => [idx+1, i.invoice_number, i.net_amount, i.vat_amount, Number(i.net_amount)+Number(i.vat_amount), i.status])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'สรุปรายได้ (Invoices)!A1',
      valueInputOption: 'RAW',
      requestBody: { values: invoiceValues }
    });

    const voucherValues = [
      ['ลำดับ', 'เลขที่ PV', 'ผู้รับเงิน', 'จำนวนเงิน', 'วิธีจ่าย', 'วันที่'],
      ...vouchers.map((v: any, idx: number) => [idx+1, v.voucher_no, v.payee_name, v.amount, v.payment_method, new Date(v.issue_date).toLocaleDateString('th-TH')])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'สรุปค่าใช้จ่าย (Expenses)!A1',
      valueInputOption: 'RAW',
      requestBody: { values: voucherValues }
    });

    if (folderId) {
      await googleDrive.files.update({
        fileId: spreadsheetId,
        addParents: folderId,
        removeParents: 'root',
        fields: 'id, parents',
      });
    }
    
    try {
      await googleDrive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (e) {}

    return { 
      success: true, 
      url: 'https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit',
      message: 'รายงานประจำเดือน ' + monthYear + ' พร้อมใช้งานบน Google Drive แล้ว' 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// อัปเดตสถานะใบเสนอราคา
export async function updateQuotationStatus(id: number, status: string) {
  try {
    const { query } = await import("@/lib/db");
    await query("UPDATE quotations SET status = $1 WHERE id = $2", [status, id]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/quotations");
    return { success: true };
  } catch (error: any) {
    console.error("Update Quotation Status Error:", error);
    return { success: false, error: error.message };
  }
}

// อัปเดตประเภทสินค้า
export async function updateCategory(id: number, name: string, description: string = "") {
  try {
    const { query } = await import("@/lib/db");
    await query(
      "UPDATE product_categories SET name = $1, description = $2 WHERE id = $3",
      [name, description, id]
    );
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ลบประเภทสินค้า
export async function deleteCategory(id: number) {
  try {
    const { query } = await import("@/lib/db");
    
    // ตรวจสอบว่ามีสินค้าที่ใช้หมวดหมู่นี้อยู่หรือไม่
    const productsRes = await query("SELECT id FROM products WHERE category_id = $1 LIMIT 1", [id]);
    if (productsRes.rows.length > 0) {
      return { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีสินค้าบางรายการที่ยังใช้ประเภทนี้น้อยู่" };
    }

    await query("DELETE FROM product_categories WHERE id = $1", [id]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/inventory");
    revalidatePath("/inventory/categories");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return { success: false, error: error.message };
  }
}

// ลบใบเสนอราคา (Hard Delete)
export async function deleteQuotation(id: number) {
  try {
    const { query } = await import("@/lib/db");
    
    // ลบ items ก่อน (CASCADE ใน DB จะดีมาก แต่เพื่อความชัวร์ลบแยกก็ได้ถ้าไม่ได้คุม constraint)
    // แต่ส่วนใหญ่เราสร้าง table แบบ CASCADE ได้
    await query("DELETE FROM quotation_items WHERE quotation_id = $1", [id]);
    await query("DELETE FROM quotations WHERE id = $1", [id]);
    
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/quotations");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Quotation Error:", error);
    return { success: false, error: error.message };
  }
}

// --- CALENDAR & REMINDERS ---

export async function getReminders() {
  const { query } = await import("@/lib/db");
  try {
    // Migration check: Ensure reminders table exists
    await query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        type VARCHAR(50) DEFAULT 'manual',
        related_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const res = await query("SELECT * FROM reminders WHERE status != 'deleted' ORDER BY due_date ASC");
    return { success: true, data: res.rows };
  } catch (error: any) {
    console.error("Get Reminders Error:", error);
    return { success: false, error: error.message };
  }
}

export async function createReminder(data: {
  title: string;
  description?: string;
  due_date: string;
  type?: string;
  related_id?: number;
}) {
  const { query } = await import("@/lib/db");
  try {
    const res = await query(
      `INSERT INTO reminders (title, description, due_date, type, related_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [data.title, data.description || '', data.due_date, data.type || 'manual', data.related_id || null]
    );
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/calendar");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    console.error("Create Reminder Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateReminderStatus(id: number, status: string) {
  const { query } = await import("@/lib/db");
  try {
    await query("UPDATE reminders SET status = $1 WHERE id = $2", [status, id]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteReminder(id: number) {
  const { query } = await import("@/lib/db");
  try {
    await query("DELETE FROM reminders WHERE id = $1", [id]);
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/calendar");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardAlerts() {
  const { query } = await import("@/lib/db");
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  
  try {
    // 1. Reminders due within 7 days
    const reminders = await query(
      "SELECT * FROM reminders WHERE due_date >= $1 AND due_date <= $2 AND status = 'pending' ORDER BY due_date ASC",
      [now.toISOString(), next7Days]
    );
    
    // 2. Pending Invoices (top 5 oldest) with Schema Auto-Migration for contact_id
    try {
      await query("SELECT contact_id FROM invoices LIMIT 1");
    } catch (e: any) {
      if (e.code === '42703') { // undefined_column
        await query("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contact_id INTEGER");
      }
    }

    const pendingInvoices = await query(
      "SELECT i.id, i.invoice_number, i.net_amount, i.created_at, c.name as customer_name FROM invoices i LEFT JOIN contacts c ON i.contact_id = c.id WHERE i.status != 'paid' ORDER BY i.created_at ASC LIMIT 5"
    );

    return { 
      success: true, 
      data: {
        reminders: reminders.rows,
        invoices: pendingInvoices.rows
      } 
    };
  } catch (error: any) {
    console.error("Dashboard Alerts Error:", error);
    return { success: false, error: error.message };
  }
}

// --- RD API Portal Integration Functions ---

// Initialize RD API Client with configuration
export async function setupRDAPI(config: {
  clientId: string;
  clientSecret: string;
  apiKey?: string;
  baseUrl: string;
}) {
  try {
    initializeRDClient(config);
    return { success: true, message: "RD API client initialized successfully" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Submit invoice to RD API Portal
export async function submitInvoiceToRDPortal(invoiceId: string) {
  try {
    const result = await submitInvoiceToRD(invoiceId);
    revalidatePath("/invoices");
    revalidatePath("/tax-reports");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Submit withholding tax to RD API Portal
export async function submitWHTToRDPortal(voucherId: string) {
  try {
    const result = await submitWHTToRD(voucherId);
    revalidatePath("/vouchers");
    revalidatePath("/tax-reports");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check RD submission status
export async function checkRDStatus(submissionId: string) {
  try {
    return await checkRDSubmissionStatus(submissionId);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Batch submit multiple documents to RD
export async function batchSubmitToRDPortal(documentIds: string[], type: 'invoice' | 'wht') {
  try {
    const result = await batchSubmitToRD(documentIds, type);
    revalidatePath("/invoices");
    revalidatePath("/vouchers");
    revalidatePath("/tax-reports");
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get RD submission history for dashboard
export async function getRDSubmissions() {
  try {
    // Get recent RD submissions from both invoices and vouchers
    const invoiceSubmissions = await query(`
      SELECT
        'invoice' as type,
        invoice_number as document_number,
        rd_submission_id,
        rd_status,
        rd_submitted_at,
        net_amount + vat_amount as amount
      FROM invoices
      WHERE rd_submission_id IS NOT NULL
      ORDER BY rd_submitted_at DESC
      LIMIT 10
    `);

    const voucherSubmissions = await query(`
      SELECT
        'wht' as type,
        voucher_no as document_number,
        rd_submission_id,
        rd_status,
        rd_submitted_at,
        amount
      FROM payment_vouchers
      WHERE rd_submission_id IS NOT NULL
      ORDER BY rd_submitted_at DESC
      LIMIT 10
    `);

    const allSubmissions = [
      ...invoiceSubmissions.rows,
      ...voucherSubmissions.rows
    ].sort((a, b) => new Date(b.rd_submitted_at).getTime() - new Date(a.rd_submitted_at).getTime());

    return { success: true, data: allSubmissions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
