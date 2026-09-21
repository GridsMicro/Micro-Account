# Architecture Decisions Log

Use this file to record important decisions and their rationale.

## Template

### [YYYY-MM-DD] Decision Title
- Context:
- Decision:
- Alternatives considered:
- Why this was chosen:
- Impacted files/modules:
- Rollback plan:

---

### [2026-04-09] Canonical RBAC + Role Standard
- Context: Role labels and access checks were inconsistent across UI/API.
- Decision: Standardize to `superadmin/admin/user` + group-based RBAC permissions.
- Alternatives considered: keep mixed role aliases for compatibility.
- Why this was chosen: reduces regressions, removes duplicate logic, improves maintainability.
- Impacted files/modules: `lib/core-standards.ts`, admin/member/API access checks, docs.
- Rollback plan: none needed; this is additive/normalization without schema destruction.

### [2026-04-09] Governance Guardrails Automation
- Context: Behavior changes risk drifting from docs and standards over time.
- Decision: Add CI/PR/weekly enforcement and guard tests.
- Alternatives considered: manual review-only process.
- Why this was chosen: lowers human error, keeps documentation synchronized with code.
- Impacted files/modules: `.github/workflows/*`, `scripts/verify-knowledge-sync.mjs`, `scripts/weekly-consistency-audit.mjs`, `tests/governance-guards.test.mjs`.
- Rollback plan: remove workflow/script/test files if automation causes false-positive friction.

### [2026-04-09] Unified Module Registry and Menu API
- Context: Sidebar menu and permission modules were defined in multiple files and drifted over time.
- Decision: Introduce a canonical module registry and expose it through a modules API.
- Alternatives considered: keep local constants per page.
- Why this was chosen: enables future module onboarding (HR, Sales, external APIs) without duplicating menu/permission definitions.
- Impacted files/modules: `lib/module-registry.ts`, `components/Sidebar.tsx`, `app/admin/groups/page.tsx`, `app/api/modules/route.ts`.
- Rollback plan: revert to static menu constants if dynamic module model causes UI regressions.

### [2026-09-21] PDF Evidence Must Be Checked Before Recording Expenses
- Context: จัดทำภาษี ก.ค. 2026 พบว่า original_currency/exchange_rate บางรายการ (Google Workspace) บันทึกจากตัวเลขที่เดา (35.1/35.2) ไม่ตรงใบแจ้งยอดจริง (34.385 จาก KTC statement 18/08/26); ยังพบว่าเส้นบางเส้น (STARTER 137 lic) เปลี่ยนจาก USD เป็น THB ไม่ได้อัปเดต
- Decision: ก่อนบันทึกค่าใช้จ่ายทุกครั้ง ต้องแปลง/อ่าน PDF ต้นทาง (invoice/statement) ก่อน — ผ่าน pdf-tools (`~/workspace/services/python/pdf-tools/pdf_toolkit.py`) แล้วบันทึกตัวเลขตามหลักฐานเท่านั้น ห้ามเดา
- Alternatives considered: ปล่อยให้กรอกด้วยมือตามเดิม (เสี่ยงตัวเลขเพี้ยนซ้ำ)
- Why this was chosen: หลักฐานตรวจสอบย้อนหลังได้, ตัวเลขภาษีถูกต้อง, กฎ #1 (ห้ามเดา) บังคับ
- Impacted files/modules: `docs/BUSINESS_RULES.md`, `docs/statements/*.pdf`, พฤติกรรมการบันทึก expenses
- Rollback plan: none — เป็นกฎการทำงาน ไม่กระทบ schema

