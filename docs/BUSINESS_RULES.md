# Business Rules (Canonical)

## Business Model

- Operating model: intermediary/agent model
- Supplier invoice recognized as cost
- Customer invoice recognized as revenue

## Accounting Rules

- Double-entry is mandatory for business events
- Canonical journal mapping uses:
  - `debit_account_id`
  - `credit_account_id`
  - `amount`

## Tax Rules (Current Policy)

- VAT policy follows configured company settings
- WHT operational default is 3% for supported service flows
- Any exception policy must be documented here before implementation

## Expense Recording Rule (PDF Evidence First)

- **Before recording any expense, always extract/read the source PDF (invoice/statement) first** using the PDF tool:
  `~/workspace/services/python/pdf-tools` (`pdf_toolkit.py`: `extract_text_pdfplumber`, `extract_text_pypdf`, `pdf_to_images`)
- Extract actual amounts, VAT, currency, exchange rate (e.g. TC rate on KTC statements) from the PDF — never guess numbers
- Record `net_amount` / `vat_amount` / `original_currency` / `original_amount` / `exchange_rate` to match the PDF evidence
- Flag `pp36_exempt = true` **only** when evidence proves the supplier already collected Thai VAT
- **Google Workspace = reverse charge ต้องยื่น ภ.พ.36** — ใบกำกับสิงคโปร์ (GST 0%, "เอกสารนี้ไม่ใช่ใบกำกับภาษีของประเทศไทย") → `pp36_exempt = false`, **ภาษีซื้อ = เงินที่จ่ายจริง THB × 7%** (อ้างอิงแนววินิจฉัย กค 0702/6764 "อัตราร้อยละ 7.0 ของเงินที่จ่าย"; **ไม่ใช่ 7/107** เพราะบิลไม่รวม VAT ไทย — เงินที่จ่ายทั้งหมด = ฐานภาษี; ยืนยันจากแบบ ส.ค.2026 ที่ยื่นแล้วใช้วิธี ×7%, 2026-09-21)
- หลักฐานไฟล์ใบกำกับ Google เก็บใน Drive โฟลเดอร์รายเดือน ชื่อ = `tax_invoice_no.pdf` (เลข 10 หลัก)
- Preserve source PDFs as evidence in `docs/statements/`

## Role and Access Rules

- Canonical roles only: `superadmin`, `admin`, `user`
- Access rights derive from RBAC group assignment

## Data Protection Rules

- No destructive data operations in production
- Historical accounting evidence must be preserved
- Migrations must be additive/backward-compatible

## Change Control

- Update this file when business logic changes
- Link related code changes and decision entries in `docs/DECISIONS.md`

