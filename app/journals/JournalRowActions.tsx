"use client";

import { useState } from "react";
import { Pencil, Trash2, Save, X, ExternalLink } from "lucide-react";
import { deleteJournalEntry, updateJournalEntry } from "@/app/actions";

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

export default function JournalRowActions({ entry }: { entry: JournalEntry }) {
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
    // revalidatePath will refresh the page
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
      <td colSpan={6} className="px-4 py-3 bg-blue-50/60 border-t-2 border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">วันที่</label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              className="w-full h-9 px-2 border border-blue-300 rounded text-sm bg-white focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">เลขที่เอกสาร</label>
            <input
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              className="w-full h-9 px-2 border border-blue-300 rounded text-sm bg-white focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ชื่อบัญชี</label>
            <input
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              className="w-full h-9 px-2 border border-blue-300 rounded text-sm bg-white font-bold focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">หมายเหตุ</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full h-9 px-2 border border-blue-300 rounded text-sm bg-white focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full h-9 px-2 border border-blue-300 rounded text-sm bg-white text-right font-bold focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="h-8 px-4 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-1 transition-colors"
          >
            <X size={14} /> ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="h-8 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </td>
    );
  }

  return (
    <td className="px-4 py-4 text-right">
      <div className="flex items-center justify-end gap-1">
        {entry.receipt_url && (
          <a
            href={entry.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            title="ดูใบเสร็จ"
            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        )}
        <button
          onClick={() => setIsEditing(true)}
          title="แก้ไขรายการ"
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          title="ลบรายการ"
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </td>
  );
}
