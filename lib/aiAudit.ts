import { query } from "@/lib/db";
import { askGemini } from "@/services/aiAssistant";
import { roundThaiTaxAmount } from "@/lib/tax";
import { getCurrentMonthPL } from "@/lib/reports";
import { TaxCalendarAlerts } from "@/lib/taxAutomator";

export const COMPANY_TAX_ID = '0105561182888';

// ---------- Types ----------

export interface AuditFinding {
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  detail: string;
  reference_id?: number | null;
  reference_label?: string | null;
  recommendation?: string;
  dedup_key: string;
}

export interface AuditResult {
  findings: AuditFinding[];
  checkedAt: string;
  inserted: number;
  existing: number;
}

// ---------- Contextual query helpers ----------

async function gatherContext(finding: AuditFinding): Promise<string> {
  const contextLines: string[] = [];

  if (finding.category === "invoice" && finding.reference_id) {
    const { rows } = await query(
      `SELECT invoice_number, net_amount, vat_amount, status, due_date, contact_id
       FROM invoices WHERE id = $1`, [finding.reference_id]
    );
    if (rows[0]) {
      const r = rows[0];
      const { rows: contact } = await query(
        `SELECT name FROM contacts WHERE id = $1`, [r.contact_id]
      );
      contextLines.push(`ใบแจ้งหนี้ ${r.invoice_number} ยอดสุทธิ ${r.net_amount} ภาษี ${r.vat_amount} สถานะ ${r.status} ครบกำหนด ${r.due_date} ลูกค้า ${contact[0]?.name || '-'}`);
    }
  }

  if (finding.category === "expense" && finding.reference_id) {
    const { rows } = await query(
      `SELECT expense_number, description, category, vendor, amount, vat_amount, status, expense_date
       FROM expenses WHERE id = $1`, [finding.reference_id]
    );
    if (rows[0]) {
      const r = rows[0];
      contextLines.push(`ค่าใช้จ่าย ${r.expense_number} ${r.description || ''} หมวด ${r.category} ผู้ขาย ${r.vendor} ยอด ${r.amount} ภาษีซื้อ ${r.vat_amount} วันที่ ${r.expense_date} สถานะ ${r.status}`);
    }
  }

  return contextLines.join("\n");
}

async function getRecommendation(finding: AuditFinding): Promise<string | undefined> {
  const context = await gatherContext(finding);
  try {
    const prompt = `
คุณคือผู้ตรวจสอบบัญชีมืออาชีพ จงแนะนำแนวทางแก้ไขให้กับข้อผิดพลาด/ความเสี่ยงทางบัญชี-ภาษีไทยต่อไปนี้

ปัญหา (หมวด: ${finding.category}, ระดับ: ${finding.severity}):
${finding.detail}

ข้อมูลที่เกี่ยวข้อง:
${context || "-"}

กรุณาตอบเป็นภาษาไทย:
1. สาเหตุที่เป็นไปได้ของปัญหา
2. ขั้นตอนการแก้ไขที่ปฏิบัติได้ทันที (เป็นข้อๆ)
3. ข้อควรระวังทางภาษีไทย (ถ้าเกี่ยวข้อง)

ตอบสั้น กระชับ ไม่เกิน 6-8 บรรทัด`;
    const answer = await askGemini(prompt, 2, 800);
    return answer;
  } catch (e: any) {
    console.error("AI recommendation failed:", e.message);
    return undefined;
  }
}

// ---------- Rule-based audit checks (deterministic) ----------

async function checkUnbalancedJournals(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  try {
    // journal_entries has both debit/credit columns AND debit_account_id/credit_account_id/amount
    const { rows } = await query(
      `SELECT reference_no, entry_date, COUNT(*) as cnt,
              ABS(COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0)) as diff
       FROM journal_entries
       GROUP BY reference_no, entry_date
       HAVING ABS(COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0)) > 0.01
       LIMIT 10`
    );
    for (const r of rows) {
      findings.push({
        severity: "critical",
        category: "journal",
        title: "สมุดรายวันไม่สมดุล",
        detail: `รายการเอกสาร ${r.reference_no} (วันที่ ${r.entry_date}) มียอดเดบิตและเครดิตไม่เท่ากัน ต่างกัน ${r.diff} บาท จำนวน ${r.cnt} บรรทัด`,
        reference_label: r.reference_no,
        dedup_key: `journal-unbalanced-${r.reference_no}`,
      });
    }
  } catch (e) {}
  return findings;
}

