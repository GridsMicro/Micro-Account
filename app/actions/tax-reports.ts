"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
// 2026-11-18 (ฌอน / ข้อ 3): เปลี่ยนจาก mock RD API → RD Open API จริง
import {
  initializeRDClient,
  isRDConfigured,
  submitInvoiceToRD,
  batchSubmitToRD,
  submitPP30ToRD,
  syncRDFilingStatus,
  getRDFilingHistory,
  getRDReceipt,
  getRDPayin,
} from "@/lib/rd-api";
import type { RDResult } from "@/lib/rd-api";

export async function getTaxSummary() {
  try {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const sRes = await query(`SELECT SUM(vat_amount) as v FROM invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`, [start, end]);
    // 2026-11-18 (ฌอน / ข้อ 2): ภาษีซื้อต้องมาจาก expenses ที่ "ยืนยันสิทธิหัก + เอกสารครบ"
    // ของเดิมใช้ payment_vouchers (ไม่มี vat_amount / amount บางรายการเป็นยอดรวม VAT) → นับผิด
    const pRes = await query(
      `SELECT COALESCE(SUM(vat_amount),0) as v FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(tax_deductible,false) = true
         AND COALESCE(vat_amount,0) > 0
         AND tax_invoice_date IS NOT NULL
         AND tax_invoice_no IS NOT NULL AND tax_invoice_no <> ''`,
      [start, end]
    );
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
    // 2026-11-18 (ฌอน / ข้อ 2): ภาษีซื้อ (Input VAT) มาจาก expenses ที่
    //   (1) ยืนยันสิทธิหัก tax_deductible = true
    //   (2) มี vat_amount จริง
    //   (3) มีเลขที่ + วันที่ใบภาษีซื้อครบ (ไม่งั้นนำหักใน ภ.พ.30 ไม่ได้ตามกฎหมาย)
    // ไม่ใช้ payment_vouchers เพราะตารางนี้ไม่มี vat_amount และ amount บางรายการเป็นยอดรวม VAT
    const pRes = await query(
      `SELECT COUNT(*)::int as c,
              COALESCE(SUM(net_amount),0) as s,
              COALESCE(SUM(vat_amount),0) as v
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(tax_deductible,false) = true
         AND COALESCE(vat_amount,0) > 0
         AND tax_invoice_date IS NOT NULL
         AND tax_invoice_no IS NOT NULL AND tax_invoice_no <> ''`,
      [start, end]
    );
    return {
      success: true,
      data: {
        sales: { documentCount: sRes.rows[0].c, taxableAmount: Number(sRes.rows[0].s), vatAmount: Number(sRes.rows[0].v) },
        purchases: { documentCount: pRes.rows[0].c, taxableAmount: Number(pRes.rows[0].s), vatAmount: Number(pRes.rows[0].v), items: [] },
        netVatPayable: Number(sRes.rows[0].v) - Number(pRes.rows[0].v),
        // จำนวนรายการที่ยังต้องแก้ — ใช้แจ้งเตือนใน UI (ไม่หักอัตโนมัติ)
        missingDeductibleTax: await countUndeductedVatExpenses(start, end),
        incompleteTaxDocs: await countIncompleteTaxDocs(start, end),
      }
    };
  } catch (err: any) { return { success: false, error: err.message }; }
}

async function countUndeductedVatExpenses(start: string, end: string): Promise<number> {
  try {
    const r = await query(
      `SELECT COUNT(*)::int as c FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(vat_amount,0) > 0
         AND COALESCE(tax_deductible, false) = false`,
      [start, end]
    );
    return r.rows[0]?.c || 0;
  } catch { return 0; }
}

/**
 * 2026-11-18 (ฌอน / ข้อ 2): นับใบภาษีซื้อที่ VAT > 0 แต่ยังขาดเลขที่/วันที่
 * ใช้แจ้งเตือนเพื่อให้คนแก้ — ไม่นำไปหักอัตโนมัติ
 */
async function countIncompleteTaxDocs(start: string, end: string): Promise<number> {
  try {
    const r = await query(
      `SELECT COUNT(*)::int as c FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(vat_amount,0) > 0
         AND (tax_invoice_date IS NULL OR tax_invoice_no IS NULL OR tax_invoice_no = '')`,
      [start, end]
    );
    return r.rows[0]?.c || 0;
  } catch { return 0; }
}

