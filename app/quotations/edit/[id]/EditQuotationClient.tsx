"use client";

import { 
  FileText, 
  Save, 
  User, 
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { updateQuotation } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function EditQuotationClient({ quotation }: { quotation: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(quotation.status || "pending");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateQuotation(quotation.id, { status });
    setLoading(false);
    if (res.success) {
      router.push("/quotations");
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลใบเสนอราคา");
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                 แก้ไขใบเสนอราคา: <span className="text-blue-600">{quotation.quotation_number}</span>
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
                 <Link href="/quotations" className="text-blue-500 hover:underline">Quotations</Link>
                 <ChevronRight size={10} />
                 <span>Edit Quotation</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/quotations" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
               </Link>
              <button 
                type="submit" 
                disabled={loading}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
              >
                <Save size={18} /> {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-700">
                     <User size={18} /> ข้อมูลลูกค้า / คู่ค้า
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ลูกค้ารายการเดิม</label>
                        <input 
                          type="text" 
                          readOnly 
                          defaultValue={quotation.customer_name || 'ไม่ระบุ'} 
                          className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded text-sm font-bold text-gray-600 outline-none" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">สถานะเอกสาร</label>
                        <select 
                          value={status}
                          onChange={e => setStatus(e.target.value)}
                          className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold"
                        >
                           <option value="pending">Pending (รอการตอบกลับ)</option>
                           <option value="sent">Sent (ส่งใบเสนอราคาแล้ว)</option>
                           <option value="accepted">Accepted (ลูกค้าตกลง)</option>
                           <option value="rejected">Rejected (ยกเลิกงาน)</option>
                        </select>
                     </div>
                  </div>
              </div>

              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden text-gray-700">
                  <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                     <h3 className="font-bold flex items-center gap-2">
                        <FileText size={18} /> รายการเสนอราคา (Items)
                     </h3>
                  </div>
                  <div className="p-8 italic text-sm text-gray-500">
                     ยอดรวมคงที่: ฿{Number(quotation.total_amount).toLocaleString()}
                  </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200 text-center">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">Total Amount</p>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter">฿{Number(quotation.total_amount).toLocaleString()}</p>
               </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
