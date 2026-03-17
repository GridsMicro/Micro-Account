
import { getDocumentPatterns } from "@/app/actions";
import PatternClient from "./PatternClient";
import { Palette, ShieldCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PatternsPage() {
  const res = await getDocumentPatterns();
  const patterns = res.success ? (res.data || []) : [];

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <span className="p-3 bg-violet-500 rounded-2xl shadow-xl shadow-violet-200">
                <Palette className="text-white w-8 h-8" /> 
              </span>
              ตั้งค่าแพทเทิร์นเอกสาร
            </h1>
            <div className="flex items-center gap-3 ml-2">
              <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                Configuration & Identity Design
              </span>
              <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
             <ShieldCheck size={16} className="text-emerald-500" />
             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enterprise Security Active</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100/40 border border-violet-50 overflow-hidden">
           <div className="p-10 border-b border-violet-50 bg-violet-50/10">
              <h2 className="text-xl font-black text-slate-800">จัดการรูปแบบรหัสใบสำคัญ (Voucher Patterns)</h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">กำหนดรูปแบบรหัสที่จะใช้รันในสมุดบันทึกรายวันทั้ง 5 เล่ม</p>
           </div>
           
           <div className="p-0">
              <PatternClient initialPatterns={patterns} />
           </div>
        </div>

        <div className="text-center opacity-30 py-10">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Identity Control Module • Online Edition</p>
        </div>

      </div>
    </main>
  );
}
