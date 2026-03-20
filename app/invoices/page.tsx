
import { query } from "@/lib/db";
import { Receipt, Plus, Search, FileText, ArrowLeft, ArrowRight, Edit, Filter, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage({ searchParams }: { searchParams: { search?: string } }) {
  const search = (await searchParams)?.search || "";
  let invoices = [];
  try {
    let q = `
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      LEFT JOIN contacts c ON i.contact_id = c.id 
    `;
    const params: any[] = [];
    
    if (search) {
      q += ` WHERE i.invoice_number ILIKE $1 OR c.name ILIKE $1 `;
      params.push(`%${search}%`);
    }
    
    q += ` ORDER BY i.created_at DESC, i.id DESC `;
    
    const res = await query(q, params);
    invoices = res.rows;
  } catch (e) {
    console.error("Fetch Invoices Error:", e);
    invoices = [];
  }

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200">
                  <Receipt className="text-white w-8 h-8" /> 
               </span>
               รายการใบแจ้งหนี้ (Invoices)
            </h1>
            <div className="flex items-center gap-3 ml-2">
               <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  Sales & Receivable Management
               </span>
               <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 mr-2">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Smart Audit Active</span>
             </div>
             <Link 
              href="/invoices/new" 
              className="h-14 px-8 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all text-sm"
             >
                <Plus size={20} /> ออกใบแจ้งหนี้ใหม่
             </Link>
          </div>
        </div>

        {/* Global Toolbar */}
        <form method="GET" className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" size={20} />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="ค้นหาเลขที่ใบแจ้งหนี้ รหัสสินค้า หรือชื่อลูกค้า..." 
                className="w-full pl-14 pr-6 h-14 bg-white border border-violet-50 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 text-sm font-bold shadow-sm transition-all" 
              />
           </div>
           <button type="submit" className="h-14 px-8 bg-violet-600 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest shrink-0">
              <Search size={16} /> Search
           </button>
           <Link href="/invoices" className="h-14 px-8 bg-white border border-violet-50 rounded-xl text-xs font-black text-slate-500 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest shrink-0">
              <Filter size={16} /> Clear
           </Link>
        </form>

        {/* Invoices List Table */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100/40 border border-violet-50 overflow-hidden text-left">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-violet-50/10 border-b border-violet-50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">เลขที่เอกสาร</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อลูกค้า / คู่ค้า</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่ออก (Date)</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ยอดรวมสุทธิ</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">สถานะ</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50/50">
                  {invoices.length > 0 ? invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-violet-50/5 transition-all group">
                      <td className="px-10 py-6">
                         <div className="flex flex-col">
                            <span className="font-mono font-black text-violet-600 text-base">{inv.invoice_number}</span>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Electronic Doc</span>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <span className="text-sm font-black text-slate-800 tracking-tight">{inv.customer_name || 'ไม่ระบุรายชื่อลูกค้า'}</span>
                      </td>
                      <td className="px-10 py-6">
                         <span className="text-xs font-bold text-slate-500">
                            {new Date(inv.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <span className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">฿{Number(inv.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={cn(
                          "inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          inv.status === 'sent' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        )}>
                          {inv.status === 'paid' ? 'PAID / ชำระแล้ว' : inv.status === 'sent' ? 'SENT / ส่งแล้ว' : 'DRAFT / ฉบับร่าง'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform opacity-0 group-hover:opacity-100">
                            <Link 
                               href={`/invoices/preview/${inv.id}`} 
                               className="p-3 bg-violet-600 text-white hover:bg-violet-700 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
                               title="Preview & Print PDF"
                            >
                               <FileText size={16} />
                               <span className="text-[10px] font-black uppercase tracking-wider pr-1">Preview</span>
                            </Link>
                            <Link href={`/invoices/edit/${inv.id}`} className="p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-xl transition-all shadow-sm">
                               <Edit size={16} />
                            </Link>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-32 text-center bg-violet-50/5">
                         <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-violet-100 border border-violet-50">
                               <Receipt size={32} className="text-violet-200" />
                            </div>
                            <p className="text-slate-400 font-black text-lg">ยังไม่มีรายการใบแจ้งหนี้เพื่อการเรียกเก็บเงิน</p>
                            <Link href="/invoices/new" className="text-violet-600 font-black hover:text-violet-700 underline underline-offset-8 decoration-2 text-sm uppercase tracking-widest">Create First Invoice</Link>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Enterprise Footer */}
        <div className="text-center py-10 opacity-30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Scalable Ledger Architecture • Microtronic 2026</p>
        </div>
      </div>
    </main>
  );
}
