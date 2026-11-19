import { createHash, randomBytes } from "node:crypto";
import { query } from "./db";

/**
 * Password-reset helpers (added 2026-11-19).
 *
 * Design rules:
 * - Raw tokens are shown to the user exactly once (in the email link) and are
 *   NEVER stored or logged. Only a SHA-256 hash is persisted in the database.
 * - Every DB access in this module is READ-ONLY (SELECT). The table itself is
 *   created by an operator running scripts/migrations/001_password_reset_tokens.sql
 *   — this code must not silently mutate a production schema.
 * - Tokens expire in 30 minutes and are single-use (used_at is set on success).
 */

export const RESET_TOKEN_TTL_MINUTES = 30;

/** Quick format check before touching the DB (base64url of 32 bytes = 43 chars). */
export function isValidTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

/** Hash a raw reset token before it is written to / looked up in the database. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** Generate a fresh 256-bit token; return both raw (for email) and hash (for DB). */
export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashToken(rawToken) };
}

/**
 * Verify that the migration has been applied. SELECT only — no CREATE TABLE.
 * Returns a clear operator-facing message when the schema is missing.
 */
export async function checkResetTable(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'password_reset_tokens'
      ) AS exists
    `);
    if (res.rows?.[0]?.exists === true) return { ok: true };
    return {
      ok: false,
      error:
        "ระบบ reset รหัสผ่านยังไม่พร้อม: ไม่พบตาราง password_reset_tokens " +
        "กรุณาให้ผู้ดูแลรัน scripts/migrations/001_password_reset_tokens.sql ก่อน",
    };
  } catch (err) {
    // Do not leak connection details to the browser; log server-side only.
    console.error("[PASSWORD_RESET] Schema check failed:", err);
    return { ok: false, error: "ตรวจสอบโครงสร้างฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่ภายหลัง" };
  }
}

/** Build the Thai-language reset email. The raw token appears only in the link. */
export function buildResetEmail(resetUrl: string): { subject: string; text: string } {
  return {
    subject: "Micro-Account — ลิงก์ตั้งรหัสผ่านใหม่",
    text:
      "สวัสดีครับ,\n\n" +
      "ได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชี Micro-Account ของคุณ\n" +
      `กรุณากดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (หมดอายุใน ${RESET_TOKEN_TTL_MINUTES} นาที):\n` +
      `${resetUrl}\n\n` +
      "หากคุณไม่ได้เป็นคนส่งคำขอนี้ สามารถละเว้นอีเมลฉบับนี้ได้เลย " +
      "รหัสผ่านเดิมของคุณจะไม่เปลี่ยนจนกว่าจะกดลิงก์และยืนยันรหัสผ่านใหม่\n\n" +
      "Microtronic Thailand",
  };
}
