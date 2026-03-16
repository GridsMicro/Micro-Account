"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  CreditCard,
  Building2, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  Search,
  Zap
} from "lucide-react";

export default function NewPaymentPage() {
  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <Link href="/payments" className="flex items-center gap-2 hover:text-white transition-colors">
                <ArrowLeft size={14} />
                PAYMENTS
              </Link>
              <ChevronRight size={14} className="text-slate-700" />
              <span className="text-slate-500">บันทึกการรับเงิน</span>
           </div>
           <div className="bg-white/5 px-4 py-2 rounded-xl flex items-center gap-3 border border-white/5">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure Payment Logs</span>
           </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div className="space-y-2 text-left">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               RECORD <span className="text-indigo-500">PAYMENT</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">บันทึกข้อมูลการรับชำระเงินเข้าสู่ระบบบัญชี</p>
          </div>
        </div>

        <div className="bg-[#0f172a] p-12 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden space-y-12">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/[0.03] rounded-bl-[8rem] -mr-16 -mt-16" />
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">เลือกลูกค้า / บริษัท</label>
                 <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <select className="w-full h-16 pl-14 pr-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all appearance-none">
                       <option>เลือกรายชื่อลูกค้า</option>
                       <option>หจก. พลังงานสะอาด</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">หมายเลขใบแจ้งหนี้ (Reference)</label>
                 <input type="text" className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all" placeholder="INV-2026-XXXX" />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">วันที่รับชำระเงิน</label>
                 <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <input type="date" className="w-full h-16 pl-14 pr-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">วิธีการชำระเงิน</label>
                 <div className="relative">
                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                    <select className="w-full h-16 pl-14 pr-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none appearance-none">
                       <option>โอนเข้าบัญชี (Bank Transfer)</option>
                       <option>เงินสด (Cash)</option>
                       <option>เช็ค (Cheque)</option>
                    </select>
                 </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                 <label className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] ml-2">จำนวนเงินที่ได้รับชำระ (Total Fixed)</label>
                 <div className="relative group">
                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black italic text-slate-700">฿</span>
                    <input type="number" className="w-full h-24 pl-16 pr-8 bg-slate-950 border border-white/10 rounded-[2rem] text-4xl font-black italic text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all" placeholder="0.00" />
                 </div>
              </div>
           </div>

           <div className="pt-10 flex flex-col md:flex-row gap-6">
              <button className="flex-1 h-20 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-3xl shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center justify-center gap-4 text-xl group">
                 <Save size={28} className="group-hover:translate-y-1 transition-transform" />
                 บันทึกประวัติการรับเงิน
              </button>
           </div>
           
           <div className="text-center pt-10 border-t border-white/5">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                 <Zap size={14} className="text-indigo-400" />
                 Auto-Sync with Neon Cloud
              </p>
           </div>
        </div>
        
        <div className="mt-12 text-center">
            <Building2 size={32} className="text-slate-800 mx-auto mb-2" />
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Microtronic Thailand Finance System</p>
        </div>
      </div>
    </main>
  );
}
