import { query } from "@/lib/db";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  // ดึงข้อมูล member จาก DB - ใช้ user แรกที่มี role admin (placeholder จนกว่าจะมี Auth จริง)
  let member = null;
  try {
    const res = await query(
      `SELECT * FROM members WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`
    );
    member = res.rows[0] || null;
  } catch {
    // table อาจยังไม่มี - ใช้ placeholder
  }

  return <ProfileClient member={member} />;
}
