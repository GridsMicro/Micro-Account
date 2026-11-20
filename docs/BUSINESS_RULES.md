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

## Tax Notification Rules (2026-11-20)

- ใช้ **LINE Messaging API** (`POST https://api.line.me/v2/bot/message/push`) — LINE Notify ยุติบริการ 31 มี.ค. 2025
- มาตรฐานเดียว: ปลายทาง = `LINE_CHANNEL_ID` · token = `LINE_CHANNEL_ACCESS_TOKEN` (ไม่มีชื่อสำรอง ห้าม hardcode/commit)
- งวดภาษี = **เดือนก่อนหน้า** (เดือนภาษีเป็นเดือนปฏิทิน ตาม ม.77/1(23))
- วันครบกำหนดในข้อความ = **23 ของเดือนถัดไปสำหรับ e-Filing** (กระดาษ = 15) — อ้างอิง `rd.go.th/31094.html`
- ยอดภาษีขาย/ซื้ออ่านแบบ **READ-ONLY (SELECT)** — cron ห้าม UPDATE/DELETE production DB
- ตัวเลือก VAT ต้องเลือกได้ **ต่อบิล** (มี / ไม่มี / เก็บเอง) ห้ามตัดสินตามชื่อ Google/Microsoft
- บิลขายต้องเลือกได้ต่อบิลว่าลูกค้าหัก 3% แล้วหรือยัง + เก็บเลขใบ 50 ทวิ (ลูกค้าเป็นผู้นำส่ง ภ.ง.ด.53 — เราไม่ส่ง 53 รายเดือน)
- ทางสำรอง = **Discord webhook** (`DISCORD_WEBHOOK_URL`): ใช้เมื่อ LINE ส่งไม่สำเร็จเท่านั้น (ห้าม log/webhook URL ลงโค้ดหรือ console)
- **ไม่ส่งข้อความจริงจนกว่าพี่ฆังจะสั่ง** — ใช้ `pnpm tax:notify:dry` เพื่อดูข้อความก่อน (dry-run ไม่ยิง LINE/Discord)

## Vercel Cron Constraints (ตรวจจาก docs ทางการ 2026-11-20)

- Hobby: cron ได้ **วันละครั้ง** เท่านั้น · expression ถี่กว่านั้นทำให้ deploy fail · ความแม่นยำ **±59 นาที** (UTC)
- ใช้ **cron เดียว** (`0 2 * * *` UTC ≈ 09:00–09:59 Thailand) เรียก `GET /api/cron/tax-line` แล้วให้โค้ดเช็ก `TAX_LINE_REMINDER_DAYS` เอง → ไม่ผิดกฎวันละครั้ง
- route ต้องมี `CRON_SECRET` ใน Authorization header (fail-closed ถ้าไม่ตั้ง) และต้องตั้ง `TAX_LINE_CRON_ENABLED=true` ใน Vercel Dashboard ถึงจะส่งจริง — **ห้ามเปลี่ยนให้เปิดเอง** (กฎห้ามส่งจนกว่าพี่ฆังสั่ง)
- `TAX_LINE_REMINDER_DAYS` ไม่ต้องตั้งบน Vercel — ค่าเริ่มต้นในโค้ดคือ `1,10,14,20,22` (ตัด 15 ที่ตรงกำหนดกระดาษ เพราะยื่น e-Filing ได้ถึง 23)
- cron รันเฉพาะ production; ทดสอบเรียก endpoint ได้ตรง ๆ ด้วย `?dry=1` / `?force=1` ไม่ต้องรอรอบ
- Vercel **ไม่ retry** และอาจ invoke ซ้ำ → ต้องเขียนให้ทนต่อ duplicate (ห้ามใช้ in-process node-cron บน serverless เพราะจะซ้ำกับ Vercel cron)
- `instrumentation.ts` ต้อง guard โค้ดที่ใช้ Node API (`node-cron`, `child_process`) ด้วย `process.env.NEXT_RUNTIME === "nodejs"` — มิเช่นนั้น Next.js bundle เข้า Edge runtime แล้วเตือน `process.cwd is not supported in the Edge Runtime` (ตรวจแล้ว guard แล้ว warning หาย)

