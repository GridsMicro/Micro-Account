"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  initializeRDClient,
  submitInvoiceToRD,
  submitWHTToRD,
  checkRDSubmissionStatus,
  batchSubmitToRD,
} from "@/lib/rd-api";

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
    const { getOrCreateFolder } = await import("@/lib/actions-helpers");
    const { googleSheets } = await import("@/lib/google-server");
    const folderId = await getOrCreateFolder("Micro Account Reports");
    const spreadsheet = await googleSheets.spreadsheets.create({
      requestBody: { properties: { title: `Budget Summary ${now.getMonth() + 1}/${now.getFullYear()}` } }
    });
    return { success: true, url: `https://docs.google.com/spreadsheets/d/${spreadsheet.data.spreadsheetId}/edit` };
  } catch (err: any) { return { success: false, error: err.message }; }
}
