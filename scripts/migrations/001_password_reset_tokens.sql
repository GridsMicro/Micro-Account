-- Migration 001 — Password reset tokens (added 2026-11-19)
--
-- ปรับใช้กับ production เท่านั้นเมื่อพี่ฆังอนุมัติ (ห้ามรันโดยอัตโนมัติจากโค้ด)
-- วิธีรัน (ผู้ดูแลถือ DB credentials):
--   psql "$POSTGRES_URL" -f scripts/migrations/001_password_reset_tokens.sql
--
-- ตรวจสอบหลังรัน:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'password_reset_tokens' ORDER BY ordinal_position;
--
-- หมายเหตุความปลอดภัย: เก็บแค่ SHA-256 hash ของ token (ไม่เก็บ raw token)
-- และใช้ ON DELETE CASCADE เพื่อลบ token ของผู้ใช้ที่ถูกลบออกไปด้วย

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash
  ON password_reset_tokens (token_hash);