## Expense Recording Rule (PDF Evidence First)

- **Before recording any expense, always extract/read the source PDF (invoice/statement) first** using the PDF tool:
  `~/workspace/services/python/pdf-tools` (`pdf_toolkit.py`: `extract_text_pdfplumber`, `extract_text_pypdf`, `pdf_to_images`)
- Extract actual amounts, VAT, currency, exchange rate (e.g. TC rate on KTC statements) from the PDF — never guess numbers
- Record `net_amount` / `vat_amount` / `original_currency` / `original_amount` / `exchange_rate` to match the PDF evidence
- Flag `pp36_exempt = true` **only** when evidence proves the supplier already collected Thai VAT
- **Google Workspace (ใบกำกับสิงคโปร์ GST 0%)** — ไม่ได้เรียกเก็บ VAT → **ไม่มีภาษีซื้อ / ไม่นำส่ง ภ.พ.36** → `pp36_exempt = true`, `vat_amount = 0` (ตามที่พี่ฆังยืนยัน 2026-11-20; แก้จาก policy เดิมที่บังคับ reverse charge ×7%)
- **Supplier ที่เรียกเก็บ VAT จริง (เช่น Microsoft)** — นับภาษีซื้อได้เฉพาะบิลนั้นถูกเรียกเก็บ VAT จริง + มีเลขที่/วันที่ใบกำกับครบ → `tax_deductible = true` (ห้ามตัดสินจากชื่อ supplier)
- หลักฐานไฟล์ใบกำกับ Google เก็บใน Drive โฟลเดอร์รายเดือน ชื่อ = `tax_invoice_no.pdf` (เลข 10 หลัก)
- Preserve source PDFs as evidence in `docs/statements/`

## Role and Access Rules

- Canonical roles only: `superadmin`, `admin`, `user`
- Access rights derive from RBAC group assignment
- **Server-side boundary is mandatory (2026-11-20):** every mutating Server Action / API route must call a guard from `lib/server-auth.ts` (`requireActiveUser` / `requirePermission` / `requireAdmin`). Hiding a button in the UI is never sufficient authorization.
- `requireActiveUser()` reads `users.status` and `users.role` from the DB on every request and denies `Pending` / `Inactive` / missing accounts (fail-closed, never trusts the JWT alone). JWT carries `status: "Active"` only as defense-in-depth.
- Login returns one generic error for every failure (unknown user, wrong password, non-Active status) and never logs email, password-match result, or raw error details.
- Admin checks use `canAccessAdmin()` from `lib/core-standards.ts`, so `superadmin` is accepted everywhere `admin` is.

## Financial Write Integrity (2026-11-20)

- An expense and all of its journal entries must be written in one DB transaction (`lib/db.ts` → `withTransaction`). A failed journal entry rolls back the expense (no orphan documents).
- Expense rows use the real column `title`; vendor name is resolved by joining `contacts`, never stored in a non-existent `vendor` column.
- Every `createJournalEntry()` call must be checked for `success`; silently ignoring a failed secondary entry is prohibited.

## Tax Reporting Integrity (2026-11-20)

- Preflight counters for ภ.พ.30 (undeducted VAT, incomplete tax documents) must propagate query errors. A failed query must fail closed; it must never return `0` and be read as "no problems".
- `submitPP30ToRDPortal` validates the period (month 1–12, year ค.ศ.) and refuses to file when preflight data could not be verified.

## Data Protection Rules

- No destructive data operations in production
- Historical accounting evidence must be preserved
- Migrations must be additive/backward-compatible

## Change Control

- Update this file when business logic changes
- Link related code changes and decision entries in `docs/DECISIONS.md`

