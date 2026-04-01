// =====================================================
// Micro-Account: Automated Journaling System
// Double-Entry Bookkeeping with Thai Accounting Standards
// =====================================================

import { query } from "@/lib/db";

// Chart of Accounts Mapping
export const COA_ACCOUNTS = {
  // Assets
  CASH: 1111,           // เงินสด
  BANK_KTB: 1112,       // ธนาคารกรุงไทย
  BANK_KBANK: 1113,     // ธนาคารกสิกรไทย
  ACCOUNTS_RECEIVABLE: 1121,  // ลูกหนี้การค้า
  INVENTORY: 1131,      // สินค้าคงเหลือ
  INPUT_VAT: 1140,      // ภาษีซื้อที่นำมาหักลดหย่อนได้
  
  // Liabilities
  ACCOUNTS_PAYABLE: 2111,     // เจ้าหนี้การค้า
  VAT_PAYABLE: 2121,          // ภาษีมูลค่าเพิ่มที่ต้องจ่าย
  WHT_PAYABLE: 2130,          // ภาษีหัก ณ ที่จ่ายที่ต้องจ่าย
  WAGES_PAYABLE: 2140,        // เงินเดือนที่ต้องจ่าย
  
  // Equity
  PAID_UP_CAPITAL: 3110,      // ทุนจดทะเบียนชำระแล้ว
  RETAINED_EARNINGS: 3200,     // กำไรสะสม
  
  // Revenue
  SALES_REVENUE: 4110,         // รายได้จากการขายสินค้า
  SALES_DISCOUNTS: 4120,       // ส่วนลดจากการขาย
  INTEREST_INCOME: 4210,       // ดอกเบี้ยรับ
  
  // Expenses
  COGS: 5110,                  // ต้นทุนขายสินค้า
  ADVERTISING: 5210,           // ค่าโฆษณาและประชาสัมพันธ์
  SALES_COMMISSION: 5220,      // ค่าคอมมิชชันขาย
  SALARIES: 5310,              // เงินเดือนและค่าจ้าง
  RENT: 5320,                  // ค่าเช่าสถานที่
  UTILITIES: 5330,             // ค่าสาธารณูปโภค
  DEPRECIATION: 5340,          // ค่าเสื่อมราคา
  INTEREST_EXPENSE: 5410,      // ดอกเบี้ยจ่าย
  CORPORATE_TAX: 5510,         // ภาษีเงินได้นิติบุคคล
} as const;

// Journal Entry Types
export type JournalType = 'sales' | 'receipt' | 'purchase' | 'payment' | 'general';

export interface JournalEntry {
  entry_date: string;
  journal_type: JournalType;
  reference_type: string;
  reference_id: number;
  description: string;
  debit_account_id: number;
  credit_account_id: number;
  amount: number;
  vat_rate?: number;
  vat_amount?: number;
  withholding_rate?: number;
  withholding_amount?: number;
  fiscal_year?: number;
  fiscal_month?: number;
  document_number?: string;
  notes?: string;
}

