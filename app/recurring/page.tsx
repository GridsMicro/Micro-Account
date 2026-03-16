import { query } from "@/lib/db";
import { Repeat, Plus, CalendarClock, Mail, StopCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export default async function RecurringInvoicesPage() {
  let records = [];
  try {
    const res = await query('SELECT * FROM recurring_invoices ORDER BY next_billing_date ASC');
    records = res.rows;
  } catch (e) {
    records = [];
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
               <Repeat className="text-blue-600" /> ระบบแจ้งหนี้รายเดือนอัตโนมัติ
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>ตั้งค่ารอบบิลและส่งอีเมลหาลูกค้าอัตโนมัติ (Auto Billing & Email)</span>
            </div>
          </div>
          <button className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm opacity-50 cursor-not-allowed">
            <Plus size={18} />
            สร้างรอบบิลใหม่
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded p-6 mb-8 flex items-start gap-4 shadow-sm">
           <div className="bg-blue-600 text-white p-3 rounded-full mt-1">
              <Mail size={24} />
           </div>
           <div>
              <h3 className="font-bold text-blue-800 text-lg mb-1 tracking-tight">Auto-Email Notification System</h3>
              <p className="text-sm text-blue-700 leading-relaxed max-w-4xl">
                 ระบบนี้จะทำงานเบื้องหลัง (Background Task) เพื่อตรวจสอบวันที่เริ่มรอบบิลใหม่ (Next Billing Date) ของแต่ละสัญญา 
                 เมื่อถึงกำหนด ระบบจะสร้าง <b>"ใบแจ้งหนี้"</b> ใบใหม่ขึ้นมาอัตโนมัติ พร้อมส่งอีเมลแนบลิงก์ให้ลูกค้าชำระเงินทันที 
                 เพื่อลดภาระงานของฝ่ายบัญชี
              </p>
           </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-widest flex items-center gap-2">
                 <CalendarClock size={16} className="text-blue-500" /> Schedules
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า (Client)</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">รอบบิล</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">ยอดตัดบัญชี</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">รอบต่อไป</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.length > 0 ? records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{r.client_name}</span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                               <Mail size={10} /> {r.email}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-widest">{r.cycle}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">฿{Number(r.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                         {r.next_billing_date ? new Date(r.next_billing_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border",
                           r.status === 'Active' ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                         )}>
                           {r.status || 'Active'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button className="p-2 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded transition-all shadow-sm" title="ยกเลิกการเก็บเงินรายเดือน">
                               <StopCircle size={14} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">
                         ยังไม่มีการตั้งค่ารอบบิลรายเดือน
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
