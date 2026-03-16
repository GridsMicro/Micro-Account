import { query } from "@/lib/db";
import SettingsClient from "@/components/SettingsClient";

export const dynamic = 'force-dynamic';

async function getCompanyData() {
  try {
    const res = await query('SELECT * FROM company_settings LIMIT 1');
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function SettingsPage() {
  const company = await getCompanyData();

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">ตั้งค่าระบบ (Settings)</h1>
              <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลพื้นฐานและความปลอดภัยขององค์กร</p>
           </div>
           <div className="bg-white px-4 py-2 rounded shadow-sm border border-gray-200 text-xs font-bold text-gray-500 flex items-center gap-4">
              <span className="text-blue-600">Enterprise Edition</span>
              <span>v1.0.4</span>
           </div>
        </div>

        <SettingsClient initialData={company} />

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
