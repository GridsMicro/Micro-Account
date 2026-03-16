import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import EditInvoiceClient from "./EditInvoiceClient";

export const dynamic = 'force-dynamic';

async function getInvoice(id: string) {
  try {
    const res = await query(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      LEFT JOIN contacts c ON i.contact_id = c.id 
      WHERE i.id = $1
    `, [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    notFound();
  }

  return <EditInvoiceClient invoice={invoice} />;
}