async function checkVatMismatch(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  const vatRate = 0.07;
  try {
    // net_amount is double precision; cast to numeric for precise rounding
    const { rows } = await query(
      `SELECT id, invoice_number, net_amount, vat_amount
       FROM invoices
       WHERE status != 'cancelled' AND vat_amount > 0
         AND ABS((vat_amount::numeric) - ROUND((net_amount::numeric) * $1, 2)) > 0.01
       LIMIT 10`,
      [vatRate]
    );
    for (const r of rows) {
      const expected = roundThaiTaxAmount(Number(r.net_amount) * vatRate);
      findings.push({
        severity: "warning",
        category: "vat",
        title: "VAT ไม่ตรงกับ 7%",
        detail: `ใบแจ้งหนี้ ${r.invoice_number}: ยอดภาษี ${r.vat_amount} บาท แต่ควรเป็น ${expected} บาท (จาก net ${r.net_amount})`,
        reference_id: r.id,
        reference_label: r.invoice_number,
        dedup_key: `vat-mismatch-inv-${r.id}`,
      });
    }
  } catch (e) {}
  return findings;
}

async function checkOverdueInvoices(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  try {
    // due_date is stored as varchar -> cast to date
    const { rows } = await query(
      `SELECT id, invoice_number, net_amount, due_date, contact_id
       FROM invoices
       WHERE status NOT IN ('paid', 'cancelled')
         AND due_date IS NOT NULL AND due_date != ''
         AND due_date::date < CURRENT_DATE - 30
       ORDER BY due_date DESC
       LIMIT 10`
    );
    for (const r of rows) {
      const days = Math.floor((Date.now() - new Date(r.due_date).getTime()) / 86400000);
      const level: "warning" | "critical" = days >= 60 ? "critical" : "warning";
      findings.push({
        severity: level,
        category: "invoice",
        title: days >= 60 ? "ลูกหนี้ค้างชำระเกิน 60 วัน" : "ลูกหนี้ค้างชำระเกิน 30 วัน",
        detail: `ใบแจ้งหนี้ ${r.invoice_number} ยอด ${r.net_amount} บาท ค้างชำระ ${days} วัน (ครบกำหนด ${r.due_date})`,
        reference_id: r.id,
        reference_label: r.invoice_number,
        dedup_key: `overdue-inv-${r.id}`,
      });
    }
  } catch (e) {}
  return findings;
}

async function checkForbiddenExpenseCategory(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  const forbidden = ["รถยนต์นั่งส่วนบุคคลไม่เกิน 10 ที่นั่ง", "ค่ารับรอง"];
  try {
    for (const cat of forbidden) {
      const { rows } = await query(
        `SELECT id, expense_number, description, amount, vendor
         FROM expenses WHERE category = $1 LIMIT 10`, [cat]
      );
      for (const r of rows) {
        findings.push({
          severity: "warning",
          category: "expense",
          title: "ค่าใช้จ่ายต้องห้ามทางภาษี",
          detail: `ค่าใช้จ่ายหมวด "${cat}" (${r.expense_number} ${r.description || ''} ${r.vendor || ''} ยอด ${r.amount} บาท) เป็นภาษีซื้อต้องห้าม ต้องรวมเข้าเป็นต้นทุนและไม่สามารถขอคืน VAT ได้`,
          reference_id: r.id,
          reference_label: r.expense_number,
          dedup_key: `forbidden-exp-${r.id}`,
        });
      }
    }
  } catch (e) {}
  return findings;
}

async function checkTaxDeductibleWithoutReceipt(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  try {
    // expenses has tax_deductible flag; flag those marked deductible but no receipt uploaded
    const { rows } = await query(
      `SELECT id, expense_number, description, amount, vendor, tax_deductible,
              COALESCE(receipt_url,'') = '' AND COALESCE(receipt_base64,'') = '' AS no_receipt
       FROM expenses
       WHERE tax_deductible = true
         AND COALESCE(receipt_url,'') = '' AND COALESCE(receipt_base64,'') = ''
       LIMIT 10`
    );
    for (const r of rows) {
      findings.push({
        severity: "warning",
        category: "vat",
        title: "ค่าใช้จ่ายที่ขอหักภาษีแต่ไม่มีใบกำกับ/ใบเสร็จ",
        detail: `ค่าใช้จ่าย ${r.expense_number} ${r.description || r.vendor || ''} ยอด ${r.amount} บาท ถูกทำเครื่องหมายว่าเป็นรายการหักภาษีได้ แต่ยังไม่มีเอกสารใบกำกับภาษี/ใบเสร็จแนบ เสี่ยงถูกปฏิเสธการขอคืน VAT`,
        reference_id: r.id,
        reference_label: r.expense_number,
        dedup_key: `no-receipt-exp-${r.id}`,
      });
    }
  } catch (e) {}
  return findings;
}

