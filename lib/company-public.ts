// =====================================================
// Micro-Account: company settings ที่ปลอดภัยต่อฝั่ง client
// -----------------------------------------------------
// ใช้แทน `SELECT * FROM company_settings` ทุกที่ที่ส่งข้อมูลไป browser
// (API / Server Action / page) เพื่อไม่ให้ OAuth / RD / App Password หลุด
// =====================================================

import { query } from "@/lib/db";
import { safeCompanySettingColumns } from "@/lib/security-rules";

/** รูปแบบข้อมูลบริษัทที่ปลอดภัยต่อการแสดงผล (ไม่มี secret) */
export interface PublicCompanySettings {
  id?: number;
  name?: string;
  company_name?: string;
  address?: string;
  tax_id?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  vat_rate?: number | string;
  withholding_tax_rate?: number | string;
  invoice_prefix?: string;
  quotation_prefix?: string;
  [key: string]: unknown;
}

/**
 * อ่านเฉพาะคอลัมน์ที่อยู่ใน allowlist และมีจริงในตาราง
 * ถ้าเพิ่มคอลัมน์ลับใหม่ใน DB → ไม่ถูกเลือกโดยอัตโนมัติ (fail-closed)
 */
export async function getPublicCompanySettings(): Promise<PublicCompanySettings> {
  try {
    const meta = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND table_schema = current_schema()`,
      ["company_settings"]
    );
    const columns = safeCompanySettingColumns(
      (meta.rows || []).map((row: { column_name: string }) => row.column_name)
    );
    if (columns.length === 0) return {};

    const selectList = columns.map((column) => `"${column}"`).join(", ");
    const result = await query(`SELECT ${selectList} FROM company_settings LIMIT 1`);
    return (result.rows[0] as Record<string, unknown>) ?? {};
  } catch {
    // ไม่แสดงข้อมูล company ไม่ทำให้ระบบพัง — แต่ต้องไม่มี secret หลุดแน่
    return {};
  }
}
