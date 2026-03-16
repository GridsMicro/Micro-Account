import { query } from "@/lib/db";
import { 
  Package, 
  Save, 
  MapPin, 
  Notebook, 
  Truck,
  ChevronRight,
  ArrowLeft,
  Barcode as BarcodeIcon,
  Layers
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import BarcodeComponent from "react-barcode";

// Since we're using client components for QR/Barcode in static build might be tricky if not careful, 
// but for now I'll use a wrapper or just make the whole page a server component with a client-side wrapper if needed.
// Actually, I'll provide a simplified version that matches the AdminLTE theme.

export const dynamic = 'force-dynamic';

async function getProduct(id: string) {
  try {
    const res = await query('SELECT * FROM products WHERE id = $1', [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
               แก้ไขข้อมูลสินค้า: <span className="text-blue-600">{product.name}</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
               <Link href="/inventory" className="text-blue-500 hover:underline">Inventory</Link>
               <ChevronRight size={10} />
               <span>Edit Product</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/inventory" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                ยกเลิก
             </Link>
            <button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm">
              <Save size={18} /> บันทึกการแก้ไข
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                 <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tighter">
                    <Package size={18} /> ข้อมูลสินค้า (Product Details)
                 </div>
                 
                 <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ชื่อสินค้า</label>
                          <input 
                            type="text" 
                            defaultValue={product.name}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-blue-600">SKU / รหัสสินค้า</label>
                          <input 
                            type="text" 
                            defaultValue={product.sku_number || 'SKU-000000'}
                            className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-blue-700" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Truck size={14} className="text-blue-500" /> แหล่งที่มา
                          </label>
                          <input 
                            type="text" 
                            defaultValue={product.source_info || ''}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                            placeholder="เช่น นำเข้าจาก..."
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <MapPin size={14} className="text-red-500" /> ที่เก็บสินค้า
                          </label>
                          <input 
                            type="text" 
                            defaultValue={product.storage_location || ''}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                            placeholder="เช่น โกดังหลัก"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             <Layers size={14} className="text-green-500" /> จำนวนสต็อก
                          </label>
                          <input 
                            type="number" 
                            defaultValue={product.stock_quantity || 0}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ราคาต่อหน่วย</label>
                          <input 
                            type="number" 
                            defaultValue={product.price || 0}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                          />
                       </div>
                    </div>
                    <div className="space-y-1 pt-4">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Notebook size={14} className="text-orange-500" /> หมายเหตุ (Notes)
                       </label>
                       <textarea 
                        rows={4} 
                        defaultValue={product.product_notes || ''}
                        className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm resize-none leading-relaxed" 
                       ></textarea>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
                 <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-4 border-b border-gray-100 w-full pb-2">Status</h3>
                 <div className={cn(
                   "w-full py-3 rounded font-black text-xs uppercase tracking-widest border",
                   (product.stock_quantity ?? 0) > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                 )}>
                    {(product.stock_quantity ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                 </div>
              </div>

              <div className="bg-gray-800 text-white p-8 rounded shadow-sm flex flex-col items-center">
                 <BarcodeIcon size={40} className="mb-4 text-gray-500" />
                 <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Stock ID</p>
                 <p className="text-sm font-mono text-blue-400 font-bold">{product.sku_number || 'NO-SKU-ID'}</p>
              </div>
           </div>
        </div>

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}

import { cn } from "@/lib/utils";
