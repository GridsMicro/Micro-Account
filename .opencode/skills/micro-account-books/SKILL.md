---
name: micro-account-books
description: มาตรฐานงานบัญชีบริษัทของ Micro-Account (บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด) — ภาพรวมธุรกิจจริง (ตัวแทน Google Workspace 137 lic/เดือน, ขาย license Adobe/Foxit/MS Office 365), การบันทึกบัญชี/ค่าใช้จ่าย, การประเมินรอบยื่นภาษีรายเดือน (ภ.พ.30/36, ภ.ง.ด.53), และแหล่งหลักฐานใน Google Drive. ใช้เมื่อทำงานบัญชีบริษัท, ตรวจ/บันทึก expense หรือรายได้, ตอบคำถามธุรกิจ/คู่ค้า/ลูกค้า, หรือวางแผนขอบเขตก่อนเข้าสู่กระบวนการยื่นภาษี (ลิงก์ต่อจาก skill micro-account-tax). ใช้สำหรับ project Micro-Account นี้เท่านั้น
version: 0.1.0
license: proprietary
compatibility: opencode
category: Accounting Workflow
metadata:
  audience: accounting-tax-agents
  keywords: บัญชี, bookkeeping, Microtronic, ดอมนิค, Dominick, Google Workspace, 137 lic, Adobe, Foxit, MS Office 365, noventiq, VAT, expense, เงินเดือน, คู่ค้า, ลูกค้า
---

# micro-account-books

มาตรฐานงาน**บัญชีบริษัท**ของ Micro-Account — รู้จักธุรกิจ/คู่ค้า/ลูกค้าจริง เข้าใจโครงข่ายรายได้-ค่าใช้จ่าย และบันทึกบัญชีให้ตรงหลักฐานก่อนเข้าสู่กระบวนการยื่นภาษี (ต่อด้วย skill `micro-account-tax`)

## Purpose

- ตอบ "บริษัทขายอะไร / ทำรายได้จากใคร / จ่ายอะไรบ้าง" ได้จากเอกสารจริง (ห้ามเดา)
- บันทึก/ตรวจสอบรายได้-รายจ่ายให้ครบ ถูกคู่ค้า ถูกงวด แล้วป้อนต่อให้รอบภาษี
- รู้ลำดับงานรายเดือน: จัดหลักฐาน → บันทึกบัญชี → ร่างภาษี → ยื่น → บันทึกสมอ

## When to use this skill

- ทำงานบัญชีบริษัททั่วไป ไม่ใช่แค่ขั้นตอนยื่นภาษี
- บันทึก/ตรวจสอบ expense, ใบแจ้งหนี้/ใบกำกับภาษีขาย (Dominick/DHRLT), รายได้ license
- ตอบคำถามว่า "รายได้หลักคืออะไร", "ลูกค้าหรือคู่ค้ารายไหน", "รอบยื่นเดือนนี้ต้องเตรียมอะไร"
- วางแผนป้อนข้อมูลเข้ารอบภาษี (เชื่อมกับ `micro-account-tax`)

## When NOT to use it

- ขั้นตอนการยื่นภาษีจริง / การแมปบิล Google ↔ expenses → ใช้ `micro-account-tax`
- งาน admin/UI/frontend ของเว็บ (ไม่เกี่ยวกับบัญชี/เอกสารหลักฐาน)

## ภาพรวมธุรกิจ (ข้อเท็จจริงจาก MICROTRONIC TH.pdf — อ่าน 2026-10-06)

### ลูกค้า/คู่ค้ารายหลัก (proof จากเอกสารจริง)

| ราย | บทบาท | TAX ID | หมายเหตุ |
|---|---|---|---|
| **บริษัท ดอมนิค (ประเทศไทย) จำกัด** (สำนักงานใหญ่) | ลูกค้าหลัก | 0105536040757 | Google Workspace **137 lic/เดือน** 34,487.87 + VAT 7% = 36,902.02; รับ Adobe/Foxit renewal ด้วย |
| **บริษัท ดอมนิค ฮันเตอร์-อาร์แอล (ประเทศไทย) จำกัด** | ลูกค้า | 0105536040757 | ใบเสนอราคา/ส่งมอบถึง DHRLT |
| **noventiq** (Treechada Pawong) | ผู้จัดหา license | — | มี PO (00025/00026) ซื้อ Adobe renewal |
| บริษัท 89 โฮม บิลเดอร์ จำกัด | ลูกค้า (รับเหมา) | 0105545033741 | จาก contact list |
| บริษัท เมเดน อิเล็กทริก (ประเทศไทย) จำกัด | ลูกค้า | — | จาก contact list |
| บริษัท เอสซีไอ อีเลคตริค จำกัด (มหาชน) | ลูกค้า | — | จาก contact list |

