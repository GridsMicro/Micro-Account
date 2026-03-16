"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Users, 
  UserPlus,
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Globe
} from "lucide-react";

export default function NewContactPage() {
  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
               <UserPlus className="text-blue-600" /> ลงทะเบียนรายชื่อใหม่
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
               <Link href="/contacts" className="text-blue-500 hover:underline">Contacts</Link>
               <ChevronRight size={10} />
               <span>New Entry</span>
            </div>
          </div>
          <button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm">
             <Save size={18} /> บันทึกข้อมูล
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
           
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                 <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tighter">
                    <Building2 size={18} /> ข้อมูลพื้นฐาน (Basic Info)
                 </div>
                 
                 <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ชื่อเต็ม / ชื่อบริษัท</label>
                          <input type="text" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold" placeholder="Customer or Company Name" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ประเภท</label>
                          <select className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold">
                             <option>Customer (ลูกค้า)</option>
                             <option>Vendor (ซัพพลายเออร์)</option>
                             <option>Internal (ภายใน)</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">อีเมล (Email)</label>
                          <input type="email" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" placeholder="example@mail.com" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">เบอร์โทรศัพท์ (Phone)</label>
                          <input type="text" className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" placeholder="02-XXX-XXXX" />
                       </div>
                    </div>
                    <div className="space-y-1 pt-4">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ที่อยู่ (Registered Address)</label>
                       <textarea rows={4} className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm resize-none leading-relaxed" placeholder="ระบุที่อยู่สำนักงานใหญ่หรือสาขาสำหรับออกใบกำกับภาษี"></textarea>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border border-blue-100 italic">
                    <Globe size={32} />
                 </div>
                 <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-2">CRM Integrated</h3>
                 <p className="text-xs text-gray-500 leading-relaxed italic">
                    ข้อมูลผู้ติดต่อจะถูกนำไปใช้ในระบบใบเสนอราคาและใบแจ้งหนี้เพื่อความสะดวกในการจัดการบัญชี
                 </p>
              </div>

              <div className="bg-blue-600 text-white p-8 rounded shadow-sm flex flex-col items-center">
                 <ShieldCheck size={40} className="mb-4 opacity-50" />
                 <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Data Security</p>
                 <p className="text-[10px] opacity-70">Saved to Secure Cloud Database</p>
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
