// P0 behavioral tests — เรียกโค้ดจริง ไม่ใช่แค่ตรวจรูปแบบซอร์ส
// รันด้วย: node --import tsx --test tests/p0-behavior.test.mjs
import test from "node:test";
import assert from "node:assert/strict";

import {
  isActiveStatus,
  safeCompanySettingColumns,
  assertPeriod,
  SAFE_COMPANY_COLUMNS,
} from "../lib/security-rules.ts";
import { parseExpenseCsv, importExpenseRows } from "../lib/csv-import.ts";

// ---------------------------------------------------------------- isActiveStatus
test("isActiveStatus: รับเฉพาะ Active (case/space-insensitive)", () => {
  for (const value of ["Active", "active", " ACTIVE ", "AcTiVe"]) {
    assert.equal(isActiveStatus(value), true, `ควรผ่าน: ${value}`);
  }
  for (const value of ["Pending", "Inactive", "Suspended", "", "  ", null, undefined, 0, false, "active-ish"]) {
    assert.equal(isActiveStatus(value), false, `ควรปฏิเสธ: ${String(value)}`);
  }
});

// ---------------------------------------------------- safeCompanySettingColumns
test("safeCompanySettingColumns: ตัด secret column ออกแม้มีอยู่จริงใน DB", () => {
  const actual = [
    "id", "name", "address", "tax_id", "phone",
    "google_client_secret", "google_refresh_token", "google_client_id",
    "rd_client_secret", "rd_api_key", "gmail_app_password",
    "brand_new_column_from_db", "id",
  ];
  const safe = safeCompanySettingColumns(actual);

  assert.ok(safe.includes("tax_id"));
  assert.equal(safe.filter((c) => c === "id").length, 1, "ต้องไม่ซ้ำ");
  for (const secret of [
    "google_client_secret", "google_refresh_token", "rd_client_secret",
    "rd_api_key", "gmail_app_password", "brand_new_column_from_db",
  ]) {
    assert.equal(safe.includes(secret), false, `ห้ามส่ง ${secret} กลับ client`);
  }
});

test("safeCompanySettingColumns: allowlist ต้องไม่มีช่องลับแม้แต่ชื่อเดียว", () => {
  for (const secret of ["secret", "token", "password", "api_key"]) {
    assert.equal(
      SAFE_COMPANY_COLUMNS.some((column) => column.toLowerCase().includes(secret)),
      false,
      `allowlist ห้ามมีคอลัมน์ที่เกี่ยวกับ ${secret}`
    );
  }
});

// ------------------------------------------------------------------ assertPeriod
test("assertPeriod: งวดถูกต้องผ่าน / งวดผิด throw", () => {
  assert.doesNotThrow(() => assertPeriod(1, 2026));
  assert.doesNotThrow(() => assertPeriod(12, 2200));

  for (const [month, year] of [[0, 2026], [13, 2026], [1.5, 2026], [1, 1999], [NaN, 2026], ["1", 2026]]) {
    assert.throws(
      () => assertPeriod(month, year),
      /งวดเดือน\/ปีไม่ถูกต้อง/,
      `ต้องปฏิเสธ month=${month} year=${year}`
    );
  }
});

// ---------------------------------------------------------------- parseExpenseCsv
test("parseExpenseCsv: แปลงแถวถูกต้อง พร้อมเลขบรรทัดและค่า null", () => {
  const csv = [
    "title,category,amount,expense_date,reference_no,notes",
    "ค่าเช้า,ค่าเช่าสถานที่,1500.50,2026-11-05,REF-1,หมายเหตุ",
    "ค่ไฟ,ค่าสาธารณูปโภค,320,2026-11-06,,",
  ].join("\n");

  const { rows, errors, total } = parseExpenseCsv(csv);
  assert.equal(total, 2);
  assert.deepEqual(errors, []);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    lineNo: 2,
    title: "ค่าเช้า",
    category: "ค่าเช่าสถานที่",
    amount: 1500.5,
    expense_date: "2026-11-05",
    reference_no: "REF-1",
    notes: "หมายเหตุ",
  });
  assert.equal(rows[1].reference_no, null);
  assert.equal(rows[1].notes, null);
});

test("parseExpenseCsv: แถวผิดถูกคัดออกและบอกเลขบรรทัด", () => {
  const csv = [
    "title,category,amount,expense_date",
    "ดี,หมวด,100,2026-11-01",
    "ยอดผิด,หมวด,ABC,2026-11-01",
    "วันที่ผิด,หมวด,100,01-11-2026",
    "ขาดช่อง,หมวด",
    "ไม่มีวันที่,หมวด,100,",
  ].join("\n");

  const { rows, errors, total } = parseExpenseCsv(csv);
  assert.equal(total, 5);
  assert.deepEqual(rows.map((r) => r.title), ["ดี"]);
  assert.ok(errors.some((e) => e.includes("Line 3") && e.includes("amount")));
  assert.ok(errors.some((e) => e.includes("Line 4") && e.includes("date")));
  assert.ok(errors.some((e) => e.includes("Line 5") && e.includes("columns")));
  assert.ok(errors.some((e) => e.includes("Line 6") && e.includes("required")));
});

