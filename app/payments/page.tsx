import { query } from "@/lib/db";
import { CreditCard, Plus, Search, Filter } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const res = await query('SELECT p.*, i.invoice_number, c.name as customer_name FROM payments p LEFT JOIN invoices i ON p.invoice_id = i.id LEFT JOIN contacts c ON i.customer_id = c.id ORDER BY p.payment_date DESC');
  const payments = res.rows;

  return (
    <main className="p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">การชำระเงิน (Payments)</h1>
            <p className="text-slate-500 font-medium">บันทึกและตรวจสอบประวัติการรับชำระเงินจากลูกค้า</p>
          </div>
          <button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95">
            <Plus size={22} />
            บันทึกการรับชำระ
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">วันที่ชำระ</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">เลขที่ใบแจ้งหนี้</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ลูกค้า</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ยอดชำระ</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ช่องทาง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.length > 0 ? payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                    <td className="px-8 py-6 font-bold text-slate-600">
                      {new Date(p.payment_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-blue-600 underline">#{p.invoice_number}</span>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-800">{p.customer_name || '-'}</td>
                    <td className="px-8 py-6 font-black text-green-600 italic">฿{p.amount.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {p.payment_method || 'เงินโอน'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <CreditCard size={32} className="text-slate-200" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ยังไม่มีประวัติการชำระเงิน</p>
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
