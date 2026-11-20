import { Pool } from 'pg';

// Optimized Pool สำหรับ Vercel Serverless + Neon Database
// - max: จำกัดสูงสุด 3 connections (Serverless ควรน้อย ไม่ต้องเยอะ)
// - idleTimeoutMillis: ปิด connection ที่ว่างเปล่าหลัง 10 วินาที
// - connectionTimeoutMillis: ถ้าเชื่อมไม่ได้ใน 5 วินาที ให้ Error ทันที (ไม่ค้าง)
// Enforce DB URL at module load — fail fast instead of silently falling back
// to localhost, which would mask misconfiguration in production.
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "FATAL: Database connection URL is not configured. Set POSTGRES_URL or DATABASE_URL." +
    " Failing fast to prevent silent connection to the wrong database."
  );
}

const connectionUrl = new URL(databaseUrl);
const sslMode = connectionUrl.searchParams.get("sslmode") || "require";
connectionUrl.searchParams.delete("sslmode");

// TLS policy (P1-01):
// - default (require/verify-ca/verify-full): strict certificate validation
// - explicit ?sslmode=disable: local development without TLS (opt-in only)
const ssl = sslMode === "disable" ? false : { rejectUnauthorized: true };

const pool = new Pool({
  connectionString: connectionUrl.toString(),
  ssl,
  max: 3,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
});

export const query = async (text: string, params?: any[]) => {
  const res = await pool.query(text, params);
  return res;
};

/**
 * รันหลายคำสั่งใน transaction เดียว (เอกสาร + journal ต้องเข้า/ออกด้วยกัน)
 * ใช้ client ตัวเดียว → ROLLBACK อัตโนมัติถ้ามีขั้นตอนใดพลาด
 */
export async function withTransaction<T>(
  fn: (client: {
    query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
  }) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn({ query: (text, params) => client.query(text, params) });
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
