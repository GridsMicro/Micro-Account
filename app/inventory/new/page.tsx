"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Package, 
  Truck, 
  MapPin, 
  Notebook, 
  QrCode, 
  Barcode,
  ChevronRight,
  Sparkles,
  Layers,
  Zap
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BarcodeComponent from "react-barcode";

export default function NewProductPage() {
  const [sku, setSku] = useState("SKU-" + Math.floor(100000 + Math.random() * 900000));
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <Link href="/inventory" className="flex items-center gap-2 hover:text-white transition-colors">
                <ArrowLeft size={14} />
                BACK TO INVENTORY
              </Link>
              <ChevronRight size={14} className="text-slate-700" />
              <span className="text-slate-500">เพิ่มสินค้า & สร้างรหัส</span>
           </div>
           <div className="flex items-center gap-3 bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">QR/Barcode Generator System</span>
           </div>
        </div>

        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-16">
          <div className="space-y-2 text-left">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               PRODUCT <span className="text-indigo-500">INTELLIGENCE</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">ลงทะเบียนสินค้าใหม่ พร้อมระบบสร้างรหัสติดตามอัตโนมัติ</p>
          </div>
          <button className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-3 active:scale-95 group text-lg">
             <Save size={24} />
             บันทึกข้อมูลสินค้า
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-20">
          
          {/* Left: Input Details */}
          <div className="xl:col-span-2 space-y-10">
            <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/[0.02] rounded-bl-[5rem] -mr-12 -mt-12" />
                
                <div className="flex items-center gap-4 mb-12 pb-8 border-b border-white/5">
                   <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Package size={28} />
                   </div>
                   <h2 className="text-3xl font-black italic tracking-tighter uppercase">Product Identity</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ชื่อสินค้า / บริการ</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-inner" 
                        placeholder="ชื่อเต็มของสินค้า"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">SKU / รหัสสินค้า (Barcode ID)</label>
                      <input 
                        type="text" 
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-black text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all shadow-inner italic" 
                      />
                   </div>
                   
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                         <Truck size={12} className="text-cyan-500" /> การนำเข้ามา (Source / Vendor)
                      </label>
                      <input 
                        type="text" 
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none shadow-inner" 
                        placeholder="เช่น นำเข้าจากจีน, บ. เทพบริการ"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                         <MapPin size={12} className="text-rose-500" /> ที่เก็บสินค้า (Storage Location)
                      </label>
                      <input 
                        type="text" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none shadow-inner" 
                        placeholder="ตู้ที่ 5, โกดัง A ชั้น 2"
                      />
                   </div>

                   <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                         <Notebook size={12} className="text-amber-500" /> หมายเหตุ / รายละเอียดเพิ่มเติม (Notes)
                      </label>
                      <textarea 
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none shadow-inner resize-none leading-relaxed" 
                        placeholder="ระบุตำหนิ วิธีการใช้ หรือข้อมูลสำคัญอื่นๆ..."
                      ></textarea>
                   </div>
                </div>
            </div>
          </div>

          {/* Right: Code Generator Module */}
          <div className="space-y-10">
             <div className="bg-[#0f172a] p-10 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent animate-pulse" />
                
                <div className="relative z-10 space-y-12">
                   <div className="text-center">
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Automated Generator</h3>
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">สร้างรหัสติดตามสินค้าทันที</p>
                   </div>

                   {/* QR Code Section */}
                   <div className="flex flex-col items-center gap-6">
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_60px_rgba(255,255,255,0.1)] border border-white relative group/qr overflow-hidden hover:scale-105 transition-transform duration-500">
                         <QRCodeSVG 
                            value={JSON.stringify({ sku, n: name || "Unnamed", l: location })} 
                            size={200}
                            level="H"
                            includeMargin={false}
                         />
                         <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center">
                            <QrCode size={40} className="text-indigo-600" />
                         </div>
                      </div>
                      <div className="text-center">
                         <p className="text-xl font-black italic tracking-tighter uppercase text-white">Smart QR Code</p>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">บรรจุข้อมูล {sku}</p>
                      </div>
                   </div>

                   {/* Barcode Section */}
                   <div className="flex flex-col items-center gap-6 pt-6 border-t border-white/5">
                      <div className="bg-white px-8 py-6 rounded-2xl shadow-xl overflow-hidden hover:scale-105 transition-transform">
                         <BarcodeComponent 
                            value={sku} 
                            width={1.5} 
                            height={60} 
                            fontSize={12}
                            background="transparent"
                         />
                      </div>
                      <div className="text-center">
                         <p className="text-xl font-black italic tracking-tighter uppercase text-white">Standard Barcode</p>
                         <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-white/5 mt-2">
                            <Barcode size={12} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">{sku}</span>
                         </div>
                      </div>
                   </div>

                   <button className="w-full h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white font-black uppercase text-xs tracking-[0.2em] transition-all">
                      <Zap size={18} className="text-yellow-500" />
                      Print Labels (A4/Sticky)
                   </button>
                </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                   <Layers size={24} className="text-indigo-400" />
                   <h3 className="text-xl font-black italic tracking-tighter uppercase">Warehouse Logic</h3>
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                   ระบบจะทำการคำนวณพื้นที่จัดเก็บและบันทึกประวัติผู้ทำรายการทันทีที่กดบันทึก
                </p>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">Stock Status</span>
                      <span className="text-emerald-400">Incoming Ready</span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
