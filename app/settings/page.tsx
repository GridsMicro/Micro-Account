import { query } from "@/lib/db";
import { Settings, Building2, Shield, Bell, Cloud, Globe, HardDrive, Smartphone } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getSettingsData() {
  const companyRes = await query('SELECT * FROM company LIMIT 1');
  return {
    company: companyRes.rows[0]
  };
}

export default async function SettingsPage() {
  const { company } = await getSettingsData();

  return (
    <main className="p-10 font-sans pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">ตั้งค่าระบบ (Settings)</h1>
            <p className="text-slate-500 font-medium">จัดการข้อมูลบริษัท ความปลอดภัย และการเชื่อมต่อคลาวด์</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Menu Column */}
          <div className="lg:col-span-1 space-y-2">
            {[
              { icon: Building2, label: "ข้อมูลบริษัท", active: true },
              { icon: Shield, label: "ความปลอดภัย & สมาชิก" },
              { icon: Bell, label: "การแจ้งเตือน" },
              { icon: Cloud, label: "Cloud Sync (Neon)" },
              { icon: Globe, label: "ตั้งค่าภูมิภาค & ภาษี" },
              { icon: SmartPhone, label: "Mobile App Access" },
            ].map((item, idx) => (
              <button 
                key={idx}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all text-left ${item.active ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'}`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2 space-y-8">
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
                        <input type="text" defaultValue={company?.name} className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">เลขประจำตัวผู้เสียภาษี</label>
                        <input type="text" defaultValue={company?.tax_id} className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">ที่อยู่จดทะเบียนบรรษัท</label>
                        <textarea rows={3} defaultValue={company?.address} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none" />
                    </div>
                </div>

                <div className="mt-12 flex justify-end gap-4">
                    <button className="h-14 px-8 border-2 border-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all">ยกเลิก</button>
                    <button className="h-14 px-10 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all active:scale-95">บันทึกข้อมูล</button>
                </div>
            </div>

            {/* Cloud Status */}
            <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-600/30">
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
                <button className="h-12 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-sm transition-all whitespace-nowrap">
                    Test Connection
                </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Icon fix for SmartPhone vs Smartphone
function SmartPhone(props: any) { return <Smartphone {...props} />; }
