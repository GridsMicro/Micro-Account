"use client";

import { useState } from "react";
import { BookOpen, Save, ChevronRight, Plus, Trash2, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createJournalEntry } from "@/app/actions"; // Assuming this will exist

export default function NewJournalClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  
  // Rows for accounts
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
      alert("ยอดรวมด้านเดบิต (Dr.) และเครดิต (Cr.) ต้องเท่ากันและมากกว่า 0");
      return;
    }
    
    setLoading(true);

    try {
      // Loop create lines
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
      alert("เกิดข้อผิดพลาดในการบันทึกบัญชี: " + error.message);
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
                 <BookOpen className="text-blue-600" /> ลงรายการบัญชีรายวัน (New Entry)
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
                 <Link href="/journals" className="text-blue-500 hover:underline">General Journal</Link>
                 <ChevronRight size={10} />
                 <span>New Entry</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/journals" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
               </Link>
              <button 
                type="submit" 
                disabled={loading || !isBalanced}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
              >
                <Save size={18} /> {loading ? "กำลังบันทึก..." : "โพสต์ลงบัญชี (Post GL)"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* General Info */}
             <div className="col-span-1 lg:col-span-4 bg-white rounded shadow-sm border border-gray-200 p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">วันที่ (Date)</label>
                      <input 
                        type="date" 
                        required
                        value={entryDate}
                        onChange={e => setEntryDate(e.target.value)}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">เอกสารอ้างอิง (Ref. No)</label>
                      <input 
                        type="text" 
                        value={referenceNo}
                        onChange={e => setReferenceNo(e.target.value)}
                        placeholder="เช่น PV-001, INV-001"
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">คำอธิบายรายการ (Description)</label>
                      <input 
                        type="text" 
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="คำอธิบายสั้นๆ ของรายการค้านี้"
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                      />
                   </div>
                </div>
             </div>

             {/* Booking Lines */}
             <div className="col-span-1 lg:col-span-4 bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-200 font-bold text-blue-900 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <ArrowRightLeft size={18} /> รายการผังบัญชี (Account Lines)
                   </div>
                   <button 
                      type="button" 
                      onClick={addLine}
                      className="text-xs flex items-center gap-1 bg-white border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-colors uppercase tracking-widest"
                   >
                      <Plus size={12} /> เพิ่มรายการบรรทัด
                   </button>
                </div>

                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-gray-50/50 border-b border-gray-200">
                         <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">ชื่อบัญชี (Account)</th>
                         <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-32">ประเภท (Dr/Cr)</th>
                         <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-48 text-right">จำนวนเงิน (Amount)</th>
                         <th className="px-6 py-3 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] w-16 text-center"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                        {lines.map((line, index) => (
                          <tr key={line.id}>
                            <td className="px-4 py-2">
                               <input 
                                 type="text" 
                                 required
                                 placeholder="ค้นหาชื่อบัญชี หรือ รหัสบัญชี"
                                 value={line.account_name}
                                 onChange={e => updateLine(line.id, 'account_name', e.target.value)}
                                 className={cn(
                                   "w-full h-10 px-3 border border-transparent hover:border-gray-300 focus:border-blue-500 bg-transparent focus:bg-gray-50 rounded text-sm font-bold transition-all",
                                   line.type === 'credit' ? "ml-8" : ""
                                 )} 
                               />
                            </td>
                            <td className="px-4 py-2">
                               <select 
                                 value={line.type}
                                 onChange={e => updateLine(line.id, 'type', e.target.value)}
                                 className={cn(
                                    "w-full h-10 px-3 bg-transparent border border-transparent hover:border-gray-300 rounded text-xs font-black uppercase tracking-widest focus:border-blue-500 focus:bg-gray-50",
                                    line.type === 'debit' ? "text-blue-600" : "text-green-600"
                                 )}
                               >
                                  <option value="debit">เดบิต (Dr.)</option>
                                  <option value="credit">เครดิต (Cr.)</option>
                               </select>
                            </td>
                            <td className="px-4 py-2 text-right">
                               <input 
                                 type="number" 
                                 required
                                 min="0"
                                 step="0.01"
                                 value={line.amount}
                                 onChange={e => updateLine(line.id, 'amount', e.target.value)}
                                 className="w-full text-right h-10 px-3 bg-transparent border border-transparent hover:border-gray-300 focus:border-blue-500 focus:bg-gray-50 rounded text-sm font-black transition-all" 
                               />
                            </td>
                            <td className="px-4 py-2 text-center">
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
                     <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">
                             ยอดสรุปบัญชี (Total Balance)
                          </td>
                          <td className="px-6 py-4 flex flex-col items-end gap-1">
                             <div className="flex items-center justify-between w-full max-w-[200px] text-sm">
                                <span className="text-gray-500 font-bold text-xs">Dr.</span>
                                <span className="font-mono font-bold text-blue-700">฿{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                             </div>
                             <div className="flex items-center justify-between w-full max-w-[200px] text-sm">
                                <span className="text-gray-500 font-bold text-xs">Cr.</span>
                                <span className="font-mono font-bold text-green-700">฿{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                             </div>
                             {/* Line Indicator */}
                             <div className="w-full max-w-[200px] h-0.5 bg-gray-200 mt-1 mb-1 relative">
                                <div className={cn("absolute inset-y-0 left-0 transition-all", isBalanced ? "w-full bg-green-500" : "w-1/2 bg-red-500")}></div>
                             </div>
                             {!isBalanced && (
                               <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                                  ผลรวม Dr. / Cr. ไม่ดุลกัน
                               </span>
                             )}
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