### [2026-09-21] ภาษี ก.ค. 2026: ใช้แค่ #21 (จ่าย 547.11) — แบบ ส.ค. ใช้ #22+#13 ไปแล้ว
- Context: ยื่นภาษีค้าง ก.ค.2026 ล่าช้า (สรรพากรยืนยันยื่นได้+ต่างปรับ) — ตรวจหลักฐานบิล Google จริง (pdf-tools): #21 (Starter 137 lic, USD 843.92 @34.385 = 29,017.52) และ #13 (1 seat, THB 1,000) ทั้งคู่ช่วง 1–31 ก.ค. เป็นใบกำกับสิงคโปร์ GST 0% ไม่ใช่ใบกำกับไทย; แบบ ส.ค. ที่ยื่นจริง (3/9/69, ref P300039607819) ใช้ #22 (29,022.41→2,031.57) + #13 (1,000→70) = ซื้อ 30,022.41 ไปแล้ว
- Decision: **ก.ค.2026 ใช้เพียง #21 เป็นรายการหักได้** → reverse charge 29,017.52×7/107 = **VAT ซื้อ 1,898.34** → Net ภ.พ.30 = 2,445.45 − 1,898.34 = **547.11**; **#13/#22 ไม่นำมาก.ค.ซ้ำ** (ยื่นไปแบบ ส.ค. แล้ว ห้าม double count)
- Alternatives considered: ทาง ก เดิม (#21+#13 = 1,963.76 → 481.69) — ตกอันตรายเพราะ #13 (1,000) ถูกใช้ไปแล้วในแบบ ส.ค. → หักซ้ำ 70
- Why this was chosen: หลักฐานบิล+แบบที่ยื่นแล้วชี้ชัด ต้องกัน #13 ออกไม่งั้นเครดิตซ้ำ; จ่าย 547.11 เป็นยอดที่ถูกหลักฐานที่สุด
- Impacted files/modules: `expenses` id=21 (amount 29,017.52 / net 27,119.18 / vat 1,898.34 / pp36_exempt=false), PP30+PP36 draft ก.ค., `docs/TAX_WORKLOG.md`, `docs/BUSINESS_RULES.md`
- Rollback plan: ถ้าสรรพากรขอปรับยอด/ยื่นเพิ่ม ให้ยื่นเพิ่มเติมผ่านแบบ ภ.พ.30 เพิ่มเติมโดยอ้างใบกำกับ #13 ใบใหม่ได้ (เปลี่ยนได้เฉพาะยอดที่ยังไม่ยื่นจริง)

### [2026-09-21] แก้วิธีคิด reverse charge ภ.พ.36: เงินที่จ่าย × 7% (แก้จาก 7/107)
- Context: ตรวจกฎหมายและแนวปฏิบัติย้อนหลัง (สน.สรรพากรจริง) พบว่า reverse charge ภ.พ.36 **ใช้อัตรา 7% ของเงินที่จ่าย** ไม่ใช่ 7/107 — หลักฐาน: แนววินิจฉัย กค 0702/6764 ("นำส่งภาษีในอัตราร้อยละ 7.0 ของเงินที่จ่าย"), แบบฟอร์ม ภ.พ.36 ของ RD, PEAK/HashMicro/Chob; และแบบ ส.ค.2026 ที่ยื่นไปแล้ว (P300039607819) ใช้ 29,022.41×7% = 2,031.57, 1,000×7% = 70 พอดี บิล Google เป็น GST 0% **ไม่มี VAT ไทยรวม** → เงินที่จ่ายทั้งหมด = ฐานภาษี (ในทางกลับกัน 7/107 จะใช้กรณีจำนวนเงินรวม VAT แล้ว)
- Decision: **#21 vat_amount = 29,017.52 × 7% = 2,031.23, net_amount = 29,017.52** → Net ภ.พ.30 ก.ค. = 2,445.45 − 2,031.23 = **414.22** และ **ภ.พ.36 = 29,017.52 / 2,031.23** (แทนเลขเดิม 1,898.34 = 7/107 และ 547.11) — ใช้แทน decision "547.11" ข้างต้นเฉพาะส่วนวิธีคำนวณ; ส่วน "ใช้แค่ #21, ไม่เอา #13/#22 ซ้ำ" ยังคงเดิม
- Alternatives considered: คงวิธี 7/107 ไว้ (1,898.34/547.11) — แม้ self-consistent (นำส่งแล้วหักคืนเท่ากัน) แต่ไม่ตรงแนวปฏิบัติและแบบอ้างอิงที่ยื่นผ่านมาแล้ว ต่างวิธี 3% ของเงินที่จ่าย
- Why this was chosen: ตรงแนววินิจฉัยสรรพากร + ตรงกับแบบ ส.ค. ที่ยื่นผ่านแล้ว → ลดความเสี่ยงถูกตั้งคำถาม/ผิดเพี้ยนเมื่อขอยื่นย้อนหลัง รายได้/ภาระสุทธิเท่ากันทั้ง 2 วิธี (นำส่ง ภ.พ.36 เท่ากับหักเป็นภาษีซื้อใน ภ.พ.30)
- Impacted files/modules: `expenses` id=21 (net 29,017.52 / vat 2,031.23 / notes อ้าง กค 0702/6764), PP30+PP36 draft ก.ค., `docs/TAX_WORKLOG.md`, `docs/BUSINESS_RULES.md`
- Rollback plan: ถ้ายังไม่ยื่น → เปลี่ยน vat_amount กลับได้เลย; ถ้ายื่นแล้วไม่ต้องแก้ (2 วิธียอมรับได้ทั้งคู่, จำนวนต่างกัน <3% บนยอดภาษีซื้อ)

### [2026-09-21] Dominick Billing: Markup 25% (รายได้หลัก = เงินเดือนพี่)
- Context: ต้นทุน Google Starter 137 lic เรียกเก็บเป็น USD (843.92/เดือน) ผันผวนตาม FX; เดิม fix ราคาขาย 34,935 THB → markup ลดลงจาก ~24.5% (มี.ค.) เหลือ ~20.4% (ก.ค.) เพราะ THB อ่อน; หากเรตถึง ~41.4/USD จะขาดทุน พี่มีรายได้ประจำจากบิลนี้แต่เพียงผู้เดียว (ไม่มีเงินเดือน) หลังหักค่าใช้จ่ายของตัวเอง (Google 1 seat = 1,000/เดือน) เหลือใช้แค่ ~4,800-4,900/เดือน จึงตัดสินใจปรับ
- Decision: เปลี่ยนราคา Dominick เป็น **markup 25% บนต้นทุน USD** (ราคา = 843.92 × 1.25 × เรตวันออกบิล) เริ่มตั้งแต่บิล ต.ค. 2026 — ไม่ fix THB อีกต่อไป ต้องหาลูกค้าเพิ่มให้ได้รายได้รวม ≥ 10,000/เดือนหลังหักค่าใช้ 1,000 (ไม่งั้นไม่พอใช้)
- Alternatives considered: fix ราคาเดิม 34,935 (ขาดทุนแน่ถ้า THB อ่อนต่อ) / markup 20% (เหลือใช้แค่ ~4,800) / markup 24% (ยังต่ำกว่าเป้า 10,000)
- Why this was chosen: markup 25% = ~6,254/ลูกค้า/เดือนหลังหัก 1,000 ที่เรต 34.385 → ต้องมีลูกค้าอย่างน้อย 2 รายเพื่อแตะ 10,000+/เดือน; กำไร % คงที่ ไม่แบกรับ FX; โปร่งใสให้ลูกค้าเห็นเรตจริง
- Impacted files/modules: ราคาบิล Dominick งวดถัดไป (ต.ค. 2026), `docs/OPERATION_RUNBOOK.md` (Monthly Billing), การหาฐานลูกค้าเพิ่ม
- Rollback plan: ถ้าลูกค้าไม่ยอมรับยอดใหม่ ให้กลับไปเจรจา/ลด markup ตามจริง — ต้องดูสัญญาที่พี่ตกลงกับลูกค้า

