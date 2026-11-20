/**
 * สรุปภาษีรายเดือนสำหรับข้อความแจ้งเตือน LINE
 *
 * บันทึกโดย ฌอน 2026-11-20 ตามคำสั่งพี่ฆัง:
 * - งวดภาษี = เดือนก่อนหน้าของวันที่รัน (เดือนภาษีเป็นเดือนปฏิทิน ตาม ม.77/1(23))
 * - ภาษีขาย: invoices ที่ issue_date อยู่ในงวด + status != 'cancelled' (ตาม getPP30Draft เดิม)
 * - ภาษีซื้อ: expenses ที่ยืนยันสิทธิหัก + มีเลขที่/วันที่ใบกำกับครบ (ตาม getPP30Draft เดิม)
 * - วันยื่น: 23 ของเดือนปัจจุบันสำหรับ e-Filing (กระดาษ = 15)
 *   อ้างอิง: https://www.rd.go.th/31094.html (ขยาย 15 → 23, มีผลถึง 31 ม.ค. 2570)
 * - READ-ONLY: SELECT เท่านั้น — ไม่ UPDATE/DELETE production DB
 * - ใช้ relative import './db' เพื่อให้ tsx (cron) โหลดได้เหมือน Next.js
 */

import { query } from "./db";
import { TAX_FILING_URLS } from "./taxAutomator";

export interface MonthlyTaxSummary {
  periodMonth: number;
  periodYear: number;
  periodLabel: string;
  deadlineDay: number;
  deadlineLabel: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  invoiceCount: number;
  expenseCount: number;
  message: string;
}

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const baht = (n: number) =>
  Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** วันที่ในเขตเวลาประเทศไทย (Asia/Bangkok) */
export function bangkokNow(now?: Date): Date {
  const d = now || new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  return new Date(get("year"), get("month") - 1, get("day"));
}

/**
 * สร้างข้อความสรุปภาษีประจำเดือน (งวด = เดือนก่อนหน้า)
 */
export async function buildMonthlyTaxMessage(now?: Date): Promise<MonthlyTaxSummary> {
  const today = bangkokNow(now);
  const periodDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const periodMonth = periodDate.getMonth() + 1;
  const periodYear = periodDate.getFullYear();
  const deadlineDay = 23; // e-Filing — กระดาษ 15

  const start = `${periodYear}-${String(periodMonth).padStart(2, "0")}-01`;
  const end = new Date(periodYear, periodMonth, 0).toISOString().split("T")[0];

  // ภาษีขาย — ตรงตาม getPP30Draft (app/actions/tax-reports.ts:46)
  const sales = await query(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(vat_amount),0) AS v
     FROM invoices WHERE status != 'cancelled' AND issue_date BETWEEN $1 AND $2`,
    [start, end]
  );
  // ภาษีซื้อ — ตรงตาม getPP30Draft (app/actions/tax-reports.ts:52-63)
  const purchases = await query(
    `SELECT COUNT(*)::int AS c, COALESCE(SUM(vat_amount),0) AS v
     FROM expenses
     WHERE expense_date BETWEEN $1 AND $2
       AND COALESCE(tax_deductible,false) = true
       AND COALESCE(vat_amount,0) > 0
       AND tax_invoice_date IS NOT NULL
       AND tax_invoice_no IS NOT NULL AND tax_invoice_no <> ''`,
    [start, end]
  );

  const outputVat = Number(sales.rows[0]?.v || 0);
  const inputVat = Number(purchases.rows[0]?.v || 0);
  const netVat = outputVat - inputVat;
  const periodLabel = `${THAI_MONTHS[periodMonth - 1]} ${periodYear + 543}`;
  const deadlineLabel = `${deadlineDay} ${THAI_MONTHS[today.getMonth()]} ${today.getFullYear() + 543}`;
  const filingUrl = TAX_FILING_URLS.pp30 || "https://efiling.rd.go.th";

  const message = [
    `📌 รายภาษีสรรพากร ประจำเดือน ${periodLabel}`,
    "",
    `ภาษีขาย ฿${baht(outputVat)} (${Number(sales.rows[0]?.c || 0)} ฉบับ)`,
    `ภาษีซื้อที่หักได้ −฿${baht(inputVat)} (${Number(purchases.rows[0]?.c || 0)} ฉบับ)`,
    `ต้องนำส่ง ภ.พ.30 ฿${baht(netVat)}`,
    "",
    `ยื่นภายใน ${deadlineLabel} (e-Filing)`,
    `🔗 ${filingUrl}`,
  ].join("\n");

  return {
    periodMonth,
    periodYear,
    periodLabel,
    deadlineDay,
    deadlineLabel,
    outputVat,
    inputVat,
    netVat,
    invoiceCount: Number(sales.rows[0]?.c || 0),
    expenseCount: Number(purchases.rows[0]?.c || 0),
    message,
  };
}
