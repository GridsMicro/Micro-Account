import { query } from "@/lib/db";
import { Package, Plus, Search, Layers, ArrowRight, Tag, Edit, Barcode } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการคลังสินค้า (Inventory)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>รายการสินค้าและจำนวนสต็อกคงเหลือ</span>
            </div>
          </div>
          <Link href="/inventory/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} />
            เพิ่มสินค้าใหม่
          </Link>
        </div>

        {/* Inventory Table Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-700">รายการสินค้าทั้งหมด</h3>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">สินค้า / SKU</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ประเภท</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">แหล่งที่มา</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">จำนวนสต็อก</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">ราคาต่อหน่วย</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.length > 0 ? products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-blue-600 border border-gray-200">
                               <Package size={20} />
                            </div>
                            <div className="flex flex-col">
                               <span className="font-bold text-gray-800">{p.name}</span>
                               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.sku_number || 'NO-SKU'}</span>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded border border-gray-200">
                          {p.type || 'ในสต็อก (Physical)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{p.source_info || 'ไม่ระบุข้อมูล'}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-xs font-bold",
                           (p.stock_quantity ?? 0) > 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                         )}>
                           {p.stock_quantity ?? 0} ชิ้น
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">฿{Number(p.price).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <Link href={`/inventory/edit/${p.id}`} className="p-2 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-all shadow-sm">
                               <Edit size={14} />
                            </Link>
                            <button className="p-2 border border-gray-200 text-gray-400 hover:bg-gray-100 rounded">
                               <Barcode size={14} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-gray-400 font-bold italic">
                         ไม่มีสินค้าในคลัง
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
