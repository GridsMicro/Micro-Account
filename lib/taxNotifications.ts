/**
 * Smart Tax Notifications — แจ้งเตือนภาษีจาก "ข้อมูลจริงในระบบ" ไม่ใช่แค่ปฏิทิน
 *
 * บันทึกโดย ฌอน 2026-11-18 ตามคำสั่งพี่ฆัง (ข้อ 1 ของ roadmap 1→2→3):
 * - ทุกฟังก์ชันในไฟล์นี้เป็น READ-ONLY (SELECT เท่านั้น) — ห้าม UPDATE/DELETE
 *   เพราะ production DB ใช้งานจริง ห้ามกระทบยอด/ใบกำกับภาษีโดยอัตโนมัติ
 * - แจ้งเตือนอย่างเดียว ให้มนุษย์เป็นคนตัดสินใจแก้ข้อมูล/ยื่นภาษี
 * - ใช้ LINE Messaging API ผ่าน lib/lineClient (LINE Notify ยุติ 31 มี.ค. 2025)
 * - ถ้าไม่มี credential → log ออกทาง console อย่างเดียว (ไม่ throw ให้ cron ล้มเหลว)
 * - 2026-11-20: วันยื่น ภ.พ.30 แก้ 15 → 23 สำหรับ e-Filing (ตาม rd.go.th/31094.html)
 *
 * อ้างอิง: lib/taxAutomator.ts (TaxCalendarAlerts — แจ้งตามวันอย่างเดียว)
 *          app/actions/tax-reports.ts (getPP30Draft / getPP36Draft — แหล่งยอดจริง)
 *
 * ใช้ relative import './db' เพื่อให้ทั้ง Next.js และ cron (tsx) โหลดได้เหมือนกัน
 * (cron ใช้ '../lib/db' แบบ relative อยู่แล้ว — alias '@/' ไม่เสมอไปใน tsx)
 */

import { query } from "./db";

export type TaxAlertSeverity = "critical" | "warning" | "info";

export interface TaxAlert {
  code: string;
  severity: TaxAlertSeverity;
  title: string;
  detail: string;
  actionUrl: string;
}

const RD_EFILING_URL = "https://efiling.rd.go.th/rd-efiling-web/tax/vat/form-pp30";
const EXPENSES_URL = "/expenses";
const TAX_REPORTS_URL = "/tax-reports";

/**
 * ตรวจข้อมูลภาษีของเดือนนั้น ๆ แล้วคืนรายการแจ้งเตือนจากความจริงใน DB
 * ใช้ได้ทั้งใน cron (jobs/scheduleTaxUpdate.ts) และหน้า UI (app/calendar/page.tsx)
 */
