import { query } from "@/lib/db";
import { BarChart3, TrendingUp, ShieldCheck, ArrowRight, FileText, Download } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TaxReportsPage() {
  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tighter">รายงานภาษี (Tax Reports)</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">สรุปรายงานภาษีมูลค่าเพิ่ม (ภ.พ.30) และภาษีหัก ณ ที่จ่าย</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
           {/* VAT Card */}
           <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 flex items-center justify-between text-white">
                 <h3 className="font-bold flex items-center gap-2">
                    <TrendingUp size={18} /> รายงานภาษีซื้อ (VAT In)
                 </h3>
                 <button className="p-2 bg-blue-500 hover:bg-blue-400 rounded transition-colors shadow-sm">
                    <Download size={14} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ประจำเดือนนี้</span>
                    <span className="text-3xl font-bold text-gray-800 font-mono tracking-tighter">฿0.00</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                    <div className="bg-gray-50 p-3 rounded">
                       <p className="mb-1 opacity-70 italic text-[9px]">Transactions</p>
                       <p className="text-blue-600">0 รายการ</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                       <p className="mb-1 opacity-70 italic text-[9px]">Status</p>
                       <p className="text-green-600">Ready</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Sales Tax Card */}
           <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-800 px-6 py-4 flex items-center justify-between text-white">
                 <h3 className="font-bold flex items-center gap-2">
                    <BarChart3 size={18} /> รายงานภาษีขาย (VAT Out)
                 </h3>
                 <button className="p-2 bg-blue-700 hover:bg-blue-600 rounded transition-colors shadow-sm">
                    <Download size={14} />
                 </button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ประจำเดือนนี้</span>
                    <span className="text-3xl font-bold text-blue-600 font-mono tracking-tighter">฿0.00</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                    <div className="bg-gray-50 p-3 rounded">
                       <p className="mb-1 opacity-70 italic text-[9px]">Total Net</p>
                       <p className="text-gray-800">฿0.00</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded font-mono">
                       <p className="mb-1 opacity-70 italic text-[9px]">Month/Year</p>
                       <p className="text-gray-800">03/2026</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex items-center justify-between mb-20 italic">
           <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 border border-blue-100 italic">
                 <ShieldCheck size={28} />
              </div>
              <div>
                 <h4 className="font-bold text-gray-700 uppercase tracking-tighter">ตรวจสอบไฟล์ส่งสรรพากร</h4>
                 <p className="text-xs text-gray-500">ระบบประมวลผลไฟล์ .txt ตามรูปแบบที่กรมสรรพากรกำหนด</p>
              </div>
           </div>
           <button className="h-10 px-6 border-b-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all text-sm uppercase tracking-widest">
              Generate Report
           </button>
        </div>

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand Finance Reporting System.
        </div>
      </div>
    </main>
  );
}
