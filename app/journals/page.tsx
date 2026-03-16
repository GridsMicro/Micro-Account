import { query } from "@/lib/db";
import { BookOpen, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import JournalRowActions from "./JournalRowActions";
import ExportButton from "./ExportButton";

export const dynamic = 'force-dynamic';

export default async function JournalsPage() {
  let entries = [];
  try {
    const res = await query('SELECT * FROM journal_entries ORDER BY entry_date DESC, id ASC');
    entries = res.rows;
  } catch (e) {
    entries = [];
  }

  // Calculate totals
  const totalDebit = entries.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
  const totalCredit = entries.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
               <BookOpen className="text-blue-600" /> สมุดรายวันทั่วไป (General Journal)
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>บันทึกบัญชีรายการเดบิต (Dr.) และเครดิต (Cr.)</span>
            </div>
          </div>
          <div className="flex gap-2">
             <ExportButton />
             <Link href="/journals/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm">
                <Plus size={18} />
                ลงบัญชีใหม่ (New Entry)
             </Link>
          </div>
        </div>

        {/* GL Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
           <div className="bg-white border text-center border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Debit (Dr.)</h3>
              <p className="text-3xl font-bold text-blue-700">฿{totalDebit.toLocaleString()}</p>
           </div>
           <div className="bg-white border text-center border-gray-200 rounded p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Total Credit (Cr.)</h3>
              <p className="text-3xl font-bold text-green-700">฿{totalCredit.toLocaleString()}</p>
           </div>
        </div>

        {/* Journal Entries Table */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm flex items-center gap-2">
                 <Calendar size={16} className="text-blue-500" /> Journal Entries
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วัน/เดือน/ปี</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">เอกสารอ้างอิง</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อบัญชีและคำอธิบาย</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">เดบิต (Dr.)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">เครดิต (Cr.)</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-28">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {entries.length > 0 ? entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors group">
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
                      <JournalRowActions entry={entry} />
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-24 text-center text-gray-400 font-bold italic">
                         ยังไม่มีการบันทึกรายการบัญชีรายวัน
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           <p className="font-bold mb-1">© 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
           <p className="italic opacity-80">เราสร้าง Software เฉพาะทาง เพื่อขับเคลื่อนธุรกิจให้ก้าวล้ำ</p>
        </div>
      </div>
    </main>
  );
}
