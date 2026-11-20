import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/server-auth";

export async function GET() {
  // P0-1: schema เป็นข้อมูล reconnaissance — เฉพาะ admin เท่านั้น
  const guard = await requireAdmin();
  if (!guard.ok) return authErrorResponse(guard);
  try {
    const { rows } = await query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices'"
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
