---
name: micro-account-tax
description: มาตรฐานงานภาษีและการเงินรายเดือนของ Micro-Account (บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด) — ใช้เมื่อเตรียมยื่นภาษีรายเดือน ภ.พ.30 / ภ.พ.36 / ภ.ง.ด.53, บันทึก/ตรวจสอบค่าใช้จ่าย Google Workspace (ใบกำกับภาษีสิงคโปร์ GST 0%), แมปบิล Google ใน Google Drive (โฟลเดอร์ Microtronic Account รายเดือน) กับ expenses ในระบบ, คำนวณ reverse charge ภาษีซื้อ 7/107, หรือยื่น e-Filing บน efiling.rd.go.th หลังจากกำหนดยื่น (ภายในวันที่ 15) แล้วเช่น ก.ค. 2026 ยื่นช้าโดนค่าปรับ. กฎห้ามเดาตัวเลข — ต้องอ่าน PDF ต้นทาง (pdf-tools) ก่อนบันทึกเสมอ. ใช้สำหรับ project Micro-Account นี้เท่านั้น
version: 0.1.0
license: proprietary
compatibility: opencode
category: Accounting Workflow
metadata:
  audience: accounting-tax-agents
  keywords: ภ.พ.30, ภ.พ.36, ภ.ง.ด.53, VAT, reverse charge, ภาษีซื้อ, Google Workspace, ใบกำกับภาษี, Google Drive, KTC statement, efiling.rd.go.th, tax invoice
---

# micro-account-tax

มาตรฐานเดียวสำหรับงานภาษีประจำเดือนของ Micro-Account — ตั้งแต่จัดหลักฐาน → ตรวจ expenses → คำนวณร่าง (draft) → ยื่น e-Filing → บันทึกงาน (worklog/decisions/business rules) ให้ พี่/ตัวแทน อ่านแล้วไม่สับสน และตัวเลขยื่นต้องตรงหลักฐานจริง (ห้ามเดา)

## When to use this skill

- เตรียม/ยื่นภาษีรายเดือน (ภ.พ.30, ภ.พ.36, ภ.ง.ด.53) — งานประจำรอบ ~20 หรือยื่นช้า
- บันทึก/ตรวจค่าใช้จ่าย Google Workspace (ขาย 137 lic / ใช้เอง 1 seat)
- แมปบิล Google (ไฟล์ใบกำกับภาษาเลข 10 หลัก) ใน Google Drive กับ `expenses.tax_invoice_no`
- เคลียร์คำถาม "ภาษีซื้อควรเป็นเท่าไร" / "VAT ในบิล" / "Tax deductible ไหม" / "เก็บไฟล์ไหนเป็นหลักฐาน"
- ตรวจอัตราแลกเปลี่ยนจริง (TC rate) จาก KTC statement ก่อนลง `exchange_rate`

## When NOT to use it

- งาน admin/UI/frontend ทั่วไปของเว็บ Micro-Account (ไม่เกี่ยวกับภาษี/เอกสารหลักฐาน)
- Python scripting ทั่วไปที่ไม่ได้เกี่ยวข้องกับภาษีของบริษัทนี้

## Phases (ลูปงานภาษีประจำเดือน)

| Phase | Summary | Reference |
|-------|---------|-----------|
| 1 | **จัดหลักฐาน**: อ่าน PDF ต้นทาง (บิล Google / KTC statement) ด้วย pdf-tools ก่อนบันทึกเลขใด ๆ — ห้ามเดา | `references/tax-evidence.md` |
| 2 | **ตรวจ expenses ในระบบ**: คอลัมน์ `vat_amount`, `net_amount`, `tax_deductible`, `pp36_exempt`, `original_currency`, `exchange_rate` กับหลักฐานจริง | `references/tax-evidence.md` |
| 3 | **คำนวณร่าง**: เปิด/เช็ค draft ภ.พ.30 / ภ.พ.36 / ภ.ง.ด.53 จาก `app/actions/tax-reports.ts` | `references/filing.md` |
| 4 | **ยื่น e-Filing** (และค่าใช้จ่าย/หลักฐานเป็นระบบระเบียบ) | `references/filing.md` |
| 5 | **บันทึกสมอ**: อัปเดต `docs/TAX_WORKLOG.md` + `DECISIONS.md` + `BUSINESS_RULES.md` | (ดูด้านล่าง) |

