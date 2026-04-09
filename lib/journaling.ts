// =====================================================
// Micro-Account: Automated Journaling System
// Double-Entry Bookkeeping with Thai Accounting Standards
// =====================================================

import { query } from "@/lib/db";

type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

// Chart of Accounts Mapping (Thai Standards)
export const COA_ACCOUNTS = {
  // 1: Assets (สินทรัพย์)
  CASH: 1111,                  // เงินสด
  BANK_KTB: 1112,              // ธนาคารกรุงไทย
  BANK_KBANK: 1113,            // ธนาคารกสิกรไทย
  ACCOUNTS_RECEIVABLE: 1121,   // ลูกหนี้การค้า
  INVENTORY: 1131,             // สินค้าคงเหลือ
  INPUT_VAT: 1140,             // ภาษีซื้อ (นำไปหักภาษีขายได้)
  WHT_RECEIVABLE: 1142,        // ภาษีเงินได้ถูกหัก ณ ที่จ่าย (ลูกหนี้สรรพากร)
  INPUT_VAT_UNDUE: 1151,       // ภาษีซื้อไม่ถึงกำหนด

  // 2: Liabilities (หนี้สิน)
  ACCOUNTS_PAYABLE: 2111,      // เจ้าหนี้การค้า
  VAT_PAYABLE: 2121,           // ภาษีมูลค่าเพิ่มที่ต้องจ่าย (ภาษีขาย)
  VAT_UNDUE: 2122,             // ภาษีขายไม่ถึงกำหนด (รอรับเงน)
  WHT_PAYABLE: 2130,           // ภาษีหัก ณ ที่จ่ายค้างจ่าย (รอนำส่งสรรพากร)
  WAGES_PAYABLE: 2140,         // เงินเดือนค้างจ่าย

  // 3: Equity (ส่วนของเจ้าของ)
  PAID_UP_CAPITAL: 3110,       // ทุนจดทะเบียนชำระแล้ว
  RETAINED_EARNINGS: 3200,     // กำไรสะสม

  // 4: Revenue (รายได้)
  SALES_REVENUE: 4110,         // รายได้จากการขายสินค้า/บริการ
  SALES_DISCOUNTS: 4120,       // ส่วนลดจ่าย (ส่วนลดให้ลูกค้า)
  INTEREST_INCOME: 4210,       // ดอกเบี้ยรับ

  // 5: Expenses (ค่าใช้จ่าย)
  COGS: 5110,                  // ต้นทุนขาย
  ADVERTISING: 5210,           // ค่าโฆษณา
  SALES_COMMISSION: 5220,      // ค่าคอมมิชชัน
  SALARIES: 5310,              // เงินเดือน
  RENT: 5320,                  // ค่าเช่า
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

export function getEffectiveJournalReference(entry: any) {
  return entry.reference_no || entry.invoice_number || entry.document_number || "UNCATEGORIZED";
}

export function filterShadowInvoiceJournalRows<T extends {
  reference_type?: string | null;
  reference_id?: number | null;
  document_number?: string | null;
  debit_account_id?: number | null;
  credit_account_id?: number | null;
  amount?: number | string | null;
  description?: string | null;
}>(rows: T[]): T[] {
  const receivableKeys = new Set(
    rows
      .filter((entry) =>
        entry.reference_type === "invoice" &&
        String(entry.description || "").includes("ตั้งลูกหนี้จากใบแจ้งหนี้")
      )
      .map((entry) =>
        [
          entry.reference_type || "",
          entry.reference_id || "",
          entry.document_number || "",
          entry.debit_account_id || "",
          entry.credit_account_id || "",
          Number(entry.amount || 0).toFixed(2),
        ].join("|")
      )
  );

  return rows.filter((entry) => {
    if (
      entry.reference_type === "invoice" &&
      String(entry.description || "").includes("รายได้จากใบแจ้งหนี้")
    ) {
      const key = [
        entry.reference_type || "",
        entry.reference_id || "",
        entry.document_number || "",
        entry.debit_account_id || "",
        entry.credit_account_id || "",
        Number(entry.amount || 0).toFixed(2),
      ].join("|");

      return !receivableKeys.has(key);
    }
    return true;
  });
}

function shouldCompactInvoiceVoucher(items: any[]) {
  return (
    items.length > 0 &&
    items.every((item) => {
      const reference = String(getEffectiveJournalReference(item) || "").toUpperCase();
      return item.reference_type === "invoice" || reference.startsWith("INV");
    })
  );
}

function compactInvoiceVoucherItems(items: any[]) {
  if (!shouldCompactInvoiceVoucher(items)) return items;

  const receivableRows = items.filter(
    (item) =>
      Number(item.debit_account_id || 0) === COA_ACCOUNTS.ACCOUNTS_RECEIVABLE ||
      String(item.account_name || "").includes("ลูกหนี้")
  );
  const revenueRows = items.filter(
    (item) =>
      Number(item.credit_account_id || 0) === COA_ACCOUNTS.SALES_REVENUE ||
      String(item.account_name || "").includes("รายได้")
  );
  const vatRows = items.filter(
    (item) =>
      Number(item.credit_account_id || 0) === COA_ACCOUNTS.VAT_PAYABLE ||
      String(item.account_name || "").includes("ภาษี")
  );

  const totalRevenue = revenueRows.reduce((max, item) => Math.max(max, Number(item.credit || 0)), 0);
  const totalVat = vatRows.reduce((max, item) => Math.max(max, Number(item.credit || 0)), 0);
  const totalReceivable = Math.max(
    receivableRows.reduce((max, item) => Math.max(max, Number(item.debit || 0)), 0),
    totalRevenue + totalVat
  );
  const sample = items[0];
  const reference = getEffectiveJournalReference(sample);
  const compactRows: any[] = [];

  if (totalReceivable > 0) {
    compactRows.push({
      ...sample,
      row_key: `${reference}-ar-compact`,
      readonly: true,
      account_name: "ลูกหนี้การค้าทั่วไป",
      description: `ลูกหนี้ #${reference}`,
      debit: totalReceivable,
      credit: 0,
    });
  }

  if (totalRevenue > 0) {
    compactRows.push({
      ...sample,
      row_key: `${reference}-revenue-compact`,
      readonly: true,
      account_name: "รายได้จากการขายสินค้าทั่วไป",
      description: `รายได้จากใบแจ้งหนี้ #${reference}`,
      debit: 0,
      credit: totalRevenue,
    });
  }

  if (totalVat > 0) {
    compactRows.push({
      ...sample,
      row_key: `${reference}-vat-compact`,
      readonly: true,
      account_name: "ภาษีมูลค่าเพิ่มที่ต้องจ่าย",
      description: `ภาษีขาย #${reference}`,
      debit: 0,
      credit: totalVat,
    });
  }

  return compactRows.length > 0 ? compactRows : items;
}

function compactExpandedInvoiceRows(rows: any[]) {
  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const reference = String(getEffectiveJournalReference(row));
    const existing = grouped.get(reference);
    if (existing) existing.push(row);
    else grouped.set(reference, [row]);
  }
  return Array.from(grouped.values()).flatMap((items) => compactInvoiceVoucherItems(items));
}

