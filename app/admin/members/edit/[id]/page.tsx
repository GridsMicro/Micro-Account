import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import EditMemberClient from "./EditMemberClient";

export const dynamic = 'force-dynamic';

async function getUser(id: string) {
  try {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    // Return dummy data if DB not setup
    if (id === '1') return { id: 1, name: "Administrator", email: "admin@microtronic.biz", role: "Super Admin", status: "Active" };
    if (id === '2') return { id: 2, name: "Urasaya Pruksanusak", email: "urasayap@gmail.com", role: "Editor", status: "Active" };
    if (id === '3') return { id: 3, name: "New Member", email: "pending@example.com", role: "Pending", status: "Inactive" };
    return null;
  }
}

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);

  if (!user) {
    notFound();
  }

  return <EditMemberClient user={user} />;
}
