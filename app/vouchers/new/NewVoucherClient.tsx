
"use client";

import { useState, useEffect } from "react";
import { 
  ScrollText, 
  Save, 
  ChevronRight, 
  Plus, 
  Trash2, 
  ArrowRightLeft, 
  Paperclip, 
  User, 
  Calendar, 
  CreditCard,
  Banknote,
  DollarSign,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createPaymentVoucher, getNextReferenceNo } from "@/app/actions";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";

const PAYMENT_METHODS = [
  { id: 'Cash', label: 'เงินสด', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Bank Transfer', label: 'โอนเงินผ่านธนาคาร', icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Credit Card', label: 'บัตรเครดิต', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50' },
];

export default function NewVoucherClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [voucherNo, setVoucherNo] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");

  // Auto-generate Voucher Number
  useEffect(() => {
    const fetchRef = async () => {
      const res = await getNextReferenceNo('receipt'); // Use 'receipt' pattern for now, or add 'voucher'
      if (res.success && res.data) {
        // Change prefix to PV
        setVoucherNo(res.data.replace('REC', 'PV'));
      }
    };
    fetchRef();
  }, [issueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        voucher_no: voucherNo || "AUTO",
        payee_name: payeeName,
        issue_date: issueDate,
        amount: Number(amount),
        payment_method: paymentMethod,
        receipt_url: receiptUrl,
        status: 'Paid' // Default to Paid for simplicity in this demo
      };

      const result = await createPaymentVoucher(payload);
      if (!result.success) throw new Error(result.error);
      
      router.push("/vouchers");
      router.refresh();

    } catch (error: any) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fcfdff]">
      <div className="max-w-5xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2 text-left">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                   <Link href="/vouchers" className="hover:text-blue-600 transition-colors">VOUCHERS</Link>
                   <ChevronRight size={10} />
                   <span className="text-blue-600">ISSUE NEW PAYMENT VOUCHER</span>
                </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <span className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100">
                    <ScrollText className="text-white w-8 h-8" /> 
                  </span>
                  ออกใบสำคัญจ่ายใหม่
               </h1>
            </div>
            
            <div className="flex gap-3">
               <Link href="/vouchers" className="h-14 px-8 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                  ยกเลิก
               </Link>
               <button 
                type="submit" 
                disabled={loading}
                className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
               >
                 <Save size={20} /> {loading ? "กำลังบันทึก..." : "ยืนยันการจ่ายเงิน (Issue PV)"}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Main Info */}
             <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                
                <div className="bg-white rounded-3xl p-10 shadow-sm border border-blue-50/50 space-y-10 text-left">
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <User size={12} className="text-blue-500" /> ชื่อผู้รับเงิน (Payee Name)
                         </label>
                         <input 
                           type="text" 
                           required
                           value={payeeName}
                           onChange={e => setPayeeName(e.target.value)}
                           placeholder="ชื่อบุคคล หรือบริษัทผู้รับเงิน..."
                           className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-bold text-slate-800 transition-all text-lg" 
                         />
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Calendar size={12} className="text-blue-500" /> วันที่ทำรายการ
                         </label>
                         <input 
                           type="date" 
                           required
                           value={issueDate}
                           onChange={e => setIssueDate(e.target.value)}
                           className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-black text-slate-800 transition-all" 
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Plus size={12} className="text-blue-500" /> เลขที่ใบสำคัญ
                         </label>
                         <input 
                           type="text" 
                           value={voucherNo}
                           onChange={e => setVoucherNo(e.target.value)}
                           placeholder="AUTO-PV-XXXX"
                           className="w-full h-14 px-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-blue-100 outline-none font-mono font-black text-blue-600 transition-all uppercase" 
                         />
                      </div>

                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <DollarSign size={12} className="text-emerald-500" /> จำนวนเงินจ่ายสุทธิ (Amount)
                         </label>
                         <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-emerald-500 text-xl transition-colors">฿</span>
                            <input 
                              type="number" 
                              required
                              step="0.01"
                              value={amount}
                              onChange={e => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full h-14 pl-12 pr-6 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none font-black text-slate-900 text-2xl transition-all" 
                            />
                         </div>
                      </div>
                   </div>

                   <div className="h-px bg-slate-50"></div>

                   <div className="space-y-6">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                         <CreditCard size={12} className="text-blue-500" /> ช่องทางการชำระเงิน
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         {PAYMENT_METHODS.map(method => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPaymentMethod(method.id)}
                              className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3",
                                paymentMethod === method.id 
                                  ? "border-blue-500 bg-blue-50 shadow-inner" 
                                  : "border-slate-50 hover:border-blue-100 bg-white"
                              )}
                            >
                               <div className={cn("p-3 rounded-xl", method.bg)}>
                                  <method.icon size={24} className={method.color} />
                               </div>
                               <span className={cn("text-xs font-black uppercase tracking-widest", paymentMethod === method.id ? "text-blue-900" : "text-slate-400")}>
                                  {method.label}
                               </span>
                            </button>
                         ))}
                      </div>
                   </div>

                </div>
             </div>

             {/* Sidebar Actions */}
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                
                {/* Visual Receipt Attachment */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-6 text-left">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Paperclip size={12} className="text-blue-500" /> เอกสารยืนยันการจ่าย
                      </label>
                      <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Optional</span>
                   </div>
                   
                   <GoogleDrivePicker
                      value={receiptUrl}
                      onChange={(url, name) => { setReceiptUrl(url); setReceiptFileName(name); }}
                      onClear={() => { setReceiptUrl(""); setReceiptFileName(""); }}
                   />
                   
                   <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <AlertCircle size={14} className="text-slate-400 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                         การแนบสลิปโอนเงินจะช่วยให้ฝ่ายบัญชีตรวจสอบยอดได้รวดเร็วขึ้น 200%
                      </p>
                   </div>
                </div>

                {/* Automation Summary Card */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden text-left">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                   
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8">Voucher Insight</h3>
                   
                   <div className="space-y-6 relative z-10">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                         <span className="text-xs text-slate-400">สถานะเอกสาร</span>
                         <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">AUTO-PAID</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-white/5">
                         <span className="text-xs text-slate-400">สรุปยอดที่จ่าย</span>
                         <span className="text-sm font-black text-white italic">฿{Number(amount || 0).toLocaleString()}</span>
                      </div>
                   </div>

                   <p className="mt-12 text-[9px] text-slate-500 font-medium leading-relaxed italic border-t border-white/5 pt-6">
                      "Autonomous Accounting: บันทึกรายการนี้จะถูกรวบรวมเข้าสมุดรายวันโดยอัตโนมัติเมื่อทำการโพสต์"
                   </p>
                </div>

             </div>

          </div>
        </form>
      </div>
    </main>
  );
}
