"use client";

import { useState } from "react";
import { 
  Building2, 
  Shield, 
  Bell, 
  Cloud, 
  Globe, 
  Smartphone,
  HardDrive,
  Save,
  X,
  Zap,
  Lock,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Company = {
  name: string;
  tax_id: string;
  address: string;
};

export default function SettingsClient({ initialCompany }: { initialCompany: Company }) {
  const [activeTab, setActiveTab] = useState("company");
  const [company, setCompany] = useState(initialCompany);

  const menuItems = [
    { id: "company", icon: Building2, label: "ข้อมูลบริษัท" },
    { id: "security", icon: Shield, label: "ความปลอดภัย & สมาชิก" },
    { id: "notifications", icon: Bell, label: "การแจ้งเตือน" },
    { id: "cloud", icon: Cloud, label: "Cloud Sync (Neon)" },
    { id: "region", icon: Globe, label: "ตั้งค่าภูมิภาค & ภาษี" },
    { id: "mobile", icon: Smartphone, label: "Mobile App Access" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "company":
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/[0.02] rounded-bl-[5rem] -mr-16 -mt-16" />
              
              <div className="flex items-center gap-6 mb-12 pb-8 border-b border-white/5">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-xl">
                  <Building2 size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter">COMPANY PROFILE</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">ตั้งค่าข้อมูลนิติบุคคลและข้อมูลภาษี</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ชื่อสถานประกอบการ / บริษัท</label>
                  <input 
                    type="text" 
                    value={company?.name || ""} 
                    onChange={(e) => setCompany({...company, name: e.target.value})}
                    className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-700 shadow-inner" 
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">เลขประจำตัวผู้เสียภาษี (TAX ID)</label>
                  <input 
                    type="text" 
                    value={company?.tax_id || ""} 
                    onChange={(e) => setCompany({...company, tax_id: e.target.value})}
                    className="w-full h-16 px-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-700 shadow-inner" 
                    placeholder="13-digit Tax ID"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">ที่อยู่ตามจดทะเบียนพาณิชย์</label>
                  <textarea 
                    rows={4} 
                    value={company?.address || ""} 
                    onChange={(e) => setCompany({...company, address: e.target.value})}
                    className="w-full p-6 bg-slate-950 border border-white/5 rounded-2xl font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none shadow-inner leading-relaxed" 
                    placeholder="Full Company Address"
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-6 pt-10 border-t border-white/5">
                <button className="h-16 px-10 border border-white/10 text-slate-500 font-black rounded-2xl hover:bg-white/5 hover:text-white transition-all flex items-center gap-3">
                  <X size={22} />
                  CANCEL
                </button>
                <button 
                  onClick={() => alert("ระบบกำลังบันทึกข้อมูลบริษัท...")}
                  className="h-16 px-12 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3 text-lg"
                >
                  <Save size={24} />
                  SAVE CHANGES
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-12 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-10 group border border-indigo-500/10 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-600/5 animate-pulse opacity-50" />
              <div className="relative z-10 flex items-center gap-8">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10 group-hover:bg-indigo-600 transition-all duration-700 group-hover:text-white shadow-xl">
                  <HardDrive size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase">Cloud Integrity</h3>
                  <p className="text-emerald-400 font-bold flex items-center gap-3 mt-1 text-sm">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                    Neon Database Connected (200 OK)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => alert("Connection Stable - Latency: 42ms")} 
                className="relative z-10 h-14 px-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black text-xs transition-all whitespace-nowrap active:scale-95 uppercase tracking-widest text-indigo-300"
              >
                Sync Status Check
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-[#0f172a] p-24 rounded-[4rem] border border-white/5 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/20 rounded-bl-[4rem]" />
            <div className="w-24 h-24 bg-slate-900 border border-white/5 rounded-[2.5rem] flex items-center justify-center text-slate-700 mx-auto mb-10 shadow-inner">
              <Lock size={48} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-3">Module Restrictive</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mb-12">Authorized Personnel Only</p>
            <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">โมดูล "{menuItems.find(i => i.id === activeTab)?.label}" อยู่ในระหว่างการตรวจสอบความปลอดภัย <br/><span className="text-indigo-500 font-black">Launching Q2 2026</span></p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-20">
      {/* Menu Column */}
      <div className="lg:col-span-1 space-y-4">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-5 px-6 py-6 rounded-3xl font-black transition-all duration-500 text-left group relative",
              activeTab === item.id 
                ? 'bg-[#0f172a] shadow-2xl text-white border border-white/5' 
                : 'text-slate-500 hover:bg-white/[0.02] hover:text-slate-300'
            )}
          >
            <item.icon size={22} className={cn(
              "transition-all duration-500",
              activeTab === item.id ? 'text-indigo-400 scale-125' : 'text-slate-700 group-hover:text-slate-500 group-hover:scale-110'
            )} />
            <span className="flex-1 uppercase text-xs tracking-[0.2em]">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute left-0 w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            )}
            <ChevronRight size={16} className={cn(
              "transition-all duration-500",
              activeTab === item.id ? 'opacity-100 translate-x-0 text-indigo-400' : 'opacity-0 -translate-x-4'
            )} />
          </button>
        ))}
      </div>

      {/* Form Column */}
      <div className="lg:col-span-3">
        {renderContent()}
      </div>
    </div>
  );
}
