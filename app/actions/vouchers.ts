"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createExpenseJournalEntry, createReceiptJournalEntry } from "@/lib/journaling";

export async function createPaymentVoucher(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const res = await client.query(
      `INSERT INTO payment_vouchers (
        voucher_no, payee_name, issue_date, amount, payment_method, 
        status, receipt_url, vat_amount, tax_id, expense_id, vendor_id, wht_amount
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        data.voucher_no, 
        data.payee_name, 
        data.issue_date, 
        data.amount, 
        data.payment_method, 
        data.status, 
        data.receipt_url || null,
        data.vat_amount || 0,
        data.tax_id || null,
        data.expense_id || null,
        data.vendor_id || null,
        data.withholding_amount || 0
      ]
    );
    const voucherId = res.rows[0].id;

    if (data.expense_id) {
      await client.query("UPDATE expenses SET status = 'paid' WHERE id = $1", [data.expense_id]);
    }

    const journalResult = await createExpenseJournalEntry(
      voucherId,
      data.vendor_id || 0, 
      Number(data.amount),
      Number(data.vat_amount || 0),
      data.category || "อื่นๆ",
      data.issue_date,
      Number(data.withholding_amount || 0),
      client
    );

    if (!journalResult.success) {
      throw new Error(`Auto-Journal failed: ${journalResult.error}`);
    }

    await client.query("COMMIT");
    revalidatePath("/vouchers");
    revalidatePath("/expenses");
    revalidatePath("/journals");
    return { success: true, id: voucherId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Voucher Error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function createPayment(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_no VARCHAR(50)`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS invoice_id INTEGER`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2)`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_date DATE`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100)`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS wht_amount DECIMAL(15,2) DEFAULT 0`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS vat_amount DECIMAL(15,2) DEFAULT 0`);
    await client.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_service BOOLEAN DEFAULT FALSE`);
    
    await client.query("BEGIN");
    
    let vatAmount = 0;
    let isService = false;
    
    if (data.invoiceId) {
      const invRes = await client.query("SELECT vat_amount, is_service FROM invoices WHERE id = $1", [data.invoiceId]);
      if (invRes.rows.length > 0) {
        vatAmount = Number(invRes.rows[0].vat_amount || 0);
        isService = invRes.rows[0].is_service === true;
      }
      await client.query("UPDATE invoices SET status = 'paid' WHERE id = $1", [data.invoiceId]);
    }
    
    const res = await client.query(
      `INSERT INTO payments (
        payment_no, invoice_id, amount, payment_date, 
        payment_method, status, notes, vat_amount, wht_amount
      ) 
       VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8) RETURNING id`,
      [
        data.reference, 
        data.invoiceId || null, 
        data.amount, 
        data.date, 
        data.paymentMethod, 
        data.description || null,
        vatAmount,
        Number(data.withholdingAmount || 0)
      ]
    );
    const paymentId = res.rows[0].id;
    
    const journalResult = await createReceiptJournalEntry(
      paymentId,
      data.reference,
      Number(data.contactId),
      Number(data.amount),
      data.date,
      client,
      Number(data.withholdingAmount || 0),
      vatAmount,
      isService
    );

    if (!journalResult.success) {
      throw new Error(`Auto-Journal failed: ${journalResult.error}`);
    }

    await client.query("COMMIT");
    revalidatePath("/payments");
    revalidatePath("/invoices");
    revalidatePath("/journals");
    return { success: true, id: paymentId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Payment Error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function markInvoiceAsPaid(id: number | string) {
  try {
    await query("UPDATE invoices SET status = 'paid' WHERE id = $1", [id]);
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPaymentVouchers() {
  try {
    const { rows } = await query(`SELECT * FROM payment_vouchers ORDER BY issue_date DESC`);
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceItems(id: string | number) {
  try {
    const { rows } = await query(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`, [id]);
    return { success: true, data: rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