- **ผู้ประสานงานบริษัท (ฝั่งเรา):** Grids Jivapong (Manager Director) · Grids@microtronic.biz · 065-541-9166

### รายได้ที่บันทึกจริงในเอกสาร

- **Google Workspace (recurring รายเดือน):** ซื้อต้นทุนประมาณ 703.57 USD/137 lic (~22,806.64 THB ตามใบสำคัญจ่าย 2/2026) + 1 seat ใช้เอง 1,070 THB/เดือน → ขายต่อ Dominick 34,487.87 + VAT → **Markup ครอบคลุมค่าดำเนินการ** (อัตราจริงดู DECISIONS)
- **Software license (event):** Adobe Acrobat Pro / Photoshop / Illustrator renewal, Foxit Editor, MS Office 365 — มีทั้งขายขาด (perpetual) และเช่า
- งานรับเหมา/หลักสูตร AI — มีเอกสารจริงใน Drive

### ตัวอย่างรายจ่ายรายเดือน (จากใบสำคัญจ่าย 2/2026 ต้นฉบับ)

ไปรษณีย์ 37 · บิ๊กซี 188 · เซ็นทรัลฟู้ด 606 · ปตท. 780 · ร้านอาหาร 4,600.73 · กังสดาล 1,575 · โฮมโปร 183.33+369.55 · รีโน 199 · บิ๊กซี 430 · ซีพีเอ็กซ์ตร้า 429 · **เงินเดือน 25,000** · Google 137 lic 22,806.64 · Google 1 seat 1,070 → **รวม 58,274.25/เดือน**

## แหล่งหลักฐาน (ไม่ต้องเดา ไปอ่านที่นี่)

- **Drive `01-ธุรกิจ`** (1UYD09gy2-DgHc9piwTDfAcUcPXBljPEH) → โฟลเดอร์ `Microtronic Account` (1BLJ8lUwkV2XHGJWxR6UJnAUEaNDGqIA6) → รายเดือน (12/2025…10 2026) เก็บใบกำกับ Google + ภ.พ.36 ที่ยื่นแล้ว
- **`MICROTRONIC TH.pdf`** (id 1EONEizBPPgoQBgaBTXmsifURuE3iS35w) — ตัวอย่างใบแจ้งหนี้/ใบกำกับ/ใบเสนอราคา/PO/ใบสำคัญจ่าย/เงินเดือน
- **`docs/statements/`** — KTC statement (อัตราแลกเปลี่ยนจริง) + eslip ภ.พ.
- **`docs/`** — TAX_WORKLOG · DECISIONS · BUSINESS_RULES · INCIDENT_LOG (สมอ)

## ลำดับงานรายเดือน (เชื่อมต่อรอบภาษี)

1. รวบรวมหลักฐาน (บิล Google จาก Drive / KTC statement / ใบสำคัญจ่าย) → อ่าน PDF ด้วย pdf-tools ก่อนลงเลข
2. บันทึก/ตรวจสอบ expenses ในระบบ (`amount/vat_amount/net_amount/tax_deductible/pp36_exempt/original_currency/exchange_rate`) — รายละเอียดคอลัมน์ใน tax-evidence ของ skill `micro-account-tax`
3. ตรวจรายได้ประจำเดือน (ใบแจ้งหนี้ Dominick 137 lic) ว่าตรงงวด
4. เปิด draft ภาษี → ตรวจว่าเลขรายได้/ค่าใช้จ่ายสะท้อนงานบัญชีครบ
5. ยื่น e-Filing (ภายใน 15) → บันทึก `docs/TAX_WORKLOG.md` + `DECISIONS.md`

> ทำงานกับระบบ: scripts อ่าน `.env.local` (secret) ใช้ `googleapis` + `pg` — ห้าม print/commit secret; ห้ามลบไฟล์หลักฐานต้นฉบับ

## References

| Topic | Location |
|---|---|
| ภาพรวมธุรกิจ/คู่ค้า (นี้) | `SKILL.md` |
| ขั้นตอนยื่นภาษี + คอลัมน์ expenses | `.opencode/skills/micro-account-tax/SKILL.md` + `references/` |
| ข้อมูลนิติบุคคลเต็ม (นอก repo) | `~/.config/opencode/FAMILY/MICROTRONIC-COMPANY.md` |
| แหล่งหลักฐานใน Drive | ไกด์ใน `docs/GWS_APPS_INVENTORY.md` + Drive `01-ธุรกิจ` |