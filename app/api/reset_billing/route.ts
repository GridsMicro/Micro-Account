import { query } from "@/lib/db";
import { requireAdmin, authErrorResponse } from "@/lib/server-auth";
import { NextResponse } from "next/server";

/**
 * POST /api/reset_billing
 * 
 * Destructive endpoint: resets all billing/quotation data
 * REQUIRES: authenticated admin user
 * 
 * This is a PRIVILEGED operation — only admin can trigger
 * GET method is disabled to prevent CSRF/accidental clicks
 */
export async function POST(req: Request) {
  try {
    // 1–2. ตรวจ session + สถานะล่าสุด + สิทธิ์ admin กลาง
    const guard = await requireAdmin();
    if (!guard.ok) return authErrorResponse(guard);

    // 3. Parse request body and verify confirmation token
    const body = await req.json().catch(() => ({}));
    if (body.confirmToken !== "RESET_BILLING_CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          error: "Missing or invalid confirmation token. This is a destructive operation."
        },
        { status: 400 }
      );
    }

    // 4. Log audit trail before deletion
    console.log(`[AUDIT] Admin reset_billing triggered (ID: ${guard.userId})`);

    // 5. Perform destructive operation
    await query('DELETE FROM quotation_items');
    await query('DELETE FROM quotations');
    await query('DELETE FROM invoices');
    await query("DELETE FROM journal_entries WHERE reference_no LIKE 'INV%' OR reference_no LIKE 'QT%'");

    // 6. Reset sequences
    try { await query('ALTER SEQUENCE quotations_id_seq RESTART WITH 1'); } catch (_) { }
    try { await query('ALTER SEQUENCE invoices_id_seq RESTART WITH 1'); } catch (_) { }
    try { await query('ALTER SEQUENCE quotation_items_id_seq RESTART WITH 1'); } catch (_) { }

    console.log(`[AUDIT] Admin reset_billing completed (ID: ${guard.userId})`);

    return NextResponse.json({
      success: true,
      message: "✅ รีเซ็ตข้อมูลเรียบร้อย! สามารถเริ่มสร้างเอกสารใหม่ได้เลย",
      cleared: ["quotations", "quotation_items", "invoices", "journal_entries (INV/QT)"],
      nextDocNumbers: { invoice: "INV26-001", quotation: "QT26-001" }
    });
  } catch (err: any) {
    console.error("[ERROR] reset_billing failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reset_billing
 * DISABLED — prevents accidental clicks, CSRF attacks, and unauthorized access
 * Use POST with proper authentication and confirmation instead
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST with admin authentication and confirmation token.",
      hint: "This is a destructive operation and requires explicit admin confirmation."
    },
    { status: 405 }
  );
}