async function checkVendorsWithNoWht(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  try {
    // payment_vouchers has no wht column -> link to expenses.wht_amount via expense_id
    const { rows } = await query(
      `SELECT v.id, v.voucher_no, v.payee_name, v.amount, v.issue_date, v.expense_id,
              e.wht_amount
       FROM payment_vouchers v
       LEFT JOIN expenses e ON e.id = v.expense_id
       WHERE v.amount >= 1000
         AND COALESCE(e.wht_amount, 0) = 0
       LIMIT 10`
    );
    for (const r of rows) {
      findings.push({
        severity: "info",
        category: "wht",
        title: "ใบสำคัญจ่ายที่อาจต้องหัก ณ ที่จ่าย",
        detail: `ใบสำคัญจ่าย ${r.voucher_no} ให้ ${r.payee_name} ยอด ${r.amount} บาท ยังไม่มีการบันทึกภาษีหัก ณ ที่จ่าย กรุณาตรวจสอบว่าควรรวม WHT 3% หรือไม่`,
        reference_id: r.id,
        reference_label: r.voucher_no,
        dedup_key: `no-wht-voucher-${r.id}`,
      });
    }
  } catch (e) {}
  return findings;
}

async function checkNegativeMargin(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  try {
    const result = await getCurrentMonthPL();
    if (result.success && result.data) {
      const revenue = Number(result.data.revenue?.totalRevenue || 0);
      const netProfit = Number(result.data.profitability?.netProfit || 0);
      const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
      if (revenue > 0 && margin < 35) {
        findings.push({
          severity: margin < 0 ? "critical" : "warning",
          category: "profit",
          title: margin < 0 ? "ผลประกอบการขาดทุน" : "Gross Margin ต่ำกว่าเป้า",
          detail: `อัตรากำไรปัจจุบัน ${margin.toFixed(1)}% (กำไรสุทธิ ${netProfit} จากรายได้ ${revenue} บาท) ต่ำกว่าเป้าหมาย 35% ที่บริษัทตั้งไว้`,
          dedup_key: `low-margin-${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        });
      }
    }
  } catch (e) {}
  return findings;
}

async function checkTaxDeadlines(): Promise<AuditFinding[]> {
  const findings: AuditFinding[] = [];
  try {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const alerts = TaxCalendarAlerts.getAlertsForDate(today);
    for (const alert of alerts) {
      // only the annual PND51 reminder is critical; periodic e-filing reminders are info/warning
      const isAnnual = alert.includes("ภ.ง.ด. 51");
      findings.push({
        severity: isAnnual ? "warning" : "info",
        category: "tax_deadline",
        title: "กำหนดยื่นภาษีวันนี้",
        detail: alert,
        dedup_key: `tax-deadline-${todayKey}-${isAnnual ? "51" : "general"}`,
      });
    }
  } catch (e) {}
  return findings;
}

// ---------- Orchestrator ----------

export async function runAllAuditChecks(): Promise<AuditFinding[]> {
  const all: AuditFinding[] = [
    ...(await checkUnbalancedJournals()),
    ...(await checkVatMismatch()),
    ...(await checkOverdueInvoices()),
    ...(await checkForbiddenExpenseCategory()),
    ...(await checkTaxDeductibleWithoutReceipt()),
    ...(await checkVendorsWithNoWht()),
    ...(await checkNegativeMargin()),
    ...(await checkTaxDeadlines()),
  ];
  return all;
}

// ---------- Persistence ----------

export async function persistFindings(findings: AuditFinding[]): Promise<{
  inserted: number;
  existing: number;
}> {
  let inserted = 0;
  let existing = 0;
  for (const f of findings) {
    const { rows } = await query(
      `SELECT id FROM ai_alerts WHERE dedup_key = $1 AND status = 'open'`, [f.dedup_key]
    );
    if (rows.length > 0) {
      existing++;
      continue;
    }
    // Attach AI recommendation (hybrid: only for issues that actually exist)
    const recommendation = await getRecommendation(f);
    await query(
      `INSERT INTO ai_alerts (severity, category, title, detail, recommendation, reference_id, reference_label, dedup_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [f.severity, f.category, f.title, f.detail, recommendation || null, f.reference_id, f.reference_label, f.dedup_key]
    );
    inserted++;
  }
  return { inserted, existing };
}

export async function runAiAudit(): Promise<AuditResult> {
  const findings = await runAllAuditChecks();
  const persist = await persistFindings(findings);
  return {
    findings,
    checkedAt: new Date().toISOString(),
    inserted: persist.inserted,
    existing: persist.existing,
  };
}

// ---------- Alert queries ----------

export async function getOpenAiAlerts(): Promise<any[]> {
  const { rows } = await query(
    `SELECT * FROM ai_alerts WHERE status = 'open' ORDER BY
       CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
       created_at DESC
     LIMIT 50`
  );
  return rows;
}

export async function getAlertCount(): Promise<number> {
  const { rows } = await query(
    `SELECT COUNT(*)::int as c FROM ai_alerts WHERE status = 'open'`
  );
  return Number(rows[0]?.c || 0);
}

export async function resolveAlert(id: number): Promise<void> {
  await query(
    `UPDATE ai_alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]
  );
}

export async function dismissAlert(id: number): Promise<void> {
  await query(`UPDATE ai_alerts SET status = 'dismissed' WHERE id = $1`, [id]);
}
