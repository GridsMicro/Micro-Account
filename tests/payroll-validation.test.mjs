import test from "node:test";
import assert from "node:assert/strict";
import { normalizePayrollMonth, validatePayrollPayload } from "../lib/payroll-validation.mjs";

test("normalize payroll month accepts yyyy-mm and yyyy-mm-dd", () => {
  assert.equal(normalizePayrollMonth("2026-04"), "2026-04-01");
  assert.equal(normalizePayrollMonth("2026-04-15"), "2026-04-15");
  assert.equal(normalizePayrollMonth("04-2026"), null);
});

test("validate payroll payload requires required fields", () => {
  const result = validatePayrollPayload({});
  assert.equal(result.ok, false);
  assert.equal(result.error, "employee_name and payroll_month are required");
});

test("validate payroll payload enforces tax <= gross", () => {
  const result = validatePayrollPayload({
    employee_name: "A",
    payroll_month: "2026-04",
    gross_amount: 1000,
    tax_withheld: 1200,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, "tax_withheld must be less than or equal to gross_amount");
});

test("validate payroll payload derives net amount when omitted", () => {
  const result = validatePayrollPayload({
    employee_name: "A",
    payroll_month: "2026-04",
    gross_amount: 20000,
    tax_withheld: 600,
  });
  assert.equal(result.ok, true);
  assert.equal(result.data.netAmount, 19400);
});

