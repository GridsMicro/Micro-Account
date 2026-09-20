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

