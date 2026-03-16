"use server";

import { query } from "@/lib/db";
import { sql } from "@vercel/postgres";
import { google } from "googleapis";
import * as xlsx from "xlsx";
import { revalidatePath } from "next/cache";
import { googleSheets, googleDrive } from "@/lib/google-server";
import { Readable } from "stream";

/**
 * Server Action: อัปโหลดไฟล์จากเครื่องขึ้น Google Drive (Autonomous Storage)
 */
export async function uploadToGoogleDrive(base64Data: string, fileName: string, mimeType: string) {
  try {
    // 1. แปลงไฟล์จาก Base64 เป็น Buffer
    const buffer = Buffer.from(base64Data.split(",")[1] || base64Data, "base64");
    const stream = Readable.from(buffer);

    // 2. ยิงขึ้น Drive
    const response = await googleDrive.files.create({
      requestBody: {
        name: `Receipt_${Date.now()}_${fileName}`,
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: "id, webViewLink",
    });

    const fileId = response.data.id;

    // 3. ปรับสิทธิ์ให้ดูได้ (หรือแชร์เฉพาะคนตามระบบเรา)
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

    // 2. สร้าง Spreadsheet ใหม่
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Micro Account - รายงานสมุดรายวัน (${new Date().toLocaleDateString('th-TH')})`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) throw new Error("ไม่สามารถสร้างไฟล์ได้");

    // 3. เตรียมข้อมูล
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

    // 4. เขียนข้อมูลลงใน Sheet
    await googleSheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    // 5. ดึงอีเมลผู้รับจากฐานข้อมูล (Member ที่เป็น admin คนแรก)
    const memberRes = await query("SELECT email FROM members WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1");
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

// ลบรายการบัญชีรายวัน
export async function deleteJournalEntry(id: number) {
  try {
    await query(`DELETE FROM journal_entries WHERE id = $1`, [id]);
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
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
    await query(
      `UPDATE journal_entries 
       SET entry_date=$1, reference_no=$2, account_name=$3, description=$4, debit=$5, credit=$6, receipt_url=$7
       WHERE id=$8`,
      [data.entry_date, data.reference_no, data.account_name, data.description, data.debit, data.credit, data.receipt_url || null, id]
    );
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

