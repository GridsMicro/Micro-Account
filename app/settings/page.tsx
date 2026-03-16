import { query } from "@/lib/db";
import SettingsClient from "@/components/SettingsClient";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50 pb-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-indigo-400 font-black text-xs uppercase tracking-widest">
           <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
           <ArrowRight size={14} className="text-slate-700" />
           <span className="text-slate-500">Settings</span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               CONFIGURATION<span className="text-indigo-500">S</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">จัดการโครงสร้างองค์กร ความปลอดภัย และระบบ Cloud</p>
          </div>
        </div>

        <SettingsClient initialCompany={company} />
      </div>
    </main>
  );
}