**Scripts (helper):** `scripts/match-google-invoices.mjs` (แมปบิล ↔ expenses + สถานะใน Drive), `scripts/read-google-invoice.mjs` (โหลดใบกำกับ Google จาก Drive แล้ว extract ข้อความ) — รันด้วย `node scripts/<file>.mjs จากโฟลเดอร์โปรเจกต์นี้ (ใช้ googleapis + pg ใน node_modules + อ่าน .env.local)

## Gotchas

- **`expenses` ใช้คอลัมน์ `net_amount`** — ไม่มีคอลัมน์ `net` (มี `withholding_tax_amount`, `wht_rate`, `pp36_exempt` ด้วย)
- **ภาษีซื้อใน ภ.พ.30** คำนวณจาก `expenses.vat_amount` ที่ `tax_deductible = true AND vat_amount > 0` (ดู `getPP30Draft`) — อย่าเดาว่าเป็น `amount × 0.07` ของทุกใบ
- **บิล Google เป็นใบกำกับภาษีสิงคโปร์ (GST 0%) ไม่มีวีแอตไทยแยกในบิล** — ภาษีซื้อแบบ reverse charge = เงินที่จ่ายจริง THB × 7/107 (เช่น 29,017.52 → 1,898.35; 1,000 → 65.42)
- ห้ามตั้ง `vat_amount = 0` + `pp36_exempt = true` ด้วยเหตุผล "VAT รวมอยู่ในบิล" สำหรับ Google — รอบก่อนทำแบบนั้นแล้วเลขยื่นเพี้ยน
- **tax_invoice_no ใน DB = ชื่อไฟล์ใบกำกับใน Drive** (เลข 10 หลัก `.pdf`) — ใช้แมปหลักฐานตรง ๆ
- **Google Drive**: โฟลเดอร์หลัก `Microtronic Account` → รายเดือน (12/2025 … 9 2026) → บางเดือนซ้อน `ส่งให้บัญชี เดือน X`; บิลเดียวกันอาจมีหลาย copy อยู่หลายโฟลเดอร์
- **อัตราแลกเปลี่ยน**: ใช้ TC rate จริงจาก KTC statement (เช่น 34.385 จาก statement 18/08/26) — ห้ามใช้ตัวเลขเดา (เคยใช้ 35.1/35.2 แล้วผิด)
- **Credential**: อ่าน Google OAuth จาก DB `company_settings` (google_client_id/secret/refresh_token/redirect_uri) + `.env.local` — ห้าม print/commit secret
- **ยื่นช้า**: ถ้าผ่านกำหนดไปแล้ว ต้องถามเลขค่าปรับ/เงินเพิ่มกับสรรพากรก่อนยื่น — ห้ามเดาตัวเลขยื่น

## Safety Rules

- ห้ามเดาตัวเลขภาษี/อัตรา — อ่าน PDF ต้นทางเสมอ (กฎ #1 ของบ้าน)
- ห้ามแก้/ลบไฟล์หลักฐานต้นฉบับใน `docs/statements/` หรือใน Drive ที่เป็น evidence
- ห้าม print / commit `.env*` และ token/key — เก็บ secret เฉพาะใน `.env.local`
- การแก้ DB (expenses/rates) ที่กระทบรายงานต้องบันทึกลง `docs/TAX_WORKLOG.md` + `DECISIONS.md` เสมอ

## References

| Topic | Location |
|---|---|
| หลักฐาน/การตรวจ expenses + แมปบิล | `references/tax-evidence.md` |
| การคำนวณ drafts + การยื่น e-Filing | `references/filing.md` |
| แมปบิล Google ↔ expenses (script) | `scripts/match-google-invoices.mjs` |
| โหลด+อ่านใบกำกับ Google จาก Drive (script) | `scripts/read-google-invoice.mjs` |