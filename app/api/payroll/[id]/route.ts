import { NextRequest, NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { query } from "@/lib/db";
import { ensurePayrollSchema } from "@/lib/payroll";
import { validatePayrollPayload } from "@/lib/payroll-validation.mjs";

async function getRequestContext() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userIsAdmin = await isAdmin(session.user.id);
  if (!userIsAdmin) {
    return { error: NextResponse.json({ error: "Permission denied" }, { status: 403 }) };
  }

  await ensurePayrollSchema();
  const companyId = await getUserCompanyId(session.user.id);
  return {
    session,
    companyId,
  };
}

// PUT /api/payroll/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    if ("error" in ctx) return ctx.error;

    const { id } = await params;
    const payrollId = Number.parseInt(id, 10);
    if (!Number.isFinite(payrollId)) {
      return NextResponse.json({ error: "Invalid payroll ID" }, { status: 400 });
    }

    const existing = await query(
      `SELECT id FROM payroll_entries WHERE id = $1 AND company_id = $2 LIMIT 1`,
      [payrollId, ctx.companyId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    const payload = await request.json();
    const validated = validatePayrollPayload(payload);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }
    const data = validated.data;
    if (!data) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const result = await query(
      `
        UPDATE payroll_entries
        SET
          employee_code = $1,
          employee_name = $2,
          payroll_month = $3::date,
          gross_amount = $4,
          tax_withheld = $5,
          net_amount = $6,
          currency = $7,
          source_system = $8,
          external_ref = $9,
          notes = $10,
          metadata = $11::jsonb,
          updated_at = NOW()
        WHERE id = $12
          AND company_id = $13
        RETURNING
          id, company_id, employee_code, employee_name, payroll_month,
          gross_amount, tax_withheld, net_amount, currency, source_system,
          external_ref, notes, metadata, created_by, created_at, updated_at
      `,
      [
        data.employeeCode,
        data.employeeName,
        data.payrollMonth,
        data.grossAmount,
        data.taxWithheld,
        data.netAmount,
        data.currency,
        data.sourceSystem,
        data.externalRef,
        data.notes,
        JSON.stringify(data.metadata),
        payrollId,
        ctx.companyId,
      ]
    );

    return NextResponse.json({ payroll: result.rows[0] });
  } catch (error) {
    console.error("PUT /api/payroll/[id] error:", error);
    return NextResponse.json({ error: "Failed to update payroll record" }, { status: 500 });
  }
}

// DELETE /api/payroll/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getRequestContext();
    if ("error" in ctx) return ctx.error;

    const { id } = await params;
    const payrollId = Number.parseInt(id, 10);
    if (!Number.isFinite(payrollId)) {
      return NextResponse.json({ error: "Invalid payroll ID" }, { status: 400 });
    }

    const result = await query(
      `DELETE FROM payroll_entries WHERE id = $1 AND company_id = $2 RETURNING id`,
      [payrollId, ctx.companyId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/payroll/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete payroll record" }, { status: 500 });
  }
}

