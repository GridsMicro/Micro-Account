"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateCompanySettings(data: any) {
  try {
    // SECURITY (P1-03): never overwrite stored secrets with empty/whitespace.
    // Client sends "" for secrets it must not re-expose; a blank value means
    // "keep the existing value", not "clear it".
    const keep = (next: any, prev: any) =>
      next === undefined || next === null || String(next).trim() === "" ? prev : String(next);

    const current = await query("SELECT google_client_secret, google_refresh_token FROM company_settings LIMIT 1");
    const prev = current.rows[0] || {};

    const googleClientSecret = keep(data.google_client_secret, prev.google_client_secret);
    const googleRefreshToken = keep(data.google_refresh_token, prev.google_refresh_token);

    await query(
      `UPDATE company_settings SET name=$1, tax_id=$2, phone=$3, email=$4, address=$5, bank_name=$6, 
       bank_account_name=$7, bank_account_number=$8, bank_branch=$9, vat_rate=$10, withholding_tax_rate=$11, 
       is_vat_registered=$12, currency=$13, invoice_prefix=$14, quotation_prefix=$15,
       google_client_id=$16, google_client_secret=$17, google_refresh_token=$18, google_redirect_uri=$19, google_drive_enabled=$20
       WHERE id=(SELECT id FROM company_settings LIMIT 1)`,
      [data.name, data.tax_id, data.phone, data.email, data.address, data.bank_name, data.bank_account_name, data.bank_account_number, data.bank_branch, data.vat_rate, data.withholding_tax_rate, data.is_vat_registered, data.currency, data.invoice_prefix, data.quotation_prefix,
       data.google_client_id, googleClientSecret, googleRefreshToken, data.google_redirect_uri, data.google_drive_enabled]
    );
    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getDocumentPatterns() {
  try {
    const res = await query("SELECT * FROM document_patterns ORDER BY id ASC");
    return { success: true, data: res.rows };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function updateDocumentPattern(id: number, data: any) {
  try {
    await query(
      `UPDATE document_patterns SET prefix=$1, include_year=$2, include_month=$3, separator=$4, digits=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6`,
      [data.prefix, data.include_year, data.include_month, data.separator, data.digits, id]
    );
    revalidatePath("/settings/patterns");
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function getNextReferenceNo(type: string) {
  try {
    const journalType = type.toLowerCase();
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const { rows } = await query(
      `SELECT COUNT(*) as count FROM journal_entries 
       WHERE journal_type = $1 AND fiscal_year = $2 AND fiscal_month = $3`,
      [journalType, year, month]
    );
    
    const prefix = type.toUpperCase().substring(0, 2);
    const nextNum = (parseInt(rows[0].count) + 1).toString().padStart(3, '0');
    const result = `${prefix}-${year}-${String(month).padStart(2, '0')}-${nextNum}`;
    
    return { success: true, data: result };
  } catch (error: any) {
    const fallback = `${type.toUpperCase().substring(0, 2)}-${new Date().getFullYear()}-001`;
    return { success: true, data: fallback };
  }
}

export async function getDashboardAlerts() {
  try {
    const r = await query("SELECT * FROM reminders WHERE due_date >= NOW() AND status='pending' LIMIT 5");
    const i = await query("SELECT * FROM invoices WHERE status != 'paid' LIMIT 5");
    return { success: true, data: { reminders: r.rows, invoices: i.rows } };
  } catch (err: any) { return { success: false, error: err.message }; }
}
