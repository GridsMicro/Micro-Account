
import { query } from "@/lib/db";
import { Package, Plus, Search, Layers, ArrowRight, Tag, Edit, Barcode, ShieldCheck, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function InventoryPage({ searchParams }: { searchParams: { search?: string } }) {
  const search = (await searchParams)?.search || "";
  let products = [];
  try {
    let q = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      params.push(`%${search}%`);
      q += ` AND (name ILIKE $${params.length} OR sku_number ILIKE $${params.length} OR type ILIKE $${params.length})`;
    }
    
    q += ' ORDER BY name ASC';
    const res = await query(q, params);
    products = res.rows;
  } catch (e) {
    console.error("Fetch Inventory Error:", e);
    products = [];
  }

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200">
                  <Package className="text-white w-8 h-8" /> 
               </span>
               การจัดการคลังสินค้า (Inventory)
            </h1>
            <div className="flex items-center gap-3 ml-2">
               <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  Stock Asset & Resource Management
               </span>
               <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 mr-2">
                <ShieldCheck size={16} className="text-indigo-500" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Real-time Stock Tracking</span>
             </div>
             <Link 
              href="/inventory/new" 
              className="h-14 px-8 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all text-sm"
             >
                <Plus size={20} /> เพิ่มสินค้าใหม่
             </Link>
          </div>
        </div>

        {/* Inventory Control Toolbar */}
        <form method="GET" className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" size={20} />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="ค้นหาชื่อสินค้า รหัส SKU หรือหมวดหมู่..." 
                className="w-full pl-14 pr-6 h-14 bg-white border border-violet-50 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 text-sm font-bold shadow-sm transition-all" 
              />
           </div>
           <div className="flex gap-2">
              <button type="submit" className="h-14 px-8 bg-violet-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-3 uppercase tracking-widest">
                 <Search size={16} /> Search
              </button>
              <Link href="/inventory" className="h-14 px-8 bg-white border border-violet-50 rounded-xl text-xs font-black text-slate-500 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest shrink-0">
                 Clear
              </Link>
           </div>
        </form>

        {/* Smart Inventory Table */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-violet-100/40 border border-violet-50 overflow-hidden text-left mb-12">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-violet-50/10 border-b border-violet-50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">สินค้า / SKU Identity</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">คงเหลือ (Stock)</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ราคาต่อหน่วย</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-violet-50/50">
                  {products.length > 0 ? products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-violet-50/5 transition-all group">
                      <td className="px-10 py-6">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 border border-violet-100 shadow-inner group-hover:scale-110 transition-transform">
                               <Package size={24} />
                            </div>
                            <div className="flex flex-col">
                               <span className="font-black text-slate-800 text-base tracking-tight">{p.name}</span>
                               <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">{p.sku_number || 'E-DOCUMENT'}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-10 py-6">
                         <span className="px-4 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100 italic transition-all group-hover:bg-white group-hover:border-violet-100 group-hover:text-violet-600">
                           {p.type || 'PHYSICAL ASSET'}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <div className="flex flex-col items-center gap-1">
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border",
                              (p.stock_quantity ?? 0) > 10 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                            )}>
                              {p.stock_quantity ?? 0} UNITS
                            </span>
                            {(p.stock_quantity ?? 0) <= 5 && <span className="text-[8px] font-black text-rose-300 uppercase animate-bounce">Low Stock!</span>}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <span className="text-lg font-black text-slate-900 tabular-nums tracking-tighter">฿{Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <div className="flex justify-end gap-3 translate-x-3 group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100">
                            <Link href={`/inventory/edit/${p.id}`} className="p-3 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-lg transition-all shadow-sm">
                               <Edit size={16} />
                            </Link>
                            <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-lg transition-all shadow-sm">
                               <Barcode size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-32 text-center bg-violet-50/5">
                         <div className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-violet-100 border border-violet-50 group-hover:scale-110 transition-transform">
                               <Box size={40} className="text-violet-200" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-slate-500 font-black text-xl">The Warehouse is Empty</p>
                               <p className="text-slate-400 text-sm italic">ยังไม่มีผลิตภัณฑ์ถูกลงทะเบียนในคลังสินค้าคลาวด์ของคุณ</p>
                            </div>
                            <Link href="/inventory/new" className="px-10 py-4 bg-violet-600 text-white font-black rounded-xl shadow-xl hover:bg-violet-700 transition-all uppercase text-xs tracking-widest">Add First Product</Link>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Professional Footer */}
        <div className="text-center py-10 opacity-30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em] mb-2">Microtronic Thailand • Autonomous Logistics Edge • 2026</p>
           <p className="text-[8px] font-black text-slate-300 uppercase italic">Powering the future of digitized supply chains</p>
        </div>
      </div>
    </main>
  );
}
