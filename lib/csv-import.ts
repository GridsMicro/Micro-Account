// =====================================================
// Micro-Account: CSV expense import (pure + injectable client)
// -----------------------------------------------------
// แยกการ parse/validate ออกจากการเขียน DB เพื่อให้ทดสอบด้วยการเรียกจริง
// ได้โดยไม่ต้องต่อ production database
// =====================================================

export type Queryable = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

export type ParsedExpense = {
  lineNo: number;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  reference_no: string | null;
  notes: string | null;
};

export type JournalCreator = (
  expenseId: number,
  vendorId: number,
  amount: number,
  vatAmount: number,
  category: string,
  expenseDate: string
) => Promise<{ success: boolean; error?: string }>;

/** Expected CSV: title,category,amount,expense_date,reference_no,notes */
export function parseExpenseCsv(text: string): {
  rows: ParsedExpense[];
  errors: string[];
  total: number;
} {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV file is empty or invalid"], total: 0 };
  }

  const dataLines = lines.slice(1); // บรรทัดแรกเป็น header
  const rows: ParsedExpense[] = [];
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const lineNo = i + 2; // +1 เพราะ header, +1 เพราะเริ่มที่ 1
    const values = dataLines[i]
      .split(",")
      .map((value: string) => value.trim().replace(/"/g, ""));

    if (values.length < 3) {
      errors.push(`Line ${lineNo}: Insufficient columns`);
      continue;
    }

    const [title, category, amountStr, expense_date, reference_no, notes] = values;
    if (!title || !category || !amountStr || !expense_date) {
      errors.push(`Line ${lineNo}: Missing required fields`);
      continue;
    }

    const amount = Number(amountStr);
    if (!Number.isFinite(amount)) {
      errors.push(`Line ${lineNo}: Invalid amount format`);
      continue;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expense_date)) {
      errors.push(`Line ${lineNo}: Invalid date format (YYYY-MM-DD)`);
      continue;
    }

    rows.push({
      lineNo,
      title,
      category,
      amount,
      expense_date,
      reference_no: reference_no || null,
      notes: notes || null,
    });
  }

  return { rows, errors, total: dataLines.length };
}

/**
 * เขียน expense + journal ด้วย client เดียวกัน (ต้องถูกเรียกภายใน withTransaction)
 * - ใช้ id ที่ DB สร้างจริงจาก RETURNING (ไม่เดาจากเลขลำดับใน CSV)
 * - ถ้า journal พัง → throw เพื่อให้ ROLLBACK ทั้งไฟล์ (fail-closed)
 */
export async function importExpenseRows(
  client: Queryable,
  rows: ParsedExpense[],
  createJournal: JournalCreator
): Promise<number> {
  for (const row of rows) {
    const inserted = await client.query(
      `INSERT INTO expenses (title, category, amount, expense_date, reference_no, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'paid') RETURNING id`,
      [row.title, row.category, row.amount, row.expense_date, row.reference_no, row.notes]
    );

    const expenseId = Number(inserted.rows?.[0]?.id);
    if (!Number.isInteger(expenseId) || expenseId <= 0) {
      throw new Error(`Line ${row.lineNo}: ไม่ได้รับ expense id จากฐานข้อมูล`);
    }

    const journal = await createJournal(
      expenseId,
      0, // vendorId (ไม่ได้ใช้ใน journaling)
      row.amount,
      0, // vatAmount (CSV ไม่มีช่องแยก VAT)
      row.category,
      row.expense_date
    );
    if (!journal.success) {
      throw new Error(`Line ${row.lineNo}: journal failed — ${journal.error || "unknown error"}`);
    }
  }
  return rows.length;
}
