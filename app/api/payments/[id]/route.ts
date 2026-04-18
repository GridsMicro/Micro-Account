import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await query(
      `SELECT p.*, 
              c.name as customer_name, 
              c.address as customer_address,
              c.tax_id as customer_tax_id,
              i.invoice_number,
              i.net_amount as invoice_net_amount,
              i.vat_amount as invoice_vat_amount,
              i.total_amount as invoice_total_amount,
              i.wht_amount as invoice_wht_amount,
              i.net_after_wht as invoice_net_after_wht
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN contacts c ON i.contact_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    
    return NextResponse.json({ payment: result.rows[0] });
  } catch (e) {
    console.error("GET payment error:", e);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const result = await query(
      `UPDATE payments 
       SET payment_method = $1, 
           notes = $2,
           updated_at = NOW()
       WHERE id = $3 
       RETURNING *`,
      [body.payment_method, body.notes, id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, payment: result.rows[0] });
  } catch (e) {
    console.error("PUT payment error:", e);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ลบ payment และ journal entries ที่เกี่ยวข้อง
    await query("BEGIN");
    
    // ลบ journal entries ที่ลิงก์กับ payment นี้ (ค้นหาผ่าน reference_no ที่มีเลข payment)
    await query(
      `DELETE FROM journal_entries WHERE reference_no LIKE $1 OR description LIKE $2`,
      [`%RC-${id}%`, `%รับชำระ%`]
    );
    
    // ลบ payment
    const result = await query(
      "DELETE FROM payments WHERE id = $1 RETURNING *",
      [id]
    );
    
    await query("COMMIT");
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, deleted: result.rows[0] });
  } catch (e) {
    await query("ROLLBACK");
    console.error("DELETE payment error:", e);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
