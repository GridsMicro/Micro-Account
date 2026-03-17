"use client";

import { useState } from "react";
import { Pencil, Trash2, Save, X, ExternalLink, Calendar, FileText, Tag, Banknote, CheckCircle2 } from "lucide-react";
import { deleteJournalEntry, updateJournalEntry } from "@/app/actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface JournalEntry {
  id: number;
  entry_date: string;
  reference_no: string;
  account_name: string;
  description: string;
  debit: number;
  credit: number;
  receipt_url?: string | null;
}

export default function JournalEntryRow({ entry }: { entry: JournalEntry }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit form state
  const [accountName, setAccountName] = useState(entry.account_name);
  const [description, setDescription] = useState(entry.description);
  const [referenceNo, setReferenceNo] = useState(entry.reference_no || "");
  const [amount, setAmount] = useState(
    String(Number(entry.debit) > 0 ? entry.debit : entry.credit)
  );
  const [entryDate, setEntryDate] = useState(
    entry.entry_date ? new Date(entry.entry_date).toISOString().split("T")[0] : ""
  );

  const handleDelete = async () => {
    if (!confirm(`⚠️ ยืนยันการลบรายการ: "${entry.account_name}"?\nการกระทำนี้ไม่สามารถย้อนคืนได้`)) return;
    setLoading(true);
    try {
      const res = await deleteJournalEntry(entry.id);
      if (res.success) {
        router.refresh();
      } else {
        alert("❌ เกิดข้อผิดพลาด: " + res.error);
        setLoading(false);
      }
    } catch (err: any) {
      alert("❌ เกิดข้อผิดพลาดร้ายแรง: " + err.message);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const isDebit = Number(entry.debit) > 0;
    const res = await updateJournalEntry(entry.id, {
      entry_date: entryDate,
      reference_no: referenceNo,
      account_name: accountName,
      description: description,
      debit: isDebit ? Number(amount) : 0,
      credit: !isDebit ? Number(amount) : 0,
      receipt_url: entry.receipt_url,
    });
    setLoading(false);
    if (res.success) {
      setIsEditing(false);
    } else {
      alert("❌ บันทึกไม่สำเร็จ: " + res.error);
    }
  };

  // แถวโหมดแก้ไข (Premium Full Width Edit)
  if (isEditing) {
    return (
      <tr className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-l-4 border-blue-600 animate-in fade-in slide-in-from-top-1 duration-300">
        <td colSpan={6} className="p-8">
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-3 flex items-center justify-between">
              <h4 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Pencil size={14} /> แก้ไขข้อมูลรายการบัญชี
              </h4>
              <span className="text-[10px] text-blue-100 font-medium">ID: #{entry.id}</span>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* กลุ่มที่ 1: วันที่และอ้างอิง */}
                <div className="space-y-4 border-r border-gray-100 pr-0 md:pr-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={12} className="text-blue-500" /> วันที่ทำรายการ
                      </label>
                      <input
                        type="date"
                        value={entryDate}
                        onChange={e => setEntryDate(e.target.value)}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-gray-700"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={12} className="text-blue-500" /> เลขที่เอกสารอ้างอิง
                      </label>
                      <input
                        value={referenceNo}
                        onChange={e => setReferenceNo(e.target.value)}
                        placeholder="เช่น RCPT#12345"
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono text-sm"
                      />
                   </div>
                </div>

                {/* กลุ่มที่ 2: บัญชีและคำอธิบาย */}
                <div className="md:col-span-1 space-y-4 border-r border-gray-100 pr-0 md:pr-6">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag size={12} className="text-blue-500" /> ชื่อบัญชี
                      </label>
                      <input
                        value={accountName}
                        onChange={e => setAccountName(e.target.value)}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-black text-gray-800"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={12} className="text-blue-500" /> รายละเอียด (Description)
                      </label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={1}
                        className="w-full min-h-11 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all italic text-sm text-gray-600"
                      />
                   </div>
                </div>

                {/* กลุ่มที่ 3: ยอดเงินและปุ่ม */}
                <div className="space-y-6">
                   <div className="space-y-1.5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                      <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Banknote size={12} /> ยอดเงินสุทธิ (บาท)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full h-12 bg-transparent text-right text-2xl font-black text-blue-700 outline-none placeholder:text-blue-200"
                      />
                   </div>
                   
                   <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 h-12 rounded-xl border-2 border-gray-100 font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all flex items-center justify-center gap-2"
                      >
                        <X size={16} /> ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="flex-[2] h-12 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                      >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={16} />}
                        {loading ? "กำลังบันทึก..." : "อัปเดตข้อมูล"}
                      </button>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  // แถวปกติ (Clean & Modern)
  return (
    <tr className="hover:bg-blue-50/30 transition-all group border-b border-gray-100/50 relative">
      <td className="px-6 py-5">
         <div className="text-sm font-bold text-gray-700 flex flex-col">
           {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('th-TH') : '-'}
           <span className="text-[9px] text-gray-400 font-medium">#{entry.id}</span>
         </div>
      </td>
      <td className="px-6 py-5">
         <span className="text-[10px] font-black tracking-widest bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200 block w-fit shadow-sm">
            {entry.reference_no || '-'}
         </span>
      </td>
      <td className="px-6 py-5">
         <div className={cn("flex flex-col max-w-md", Number(entry.credit) > 0 ? "ml-10 pl-4 border-l-2 border-green-100" : "border-l-2 border-blue-500 pl-4")}>
            <span className="font-black text-gray-800 text-sm tracking-tight">{entry.account_name}</span>
            <span className="text-[11px] text-gray-400 italic mt-0.5 line-clamp-1">{entry.description}</span>
         </div>
      </td>
      <td className="px-6 py-5 text-right">
         {Number(entry.debit) > 0 ? (
           <span className="font-black text-blue-600 text-base">฿{Number(entry.debit).toLocaleString()}</span>
         ) : <span className="text-gray-200">-</span>}
      </td>
      <td className="px-6 py-5 text-right">
         {Number(entry.credit) > 0 ? (
           <span className="font-black text-green-600 text-base">฿{Number(entry.credit).toLocaleString()}</span>
         ) : <span className="text-gray-200">-</span>}
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
          {entry.receipt_url && (
            <a
              href={entry.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-500 rounded-xl transition-all border border-blue-50 hover:border-blue-500 shadow-sm"
              title="ดูใบเสร็จ"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 rounded-xl transition-all border border-gray-100 hover:border-blue-600 shadow-sm"
            title="แก้ไขรายการ"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-gray-50 hover:border-red-500 shadow-sm disabled:opacity-40"
            title="ลบรายการ"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
