"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createSalesJournalEntry } from "@/lib/journaling";

export async function getCompanySettings() {
  try {
    const { rows } = await query(`SELECT * FROM company_settings LIMIT 1`);
    return { success: true, data: rows[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getNextInvoiceNumber() {
  let prefix = "INV";
  try {
    const sRes = await query(`SELECT invoice_prefix FROM company_settings LIMIT 1`);
    if (sRes.rows.length > 0) prefix = sRes.rows[0].invoice_prefix;
    
    const { rows } = await query(
      `SELECT invoice_number FROM invoices WHERE invoice_number LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );
    if (rows.length === 0) return { success: true, data: `${prefix}001` };
    const lastNum = parseInt(rows[0].invoice_number.replace(prefix, ""), 10);
    return { success: true, data: `${prefix}${String(isNaN(lastNum) ? 1 : lastNum + 1).padStart(3, "0")}` };
  } catch (error: any) {
    return { success: true, data: `${prefix}001` };
  }
}

async function hasModernJournalSchema(client: any) {
  const { rows } = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'journal_entries'
        AND column_name IN ('reference_type', 'reference_id')
    `
  );

  const columnNames = rows.map((row: any) => row.column_name);
  return columnNames.includes("reference_type") && columnNames.includes("reference_id");
}

async function assertModernJournalSchema(client: any) {
  const ready = await hasModernJournalSchema(client);
  if (!ready) {
    throw new Error("Modern journal schema is missing. Run scripts/migrate_journal_entries_neon.sql in Neon SQL Editor before creating new documents.");
  }
}

async function deleteInvoiceJournalEntries(client: any, invoiceId: number | string, invoiceNumber: string) {
  await client.query(
    `DELETE FROM journal_entries
     WHERE (reference_type = 'invoice' AND reference_id = $1)
        OR reference_no = $2
        OR document_number = $2`,
    [invoiceId, invoiceNumber]
  );
}

async function assertStableInvoiceJournal(
  client: any,
  invoiceId: number | string,
  invoiceNumber: string,
  netAmount: number,
  vatAmount: number
) {
  const { rows } = await client.query(
    `SELECT reference_no, document_number, credit_account_id, amount
     FROM journal_entries
     WHERE reference_type = 'invoice' AND reference_id = $1
     ORDER BY id ASC`,
    [invoiceId]
  );

  const revenueRows = rows.filter((row: any) => Number(row.credit_account_id || 0) === 4110);
  const vatRows = rows.filter((row: any) => Number(row.credit_account_id || 0) === 2121);

  const hasStableReference = rows.every(
    (row: any) => row.reference_no === invoiceNumber && row.document_number === invoiceNumber
  );

  if (
    rows.length !== (vatAmount > 0 ? 2 : 1) ||
    revenueRows.length !== 1 ||
    Number(revenueRows[0]?.amount || 0) !== Number(netAmount || 0) ||
    vatRows.length !== (vatAmount > 0 ? 1 : 0) ||
    Number(vatRows[0]?.amount || 0) !== Number(vatAmount || 0) ||
    !hasStableReference
  ) {
    throw new Error(`Invoice journal failed stability check for ${invoiceNumber}`);
  }
}

export async function createInvoice(data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invRes = await client.query(
      `INSERT INTO invoices (invoice_number, contact_id, net_amount, vat_amount, status, due_date, created_at, issue_date, quotation_id) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8) RETURNING id`,
      [
        data.invoice_number,
        data.contact_id,
        data.net_amount,
        data.vat_amount,
        data.status || "sent",
        data.due_date,
        data.date || new Date().toISOString().split("T")[0],
        data.quotation_id || null,
      ]
    );
    const invoiceId = invRes.rows[0].id;

    if (data.quotation_id) {
      await client.query("UPDATE quotations SET status = 'invoiced' WHERE id = $1", [data.quotation_id]);
    }

    for (const item of data.items) {
      const description = item.detail ? `${item.desc} (${item.detail})` : item.desc;
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          invoiceId,
          item.productId === "" || item.productId === "custom" ? null : item.productId,
          description,
          item.qty,
          item.price,
          Number(item.qty) * Number(item.price),
        ]
      );
    }
    const totalAmount = Number(data.net_amount) + Number(data.vat_amount);
    const invoiceDate = data.date || new Date().toISOString().split("T")[0];
    await assertModernJournalSchema(client);

    const journalResult = await createSalesJournalEntry(
      invoiceId,
      data.invoice_number,
      Number(data.contact_id),
      Number(data.net_amount),
      Number(data.vat_amount),
      totalAmount,
      invoiceDate,
      client,
      data.is_service === true 
    );

    if (!journalResult.success) {
      throw new Error(`Journal entry failed: ${journalResult.error}`);
    }
    await assertStableInvoiceJournal(
      client,
      invoiceId,
      data.invoice_number,
      Number(data.net_amount),
      Number(data.vat_amount)
    );
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true, id: invoiceId };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("Invoice Error:", error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function createInvoiceRecord(data: any) { return createInvoice(data); }

export async function updateInvoice(id: string | number, data: any) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE invoices SET status=$1, contact_id=$2, net_amount=$3, vat_amount=$4, due_date=$5, updated_at=NOW()
       WHERE id=$6`,
      [data.status, data.contact_id, data.net_amount, data.vat_amount, data.due_date, id]
    );
    await client.query(`DELETE FROM invoice_items WHERE invoice_id=$1`, [id]);
    for (const item of data.items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, item.product_id || null, item.description, item.quantity, item.unit_price, item.total_price]
      );
    }
    await assertModernJournalSchema(client);
    const invRes = await client.query("SELECT invoice_number FROM invoices WHERE id = $1", [id]);
    const invNum = invRes.rows[0]?.invoice_number;
    if (invNum) {
      await deleteInvoiceJournalEntries(client, id, invNum);
      const journalResult = await createSalesJournalEntry(
        Number(id),
        invNum,
        Number(data.contact_id),
        Number(data.net_amount),
        Number(data.vat_amount),
        Number(data.net_amount) + Number(data.vat_amount),
        data.due_date,
        client
      );
      if (!journalResult.success) {
        throw new Error(`Journal entry failed: ${journalResult.error}`);
      }
      await assertStableInvoiceJournal(
        client,
        id,
        invNum,
        Number(data.net_amount),
        Number(data.vat_amount)
      );
    }
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

export async function deleteInvoice(id: string | number) {
  const pool = (await import("@/lib/db")).default;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query("SELECT invoice_number FROM invoices WHERE id = $1", [id]);
    if (r.rows.length === 0) return { success: false, error: "Not found" };
    await assertModernJournalSchema(client);
    const invNum = r.rows[0].invoice_number;
    await client.query("DELETE FROM invoice_items WHERE invoice_id = $1", [id]);
    if (invNum) await deleteInvoiceJournalEntries(client, id, invNum);
    await client.query("DELETE FROM invoices WHERE id = $1", [id]);
    await client.query("COMMIT");
    revalidatePath("/invoices");
    return { success: true };
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    return { success: false, error: error.message };
  } finally {
    client.release();
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
