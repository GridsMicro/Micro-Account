import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requirePermission, authErrorResponse } from "@/lib/server-auth";

export async function GET() {
  const guard = await requirePermission("inventory", "read");
  if (!guard.ok) return authErrorResponse(guard);
  try {
    const result = await query(`
      SELECT
        id,
        name,
        sku_number,
        price,
        type,
        category_name,
        stock_quantity
      FROM products
      ORDER BY name ASC
    `);

    return NextResponse.json({ success: true, products: result.rows });
  } catch (error) {
    console.error("GET /api/inventory error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch inventory" }, { status: 500 });
  }
}
