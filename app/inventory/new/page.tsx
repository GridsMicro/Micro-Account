"use client";

import { useState } from "react";
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
  Truck
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
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ลงทะเบียนสินค้าใหม่</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
               <Link href="/inventory" className="text-blue-600 hover:underline">Inventory</Link>
               <span>/</span>
               <span>New Product</span>
            </div>
          </div>
          <div className="flex gap-2">
             <Link href="/inventory" className="h-10 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                ยกเลิก
             </Link>
             <button className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 text-sm shadow-md transition-all">
                <Save size={16} /> บันทึกสินค้า
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          
          {/* Main Form Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-5 border-b border-gray-200">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Package size={18} /> ข้อมูลพื้นฐานสินค้า
                   </h3>
                </div>
                
                <div className="p-8 space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ชื่อสินค้า</label>
                         <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-medium" 
                            placeholder="ระบุชื่อสินค้าเต็ม"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 text-blue-600">SKU / รหัสคลังสินค้า</label>
                         <input 
                            type="text" 
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-bold text-blue-700" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                            <Truck size={14} className="text-blue-500" /> แหล่งที่มา (Source)
                         </label>
                         <input 
                            type="text" 
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                            placeholder="เช่น นำเข้าจากจีน, บ. เทพ"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                            <MapPin size={14} className="text-red-500" /> ที่เก็บสินค้า (Location)
                         </label>
                         <input 
                            type="text" 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                            placeholder="โกดัง A, ชั้น 2"
                         />
                      </div>
                   </div>

                   <div className="space-y-2 pt-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                         <Notebook size={14} className="text-orange-500" /> รายละเอียดเพิ่มเติม (Notes)
                      </label>
                      <textarea 
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm resize-none" 
                        placeholder="ระบุหมายเหตุหรือรายละเอียดคุณสมบัติสินค้า..."
                      ></textarea>
                   </div>
                </div>
            </div>
          </div>

          {/* Generator Preview Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex flex-col items-center">
                <h3 className="font-bold text-gray-700 mb-8 border-b border-gray-100 w-full pb-4 uppercase tracking-tighter text-center">QR & Barcode Preview</h3>
                
                <div className="bg-white p-4 border border-gray-200 rounded shadow-inner mb-6">
                   <QRCodeSVG 
                      value={sku} 
                      size={140}
                      level="Q"
                   />
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Scan to verify {sku}</p>

                <div className="bg-white px-6 py-4 border border-gray-200 rounded shadow-sm mb-6 w-full flex justify-center overflow-hidden">
                   <BarcodeComponent 
                      value={sku} 
                      width={1.2} 
                      height={50} 
                      fontSize={11}
                      background="transparent"
                   />
                </div>

                <div className="w-full p-4 bg-blue-50 rounded border border-blue-100 flex items-center gap-3">
                   <Zap size={18} className="text-blue-600" />
                   <div className="flex flex-col">
                      <p className="text-xs font-bold text-blue-700 tracking-tight">ระบบสร้างรหัสอัตโนมัติ</p>
                      <p className="text-[10px] text-blue-500">พร้อมฟอร์แมตฉลากสินค้า</p>
                   </div>
                </div>
            </div>

            <div className="bg-[#343a40] text-gray-300 p-8 rounded shadow-sm border border-gray-700">
               <h3 className="text-white font-bold mb-4 flex items-center gap-2 italic">
                  <QrCode size={18} /> System Status
               </h3>
               <p className="text-xs leading-relaxed opacity-80">
                  รหัสด้านบนจะถูกบันทึกลงในฐานข้อมูล Inventory ทันที เพื่อประยุกต์ใช้กับเครื่องสแกนหน้าคลังสินค้า
               </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
