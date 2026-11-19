# ลืมรหัสผ่าน / Reset Password (เพิ่ม 2026-11-19)

## สาเหตุของปัญหาเดิม

ปุ่ม **"ลืมรหัสผ่าน?"** ใน `app/login/page.tsx` เป็น `<button type="button">` ที่ **ไม่มี `onClick` / handler** และในโปรเจกต์ไม่มี route หรือหน้า reset_password ใด ๆ เลย (ตรวจด้วย grep ใน `app lib components`) — กดแล้วไม่เกิดอะไรขึ้น

## สิ่งที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|------|-------------|
| `app/login/page.tsx` | เปลี่ยนปุ่มเปล่าเป็น `<Link href="/forgot-password">` |
| `app/forgot-password/page.tsx` | หน้ากรอกอีเมลขอลิงก์ |
| `app/reset-password/page.tsx` + `ResetPasswordForm.tsx` | หน้าตั้งรหัสผ่านใหม่ (token มาจาก query string) |
| `app/api/auth/forgot-password/route.ts` | ออก token หมดอายุ 30 นาที ส่งอีเมล |
| `app/api/auth/reset-password/route.ts` | ตรวจ token, เปลี่ยนรหัสผ่านภายใน transaction |
| `lib/passwordReset.ts` | สร้าง/แฮช token, ตรวจ schema (SELECT เท่านั้น) |
| `lib/mailer.ts` | ส่งอีเมลผ่าน Gmail SMTP 465 ด้วย `node:tls` (ไม่เพิ่ม dependency) |
| `proxy.ts` | เพิ่ม `/forgot-password`, `/reset-password` เป็น public paths |
| `scripts/migrations/001_password_reset_tokens.sql` | migration SQL สำหรับผู้ดูแลรันเอง |

## ความปลอดภัย

- เก็บ **SHA-256 hash** ของ token ใน DB — ไม่เก็บ/ไม่ log raw token
- Token ใช้ได้ครั้งเดียว (`used_at`) และหมดอายุใน 30 นาที
- `SELECT ... FOR UPDATE` + transaction ป้องกันการใช้ token ซ้ำพร้อมกัน
- หลังเปลี่ยนรหัสผ่านสำเร็จ จะ revoke token อื่น ๆ ของผู้ใช้นั้นทั้งหมด
- API ตอบข้อความเดียวกันสำหรับอีเมลที่มี/ไม่มีในระบบ (ป้องกัน account enumeration)
- จำกัด 3 คำขอต่ออีเมลต่อนาที
- ถ้าส่งอีเมลไม่สำเร็จ → ลบ token ที่เพิ่งสร้างทิ้งทันที (ไม่ทิ้งลิงก์ที่ไม่มีคนได้รับ)
- ถ้าไม่ตั้งค่า Gmail หรือยังไม่รัน migration → ตอบ 503 พร้อมข้อความจริง (ไม่ปลอม success)

## ⚠️ ก่อนใช้งานจริง (ต้องได้รับอนุมัติจากพี่ฆังก่อนทุกข้อ)

1. **รัน migration** (เปลี่ยนโครงสร้าง DB production):
   ```bash
   psql "$POSTGRES_URL" -f scripts/migrations/001_password_reset_tokens.sql
   ```
2. **ตั้งค่า Gmail** ใน environment ของ Vercel: `GMAIL_FROM`, `GMAIL_APP_PASSWORD` (App Password จาก Gmail ที่เปิด 2-Step แล้ว)

ฌอน **ไม่รัน** migration และ **ไม่ส่งอีเมลจริง** ระหว่างการแก้โค้ดนี้ — ทำแค่โค้ด + เอกสารตามที่ได้รับมอบหมาย

## การทดสอบหลังอนุมัติ

1. เปิด `/login` → กด "ลืมรหัสผ่าน?" → ต้องไป `/forgot-password`
2. กรอกอีเมลที่เป็น `status = 'Active'` → ต้องได้รับอีเมลลิงก์ `/reset-password?token=...`
3. กดลิงก์ → ตั้งรหัสผ่านใหม่ → ต้องเข้าสู่ระบบด้วยรหัสใหม่ได้
4. กดลิงก์เดิมอีกครั้ง → ต้องขึ้น "ลิงก์ไม่ถูกต้อง/หมดอายุ/ถูกใช้งานแล้ว"
