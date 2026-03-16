"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  Receipt,
  User,
  Zap,
  ShieldCheck,
  Building2
} from "lucide-react";

export default function NewInvoicePage() {
  const [items, setItems] = useState([{ id: 1, desc: "", qty: 1, price: 0 }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: "", qty: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ออกใบแจ้งหนี้ใหม่ (New Invoice)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
               <Link href="/invoices" className="text-blue-600 hover:underline">Invoices</Link>
               <span>/</span>
               <span>Create</span>
            </div>
          </div>
          <div className="flex gap-2">
             <Link href="/invoices" className="h-10 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                ยกเลิก
             </Link>
             <button className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 text-sm shadow-md transition-all">
                <ShieldCheck size={16} /> บันทึกและออกเอกสาร
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Selection Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <User size={18} /> ข้อมูลลูกค้า
                   </h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">เลือกลูกค้าที่จะเรียกเก็บเงิน</label>
                      <select className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold">
                         <option>ยังไม่มีข้อมูลลูกค้า</option>
                         <option>บริษัท ลูกค้าชั้นดี จำกัด</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">อ้างอิงใบเสนอราคา (Ref Code)</label>
                      <input type="text" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" placeholder="เช่น QT-2026-0001" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">กำหนดชำระ (Due Date)</label>
                      <input type="date" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" />
                   </div>
                </div>
            </div>

            {/* Line Items Table Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Receipt size={18} /> รายการสินค้า / บริการ
                   </h3>
                   <button onClick={addItem} className="h-8 px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1">
                      <Plus size={14} /> เพิ่มรายการ
                   </button>
                </div>

                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Description</th>
                            <th className="px-4 py-4 text-center w-24">Qty</th>
                            <th className="px-4 py-4 text-right w-40">Price/Unit</th>
                            <th className="px-8 py-4 text-right w-40">Total</th>
                            <th className="px-4 py-4 w-12"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {items.map((item) => (
                            <tr key={item.id} className="text-sm">
                               <td className="px-8 py-6">
                                  <input type="text" placeholder="ระบุสินค้า / บริการ" className="w-full border-b border-gray-200 focus:border-blue-500 focus:outline-none font-bold text-gray-700 py-1 transition-all" />
                               </td>
                               <td className="px-4 py-6">
                                  <input type="number" defaultValue={1} className="w-full bg-gray-50 border border-gray-200 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-bold" />
                               </td>
                               <td className="px-4 py-6">
                                  <input type="number" defaultValue={0} className="w-full bg-gray-50 border border-gray-200 rounded py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right font-bold" />
                               </td>
                               <td className="px-8 py-6 text-right font-bold text-blue-600">
                                  ฿0.00
                               </td>
                               <td className="px-4 py-6 text-right">
                                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                     <Trash2 size={16} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
          </div>

          {/* Totals Sidebar Card */}
          <div className="space-y-6">
             <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-8 border-b border-gray-100 pb-4">สรุปยอดเงินสุทธิ</h3>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <span>Invoiced Amount</span>
                      <span className="text-gray-800">฿0.00</span>
                   </div>
                   <div className="flex justify-between items-center text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <span>VAT 7.0%</span>
                      <span className="text-gray-800">฿0.00</span>
                   </div>
                   <div className="h-px bg-gray-100 my-4" />
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">ยอดชำระสุทธิ</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">฿0.00</span>
                   </div>
                </div>
                
                <div className="mt-10 p-4 bg-gray-50 rounded border border-gray-200 flex items-center gap-3">
                   <Zap size={18} className="text-yellow-500" />
                   <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">ข้อมูลจะถูกเชื่อมโยงไปยังระบบคลังสินค้าอัตโนมัติ</p>
                </div>
             </div>

             <div className="bg-gray-800 text-white p-6 rounded shadow-sm text-center">
                <Building2 size={32} className="text-gray-500 mx-auto mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Microtronic Tech</p>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
