import { NextRequest, NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { query } from "@/lib/db";
import { ensurePayrollSchema } from "@/lib/payroll";
import { normalizePayrollMonth, validatePayrollPayload } from "@/lib/payroll-validation.mjs";

// GET /api/payroll?month=YYYY-MM
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    await ensurePayrollSchema();
    const companyId = await getUserCompanyId(session.user.id);
    const month = normalizePayrollMonth(request.nextUrl.searchParams.get("month"));

    const result = month
      ? await query(
          `
            SELECT
              id, company_id, employee_code, employee_name, payroll_month,
              gross_amount, tax_withheld, net_amount, currency, source_system,
              external_ref, notes, metadata, created_by, created_at, updated_at
            FROM payroll_entries
            WHERE company_id = $1
              AND date_trunc('month', payroll_month) = date_trunc('month', $2::date)
            ORDER BY payroll_month DESC, id DESC
          `,
          [companyId, month]
        )
      : await query(
          `
            SELECT
              id, company_id, employee_code, employee_name, payroll_month,
              gross_amount, tax_withheld, net_amount, currency, source_system,
              external_ref, notes, metadata, created_by, created_at, updated_at
            FROM payroll_entries
            WHERE company_id = $1
            ORDER BY payroll_month DESC, id DESC
            LIMIT 500
          `,
          [companyId]
        );

    return NextResponse.json({
      payroll: result.rows,
      filter: { month: month || null },
    });
  } catch (error) {
    console.error("GET /api/payroll error:", error);
    return NextResponse.json({ error: "Failed to fetch payroll records" }, { status: 500 });
  }
}

// POST /api/payroll
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(session.user.id);
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const payload = await request.json();
    const validated = validatePayrollPayload(payload);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    await ensurePayrollSchema();
    const companyId = await getUserCompanyId(session.user.id);
    const { data } = validated;

    const result = await query(
      `
        INSERT INTO payroll_entries (
          company_id, employee_code, employee_name, payroll_month,
          gross_amount, tax_withheld, net_amount, currency,
          source_system, external_ref, notes, metadata, created_by, updated_at
        )
        VALUES (
          $1, $2, $3, $4::date,
          $5, $6, $7, $8,
          $9, $10, $11, $12::jsonb, $13, NOW()
        )
        RETURNING
          id, company_id, employee_code, employee_name, payroll_month,
          gross_amount, tax_withheld, net_amount, currency, source_system,
          external_ref, notes, metadata, created_by, created_at, updated_at
      `,
      [
        companyId,
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
        parseInt(session.user.id, 10),
      ]
    );

    return NextResponse.json({ payroll: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/payroll error:", error);
    return NextResponse.json({ error: "Failed to create payroll record" }, { status: 500 });
  }
}

