import { query } from "@/lib/db";
import { Receipt, Plus, Search, FileText, ArrowLeft, ArrowRight, Edit } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  let invoices = [];
  try {
    const res = await query(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      LEFT JOIN contacts c ON i.contact_id = c.id 
      ORDER BY i.created_at DESC
    `);
    invoices = res.rows;
  } catch (e) {
    invoices = [];
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">รายการใบแจ้งหนี้ (Invoices)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>จัดการและติดตามสถานะการชำระเงิน</span>
            </div>
          </div>
          <Link href="/invoices/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} />
            ออกใบแจ้งหนี้ใหม่
          </Link>
        </div>

        {/* Filters/Search Area */}
        <div className="bg-white p-4 rounded shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
           <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="ค้นหาเลขที่ใบแจ้งหนี้ หรือชื่อลูกค้า..." className="w-full pl-10 pr-4 h-10 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" />
           </div>
           <button className="h-10 px-4 border border-gray-300 rounded text-sm font-bold text-gray-600 hover:bg-gray-50">
              ตัวกรองสถานะ
           </button>
        </div>

        {/* Invoice Table Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">เลขที่เอกสาร</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ออก</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ยอดรวมสุทธิ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">สถานะ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.length > 0 ? invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">
                         {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-700">{inv.customer_name || 'ไม่ระบุรายชื่อ'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.created_at).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">฿{Number(inv.net_amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          inv.status === 'paid' ? 'bg-green-100 text-green-700' : 
                          inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {inv.status === 'paid' ? 'Paid' : inv.status === 'sent' ? 'Sent' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <Link href={`/invoices/edit/${inv.id}`} className="p-2 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all shadow-sm">
                               <Edit size={14} />
                            </Link>
                            <button className="p-2 border border-gray-200 text-gray-400 hover:bg-gray-100 rounded">
                               <FileText size={14} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">
                         ยังไม่มีรายการใบแจ้งหนี้
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
