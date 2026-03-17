
"use client";

import { useState, useEffect } from "react";
import { BookOpen, Save, ChevronRight, Plus, Trash2, ArrowRightLeft, Paperclip, ShoppingCart, Wallet, Truck, Banknote, Library } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createJournalEntry, getAccounts, getNextReferenceNo } from "@/app/actions";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";

const JOURNAL_BOOKS = [
  { id: 'sales', label: 'สมุดรายวันขาย (Sales)', icon: ShoppingCart, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'receipt', label: 'สมุดรายวันรับเงิน (Receipt)', icon: Wallet, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  { id: 'purchase', label: 'สมุดรายวันซื้อ (Purchase)', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { id: 'payment', label: 'สมุดรายวันจ่ายเงิน (Payment)', icon: Banknote, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'general', label: 'สมุดรายวันทั่วไป (General)', icon: Library, color: 'text-slate-600', bg: 'bg-slate-50' },
];

export default function NewJournalClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [journalType, setJournalType] = useState('general');
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNo, setReferenceNo] = useState("");
  const [description, setDescription] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSearchLine, setActiveSearchLine] = useState<number | null>(null);

  const [lines, setLines] = useState([
    { id: 1, account_name: "", type: "debit", amount: "" },
    { id: 2, account_name: "", type: "credit", amount: "" }
  ]);

  const fetchSuggestions = async (search: string, lineId: number) => {
    setActiveSearchLine(lineId);
    if (!search) {
      setSuggestions([]);
      return;
    }
    const res = await getAccounts(search);
    if (res.success) {
      setSuggestions(res.data || []);
    }
  };

  const selectAccount = (lineId: number, account: any) => {
    setLines(lines.map(line => 
      line.id === lineId 
        ? { ...line, account_name: `[${account.code}] ${account.name}` } 
        : line
    ));
    setSuggestions([]);
    setActiveSearchLine(null);
  };

  // Auto-generate Reference Number from Pattern
  useEffect(() => {
    const fetchRef = async () => {
      const res = await getNextReferenceNo(journalType);
      if (res.success && res.data) {
        setReferenceNo(res.data);
      }
    };
    fetchRef();
  }, [journalType, entryDate]);

  const totalDebit = lines
    .filter((l) => l.type === "debit")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    
  const totalCredit = lines
    .filter((l) => l.type === "credit")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

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
      alert("ยอดรวมด้านเดบิต (Dr.) และเครดิต (Cr.) ต้องเท่ากัน");
      return;
    }
    
    setLoading(true);

    try {
      // Create all entries as one Voucher (grouped by reference_no)
      for (const line of lines) {
        if (!line.account_name || !line.amount) continue;

        const payload = {
          entry_date: entryDate,
          reference_no: referenceNo || "AUTO",
          account_name: line.account_name,
          description: description,
          debit: line.type === "debit" ? Number(line.amount) : 0,
          credit: line.type === "credit" ? Number(line.amount) : 0,
          receipt_url: receiptUrl || null,
          journal_type: journalType
        };

        const result = await createJournalEntry(payload);
        if (!result.success) throw new Error(result.error);
      }
      
      router.push(`/journals?type=${journalType}`);
      router.refresh();

    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการบันทึกรายการ: " + error.message);
      setLoading(false);
    }
  };

  const activeBook = JOURNAL_BOOKS.find(b => b.id === journalType)!;

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Header Dashboard Style */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                   <Link href="/journals" className="hover:text-violet-600 transition-colors">DAILY JOURNALS</Link>
                   <ChevronRight size={10} />
                   <span className="text-violet-600">NEW VOUCHER ENTRY</span>
                </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <span className={cn("p-3 rounded-xl shadow-lg transition-all", activeBook.bg)}>
                    <activeBook.icon className={cn("w-8 h-8", activeBook.color)} />
                  </span>
                  บันทึกใบสำคัญ (Voucher)
               </h1>
            </div>
            
            <div className="flex gap-3">
               <Link href="/journals" className="h-14 px-8 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                  ยกเลิก
               </Link>
               <button 
                type="submit" 
                disabled={loading || !isBalanced}
                className="h-14 px-10 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-30 disabled:translate-y-0"
               >
                 <Save size={20} /> {loading ? "กำลังบันทึก..." : "ลงบัญชี (Post Voucher)"}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Left Column: Voucher Info */}
             <div className="lg:col-span-2 space-y-8">
                
                {/* Book Selection & Meta */}
                <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-left">
                      
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Library size={12} className="text-violet-500" /> เลือกสมุดรายวัน
                         </label>
                         <div className="grid grid-cols-1 gap-2">
                            {JOURNAL_BOOKS.map(book => (
                               <button
                                 key={book.id}
                                 type="button"
                                 onClick={() => setJournalType(book.id)}
                                 className={cn(
                                   "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                                   journalType === book.id 
                                     ? "border-violet-600 bg-violet-50 shadow-inner" 
                                     : "border-slate-50 hover:border-violet-100"
                                 )}
                               >
                                  <book.icon size={20} className={journalType === book.id ? "text-violet-600" : "text-slate-400"} />
                                  <div>
                                     <p className={cn("text-sm font-black", journalType === book.id ? "text-violet-900" : "text-slate-600")}>{book.label}</p>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cloud Ledger Selection</p>
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <activeBook.icon size={12} className="text-violet-500" /> วันที่ใบสำคัญ
                            </label>
                            <input 
                              type="date" 
                              required
                              value={entryDate}
                              onChange={e => setEntryDate(e.target.value)}
                              className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-violet-100 outline-none font-black text-slate-800 transition-all" 
                            />
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                               <activeBook.icon size={12} className="text-violet-500" /> เลขที่ใบสำคัญ (Voucher No.)
                            </label>
                            <input 
                              type="text" 
                              value={referenceNo}
                              onChange={e => setReferenceNo(e.target.value)}
                              placeholder="AUTO-GENERATED"
                              className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-violet-100 outline-none font-mono font-black text-violet-600 placeholder:text-slate-300 transition-all uppercase" 
                            />
                         </div>
                      </div>
                   </div>

                   <div className="h-px bg-slate-50"></div>

                   <div className="space-y-4 text-left">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <activeBook.icon size={12} className="text-violet-500" /> คำอธิบายรายการ (Narrative)
                      </label>
                      <textarea 
                        required
                        rows={2}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="กรุณาระบุรายละเอียดการบันทึกบัญชี..."
                        className="w-full p-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-violet-100 outline-none font-medium text-slate-700 placeholder:text-slate-300 transition-all italic text-lg shadow-inner" 
                      />
                   </div>
                </div>

                {/* Booking Lines Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden text-left">
                   <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-3 tracking-tight">
                         <ArrowRightLeft className="text-blue-600" /> รายการบันทึกบัญชีDr./Cr.
                      </h3>
                      <button 
                        type="button" 
                        onClick={addLine}
                        className="h-10 px-5 bg-blue-50 text-blue-600 font-black rounded-lg hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 text-xs"
                      >
                         <Plus size={16} /> เพิ่มบรรทัด
                      </button>
                   </div>

                   <div className="overflow-x-auto">
                      <table className="w-full">
                         <thead>
                            <tr className="bg-slate-50/50">
                               <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อบัญชี</th>
                               <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">ฝั่งบัญชี</th>
                               <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-48">จำนวนเงิน</th>
                               <th className="px-6 py-5 w-16"></th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {lines.map((line) => (
                               <tr key={line.id} className={cn("transition-colors group", line.type === 'credit' ? "bg-green-50/5" : "bg-blue-50/5")}>
                                  <td className="px-8 py-5 relative">
                                     <input 
                                       type="text" 
                                       required
                                       placeholder="พิมพ์ชื่อบัญชีหรือรหัส..."
                                       value={line.account_name}
                                       onChange={e => {
                                          updateLine(line.id, 'account_name', e.target.value);
                                          fetchSuggestions(e.target.value, line.id);
                                       }}
                                       onFocus={() => fetchSuggestions(line.account_name, line.id)}
                                       className="w-full h-12 px-4 bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none font-black text-slate-800 transition-all" 
                                     />
                                     {/* Simple Suggestion Dropdown */}
                                     {activeSearchLine === line.id && suggestions.length > 0 && (
                                       <div className="absolute top-full left-8 right-8 bg-white shadow-2xl rounded-xl border border-slate-100 mt-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ผังบัญชีที่พบ ({suggestions.length})</span>
                                          </div>
                                          <div className="max-h-64 overflow-y-auto">
                                             {suggestions.map((acc) => (
                                                <button
                                                  key={acc.id}
                                                  type="button"
                                                  onClick={() => selectAccount(line.id, acc)}
                                                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-50 transition-colors text-left"
                                                >
                                                   <div className="flex flex-col">
                                                      <span className="text-sm font-black text-slate-800">{acc.name}</span>
                                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">CODE: {acc.code}</span>
                                                   </div>
                                                   <span className={cn(
                                                      "text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest",
                                                      acc.category === 'Asset' ? 'bg-blue-100 text-blue-600' :
                                                      acc.category === 'Revenue' ? 'bg-emerald-100 text-emerald-600' :
                                                      'bg-slate-100 text-slate-500'
                                                   )}>
                                                      {acc.category}
                                                   </span>
                                                </button>
                                             ))}
                                          </div>
                                       </div>
                                     )}
                                  </td>
                                  <td className="px-4 py-5">
                                     <select 
                                       value={line.type}
                                       onChange={e => updateLine(line.id, 'type', e.target.value)}
                                       className={cn(
                                          "w-full h-12 px-4 bg-white border-2 border-slate-50 rounded-lg text-xs font-black focus:border-blue-500 outline-none transition-all",
                                          line.type === 'debit' ? "text-blue-600" : "text-green-600"
                                       )}
                                     >
                                        <option value="debit">DEBIT (Dr.)</option>
                                        <option value="credit">CREDIT (Cr.)</option>
                                     </select>
                                  </td>
                                  <td className="px-8 py-5">
                                     <input 
                                       type="number" 
                                       required
                                       step="0.01"
                                       placeholder="0.00"
                                       value={line.amount}
                                       onChange={e => updateLine(line.id, 'amount', e.target.value)}
                                       className="w-full h-12 bg-transparent text-right font-black text-xl text-slate-900 focus:text-blue-600 outline-none transition-all" 
                                     />
                                  </td>
                                  <td className="px-4 py-5 text-center">
                                     <button 
                                       type="button" 
                                       onClick={() => removeLine(line.id)}
                                       className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                       disabled={lines.length <= 2}
                                     >
                                        <Trash2 size={16} />
                                     </button>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                         <tfoot>
                            <tr className="bg-slate-900 text-white">
                               <td className="px-10 py-8 text-sm font-black uppercase tracking-widest text-slate-400">Total Balanced Check</td>
                               <td className="px-4 py-8">
                                  <div className="flex flex-col gap-1 items-end">
                                     <span className="text-[10px] font-black text-blue-400">TOTAL DEBIT</span>
                                     <span className="text-[10px] font-black text-green-400">TOTAL CREDIT</span>
                                  </div>
                               </td>
                               <td className="px-10 py-8 text-right font-mono font-black text-2xl">
                                  <div className="flex flex-col gap-1 items-end">
                                     <span className="text-blue-400">฿{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                     <span className="text-green-400">฿{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                  </div>
                               </td>
                               <td></td>
                            </tr>
                         </tfoot>
                      </table>
                   </div>
                </div>
             </div>

             {/* Right Column: Attachment & Guide */}
             <div className="space-y-8">
                
                {/* Status Card */}
                <div className={cn(
                  "p-10 rounded-3xl text-center shadow-xl transition-all duration-700",
                  isBalanced ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-white text-slate-400 border border-slate-100"
                )}>
                   <div className="mb-6 flex justify-center">
                      <div className={cn("w-20 h-20 rounded-xl flex items-center justify-center border-4", isBalanced ? "border-white" : "border-slate-100")}>
                         {isBalanced ? <Save size={40} /> : <ArrowRightLeft size={40} />}
                      </div>
                   </div>
                   <h3 className="text-xl font-black mb-2">{isBalanced ? "พร้อมบันทึกรายการ!" : "บัญชียังไม่สมดุล"}</h3>
                   <p className="text-sm font-medium opacity-80 leading-relaxed">
                      {isBalanced 
                        ? "ยอดสองฝั่งตรงกันเป๊ะตามหลักการบัญชีคู่แล้วครับ" 
                        : "กรุณาตรวจสอบให้ยอดเดบิตและเครดิตเท่ากันก่อนทำการบันทึก"}
                   </p>
                </div>

                {/* Attachment Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-4 text-left">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Paperclip size={12} className="text-blue-500" /> แนบเอกสารอ้างอิง
                   </label>
                   <GoogleDrivePicker
                      value={receiptUrl}
                      onChange={(url, name) => { setReceiptUrl(url); setReceiptFileName(name); }}
                      onClear={() => { setReceiptUrl(""); setReceiptFileName(""); }}
                   />
                   <p className="text-[10px] text-slate-400 leading-relaxed italic">แนะนำให้แนบไฟล์เพื่อให้ระบบตรวจสอบ (Audit) ได้ในอนาคต</p>
                </div>

                {/* Accrevo Guide Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden text-left">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <div className="w-1 h-4 bg-blue-500"></div> QUICK GUIDE
                   </h3>
                   <div className="space-y-6">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Debit (Dr.)</p>
                         <p className="text-sm font-medium text-slate-300">สินทรัพย์เพิ่ม, ทุนลด, ค่าใช้จ่ายเพิ่ม</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Credit (Cr.)</p>
                         <p className="text-sm font-medium text-slate-300">สินทรัพย์ลด, ทุนเพิ่ม, รายได้เพิ่ม</p>
                      </div>
                   </div>
                </div>
             </div>

          </div>
        </form>
      </div>
    </main>
  );
}
