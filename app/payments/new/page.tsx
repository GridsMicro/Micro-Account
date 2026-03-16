"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  CreditCard, 
  User, 
  Calendar, 
  DollarSign,
  Zap,
  Building2
} from "lucide-react";

export default function NewPaymentPage() {
  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">บันทึกการรับชำระเงิน (New Payment)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 uppercase tracking-widest font-black text-[10px]">
               <Link href="/payments" className="text-blue-500 hover:underline">Payments</Link>
               <span>/</span>
               <span className="text-gray-400">Record New</span>
            </div>
          </div>
          <button className="h-11 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm">
             <Save size={18} /> บันทึกการรับเงิน
          </button>
        </div>

        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tighter">
              <CreditCard size={18} /> ข้อมูลการชำระเงิน
           </div>
           
           <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ลูกค้า (Customer)</label>
                    <select className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold">
                       <option>เลือกรายชื่อลูกค้า</option>
                       <option>บริษัท อย่างดี จำกัด</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">อ้างอิงใบแจ้งหนี้ (Invoice Ref)</label>
                    <input type="text" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" placeholder="IV-2026-XXXX" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">วันที่รับชำระ</label>
                    <input type="date" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded text-sm font-medium" defaultValue={new Date().toISOString().split('T')[0]} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-green-600">จำนวนเงินที่ได้รับ (฿)</label>
                    <input type="number" className="w-full h-11 px-4 bg-green-50 border border-green-200 rounded focus:border-green-500 focus:bg-white text-lg font-black text-green-700" placeholder="0.00" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 text-blue-600">ช่องทางการเงิน</label>
                    <select className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-blue-700">
                       <option>Bank Transfer (โอนเงินผ่านธนาคาร)</option>
                       <option>Cash (เงินสด)</option>
                       <option>Credit Card (บัตรเครดิต)</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">หมายเลขบันทึก (Ref No)</label>
                    <input type="text" className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded text-sm font-medium" placeholder="เช่น 0001" />
                 </div>
              </div>

              <div className="pt-6 border-t border-gray-100 italic">
                 <div className="bg-gray-50 p-6 rounded border border-gray-200 flex items-center gap-4">
                    <Zap size={24} className="text-yellow-500" />
                    <div>
                       <p className="text-xs font-bold text-gray-700 uppercase tracking-tighter">AI Payment Sync</p>
                       <p className="text-[10px] text-gray-500">ข้อมูลการชำระเงินจะถูกปรับปรุงไปยังสถานะใบเสนอราคาและใบแจ้งหนี้อัตโนมัติ</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
