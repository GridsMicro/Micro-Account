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
  X
} from "lucide-react";

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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Building2 size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">ข้อมูลบริษัท</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Company Profile</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อนิติบุคคล / บริษัท</label>
                  <input 
                    type="text" 
                    value={company?.name || ""} 
                    onChange={(e) => setCompany({...company, name: e.target.value})}
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">เลขประจำตัวผู้เสียภาษี</label>
                  <input 
                    type="text" 
                    value={company?.tax_id || ""} 
                    onChange={(e) => setCompany({...company, tax_id: e.target.value})}
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ที่อยู่จดทะเบียนบรรษัท</label>
                  <textarea 
                    rows={3} 
                    value={company?.address || ""} 
                    onChange={(e) => setCompany({...company, address: e.target.value})}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none" 
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-4">
                <button className="h-14 px-8 border-2 border-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2">
                  <X size={20} />
                  ยกเลิก
                </button>
                <button 
                  onClick={() => alert("ระบบกำลังบันทึกข้อมูลบริษัท...")}
                  className="h-14 px-10 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Save size={20} />
                  บันทึกข้อมูล
                </button>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-600/30 group-hover:bg-blue-600/30 transition-all">
                  <HardDrive size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Cloud Database Status</h3>
                  <p className="text-green-400 font-bold flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    เชื่อมต่อสำเร็จ (Neon Powered)
                  </p>
                </div>
              </div>
              <button onClick={() => alert("Connection Stable - Latency: 45ms")} className="h-12 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all whitespace-nowrap active:scale-95">
                Test Connection
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-white p-20 rounded-[2.5rem] border border-slate-100 shadow-sm text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
              <Shield size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">กำลังพัฒนา...</h2>
            <p className="text-slate-500 font-medium">โมดูล "{menuItems.find(i => i.id === activeTab)?.label}" จะเปิดให้บริการเร็วๆ นี้</p>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Menu Column */}
      <div className="lg:col-span-1 space-y-3">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold transition-all text-left group ${
              activeTab === item.id 
                ? 'bg-white shadow-xl shadow-blue-900/5 text-blue-600 border border-slate-100' 
                : 'text-slate-400 hover:bg-white/50 hover:text-slate-700'
            }`}
          >
            <item.icon size={22} className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`} />
            <span className="flex-1">{item.label}</span>
            {activeTab === item.id && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-lg shadow-blue-200" />}
          </button>
        ))}
      </div>

      {/* Form Column */}
      <div className="lg:col-span-2">
        {renderContent()}
      </div>
    </div>
  );
}
