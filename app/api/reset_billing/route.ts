import { query } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/reset_billing → เรียกจาก browser ได้เลย
export async function GET() {
  try {
    await query('DELETE FROM quotation_items');
    await query('DELETE FROM quotations');
    await query('DELETE FROM invoices');
    await query("DELETE FROM journal_entries WHERE reference_no LIKE 'INV%' OR reference_no LIKE 'QT%'");

    try { await query('ALTER SEQUENCE quotations_id_seq RESTART WITH 1'); } catch (_) {}
    try { await query('ALTER SEQUENCE invoices_id_seq RESTART WITH 1'); } catch (_) {}
    try { await query('ALTER SEQUENCE quotation_items_id_seq RESTART WITH 1'); } catch (_) {}

    return NextResponse.json({
      success: true,
      message: "✅ รีเซ็ตข้อมูลเรียบร้อย! สามารถเริ่มสร้างเอกสารใหม่ได้เลย",
      cleared: ["quotations", "quotation_items", "invoices", "journal_entries (INV/QT)"],
      nextDocNumbers: { invoice: "INV26-001", quotation: "QT26-001" }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
