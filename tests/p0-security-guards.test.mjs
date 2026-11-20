// =====================================================
// Regression guards สำหรับ P0 fixes (2026-11-20)
// -----------------------------------------------------
// ตรวจ "ข้อเท็จจริงในซอร์ส" ว่า security invariant ยังอยู่ครบ
// (รูปแบบเดียวกับ governance-guards.test.mjs — ไม่ต้อง mock DB/Next.js)
// ถ้าใครแก้โค้ดแล้วเผลอเอาออก → test นี้จะ fail ทันที
// =====================================================

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const src = (p) => readFileSync(join(ROOT, p), "utf8");

// ---------- P0-1 / P0-2: server auth boundary ----------

test("server-auth guard rejects missing/inactive users and reads status from DB", () => {
  const code = src("lib/server-auth.ts");
  assert.match(code, /requireActiveUser/);
  assert.match(code, /SELECT id, email, role, status FROM users WHERE id = \$1/);
  assert.match(code, /isActiveStatus\(user\.status\)/);
  assert.match(src("lib/security-rules.ts"), /=== "active"/);
  assert.match(code, /denied\(500, "Unable to verify account status"\)/);
  assert.match(code, /canAccessAdmin\(base\.role\)/);
  assert.match(code, /checkPermission\(base\.userId, module, action\)/);
});

