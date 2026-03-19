# 🛠️ คู่มือการตั้งค่าระบบ (Admin & Developer Guide)

สำหรับผู้ดูแลระบบหรือทีมพัฒนาที่ต้องการดูแลรักษา **Micro-Account**

---

## 🏗️ 1. โครงสร้างพื้นฐาน (Infrastructure)

- **Frontend:** Next.js 16.1.6 (Turbopack)
- **Styling:** Tailwind CSS 4.0
- **Database:** PostgreSQL (Neon Serverless)
- **Authentication:** NextAuth v5 (Beta)

---

## 🔑 2. การจัดการสิทธิ์การเข้าถึง (Access Control)

เพื่อความปลอดภัย ระบบซ่อนเมนูจัดการผ่านเทคนิค **Edge-compatible Auth Configuration**:

1.  **ไฟล์ `lib/auth.config.ts`:** เก็บโครงสร้างพื้นฐานของ NextAuth (Callbacks, Session Strategy) ที่รองรับการทำงานบน Edge Runtime
2.  **ไฟล์ `lib/auth.ts`:** เก็บส่วนเชื่อมต่อฐานข้อมูลและการทำ Hashing (เช่น `bcryptjs`) ซึ่งใช้ในระบบ Credentials
3.  **ไฟล์ `proxy.ts` (เดิมคือ middleware.ts):** ใช้สำหรับตรวจสอบสิทธิ์ในระดับ Network Boundary (ถ้ายังไม่ล็อกอิน ระบบจะบล็อกการเข้าถึงทุกหน้ายกเว้น `/login` และซ่อน Sidebar อัตโนมัติที่ `app/layout.tsx`)

---

## ⚡ 3. ตัวแปรสภาพแวดล้อม (.env)

ต้องตั้งค่าเหล่านี้ให้ครบถ้วนในเครื่องที่ใช้รันระบบ:

| Key | Description |
| :--- | :--- |
| `DATABASE_URL` | ต่อเชื่อมกับฐานข้อมูล PostgreSQL |
| `AUTH_SECRET` | คีย์สำหรับเข้ารหัส Token (NextAuth) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | สำหรับการดึงไฟล์หรือข้อมูลจาก Google API |

---

## 🚀 4. การรันระบบในเครื่อง (Local Development)

```bash
# ติดตั้ง dependencies
npm install

# รันระบบ (Turbopack Mode)
npm run dev
```

ตรวจสอบ URL: [http://localhost:3000](http://localhost:3000)

---

## 📁 5. โครงสร้างเมนูและหน้าที่เกี่ยวข้อง

- **`/admin/members`:** อัปเดตข้อมูลผู้ใช้งานและรหัสผ่าน
- **`/settings/patterns`:** แก้ไขรูปแบบชื่อไฟล์และหัวกระดาษเอกสาร (QT/INV)
- **`/tax-reports`:** สรุปยอดภาษีตามปฏิทินบัญชีไทย

---
> [!WARNING]
> การแก้ไขใดๆ ในไฟล์ `proxy.ts` หรือ `lib/auth.ts` อาจส่งผลกระทบต่อระบบรักษาความปลอดภัย กรุณาทดสอบใน Local ก่อนเสมอ
