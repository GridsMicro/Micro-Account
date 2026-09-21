# Micro-Account: ระบบบัญชีอัจฉริยะ

ระบบบริหารจัดการบัญชีและภาษีอัตโนมัติสำหรับธุรกิจ Microtronic — รองรับการออกเอกสาร การทำบัญชีรายวัน ภาษีทุกประเภท (VAT / WHT / ภ.ง.ด.) โมดูลเปิดปิดได้ และเชื่อมต่อกับระบบ Google (คลาวด์/รายงานอัตโนมัติ)

---

## ฟีเจอร์หลัก

### ขาย (Sales)
- ใบเสนอราคา (Quotation) พร้อมหน้าพิมพ์/Preview
- ใบแจ้งหนี้ (Invoice) พร้อมหน้าพิมพ์ + AI Auto-Journal (บันทึกเดบิต/เครดิตอัตโนมัติเมื่อออกบิล)
- รอบบิลอัตโนมัติ (Recurring) — สร้างใบแจ้งหนี้จากรอบที่ตั้งไว้
- ใบเสร็จรับเงิน (Receipt) — **พิมพ์ใบเสร็จ/ใบกำกับภาษีแบบเดียว** (RECEIPT / TAX INVOICE) จากทุกจุดเข้ารายการ

### ค่าใช้จ่ายและบัญชี (Operations)
- ค่าใช้จ่าย / ซัพพลายเออร์ พร้อมแนบหลักฐาน (รูป / ลิงก์ Google Drive)
- ค่าแรงพนักงาน (Payroll) พร้อมระบบตรวจสอบความถูกต้อง (มี automated tests)
- ใบสำคัญจ่าย (Voucher) + พิมพ์เอกสารสรุปยอดปลายเดือน
- สมุดรายวัน (Journal) — ระบบจดบัญชีอัตโนมัติ + ทะเบียนภาษี

### ข้อมูลหลัก (Master Data)
- คลังสินค้า (Inventory) พร้อม **QR Code + Barcode** ต่อสินค้า
- ราคากลางบริการ (Services)
- ผังบัญชี (COA)
- ผู้ติดต่อ / คู่ค้า (Contacts)

### รายงานและภาษี (Reports & Tax)
- รายงานภาษีสรุป VAT ซื้อ-ขาย และภาษีหัก ณ ที่จ่าย แบบเรียลไทม์
- **RD-Ready:** เชื่อมต่อ RD API Portal (e-Tax Invoice / Withholding) ผ่าน `lib/rd-api.ts` + เทมเพลตไฟล์ `.txt` ภ.พ.30 / ภ.ง.ด.53 (ดู `docs/PP30.txt`, `docs/PND53.txt`)
- งบกำไรขาดทุน (P&L)

### AI และระบบอัตโนมัติ
- ผู้ช่วย AI ถาม-ตอบด้านบัญชี (`/ai`) + AI Chat ทั่วแอพ
- **AI Auditor** — ตรวจสอบความผิดปกติของข้อมูลและกระเปาะแจ้งเตือน + job รายงานอัตโนมัติ (`npm run ai:audit`)
- **Tax Automator** — เตรียม/ประมวลผลยอดภาษีจากข้อมูลจริง (`npm run tax:update`)

### คลาวด์ & ระบบอัตโนมัติ Google (Google-First)
- ปุ่มสรุปยอดรายเดือนส่งขึ้น **Google Drive**
- **Auto-backup ฐานข้อมูล** ขึ้น Drive ทุกวัน 02:00 (เก็บ 30 วัน) — `scripts/auto-backup.mjs`
- **Sheets Dashboard** ภาพรวมรายเดือน/รายจ่ายแยกหมวด/รายการล่าสุด อัปเดต 02:05 — `scripts/dashboard-sheet.mjs`
- **Calendar เตือนอัตโนมัติ** (จ่ายบิล Google Workspace, ต่ออายุลูกค้า) — `scripts/calendar-reminders.mjs`
- รายการแอพในสิทธิ์ + แผนใช้ประโยชน์: `docs/GWS_APPS_INVENTORY.md`

### การจัดการ (Admin)
- จัดการสมาชิก / บทบาท (RBAC) ตาม `docs/RBAC_STANDARD.md`
- จัดการกลุ่ม / สิทธิ์เข้าถึงรายโมดูล
- เปิด-ปิดโมดูลได้ (ตั้งค่าผ่านหน้า /admin/modules หรือ env `NEXT_PUBLIC_MODULE_*`)
- Database Backup

---

## เริ่มใช้งาน

1. หน้าแรก (Dashboard) — ภาพรวมสุขภาพการเงิน
2. ออกเอกสาร: ใบเสนอราคา → ใบแจ้งหนี้ → รับชำระ (ใบเสร็จ/ใบกำกับภาษี)
3. ปิดงบเดือน: กด "สรุปยอดส่งเข้า Google Drive" (หรือตั้ง cron backup/dashboard)

## ขั้นตอนติดตั้ง

```
npm install
cp .env.example .env.local   # ตั้งค่า DATABASE_URL + Secrets
npm run dev
```

Scripts ที่ใช้ได้: `npm test` (รัน `tests/*.test.mjs`), `npm run lint`, `npm run tax:update`, `npm run ai:audit`, `npm run check:knowledge`, `npm run check:consistency`

cron ภายนอก (ตั้งแล้วบนเครื่องพี่): `scripts/auto-backup.mjs` 02:00 น. + `scripts/dashboard-sheet.mjs` 02:05 น.

---

## เทคนิค

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **UI:** Tailwind CSS 4 + lucide-react
- **ฐานข้อมูล:** PostgreSQL (ผ่าน `@vercel/postgres`; สคริปต์อัตโนมัติใช้ `pg`)
- **เอกสาร PDF:** jspdf / jspdf-autotable / exceljs · **Barcode/QR:** react-barcode / qrcode.react
- **จ็อบเบื้องหลัง:** node-cron (recurring, tax, ai-audit)
- **Integration:** googleapis (Drive / Sheets / Calendar) — อ่าน OAuth จาก `.env.local` ผ่าน `scripts/google-auth.mjs`

---

## เอกสารอ้างอิง

- กฎระบบหลัก: `CORE_RULES.md`, `AUTH_RULES.md`
- มาตรฐานสิทธิ์: `docs/RBAC_STANDARD.md`
- คู่มือใช้งาน: `docs/USER_MANUAL.md`, `docs/COMPLETE_MANUAL.md`
- คู่มือตัวดำเนินงาน: `docs/OPERATION_RUNBOOK.md`
- ความรู้ทางภาษี: `docs/THAI_TAX_GUIDE.md`, `docs/KNOWLEDGE_PACK.md`
- สถาปัตยกรรม: `docs/ARCHITECTURE.md`
- บันทึกการตัดสินใจ: `docs/DECISIONS.md`