test("critical mutating actions apply server-side permission guards", () => {
  const targets = [
    "app/actions/settings.ts",
    "app/actions/tax-reports.ts",
    "app/expense-actions.ts",
  ];
  for (const file of targets) {
    const code = src(file);
    assert.match(code, /requirePermission\(/, `${file} ต้องมี requirePermission`);
    assert.match(code, /authActionError\(/, `${file} ต้องคืน error แบบ fail-closed`);
  }
});

test("sensitive API routes apply auth guard", () => {
  const targets = [
    "app/api/settings/route.ts",
    "app/api/migrate/route.ts",
    "app/api/contacts/route.ts",
    "app/api/admin/backup/route.ts",
    "app/api/reset_billing/route.ts",
    "app/api/admin/google-sync/route.ts",
    "app/api/import/route.ts",
    "app/api/payments/[id]/route.ts",
    "app/api/invoices/delete/route.ts",
    "app/api/groups/route.ts",
    "app/api/users/route.ts",
    "app/api/admin/modules/route.ts",
    "app/api/payroll/route.ts",
    "app/api/ai/audit/route.ts",
  ];
  for (const file of targets) {
    const code = src(file);
    const hasGuard =
      /requirePermission\(/.test(code) ||
      /requireAdmin\(/.test(code) ||
      /requireActiveUser\(/.test(code);
    assert.ok(hasGuard, `${file} ต้องมี guard ฝั่ง server`);
    assert.match(code, /authErrorResponse\(/, `${file} ต้องคืน 401/403 เมื่อปฏิเสธ`);
  }
});

test("login returns generic errors, requires Active, and stops leaking identity", () => {
  const code = src("app/api/login/route.ts");
  assert.match(code, /GENERIC_LOGIN_ERROR/);
  assert.match(code, /status !== "active"/);
  assert.ok(!/console\.log\("\[LOGIN API\] Email:/.test(code));
  assert.ok(!/Password match:/.test(code));
  assert.ok(!/error: err\.message/.test(code));
});

test("JWT token creation embeds Active status and both verifiers enforce it", () => {
  const auth = src("lib/auth.ts");
  const proxy = src("proxy.ts");
  const login = src("app/api/login/route.ts");
  assert.match(auth, /status: "Active"/);
  assert.match(login, /status: "Active"/);
  assert.match(auth, /payload\.status \|\| ""/);
  assert.match(proxy, /payload\.status \|\| ""/);
});

test("root layout never renders children for non-active accounts", () => {
  const code = src("app/layout.tsx");
  assert.match(code, /dbStatus/);
  assert.match(code, /isActive \? \(/);
  assert.match(code, /ยังเข้าใช้งานไม่ได้/);
  assert.match(code, /{children}/);
  assert.match(code, /isActive && <GlobalAiChat \/>/);
});

// ---------- P0-3: expense/journal atomicity ----------

test("db exposes a transaction helper with rollback", () => {
  const code = src("lib/db.ts");
  assert.match(code, /export async function withTransaction/);
  assert.match(code, /BEGIN/);
  assert.match(code, /COMMIT/);
  assert.match(code, /ROLLBACK/);
  assert.match(code, /client\.release\(\)/);
});

test("expense create/update/delete all use withTransaction", () => {
  const code = src("app/expense-actions.ts");
  const occurrences = code.match(/withTransaction\(/g) || [];
  assert.ok(occurrences.length >= 3, `ต้องมี withTransaction อย่างน้อย 3 ที่ (ได้ ${occurrences.length})`);
  assert.match(code, /INSERT INTO expenses \(\s*title,/);
  assert.ok(!/INSERT INTO expenses \(\s*description,/.test(code));
  assert.match(code, /deleteExpenseJournalEntries\(id, db\.query\)/);
});

test("every secondary journal entry checks its result", () => {
  const code = src("lib/journaling.ts");
  // ห้ามเหลือ pattern `await createJournalEntry(...)` ที่ไม่ได้เก็บค่าเลย
  const rawAwaits = (code.match(/await createJournalEntry\(\{/g) || []).length;
  const checked = (code.match(/const \w+Entry = await createJournalEntry\(\{/g) || []).length;
  assert.equal(rawAwaits, checked, "ทุก createJournalEntry ต้องเก็บผลแล้วเช็ค success");
  assert.ok((code.match(/if \(!\w+Entry\.success\) return \w+Entry;/g) || []).length >= 4);
});

test("additive migration exists for legacy description column (not executed here)", () => {
  const code = src("migrations/2026-11-20_expenses_title_compatibility.sql");
  assert.match(code, /ADD COLUMN IF NOT EXISTS title/);
  assert.match(code, /SET title = description/);
  assert.ok(!/DROP COLUMN/.test(code));
  assert.match(code, /ฌอนไม่ได้รันกับ production/);
});

// ---------- P0-4: tax fail-closed ----------

test("PP30 preflight counters propagate query errors (no silent 0)", () => {
  const code = src("app/actions/tax-reports.ts");
  assert.ok(!/catch \{ return 0; \}/.test(code));
  assert.ok(!/catch \{ return 0 \}/.test(code));
  assert.match(code, /async function countUndeductedVatExpenses/);
  assert.match(code, /async function countIncompleteTaxDocs/);
  assert.match(code, /if \(!draft\.success \|\| !draft\.data\)/);
});

test("period validation blocks malformed month/year before filing", () => {
  const code = src("app/actions/tax-reports.ts");
  assert.match(code, /import \{ assertPeriod \} from "@\/lib\/security-rules"/);
  assert.match(code, /assertPeriod\(month, year\)/);
  const rules = src("lib/security-rules.ts");
  assert.match(rules, /export function assertPeriod/);
  assert.match(rules, /month < 1 \|\| month > 12/);
});

// ---------- รอบที่ 2: P0-1 / P0-3 ที่พบเพิ่ม ----------

test("every data-bearing Server Action has a server-side guard", () => {
  const targets = [
    "app/actions/invoices.ts",
    "app/actions/quotations.ts",
    "app/actions/journals.ts",
    "app/actions/contacts.ts",
    "app/actions/products.ts",
    "app/actions/vouchers.ts",
    "app/actions/services.ts",
    "app/actions/reminders.ts",
    "app/actions/chart-of-accounts.ts",
    "app/actions/ai-audit.ts",
    "app/actions/google-drive.ts",
  ];
  for (const file of targets) {
    const code = src(file);
    assert.match(code, /requireActionPermission|requireActiveAction/, `${file} ต้องมี guard ฝั่ง server`);
    assert.match(code, /if \(__guard\) return __guard;/, `${file} ต้อง return ทันทีเมื่อไม่ผ่าน`);
  }
  // admin members ต้องตรวจจาก DB ไม่ใช่ role ใน JWT
  const members = src("app/admin/members/actions.ts");
  assert.match(members, /requireAdmin\(\)/);
  assert.ok(!/hasMemberAdminAccess/.test(members));
});

test("company settings ไม่ส่ง secret column ให้ client", () => {
  const api = src("app/api/company/route.ts");
  assert.match(api, /requireActiveUser\(\)/);
  assert.match(api, /getPublicCompanySettings/);
  assert.ok(!/SELECT \* FROM company_settings/.test(api));

  const action = src("app/actions/invoices.ts");
  assert.match(action, /getPublicCompanySettings/);
  assert.ok(!/SELECT \* FROM company_settings/.test(action));

  const helper = src("lib/company-public.ts");
  assert.match(helper, /safeCompanySettingColumns/);
  const rules = src("lib/security-rules.ts");
  for (const secret of ["google_client_secret", "google_refresh_token", "rd_client_secret", "rd_api_key"]) {
    assert.ok(!new RegExp(`"${secret}"`).test(rules), `allowlist ห้ามมี ${secret}`);
  }

  // settings page ส่ง props เข้า Client Component → ต้องลบ secret ออกก่อน serialize
  const page = src("app/settings/page.tsx");
  assert.match(page, /delete safe\[key\]/);
  assert.match(page, /_present/);
  const client = src("components/SettingsClient.tsx");
  assert.match(client, /google_client_secret_present/);
  assert.ok(!/initialData\?\.google_client_secret \?/.test(client));
});

test("remaining sensitive API routes have guards", () => {
  const targets = [
    "app/api/payments/route.ts",
    "app/api/db_schema/route.ts",
    "app/api/ai/accounting/route.ts",
    "app/api/inventory/route.ts",
    "app/api/fx-rate/route.ts",
    "app/api/modules/route.ts",
    "app/api/payroll/[id]/route.ts",
    "app/api/user/permissions/route.ts",
  ];
  for (const file of targets) {
    const code = src(file);
    assert.match(code, /requirePermission|requireActiveUser|requireAdmin/, `${file} ต้องมี guard`);
    const failClosed =
      /if \(!guard\.ok\) return authErrorResponse\(guard\)/.test(code) ||
      /if \("error" in ctx\) return ctx\.error/.test(code); // payroll/[id] ใช้ shared context
    assert.ok(failClosed, `${file} ต้อง fail-closed`);
  }
});

test("CSV import atomic: transaction + RETURNING id + journal success check", () => {
  const route = src("app/api/import/route.ts");
  assert.match(route, /withTransaction\(/);
  assert.match(route, /parseExpenseCsv/);
  assert.match(route, /importExpenseRows/);
  assert.match(route, /createExpenseJournalEntry\(/);
  assert.match(route, /Import rolled back/);

  const importer = src("lib/csv-import.ts");
  assert.match(importer, /RETURNING id/);
  assert.match(importer, /!journal\.success/);
  assert.ok(!/i \+ 1/.test(importer));
});
