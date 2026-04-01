import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { contactMatchesUsage, normalizeContactType } from "@/lib/contacts";

async function ensureContactsSchema() {
  await query(`
    ALTER TABLE contacts
    ADD COLUMN IF NOT EXISTS contact_type VARCHAR(20)
  `);

  await query(`
    UPDATE contacts
    SET contact_type = CASE
      WHEN LOWER(COALESCE(type, '')) IN ('vendor', 'supplier') THEN 'SUPPLIER'
      WHEN LOWER(COALESCE(type, '')) = 'both' THEN 'BOTH'
      ELSE 'CUSTOMER'
    END
    WHERE contact_type IS NULL OR contact_type = ''
  `);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    await ensureContactsSchema();

    const result = await query(`
      SELECT id, name, type, contact_type, address, phone, email, tax_id
      FROM contacts
      ORDER BY name
    `);
    let contacts = result.rows.map((contact: any) => ({
      ...contact,
      contact_type: normalizeContactType(contact.contact_type || contact.type),
    }));

    if (type) {
      const usage = type === "supplier" ? "expense" : type === "customer" ? "invoice" : "all";
      contacts = contacts.filter((contact: any) => contactMatchesUsage(contact.contact_type, usage));
    }

    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error("GET /api/contacts error", error);
    return NextResponse.json({ success: false, message: "Cannot fetch contacts" }, { status: 500 });
  }
}
