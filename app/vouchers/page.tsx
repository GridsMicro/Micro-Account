import { query } from "@/lib/db";
import { ScrollText, Plus, Printer, CheckCircle2, ChevronDown, ListFilter, MapPin, BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VoucherExportButton from "./VoucherExportButton";

export const dynamic = 'force-dynamic';

export default async function PaymentVouchersPage({ searchParams }: { searchParams: { search?: string } }) {
  const search = (await searchParams)?.search || "";
  let vouchers = [];
  try {
    let q = 'SELECT * FROM payment_vouchers WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      params.push(`%${search}%`);
      q += ` AND (payee_name ILIKE $1 OR voucher_no ILIKE $1)`;
    }
    
    q += ' ORDER BY issue_date DESC';
    const res = await query(q, params);
    vouchers = res.rows;
  } catch (e) {
    vouchers = [];
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
               <ScrollText className="text-blue-600" /> ใบสำคัญจ่าย (Payment Vouchers)
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>พิมพ์เอกสารสรุปยอดปลายเดือนสำหรับการทำบัญชี และลงสมุดรายวัน (Journal)</span>
            </div>
          </div>
          <div className="flex gap-2">
             <VoucherExportButton />
             <Link href="/journals" className="h-11 px-6 bg-white border border-gray-300 text-blue-700 font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm hover:bg-blue-50">
                <BookOpen size={18} /> สมุดบัญชีรายวัน
             </Link>
             <Link href="/vouchers/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm">
                <Plus size={18} />
                ออกใบสำคัญจ่าย
             </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form method="GET" className="flex flex-col md:flex-row gap-4 items-center mb-6">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="ค้นหาเลขที่ใบสำคัญ หรือชื่อผู้รับเงิน..." 
                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm font-medium transition-all" 
              />
           </div>
           <div className="flex gap-2">
              <button type="submit" className="h-11 px-6 bg-gray-800 text-white rounded font-bold shadow-sm flex items-center gap-2 hover:bg-gray-900 transition-all text-xs uppercase tracking-widest">
                 <Search size={16} /> ค้นหา
              </button>
              <Link href="/vouchers" className="h-11 px-6 bg-white border border-gray-300 rounded font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 text-xs uppercase tracking-widest">
                 ล้างค่า
              </Link>
           </div>
        </form>

        {/* Action Banner */}
        <div className="bg-white border-l-4 border-l-blue-600 shadow-sm border border-gray-200 rounded p-6 mb-8 flex justify-between items-center text-sm">
           <div className="flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-full border border-blue-100">
                 <Printer size={20} />
              </div>
              <div className="flex flex-col">
                 <span className="font-bold text-gray-800 text-base">พิมพ์สรุปสิ้นเดือน (Monthly Summary Print)</span>
                 <span className="text-gray-500">รวมยอดการใช้จ่ายทั้งหมดเพื่อส่งฝ่ายบัญชีสรรพากร พร้อมลายเซ็นและวันที่อนุมัติ</span>
              </div>
           </div>
           <div>
              <button disabled className="px-6 py-2 bg-blue-600 text-white font-bold rounded shadow-sm opacity-50 cursor-not-allowed">
                 สั่งพิมพ์สรุป (PDF)
              </button>
           </div>
        </div>

        {/* Vouchers Table */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm flex items-center gap-2">
                 <ScrollText size={16} className="text-blue-500" /> Issued Vouchers
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ใบสำคัญ (Voucher #)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ผู้รับเงิน (Payee)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ออก</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จำนวนเงินรวม</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vouchers.length > 0 ? vouchers.map((v: any) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{v.voucher_no || `PV-${String(v.id).padStart(5, '0')}`}</span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 opacity-80 mt-1">{v.payment_method || 'เงินสด'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">{v.payee_name || 'ไม่ระบุผู้รับเงิน'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                         {v.issue_date ? new Date(v.issue_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800 text-lg">
                         ฿{Number(v.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border flex w-fit items-center gap-1",
                           v.status === 'Paid' ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
                         )}>
                           {v.status === 'Paid' ? <CheckCircle2 size={10} /> : null} {v.status || 'Pending'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button className="px-3 py-1.5 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all shadow-sm flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest" title="ลงบันทึกสมุดรายวัน">
                               <BookOpen size={12} /> Post GL
                            </button>
                            <button className="p-2 border border-purple-200 text-purple-600 hover:bg-purple-600 hover:text-white rounded transition-all shadow-sm" title="พิมพ์ใบสำคัญจ่าย">
                               <Printer size={14} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-24 text-center text-gray-400 font-bold italic">
                         ยังไม่ได้ออกใบสำคัญจ่ายใดๆ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           <p className="font-bold mb-1">© 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
           <p className="italic opacity-80">เราสร้าง Software เฉพาะทาง เพื่อขับเคลื่อนธุรกิจให้ก้าวล้ำ</p>
        </div>
      </div>
    </main>
  );
}
