"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Building2, 
  Calendar, 
  FileText,
  User,
  Zap,
  ChevronRight
} from "lucide-react";

export default function NewQuotationPage() {
  const [items, setItems] = useState([{ id: 1, desc: "", qty: 1, price: 0 }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: "", qty: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb & Back */}
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <Link href="/quotations" className="flex items-center gap-2 hover:text-white transition-colors">
                <ArrowLeft size={14} />
                กลับหน้าหลัก
              </Link>
              <ChevronRight size={14} className="text-slate-700" />
              <span className="text-slate-500">สร้างใบเสนอราคาใหม่</span>
           </div>
           <div className="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
              <Zap size={14} className="text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Smart Draft Mode</span>
           </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div className="space-y-2 text-left">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               NEW <span className="text-indigo-500">QUOTATION</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">โปรดกรอกรายละเอียดเพื่อขออนุมัติราคา</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <button className="flex-1 md:flex-none h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 group text-lg">
                <Save size={24} />
                บันทึกเอกสาร
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-10">
            {/* Customer Info Card */}
            <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-bl-[4rem]" />
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                   <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                      <User size={24} />
                   </div>
                   <h2 className="text-2xl font-black italic tracking-tighter uppercase">Customer Selection</h2>
                </div>
                
                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">เลือกลูกค้า / คู่ค้า</label>
                      <select className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-inner appearance-none">
                         <option>ยังไม่เลือกบริษัทลูกค้า</option>
                         <option>บริษัท อย่างดี จํากัด</option>
                         <option>หจก. บริการเทพ</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">หมายเหตุภายใน (Internal Note)</label>
                      <textarea rows={2} className="w-full p-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none shadow-inner" placeholder="ระบุข้อมูลเพิ่มเติมถ้ามี..."></textarea>
                   </div>
                </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                         <FileText size={24} />
                      </div>
                      <h2 className="text-2xl font-black italic tracking-tighter uppercase">Line Items</h2>
                   </div>
                   <button onClick={addItem} className="h-12 px-6 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 font-black rounded-xl border border-indigo-500/20 transition-all flex items-center gap-2 text-xs uppercase tracking-widest">
                      <Plus size={16} /> Add Row
                   </button>
                </div>

                <div className="space-y-6 overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-4">
                            <th className="pb-4">Description</th>
                            <th className="pb-4 text-center w-24">Qty</th>
                            <th className="pb-4 text-right w-40">Price/Unit</th>
                            <th className="pb-4 text-right w-40">Total</th>
                            <th className="pb-4 w-12"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                         {items.map((item, idx) => (
                            <tr key={item.id} className="group transition-colors">
                               <td className="py-6">
                                  <input type="text" placeholder="ชื่อสินค้าหรือบริการ" className="w-full bg-transparent border-b border-transparent focus:border-indigo-500 focus:outline-none font-bold text-slate-200 py-1 transition-all" />
                               </td>
                               <td className="py-6 px-4">
                                  <input type="number" defaultValue={1} className="w-full bg-slate-950 border border-white/5 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold text-indigo-400" />
                               </td>
                               <td className="py-6 px-4">
                                  <input type="number" defaultValue={0} className="w-full bg-slate-950 border border-white/5 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right font-bold text-slate-200" />
                               </td>
                               <td className="py-6 text-right font-black italic text-indigo-400">
                                  ฿0.00
                               </td>
                               <td className="py-6 text-right">
                                  <button onClick={() => removeItem(item.id)} className="text-slate-800 hover:text-rose-500 transition-colors">
                                     <Trash2 size={18} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
          </div>

          {/* Right Sidebar Area */}
          <div className="space-y-10">
             <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                      <Calendar size={20} />
                   </div>
                   <h3 className="text-xl font-black italic uppercase tracking-tighter">Document Info</h3>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quotation Number</label>
                      <input type="text" className="w-full h-12 px-4 bg-slate-950 border border-white/5 rounded-xl font-bold text-indigo-400 focus:outline-none" defaultValue="QT-2026-0001" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Document Date</label>
                      <input type="date" className="w-full h-12 px-4 bg-slate-950 border border-white/5 rounded-xl font-bold text-slate-200 focus:outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Expiry Date</label>
                      <input type="date" className="w-full h-12 px-4 bg-slate-950 border border-white/5 rounded-xl font-bold text-slate-200 focus:outline-none" />
                   </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-900 via-slate-950 to-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 text-white">Summary</h3>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      <span>Subtotal</span>
                      <span>฿0.00</span>
                   </div>
                   <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                      <span>VAT 7%</span>
                      <span>฿0.00</span>
                   </div>
                   <div className="h-px bg-white/10 my-4" />
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Grand Total</span>
                      <span className="text-4xl font-black italic text-white tracking-tighter">฿0.00</span>
                   </div>
                </div>
                
                <div className="mt-10 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
                   <Zap size={16} className="text-cyan-400" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax calculation is automatic</p>
                </div>
             </div>

             <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 shadow-2xl text-center">
                <Building2 size={40} className="text-slate-800 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Microtronic Thailand</p>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
