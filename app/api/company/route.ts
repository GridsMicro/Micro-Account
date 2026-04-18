import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(
      "SELECT * FROM company_settings LIMIT 1"
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    return NextResponse.json({ company: result.rows[0] });
  } catch (e) {
    console.error("GET company error:", e);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}
