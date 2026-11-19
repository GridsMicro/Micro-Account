import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { checkResetTable, isValidTokenFormat, hashToken } from "@/lib/passwordReset";

/**
 * POST /api/auth/reset-password — exchange a valid reset token for a new password.
 *
 * Added 2026-11-19 together with the forgot-password flow.
 *
 * Safety:
 * - Token is hashed with SHA-256 before lookup; the raw value is never stored/logged.
 * - The token row is locked with SELECT ... FOR UPDATE inside one transaction so
 *   two concurrent submissions cannot both consume the same link.
 * - All of the user's outstanding reset tokens are revoked after a success.
 * - Single generic error message for invalid/expired/used tokens (no oracle).
 * - No schema changes here; migration must be applied by an operator beforehand.
 */

const INVALID_TOKEN_MESSAGE = "ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้งานไปแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidTokenFormat(token) || password.length < 8) {
    return NextResponse.json(
      { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร และลิงก์ต้องถูกต้อง" },
      { status: 400 }
    );
  }

  const schema = await checkResetTable();
  if (!schema.ok) {
    return NextResponse.json({ error: schema.error }, { status: 503 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the token row for the duration of this transaction.
    const tokenRes = await client.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, u.status
       FROM password_reset_tokens pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1 AND pr.used_at IS NULL
       FOR UPDATE OF pr
       LIMIT 1`,
      [hashToken(token)]
    );
    const record = tokenRes.rows?.[0];

    if (!record || new Date(record.expires_at).getTime() <= Date.now()) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: INVALID_TOKEN_MESSAGE }, { status: 401 });
    }
    // Match the login rule: only "Inactive" accounts are blocked.
    if (record.status === "Inactive") {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "บัญชีนี้ไม่สามารถตั้งรหัสผ่านได้" }, { status: 403 });
    }

    // Hash the new password with the same cost factor used by registration.
    const newPasswordHash = await bcrypt.hash(password, 10);
    await client.query("UPDATE users SET password = $1 WHERE id = $2", [
      newPasswordHash,
      record.user_id,
    ]);

    // Consume this token and revoke any other outstanding tokens for the user.
    await client.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [record.user_id]
    );

    await client.query("COMMIT");
    // Never log the raw token or the new password hash.
    return NextResponse.json({ success: true, message: "ตั้งรหัสผ่านใหม่สำเร็จ" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("[RESET_PASSWORD] Unexpected error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  } finally {
    client.release();
  }
}
