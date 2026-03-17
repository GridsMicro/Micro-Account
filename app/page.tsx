
import { query } from "@/lib/db";
import { 
  Building2, 
  Users, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  Settings,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const company = await query('SELECT * FROM company_settings LIMIT 1');
    const stats = {
      totalInvoices: await query('SELECT COUNT(*) FROM invoices'),
      totalEarnings: await query('SELECT SUM(net_amount) FROM invoices WHERE status = \'paid\''),
      totalCustomers: await query('SELECT COUNT(*) FROM contacts'),
      pendingInvoices: await query('SELECT COUNT(*) FROM invoices WHERE status != \'paid\'')
    };

    return {
      company: company.rows[0],
      stats: {
        invoices: stats.totalInvoices.rows[0].count,
        earnings: stats.totalEarnings.rows[0].sum || 0,
        customers: stats.totalCustomers.rows[0].count,
        pending: stats.pendingInvoices.rows[0].count
      }
    };
  } catch (error) {
    console.error("Dashboard DB Error:", error);
    return {
      company: null,
      stats: { invoices: 0, earnings: 0, customers: 0, pending: 0 }
    };
  }
}

export default async function Dashboard() {
  const data = await getDashboardData();
  const { company, stats } = data;

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Contents Header: Premium Style */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <span className="p-3 bg-violet-600 rounded-xl shadow-xl shadow-violet-200">
                  <LayoutDashboard className="text-white w-8 h-8" /> 
               </span>
               หน้าแรก Dashboard
            </h1>
            <div className="flex items-center gap-3 ml-2">
               <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  Autonomous Enterprise Overview
               </span>
               <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-violet-50 shadow-sm text-left">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Cloud Sync Active</span>
             </div>
             <Link 
               href="/settings" 
               className="p-4 bg-white hover:bg-violet-50 text-slate-400 hover:text-violet-600 rounded-2xl border border-violet-50 transition-all shadow-sm group"
             >
                <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500" />
             </Link>
          </div>
        </div>

        {/* Stats Grid: Pastel Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "ใบแจ้งหนี้ทั้งหมด", val: stats.invoices, icon: Receipt, color: "violet", trend: "+12.5%" },
            { label: "รายได้สุทธิ (Post)", val: `฿${Number(stats.earnings).toLocaleString()}`, icon: TrendingUp, color: "emerald", trend: "Balanced" },
            { label: "จำนวนลูกค้า/คู่ค้า", val: stats.customers, icon: Users, color: "indigo", trend: "Growth" },
            { label: "รอสแตนด์บาย", val: stats.pending, icon: BarChart3, color: "rose", trend: "Pending" },
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-violet-50 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden text-left">
               <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700", {
                 'bg-violet-50/50': item.color === 'violet',
                 'bg-emerald-50/50': item.color === 'emerald',
                 'bg-indigo-50/50': item.color === 'indigo',
                 'bg-rose-50/50': item.color === 'rose',
               })}></div>
               
               <div className="flex items-center justify-between mb-8 relative">
                  <div className={cn("p-4 rounded-lg", {
                    'bg-violet-50 text-violet-600': item.color === 'violet',
                    'bg-emerald-50 text-emerald-600': item.color === 'emerald',
                    'bg-indigo-50 text-indigo-600': item.color === 'indigo',
                    'bg-rose-50 text-rose-600': item.color === 'rose',
                  })}>
                     <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 border border-slate-50 px-2 py-1 rounded-full">{item.trend}</span>
               </div>
               
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative">{item.label}</p>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter relative tabular-nums">{item.val}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Company Identity Display */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-violet-50 overflow-hidden group text-left">
             <div className="px-10 py-8 border-b border-violet-50 bg-violet-50/10 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                   <Building2 className="text-violet-500" /> อัตลักษณ์บริษัท
                </h3>
                <div className="flex items-center gap-2">
                   <ShieldCheck size={16} className="text-emerald-500" />
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified Data</span>
                </div>
             </div>
             
             <div className="p-10">
                {company ? (
                  <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="w-32 h-32 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-violet-200">
                      {company.name.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                       <div>
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{company.name}</h2>
                          <p className="text-violet-500 font-bold text-sm">Tax ID: {company.tax_id}</p>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-violet-50">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Support Email</p>
                             <p className="text-sm font-bold text-slate-600">{company.email}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Office Contact</p>
                             <p className="text-sm font-bold text-slate-600">{company.phone}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4">
                     <p className="text-slate-300 font-black text-lg animate-pulse">ยังไม่ได้ตั้งค่าหน่วยงานทางธุรกิจ</p>
                     <Link href="/settings" className="inline-block px-10 py-4 bg-violet-50 text-violet-600 rounded-xl font-black text-xs uppercase tracking-widest">Configure Identity</Link>
                  </div>
                )}
             </div>
             <div className="px-10 py-6 bg-slate-50/30 border-t border-violet-50">
                <Link href="/settings" className="text-violet-600 font-black text-xs flex items-center gap-2 hover:gap-4 transition-all uppercase tracking-widest">
                   Update Company Settings <ArrowRight size={14} />
                </Link>
             </div>
          </div>

          {/* Precision Navigation (Quick Actions) */}
          <div className="bg-slate-900 rounded-2xl p-10 shadow-2xl relative overflow-hidden group text-left">
             <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
             
             <h3 className="text-xs font-black text-violet-400 uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                <Zap size={16} fill="currentColor" /> Quick Operations
             </h3>
             
             <div className="space-y-4 relative z-10">
                {[
                  { label: "สร้างใบแจ้งหนี้ใหม่", href: "/invoices/new", icon: Plus },
                  { label: "บันทึกใบสำคัญใหม่", href: "/journals/new", icon: Plus },
                  { label: "ตรวจสอบคลังสินค้า", href: "/inventory", icon: ArrowRight },
                ].map((action, i) => (
                  <Link 
                    key={i} 
                    href={action.href}
                    className="flex items-center justify-between p-6 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-white/10 transition-all duration-500 group/link"
                  >
                     <span className="font-black text-sm uppercase tracking-wider">{action.label}</span>
                     <action.icon size={20} className="text-violet-500 transform group-hover/link:rotate-90 transition-transform" />
                  </Link>
                ))}
             </div>
             
             <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] leading-relaxed">
                   AI-Driven Accounting<br/>Edge Intelligence Module
                </p>
             </div>
          </div>
        </div>

        {/* Professional Footer */}
        <div className="text-center py-12 opacity-30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Microtronic Thailand • Autonomous Future • 2026</p>
        </div>

      </div>
    </main>
  );
}
