"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { createExpenseJournalEntry } from "@/lib/journaling";

async function deleteExpenseJournalEntries(expenseId: number) {
  const journalReference = `EXP-${expenseId}`;
  await query(
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
    ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT FALSE
  `);
}

export async function getExpenses(year?: string, month?: string) {
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
  vat_amount?: number;
  wht_rate?: number;
  wht_amount?: number;
  net_amount?: number;
  is_service?: boolean;
  notes?: string;
  receipt_url?: string;
  receipt_file_name?: string;
  receipt_mime_type?: string;
}) {
  try {
    await ensureExpensesTable();
    
    // Fetch vendor name from contacts if contact_id provided
    let vendorName = null;
    if (data.contact_id) {
      const contactRes = await query(`SELECT name FROM contacts WHERE id = $1`, [data.contact_id]);
      if (contactRes.rows.length > 0) {
        vendorName = contactRes.rows[0].name;
      }
    }
    
    const { rows } = await query(
      `INSERT INTO expenses (
         description,
         category,
         amount,
         expense_date,
         reference_no,
         tax_invoice_no,
         tax_invoice_date,
         vat_amount,
         wht_rate,
         wht_amount,
         net_amount,
         is_service,
         contact_id,
         vendor,
         classification,
         notes,
         receipt_url,
         receipt_file_name,
         receipt_mime_type,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 'paid')
       RETURNING id`,
      [
        data.title,
        data.category,
        data.amount,
        data.expense_date,
        data.reference_no || null,
        data.tax_invoice_no || null,
        data.tax_invoice_date || null,
        data.vat_amount || 0,
        data.wht_rate || 0,
        data.wht_amount || 0,
        data.net_amount || data.amount || 0,
        data.is_service || false,
        data.contact_id || null,
        vendorName,
        (data.classification || "OPEX").toUpperCase(),
        data.notes || null,
        data.receipt_url || null,
        data.receipt_file_name || null,
        data.receipt_mime_type || null,
      ]
    );

    const expenseId = rows[0].id;
    const journalResult = await createExpenseJournalEntry(
      expenseId,
      data.contact_id || 0,
      data.amount,
      data.vat_amount || 0,
      data.category,
      data.expense_date,
      data.wht_amount || 0
    );

    if (!journalResult.success) {
      throw new Error(`Journal entry failed: ${journalResult.error}`);
    }

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
    vat_amount?: number;
    notes?: string;
    receipt_url?: string;
    receipt_file_name?: string;
    receipt_mime_type?: string;
  }
) {
  try {
    await ensureExpensesTable();
    await query(
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
           updated_at=CURRENT_TIMESTAMP
       WHERE id=$15`,
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
        id,
      ]
    );

    await deleteExpenseJournalEntries(id);
    const journalResult = await createExpenseJournalEntry(
      id,
      data.contact_id || 0,
      data.amount,
      data.vat_amount || 0,
      data.category,
      data.expense_date
    );

    if (!journalResult.success) {
      throw new Error(`Journal entry failed: ${journalResult.error}`);
    }

    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    revalidatePath("/tax-reports");
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id: number) {
  try {
    await ensureExpensesTable();
    await deleteExpenseJournalEntries(id);
    const result = await query(`DELETE FROM expenses WHERE id = $1 RETURNING id`, [id]);

    if (result.rows.length === 0) {
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
