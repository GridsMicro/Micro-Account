import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    // Some DB versions may use `type` instead of `contact_type`.
    const result = await query('SELECT id, name, "type", address, phone, tax_id FROM contacts ORDER BY name');
    let contacts = result.rows;

    if (type) {
      contacts = contacts.filter((contact: any) => {
        const contactType = ((contact.type || "").toString() || "").toLowerCase();
        return contactType === type.toLowerCase();
      });
    }

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error("GET /api/contacts error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch contacts" }, { status: 500 });
  }
}
