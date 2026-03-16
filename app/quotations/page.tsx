import { query } from "@/lib/db";
import { FileText, Plus, Search, Filter } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function QuotationsPage() {
  const res = await query('SELECT q.*, c.name as customer_name FROM quotations q LEFT JOIN contacts c ON q.customer_id = c.id ORDER BY q.created_at DESC');
  const quotations = res.rows;

  return (
    <main className="p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">ใบเสนอราคา (Quotations)</h1>
            <p className="text-slate-500 font-medium">จัดการข้อเสนอราคาและติดตามสถานะการตอบรับจากลูกค้า</p>
          </div>
          <button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 group">
            <Plus size={22} />
            สร้างใบเสนอราคาใหม่
          </button>
        </div>

        {/* Filters/Search */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="ค้นหาเลขที่ใบเสนอราคา หรือชื่อลูกค้า..." 
              className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
            />
          </div>
          <button className="h-12 px-6 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Filter size={18} />
            ตัวกรอง
          </button>
        </div>

        {/* Table Area */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">เลขที่เอกสาร</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ลูกค้า</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">วันที่ออก</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">ยอดรวมทั้งสิ้น</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quotations.length > 0 ? quotations.map((q: any) => (
                  <tr key={q.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <FileText size={16} />
                        </div>
                        <span className="font-black text-slate-900">{q.quotation_number}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-slate-600">{q.customer_name || 'ไม่ระบุ'}</td>
                    <td className="px-8 py-6 text-slate-500 font-medium">{new Date(q.created_at).toLocaleDateString('th-TH')}</td>
                    <td className="px-8 py-6 font-black text-slate-900 tracking-tight">฿{q.total_amount.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          q.status === 'accepted' ? 'bg-green-50 text-green-600' : 
                          q.status === 'sent' ? 'bg-blue-50 text-blue-600' :
                          q.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {q.status === 'accepted' ? 'ลูกค้ายอมรับ' : 
                           q.status === 'sent' ? 'ส่งแล้ว' : 
                           q.status === 'rejected' ? 'ปฏิเสธ' : 'รอดำเนินการ'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                          <FileText size={32} />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ยังไม่มีรายการใบเสนอราคา</p>
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
