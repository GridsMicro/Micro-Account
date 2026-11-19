import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import {
  buildResetEmail,
  checkResetTable,
  generateResetToken,
  RESET_TOKEN_TTL_MINUTES,
} from "@/lib/passwordReset";

/**
 * POST /api/auth/forgot-password — issue a single-use password reset link.
 *
 * Added 2026-11-19 because the login page's "ลืมรหัสผ่าน?" button had no
 * handler and no reset flow existed anywhere in the codebase.
 *
 * Safety:
 * - Always returns the same success message whether or not the email exists,
 *   so the endpoint cannot be used to enumerate user accounts.
 * - Stores only a SHA-256 hash of the token; the raw token goes to email only.
 * - NO schema changes are made here. The migration SQL must be applied by an
 *   operator first (checked via checkResetTable, which is SELECT-only).
 * - If email delivery fails, the freshly inserted token is deleted so we never
 *   leave a live reset token that nobody received.
 */

const GENERIC_SUCCESS = {
  success: true,
  message: `หากอีเมลนี้มีบัญชีในระบบ ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ภายใน ${RESET_TOKEN_TTL_MINUTES} นาที`,
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "กรุณากรอกอีเมลให้ถูกต้อง" }, { status: 400 });
    }

    // Operator must have applied scripts/migrations/001_password_reset_tokens.sql.
    const schema = await checkResetTable();
    if (!schema.ok) {
      return NextResponse.json({ error: schema.error }, { status: 503 });
    }

    // Never fake success when mail is not configured — surface the real blocker.
    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "ระบบส่งอีเมลยังไม่ได้ตั้งค่า (GMAIL_FROM / GMAIL_APP_PASSWORD)" },
        { status: 503 }
      );
    }

    // Look up the account. Match the login rule: only "Inactive" is blocked.
    const userRes = await query(
      "SELECT id, status FROM users WHERE lower(email) = $1 LIMIT 1",
      [email]
    );
    const user = userRes.rows?.[0];
    if (!user || user.status === "Inactive") {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    // Lightweight abuse guard: at most 3 requests per account per minute.
    const recentRes = await query(
      "SELECT COUNT(*)::int AS count FROM password_reset_tokens WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'",
      [user.id]
    );
    if (Number(recentRes.rows?.[0]?.count || 0) >= 3) {
      return NextResponse.json(
        { error: "ขอคำขอตั้งรหัสผ่านบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
        { status: 429 }
      );
    }

    const { rawToken, tokenHash } = generateResetToken();
    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' minutes')::interval)`,
      [user.id, tokenHash, String(RESET_TOKEN_TTL_MINUTES)]
    );

    // Build the link from the request origin (no extra env var required).
    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const mail = buildResetEmail(resetUrl);

    try {
      await sendMail({ to: email, subject: mail.subject, text: mail.text });
    } catch (mailErr) {
      // Roll back the token we just created — do not leave an undelivered link live.
      console.error("[FORGOT_PASSWORD] Mail delivery failed:", mailErr);
      await query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]).catch(
        (cleanupErr) =>
          console.error("[FORGOT_PASSWORD] Token cleanup failed:", cleanupErr)
      );
      return NextResponse.json(
        { error: "ส่งอีเมลไม่สำเร็จ กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 502 }
      );
    }

    // Deliberately do NOT log the raw token or the reset URL.
    return NextResponse.json(GENERIC_SUCCESS);
  } catch (err) {
    console.error("[FORGOT_PASSWORD] Unexpected error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
