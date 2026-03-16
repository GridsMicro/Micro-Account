import { query } from "@/lib/db";
import { Package, Plus, Search, Layers } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const res = await query('SELECT * FROM products ORDER BY name ASC');
  const products = res.rows;

  return (
    <main className="p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">คลังสินค้า (Inventory)</h1>
            <p className="text-slate-500 font-medium">จัดการรายการสินค้า บริการ และติดตามจำนวนคงเหลือ</p>
          </div>
          <button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95">
            <Plus size={22} />
            เพิ่มสินค้าใหม่
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 ? products.map((p: any) => (
            <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all group flex flex-col justify-between h-full">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Package size={24} />
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-1 leading-tight group-hover:text-blue-600 transition-colors">{p.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{p.category || 'หมวดหมู่ทั่วไป'}</p>
                <p className="text-slate-500 text-sm line-clamp-2 mb-6">{p.description || 'ไม่มีรายละเอียดสินค้า'}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ราคาต่อหน่วย</span>
                  <span className="text-xl font-black text-slate-900 italic">฿{p.price.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-slate-900/10 flex items-center gap-2">
                  <Layers size={14} className="text-blue-400" />
                  {p.stock_quantity ?? 0}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
               <Package size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ยังไม่มีรายการสินค้าในคลัง</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
