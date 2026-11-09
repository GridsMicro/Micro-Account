# tax-evidence — หลักฐาน + การตรวจ expenses

## PDF Evidence First (กฎถาวร — DECISIONS 2026-09-21, BUSINESS_RULES.md)

- ก่อนบันทึกค่าใช้จ่าย/อัตราใด ๆ ต้อง**อ่าน PDF ต้นทางก่อนเสมอ** ผ่าน:
  `/home/neon13/workspace/services/python/pdf-tools/.venv/bin/python`
  ```python
  import sys; sys.path.insert(0, "/home/neon13/workspace/services/python/pdf-tools")
  from pdf_toolkit import extract_text_pdfplumber
  print(extract_text_pdfplumber("<ไฟล์.pdf>"))
  ```
- เคยพลาด: #21/#22 Google บันทึก rate 35.1/35.2 (เดา) → แก้เป็น 34.385 ตาม KTC statement 18/08/26
- เก็บใบแจ้งยอดไว้อ้างอิงที่ `docs/statements/` (เช่น `202608_statement_4954_1788412197997.pdf`)

## บิล Google Workspace: ข้อเท็จจริงจากบิลจริง

- บิลออกโดย **Google Asia Pacific Pte. Ltd.** (สิงคโปร์) — เป็นใบกำกับภาษีสิงคโปร์ **GST 0%** ระบุชัดว่า "เอกสารนี้ไม่ใช่ใบกำกับภาษีของประเทศไทย"
- เรียกเก็บจริง: 137 lic = **USD** (เช่น 843.92 ≈ 29,017.52 THB @ 34.385) / 1 seat ใช้เอง = **THB 1,000**
- วิธีคำนวณภาษีตามหลัก reverse charge: `ภาษีซื้อ = เงินจ่ายจริง THB × 7/107`
  - 29,017.52 → 1,898.35 (net 27,119.17) · 1,000 → 65.42 (net 934.58)
- ราคาขาย Dominick = ต้นทุน × 1.25 × rate วันออกบิล (ตั้งแต่ ต.ค. 2026) — DECISIONS 2026-09-21

## คอลัมน์ expenses ที่ต้องตรวจ

```sql
SELECT id, expense_date, vendor, tax_invoice_no, amount, vat_amount, net_amount,
       tax_deductible, pp36_exempt, original_currency, original_amount, exchange_rate,
       notes
FROM expenses
WHERE expense_date >= '<YYYY-MM-01>' AND expense_date < '<YYYY-MM+1-01>'
ORDER BY expense_date;
```

กฎการอัปเดต:
- `net_amount` / `vat_amount`: ใช้ตัวเลขจาก PDF จริง (net = รายได้/รีดอย่างถูกต้องตาม evidence) — ใช้อัตรา `amount = net + vat` สำหรับ reverse charge
- `tax_deductible = true` เมื่อหัก VAT ซื้อได้ (Google ทุกใบที่จ่ายจริง)
- `pp36_exempt = false` สำหรับ Google (ต้องยื่น ภ.พ.36) — **ยกเว้น**กรณีผู้ขายเก็บ VAT ไทยเองจริง ๆ ที่พิสูจน์ได้
- `exchange_rate`, `original_currency`, `original_amount`: ตาม KTC/บิลจริง

## แมปบิล Google ↔ expenses (script พร้อมใช้)

```bash
node scripts/match-google-invoices.mjs
```
- ดึงทุก expense ที่ vendor/notes = Google · แสดง tax_invoice_no กับสถานะไฟล์ใน Drive (พบ/ไม่พบ/ซ้ำกี่ copy ในโฟลเดอร์ไหน)

## โหลด+อ่านใบกำกับ Google จาก Drive (script พร้อมใช้)

```bash
node scripts/read-google-invoice.mjs 5644251086
```
- ตามหาไฟล์ `5644251086.pdf` ใน Drive (โดยชื่อ) โหลด ไปที่ `/tmp/google_bill_5644251086.pdf` แล้ว extract ข้อความ (pdfplumber) ออกมาให้เห็นหมายเลขบิล/ยอด/GST

## โฟลเดอร์ Google Drive (สถานที่เก็บหลักฐาน)

- Root: `Microtronic Account` (1BLJ8lUwkV2XHGJWxR6UJnAUEaNDGqIA6)
- รายเดือน: `12/2025`, `1/2026`, `2/2026`, `3/2026`, `4 2026`, `5 2026`, `6/2026`, `7 2026`, `8 2026`, `9 2026`
- บางเดือนซ้อนโฟลเดอร์ `ส่งให้บัญชี เดือน X` / `ส่งให้ บช เดือน X`
- ใบกำกับ Google เลข 10 หลัก (เช่น `5644251086.pdf`) อยู่ตามเดือนนั้น (อาจมี copy หลายที่) + มีชุด `9 2026` ที่ใช้ทำงานรอบ ก.ย. 2026
- ภ.พ.36 ที่ยื่นแล้วทุกเดือน: ชื่อ `ภพ.36 ด.<เดือน>-67/68 Google.pdf` อยู่ใน Drive ด้วย