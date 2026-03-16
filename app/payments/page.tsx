import { query } from "@/lib/db";
import { CreditCard, Plus, Search, ArrowRight, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  let payments = [];
  try {
    const res = await query(`
      SELECT p.*, c.name as customer_name 
      FROM payments p 
      LEFT JOIN contacts c ON p.contact_id = c.id 
      ORDER BY p.payment_date DESC
    `);
    payments = res.rows;
  } catch (e) {
    payments = [];
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ประวัติการชำระเงิน (Payments)</h1>
            <p className="text-sm text-gray-500 mt-1">ติดตามการรับเงินเข้าสู่ระบบบริษัท</p>
          </div>
          <Link href="/payments/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            บันทึกการรับเงิน
          </Link>
        </div>

        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันทึ่รับชำระ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">หมายเลขอ้างอิง</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">ช่องทาง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 italic">
                   {payments.length > 0 ? (
                      payments.map((p: any) => (
                         <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-gray-600 italic">
                               {new Date(p.payment_date).toLocaleDateString('th-TH')}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-800">{p.customer_name || 'ไม่ระบุ'}</td>
                            <td className="px-6 py-4 text-sm text-blue-600 font-bold uppercase">{p.reference_number || '-'}</td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">฿{Number(p.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                               <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                                  {p.method || 'Bank Transfer'}
                               </span>
                            </td>
                         </tr>
                      ))
                   ) : (
                      <tr>
                         <td colSpan={5} className="py-24 text-center text-gray-400 font-bold italic">
                            ไม่พบประวัติการรับชำระเงิน
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
