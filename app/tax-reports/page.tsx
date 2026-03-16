import { BarChart3, FileSpreadsheet, Download, Calendar, ArrowRight, Zap, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";

export default function TaxReportsPage() {
  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-indigo-400 font-black text-xs uppercase tracking-widest">
           <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
           <ArrowRight size={14} className="text-slate-700" />
           <span className="text-slate-500">Tax Reports</span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               TAX REPORT<span className="text-indigo-500">S</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">สรุปรายงานภาษีซื้อ-ภาษีขาย และวิเคราะห์ภาษีหัก ณ ที่จ่าย</p>
          </div>
          <div className="flex gap-4">
             <button className="h-16 px-8 bg-slate-900 hover:bg-slate-800 border border-white/5 text-white font-black rounded-2xl flex items-center gap-3 transition-all active:scale-95">
                <Calendar size={20} className="text-indigo-400" />
                Monthly Focus
             </button>
             <button className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-3 active:scale-95 group">
                <Download size={22} className="group-hover:translate-y-1 transition-transform" />
                Export EXCEL
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
           {/* VAT Card */}
           <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.03] rounded-bl-[5rem] -mr-12 -mt-12 transition-all group-hover:scale-110" />
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <BarChart3 size={32} />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">VAT System</p>
                       <p className="text-emerald-500 font-black italic">ภ.พ. 30</p>
                    </div>
                 </div>
                 
                 <h2 className="text-3xl font-black text-white mb-3 italic tracking-tighter">VALUE ADDED TAX</h2>
                 <p className="text-slate-400 font-bold mb-10 uppercase text-xs tracking-widest leading-relaxed">สรุปภาษีมูลค่าเพิ่มรายเดือน สำหรับการยื่นผ่านระบบสรรพากร</p>
                 
                 <div className="grid grid-cols-2 gap-6 mb-10">
                    <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                           <TrendingUp size={14} className="text-rose-500" />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Output Tax</p>
                        </div>
                        <p className="text-3xl font-black text-white italic tracking-tighter">฿0.00</p>
                    </div>
                    <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                           <TrendingUp size={14} className="text-emerald-500 rotate-180" />
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input Tax</p>
                        </div>
                        <p className="text-3xl font-black text-white italic tracking-tighter">฿0.00</p>
                    </div>
                 </div>
                 
                 <button className="w-full h-14 border border-white/10 font-black text-slate-400 rounded-2xl hover:bg-white/5 hover:text-white transition-all uppercase tracking-[0.2em] text-xs">
                    View Full ภ.พ. 30 Report
                 </button>
              </div>
           </div>

           {/* WHT Card */}
           <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/[0.03] rounded-bl-[5rem] -mr-12 -mt-12 transition-all group-hover:scale-110" />
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-10">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                        <FileSpreadsheet size={32} />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">WHT System</p>
                       <p className="text-amber-500 font-black italic">ภ.ง.ด. 53</p>
                    </div>
                 </div>
                 
                 <h2 className="text-3xl font-black text-white mb-3 italic tracking-tighter">WITHHOLDING TAX</h2>
                 <p className="text-slate-400 font-bold mb-10 uppercase text-xs tracking-widest leading-relaxed">รายงานภาษีถอน ณ ที่จ่าย มาตรา 3 เตรส และ ภ.ง.ด. 1, 3, 53</p>
                 
                 <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl mb-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                    <div className="relative z-10">
                       <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Total Tax Withheld</span>
                           <Zap size={14} className="text-indigo-400 animate-bounce" />
                       </div>
                       <p className="text-5xl font-black italic tracking-tighter text-white">฿0.00</p>
                    </div>
                 </div>
                 
                 <button className="w-full h-14 border border-white/10 font-black text-slate-400 rounded-2xl hover:bg-white/5 hover:text-white transition-all uppercase tracking-[0.2em] text-xs">
                    View WHT Certificates
                 </button>
              </div>
           </div>
        </div>

        {/* Footer Insight */}
        <div className="bg-gradient-to-r from-indigo-950/40 to-slate-950 rounded-[3rem] border border-white/5 p-16 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <PieChart size={120} className="absolute -left-10 -bottom-10 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
            
            <h3 className="text-3xl font-black italic mb-6 tracking-tighter">"PRECISION IS PROFIT"</h3>
            <p className="text-slate-400 font-bold max-w-2xl mx-auto uppercase text-xs tracking-[0.3em] leading-loose">
               ระบบ Micro-Account ตรวจสอบความละเอียดของตัวเลขภาษีด้วย AI มั่นใจทุกการยื่นเอกสารสรรพากร <br />
               <span className="text-indigo-400">Next Audit Protection Module: Connected</span>
            </p>
        </div>
      </div>
    </main>
  );
}
