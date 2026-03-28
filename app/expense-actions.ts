"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ============================================================
// MODULE 12 — EXPENSES (ค่าใช้จ่ายองค์กร) | Phase 4
// ============================================================

const EXPENSE_CATEGORIES = [
  "เงินเดือนและค่าแรง",
  "ค่าเช่าสถานที่",
  "ค่าสาธารณูปโภค",
  "การตลาดและโฆษณา",
  "ค่า License/Software",
  "ค่าขนส่งและเดินทาง",
  "วัสดุและอุปกรณ์",
  "ค่าซ่อมบำรุง",
  "ต้นทุนสินค้า (COGS)",
  "อื่นๆ",
];

export { EXPENSE_CATEGORIES };

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
}

export async function getExpenses(year?: string, month?: string) {
  try {
    await ensureExpensesTable();
    const now = new Date();
    const y = year ? parseInt(year) : now.getFullYear();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, "0")}-${lastDay}`;

    const { rows } = await query(
      `SELECT * FROM expenses WHERE expense_date >= $1 AND expense_date <= $2 ORDER BY expense_date DESC, id DESC`,
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
    const y = year ? parseInt(year) : new Date().getFullYear();
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
  amount: number;
  expense_date: string;
  reference_no?: string;
  notes?: string;
}) {
  try {
    await ensureExpensesTable();
    const { rows } = await query(
      `INSERT INTO expenses (title, category, amount, expense_date, reference_no, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid') RETURNING id`,
      [
        data.title,
        data.category,
        data.amount,
        data.expense_date,
        data.reference_no || null,
        data.notes || null,
      ]
    );
    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    revalidatePath("/");
    return { success: true, id: rows[0].id };
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
    amount: number;
    expense_date: string;
    reference_no?: string;
    notes?: string;
  }
) {
  try {
    await query(
      `UPDATE expenses SET title=$1, category=$2, amount=$3, expense_date=$4, reference_no=$5, notes=$6 WHERE id=$7`,
      [
        data.title,
        data.category,
        data.amount,
        data.expense_date,
        data.reference_no || null,
        data.notes || null,
        id,
      ]
    );
    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id: number) {
  try {
    const result = await query(
      `DELETE FROM expenses WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "ไม่พบรายการค่าใช้จ่าย" };
    }

    revalidatePath("/expenses");
    revalidatePath("/reports/profit-loss");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("deleteExpense Error:", error);
    return { success: false, error: error.message };
  }
}
