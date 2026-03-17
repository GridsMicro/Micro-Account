
import { query } from "@/lib/db";
import { FileText, Plus, Search, ArrowRight, Edit, ShieldCheck, FileCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function QuotationsPage() {
  let quotations = [];
  try {
    const res = await query(`
      SELECT q.*, c.name as customer_name 
      FROM quotations q 
      LEFT JOIN contacts c ON q.contact_id = c.id 
      ORDER BY q.created_at DESC
    `);
    quotations = res.rows;
  } catch (e) {
    console.error("Fetch Quotations Error:", e);
    quotations = [];
  }

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200">
                  <FileText className="text-white w-8 h-8" /> 
               </span>
               รายการใบเสนอราคา (Quotations)
            </h1>
            <div className="flex items-center gap-3 ml-2">
               <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  Sales & Proposal Engagement
               </span>
               <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 mr-2">
                <FileCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Agreement Ready</span>
             </div>
             <Link 
              href="/quotations/new" 
              className="h-14 px-8 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all text-sm"
             >
                <Plus size={20} /> สร้างใบเสนอราคาใหม่
             </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="ค้นหาเลขที่ใบเสนอราคา หรือชื่อผู้รับบริการ..." 
                className="w-full pl-14 pr-6 h-14 bg-white border border-violet-50 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 text-sm font-bold shadow-sm transition-all" 
              />
           </div>
        </div>

        {/* Quotations Table Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100/40 border border-violet-50 overflow-hidden text-left mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-violet-50/10 border-b border-violet-50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">เลขที่เอกสาร</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ลูกค้า / คู่สัญญา</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">วันที่ออก</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ยอดรวม (Total)</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">สถานะ</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50/50">
                  {quotations.length > 0 ? quotations.map((q: any) => (
                    <tr key={q.id} className="hover:bg-violet-50/5 transition-all group">
                      <td className="px-10 py-6">
                         <div className="flex flex-col">
                            <span className="font-mono font-black text-violet-600 text-base">{q.quotation_number}</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pricing Proposal</span>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <span className="text-sm font-black text-slate-800 tracking-tight">{q.customer_name || 'ไม่ระบุชื่อลูกค้า'}</span>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <span className="text-xs font-bold text-slate-500">
                            {new Date(q.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <span className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">฿{Number(q.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={cn(
                          "inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          q.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          q.status === 'sent' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          q.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        )}>
                          {q.status ? q.status.toUpperCase() : 'DRAFT'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex justify-end gap-3 translate-x-3 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100">
                            <Link href={`/quotations/edit/${q.id}`} className="p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm">
                               <Edit size={16} />
                            </Link>
                            <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm">
                               <FileText size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-32 text-center bg-violet-50/5">
                         <div className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-violet-100 border border-violet-50 group-hover:rotate-12 transition-transform">
                               <FileText size={40} className="text-violet-200" />
                            </div>
                            <p className="text-slate-400 font-black text-lg">Your Sales Pipeline is Empty</p>
                            <Link href="/quotations/new" className="px-10 py-4 bg-violet-600 text-white font-black rounded-2xl shadow-xl hover:bg-violet-700 transition-all uppercase text-xs tracking-widest">Create First Quote</Link>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Pro Footer */}
        <div className="text-center py-10 opacity-30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Microtronic Thailand • Commercial Excellence • 2026</p>
        </div>
      </div>
    </main>
  );
}
