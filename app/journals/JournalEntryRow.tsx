"use client";

import { useState } from "react";
import { Pencil, Trash2, Save, X, ExternalLink } from "lucide-react";
import { deleteJournalEntry, updateJournalEntry } from "@/app/actions";
import { cn } from "@/lib/utils";

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
    if (!confirm(`ยืนยันการลบรายการ "${entry.account_name}" ใช่ไหม?`)) return;
    setLoading(true);
    const res = await deleteJournalEntry(entry.id);
    if (!res.success) {
      alert("เกิดข้อผิดพลาด: " + res.error);
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
      alert("เกิดข้อผิดพลาด: " + res.error);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-blue-50/50">
        <td colSpan={6} className="px-6 py-6 border-y-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">วันที่รายการ</label>
              <input
                type="date"
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">เลขที่เอกสาร</label>
              <input
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                placeholder="RCPT-XXXX"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5 focus-within:text-blue-600">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ชื่อบัญชีและคำอธิบาย</label>
              <div className="space-y-2">
                <input
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  placeholder="ชื่อบัญชี"
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold"
                />
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all italic"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ยอดเงิน (บาท)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-right font-black focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-blue-700"
              />
            </div>
            <div className="flex items-end justify-end gap-2 h-full pb-0.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 md:flex-none h-10 px-4 border border-gray-300 rounded-lg text-xs font-bold text-gray-500 hover:bg-white hover:text-gray-700 flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <X size={14} /> ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 md:flex-none h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50"
              >
                {loading ? <span className="animate-spin text-lg">⏳</span> : <Save size={14} />} 
                {loading ? "กำลังบันทึก" : "บันทึกข้อมูล"}
              </button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-blue-50/30 transition-colors group border-b border-gray-100">
      <td className="px-6 py-4 text-sm font-bold text-gray-700">
         {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('th-TH') : '-'}
      </td>
      <td className="px-6 py-4">
         <span className="text-[10px] font-black tracking-widest bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
            {entry.reference_no || '-'}
         </span>
      </td>
      <td className="px-6 py-4">
         <div className={cn("flex flex-col", Number(entry.credit) > 0 ? "ml-8" : "")}>
            <span className="font-bold text-gray-800">{entry.account_name}</span>
            <span className="text-xs text-gray-500 italic mt-0.5">{entry.description}</span>
         </div>
      </td>
      <td className="px-6 py-4 text-right font-bold text-blue-700">
         {Number(entry.debit) > 0 ? `฿${Number(entry.debit).toLocaleString()}` : '-'}
      </td>
      <td className="px-6 py-4 text-right font-bold text-green-700">
         {Number(entry.credit) > 0 ? `฿${Number(entry.credit).toLocaleString()}` : '-'}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {entry.receipt_url && (
            <a
              href={entry.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              title="ดูใบเสร็จ"
              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
            >
              <ExternalLink size={15} />
            </a>
          )}
          <button
            onClick={() => setIsEditing(true)}
            title="แก้ไขรายการ"
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-transparent hover:border-blue-200"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            title="ลบรายการ"
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-40"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}
