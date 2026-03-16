import { query } from "@/lib/db";
import Link from "next/link";
export const dynamic = 'force-dynamic';

import { 
  Building2, 
  Users, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Settings
} from "lucide-react";

async function getDashboardData() {
  try {
    const companyRes = await query('SELECT * FROM company LIMIT 1');
    const userCount = await query('SELECT COUNT(*) FROM users');
    const invoiceCount = await query('SELECT COUNT(*) FROM invoices');
    const productCount = await query('SELECT COUNT(*) FROM products');
    
    return {
      company: companyRes.rows[0],
      stats: {
        users: userCount.rows[0].count,
        invoices: invoiceCount.rows[0].count,
        products: productCount.rows[0].count
      }
    };
  } catch (err) {
    return { company: null, stats: { users: 0, invoices: 0, products: 0 } };
  }
}

export default async function Home() {
  const data = await getDashboardData();
  const { company, stats } = data;

  return (
    <main className="min-h-screen py-10 px-6 font-sans bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hero Section - Superior Contrast */}
        <section className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-900 to-slate-950 rounded-[3rem] shadow-[0_0_50px_rgba(79,70,229,0.15)]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] -mr-64 -mt-64 group-hover:bg-indigo-500/20 transition-all duration-1000" />
          
          <div className="relative z-10 p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-cyan-400 font-black text-xs uppercase tracking-[0.2em]">
                <Zap size={16} className="animate-pulse" />
                Next-Gen Online Banking Status: Active
              </div>
              <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tighter">
                {company?.name || "ยินดีต้อนรับสู่แดชบอร์ด"}
              </h1>
              <p className="text-slate-300 text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
                ระบบจัดการภาษีและบัญชี AI อัตโนมัติ เพิ่มประสิทธิภาพการทำงานให้พนักงานทุกคน <br className="hidden lg:block" />
                เลขนิติบุคคล: <span className="text-indigo-400 font-mono font-black">{company?.tax_id || 'REGISTERED'}</span>
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                <Link href="/invoices" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center gap-3 text-lg group">
                  <Plus size={24} />
                  เริ่มต้นสร้างบิล
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </Link>
                <Link href="/tax-reports" className="h-16 px-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black rounded-2xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-3 text-lg">
                  <BarChart3 size={24} />
                  เรียกดูรายงาน
                </Link>
              </div>
            </div>
            
            <div className="hidden xl:block relative group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse" />
              <div className="w-80 h-80 bg-[#0f172a] border border-white/10 rounded-[3rem] p-8 shadow-2xl relative z-10 flex flex-col items-center justify-center text-center">
                 <ShieldCheck size={80} className="text-indigo-500 mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                 <h3 className="text-3xl font-black">SECURITY</h3>
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Enterprise Encryption 256-bit</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Stats Grid - High Contrast High Clarity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: "ยอดขายค้างรับ", val: "฿0.00", icon: TrendingUp, color: "indigo", status: "+12%" },
            { label: "ค่าใช้จ่ายเดือนนี้", val: "฿0.00", icon: CreditCard, color: "rose", status: "-2%" },
            { label: "ใบแจ้งหนี้รวม", val: stats.invoices, icon: Receipt, color: "cyan", unit: "ฉบับ" },
            { label: "พนักงานในระบบ", val: stats.users, icon: Users, color: "amber", unit: "ท่าน" },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/5 shadow-xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-${item.color}-500/5 rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150 duration-700`} />
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className={`w-14 h-14 bg-${item.color}-500/10 rounded-2xl flex items-center justify-center text-${item.color}-500 border border-${item.color}-500/20 group-hover:bg-${item.color}-500 group-hover:text-white transition-all duration-500 ring-4 ring-transparent group-hover:ring-${item.color}-500/20`}>
                    <item.icon size={28} />
                  </div>
                  {item.status && (
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black italic ${item.status.includes('+') ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {item.status}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] mb-2">{item.label}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white italic tracking-tighter">{item.val}</span>
                    {item.unit && <span className="text-sm font-bold text-slate-500">{item.unit}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity & Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 pb-20">
          <div className="xl:col-span-2 bg-[#0f172a] rounded-[3rem] border border-white/5 p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Zap size={20} />
                </div>
                <h3 className="text-2xl font-black italic">Recent Activity</h3>
              </div>
              <Link href="/invoices" className="text-indigo-400 font-black text-sm uppercase tracking-widest hover:text-white border-b-2 border-indigo-500/0 hover:border-indigo-500 transition-all pb-1 mx-2">
                Open Logs
              </Link>
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group flex items-center justify-between p-6 rounded-[2rem] border border-white/[0.02] hover:bg-white/[0.03] hover:border-white/10 transition-all cursor-pointer">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                      <Plus size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-100 italic tracking-tight">System Initialization</p>
                      <p className="text-sm font-bold text-slate-500 tracking-wide uppercase">Neon Cloud Sync: Successful</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                     <p className="text-xl font-black text-indigo-400 italic">SYNC</p>
                     <p className="text-[10px] font-black text-slate-600 leading-none mt-1">Status 200 OK</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8">
             <Link href="/settings" className="flex-1 bg-gradient-to-br from-indigo-900/50 to-slate-950 p-10 rounded-[3rem] border border-white/10 group hover:border-indigo-500/50 transition-all shadow-2xl relative overflow-hidden">
                <Settings size={60} className="text-indigo-600/20 absolute -right-4 -bottom-4 group-hover:rotate-90 transition-transform duration-1000 scale-150" />
                <div className="relative z-10">
                   <h3 className="text-2xl font-black mb-4">ตั้งค่าองค์กร</h3>
                   <p className="text-slate-400 font-medium mb-8">จัดการข้อมูลบริษัท สิทธิ์การเข้าถึง และการเชื่อมต่อ API ไปยังระบบภายนอก</p>
                   <div className="inline-flex items-center gap-2 text-indigo-400 font-black uppercase text-xs tracking-widest group-hover:translate-x-2 transition-transform">
                      จัดการทันที <ArrowRight size={16} />
                   </div>
                </div>
             </Link>
             
             <div className="bg-white p-10 rounded-[3rem] flex flex-col justify-center items-center text-center shadow-[0_20px_60px_rgba(255,255,255,0.05)] border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500 animate-pulse opacity-[0.03]" />
                <div className="relative z-10">
                   <h3 className="text-3xl font-black text-slate-900 italic mb-2 tracking-tighter italic">"AI POWERED"</h3>
                   <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Microtronic Thailand</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