// Generate Document Number (e.g., SJ-2026-04-001)
export async function generateDocumentNumber(journalType: JournalType, date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = journalType.toUpperCase().substring(0, 2); // SA, RE, PU, PA, GE
  
  try {
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM journal_entries 
       WHERE journal_type = $1 AND fiscal_year = $2 AND fiscal_month = $3`,
      [journalType, year, parseInt(month)]
    );
    
    const nextNumber = (parseInt(rows[0].count) + 1).toString().padStart(3, '0');
    return `${prefix}-${year}-${month}-${nextNumber}`;
  } catch (error) {
    return `${prefix}-${year}-${month}-001`;
  }
}

// Create Single Journal Entry (Double-Entry Pair)
export async function createJournalEntry(entry: JournalEntry): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const date = new Date(entry.entry_date);
    const fiscal_year = date.getFullYear();
    const fiscal_month = date.getMonth() + 1;
    const document_number = entry.document_number || await generateDocumentNumber(entry.journal_type, date);
    
    const { rows } = await query(
      `INSERT INTO journal_entries (
        entry_date, journal_type, reference_type, reference_id, description,
        debit_account_id, credit_account_id, amount,
        vat_rate, vat_amount, withholding_rate, withholding_amount,
        fiscal_year, fiscal_month, document_number, notes, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      ) RETURNING id`,
      [
        entry.entry_date, entry.journal_type, entry.reference_type, entry.reference_id, entry.description,
        entry.debit_account_id, entry.credit_account_id, entry.amount,
        entry.vat_rate || 0, entry.vat_amount || 0, entry.withholding_rate || 0, entry.withholding_amount || 0,
        fiscal_year, fiscal_month, document_number, entry.notes || null
      ]
    );
    
    return { success: true, id: rows[0].id };
  } catch (error: any) {
    console.error('Journal Entry Error:', error);
    return { success: false, error: error.message };
  }
}

// Invoice Journal Entry (Sales Journal)
export async function createSalesJournalEntry(
  invoiceId: number, 
  invoiceNumber: string, 
  customerId: number,
  netAmount: number, 
  vatAmount: number,
  totalAmount: number,
  invoiceDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Debit Accounts Receivable (ลูกหนี้การค้า)
    const arEntry = await createJournalEntry({
      entry_date: invoiceDate,
      journal_type: 'sales',
      reference_type: 'invoice',
      reference_id: invoiceId,
      description: `ตั้งลูกหนี้จากใบแจ้งหนี้ #${invoiceNumber}`,
      debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      credit_account_id: COA_ACCOUNTS.SALES_REVENUE,
      amount: netAmount,
      document_number: `INV-${invoiceNumber}`,
      notes: `Customer ID: ${customerId}`
    });
    
    if (!arEntry.success) return arEntry;
    
    // 2. Credit Sales Revenue (รายได้จากการขาย)
    const revenueEntry = await createJournalEntry({
      entry_date: invoiceDate,
      journal_type: 'sales',
      reference_type: 'invoice',
      reference_id: invoiceId,
      description: `รายได้จากใบแจ้งหนี้ #${invoiceNumber}`,
      debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      credit_account_id: COA_ACCOUNTS.SALES_REVENUE,
      amount: netAmount,
      document_number: `INV-${invoiceNumber}`,
      notes: `Customer ID: ${customerId}`
    });
    
    // 3. Handle VAT if applicable
    if (vatAmount > 0) {
      const vatEntry = await createJournalEntry({
        entry_date: invoiceDate,
        journal_type: 'sales',
        reference_type: 'invoice',
        reference_id: invoiceId,
        description: `ภาษีมูลค่าเพิ่มจากใบแจ้งหนี้ #${invoiceNumber}`,
        debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        credit_account_id: COA_ACCOUNTS.VAT_PAYABLE,
        amount: vatAmount,
        vat_rate: 7,
        vat_amount: vatAmount,
        document_number: `INV-${invoiceNumber}`,
        notes: `VAT 7% - Customer ID: ${customerId}`
      });
      
      if (!vatEntry.success) return vatEntry;
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Receipt Journal Entry (Receipt Journal)
export async function createReceiptJournalEntry(
  receiptId: number,
  receiptNumber: string,
  customerId: number,
  amount: number,
  receiptDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Debit Cash/Bank and Credit Accounts Receivable
    const entry = await createJournalEntry({
      entry_date: receiptDate,
      journal_type: 'receipt',
      reference_type: 'receipt',
      reference_id: receiptId,
      description: `รับเงินจากใบเสร็จ #${receiptNumber}`,
      debit_account_id: COA_ACCOUNTS.CASH, // Could be BANK_KTB or BANK_KBANK based on payment method
      credit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      amount: amount,
      document_number: `RCT-${receiptNumber}`,
      notes: `Customer ID: ${customerId} - Payment received`
    });
    
    return entry;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Expense Journal Entry (Purchase Journal)
export async function createExpenseJournalEntry(
  expenseId: number,
  vendorId: number,
  amount: number,
  vatAmount: number,
  category: string,
  expenseDate: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Map expense category to COA account
    const categoryAccountMap: Record<string, number> = {
      'ค่าเช่าสถานที่': COA_ACCOUNTS.RENT,
      'ค่าสาธารณูปโภค': COA_ACCOUNTS.UTILITIES,
      'การตลาดและโฆษณา': COA_ACCOUNTS.ADVERTISING,
      'เงินเดือนและค่าแรง': COA_ACCOUNTS.SALARIES,
      'ค่า License/Software': COA_ACCOUNTS.DEPRECIATION,
      'ค่าขนส่งและเดินทาง': COA_ACCOUNTS.UTILITIES,
      'วัสดุและอุปกรณ์': COA_ACCOUNTS.COGS,
      'ค่าซ่อมบำรุง': COA_ACCOUNTS.DEPRECIATION,
      'ต้นทุนสินค้า (COGS)': COA_ACCOUNTS.COGS,
      'อื่นๆ': COA_ACCOUNTS.DEPRECIATION,
      'ค่าใช้จ่ายเพิ่มค่าน้ำมันกับค่าอาหาร service ลูกค้า': 5998  // Service fees with existing expenses
    };
    
    const expenseAccountId = categoryAccountMap[category] || COA_ACCOUNTS.DEPRECIATION;
    
    // 1. Debit Expense Account
    const expenseEntry = await createJournalEntry({
      entry_date: expenseDate,
      journal_type: 'purchase',
      reference_type: 'expense',
      reference_id: expenseId,
      description: `ค่าใช้จ่าย ${category}`,
      debit_account_id: expenseAccountId,
      credit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
      amount: amount - vatAmount,
      document_number: `EXP-${expenseId}`,
      notes: `Vendor ID: ${vendorId} - Category: ${category}`
    });
    
    if (!expenseEntry.success) return expenseEntry;
    
    // 2. Handle Input VAT if applicable
    if (vatAmount > 0) {
      const vatEntry = await createJournalEntry({
        entry_date: expenseDate,
        journal_type: 'purchase',
        reference_type: 'expense',
        reference_id: expenseId,
        description: `ภาษีซื้อจากค่าใช้จ่าย ${category}`,
        debit_account_id: COA_ACCOUNTS.INPUT_VAT,
        credit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
        amount: vatAmount,
        vat_rate: 7,
        vat_amount: vatAmount,
        document_number: `EXP-${expenseId}`,
        notes: `Input VAT 7% - Vendor ID: ${vendorId}`
      });
      
      if (!vatEntry.success) return vatEntry;
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Journal Entries by Reference
export async function getJournalEntriesByReference(
  referenceType: string, 
  referenceId: number
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { rows } = await query(
      `SELECT je.*, 
       debit_acc.account_name_th as debit_account_name,
       credit_acc.account_name_th as credit_account_name
       FROM journal_entries je
       LEFT JOIN chart_of_accounts debit_acc ON je.debit_account_id = debit_acc.id
       LEFT JOIN chart_of_accounts credit_acc ON je.credit_account_id = credit_acc.id
       WHERE je.reference_type = $1 AND je.reference_id = $2
       ORDER BY je.entry_date, je.created_at`,
      [referenceType, referenceId]
    );
    
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
