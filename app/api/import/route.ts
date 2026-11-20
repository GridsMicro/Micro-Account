// =====================================================
// Micro-Account: CSV Import API
// Bulk import expenses from CSV files
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import { createExpenseJournalEntry } from '@/lib/journaling';
import { parseExpenseCsv, importExpenseRows } from '@/lib/csv-import';
import { requirePermission, authErrorResponse } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  const guard = await requirePermission('expenses', 'create');
  if (!guard.ok) return authErrorResponse(guard);
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();
    const { rows, errors, total } = parseExpenseCsv(text);

    if (total === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // P0-3: ทุกแถวที่ถูกต้องต้องเข้า/ออกด้วยกัน — expense กับ journal ต้องอยู่ใน transaction เดียว
    // expenseId มาจาก RETURNING id จริง ไม่ใช่ i + 1 และเช็คผล journal ทุกครั้ง
    try {
      const imported = await withTransaction((client) =>
        importExpenseRows(client, rows, (expenseId, vendorId, amount, vatAmount, category, expenseDate) =>
          // ส่ง client เดียวกันเข้า journaling → ถ้า journal พัง ROLLBACK ทั้งไฟล์
          createExpenseJournalEntry(
            expenseId, vendorId, amount, vatAmount, category, expenseDate, 0, client
          )
        )
      );

      return NextResponse.json({
        success: true,
        imported,
        errors: errors.length,
        errorDetails: errors,
        total,
      });
    } catch (error: any) {
      // fail-closed: อย่างน้อยหนึ่งแถวพัง → ไม่มีแถวไหนถูก commit
      const reason = error?.message || 'unknown error';
      return NextResponse.json({
        success: false,
        error: `Import rolled back: ${reason}`,
        imported: 0,
        errors: errors.length + 1,
        errorDetails: [...errors, `Transaction: ${reason}`],
        total,
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
