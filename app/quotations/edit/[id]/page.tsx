import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import EditQuotationClient from "./EditQuotationClient";

export const dynamic = 'force-dynamic';

async function getQuotation(id: string) {
  try {
    const res = await query(`
      SELECT q.*, c.name as customer_name 
      FROM quotations q 
      LEFT JOIN contacts c ON q.contact_id = c.id 
      WHERE q.id = $1
    `, [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    notFound();
  }

  return <EditQuotationClient quotation={quotation} />;
}
