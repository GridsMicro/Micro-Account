import { query } from "@/lib/db";
import { FileText, Plus, Search, ArrowRight, Edit } from "lucide-react";
import Link from "next/link";

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
    quotations = [];
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">รายการใบเสนอราคา (Quotations)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>จัดทำและติดตามการอนุมัติราคา</span>
            </div>
          </div>
          <Link href="/quotations/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} />
            สร้างใบเสนอราคาใหม่
          </Link>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">เลขที่เอกสาร</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">ยอดรวม</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotations.length > 0 ? quotations.map((q: any) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors text-sm">
                      <td className="px-6 py-4 font-bold text-blue-600">{q.quotation_number}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">{q.customer_name || 'ไม่ระบุรายชื่อ'}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(q.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">฿{Number(q.total_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          q.status === 'accepted' ? 'bg-green-100 text-green-700' : 
                          q.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          q.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {q.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <Link href={`/quotations/edit/${q.id}`} className="p-2 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all shadow-sm">
                               <Edit size={14} />
                            </Link>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">
                         ยังไม่มีรายการใบเสนอราคา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
