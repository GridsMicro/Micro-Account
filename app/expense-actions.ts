"use server";

import { revalidatePath } from "next/cache";
import { query, withTransaction } from "@/lib/db";
import { createExpenseJournalEntry } from "@/lib/journaling";
import { requirePermission, authActionError } from "@/lib/server-auth";

async function deleteExpenseJournalEntries(
  expenseId: number,
  queryFn: (text: string, params?: any[]) => Promise<any> = query
) {
  const journalReference = `EXP-${expenseId}`;
  await queryFn(
    `DELETE FROM journal_entries
     WHERE (reference_type = 'expense' AND reference_id = $1)
        OR reference_no = $2
        OR document_number = $2`,
    [expenseId, journalReference]
  );
}

async function ensureExpensesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'อื่นๆ',
      amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      expense_date DATE NOT NULL,
      reference_no VARCHAR(100),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'paid',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tax_invoice_no VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tax_invoice_date DATE,
    ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS contact_id INTEGER,
    ADD COLUMN IF NOT EXISTS classification VARCHAR(20) NOT NULL DEFAULT 'OPEX',
    ADD COLUMN IF NOT EXISTS receipt_url TEXT,
    ADD COLUMN IF NOT EXISTS receipt_file_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS receipt_mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS net_amount DECIMAL(15, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS original_currency VARCHAR(10) DEFAULT 'THB',
    ADD COLUMN IF NOT EXISTS original_amount DECIMAL(15, 4) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15, 6) DEFAULT NULL,
    -- 2026-11-18 (ฌอน / ข้อ 2): คอลัมน์ที่ getPP30Draft / getPP36Draft / getPNDReportDraft
    -- ใช้งานอยู่แล้วแต่เคยไม่ได้สร้างใน ensureExpensesTable → fresh install จะ query error
    -- ใช้ ADD COLUMN IF NOT EXISTS → ไม่กระทบ production ที่มีคอลัมน์อยู่แล้ว (DEFAULT false = ปลอดภัย)
    ADD COLUMN IF NOT EXISTS tax_deductible BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pp36_exempt BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS withholding_tax_amount DECIMAL(15, 2) DEFAULT 0
  `);
}

/**
 * 2026-11-18 (ฌอน / ข้อ 2): ตรวจความครบถ้วนของใบกำกับภาษีซื้อก่อนบันทึก
 * ถ้ามี VAT > 0 แต่ไม่มีเลขที่/วันที่ใบภาษีซื้อ → ภาษีซื้อจะนำหักใน ภ.พ.30 ไม่ได้
 * ใช้ทั้งตอนสร้างและตอนแก้ (server-side validation — ไม่เชื่อ client อย่างเดียว)
 */
function validateInputTaxDocument(data: {
  vat_amount?: number;
  tax_invoice_no?: string;
  tax_invoice_date?: string;
}): string | null {
  if (Number(data.vat_amount || 0) <= 0) return null;
  if (!data.tax_invoice_no || !data.tax_invoice_no.trim()) {
    return "มี VAT แต่ยังไม่ระบุเลขที่ใบภาษีซื้อ — กรุณาเติมก่อนบันทึก";
  }
  if (!data.tax_invoice_date) {
    return "มี VAT แต่ยังไม่ระบุวันที่ใบภาษีซื้อ — กรุณาเติมก่อนบันทึก";
  }
  return null;
}

export async function getExpenses(year?: string, month?: string) {
  const guard = await requirePermission("expenses", "read");
  if (!guard.ok) return authActionError(guard);
  try {
    await ensureExpensesTable();
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;

    const { rows } = await query(
      `SELECT e.*, c.name AS vendor_name, c.tax_id AS vendor_tax_id
       FROM expenses e
       LEFT JOIN contacts c ON c.id = e.contact_id
       WHERE e.expense_date >= $1 AND e.expense_date <= $2
       ORDER BY e.expense_date DESC, e.id DESC`,
      [startDate, endDate]
    );
    const summaryRes = await query(
      `SELECT category, SUM(amount) as total FROM expenses
       WHERE expense_date >= $1 AND expense_date <= $2
       GROUP BY category ORDER BY total DESC`,
      [startDate, endDate]
    );
    const totalRes = await query(
      `SELECT SUM(amount) as total FROM expenses WHERE expense_date >= $1 AND expense_date <= $2`,
      [startDate, endDate]
    );

    return {
      success: true,
      data: rows,
      summary: summaryRes.rows,
      total: Number(totalRes.rows[0]?.total || 0),
      period: { year: y, month: m },
    };
  } catch (error: any) {
    console.error("getExpenses Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getExpensesYearly(year?: string) {
  const guard = await requirePermission("expenses", "read");
  if (!guard.ok) return authActionError(guard);
  try {
    await ensureExpensesTable();
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    const monthly = await query(
      `SELECT EXTRACT(MONTH FROM expense_date)::int as month, SUM(amount) as total, COUNT(*) as count
       FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1
       GROUP BY month ORDER BY month ASC`,
      [y]
    );
    const totalRes = await query(
      `SELECT SUM(amount) as total FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1`,
      [y]
    );
    const categoryRes = await query(
      `SELECT category, SUM(amount) as total FROM expenses
       WHERE EXTRACT(YEAR FROM expense_date) = $1
       GROUP BY category ORDER BY total DESC`,
      [y]
    );

    return {
      success: true,
      monthly: monthly.rows,
      total: Number(totalRes.rows[0]?.total || 0),
      byCategory: categoryRes.rows,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createExpense(data: {
  title: string;
  category: string;
  classification?: string;
  contact_id?: number;
  amount: number;
  expense_date: string;
  reference_no?: string;
  tax_invoice_no?: string;
  tax_invoice_date?: string;
  /** 2026-11-18 (ฌอน): ยืนยันสิทธิหักภาษีซื้อ — default false ต้องยืนยันเอง */
  tax_deductible?: boolean;
  vat_amount?: number;
  wht_rate?: number;
  wht_amount?: number;
  net_amount?: number;
  is_service?: boolean;
  notes?: string;
  receipt_url?: string;
  receipt_file_name?: string;
  receipt_mime_type?: string;
  original_currency?: string;
  original_amount?: number;
  exchange_rate?: number;
}) {
  const guard = await requirePermission("expenses", "create");
  if (!guard.ok) return authActionError(guard);
  try {
    await ensureExpensesTable();

    // 2026-11-18 (ฌอน / ข้อ 2): บังคับเลขที่/วันที่ใบภาษีซื้อเมื่อมี VAT
    const docError = validateInputTaxDocument({
      vat_amount: data.vat_amount,
      tax_invoice_no: data.tax_invoice_no,
      tax_invoice_date: data.tax_invoice_date,
    });
    if (docError) return { success: false, error: docError };

    // ชื่อผู้ขายมาจาก JOIN contacts ตอนอ่าน (getExpenses) — ไม่ต้อง duplicate ลง expenses

    // ถ้าเป็น foreign currency ให้ original_currency ≠ THB จะต้องมี original_amount + exchange_rate
    const isForeignCurrency = data.original_currency && data.original_currency !== "THB";
    
    // P0: เอกสาร + journal ต้องสำเร็จทั้งคู่หรือไม่เลย (rollback ถ้าขั้นใดพลาด)
    // แก้ schema mismatch: ใช้ `title` (มีจริงทั้ง master schema และ ensureExpensesTable)
    // แทน `description` ที่ไม่ถูกสร้าง — และไม่ insert `vendor` ที่ไม่มีคอลัมน์
    const expenseId = await withTransaction(async (client) => {
      const db = { query: (text: string, params?: any[]) => client.query(text, params) };
      const { rows } = await db.query(
        `INSERT INTO expenses (
           title,
           category,
           amount,
           expense_date,
           reference_no,
           tax_invoice_no,
           tax_invoice_date,
           tax_deductible,
           vat_amount,
           wht_rate,
           wht_amount,
           net_amount,
           is_service,
           contact_id,
           classification,
           notes,
           receipt_url,
           receipt_file_name,
           receipt_mime_type,
           original_currency,
           original_amount,
           exchange_rate,
           status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'paid')
         RETURNING id`,
        [
          data.title,
          data.category,
          data.amount,
          data.expense_date,
          data.reference_no || null,
          data.tax_invoice_no || null,
          data.tax_invoice_date || null,
          data.tax_deductible || false,
          data.vat_amount || 0,
          data.wht_rate || 0,
          data.wht_amount || 0,
          data.net_amount || data.amount || 0,
          data.is_service || false,
          data.contact_id || null,
          (data.classification || "OPEX").toUpperCase(),
          data.notes || null,
          data.receipt_url || null,
          data.receipt_file_name || null,
          data.receipt_mime_type || null,
          isForeignCurrency ? data.original_currency : "THB",
          isForeignCurrency ? (data.original_amount ?? null) : null,
          isForeignCurrency ? (data.exchange_rate ?? null) : null,
        ]
      );

      const newId = Number(rows[0].id);
      const journalResult = await createExpenseJournalEntry(
        newId,
        data.contact_id || 0,
        data.amount,
        data.vat_amount || 0,
        data.category,
        data.expense_date,
        data.wht_amount || 0,
        db
      );
      if (!journalResult.success) {
        throw new Error(`Journal entry failed: ${journalResult.error}`);
      }
      return newId;
    });

    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    revalidatePath("/tax-reports");
    revalidatePath("/journals");
    revalidatePath("/");
    return { success: true, id: expenseId };
  } catch (error: any) {
    console.error("createExpense Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateExpense(
  id: number,
  data: {
    title: string;
    category: string;
    classification?: string;
    contact_id?: number;
    amount: number;
    expense_date: string;
    reference_no?: string;
    tax_invoice_no?: string;
    tax_invoice_date?: string;
    /** 2026-11-18 (ฌอน): ยืนยันสิทธิหักภาษีซื้อ */
    tax_deductible?: boolean;
    vat_amount?: number;
    notes?: string;
    receipt_url?: string;
    receipt_file_name?: string;
    receipt_mime_type?: string;
    original_currency?: string;
    original_amount?: number;
    exchange_rate?: number;
  }
) {
  const guard = await requirePermission("expenses", "update");
  if (!guard.ok) return authActionError(guard);
  try {
    await ensureExpensesTable();
    // 2026-11-18 (ฌอน / ข้อ 2): บังคับเลขที่/วันที่ใบภาษีซื้อเมื่อมี VAT (server-side)
    const docError = validateInputTaxDocument({
      vat_amount: data.vat_amount,
      tax_invoice_no: data.tax_invoice_no,
      tax_invoice_date: data.tax_invoice_date,
    });
    if (docError) return { success: false, error: docError };
    const isForeignCurrency = data.original_currency && data.original_currency !== "THB";

    // P0: update expense + ลบ journal เก่า + สร้าง journal ใหม่ ต้องเป็น transaction เดียว
    await withTransaction(async (client) => {
      const db = { query: (text: string, params?: any[]) => client.query(text, params) };
      await db.query(
        `UPDATE expenses
         SET title=$1,
             category=$2,
             amount=$3,
             expense_date=$4,
             reference_no=$5,
             tax_invoice_no=$6,
             tax_invoice_date=$7,
             vat_amount=$8,
             contact_id=$9,
             classification=$10,
             notes=$11,
             receipt_url=$12,
             receipt_file_name=$13,
             receipt_mime_type=$14,
             original_currency=$15,
             original_amount=$16,
             exchange_rate=$17,
             tax_deductible=$18,
             updated_at=CURRENT_TIMESTAMP
         WHERE id=$19`,
        [
          data.title,
          data.category,
          data.amount,
          data.expense_date,
          data.reference_no || null,
          data.tax_invoice_no || null,
          data.tax_invoice_date || null,
          data.vat_amount || 0,
          data.contact_id || null,
          (data.classification || "OPEX").toUpperCase(),
          data.notes || null,
          data.receipt_url || null,
          data.receipt_file_name || null,
          data.receipt_mime_type || null,
          isForeignCurrency ? data.original_currency : "THB",
          isForeignCurrency ? (data.original_amount ?? null) : null,
          isForeignCurrency ? (data.exchange_rate ?? null) : null,
          data.tax_deductible || false,
          id,
        ]
      );

      await deleteExpenseJournalEntries(id, db.query);
      const journalResult = await createExpenseJournalEntry(
        id,
        data.contact_id || 0,
        data.amount,
        data.vat_amount || 0,
        data.category,
        data.expense_date,
        0,
        db
      );
      if (!journalResult.success) {
        throw new Error(`Journal entry failed: ${journalResult.error}`);
      }
    });

    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    revalidatePath("/tax-reports");
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 2026-11-18 (ฌอน / ข้อ 2): แก้เฉพาะข้อมูลภาษีซื้อของรายการที่มีอยู่แล้ว
 * — ทำไมต้องมี: หน้า /expenses เดิมมีแค่ "เพิ่ม/ลบ" ไม่มีแก้ไข ทำให้รายการเก่า
 *   (เช่น Microsoft 365 VAT 241.99 ใบ MRSTHMCI2700383704 ที่วันที่เป็น "รอระบุวันที่")
 *   แก้ไม่ได้เว้นแต่จะลบแล้วสร้างใหม่ ซึ่งจะกระทบ journal
 * — ปลอดภัย: อัปเดตเฉพาะ 3 คอลัมน์ภาษี, ไม่แตะ amount/vat/journal
 * — เรียกได้เฉพาะเมื่อผู้ใช้กดปุ่มใน UI (user-initiated) — ระบบไม่รันเอง
 */
export async function updateExpenseTaxInfo(
  id: number,
  data: {
    tax_invoice_no: string | null;
    tax_invoice_date: string | null;
    tax_deductible: boolean;
  }
) {
  const guard = await requirePermission("expenses", "update");
  if (!guard.ok) return authActionError(guard);
  try {
    await ensureExpensesTable();

    // กันกรณีส่งวันที่/เลขที่มาโดยไม่มี VAT → ยังอนุญาต (ไม่บังคับ)
    // แต่ถ้ารายการนี้มี VAT > 0 ต้องมีเลขที่ + วันที่ก่อนยืนยันสิทธิหัก
    const current = await query(
      `SELECT COALESCE(vat_amount,0) AS vat FROM expenses WHERE id = $1`,
      [id]
    );
    if (current.rows.length === 0) {
      return { success: false, error: "ไม่พบรายการค่าใช้จ่าย" };
    }
    if (data.tax_deductible) {
      const docError = validateInputTaxDocument({
        vat_amount: Number(current.rows[0].vat),
        tax_invoice_no: data.tax_invoice_no || undefined,
        tax_invoice_date: data.tax_invoice_date || undefined,
      });
      if (docError) return { success: false, error: docError };
    }

    await query(
      `UPDATE expenses
       SET tax_invoice_no = $1,
           tax_invoice_date = $2,
           tax_deductible = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [
        data.tax_invoice_no || null,
        data.tax_invoice_date || null,
        data.tax_deductible,
        id,
      ]
    );

    revalidatePath("/expenses");
    revalidatePath("/tax-reports");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id: number) {
  const guard = await requirePermission("expenses", "delete");
  if (!guard.ok) return authActionError(guard);
  try {
    await ensureExpensesTable();
    // P0: ลบ journal + expense ต้องสำเร็จด้วยกัน
    const deleted = await withTransaction(async (client) => {
      const db = { query: (text: string, params?: any[]) => client.query(text, params) };
      await deleteExpenseJournalEntries(id, db.query);
      const result = await db.query(`DELETE FROM expenses WHERE id = $1 RETURNING id`, [id]);
      return result.rows.length > 0;
    });

    if (!deleted) {
      return { success: false, error: "ไม่พบรายการค่าใช้จ่าย" };
    }

    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    revalidatePath("/tax-reports");
    revalidatePath("/journals");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteExpense Error:", error);
    return { success: false, error: error.message };
  }
}
