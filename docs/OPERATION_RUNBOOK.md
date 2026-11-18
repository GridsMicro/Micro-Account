# Operation Runbook

## Pre-Change Checklist

- Confirm latest backup exists
- Read `CORE_RULES.md` and `docs/RBAC_STANDARD.md`
- Confirm change is non-destructive
- Confirm rollback path

## Safe Deployment Sequence

1. Apply additive migration (if needed)
2. Deploy code
3. Verify critical routes
4. Verify journal write/read behavior
5. Verify RBAC access boundaries

## Critical Verification

- Login works for `superadmin`, `admin`, `user`
- Admin pages blocked for non-admin users
- Invoice/expense creation still posts journals correctly
- Dashboard reads expected values
- Governance checks pass:
  - `npm run check:knowledge`
  - `npm run check:consistency`
  - `npm test`

## RD Open API — ยื่นแบบ / ซิงค์สถานะ (2026-11-18)

> ระบบที่ใช้งานจริง: ห้ามทดสอบยื่น/ยกเลิกกับข้อมูล production โดยไม่ได้รับการยืนยันจากเจ้าของระบบ

### สิ่งที่ต้องมีก่อนเริ่ม

1. สมัครใช้งาน RD Open API ผ่าน e-Filing → ยื่น **ภ.อ.01.2** และทำข้อตกลงการใช้บริการ
2. มี **ใบรับรอง NRCA** ตามเงื่อนไขของกรมสรรพากร
3. ตั้งค่าใน environment (ดู `.env.example`): `RD_EFILING_USERNAME`, `RD_EFILING_PASSWORD`, `RD_EFILING_SENDER_ID`, `RD_EFILING_ROLE`, (ไม่บังคับ) `RD_EFILING_BASE_URL`, `RD_EFILING_PP30_VERSION`
4. ดาวน์โหลด "การสร้างข้อมูลแบบแสดงรายการภาษีสำหรับนำส่งผ่านอินเทอร์เน็ตทาง API" จาก https://efiling.rd.go.th/rd-cms/api มาเทียบ `formData` ใน `lib/rd-api.ts` — โดยเฉพาะ `formAttach` และ version ของแบบปรับปรุง (มีผลตั้งแต่ 1 มี.ค. 2569)

### Endpoint ที่ใช้งาน (อ้างอิง spec ทางการ)

| วัตถุประสงค์ | Endpoint | หมายเหตุ |
| --- | --- | --- |
| ยืนยันตัวตน | `POST /oapi/submit-filing-auth` | body `{eFiling:{username,password,nonce}}`, nonce = `YYYY-MM-DD HH:MM:SS` |
| ยื่นแบบ ภ.พ.30 | `POST /oapi/submit-form` | `formType=PP30`, `version=1.0.0`, `role=1|2`, `requestId` ต้องไม่ซ้ำ |
| สอบถามสถานะ | `POST /oapi/result-form` | ใช้ `refNo` หรือ `apiRefNo`; `formStatusId` 1–8 |
| ขอภาพแบบ/ใบเสร็จ | `POST /oapi/receipt-form` | `requestType` 1=ภาพแบบ 2=ใบแนบ 3=ใบเสร็จ |
| ขอใบ Pay-In | `POST /oapi/payin-form` | `requestType` 1=สร้าง 2=ยกเลิก 3=ขอซ้ำ |
| ยกเลิกแบบ | `POST /oapi/cancel-form` | อันตราย — ต้องส่ง confirmText = `ยกเลิกแบบ` |

Response code: `I01000` = สำเร็จ, `P01001` = กำลังประมวลผล (ยังไม่มี refNo → ต้องใช้ apiRefNo สอบถามซ้ำ), `E01xxx` = error

### ขั้นตอนซิงค์สถานะ (ปลอดภัย — ไม่ยื่นใหม่)

1. ไปหน้า `/tax-reports` → กล่อง "ซิงค์สถานะจากสรรพากร"
2. กรอกเลขอ้างอิงการยื่นแบบที่ได้จาก e-Filing (เช่น `P300041469858`) → กด **ซิงค์**
3. ระบบเรียก `/oapi/result-form` แล้ว upsert ลงตาราง `tax_filing_submissions` (CREATE IF NOT EXISTS — ไม่แตะ expenses/invoices)
4. ตรวจตาราง "สถานะการยื่นล่าสุดจากสรรพากร" ด้านบนหน้าเดียวกัน

