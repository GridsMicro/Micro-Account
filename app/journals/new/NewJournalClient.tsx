"use client";

import { useState } from "react";
import { BookOpen, Save, ChevronRight, Plus, Trash2, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createJournalEntry } from "@/app/actions";

export default function NewJournalClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  
  const [lines, setLines] = useState([
    { id: 1, account_name: "", type: "debit", amount: "" },
    { id: 2, account_name: "", type: "credit", amount: "" }
  ]);

  const totalDebit = lines
    .filter((l) => l.type === "debit")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
  const totalCredit = lines
    .filter((l) => l.type === "credit")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => {
    setLines([...lines, { id: Date.now(), account_name: "", type: "debit", amount: "" }]);
  };

  const updateLine = (id: number, field: string, value: any) => {
    setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
  };

  const removeLine = (id: number) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("ยอดรวมด้านรายจ่ายและรายรับต้องเท่ากัน และมากกว่า 0 บาท");
      return;
    }
    
    setLoading(true);

    try {
      for (const line of lines) {
        if (!line.account_name || !line.amount) continue;

        const payload = {
          entry_date: entryDate,
          reference_no: referenceNo,
          account_name: line.account_name,
          description: description,
          debit: line.type === "debit" ? Number(line.amount) : 0,
          credit: line.type === "credit" ? Number(line.amount) : 0
        };

        const result = await createJournalEntry(payload);
        if (!result.success) throw new Error(result.error);
      }
      
      router.push("/journals");
      router.refresh();

    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกรายการ: " + error.message);
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                 <BookOpen className="text-blue-600" /> บันทึกรายการรายรับ-รายจ่าย
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 font-medium">
                 <Link href="/journals" className="text-blue-500 hover:underline">สมุดรายวัน</Link>
                 <ChevronRight size={12} />
                 <span>เพิ่มรายการใหม่</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/journals" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
               </Link>
              <button 
                type="submit" 
                disabled={loading || !isBalanced}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={18} /> {loading ? "กำลังบันทึก..." : "บันทึกรายการ"}
              </button>
            </div>
          </div>

          {/* Tip Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800">
            <p className="font-bold mb-1">💡 วิธีใช้งาน:</p>
            <p>• บรรทัด <span className="font-bold text-blue-700">รายจ่าย</span> → ใส่ชื่อค่าใช้จ่าย เช่น <span className="italic">ค่าไปรษณีย์</span>, <span className="italic">ค่าน้ำมัน</span>, <span className="italic">ค่าโทรศัพท์</span></p>
            <p>• บรรทัด <span className="font-bold text-green-700">จ่ายออกจาก</span> → ใส่ช่องทางที่จ่าย เช่น <span className="italic">เงินสด</span>, <span className="italic">ธนาคารกสิกรไทย</span></p>
            <p>• ทั้งสองบรรทัด <span className="font-bold text-red-600">ต้องมียอดเงินเท่ากัน</span> ถึงจะกดบันทึกได้</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
             {/* General Info */}
             <div className="bg-white rounded shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600">📅 วันที่เกิดรายการ</label>
                      <input 
                        type="date" 
                        required
                        value={entryDate}
                        onChange={e => setEntryDate(e.target.value)}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600">🧾 เลขที่ใบเสร็จ / เอกสารอ้างอิง</label>
                      <input 
                        type="text" 
                        value={referenceNo}
                        onChange={e => setReferenceNo(e.target.value)}
                        placeholder="เช่น เลขที่ใบเสร็จ, PV-001"
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-600">📝 หมายเหตุ / คำอธิบาย</label>
                      <input 
                        type="text" 
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="เช่น ค่าส่งพัสดุลูกค้า มี.ค. 69"
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                      />
                   </div>
                </div>
             </div>

             {/* Booking Lines */}
             <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-bold text-gray-800 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <ArrowRightLeft size={18} className="text-blue-500" /> รายการค่าใช้จ่าย
                   </div>
                   <button 
                      type="button" 
                      onClick={addLine}
                      className="text-sm flex items-center gap-1 bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors font-bold"
                   >
                      <Plus size={14} /> เพิ่มบรรทัด
                   </button>
                </div>

                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-200">
                         <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อบัญชี / รายการ</th>
                         <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-44">ประเภท</th>
                         <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-48 text-right">จำนวนเงิน (บาท)</th>
                         <th className="px-6 py-3 w-16 text-center"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {lines.map((line) => (
                          <tr key={line.id} className={cn(line.type === 'credit' ? "bg-green-50/30" : "bg-blue-50/20")}>
                            <td className="px-4 py-3">
                               <input 
                                 type="text" 
                                 required
                                 placeholder={line.type === 'debit' ? "เช่น ค่าไปรษณีย์, ค่าน้ำมัน, ค่าโฆษณา" : "เช่น เงินสด, ธนาคารกสิกรไทย"}
                                 value={line.account_name}
                                 onChange={e => updateLine(line.id, 'account_name', e.target.value)}
                                 className="w-full h-10 px-3 border border-gray-200 bg-white focus:border-blue-500 rounded text-sm font-bold transition-all" 
                               />
                            </td>
                            <td className="px-4 py-3">
                               <select 
                                 value={line.type}
                                 onChange={e => updateLine(line.id, 'type', e.target.value)}
                                 className={cn(
                                    "w-full h-10 px-3 bg-white border border-gray-200 rounded text-sm font-bold focus:border-blue-500",
                                    line.type === 'debit' ? "text-blue-700" : "text-green-700"
                                 )}
                               >
                                  <option value="debit">💸 รายจ่าย (ค่าใช้จ่าย)</option>
                                  <option value="credit">🏦 จ่ายออกจาก (เงินสด/ธนาคาร)</option>
                               </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                               <input 
                                 type="number" 
                                 required
                                 min="0"
                                 step="0.01"
                                 placeholder="0.00"
                                 value={line.amount}
                                 onChange={e => updateLine(line.id, 'amount', e.target.value)}
                                 className="w-full text-right h-10 px-3 bg-white border border-gray-200 focus:border-blue-500 rounded text-sm font-black transition-all" 
                               />
                            </td>
                            <td className="px-4 py-3 text-center">
                               <button 
                                 type="button" 
                                 onClick={() => removeLine(line.id)}
                                 className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                                 disabled={lines.length <= 2}
                               >
                                  <Trash2 size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                     </tbody>
                     <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-right text-sm font-bold text-gray-600">
                             ยอดรวมทั้งหมด
                          </td>
                          <td className="px-4 py-4">
                             <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center justify-between w-full text-sm">
                                   <span className="text-blue-600 font-bold text-xs">💸 รายจ่าย</span>
                                   <span className="font-mono font-bold text-blue-700">฿{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex items-center justify-between w-full text-sm">
                                   <span className="text-green-600 font-bold text-xs">🏦 จ่ายออกจาก</span>
                                   <span className="font-mono font-bold text-green-700">฿{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="w-full h-0.5 bg-gray-200 mt-1 mb-1 relative">
                                   <div className={cn("absolute inset-y-0 left-0 transition-all duration-500", isBalanced ? "w-full bg-green-500" : "bg-red-400", !isBalanced && totalDebit > 0 ? "w-1/2" : "")}></div>
                                </div>
                                {isBalanced ? (
                                  <span className="text-xs text-green-600 font-bold">✅ ยอดถูกต้อง กดบันทึกได้เลย!</span>
                                ) : (
                                  <span className="text-xs text-red-500 font-bold">⚠️ ยอดสองฝั่งยังไม่เท่ากัน</span>
                                )}
                             </div>
                          </td>
                          <td></td>
                        </tr>
                     </tfoot>
                   </table>
                </div>
             </div>

          </div>
        </form>
      </div>
    </main>
  );
}
