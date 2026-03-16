"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  FileText,
  User,
  Zap,
  ChevronRight
} from "lucide-react";

export default function NewQuotationPage() {
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
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">สร้างใบเสนอราคาใหม่ (New Quotation)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
               <Link href="/quotations" className="text-blue-600 hover:underline">Quotations</Link>
               <span>/</span>
               <span>Create</span>
            </div>
          </div>
          <button className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm transition-all flex items-center gap-2 text-sm">
             <Save size={16} /> บันทึกเอกสาร
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-700">
                   <User size={18} /> ข้อมูลลูกค้า / คู่ค้า
                </div>
                <div className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">เลือกลูกค้า</label>
                      <select className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold">
                         <option>ยังไม่เลือกบริษัทลูกค้า</option>
                         <option>บริษัท อย่างดี จํากัด</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">หมายเหตุภายใน</label>
                      <textarea rows={2} className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" placeholder="ระบุข้อมูลเพิ่มเติมถ้ามี..."></textarea>
                   </div>
                </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <FileText size={18} /> รายการเสนอราคา
                   </h3>
                   <button onClick={addItem} className="h-8 px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1">
                      <Plus size={14} /> เพิ่มแถว
                   </button>
                </div>
                <div className="overflow-x-auto p-0">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Description</th>
                            <th className="px-4 py-4 text-center w-20">Qty</th>
                            <th className="px-4 py-4 text-right w-36">Price/Unit</th>
                            <th className="px-8 py-4 text-right w-36">Total</th>
                            <th className="px-4 py-4 w-10"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {items.map((item) => (
                            <tr key={item.id} className="text-sm">
                               <td className="px-8 py-5">
                                  <input type="text" placeholder="ชื่อสินค้าหรือบริการ" className="w-full border-b border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700 py-1" />
                               </td>
                               <td className="px-4 py-5 text-center">
                                  <input type="number" defaultValue={1} className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-center" />
                               </td>
                               <td className="px-4 py-5">
                                  <input type="number" defaultValue={0} className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-right" />
                               </td>
                               <td className="px-8 py-5 text-right font-bold text-blue-600 italic">
                                  ฿0.00
                               </td>
                               <td className="px-4 py-5 text-right">
                                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500">
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

          <div className="space-y-6">
             <div className="bg-white rounded shadow-sm border border-gray-200 p-8 space-y-6">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                   <Calendar size={18} className="text-blue-600" /> ข้อมูลเอกสาร
                </h3>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">หมายเลขเอกสาร</label>
                      <input type="text" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded font-bold text-blue-600" defaultValue="QT-2026-0001" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">วันที่เอกสาร</label>
                      <input type="date" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium" defaultValue={new Date().toISOString().split('T')[0]} />
                   </div>
                </div>
             </div>

             <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-6">สรุปยอดรวม</h3>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Subtotal</span>
                      <span>฿0.00</span>
                   </div>
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>VAT 7%</span>
                      <span>฿0.00</span>
                   </div>
                   <div className="h-px bg-gray-100 my-4" />
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Grand Total</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">฿0.00</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
