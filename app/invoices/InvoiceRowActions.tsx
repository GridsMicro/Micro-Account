"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { FileText, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteInvoice } from "@/app/actions";

export default function InvoiceRowActions({ id, invoiceNumber }: { id: number | string; invoiceNumber?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isAuthorized = role === 'admin' || role === 'SUPER_ADMIN';

  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleDelete() {
    if (!confirm(`ยืนยันการลบใบแจ้งหนี้ ${invoiceNumber || id}?\n(การลบจะล้างรายการที่เกี่ยวข้องทั้งหมดและข้อมูลบัญชีที่เชื่อมไว้)`)) return;

    setIsDeleting(true);
    try {
      const res = await deleteInvoice(id);
      if (res.success) {
        alert("ลบใบแจ้งหนี้สำเร็จแล้วครับ!");
        router.refresh();
      } else {
        alert("ลบไม่สำเร็จ: " + (res.error || "Unknown"));
        setIsDeleting(false);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + (err.message || err));
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/invoices/preview/${id}`}
        className="p-2.5 bg-violet-600 text-white hover:bg-violet-700 rounded-lg transition-all shadow-md flex items-center gap-2 group/preview"
        title="Preview & Print PDF"
      >
        <FileText size={14} className="group-hover/preview:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-wider">Preview</span>
      </Link>
      <Link
        href={`/invoices/edit/${id}`}
        className="p-2.5 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-lg transition-all shadow-sm"
        title="Edit Invoice"
      >
        <Edit size={14} />
      </Link>
      {isAuthorized && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
          title="Delete Invoice"
          aria-label="Delete Invoice"
        >
          <Trash2 size={14} className={isDeleting ? "animate-pulse" : ""} />
        </button>
      )}
    </div>
  );
}
