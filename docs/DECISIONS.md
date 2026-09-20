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

### [2026-09-21] Dominick Billing: Markup 25% (รายได้หลัก = เงินเดือนพี่)
- Context: ต้นทุน Google Starter 137 lic เรียกเก็บเป็น USD (843.92/เดือน) ผันผวนตาม FX; เดิม fix ราคาขาย 34,935 THB → markup ลดลงจาก ~24.5% (มี.ค.) เหลือ ~20.4% (ก.ค.) เพราะ THB อ่อน; หากเรตถึง ~41.4/USD จะขาดทุน พี่มีรายได้ประจำจากบิลนี้แต่เพียงผู้เดียว (ไม่มีเงินเดือน) หลังหักค่าใช้จ่ายของตัวเอง (Google 1 seat = 1,000/เดือน) เหลือใช้แค่ ~4,800-4,900/เดือน จึงตัดสินใจปรับ
- Decision: เปลี่ยนราคา Dominick เป็น **markup 25% บนต้นทุน USD** (ราคา = 843.92 × 1.25 × เรตวันออกบิล) เริ่มตั้งแต่บิล ต.ค. 2026 — ไม่ fix THB อีกต่อไป ต้องหาลูกค้าเพิ่มให้ได้รายได้รวม ≥ 10,000/เดือนหลังหักค่าใช้ 1,000 (ไม่งั้นไม่พอใช้)
- Alternatives considered: fix ราคาเดิม 34,935 (ขาดทุนแน่ถ้า THB อ่อนต่อ) / markup 20% (เหลือใช้แค่ ~4,800) / markup 24% (ยังต่ำกว่าเป้า 10,000)
- Why this was chosen: markup 25% = ~6,254/ลูกค้า/เดือนหลังหัก 1,000 ที่เรต 34.385 → ต้องมีลูกค้าอย่างน้อย 2 รายเพื่อแตะ 10,000+/เดือน; กำไร % คงที่ ไม่แบกรับ FX; โปร่งใสให้ลูกค้าเห็นเรตจริง
- Impacted files/modules: ราคาบิล Dominick งวดถัดไป (ต.ค. 2026), `docs/OPERATION_RUNBOOK.md` (Monthly Billing), การหาฐานลูกค้าเพิ่ม
- Rollback plan: ถ้าลูกค้าไม่ยอมรับยอดใหม่ ให้กลับไปเจรจา/ลด markup ตามจริง — ต้องดูสัญญาที่พี่ตกลงกับลูกค้า

