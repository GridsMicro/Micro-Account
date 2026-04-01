import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createInvoiceRecord, createReminder, getCompanySettings, getNextInvoiceNumber } from "@/app/actions";
import { roundThaiTaxAmount } from "@/lib/tax";

async function ensureRecurringBillingSchema() {
  await query(`
    ALTER TABLE recurring_invoices
    ADD COLUMN IF NOT EXISTS billing_day INTEGER,
    ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 17,
    ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 2) DEFAULT 3.00,
    ADD COLUMN IF NOT EXISTS last_billed_at TIMESTAMP NULL
  `).catch(() => null);

  await query(`
    UPDATE recurring_invoices
    SET billing_day = EXTRACT(
      DAY FROM COALESCE(
        NULLIF(next_billing_date, '')::date,
        NULLIF(start_date, '')::date,
        CURRENT_DATE
      )
    )::int
    WHERE billing_day IS NULL
  `).catch(() => null);

  await query(`
    CREATE TABLE IF NOT EXISTS subscription_invoices (
      id SERIAL PRIMARY KEY,
      subscription_id INTEGER NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
      invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
      billing_period DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `).catch(() => null);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_subscription_billing_period
    ON subscription_invoices (subscription_id, billing_period)
  `).catch(() => null);
}

export async function POST(req: Request) {
  const secretHeader = req.headers.get("x-recurring-secret") || "";
  const url = new URL(req.url);
  const body = await req.json().catch(() => ({} as any));
  const dateStr = body?.date || url.searchParams.get("date") || null;
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const targetDay = targetDate.getDate();

  if (!process.env.RECURRING_SECRET) {
    return NextResponse.json({ error: "Security Error: RECURRING_SECRET not configured in .env.local" }, { status: 500 });
  }

  if (!secretHeader || secretHeader !== process.env.RECURRING_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    if (
      !session?.user ||
      !["admin", "manager", "super admin", "super_admin"].includes(
        String((session.user as any).role || "").toLowerCase()
      )
    ) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    await ensureRecurringBillingSchema();
    await query("SELECT pg_advisory_lock($1)", [123456789]);

    const targetDateIso = targetDate.toISOString().slice(0, 10);
    const candidates = await query(
      `
        SELECT
          r.*,
          c.id AS contact_id,
          c.email AS contact_email,
          c.name AS client_name
        FROM recurring_invoices r
        LEFT JOIN contacts c ON c.id = r.customer_id
        WHERE r.status = 'Active'
          AND (
            COALESCE(
              r.billing_day,
              EXTRACT(
                DAY FROM COALESCE(
                  NULLIF(r.next_billing_date, '')::date,
                  NULLIF(r.start_date, '')::date,
                  CURRENT_DATE
                )
              )::int
            ) = $1
            OR NULLIF(r.next_billing_date, '')::date = $2::date
          )
          AND (
            r.last_billed_at IS NULL
            OR date_trunc('month', r.last_billed_at) <> date_trunc('month', $2::date)
          )
        ORDER BY r.id ASC
      `,
      [targetDay, targetDateIso]
    );

    const rows = candidates.rows || [];
    const created: any[] = [];
    const skipped: any[] = [];
    const errors: any[] = [];

    const companyRes = await getCompanySettings();
    const vatRate = companyRes.success && companyRes.data?.vat_rate ? Number(companyRes.data.vat_rate) : 0;
    const isVatRegistered = companyRes.success && companyRes.data?.is_vat_registered;

    for (const row of rows) {
      try {
        const contactId = row.contact_id;
        if (!contactId) {
          skipped.push({ id: row.id, reason: "no_contact" });
          continue;
        }

        const net = Number(row.net_amount || row.total_amount || 0);
        const vatAmount = isVatRegistered ? roundThaiTaxAmount(net * (vatRate || 0) / 100) : 0;

        const exists = await query(
          `SELECT id FROM invoices WHERE contact_id = $1 AND date_trunc('month', created_at) = date_trunc('month', $2::date) AND net_amount = $3 LIMIT 1`,
          [contactId, targetDateIso, net]
        );
        if (exists.rows.length) {
          skipped.push({ id: row.id, reason: "already_billed" });
          continue;
        }

        const nextInvoice = await getNextInvoiceNumber();
        const invoiceNumber = nextInvoice.success ? nextInvoice.data : `INV-${Date.now()}`;

        const dueDay = Number(row.due_day || 17);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dueDate = new Date(year, month, Math.min(dueDay, daysInMonth)).toISOString().slice(0, 10);
        const billingPeriod = `${year}-${String(month + 1).padStart(2, "0")}-01`;

        const mappingExists = await query(
          `SELECT id FROM subscription_invoices WHERE subscription_id = $1 AND billing_period = $2::date LIMIT 1`,
          [row.id, billingPeriod]
        );
        if (mappingExists.rows.length) {
          skipped.push({ id: row.id, reason: "mapping_exists" });
          continue;
        }

        const gross = roundThaiTaxAmount(net + vatAmount);
        const whtRate = Number(row.wht_rate || 3) / 100;
        const wht = roundThaiTaxAmount(gross * whtRate);
        const amountDue = roundThaiTaxAmount(gross - wht);

        const createRes = await createInvoiceRecord({
          invoice_number: invoiceNumber,
          contact_id: String(contactId),
          net_amount: net,
          vat_amount: vatAmount,
          status: "sent",
          due_date: dueDate,
          wht_amount: wht,
        });

        if (!createRes.success) {
          errors.push({ id: row.id, error: createRes.error });
          continue;
        }

        await query(
          `
            UPDATE journal_entries
            SET description = CONCAT(COALESCE(description, ''), ' | Auto: Recurring WHT 3%')
            WHERE reference_no = $1
          `,
          [invoiceNumber]
        );

        const invRow = await query("SELECT id FROM invoices WHERE invoice_number = $1 LIMIT 1", [invoiceNumber]);
        const invoiceId = invRow.rows[0]?.id || null;

        await query(
          `INSERT INTO subscription_invoices (subscription_id, invoice_id, billing_period) VALUES ($1, $2, $3::date) ON CONFLICT DO NOTHING`,
          [row.id, invoiceId, billingPeriod]
        );

        await createReminder({
          title: `Due: Invoice ${invoiceNumber} - ${row.client_name || row.contact_email || "Recurring client"}`,
          description: `Amount due: ${amountDue} (WHT ${wht})`,
          due_date: dueDate,
          type: "subscription_due",
          related_id: invoiceId,
        });

        const nextMonthBase = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
        const daysNext = new Date(nextMonthBase.getFullYear(), nextMonthBase.getMonth() + 1, 0).getDate();
        const nextDay = Math.min(Number(row.billing_day || targetDay), daysNext);
        const nextBilling = new Date(nextMonthBase.getFullYear(), nextMonthBase.getMonth(), nextDay).toISOString().slice(0, 10);

        await query(
          `UPDATE recurring_invoices SET last_billed_at = NOW(), last_generated_date = $1::date, next_billing_date = $2::date WHERE id = $3`,
          [targetDateIso, nextBilling, row.id]
        );

        created.push({
          recurring_id: row.id,
          invoice_number: invoiceNumber,
          invoice_id: invoiceId,
          net_amount: net,
          vat_amount: vatAmount,
          wht_amount: wht,
        });
      } catch (error: any) {
        errors.push({ id: row.id, error: error.message });
      }
    }

    await query("SELECT pg_advisory_unlock($1)", [123456789]);
    return NextResponse.json({ success: true, created, skipped, errors, runDate: targetDateIso });
  } catch (error: any) {
    try {
      await query("SELECT pg_advisory_unlock($1)", [123456789]);
    } catch {}
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
