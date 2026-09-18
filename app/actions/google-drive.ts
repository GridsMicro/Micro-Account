"use server";

import { query } from "@/lib/db";
import { googleDrive, googleSheets } from "@/lib/google-server";
import { Readable } from "stream";
import { getOrCreateFolder } from "@/lib/actions-helpers";

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
    const { getJournalEntries } = await import("./journals");
    const result = await getJournalEntries();
    if (!result.success || !result.data || result.data.length === 0) throw new Error("ไม่มีข้อมูลให้ส่งออก");
    const entries = result.data;
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
      ...vouchers.map((v: any) => [v.voucher_no, v.payee_name, new Date(v.issue_date).toLocaleDateString('th-TH'), v.amount, v.payment_method, v.status])
    ];
    await googleSheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId!, range: 'Sheet1!A1', valueInputOption: 'RAW', requestBody: { values }
    });
    return { success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit` };
  } catch (err: any) { return { success: false, error: err.message }; }
}