export async function getPNDReportDraft(type: string, month: number, year: number) {
  try {
    // คำนวณ WHT จาก expenses โดยตรง (wht_rate เล็กน้อย) — ไม่รอ withholding_tax_amount ที่คนมักไม่กรอก
    // และไม่ผ่าน payment_vouchers เพราะบางเดือนไม่มีใบจ่ายแต่มีรายจ่ายเกิดจริง
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    const { rows } = await query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(
         COALESCE(withholding_tax_amount::numeric, ROUND((wht_rate::numeric / 100) * net_amount::numeric, 2))
       ),0) AS t
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(wht_rate, 0)::numeric > 0
         AND COALESCE(wht_rate,0)::numeric IS NOT NULL`,
      [start, end]
    );
    return {
      success: true,
      data: {
        items: [],
        documentCount: rows[0]?.c || 0,
        totalWHT: Number(rows[0]?.t || 0),
      },
    };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getPP36Draft(month: number, year: number) {
  try {
    // ต่างประเทศ = มีสกุลเงิน/อัตราแลกเปลี่ยนระบุชัดเจน (ไม่ใช่ THB)
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().split("T")[0];
    const { rows } = await query(
      `SELECT COUNT(*)::int AS c,
              COALESCE(SUM(net_amount),0) AS b,
              COALESCE(SUM(vat_amount),0) AS v
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(original_currency,'') <> 'THB'
         AND original_currency IS NOT NULL
         AND original_currency <> ''
         AND COALESCE(pp36_exempt, false) = false`,
      [start, end]
    );
    return {
      success: true,
      data: {
        items: [],
        documentCount: rows[0]?.c || 0,
        totalBase: Number(rows[0]?.b || 0),
        totalVat: Number(rows[0]?.v || 0),
      },
    };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function exportPP30ToTxt(month: number, year: number): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  try {
    const draft = await getPP30Draft(month, year);
    if (!draft.success || !draft.data) {
      return { success: false, error: draft.error || "ไม่พบข้อมูล ภ.พ. 30" };
    }
    const d = draft.data;
    const header = `สรุปข้อมูล ภ.พ. 30 (ไมโครทรอนิก (ไทยแลนด์) จำกัด / VAT 0105561182888)\n`;
    const period = `ช่วงเวลา: ${String(month).padStart(2, "0")}/${year}\n`;
    const rows = [
      `ภาษีขาย (Output VAT) = ${Number(d.sales.vatAmount).toFixed(2)} บาท (ฐาน ${Number(d.sales.taxableAmount).toFixed(2)}, ${d.sales.documentCount} ฉบับ)`,
      `ภาษีซื้อ (Input VAT) = ${Number(d.purchases.vatAmount).toFixed(2)} บาท (ฐาน ${Number(d.purchases.taxableAmount).toFixed(2)}, ${d.purchases.documentCount} ฉบับ)`,
      `ภาษีที่ต้องชำระ (Net VAT) = ${Number(d.netVatPayable).toFixed(2)} บาท`,
    ].join("\n");
    const note = `\n\nหมายเหตุ: ไฟล์นี้เป็นสรุปข้อมูลจากระบบเพื่อเตรียมยื่น — ยังไม่ใช่ไฟล์ format ยื่นของ RD e-Filing โดยตรง กรุณานำข้อมูลไปกรอกในแบบฟอร์มที่ agency ร้องขอ`;
    const text = header + period + rows + note;
    return { success: true, data: Buffer.from(text).toString("base64"), filename: `PP30_${year}-${String(month).padStart(2, "0")}.txt` };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function exportPND53ToTxt(month: number, year: number): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  try {
    const draft = await getPNDReportDraft("pnd53", month, year);
    if (!draft.success || !draft.data) {
      return { success: false, error: draft.error || "ไม่พบข้อมูล ภ.ง.ด. 53" };
    }
    const d = draft.data;
    const text = [
      `สรุปข้อมูล ภ.ง.ด. 53 (ไมโครทรอนิก (ไทยแลนด์) จำกัด / VAT 0105561182888)`,
      `ช่วงเวลา: ${String(month).padStart(2, "0")}/${year}`,
      `จำนวนรายการ: ${d.documentCount} รายการ`,
      `รวมภาษีหัก ณ ที่จ่าย = ${Number(d.totalWHT).toFixed(2)} บาท`,
      ``,
      `หมายเหตุ: ไฟล์นี้เป็นสรุปข้อมูลจากระบบเพื่อเตรียมยื่น — ยังไม่ใช่ไฟล์ format ยื่นของ RD e-Filing โดยตรง`,
    ].join("\n");
    return { success: true, data: Buffer.from(text).toString("base64"), filename: `PND53_${year}-${String(month).padStart(2, "0")}.txt` };
  } catch (err: any) { return { success: false, error: err.message }; }
}

/**
 * 2026-11-18 (ฌอน / ข้อ 3)
 * ของเดิมคืน { success: true } เสมอโดยไม่ยิง API เลย → เป็นผลลวง
 * ตอนนี้ delegate ไปยัง shim ที่คืน error ชัดเจน (ไม่มี credential ก็ไม่สำเร็จ)
 */
export async function batchSubmitToRDPortal(ids: string[], type?: string): Promise<{ success: boolean; summary?: { successful: number; total: number }; results?: any[]; error?: string }> {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { success: false, error: "ไม่มีเอกสารที่เลือก", summary: { successful: 0, total: 0 }, results: [] };
  }
  const res = await batchSubmitToRD(ids, type === "wht" ? "wht" : "invoice");
  return {
    success: false,
    error: res.error,
    summary: { successful: res.summary.successful, total: res.summary.total },
    results: res.results,
  };
}

/**
 * ยื่น ภ.พ.30 จริงผ่าน RD Open API (/oapi/submit-form)
 * ความปลอดภัย:
 *  - ต้องพิมพ์ยืนยัน "ยื่น ภ.พ.30" ตรง ๆ (ป้องกันกดปุ่มผิด)
 *  - ต้องมี credential ใน env
 *  - ถ้ายังมีใบภาษีซื้อที่ไม่ครบ/ยังไม่ยืนยันสิทธิหัก → ปฏิเสธการยื่น (ไม่หักอัตโนมัติ)
 *  - ปีภาษีที่ส่งเป็น พ.ศ. (ค.ศ. + 543) ตาม spec ของ RD
 */
export async function submitPP30ToRDPortal(month: number, year: number, confirmText: string): Promise<RDResult> {
  if (confirmText !== "ยื่น ภ.พ.30") {
    return { success: false, error: "ต้องพิมพ์ยืนยัน 'ยื่น ภ.พ.30' เพื่อยื่นแบบจริง" };
  }
  if (!isRDConfigured()) {
    return { success: false, error: "ยังไม่ได้ตั้งค่า RD Open API (ดู .env.example → RD_EFILING_*)" };
  }

  const draft = await getPP30Draft(month, year);
  if (!draft.success || !draft.data) {
    return { success: false, error: draft.error || "ไม่พบข้อมูล ภ.พ.30 สำหรับงวดนี้" };
  }
  const d = draft.data;
  if (Number(d.missingDeductibleTax || 0) > 0 || Number(d.incompleteTaxDocs || 0) > 0) {
    return {
      success: false,
      error: `ยังมีภาษีซื้อที่ต้องแก้ก่อนยื่น (ยังไม่ยืนยันสิทธิหัก ${d.missingDeductibleTax} รายการ / เอกสารไม่ครบ ${d.incompleteTaxDocs} รายการ)`,
    };
  }

  const companyRes = await query("SELECT tax_id FROM company_settings ORDER BY id DESC LIMIT 1");
  const taxId = companyRes.rows[0]?.tax_id;
  if (!taxId || !/^\d{13}$/.test(String(taxId))) {
    return { success: false, error: "กรุณาตั้งเลขประจำตัวผู้เสียภาษี 13 หลักในหน้าตั้งค่าบริษัทก่อนยื่น" };
  }

  const res = await submitPP30ToRD({
    taxId: String(taxId),
    taxMonth: month,
    taxYear: year + 543, // spec ใช้ปี พ.ศ.
    salesTaxable: Number(d.sales.taxableAmount),
    salesVat: Number(d.sales.vatAmount),
    purchaseTaxable: Number(d.purchases.taxableAmount),
    purchaseVat: Number(d.purchases.vatAmount),
  });
  if (res.success) revalidatePath("/tax-reports");
  return res;
}

/** ซิงค์สถานะแบบจาก RD (/oapi/result-form) มาบันทึกในตาราง tax_filing_submissions */
export async function syncRDStatusAction(input: { refNo?: string; apiRefNo?: string; formType?: string }): Promise<RDResult> {
  if (!input.refNo && !input.apiRefNo) {
    return { success: false, error: "กรุณาระบุเลขอ้างอิงการยื่นแบบ (refNo) หรือเลขอ้างอิงการนำส่ง (apiRefNo)" };
  }
  const res = await syncRDFilingStatus(input);
  if (res.success) revalidatePath("/tax-reports");
  return res;
}

/** อ่านประวัติสถานะที่ซิงค์ไว้ (READ-ONLY) */
export async function getRDFilingHistoryAction(limit = 10) {
  try {
    return { success: true, data: await getRDFilingHistory(limit) };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}

/** ขอภาพแบบ/ใบแนบ/ใบเสร็จจาก RD (READ-ONLY) */
export async function getRDReceiptAction(refNo: string, requestType: 1 | 2 | 3 = 3): Promise<RDResult> {
  return getRDReceipt(refNo, requestType);
}

/** ขอใบ Pay-In จาก RD */
export async function getRDPayinAction(refNos: string[]): Promise<RDResult> {
  return getRDPayin(refNos);
}

export async function setupRDAPI(config: any) {
  // @deprecated ใช้ RD_EFILING_* ใน environment แทน
  initializeRDClient(config);
  return { success: true };
}

export async function submitInvoiceToRDPortal(id: string) {
  // @deprecated เก็บไว้ให้เรียกได้ แต่จะคืน error ชัดเจน (ไม่มี success ปลอมอีกต่อไป)
  const res = await submitInvoiceToRD(id);
  revalidatePath("/invoices");
  return res;
}

export async function exportMonthlySummaryToDrive() {
  try {
    const now = new Date();
    const { getOrCreateFolder } = await import("@/lib/actions-helpers");
    const { getGoogleSheets } = await import("@/lib/google-server");
    const googleSheets = await getGoogleSheets();
    const folderId = await getOrCreateFolder("Micro Account Reports");
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: { properties: { title: `Budget Summary ${now.getMonth() + 1}/${now.getFullYear()}` } }
    });
    return { success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit` };
  } catch (err: any) { return { success: false, error: err.message }; }
}
