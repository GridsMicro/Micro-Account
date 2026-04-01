"use client";
// Force recompile 1

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Package, 
  MapPin, 
  Notebook, 
  QrCode, 
  Barcode as BarcodeIcon,
  Zap,
  Truck,
  Coins
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import BarcodeComponent from "react-barcode";
import { createProduct, getNextSkuNumber, getCategories, createCategory } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sku, setSku] = useState("");
  const [type, setType] = useState("ในสต็อก (Physical)");
  const [category, setCategory] = useState("");
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Next SKU
    getNextSkuNumber().then(res => {
      if (res.success && res.sku) setSku(res.sku);
    });
    // Fetch Categories
    getCategories().then(res => {
      if (res.success && res.data) {
        setCategoriesList(res.data);
        if (res.data.length > 0) setCategory(res.data[0].name);
      }
    });
  }, []);

  const handleAddCategory = async () => {
    const newCat = window.prompt("ระบุชื่อหมวดหมู่ใหม่:");
    if (!newCat || newCat.trim() === "") return;
    const res = await createCategory(newCat.trim(), "หมวดหมู่สร้างด่วน");
    if (res.success) {
      setCategoriesList([...categoriesList, { id: res.id, name: newCat.trim() }]);
      setCategory(newCat.trim());
      alert(`เพิ่มหมวดหมู่ '${newCat.trim()}' สำเร็จ!`);
    } else {
      alert("ไม่สามารถเพิ่มหมวดหมู่ได้ หรืออาจมีชื่อนี้อยู่แล้วในระบบ");
    }
  };

  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState(0);
  const [supplierCost, setSupplierCost] = useState(0);
  const [markupRate, setMarkupRate] = useState(0);
  const [quantity, setQuantity] = useState(0);

  // Markup Calculator Functions
  const calculatePriceFromCost = (cost: number, markup: number) => {
    return cost * (1 + markup);
  };

  const calculateMarkupFromPrice = (cost: number, price: number) => {
    return cost > 0 ? (price - cost) / cost : 0;
  };

  const calculateMarginFromPrice = (cost: number, price: number) => {
    return price > 0 ? (price - cost) / price : 0;
  };

  // Auto-calculate price when supplier cost or markup changes
  useEffect(() => {
    const newPrice = calculatePriceFromCost(supplierCost, markupRate);
    setPrice(Math.round(newPrice * 100) / 100); // Round to 2 decimal places
  }, [supplierCost, markupRate]);

  // Auto-calculate markup when supplier cost or price changes
  useEffect(() => {
    if (supplierCost > 0 && price > 0) {
      const newMarkup = calculateMarkupFromPrice(supplierCost, price);
      setMarkupRate(Math.round(newMarkup * 10000) / 10000); // Round to 4 decimal places
    }
  }, [supplierCost, price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createProduct({
      name,
      category_name: category,
      type,
      sku_number: sku,
      source_info: source,
      storage_location: location,
      stock_quantity: quantity,
      price: price,
      product_notes: notes,
      supplier_cost: supplierCost,
      markup_rate: markupRate
    });
    setLoading(false);
    if (res.success) {
      alert("เพิ่มสินค้าใหม่เข้าคลังเรียบร้อยแล้ว");
      router.push("/inventory");
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (res.error || "Unknown error"));
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Breadcrumb Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ลงทะเบียนสินค้าใหม่</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 uppercase tracking-widest font-black text-[10px]">
                 <Link href="/inventory" className="text-blue-600 hover:underline">Inventory</Link>
                 <span>/</span>
                 <span>New Product</span>
              </div>
            </div>
            <div className="flex gap-2">
               <Link href="/inventory" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
               </Link>
               <button 
                type="submit"
                disabled={loading}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 text-sm shadow-md transition-all disabled:opacity-50"
               >
                  <Save size={18} /> {loading ? "กำลังบันทึก..." : "บันทึกสินค้า"}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            
            {/* Main Form Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
                     <h3 className="font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tighter">
                        <Package size={18} /> ข้อมูลพื้นฐานสินค้า
                     </h3>
                  </div>
                  
                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ชื่อสินค้า</label>
                           <input 
                              type="text" 
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700" 
                              placeholder="ระบุชื่อสินค้าเต็ม"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 text-blue-600 font-black">SKU / รหัสคลังสินค้า</label>
                           <input 
                              type="text" 
                              required
                              value={sku}
                              onChange={(e) => setSku(e.target.value)}
                              className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-blue-700 shadow-inner" 
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ประเภทสินค้า</label>
                           <select 
                             value={type}
                             onChange={(e) => setType(e.target.value)}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700"
                           >
                              <option value="ในสต็อก (Physical)">สินค้าในสต็อก (Physical)</option>
                              <option value="Dropship">สินค้า Dropship</option>
                              <option value="License Online">License Online</option>
                              <option value="งานบริการ (Service)">งานบริการ (Service)</option>
                           </select>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">หมวดหมู่ (Category)</label>
                             <button type="button" onClick={handleAddCategory} className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 transition-colors">
                               + เพิ่มใหม่
                             </button>
                           </div>
                           <select 
                             value={category}
                             onChange={(e) => setCategory(e.target.value)}
                             className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700"
                           >
                              {categoriesList.length === 0 && <option value="">(ไม่มีหมวดหมู่)</option>}
                              {categoriesList.map(cat => (
                                <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                              ))}
                           </select>
                        </div>
                        
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                              <Coins size={14} className="text-green-500" /> ราคา (Price)
                           </label>
                           <input 
                              type="number" 
                              value={price}
                              onChange={(e) => setPrice(Number(e.target.value))}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                           />
                        </div>

                        {/* New Supplier Cost Field */}
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                              <Truck size={14} className="text-orange-500" /> ต้นทุนจากผู้ขาย (Supplier Cost)
                           </label>
                           <input 
                              type="number" 
                              value={supplierCost}
                              onChange={(e) => setSupplierCost(Number(e.target.value))}
                              className="w-full h-11 px-4 bg-orange-50 border border-orange-200 rounded focus:border-orange-500 focus:bg-white text-sm font-bold text-orange-700" 
                              placeholder="0.00"
                              step="0.01"
                           />
                        </div>

                        {/* New Markup Rate Field */}
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                              <Zap size={14} className="text-purple-500" /> อัตรากำไร (Markup Rate %)
                           </label>
                           <div className="flex gap-2">
                              <input 
                                 type="number" 
                                 value={markupRate}
                                 onChange={(e) => setMarkupRate(Number(e.target.value))}
                                 className="flex-1 h-11 px-4 bg-purple-50 border border-purple-200 rounded focus:border-purple-500 focus:bg-white text-sm font-bold text-purple-700" 
                                 placeholder="0.30"
                                 step="0.0001"
                                 min="0"
                                 max="10"
                              />
                              <div className="h-11 px-4 bg-purple-100 border border-purple-200 rounded flex items-center text-sm font-bold text-purple-600 min-w-[80px]">
                                 {(markupRate * 100).toFixed(2)}%
                              </div>
                           </div>
                           <div className="text-xs text-gray-500 mt-1">
                              กำไร: ฿{(price - supplierCost).toFixed(2)} | Margin: {calculateMarginFromPrice(supplierCost, price).toFixed(2)}%
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                              <Package size={14} className="text-blue-500" /> จำนวนเริ่มต้น (Initial Stock)
                           </label>
                           <input 
                              type="number" 
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                              <Truck size={14} className="text-blue-400" /> แหล่งที่มา (Source)
                           </label>
                           <input 
                              type="text" 
                              value={source}
                              onChange={(e) => setSource(e.target.value)}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                              placeholder="เช่น นำเข้าจากจีน, บ. เทพ"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                              <MapPin size={14} className="text-red-500" /> ที่เก็บสินค้า (Location)
                           </label>
                           <input 
                              type="text" 
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                              placeholder="โกดัง A, ชั้น 2 (เว้นว่างได้ถ้าไม่ใช่ Physical)"
                           />
                        </div>
                     </div>

                     <div className="space-y-2 pt-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2 font-black">
                           <Notebook size={14} className="text-orange-500" /> รายละเอียดเพิ่มเติม (Notes)
                        </label>
                        <textarea 
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-gray-700 resize-none" 
                          placeholder="ระบุหมายเหตุหรือรายละเอียดคุณสมบัติสินค้า..."
                        ></textarea>
                     </div>
                  </div>
              </div>
            </div>

            {/* Generator Preview Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex flex-col items-center">
                  <h3 className="font-bold text-gray-700 mb-8 border-b border-gray-100 w-full pb-4 uppercase tracking-tighter text-center italic">QR & Barcode Preview</h3>
                  
                  <div className="bg-white p-4 border border-gray-200 rounded shadow-inner mb-6">
                     {sku ? (
                       <QRCodeSVG 
                          value={sku} 
                          size={140}
                          level="Q"
                       />
                     ) : (
                       <div className="w-40 h-40 flex items-center justify-center text-[10px] text-gray-400">Loading QR code...</div>
                     )}
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Scan to verify {sku || "(generating...)"}</p>

                  <div className="bg-white px-6 py-4 border border-gray-200 rounded shadow-sm mb-6 w-full flex justify-center overflow-hidden">
                     {sku ? (
                       <BarcodeComponent 
                          value={sku} 
                          width={1.2} 
                          height={50} 
                          fontSize={11}
                          background="transparent"
                       />
                     ) : (
                       <div className="text-[10px] text-gray-400">Preparing barcode...</div>
                     )}
                  </div>

                  <div className="w-full p-4 bg-blue-50 rounded border border-blue-100 flex items-center gap-3">
                     <Zap size={18} className="text-blue-600" />
                     <div className="flex flex-col">
                        <p className="text-xs font-bold text-blue-700 tracking-tight">ระบบสร้างรหัสอัตโนมัติ</p>
                        <p className="text-[10px] text-blue-500">พร้อมฟอร์แมตฉลากสินค้า</p>
                     </div>
                  </div>
              </div>

              <div className="bg-blue-600 text-white p-8 rounded shadow-sm border border-blue-500">
                 <h3 className="text-white font-bold mb-4 flex items-center gap-2 italic uppercase tracking-widest text-[10px]">
                    <QrCode size={18} opacity={0.5} /> Neon Data Integrity
                 </h3>
                 <p className="text-[10px] leading-relaxed opacity-80 font-bold">
                    รหัสด้านบนจะถูกบันทึกลงในฐานข้อมูล Cloud ทันที เพื่อประยุกต์ใช้กับเครื่องสแกนหน้าคลังสินค้าในอนาคต
                 </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           <p className="font-bold mb-1">© 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
           <p className="italic opacity-80">เราสร้าง Software เฉพาะทาง เพื่อขับเคลื่อนธุรกิจให้ก้าวล้ำ</p>
        </div>
      </div>
    </main>
  );
}