### ขั้นตอนยื่น ภ.พ.30 (ต้องได้รับอนุมัติก่อนทุกครั้ง)

1. แก้ข้อมูลภาษีซื้อให้ครบที่หน้า `/expenses` ก่อน — ระบบจะปฏิเสธการยื่นถ้ายังมีรายการที่ไม่ครบ/ไม่ได้ยืนยันสิทธิหัก
2. กด **ยื่น ภ.พ.30 (RD Open API)** → พิมพ์ `ยื่น ภ.พ.30` ลงกล่องยืนยัน → กด "ยืนยันและส่ง"
3. ถ้าได้ `P01001` ให้บันทึก `apiRefNo` แล้วกด "ซิงค์" ด้วย apiRefNo นั้นซ้ำจนกว่าจะมี `formStatusId`
4. ตรวจ `refNo` / status / ยอดชำระในตารางสถานะ

### ข้อควรระวัง

- ฟังก์ชันที่ไม่มี credential จะคืน `success:false` ทันที — **ไม่มี success ปลอมอีกต่อไป** (`batchSubmitToRDPortal` เดิมถูกปิดแล้ว)
- `submitInvoiceToRD` / `submitWHTToRD` / `batchSubmitToRD` เป็น deprecated shim ที่คืน error — RD Open API ชุดนี้เป็น endpoint สำหรับ **ยื่นแบบ** ไม่ใช่ส่ง e-Tax Invoice รายใบ
- **ห้าม** เรียก `submitPP30ToRD` / `cancelRDFiling` จาก cron, `useEffect`, หรือโค้ดอัตโนมัติ — ต้อง user-initiated
- ภาษีเดือน 11/2569 ยื่นและชำระแล้ว (รอออกใบเสร็จ) — **ห้ามยื่นซ้ำ**

## Rollback Guidance

- Revert code changes first
- Keep data intact
- Apply compensating migration only if required
- Record incident in `docs/INCIDENT_LOG.md`

## Prohibited Recovery Actions

- No `DROP TABLE`
- No table recreation to fix column mismatch
- No mass destructive delete in production

## Monthly Billing: Dominick (ประจำทุกเดือน)

> บันทึก 2026-09-21 (พี่แจ้ง / ยังไม่ลงมือ)

- ลูกค้า: contact_id 1 — บริษัท ดอมนิค (ประเทศไทย) จำกัด (Somsak@dhrlt.com)
- ตาราง: ออกใบแจ้งหนี้ให้ Dominick **ภายในวันที่ 1–2 ของทุกเดือน**
- ประวัติจริงในระบบ (ยอดอ้างอิง):
  - INV028 (พ.ค.) 34,935 + VAT 2,445.45 / paid
  - INV031 (ก.ค.) 34,935 + VAT 2,445.45 / paid (issue 6/7)
  - INV032 (ส.ค.) 34,935 + VAT 2,445.45 / paid (issue 4/8)
  - INV033 (ก.ย.) 34,935 + VAT 2,445.45 / paid (issue 1/9, due 16/9)
  - INV030 (มิ.ย.) 4,200 + VAT 294 เป็นรายการแยกต่างหาก
- งวดถัดไปครบถึง: **1–2 ต.ค. 2026** — เช็คยอด Google ล่าสุดก่อนออกบิล (ก.ย. = THB 28,183.05) อย่าใช้ยอดเก่าลอยๆ
- ยอดจริงของบิลเดือนหน้าขึ้นกับรูปเรียกเก็บของ Google เดือนนั้น ตรวจแล้วค่อยออก

### Dominick Pricing (ตั้งแต่ ต.ค. 2026 — ตัดสินใจ 2026-09-21)

- **สูตร:** `ราคา = 843.92 USD × 1.25 × เรต THB/USD ของวันออกบิล` (markup 25% คงที่)
- เหตุผล: ต้นทุนเป็น USD ผันผวน; fix 34,935 เดิมทำให้ markup ลดลง 24.5%→20.4% และถึงจุดขาดทุนที่เรต ~41.4/USD — บันทึกใน `DECISIONS.md`
- **เรตที่ใช้วันออกบิล:** ดึงเรตจริงวันนั้น (ต้องมีหลักฐาน/ที่มา) ห้ามเดา
- หลังหักค่าใช้เอง (Google 1 seat = 1,000/เดือน) ต้องการเหลือใช้ **≥ 10,000/เดือน** → ต้องมีลูกค้าอย่างน้อย 2 ราย

