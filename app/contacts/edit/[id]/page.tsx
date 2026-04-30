import { query } from "@/lib/db";
import EditContactClient from "./EditContactClient";
import Link from "next/link";
import { ArrowLeft, UserX, AlertTriangle } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getContact(id: string) {
  const res = await query('SELECT * FROM contacts WHERE id = $1', [id]);
  return res.rows[0];
}

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let contact: any = null;
  let error: string | null = null;

  try {
    contact = await getContact(id);
  } catch (e: any) {
    console.error("[EditContactPage] Database error:", e);
    error = e?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล";
  }

  if (error) {
    return (
      <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">เกิดข้อผิดพลาด</h1>
          <p className="text-slate-500">{error}</p>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all"
          >
            <ArrowLeft size={18} />
            กลับไปหน้าลูกค้าและคู่ค้า
          </Link>
        </div>
      </main>
    );
  }

  if (!contact) {
    return (
      <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mx-auto">
            <UserX className="w-10 h-10 text-violet-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">ไม่พบรายชื่อผู้ติดต่อ</h1>
          <p className="text-slate-500">
            ไม่พบข้อมูลผู้ติดต่อที่มีรหัส <span className="font-mono font-bold text-violet-600">{id}</span> ในระบบ
          </p>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-all"
          >
            <ArrowLeft size={18} />
            กลับไปหน้าลูกค้าและคู่ค้า
          </Link>
        </div>
      </main>
    );
  }

  return <EditContactClient contact={contact} />;
}
