
import { query } from "@/lib/db";
import { Receipt, Plus, Search, FileText, ArrowLeft, ArrowRight, Edit, Filter, ShieldCheck } from "lucide-react";
import Link from "next/link";
import InvoiceRowActions from "./InvoiceRowActions";
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
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-violet-50/30 border-b border-violet-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">เลขที่เอกสาร</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อลูกค้า</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">วันที่ออก</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-36">ยอดสุทธิ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-28">สถานะ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50/50">
                  {invoices.length > 0 ? invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-violet-50/10 transition-all group">
                      <td className="px-6 py-4">
                         <span className="font-mono font-bold text-violet-600 text-sm tracking-tight">{inv.invoice_number}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-sm font-semibold text-slate-700">{inv.customer_name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs text-slate-500">
                            {new Date(inv.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <span className="text-sm font-bold text-slate-900 tabular-nums">฿{Number(inv.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          inv.status === 'sent' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                          'bg-amber-50 text-amber-600 border-amber-200'
                        )}>
                          {inv.status === 'paid' ? 'ชำระแล้ว' : inv.status === 'sent' ? 'ส่งแล้ว' : 'ฉบับร่าง'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <InvoiceRowActions id={inv.id} invoiceNumber={inv.invoice_number} />
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center">
                               <Receipt size={28} className="text-violet-200" />
                            </div>
                            <p className="text-slate-400 font-bold">ยังไม่มีรายการใบแจ้งหนี้</p>
                            <Link href="/invoices/new" className="text-violet-600 font-black hover:text-violet-700 underline underline-offset-4 text-sm uppercase tracking-widest">Create First Invoice</Link>
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
