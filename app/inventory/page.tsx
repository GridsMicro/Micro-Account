import { query } from "@/lib/db";
import { Package, Plus, Search, Layers, ArrowRight, Tag } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  let products = [];
  try {
    const res = await query('SELECT * FROM products ORDER BY name ASC');
    products = res.rows;
  } catch (e) {
    products = [];
  }

  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-indigo-400 font-black text-xs uppercase tracking-widest">
           <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
           <ArrowRight size={14} className="text-slate-700" />
           <span className="text-slate-500">Inventory</span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               INVENTOR<span className="text-indigo-500">Y</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">จัดการรายการสินค้า บริการ และจำนวนสต็อก</p>
          </div>
          <Link href="/inventory/new" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-3 active:scale-95 group text-lg">
            <Plus size={24} className="group-hover:scale-125 transition-transform" />
            เพิ่มสินค้าใหม่
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">
          {products.length > 0 ? products.map((p: any) => (
            <div key={p.id} className="bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 shadow-2xl hover:border-indigo-500/30 hover:shadow-indigo-500/5 transition-all group flex flex-col justify-between h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/[0.02] rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              
              <div>
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-white/5 shadow-xl">
                  <Package size={28} />
                </div>
                <h3 className="font-black text-white text-xl mb-2 leading-tight group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">{p.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                   <Tag size={12} className="text-cyan-500" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{p.category || 'General'}</span>
                </div>
                <p className="text-slate-400 text-sm font-medium line-clamp-3 mb-8 leading-relaxed">{p.description || 'ไม่มีรายละเอียดสินค้าเพิ่มเติมในฐานข้อมูล'}</p>
              </div>
              
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">UnitPrice (Excl VAT)</span>
                  <span className="text-2xl font-black text-white italic tracking-tighter">฿{p.price.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/80 backdrop-blur-md text-white px-5 py-3 rounded-2xl text-xs font-black shadow-2xl border border-white/5 flex items-center gap-2 group-hover:border-indigo-500/30 transition-all">
                  <Layers size={16} className="text-indigo-400" />
                  <span className="text-lg">{p.stock_quantity ?? 0}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-40 text-center bg-[#0f172a] rounded-[4rem] border border-dashed border-white/10 flex flex-col items-center gap-8">
               <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-700">
                  <Package size={48} />
               </div>
               <div className="space-y-2">
                  <p className="text-white font-black italic text-2xl uppercase tracking-widest">No Products in Stock</p>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.5em]">Inventory Status: Connected</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
