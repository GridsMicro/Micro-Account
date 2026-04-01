"use client";

import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteProduct } from "@/app/actions";
import { useState } from "react";

export default function InventoryRowActions({ id, name }: { id: string | number, name: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`คุณต้องการลบสินค้า "${name}" ใช่หรือไม่?`)) return;
    
    setIsDeleting(true);
    const res = await deleteProduct(id);
    if (!res.success) {
      alert("ไม่สามารถลบสินค้าได้: " + res.error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-3 translate-x-3 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100">
      <Link 
        href={`/inventory/edit/${id}`} 
        className="p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-lg transition-all shadow-sm"
      >
        <Edit size={16} />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-3 bg-rose-50 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
      >
        <Trash2 size={16} className={isDeleting ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}
