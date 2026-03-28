'use client';

import { useState, useTransition } from 'react';
import { updateQuotationStatus, deleteQuotation } from "@/app/actions";
import { Edit, FileText, Trash2, CheckCircle, Send, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';

export default function QuotationRowActions({ id, status }: { id: number, status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusUpdate = async (newStatus: string) => {
    if (!confirm(`ต้องการเปลี่ยนสถานะเป็น ${newStatus.toUpperCase()} ใช่หรือไม่?`)) return;
    
    startTransition(async () => {
      const res = await updateQuotationStatus(id, newStatus);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDelete = async () => {
    if (!confirm(`⚠️ คำเตือน: คุณกำลังจะลบใบเสนอราคานี้ "ถาวร"\nและไม่สามารถกู้คืนได้\n\nยืนยันการลบทิ้งถาวรหรือไม่?`)) return;
    
    // Double confirmation for safety
    const confirmText = prompt('พิมพ์ "DELETE" เพื่อยืนยันการลบ');
    if (confirmText !== 'DELETE') return;

    startTransition(async () => {
      const res = await deleteQuotation(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 relative">
      
      {isPending && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
          <Loader2 className="animate-spin text-violet-600" size={16} />
        </div>
      )}

      {/* View/Print */}
      <Link 
        href={`/quotations/${id}/preview`} 
        title="ดู / พิมพ์"
        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm border border-slate-100"
      >
        <FileText size={16} />
      </Link>

      {/* Edit (Only if not cancelled) */}
      {status !== 'cancelled' && (
        <Link 
          href={`/quotations/edit/${id}`} 
          title="แก้ไข"
          className="p-2.5 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm border border-violet-100"
        >
          <Edit size={16} />
        </Link>
      )}

      {/* Mark as Sent */}
      {status === 'draft' && (
        <button 
          onClick={() => handleStatusUpdate('sent')}
          disabled={isPending}
          title="ทำเครื่องหมายว่าส่งแล้ว"
          className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-blue-100 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      )}

      {/* Cancel Action */}
      {status !== 'cancelled' ? (
        <button 
          onClick={() => handleStatusUpdate('cancelled')}
          disabled={isPending}
          title="ยกเลิกใบเสนอราคา"
          className="p-2.5 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm border border-rose-100 disabled:opacity-50"
        >
          <XCircle size={16} />
        </button>
      ) : (
        <button 
          onClick={() => handleStatusUpdate('draft')}
          disabled={isPending}
          title="กู้คืนเป็นฉบับร่าง"
          className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-600 hover:text-white rounded-xl transition-all shadow-sm border border-slate-200 disabled:opacity-50"
        >
          <CheckCircle size={16} />
        </button>
      )}

      {/* Permanent Delete Action */}
      <button 
        onClick={handleDelete}
        disabled={isPending}
        title="ลบทิ้งถาวร"
        className="p-2.5 bg-slate-900 text-white hover:bg-red-600 rounded-xl transition-all shadow-md shadow-slate-200 disabled:opacity-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
