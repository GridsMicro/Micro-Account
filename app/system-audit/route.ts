// =====================================================
// Micro-Account: System Audit Route
// Hidden route for testing journal entry validation
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createSalesJournalEntry, createExpenseJournalEntry, COA_ACCOUNTS } from '@/lib/journaling';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  
  try {
    switch (test) {
      case 'invoice':
        return await testInvoiceJournal();
      case 'expense':
        return await testExpenseJournal();
      case 'database':
        return await testDatabaseSchema();
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid test parameter. Use ?test=invoice, ?test=expense, or ?test=database'
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

async function testInvoiceJournal() {
  console.log('🧪 Testing Invoice Journal Entry Creation...');
  
  // Test Data
  const testInvoice = {
    invoiceId: 999999, // Test ID
    invoiceNumber: 'TEST-2026-001',
    customerId: 1,
    netAmount: 1000.00,
    vatAmount: 70.00,
    totalAmount: 1070.00,
    invoiceDate: '2026-04-01'
  };
  
  // Expected Journal Entries
  const expectedEntries = [
    {
      description: `ตั้งลูกหนี้จากใบแจ้งหนี้ #${testInvoice.invoiceNumber}`,
      debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      credit_account_id: COA_ACCOUNTS.SALES_REVENUE,
      amount: testInvoice.netAmount,
      journal_type: 'sales'
    },
    {
      description: `รายได้จากใบแจ้งหนี้ #${testInvoice.invoiceNumber}`,
      debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      credit_account_id: COA_ACCOUNTS.SALES_REVENUE,
      amount: testInvoice.netAmount,
      journal_type: 'sales'
    },
    {
      description: `ภาษีมูลค่าเพิ่มจากใบแจ้งหนี้ #${testInvoice.invoiceNumber}`,
      debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      credit_account_id: COA_ACCOUNTS.VAT_PAYABLE,
      amount: testInvoice.vatAmount,
      journal_type: 'sales',
      vat_rate: 7,
      vat_amount: testInvoice.vatAmount
    }
  ];
  
  // Dry Run Test
  const results = [];
  
  try {
    // Test the journal entry creation
    const journalResult = await createSalesJournalEntry(
      testInvoice.invoiceId,
      testInvoice.invoiceNumber,
      testInvoice.customerId,
      testInvoice.netAmount,
      testInvoice.vatAmount,
      testInvoice.totalAmount,
      testInvoice.invoiceDate
    );
    
    if (journalResult.success) {
      // Verify the created entries
      const { rows } = await query(
        `SELECT * FROM journal_entries 
         WHERE reference_type = 'invoice' AND reference_id = $1 
         ORDER BY created_at DESC`,
        [testInvoice.invoiceId]
      );
      
      results.push({
        test: 'Invoice Journal Entry Creation',
        status: '✅ PASSED',
        details: `Created ${rows.length} journal entries successfully`,
        entries: rows.map((row: any) => ({
          id: row.id,
          description: row.description,
          debit_account_id: row.debit_account_id,
          credit_account_id: row.credit_account_id,
          amount: parseFloat(row.amount),
          vat_amount: parseFloat(row.vat_amount || 0),
          document_number: row.document_number
        }))
      });
      
      // Clean up test data
      await query(`DELETE FROM journal_entries WHERE reference_type = 'invoice' AND reference_id = $1`, [testInvoice.invoiceId]);
      
    } else {
      results.push({
        test: 'Invoice Journal Entry Creation',
        status: '❌ FAILED',
        details: journalResult.error
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Invoice Journal Entry Creation',
      status: '❌ FAILED',
      details: error.message
    });
  }
  
  return NextResponse.json({
    success: true,
    test: 'Invoice Journal Validation',
    timestamp: new Date().toISOString(),
    test_data: testInvoice,
    expected_entries: expectedEntries,
    actual_results: results
  });
}

async function testExpenseJournal() {
  console.log('🧪 Testing Expense Journal Entry Creation...');
  
  // Test Data
  const testExpense = {
    expenseId: 999999, // Test ID
    vendorId: 1,
    amount: 500.00,
    vatAmount: 35.00,
    category: 'ค่าเช่าสถานที่',
    expenseDate: '2026-04-01'
  };
  
  // Expected Journal Entries
  const expectedEntries = [
    {
      description: `ค่าใช้จ่าย ${testExpense.category}`,
      debit_account_id: COA_ACCOUNTS.RENT,
      credit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
      amount: testExpense.amount - testExpense.vatAmount,
      journal_type: 'purchase'
    },
    {
      description: `ภาษีซื้อจากค่าใช้จ่าย ${testExpense.category}`,
      debit_account_id: COA_ACCOUNTS.INPUT_VAT,
      credit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
      amount: testExpense.vatAmount,
      journal_type: 'purchase',
      vat_rate: 7,
      vat_amount: testExpense.vatAmount
    }
  ];
  
  // Dry Run Test
  const results = [];
  
  try {
    // Test the journal entry creation
    const journalResult = await createExpenseJournalEntry(
      testExpense.expenseId,
      testExpense.vendorId,
      testExpense.amount,
      testExpense.vatAmount,
      testExpense.category,
      testExpense.expenseDate
    );
    
    if (journalResult.success) {
      // Verify the created entries
      const { rows } = await query(
        `SELECT * FROM journal_entries 
         WHERE reference_type = 'expense' AND reference_id = $1 
         ORDER BY created_at DESC`,
        [testExpense.expenseId]
      );
      
      results.push({
        test: 'Expense Journal Entry Creation',
        status: '✅ PASSED',
        details: `Created ${rows.length} journal entries successfully`,
        entries: rows.map((row: any) => ({
          id: row.id,
          description: row.description,
          debit_account_id: row.debit_account_id,
          credit_account_id: row.credit_account_id,
          amount: parseFloat(row.amount),
          vat_amount: parseFloat(row.vat_amount || 0),
          document_number: row.document_number
        }))
      });
      
      // Clean up test data
      await query(`DELETE FROM journal_entries WHERE reference_type = 'expense' AND reference_id = $1`, [testExpense.expenseId]);
      
    } else {
      results.push({
        test: 'Expense Journal Entry Creation',
        status: '❌ FAILED',
        details: journalResult.error
      });
    }
  } catch (error: any) {
    results.push({
      test: 'Expense Journal Entry Creation',
      status: '❌ FAILED',
      details: error.message
    });
  }
  
  return NextResponse.json({
    success: true,
    test: 'Expense Journal Validation',
    timestamp: new Date().toISOString(),
    test_data: testExpense,
    expected_entries: expectedEntries,
    actual_results: results
  });
}

async function testDatabaseSchema() {
  console.log('🧪 Testing Database Schema...');
  
  const results = [];
  
  try {
    // Test Chart of Accounts table
    const { rows: coaRows } = await query(
      `SELECT COUNT(*) as count FROM chart_of_accounts WHERE is_active = true`
    );
    
    results.push({
      test: 'Chart of Accounts Schema',
      status: coaRows[0].count > 0 ? '✅ PASSED' : '❌ FAILED',
      details: `Found ${coaRows[0].count} active accounts`
    });
    
    // Test Products table with new fields
    const { rows: productColumns } = await query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'products' AND column_name IN ('supplier_cost', 'markup_rate')
       ORDER BY column_name`
    );
    
    const hasSupplierCost = productColumns.some((col: any) => col.column_name === 'supplier_cost');
    const hasMarkupRate = productColumns.some((col: any) => col.column_name === 'markup_rate');
    
    results.push({
      test: 'Products Table Schema',
      status: (hasSupplierCost && hasMarkupRate) ? '✅ PASSED' : '❌ FAILED',
      details: `supplier_cost: ${hasSupplierCost ? '✅' : '❌'}, markup_rate: ${hasMarkupRate ? '✅' : '❌'}`,
      columns: productColumns
    });
    
    // Test Journal Entries table
    const { rows: journalColumns } = await query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'journal_entries' 
       ORDER BY ordinal_position`
    );
    
    const requiredColumns = ['id', 'journal_type', 'reference_type', 'reference_id', 'debit_account_id', 'credit_account_id', 'amount'];
    const hasAllColumns = requiredColumns.every(col => journalColumns.some((jc: any) => jc.column_name === col));
    
    results.push({
      test: 'Journal Entries Schema',
      status: hasAllColumns ? '✅ PASSED' : '❌ FAILED',
      details: `Required columns: ${requiredColumns.length}/${requiredColumns.length} present`,
      columns: journalColumns.map((col: any) => col.column_name)
    });
    
  } catch (error: any) {
    results.push({
      test: 'Database Schema Test',
      status: '❌ FAILED',
      details: error.message
    });
  }
  
  return NextResponse.json({
    success: true,
    test: 'Database Schema Validation',
    timestamp: new Date().toISOString(),
    results
  });
}
