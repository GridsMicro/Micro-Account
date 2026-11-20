import { NextResponse } from "next/server";
import { deleteInvoice } from "@/app/actions";
import { requirePermission, authErrorResponse } from "@/lib/server-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    // Server-side authorization: ตรวจสถานะล่าสุด + สิทธิ์ลบใบแจ้งหนี้
    const guard = await requirePermission('invoices', 'delete');
    if (!guard.ok) return authErrorResponse(guard);

    const res = await deleteInvoice(Number(id));
    if (res && res.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: res?.error || "Failed to delete" }, { status: 500 });
  } catch (error: any) {
    console.error("API Delete Invoice Error:", error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
