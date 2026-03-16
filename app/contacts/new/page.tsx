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
  Zap,
  Globe
} from "lucide-react";

export default function NewContactPage() {
  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-12">
           <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <Link href="/contacts" className="flex items-center gap-2 hover:text-white transition-colors">
                <ArrowLeft size={14} />
                CONTACTS LIST
              </Link>
              <ChevronRight size={14} className="text-slate-700" />
              <span className="text-slate-500">เพิ่มผู้ติดต่อใหม่</span>
           </div>
           <div className="bg-indigo-500/10 px-4 py-2 rounded-xl flex items-center gap-3 border border-indigo-500/20">
              <ShieldCheck size={14} className="text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Secure Database Entry</span>
           </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
          <div className="space-y-2 text-left">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               REGISTER <span className="text-indigo-500">CONTACT</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">ลงทะเบียนข้อมูลลูกค้าหรือคู่ค้าใหม่ลงในระบบ</p>
          </div>
          <button className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center justify-center gap-3 active:scale-95 group text-lg">
             <Save size={24} />
             SAVE CONTACT
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
           {/* Main Form */}
           <div className="lg:col-span-2 space-y-10">
              <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-bl-[4rem]" />
                 
                 <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                       <UserPlus size={24} />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">Basic Information</h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ชื่อบุคคล / ชื่อบริษัท</label>
                       <div className="relative group">
                          <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input type="text" className="w-full h-16 pl-14 pr-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all" placeholder="Customer Name" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ประเภทผู้ติดต่อ</label>
                       <select className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none appearance-none">
                          <option>Customer (ลูกค้า)</option>
                          <option>Vendor (ซัพพลายเออร์)</option>
                          <option>Internal (ภายใน)</option>
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">อีเมล (Email)</label>
                       <div className="relative group">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input type="email" className="w-full h-16 pl-14 pr-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none shadow-inner" placeholder="example@mail.com" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">เบอร์โทรศัพท์ (Phone)</label>
                       <div className="relative group">
                          <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <input type="text" className="w-full h-16 pl-14 pr-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none shadow-inner" placeholder="02-XXX-XXXX" />
                       </div>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ที่อยู่ / ข้อมูลการจัดส่ง (Address)</label>
                       <div className="relative group">
                          <MapPin className="absolute left-5 top-6 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                          <textarea rows={4} className="w-full p-6 pl-14 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none shadow-inner resize-none leading-relaxed" placeholder="ที่ตั้งสำนักงาน หรือที่อยู่จัดส่งสินค้า..."></textarea>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-10">
              <div className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                       <Globe size={20} />
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Local Search</h3>
                 </div>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                    ข้อมูลผู้ติดต่อจะถูกเชื่อมโยงกับระบบแจ้งหนี้และคลังสินค้าโดยอัตโนมัติเพื่อวิเคราะห์พฤติกรรมการซื้อ
                 </p>
                 <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">AI CRM Enabled</span>
                 </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden text-center">
                 <Zap size={60} className="text-white/5 absolute -right-4 -bottom-4" />
                 <Users size={40} className="text-indigo-400 mx-auto mb-6" />
                 <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2">Relationship Management</h3>
                 <p className="text-slate-500 font-bold text-[10px] tracking-[0.2em] uppercase">Core Business Logic</p>
              </div>
           </div>
        </div>
      </div>
    </main>
  );
}
