
'use client';

import { useState } from 'react';
import { updateDocumentPattern } from "@/app/actions";
import { Save, RefreshCw, Layers, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PatternClient({ initialPatterns }: { initialPatterns: any[] }) {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [loading, setLoading] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  const handleUpdate = async (id: number, currentPattern: any) => {
    setLoading(id);
    const res = await updateDocumentPattern(id, currentPattern);
    setLoading(null);
    if (res.success) {
      setSaved(id);
      setTimeout(() => setSaved(null), 3000);
    }
  };

  const updateField = (id: number, field: string, value: any) => {
    setPatterns(patterns.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const generatePreview = (p: any) => {
    const year = p.include_year ? "2026" : "";
    const month = p.include_month ? "03" : "";
    const digits = "0".repeat(p.digits - 1) + "1";
    const parts = [p.prefix, year, month].filter(Boolean);
    return parts.join(p.separator) + (p.separator || "") + digits;
  };

  return (
    <div className="divide-y divide-violet-50">
      {patterns.map((p) => (
        <div key={p.id} className="p-10 hover:bg-violet-50/5 transition-all group">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* 1. Identity Segment */}
            <div className="lg:w-72 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-violet-100/50 rounded-xl flex items-center justify-center border border-violet-100 group-hover:scale-110 transition-transform shadow-inner text-left">
                  <Layers className="text-violet-500 w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight capitalize">{p.document_type}</h3>
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Document Class</span>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-6 rounded-3xl shadow-xl shadow-violet-200 overflow-hidden relative group/preview text-left">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-xl translate-x-12 -translate-y-12 animate-pulse"></div>
                 <p className="text-[10px] font-black text-violet-100 uppercase tracking-[0.2em] mb-2">Live Preview</p>
                 <p className="text-xl font-mono font-black text-white tracking-widest truncate">
                    {generatePreview(p)}
                 </p>
              </div>
            </div>

            {/* 2. Configuration Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* Prefix & Separator */}
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Prefix (คำนำหน้า)</label>
                   <input 
                      type="text" 
                      value={p.prefix}
                      onChange={(e) => updateField(p.id, 'prefix', e.target.value)}
                      className="w-full h-12 px-5 bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Separator (ตัวคั่น)</label>
                   <select 
                      value={p.separator}
                      onChange={(e) => updateField(p.id, 'separator', e.target.value)}
                      className="w-full h-12 px-5 bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all cursor-pointer"
                   >
                     <option value="-">- (Dash)</option>
                     <option value="/">/ (Slash)</option>
                     <option value="#"># (Hash)</option>
                     <option value="">(None)</option>
                   </select>
                 </div>
               </div>

               {/* Date Integration */}
               <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2">Date Components (วันที่)</p>
                 <div className="space-y-2">
                    <button 
                      onClick={() => updateField(p.id, 'include_year', !p.include_year)}
                      className={cn(
                        "w-full px-6 py-4 rounded-xl flex items-center justify-between border-2 transition-all font-bold text-sm",
                        p.include_year ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm" : "bg-white border-slate-100 text-slate-300 shadow-none"
                      )}
                    >
                      <span>แสดงปี (Year)</span>
                      <div className={cn("w-2 h-2 rounded-full", p.include_year ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "bg-slate-200")}></div>
                    </button>
                    <button 
                      onClick={() => updateField(p.id, 'include_month', !p.include_month)}
                      className={cn(
                        "w-full px-6 py-4 rounded-xl flex items-center justify-between border-2 transition-all font-bold text-sm",
                        p.include_month ? "bg-violet-50 border-violet-200 text-violet-700 shadow-sm" : "bg-white border-slate-100 text-slate-300 shadow-none"
                      )}
                    >
                      <span>แสดงเดือน (Month)</span>
                      <div className={cn("w-2 h-2 rounded-full", p.include_month ? "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" : "bg-slate-200")}></div>
                    </button>
                 </div>
               </div>

               {/* Digits & Save */}
               <div className="space-y-6">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Running Digits (หลัก)</label>
                   <input 
                      type="number" 
                      min="3" max="8"
                      value={p.digits}
                      onChange={(e) => updateField(p.id, 'digits', parseInt(e.target.value))}
                      className="w-full h-12 px-5 bg-slate-50 border-2 border-transparent focus:border-violet-400 focus:bg-white rounded-xl outline-none font-bold text-slate-700 transition-all"
                   />
                 </div>
                 
                 <button 
                   onClick={() => handleUpdate(p.id, p)}
                   disabled={loading === p.id}
                   className={cn(
                     "w-full h-14 rounded-xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all",
                     saved === p.id 
                       ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
                       : "bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 hover:-translate-y-1 active:scale-95"
                   )}
                 >
                    {loading === p.id ? (
                      <RefreshCw size={20} className="animate-spin" />
                    ) : saved === p.id ? (
                      <>
                        <CheckCircle2 size={20} />
                        บันทึกสำเร็จ
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        อัปเดตแพทเทิร์น
                      </>
                    )}
                 </button>
               </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
