import { query } from "@/lib/db";
import { Receipt, Plus, Search, Filter, ArrowLeft, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  let invoices = [];
  try {
    const res = await query('SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN contacts c ON i.customer_id = c.id ORDER BY i.created_at DESC');
    invoices = res.rows;
  } catch (e) {
    invoices = [];
  }

  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-indigo-400 font-black text-xs uppercase tracking-widest">
           <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
           <ArrowRight size={14} className="text-slate-700" />
           <span className="text-slate-500">Invoices</span>
        </div>

        {/* Header Area */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               INVOICE<span className="text-indigo-500">S</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">จัดการรายการเรียกเก็บเงินและภาษีออนไลน์</p>
          </div>
          <Link href="/invoices/new" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-3 active:scale-95 group text-lg">
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            ออกใบแจ้งหนี้ใหม่
          </Link>
        </div>

        {/* Search & Tool Area */}
        <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-2xl mb-12 flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="ค้นหาเลขใบเสร็จ ชื่อลูกค้า หรือสถานะ..." 
              className="w-full h-16 pl-16 pr-6 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-200"
            />
          </div>
          <button className="h-16 px-8 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-2xl text-white font-black flex items-center gap-3 transition-opacity disabled:opacity-50 group">
            <Filter size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            ตัวกรองขั้นสูง
          </button>
        </div>

        {/* Table Area - High Contrast Mode */}
        <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden mb-20 relative">
          <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">No. / Document</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Customer</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Issue Date</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Amount</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.length > 0 ? invoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-indigo-600/[0.03] transition-all cursor-pointer group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-white/5">
                          <FileText size={20} />
                        </div>
                        <span className="font-black text-white italic text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 font-black text-slate-200 tracking-tight text-lg">{inv.customer_name || 'ไม่บุรุรายชื่อ'}</td>
                    <td className="px-10 py-8 text-slate-500 font-bold uppercase text-xs tracking-wider">{new Date(inv.created_at).toLocaleDateString('th-TH')}</td>
                    <td className="px-10 py-8">
                       <div className="flex flex-col">
                          <span className="text-xl font-black text-white italic tracking-tighter">฿{inv.net_amount.toLocaleString()}</span>
                          <span className="text-[10px] font-black text-indigo-500 tracking-[0.2em] uppercase">Vat 7% Incl.</span>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-center">
                        <span className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          inv.status === 'sent' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {inv.status === 'paid' ? 'Paid' : 
                           inv.status === 'sent' ? 'Sent' : 'Draft'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center gap-8">
                        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-700 animate-pulse">
                          <Receipt size={48} />
                        </div>
                        <div className="space-y-2">
                           <p className="text-white font-black italic text-2xl uppercase tracking-widest">No Invoices Found</p>
                           <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.5em]">Sync Status: Check Dashboard</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
