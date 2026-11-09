# AGENTS.md — Micro-Account

Pain point this file kills: every agent/session that works in this repo re-learning who the company is, what the app does, where the truth lives, and which rules are absolute. Read this before any work here.

## 1) บริษัท — ใครคือใคร (ข้อเท็จจริง อ่านจากเอกสารจริง 2026-10-06)

- **บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด** / MICROTRONIC (THAILAND) CO., LTD. (สำนักงานใหญ่)
- **เจ้าของ/หุ้นส่วน:** พี่ฆัง (Grids Jivapong / กฤศ จิวะพงศ์) — ตำแหน่ง Manager Director
- **Tax ID:** 0105561182888 · **Tel:** 02-618-5435 · **เว็บ:** https://microtronic.biz
- **ที่อยู่:** 136/34 ถนนประดิพัทธ์ แขวงพญาไท เขตพญาไท กทม 10400
- **Google Drive `01-ธุรกิจ`:** https://drive.google.com/drive/folders/1UYD09gy2-DgHc9piwTDfAcUcPXBljPEH (ไฟล์บริษัท, 1,382 รายการ — อ่านผ่าน MCP google-drive ได้)

### ธุรกิจจริง (พิสูจน์จาก MICROTRONIC TH.pdf + Drive)

1. **ตัวแทนจำหน่าย Google Workspace ให้ลูกค้า** — ขายจริง 137 lic/เดือน ให้ **บริษัท ดอมนิค (ประเทศไทย) จำกัด** (TAX ID 0105536040757) ราคา 34,487.87 + VAT 7% = 36,902.02/เดือน (ออกใบแจ้งหนี้+ใบกำกับภาษีทุกเดือน)
2. **ขาย/ต่ออายุ license ซอฟต์แวร์** — Adobe (Acrobat Pro, Photoshop, Illustrator), Foxit, MS Office 365 — มี PO กับ **noventiq** (ผู้จัดหา) และใบแจ้งหนี้ Delivery ถึง Dominick/DHRLT
3. งานรับเหมา/ต่อเติมอาคาร + หลักสูตรสอน AI (มีเอกสารจริงใน Drive)

## 2) แอพนี้คืออะไร

- **Micro-Account** = ระบบการเงิน/บัญชีของบริษัทเอง (Next.js App Router + Postgres + Google Sheets/Docs/Drive)
- ฟีเจอร์: ใบแจ้งชำระเงิน · expense recording · **tax reports draft (ภ.พ.30 / ภ.พ.36 / ภ.ง.ด.53)** · admin Google-sync · แดชบอร์ด
- **Backup อัตโนมัติทุกวัน 02:00 น.** (`jobs/scheduleMaintenance.ts`) + ระบบแจ้งเตือนยื่นภาษี

## 3) ความจริงอยู่ที่ไหน (Sources of truth — ห้ามเดา)

| เรื่อง | อยู่ที่ |
|---|---|
| ตัวเลข/อัตรา/ยอดภาษี | **อ่าน PDF ต้นทางก่อนเสมอ** (pdf-tools) + `docs/statements/` + Drive `Microtronic Account` |
| ประวัติยื่นภาษี | `docs/TAX_WORKLOG.md` |
| การตัดสินใจ | `docs/DECISIONS.md` |
| กฎธุรกิจ | `docs/BUSINESS_RULES.md` |
| เหตุการณ์กระทบงาน | `docs/INCIDENT_LOG.md` |
| มาตรฐานงานภาษี | `.opencode/skills/micro-account-tax/` |
| มาตรฐานงานบัญชีบริษัท | `.opencode/skills/micro-account-books/` |
| ข้อมูลนิติบุคคล/ธุรกิจ (นอก repo) | `~/.config/opencode/FAMILY/MICROTRONIC-COMPANY.md` + Drive |

## 4) กฎเหล็ก (ห้ามฝ่าฝืน)

1. **ห้ามเดาตัวเลข/อัตรา** — ต้องมีหลักฐาน PDF/statement จริง (กฎ #1 ของบ้าน)
2. **ห้าม print/commit `.env*`, token, key** — secret เก็บใน `.env.local` เท่านั้น (กฎ #2)
3. **Proof-First** — ยืนยันไฟล์จริงบนดิสก์ก่อนตอบว่า "มี/สร้างแล้ว" (กฎ #4)
4. **ห้ามออกนอกโฟลเดอร์งานนี้** ยกเว้นพี่สั่งชัดเจน (กฎ #0.5)
5. **แก้ DB ที่กระทบรายงาน → ต้องบันทึกลง `docs/TAX_WORKLOG.md` + `DECISIONS.md` เสมอ**
6. **Google-First** — ใช้สิทธิ์ GWS ที่ซื้อแล้ว (Sheets/Drive/Gmail/Calendar) ให้คุ้มก่อนเลือก provider ใหม่ (ดู `docs/GWS_APPS_INVENTORY.md`)

## 5) คำสั่งที่ใช้ประจำ

```bash
pnpm dev            # dev server
pnpm build && pnpm start
pnpm lint           # eslint
npm test            # node --test tests/**/*.test.mjs
npm run tax:update          # tsx jobs/scheduleTaxUpdate.ts
npm run ai:audit            # tsx jobs/scheduleAiAudit.ts
npm run check:knowledge      # node scripts/verify-knowledge-sync.mjs
npm run check:consistency    # node scripts/weekly-consistency-audit.mjs
node scripts/match-google-invoices.mjs        # แมปบิล Google ↔ expenses
node scripts/read-google-invoice.mjs <เลข10>  # โหลด+อ่านใบกำกับจาก Drive
```

- scripts ใช้ `googleapis` + `pg` จาก node_modules และอ่าน `.env.local` — รันจาก root ของโปรเจกต์นี้เสมอ
- อ่าน PDF หลักฐานผ่าน: `/home/neon13/workspace/services/python/pdf-tools/.venv/bin/python` + `pdf_toolkit.extract_text_pdfplumber` (รายละเอียดใน skill)

## 6) วันสำคัญ/รอบงาน

- **ยื่นภาษีภายในวันที่ 15 ทุกเดือน:** ภ.พ.30 (VAT ขาย) · ภ.พ.36 (reverse charge รับบริการต่างประเทศ เช่น Google สิงคโปร์ GST 0%) · ภ.ง.ด.53 (WHT 5% ค่า license/บริการนิติบุคคล)
- ภ.ง.ด.51 (ครึ่งปี) + ภ.ง.ด.50 (CIT) สำหรับกำไรประจำปี
- ปฏิทินยืนยันแล้ว: ยื่นทุก 15 ท่าน — ถ้า 15 ตรงวันหยุด ให้ดูเคสจริง (เคยยื่นช้าโดนค่าปรับ ดู TAX_WORKLOG)

## 7) โครงสร้างโค้ดที่สำคัญ

- `app/actions/tax-reports.ts` — `getPP30Draft` / `getPP36Draft` / `getPNDReportDraft`
- `lib/taxAutomator.ts` — `TAX_FILING_URLS` (ลิงก์ยื่น e-Filing)
- `app/tax-reports/page.tsx` — UI รายงานภาษี
- `app/admin/google-sync/route.ts` + cron — sync ข้อมูล Google ภายนอก
- `lib/googleScriptRunner.ts` — รัน Google Apps Script/Sheets ผ่าน OAuth (credential อ่านจาก DB `company_settings` + `.env.local`)