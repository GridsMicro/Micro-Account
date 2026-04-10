function parseAmount(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return num;
}

export function normalizePayrollMonth(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(trimmed)) return null;
  return trimmed.length === 7 ? `${trimmed}-01` : trimmed;
}

export function validatePayrollPayload(payload) {
  const employeeName = String(payload?.employee_name || "").trim();
  const payrollMonth = normalizePayrollMonth(payload?.payroll_month);
  const employeeCode = payload?.employee_code ? String(payload.employee_code).trim() : null;
  const sourceSystem = payload?.source_system ? String(payload.source_system).trim() : "manual";
  const externalRef = payload?.external_ref ? String(payload.external_ref).trim() : null;
  const notes = payload?.notes ? String(payload.notes).trim() : null;

  if (!employeeName || !payrollMonth) {
    return { ok: false, error: "employee_name and payroll_month are required" };
  }
  if (employeeName.length > 255) {
    return { ok: false, error: "employee_name is too long (max 255)" };
  }
  if (employeeCode && employeeCode.length > 100) {
    return { ok: false, error: "employee_code is too long (max 100)" };
  }
  if (sourceSystem.length > 100) {
    return { ok: false, error: "source_system is too long (max 100)" };
  }
  if (externalRef && externalRef.length > 150) {
    return { ok: false, error: "external_ref is too long (max 150)" };
  }

  const grossAmount = parseAmount(payload?.gross_amount);
  const taxWithheld = parseAmount(payload?.tax_withheld);
  if (taxWithheld > grossAmount) {
    return { ok: false, error: "tax_withheld must be less than or equal to gross_amount" };
  }

  const explicitNet = payload?.net_amount;
  const netAmount =
    explicitNet === undefined || explicitNet === null
      ? Math.max(grossAmount - taxWithheld, 0)
      : parseAmount(explicitNet);
  const currency = payload?.currency ? String(payload.currency).trim().toUpperCase() : "THB";

  return {
    ok: true,
    data: {
      employeeCode,
      employeeName,
      payrollMonth,
      grossAmount,
      taxWithheld,
      netAmount,
      currency,
      sourceSystem,
      externalRef,
      notes,
      metadata: payload?.metadata && typeof payload.metadata === "object" ? payload.metadata : {},
    },
  };
}

