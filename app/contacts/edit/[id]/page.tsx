import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import EditContactClient from "./EditContactClient";

export const dynamic = 'force-dynamic';

async function getContact(id: string) {
  try {
    const res = await query('SELECT * FROM contacts WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  return <EditContactClient contact={contact} />;
}
