import { query } from "@/lib/db";
import { CreditCard, Plus, Search, Filter, ArrowRight, History } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  let payments = [];
  try {
    const res = await query('SELECT p.*, i.invoice_number, c.name as customer_name FROM payments p LEFT JOIN invoices i ON p.invoice_id = i.id LEFT JOIN contacts c ON i.customer_id = c.id ORDER BY p.payment_date DESC');
    payments = res.rows;
  } catch (e) {
    payments = [];
  }

  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-indigo-400 font-black text-xs uppercase tracking-widest">
           <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
           <ArrowRight size={14} className="text-slate-700" />
           <span className="text-slate-500">Payments</span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               PAYMENT<span className="text-indigo-500">S</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">บันทึกและตรวจสอบประวัติการรับชำระเงินจากลูกค้า</p>
          </div>
          <Link href="/payments/new" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-3 active:scale-95 group text-lg">
            <Plus size={24} className="group-hover:rotate-180 transition-transform duration-500" />
            บันทึกการรับชำระ
          </Link>
        </div>

        <div className="bg-[#0f172a] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden mb-20 relative">
          <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Payment Date</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Invoice ID</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Customer</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Amount</th>
                  <th className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] text-center">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.length > 0 ? payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-indigo-600/[0.03] transition-all cursor-pointer group">
                    <td className="px-10 py-8 font-black text-slate-200 text-lg italic tracking-tight">
                      {new Date(p.payment_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3">
                          <History size={16} className="text-indigo-400" />
                          <span className="font-black text-indigo-400 group-hover:text-white transition-colors underline decoration-indigo-500/30 underline-offset-4">#{p.invoice_number}</span>
                       </div>
                    </td>
                    <td className="px-10 py-8 font-black text-slate-300 tracking-tight text-lg">{p.customer_name || '-'}</td>
                    <td className="px-10 py-8">
                       <span className="text-2xl font-black text-emerald-400 italic tracking-tighter">฿{p.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex justify-center">
                        <span className="px-6 py-2 bg-slate-900 border border-white/5 text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
                          {p.payment_method || 'Bank Transfer'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center gap-8">
                        <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-700">
                          <CreditCard size={48} />
                        </div>
                        <p className="text-white font-black italic text-2xl uppercase tracking-widest">No Payments History</p>
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
