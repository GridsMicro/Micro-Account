# แผนการขายซอฟต์แวร์ Micro-Account (บันทึกข้อมูล — ยังไม่ได้ลงมือ)

> บันทึก: 2026-09-21 โดยฌอน ตามคำสั่งพี่ (บันทึกไว้เป็นข้อมูล ยังไม่ทำวันนี้)
> สถานะ: 📌 ข้อมูลเท่านั้น — ยังไม่มีการดำเนินการใดๆ

## ข้อมูลที่พี่แจ้ง

- ตัวโปรแกรมบัญชีที่ใช้อยู่ (Micro-Account) จะนำไป**ขายในอนาคต**
- **ลูกค้าจองแล้ว** (มีผู้ซื้อรออยู่)
- เงื่อนไขการถ่ายโอน: **เอาข้อมูลของเราออก แล้วเปลี่ยนเป็นข้อมูลของลูกค้า**
  - ต้องล้างข้อมูลจริงของบริษัท (invoices, expenses, journals, contacts, tax history)
  - ต้องคงโครงสร้าง/ฟีเจอร์/การตั้งค่ามาตรฐานไว้
  - ต้องใส่ข้อมูลเริ่มต้นของลูกค้า (company info, tax ID, settings)

## สถานะปัจจุบัน (ข้อเท็จจริงจริงจาก codebase 2026-09-21)

- แอป: Next.js 16 App Router / TypeScript 5 / Tailwind 4 / PostgreSQL (Neon) / NextAuth
- หน้าเว็บจริง (routes) ~50 เส้นทาง: dashboard, invoices (+preview/print), quotations, expenses, payments, receipts, vouchers, journals, inventory, payroll, services, recurring, calendar, contacts, reports (profit-loss), reconciliation, tax-reports, settings (+patterns), admin (members/groups/permissions/modules/coa/backup), ai, profile, register/login
- Tax: ภ.พ.30 / ภ.ง.ด.53 / ภ.พ.36 draft + export .txt, e-Filing links, tax automator, RD API skeleton
- Google: Drive file picker + monthly summary sync (OAuth กำลังพัง invalid_client — ต้องแก้ก่อนส่งมอบ)
- RBAC: groups/permissions/modules, audit trail, activity log
- Database tables: ~30+ (invoices, expenses, quotations, payments, contacts, journals, chart_of_accounts, wht_records, licenses, etc.)
- มี data ที่ต้องล้างก่อนขาย: ข้อมูลจริงของไมโครทรอนิกทั้งหมด (invoices INV26-xxx, expenses, contacts, tax settings, secrets ใน DB/.env)

## งานที่ต้องทำเมื่อถึงเวลาขาย (TODO — ยังไม่ลงมือ)

- [ ] ล้างข้อมูลจริงทั้งหมด (invoices/expenses/journals/contacts/reminders/recurring/etc.)
- [ ] ล้างประวัติ Google Drive references + OAuth tokens
- [ ] เปลี่ยน company settings → ข้อมูลลูกค้า (ชื่อ/ที่อยู่/Tax ID/เลข VAT)
- [ ] จัดทำ seed/template ข้อมูลเริ่มต้นมาตรฐานสำหรับลูกค้าใหม่
- [ ] แก้ Google OAuth invalid_client ก่อนส่งมอบ (ถ้าลูกค้าต้องใช้ Drive)
- [ ] ตัดสินใจ scope: ขาย source code / ติดตั้งเป็นของลูกค้า / SaaS ให้เช่า
- [ ] เตรียมคู่มือ + ฝึกอบรม + SLA/การรับประกัน

## การประเมินราคา (ความเห็นของฌอน — อ้างอิงจากฟีเจอร์จริง, ต้องปรึกษาพี่ตัดสินใจ)

> **ข้อชี้แจง:** ราคาตลาดในส่วนล่างเป็นการประมาณการโดยอ้างอิงตลาดซอฟต์แวร์บัญชี SME ไทยในปี 2026 — ผมไม่มีข้อมูลสัญญาจองของพี่ ต้องนำไปปรับกับสิ่งที่ลูกค้าตกลงไว้จริง

ข้อเท็จจริงที่บวกราคาได้:

- ฟีเจอร์ทำเงินหลัก = บัญชี (journal/P&L/reconciliation) + ภาษีไทย (VAT/WHT/e-Filing draft) + ใบกำกับ/ใบเสนอราคา/Inventory/Payroll — ครบวงจร SME ไทย (ไม่ใช่แค่ invoice)
- มี RBAC + audit trail + licenses check — พร้อมขายแบบ multi-user enterprise
- ผลงานใช้งานจริงมา 1 ปี (ตั้งแต่ เม.ย. 2026) ผ่านการตรวจภาษีจริง — มี track record ใช้จริง ไม่ใช่สาธิต

ประเมินแนะนำ (ขึ้นกับโมเดลที่พี่เลือก):

| โมเดลขาย | ช่วงราคาโดยประมาณ (THB) | เหตุผล |
|-----------|----------------------|--------|
| ขายลิขสิทธิ์ถาวร + ติดตั้งให้ลูกค้า (1 บริษัท) | 80,000–150,000 | วงจรบัญชี+ภาษีไทยครบ ติดตั้ง/เทรน/รับประกัน 1 ปี |
| ลิขสิทธิ์ถาวร + ให้ source code (ซื้อขาด) | 200,000–400,000 | รวมสิทธิแก้ไข/เป็นเจ้าของเอง ราคาพิจารณาจากที่พี่คุยกับลูกค้าแล้ว |
| SaaS ให้เช่ารายเดือน (รายบริษัท) | 500–2,500 / เดือน | ตามฟีเจอร์+ผู้ใช้+support |
| ราคาต่อรองต่ำสุดที่ไม่ควรต่ำกว่า (ถ้าติดตั้ง+เทรนให้) | 60,000 | ต่ำกว่านี้ค่าแรงติดตั้ง/ล้างข้อมูล/เทรนไม่คุ้ม |

> ⚠️ ตัวเลขข้างต้นคือ**ความเห็น/การประมาณการ**ของฌอนจากฟีเจอร์จริงของระบบ + ราคาตลาดซอฟต์แวร์บัญชี SME ไทย (ฌอนไม่รู้รายละเอียดสัญญาจองของพี่) — พี่ต้องนำไปเทียบกับข้อตกลงที่คุยกับลูกค้าแล้วก่อนสรุปจริง

## สิ่งที่ยังไม่ได้ตัดสินใจ (ถามพี่ทีหลัง)

- [ ] โมเดล: ขายขาด / ให้เช่า / source code? (ยังไม่ลงมือ)
- [ ] ราคาขายจริงที่หน้าเว็บ (pricing page) — **ทำภายหลัง** (บันทึก 2026-09-21, ยังไม่ลงมือ)
- จะรวมค่าแก้ Google OAuth + ล้างข้อมูล + เทรนในราคาไหม?
- มีค่าใช้จ่าย recurring (hosting, DB, maintenance) ใครจ่าย?