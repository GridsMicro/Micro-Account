import { query } from "@/lib/db";
import SettingsClient from "@/components/SettingsClient";

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
            <h1 className="text-4xl font-black text-slate-900 mb-2 font-black tracking-tight">ตั้งค่าระบบ (Settings)</h1>
            <p className="text-slate-500 font-medium">จัดการข้อมูลบริษัท ความปลอดภัย และการเชื่อมต่อคลาวด์</p>
          </div>
        </div>

        <SettingsClient initialCompany={company} />
      </div>
    </main>
  );
}
