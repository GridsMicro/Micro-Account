import { BarChart3, FileSpreadsheet, Download, Calendar } from "lucide-react";

export default function TaxReportsPage() {
  return (
    <main className="p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">รายงานภาษี (Tax Reports)</h1>
            <p className="text-slate-500 font-medium">สรุปรายงานภาษีซื้อ-ขาย ภ.พ.30 และรายงานภาษีหัก ณ ที่จ่าย</p>
          </div>
          <div className="flex gap-4">
             <button className="h-14 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-2xl flex items-center gap-2 transition-all">
                <Calendar size={20} />
                เลือกช่วงเวลา
             </button>
             <button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 leading-none">
                <Download size={22} />
                Export EXCEL
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* VAT 7% Card */}
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[4rem] -mr-8 -mt-8" />
              <div className="relative z-10">
                 <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200 mb-8">
                    <BarChart3 size={32} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2">รายงานภาษีมูลค่าเพิ่ม (VAT)</h2>
                 <p className="text-slate-500 font-bold mb-8">สรุปยอดภาษีขายและภาษีซื้อสำหรับยื่นผ่านระบบสรรพากร</p>
                 
                 <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">ภาษีขาย</p>
                        <p className="text-xl font-black text-slate-900">฿0.00</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">ภาษีซื้อ</p>
                        <p className="text-xl font-black text-slate-900">฿0.00</p>
                    </div>
                 </div>
                 
                 <button className="w-full h-12 border-2 border-slate-100 font-black text-slate-600 rounded-xl hover:bg-green-600 hover:border-green-600 hover:text-white transition-all uppercase tracking-widest text-xs">
                    ดูรายละเอียดแบบ ภ.พ. 30
                 </button>
              </div>
           </div>

           {/* WHT Card */}
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[4rem] -mr-8 -mt-8" />
              <div className="relative z-10">
                 <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 mb-8">
                    <FileSpreadsheet size={32} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2">ภาษีหัก ณ ที่จ่าย (WHT)</h2>
                 <p className="text-slate-500 font-bold mb-8">รายงานสรุปภาษีหัก ณ ที่จ่าย ตามมาตรา 3 เตรส และ ภ.ง.ด. 53</p>
                 
                 <div className="bg-slate-900 p-8 rounded-2xl text-white mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-[0.2em]">Total Withheld</span>
                        <span className="text-xs font-black bg-blue-600 px-2 py-1 rounded italic uppercase">Live Data</span>
                    </div>
                    <p className="text-4xl font-black italic">฿0.00</p>
                 </div>
                 
                 <button className="w-full h-12 border-2 border-slate-100 font-black text-slate-600 rounded-xl hover:bg-amber-500 hover:border-amber-500 hover:text-white transition-all uppercase tracking-widest text-xs">
                    ดูรายงาน ภ.ง.ด. 1, 3, 53
                 </button>
              </div>
           </div>
        </div>

        <div className="mt-12 bg-white rounded-[2.5rem] border border-slate-100 p-12 text-center shadow-lg shadow-blue-900/5">
            <h3 className="text-xl font-black mb-4">"ความแม่นยำคือหัวใจของธุกิจ"</h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">
               ระบบ Micro-Account ตรวจสอบความถูกต้องของเลขประจำตัวผู้เสียภาษีและอัตราภาษีอัตโนมัติ เพื่อให้คุณมั่นใจในทุกการยื่นภาษี
            </p>
        </div>
      </div>
    </main>
  );
}