export async function getSmartTaxAlerts(
  month: number,
  year: number
): Promise<TaxAlert[]> {
  const alerts: TaxAlert[] = [];
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).toISOString().split("T")[0];

  try {
    // 1) ใบกำกับภาษีซื้อที่ VAT > 0 แต่ยังไม่ระบุ "วันที่/เลขที่ใบภาษีซื้อ"
    //    → ภาษีซื้อจะไม่ถูกนับใน ภ.พ.30 (getPP30Draft ต้องการข้อมูลครบ)
    //    กรณีจริงที่พบ 2026-11: Microsoft 365 Family ฿241.99 ใบ MRSTHMCI2700383704
    const missingDate = await query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(vat_amount),0) AS v
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(vat_amount,0) > 0
         AND (tax_invoice_date IS NULL OR tax_invoice_no IS NULL OR tax_invoice_no = '')`,
      [start, end]
    );
    const md = missingDate.rows[0] || {};
    if (Number(md.c) > 0) {
      alerts.push({
        code: "INPUT_VAT_INCOMPLETE_DOC",
        severity: "critical",
        title: "ใบกำกับภาษีซื้อไม่ครบถ้วน",
        detail: `มี ${md.c} รายการ VAT รวม ฿${Number(md.v).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ที่ยังไม่ระบุเลขที่/วันที่ใบภาษีซื้อ → ภาษีซื้อจะไม่ถูกหักใน ภ.พ.30 กรุณาเติมข้อมูลก่อนยื่น`,
        actionUrl: EXPENSES_URL,
      });
    }

    // 2) รายจ่ายที่มี VAT แต่ยังไม่ได้ยืนยันสิทธิหัก (tax_deductible = false)
    const undeducted = await query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(vat_amount),0) AS v
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND COALESCE(vat_amount,0) > 0
         AND COALESCE(tax_deductible, false) = false`,
      [start, end]
    );
    const ud = undeducted.rows[0] || {};
    if (Number(ud.c) > 0) {
      alerts.push({
        code: "INPUT_VAT_NOT_CONFIRMED",
        severity: "warning",
        title: "มีภาษีซื้อยังไม่ได้ยืนยันสิทธิหัก",
        detail: `${ud.c} รายการ รวม ฿${Number(ud.v).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ยังไม่ถูกนำหักใน ภ.พ.30 — ตรวจว่าเป็นภาษีซื้อต้องห้ามหรือไม่ ถ้าไม่ใช่ให้ยืนยันสิทธิหักในหน้าค่าใช้จ่าย`,
        actionUrl: EXPENSES_URL,
      });
    }

    // 3) บริการต่างประเทศที่อาจต้องนำส่ง ภ.พ.36
    const foreign = await query(
      `SELECT COUNT(*)::int AS c, COALESCE(SUM(vat_amount),0) AS v
       FROM expenses
       WHERE expense_date BETWEEN $1 AND $2
         AND original_currency IS NOT NULL
         AND original_currency <> ''
         AND COALESCE(original_currency,'') <> 'THB'
         AND COALESCE(pp36_exempt, false) = false`,
      [start, end]
    );
    const fr = foreign.rows[0] || {};
    if (Number(fr.c) > 0) {
      alerts.push({
        code: "PP36_REQUIRED",
        severity: "warning",
        title: "มีรายจ่ายบริการต่างประเทศ — ตรวจ ภ.พ.36",
        detail: `${fr.c} รายการ VAT รวม ฿${Number(fr.v).toLocaleString("th-TH", { minimumFractionDigits: 2 })} อาจต้องนำส่ง ภ.พ.36 (และนำไปหักใน ภ.พ.30 เดือนเดียวกันได้)`,
        actionUrl: TAX_REPORTS_URL,
      });
    }

    // 4) ใกล้/เกินกำหนดยื่น ภ.พ.30 (วันที่ 23 ของเดือนถัดไปสำหรับ e-Filing)
    const now = new Date();
    const deadline = new Date(year, month, 23, 23, 59, 59);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
    if (daysLeft >= 0 && daysLeft <= 7) {
      alerts.push({
        code: "PP30_DEADLINE_NEAR",
        severity: daysLeft <= 3 ? "critical" : "warning",
        title: "ใกล้กำหนดยื่น ภ.พ.30",
        detail: `อีก ${daysLeft} วันถึงกำหนดยื่น ภ.พ.30 งวด ${String(month).padStart(2, "0")}/${year} (ภายในวันที่ 23 ของเดือนถัดไปสำหรับ e-Filing; กระดาษวันที่ 15) — ตรวจยอดแล้วเตรียมยื่นได้ที่ e-Filing`,
        actionUrl: RD_EFILING_URL,
      });
    } else if (daysLeft < 0) {
      alerts.push({
        code: "PP30_OVERDUE_CHECK",
        severity: "critical",
        title: "เกินกำหนดยื่น ภ.พ.30 แล้ว",
        detail: `งวด ${String(month).padStart(2, "0")}/${year} เกินกำหนด ต้องเช็กว่ายื่นไปแล้วหรือต้องยื่นเพิ่มเติมพร้อมเงินเพิ่ม/เบี้ยปรับ`,
        actionUrl: RD_EFILING_URL,
      });
    }
  } catch (err: unknown) {
    // ไม่ให้แจ้งเตือนล้มเหลวทั้งระบบจาก DB ชั่วคราว
    alerts.push({
      code: "ALERT_ENGINE_ERROR",
      severity: "warning",
      title: "ตรวจสอบข้อมูลภาษีไม่สำเร็จ",
      detail: `getSmartTaxAlerts error: ${err instanceof Error ? err.message : String(err)}`,
      actionUrl: TAX_REPORTS_URL,
    });
  }

  return alerts;
}

/** แปลง alerts เป็นข้อความสำหรับ LINE / log */
export function formatAlertsAsText(
  alerts: TaxAlert[],
  month: number,
  year: number
): string {
  const head = `🚨 แจ้งเตือนภาษี งวด ${String(month).padStart(2, "0")}/${year}`;
  if (alerts.length === 0) return `${head}\n✅ ไม่พบจุดที่ต้องแก้ไข`;
  const icon = (s: TaxAlertSeverity) =>
    s === "critical" ? "🔴" : s === "warning" ? "🟠" : "🔵";
  const lines = alerts.map(
    (a) => `${icon(a.severity)} ${a.title}\n   ${a.detail}\n   → ${a.actionUrl}`
  );
  return [head, "", ...lines].join("\n");
}

/**
 * ส่งแจ้งเตือนผ่าน LINE Messaging API (แทน LINE Notify ที่ยุติบริการแล้ว)
 * - credential มาตรฐานเดียว: LINE_CHANNEL_ACCESS_TOKEN + LINE_CHANNEL_ID
 * - ไม่มี credential → คืน { sent:false, reason } และ log ข้อความแทน
 */
export async function sendTaxLineNotification(
  alerts: TaxAlert[],
  month: number,
  year: number
): Promise<{ sent: boolean; reason?: string }> {
  const { sendLinePush } = await import("./lineClient");
  const text = formatAlertsAsText(alerts, month, year);
  console.log("[tax-notify]\n" + text);
  const delivery = await sendLinePush(text);
  return { sent: delivery.sent, reason: delivery.reason };
}
