import { NextResponse } from "next/server";
import { deleteInvoice } from "@/app/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });

    // Server-side authorization: ensure caller is admin
    try {
      const { auth } = await import('@/lib/auth');
      const session = await auth();
      if (!session?.user || (session.user as any).role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
      }
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

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
