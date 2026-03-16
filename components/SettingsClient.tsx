"use client";

import { useState } from "react";
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Database,
  Save,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: 'company', icon: Building2, label: "ข้อมูลบริษัท (Profile)" },
  { id: 'tax', icon: ShieldCheck, label: "ข้อมูลภาษี (Tax Info)" },
  { id: 'bank', icon: Briefcase, label: "บัญชีธนาคาร (Bank)" },
  { id: 'system', icon: Database, label: "ฐานข้อมูล (System)" },
];

export default function SettingsClient({ initialData }: { initialData: any }) {
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Navigation Card */}
      <div className="lg:col-span-1">
         <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
               <h3 className="font-bold text-gray-700 text-sm">การตั้งค่า (Menu)</h3>
            </div>
            <nav className="p-2 space-y-1">
               {menuItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={cn(
                     "w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold transition-all",
                     activeTab === item.id 
                       ? "bg-blue-600 text-white shadow-md shadow-blue-100" 
                       : "text-gray-600 hover:bg-gray-100"
                   )}
                 >
                   <item.icon size={18} />
                   {item.label}
                 </button>
               ))}
            </nav>
         </div>
      </div>

      {/* Content Area Card */}
      <div className="lg:col-span-3">
         <div className="bg-white rounded shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-200 flex justify-between items-center">
               <h3 className="font-bold text-gray-800 text-lg uppercase tracking-tight">
                  {menuItems.find(m => m.id === activeTab)?.label}
               </h3>
               <button className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white font-bold rounded flex items-center gap-2 text-sm transition-all shadow-sm">
                  <Save size={16} /> บันทึกข้อมูล
               </button>
            </div>

            <div className="p-10 flex-1">
               {activeTab === 'company' && (
                 <div className="max-w-3xl space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ชื่อบริษัท (ไทย)</label>
                          <input type="text" defaultValue={initialData?.name} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-medium" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">TAX ID (เลขที่ผู้เสียภาษี)</label>
                          <input type="text" defaultValue={initialData?.tax_id} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-medium" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                          <input type="text" defaultValue={initialData?.phone} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-medium" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">อีเมลติดต่อ</label>
                          <input type="email" defaultValue={initialData?.email} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-medium" />
                       </div>
                       <div className="md:col-span-2 space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ที่อยู่จดทะเบียน (Address)</label>
                          <textarea rows={4} defaultValue={initialData?.address} className="w-full p-4 bg-gray-50 border border-gray-200 rounded focus:border-blue-500 focus:bg-white focus:outline-none text-sm font-medium resize-none leading-relaxed"></textarea>
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === 'tax' && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-20">
                     <ShieldCheck size={64} className="text-blue-100" />
                     <p className="text-gray-400 font-bold italic">ระบบจัดการคำนวณภาษีถูกเปิดใช้งานเป็นพรีเซ็ต</p>
                  </div>
               )}
               
               {activeTab !== 'company' && activeTab !== 'tax' && (
                  <div className="text-center py-20 text-gray-300 italic font-medium">กำลังเตรียมพร้อมข้อมูลส่วนนี้...</div>
               )}
            </div>
            
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-xs text-gray-400 font-bold">
               Status: System Fully Operational
            </div>
         </div>
      </div>

    </div>
  );
}
