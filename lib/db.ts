import { Pool } from 'pg';

// Optimized Pool สำหรับ Vercel Serverless + Neon Database
// - max: จำกัดสูงสุด 3 connections (Serverless ควรน้อย ไม่ต้องเยอะ)
// - idleTimeoutMillis: ปิด connection ที่ว่างเปล่าหลัง 10 วินาที
// - connectionTimeoutMillis: ถ้าเชื่อมไม่ได้ใน 5 วินาที ให้ Error ทันที (ไม่ค้าง)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ยังคงไว้เพื่อความสะดวกใน Serverless/Neon
  },
  max: 3,
  min: 0,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

export const query = async (text: string, params?: any[]) => {
  const res = await pool.query(text, params);
  return res;
};

export default pool;
