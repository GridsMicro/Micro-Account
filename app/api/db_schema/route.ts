import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { rows } = await query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invoices'"
    );
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
