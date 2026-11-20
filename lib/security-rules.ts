// =====================================================
// Micro-Account: pure security rules (no DB / no Next.js import)
// -----------------------------------------------------
// เก็บกฎที่ต้องทดสอบด้วยการเรียกจริง (behavioral tests) โดยไม่ต้องพึ่ง
// module ของ Next.js หรือการเชื่อมต่อฐานข้อมูล
// =====================================================

/** สถานะบัญชีที่อนุญาตให้ใช้งานระบบได้ — อย่างอื่นปฏิเสธหมด (fail-closed) */
export function isActiveStatus(status: unknown): boolean {
  return String(status ?? "").trim().toLowerCase() === "active";
}

/**
 * รายการคอลัมน์ company_settings ที่ปลอดภัยต่อการแสดงผลฝั่ง client
 * ห้ามเพิ่มคอลัมน์ลับ (google_client_secret, google_refresh_token,
 * rd_client_secret, rd_api_key, gmail_app_password ฯลฯ) เด็ดขาด
 */
export const SAFE_COMPANY_COLUMNS = [
  "id",
  "name",
  "company_name",
  "address",
  "tax_id",
  "phone",
  "email",
  "website",
  "logo_url",
  "vat_rate",
  "withholding_tax_rate",
  "is_vat_registered",
  "currency",
  "invoice_prefix",
  "quotation_prefix",
  "receipt_prefix",
  "journal_prefix",
  "invoice_footer",
  "quotation_footer",
  "receipt_footer",
  "bank_name",
  "bank_account_name",
  "bank_account_number",
  "bank_branch",
  "created_at",
  "updated_at",
] as const;

const SAFE_COMPANY_COLUMN_SET = new Set<string>(SAFE_COMPANY_COLUMNS);

/** กรองชื่อคอลัมน์จริงจาก information_schema ด้วย allowlist (unknown = ตัดทิ้ง) */
export function safeCompanySettingColumns(actualColumns: string[]): string[] {
  const unique = new Set(actualColumns.map((c) => String(c)));
  return [...unique].filter((c) => SAFE_COMPANY_COLUMN_SET.has(c));
}

/** กันงวดผิดก่อนคำนวณ/ยื่น (P0) */
export function assertPeriod(month: number, year: number): void {
  if (
    !Number.isInteger(month) || month < 1 || month > 12 ||
    !Number.isInteger(year) || year < 2000 || year > 2200
  ) {
    throw new Error("งวดเดือน/ปีไม่ถูกต้อง (month 1–12, year ค.ศ.)");
  }
}
