"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { expandJournalRowsForPresentation } from "@/lib/journaling";
import * as ExcelJS from "exceljs";

async function getJournalRowsForPresentation() {
  const { rows } = await query(`
    SELECT
      je.*,
      inv.invoice_number,
      debit_acc.account_name_th AS debit_account_name_th,
      credit_acc.account_name_th AS credit_account_name_th
    FROM journal_entries je
    LEFT JOIN invoices inv ON je.reference_type = 'invoice' AND je.reference_id = inv.id
    LEFT JOIN chart_of_accounts debit_acc ON je.debit_account_id = debit_acc.id
    LEFT JOIN chart_of_accounts credit_acc ON je.credit_account_id = credit_acc.id
    ORDER BY je.entry_date DESC, COALESCE(je.reference_no, inv.invoice_number, je.document_number, '') ASC, je.id ASC
  `);

  return expandJournalRowsForPresentation(rows);
}

function extractAccountCode(accountLabel: string) {
  const value = String(accountLabel || "").trim();
  const bracketMatch = value.match(/^\[(.+?)\]/);
  if (bracketMatch?.[1]) return bracketMatch[1].trim();
  const codeMatch = value.match(/^(\d{3,10})\b/);
  if (codeMatch?.[1]) return codeMatch[1].trim();
  return "";
}

async function resolveChartAccount(accountLabel: string) {
  const accountCode = extractAccountCode(accountLabel);
  const normalized = String(accountLabel || "").replace(/^\[[^\]]+\]\s*/, "").trim();
  const params: any[] = [];
  let where = "";

  if (accountCode) {
    params.push(accountCode);
    where = `WHERE account_code::text = $1 OR legacy_code = $1`;
  } else if (normalized) {
    params.push(normalized);
    where = `
      WHERE COALESCE(account_name_th, '') ILIKE $1
         OR COALESCE(account_name_en, '') ILIKE $1
    `;
    params[0] = `%${normalized}%`;
  } else {
    return null;
  }

  const { rows } = await query(
    `
      SELECT
        id,
        account_code,
        legacy_code,
        COALESCE(account_name_th, account_name_en, account_code::text) AS account_name
      FROM chart_of_accounts
      ${where}
      ORDER BY account_code ASC
      LIMIT 1
    `,
    params
  );

  return rows[0] || null;
}

async function hasJournalAccountMappingColumns() {
  const { rows } = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'journal_entries'
        AND column_name IN ('debit_account_id', 'credit_account_id', 'amount', 'document_number')
    `
  );

  const names = rows.map((row: any) => row.column_name);
  return ["debit_account_id", "credit_account_id", "amount", "document_number"].every((name) =>
    names.includes(name)
  );
}

export async function getJournalEntries() {
  try {
    return { success: true, data: await getJournalRowsForPresentation() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createJournalEntry(data: any) {
  try {
    const account = await resolveChartAccount(data.account_name);
    const supportsMapping = await hasJournalAccountMappingColumns();
    const debit = Number(data.debit || 0);
    const credit = Number(data.credit || 0);
    const amount = debit > 0 ? debit : credit;
    const accountDisplayName = account
      ? `[${account.legacy_code || account.account_code}] ${account.account_name}`
      : data.account_name;

    const res = supportsMapping
      ? await query(
          `INSERT INTO journal_entries (
             entry_date, reference_no, account_name, description, debit, credit, receipt_url, journal_type,
             debit_account_id, credit_account_id, amount, document_number
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
          [
            data.entry_date,
            data.reference_no,
            accountDisplayName,
            data.description,
            debit,
            credit,
            data.receipt_url || null,
            data.journal_type || "general",
            debit > 0 ? account?.id || null : null,
            credit > 0 ? account?.id || null : null,
            amount,
            data.reference_no || null,
          ]
        )
      : await query(
          `INSERT INTO journal_entries (entry_date, reference_no, account_name, description, debit, credit, receipt_url, journal_type) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            data.entry_date,
            data.reference_no,
            accountDisplayName,
            data.description,
            debit,
            credit,
            data.receipt_url || null,
            data.journal_type || "general",
          ]
        );
    revalidatePath("/journals");
    return { success: true, id: res.rows[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateJournalEntry(id: number | string, data: any) {
  try {
    const account = await resolveChartAccount(data.account_name);
    const supportsMapping = await hasJournalAccountMappingColumns();
    const debit = Number(data.debit || 0);
    const credit = Number(data.credit || 0);
    const amount = debit > 0 ? debit : credit;
    const accountDisplayName = account
      ? `[${account.legacy_code || account.account_code}] ${account.account_name}`
      : data.account_name;

    if (supportsMapping) {
      await query(
        `UPDATE journal_entries
         SET entry_date=$1,
             reference_no=$2,
             account_name=$3,
             description=$4,
             debit=$5,
             credit=$6,
             receipt_url=$7,
             debit_account_id=$8,
             credit_account_id=$9,
             amount=$10,
             document_number=$11
         WHERE id=$12`,
        [
          data.entry_date,
          data.reference_no,
          accountDisplayName,
          data.description,
          debit,
          credit,
          data.receipt_url || null,
          debit > 0 ? account?.id || null : null,
          credit > 0 ? account?.id || null : null,
          amount,
          data.reference_no || null,
          id,
        ]
      );
    } else {
      await query(
        `UPDATE journal_entries SET entry_date=$1, reference_no=$2, account_name=$3, description=$4, debit=$5, credit=$6, receipt_url=$7 
         WHERE id=$8`,
        [data.entry_date, data.reference_no, accountDisplayName, data.description, debit, credit, data.receipt_url || null, id]
      );
    }
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteJournalEntry(id: number | string) {
  try {
    await query("DELETE FROM journal_entries WHERE id = $1", [id]);
    revalidatePath("/journals");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function exportJournalsToExcel() {
  try {
    const entries = await getJournalRowsForPresentation();
    if (entries.length === 0) throw new Error("No data to export");
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Journals");
    
    worksheet.columns = [
      { header: "วันที่", key: "date", width: 15 },
      { header: "เอกสาร", key: "reference", width: 20 },
      { header: "ชื่อบัญชี", key: "account", width: 25 },
      { header: "รายการ", key: "description", width: 35 },
      { header: "เดบิต", key: "debit", width: 15 },
      { header: "เครดิต", key: "credit", width: 15 }
    ];
    
    entries.forEach((e: any) => {
      worksheet.addRow({
        date: new Date(e.entry_date).toLocaleDateString('th-TH'),
        reference: e.reference_no || "-",
        account: e.account_name,
        description: e.description,
        debit: Number(e.debit) || 0,
        credit: Number(e.credit) || 0
      });
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    worksheet.getColumn('debit').numFmt = '#,##0.00';
    worksheet.getColumn('credit').numFmt = '#,##0.00';
    
    const buffer = await workbook.xlsx.writeBuffer();
    return { success: true, data: Buffer.from(buffer).toString("base64"), filename: `Journal_${new Date().toISOString().split('T')[0]}.xlsx` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
