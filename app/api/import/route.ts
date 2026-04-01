// =====================================================
// Micro-Account: CSV Import API
// Bulk import expenses from CSV files
// Copyright (c) 2026 Micro-Account. All Rights Reserved.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createExpenseJournalEntry } from '@/lib/journaling';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let errors = 0;
    const errorDetails = [];

    // Expected CSV format: title,category,amount,expense_date,reference_no,notes
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (!line.trim()) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < 3) {
        errors++;
        errorDetails.push(`Line ${i + 2}: Insufficient columns`);
        continue;
      }

      const [title, category, amountStr, expense_date, reference_no, notes] = values;
      
      // Validate required fields
      if (!title || !category || !amountStr || !expense_date) {
        errors++;
        errorDetails.push(`Line ${i + 2}: Missing required fields`);
        continue;
      }

      const amount = parseFloat(amountStr);
      if (isNaN(amount)) {
        errors++;
        errorDetails.push(`Line ${i + 2}: Invalid amount format`);
        continue;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expense_date)) {
        errors++;
        errorDetails.push(`Line ${i + 2}: Invalid date format (YYYY-MM-DD)`);
        continue;
      }

      try {
        // Insert into expenses table
        await query(`
          INSERT INTO expenses (title, category, amount, expense_date, reference_no, notes, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'paid')
        `, [title, category, amount, expense_date, reference_no, notes]);

        // Create journal entry
        await createExpenseJournalEntry(
          i + 1, // expenseId
          0, // vendorId (placeholder)
          amount,
          0, // vatAmount (placeholder)
          category,
          expense_date
        );

        imported++;
      } catch (error: any) {
        errors++;
        errorDetails.push(`Line ${i + 2}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      errorDetails,
      total: dataLines.length
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