test("parseExpenseCsv: ไฟล์ว่าง/มีแต่ header → error", () => {
  const { rows, total, errors } = parseExpenseCsv("title,category,amount,expense_date\n");
  assert.equal(rows.length, 0);
  assert.equal(total, 0);
  assert.equal(errors.length, 1);
});

// --------------------------------------------------------------- importExpenseRows
function makeFakeClient(ids) {
  const inserts = [];
  let index = 0;
  return {
    inserts,
    query: async (text, params) => {
      if (!text.includes("INSERT INTO expenses")) throw new Error("unexpected SQL");
      inserts.push({ text, params, hasReturning: text.includes("RETURNING id") });
      const id = ids[index++];
      return { rows: id === undefined ? [] : [{ id }] };
    },
  };
}

test("importExpenseRows: ใช้ id จริงจาก RETURNING ไม่ใช่ i+1", async () => {
  const fake = makeFakeClient([501, 777]);
  const journalCalls = [];
  const journal = async (...args) => {
    journalCalls.push(args);
    return { success: true };
  };

  const rows = [
    { lineNo: 2, title: "a", category: "ค่าเช่าสถานที่", amount: 100, expense_date: "2026-11-01", reference_no: null, notes: null },
    { lineNo: 3, title: "b", category: "อื่นๆ", amount: 200, expense_date: "2026-11-02", reference_no: "R", notes: null },
  ];

  assert.equal(await importExpenseRows(fake, rows, journal), 2);
  assert.equal(fake.inserts.length, 2);
  assert.ok(fake.inserts.every((i) => i.hasReturning), "INSERT ต้องมี RETURNING id");
  assert.deepEqual(fake.inserts[0].params.slice(0, 4), ["a", "ค่าเช่าสถานที่", 100, "2026-11-01"]);
  assert.deepEqual(
    journalCalls.map((call) => call[0]),
    [501, 777],
    "journal ต้องอ้าง expense id ที่ DB สร้าง"
  );
});

test("importExpenseRows: journal พัง → throw ทันที (ให้ transaction ROLLBACK ทั้งไฟล์)", async () => {
  const fake = makeFakeClient([11, 12, 13]);
  const journal = async (expenseId) =>
    expenseId === 11 ? { success: false, error: "journal insert failed" } : { success: true };

  const rows = [2, 3, 4].map((lineNo) => ({
    lineNo, title: `t${lineNo}`, category: "อื่นๆ", amount: 10, expense_date: "2026-11-01", reference_no: null, notes: null,
  }));

  await assert.rejects(
    () => importExpenseRows(fake, rows, journal),
    /Line 2: journal failed — journal insert failed/
  );
  assert.equal(fake.inserts.length, 1, "พังแถวแรกต้องไม่ insert แถวที่สองต่อ");
});

test("importExpenseRows: DB ไม่คืน id → throw (ห้ามเดา id จาก i+1)", async () => {
  const fake = makeFakeClient([]);
  const rows = [{
    lineNo: 2, title: "t", category: "อื่นๆ", amount: 10, expense_date: "2026-11-01", reference_no: null, notes: null,
  }];
  await assert.rejects(
    () => importExpenseRows(fake, rows, async () => ({ success: true })),
    /ไม่ได้รับ expense id/
  );
});

// ------------------------------------------------------------------ withTransaction
test("withTransaction: COMMIT เมื่อสำเร็จ / ROLLBACK เมื่อ error / release ทุกครั้ง", async () => {
  process.env.POSTGRES_URL ||= "postgresql://u:p@127.0.0.1:5432/test?sslmode=disable";
  const db = await import("../lib/db.ts");
  const calls = [];
  const fakeClient = {
    query: async (sql) => {
      calls.push(sql);
      return { rows: [] };
    },
    release: () => calls.push("RELEASE"),
  };
  db.default.connect = async () => fakeClient;

  const result = await db.withTransaction(async (client) => {
    await client.query("INSERT ...");
    return 42;
  });
  assert.equal(result, 42);
  assert.deepEqual(calls, ["BEGIN", "INSERT ...", "COMMIT", "RELEASE"]);

  calls.length = 0;
  await assert.rejects(
    () => db.withTransaction(async (client) => {
      await client.query("INSERT ...");
      throw new Error("boom");
    }),
    /boom/
  );
  assert.deepEqual(calls, ["BEGIN", "INSERT ...", "ROLLBACK", "RELEASE"]);
});