export function expandJournalRowsForPresentation(rows: any[]) {
  const expandedRows = filterShadowInvoiceJournalRows(rows).flatMap((entry: any) => {
    const reference = getEffectiveJournalReference(entry);
    const legacyDebit = Number(entry.debit || 0);
    const legacyCredit = Number(entry.credit || 0);
    const modernAmount = Number(entry.amount || 0);
    const preferredDebitName = entry.debit_account_name_th || entry.account_name || "-";
    const preferredCreditName = entry.credit_account_name_th || entry.account_name || "-";
    let normalizedDescription = entry.description;

    if (entry.reference_type === "invoice") {
      if (Number(entry.credit_account_id || 0) === COA_ACCOUNTS.VAT_PAYABLE) {
        normalizedDescription = `ภาษีขายจากใบแจ้งหนี้ #${reference}`;
      } else if (
        Number(entry.debit_account_id || 0) === COA_ACCOUNTS.ACCOUNTS_RECEIVABLE &&
        Number(entry.credit_account_id || 0) === COA_ACCOUNTS.SALES_REVENUE
      ) {
        normalizedDescription = `ตั้งลูกหนี้จากใบแจ้งหนี้ #${reference}`;
      } else if (
        Number(entry.debit_account_id || 0) === COA_ACCOUNTS.ACCOUNTS_RECEIVABLE &&
        legacyDebit > 0
      ) {
        normalizedDescription = `ตั้งลูกหนี้จากใบแจ้งหนี้ #${reference}`;
      } else if (Number(entry.credit_account_id || 0) === COA_ACCOUNTS.SALES_REVENUE) {
        normalizedDescription = `รายได้จากใบแจ้งหนี้ #${reference}`;
      }
    }

    if (legacyDebit > 0 || legacyCredit > 0 || modernAmount <= 0) {
      return [
        {
          ...entry,
          reference_no: reference,
          account_name: legacyDebit > 0 ? preferredDebitName : preferredCreditName,
          description: normalizedDescription,
        },
      ];
    }

    return [
      {
        ...entry,
        row_key: `${entry.id}-debit`,
        readonly: true,
        reference_no: reference,
        account_name: preferredDebitName,
        description: normalizedDescription,
        debit: modernAmount,
        credit: 0,
      },
      {
        ...entry,
        row_key: `${entry.id}-credit`,
        readonly: true,
        reference_no: reference,
        account_name: preferredCreditName,
        description: normalizedDescription,
        debit: 0,
        credit: modernAmount,
      },
    ];
  });

  return compactExpandedInvoiceRows(expandedRows);
}

