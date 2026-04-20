import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    
    let q = `
      SELECT p.*, c.name as customer_name, i.invoice_number, i.id as invoice_id
      FROM payments p 
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE 1=1
    `;
    const params: string[] = [];
    let paramIndex = 1;
    
    if (search) {
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      q += ` AND (p.payment_no ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex + 1})`;
      paramIndex += 2;
    }
    
    q += ` ORDER BY p.payment_date DESC`;
    
    const res = await query(q, params);
    
    return NextResponse.json({ payments: res.rows });
  } catch (e) {
    console.error("GET payments error:", e);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
