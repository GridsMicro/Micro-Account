"use client";

import { 
  Package, 
  Save, 
  MapPin, 
  Notebook, 
  Truck,
  ChevronRight,
  Barcode as BarcodeIcon,
  Layers
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { updateProduct } from "@/app/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function EditProductClient({ product }: { product: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    type: product.type || "ในสต็อก (Physical)",
    sku_number: product.sku_number || "",
    source_info: product.source_info || "",
    storage_location: product.storage_location || "",
    stock_quantity: product.stock_quantity || 0,
    price: product.price || 0,
    product_notes: product.product_notes || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateProduct(product.id, formData);
    setLoading(false);
    if (res.success) {
      router.push("/inventory");
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า: " + (res.error || "Unknown error"));
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
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
              <button 
                type="submit" 
                disabled={loading}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
              >
                <Save size={18} /> {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
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
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-blue-600">SKU / รหัสสินค้า</label>
                            <input 
                              type="text" 
                              value={formData.sku_number}
                              onChange={e => setFormData({...formData, sku_number: e.target.value})}
                              className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-blue-700" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ประเภทสินค้า</label>
                            <select 
                              value={formData.type}
                              onChange={(e) => setFormData({...formData, type: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold"
                            >
                               <option value="ในสต็อก (Physical)">สินค้าในสต็อก (Physical)</option>
                               <option value="Dropship">สินค้า Dropship</option>
                               <option value="License Online">License Online</option>
                               <option value="งานบริการ (Service)">งานบริการ (Service)</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                               <Truck size={14} className="text-blue-500" /> แหล่งที่มา
                            </label>
                            <input 
                              type="text" 
                              value={formData.source_info}
                              onChange={e => setFormData({...formData, source_info: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                               <MapPin size={14} className="text-red-500" /> ที่เก็บสินค้า
                            </label>
                            <input 
                              type="text" 
                              value={formData.storage_location}
                              onChange={e => setFormData({...formData, storage_location: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                               <Layers size={14} className="text-green-500" /> จำนวนสต็อก
                            </label>
                            <input 
                              type="number" 
                              value={formData.stock_quantity}
                              onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ราคาต่อหน่วย</label>
                            <input 
                              type="number" 
                              value={formData.price}
                              onChange={e => setFormData({...formData, price: Number(e.target.value)})}
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
                          value={formData.product_notes}
                          onChange={e => setFormData({...formData, product_notes: e.target.value})}
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
                     formData.stock_quantity > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                   )}>
                      {formData.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                   </div>
                </div>
             </div>
          </div>
        </form>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           <p className="font-bold mb-1">© 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
           <p className="italic opacity-80">เราสร้าง Software เฉพาะทาง เพื่อขับเคลื่อนธุรกิจให้ก้าวล้ำ</p>
        </div>
      </div>
    </main>
  );
}