export async function generateDocumentNumber(
  journalType: JournalType,
  date: Date,
  db: Queryable = { query }
): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = journalType.toUpperCase().substring(0, 2);
  
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) as count FROM journal_entries 
       WHERE journal_type = $1 AND fiscal_year = $2 AND fiscal_month = $3`,
      [journalType, year, parseInt(month)]
    );
    
    const nextNumber = (parseInt(rows[0].count) + 1).toString().padStart(3, '0');
    return `${prefix}-${year}-${month}-${nextNumber}`;
  } catch (e) {
    return `${prefix}-${year}-${month}-001`;
  }
}

export async function createJournalEntry(
  entry: JournalEntry,
  db: Queryable = { query }
): Promise<{ success: boolean; error?: string; id?: number }> {
  try {
    const date = new Date(entry.entry_date);
    const fiscal_year = date.getFullYear();
    const fiscal_month = date.getMonth() + 1;
    const document_number = entry.document_number || await generateDocumentNumber(entry.journal_type, date, db);
    
    const { rows } = await db.query(
      `INSERT INTO journal_entries (
        reference_no, entry_date, journal_type, reference_type, reference_id, description,
        debit_account_id, credit_account_id, amount,
        vat_rate, vat_amount, withholding_rate, withholding_amount,
        fiscal_year, fiscal_month, document_number, notes, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
      ) RETURNING id`,
      [
        document_number,
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

export async function createSalesJournalEntry(
  invoiceId: number, 
  invoiceNumber: string, 
  customerId: number,
  netAmount: number, 
  vatAmount: number,
  totalAmount: number,
  invoiceDate: string,
  db: Queryable = { query },
  isService: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const saleEntry = await createJournalEntry({
      entry_date: invoiceDate,
      journal_type: 'sales',
      reference_type: 'invoice',
      reference_id: invoiceId,
      description: `รายได้จากใบแจ้งหนี้ #${invoiceNumber}`,
      debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      credit_account_id: COA_ACCOUNTS.SALES_REVENUE,
      amount: netAmount,
      document_number: invoiceNumber,
      notes: `Customer ID: ${customerId}`
    }, db);
    
    if (!saleEntry.success) return saleEntry;
    
    if (vatAmount > 0) {
      const vatAccountId = isService ? COA_ACCOUNTS.VAT_UNDUE : COA_ACCOUNTS.VAT_PAYABLE;
      await createJournalEntry({
        entry_date: invoiceDate,
        journal_type: 'sales',
        reference_type: 'invoice',
        reference_id: invoiceId,
        description: isService ? `ภาษีขายไม่ถึงกำหนด #${invoiceNumber}` : `ภาษีขาย #${invoiceNumber}`,
        debit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        credit_account_id: vatAccountId,
        amount: vatAmount,
        vat_rate: 7,
        vat_amount: vatAmount,
        document_number: invoiceNumber,
        notes: `VAT 7% - Customer ID: ${customerId}`
      }, db);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createReceiptJournalEntry(
  receiptId: number,
  receiptNumber: string,
  customerId: number,
  amount: number,
  receiptDate: string,
  db: Queryable = { query },
  whtAmount: number = 0,
  vatAmount: number = 0,
  isService: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const cashEntry = await createJournalEntry({
      entry_date: receiptDate,
      journal_type: 'receipt',
      reference_type: 'receipt',
      reference_id: receiptId,
      description: `รับเงินจากใบเสร็จ #${receiptNumber}`,
      debit_account_id: COA_ACCOUNTS.CASH,
      credit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
      amount: amount - whtAmount,
      document_number: receiptNumber
    }, db);
    if (!cashEntry.success) return cashEntry;

    if (whtAmount > 0) {
      await createJournalEntry({
        entry_date: receiptDate,
        journal_type: 'receipt',
        reference_type: 'receipt',
        reference_id: receiptId,
        description: `ภาษีเงินได้ถูกหัก ณ ที่จ่าย #${receiptNumber}`,
        debit_account_id: COA_ACCOUNTS.WHT_RECEIVABLE,
        credit_account_id: COA_ACCOUNTS.ACCOUNTS_RECEIVABLE,
        amount: whtAmount,
        document_number: receiptNumber,
      }, db);
    }

    if (isService && vatAmount > 0) {
      await createJournalEntry({
        entry_date: receiptDate,
        journal_type: 'general',
        reference_type: 'receipt',
        reference_id: receiptId,
        description: `กลับรายการภาษีขายจากใบเสร็จ #${receiptNumber}`,
        debit_account_id: COA_ACCOUNTS.VAT_UNDUE,
        credit_account_id: COA_ACCOUNTS.VAT_PAYABLE,
        amount: vatAmount,
        document_number: receiptNumber,
      }, db);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createExpenseJournalEntry(
  expenseId: number,
  vendorId: number,
  amount: number,
  vatAmount: number,
  category: string,
  expenseDate: string,
  withholdingAmount: number = 0,
  db: Queryable = { query }
): Promise<{ success: boolean; error?: string }> {
  try {
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
      'อื่นๆ': COA_ACCOUNTS.DEPRECIATION
    };
    
    const expenseAccountId = categoryAccountMap[category] || COA_ACCOUNTS.DEPRECIATION;
    
    const expenseEntry = await createJournalEntry({
      entry_date: expenseDate,
      journal_type: 'purchase',
      reference_type: 'expense',
      reference_id: expenseId,
      description: `ค่าใช้จ่าย ${category}`,
      debit_account_id: expenseAccountId,
      credit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
      amount: amount - vatAmount,
      document_number: `EXP-${expenseId}`
    }, db);
    
    if (!expenseEntry.success) return expenseEntry;
    
    if (vatAmount > 0) {
      await createJournalEntry({
        entry_date: expenseDate,
        journal_type: 'purchase',
        reference_type: 'expense',
        reference_id: expenseId,
        description: `ภาษีซื้อจากค่าใช้จ่าย ${category}`,
        debit_account_id: COA_ACCOUNTS.INPUT_VAT,
        credit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
        amount: vatAmount,
        document_number: `EXP-${expenseId}`
      }, db);
    }

    if (withholdingAmount > 0) {
      await createJournalEntry({
        entry_date: expenseDate,
        journal_type: 'purchase',
        reference_type: 'expense',
        reference_id: expenseId,
        description: `ภาษีหัก ณ ที่จ่ายค้างจ่าย (หักจาก ${category})`,
        debit_account_id: COA_ACCOUNTS.ACCOUNTS_PAYABLE,
        credit_account_id: COA_ACCOUNTS.WHT_PAYABLE,
        amount: withholdingAmount,
        document_number: `EXP-${expenseId}`
      }, db);
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
