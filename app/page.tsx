
import { query } from "@/lib/db";
import SyncMonthlyButton from "@/components/SyncMonthlyButton";
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
  LayoutDashboard,
  Wallet,
  PieChart,
  ArrowDownCircle,
  ArrowUpCircle,
  FileBadge
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const company = await query('SELECT * FROM company_settings LIMIT 1');
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // 💰 รายได้ (Invoice Paid)
    const incomeRes = await query(`SELECT SUM(net_amount) as total FROM invoices WHERE status = 'paid' AND (created_at >= $1 OR created_on >= $1)`, [firstDayOfMonth]);
    // 💸 รายจ่าย (Payment Vouchers)
    const expenseRes = await query(`SELECT SUM(amount) as total FROM payment_vouchers WHERE issue_date >= $1`, [firstDayOfMonth]);
    // 🧾 ใบแจ้งหนี้ค้างชำระ
    const pendingRes = await query(`SELECT SUM(net_amount) as total FROM invoices WHERE status != 'paid'`);
    // 📖 รายการบัญชีล่าสุด
    const journalsRes = await query(`SELECT * FROM journal_entries ORDER BY entry_date DESC, id DESC LIMIT 5`);

    return {
      company: company.rows[0],
      stats: {
        monthlyIncome: Number(incomeRes.rows[0]?.total || 0),
        monthlyExpense: Number(expenseRes.rows[0]?.total || 0),
        totalPending: Number(pendingRes.rows[0]?.total || 0),
        customers: (await query('SELECT COUNT(*) FROM contacts')).rows[0].count
      },
      recentJournals: journalsRes.rows
    };
  } catch (error) {
    console.error("Dashboard DB Error:", error);
    return {
      company: null,
      stats: { monthlyIncome: 0, monthlyExpense: 0, totalPending: 0, customers: 0 },
      recentJournals: []
    };
  }
}

export default async function Dashboard() {
  const data = await getDashboardData();
  const { company, stats, recentJournals } = data;
  const netProfit = stats.monthlyIncome - stats.monthlyExpense;

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* AccRevo Style Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-100">
               <Building2 className="text-white w-10 h-10" /> 
            </div>
            <div className="text-left text-slate-900">
              <h1 className="text-3xl font-black tracking-tight leading-none">
                {company?.name || "ระบบบัญชีอัจฉริยะ"}
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-2 flex items-center gap-2">
                 <ShieldCheck size={16} className="text-indigo-500" /> Professional Insight Solutions
              </p>
            </div>
          </div>
          <Link href="/settings" className="h-14 px-6 bg-white hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl border border-slate-100 flex items-center shadow-sm transition-all group">
             <Settings size={22} className="group-hover:rotate-90 transition-transform duration-500" />
          </Link>
        </div>

        {/* Financial Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full translate-x-32 -translate-y-32 blur-3xl" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                 <div className="space-y-6 text-left">
                    <div className="flex items-center gap-3 text-indigo-400">
                       <Wallet size={20} />
                       <span className="text-xs font-black uppercase tracking-[0.3em]">Monthly Liquidity</span>
                    </div>
                    <div>
                       <p className="text-slate-400 font-bold text-sm mb-1">กำไรสุทธิเดือนนี้ (Net Profit)</p>
                       <h2 className="text-6xl font-black tabular-nums tracking-tighter">฿{netProfit.toLocaleString()}</h2>
                    </div>
                    <div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 w-fit">
                       {netProfit >= 0 ? "Status: Profit" : "Status: Loss"}
                    </div>
                 </div>
                 <div className="w-full md:w-64 space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                       <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">รายได้</span>
                       <span className="font-black">฿{stats.monthlyIncome.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                       <span className="text-rose-400 text-xs font-bold uppercase tracking-widest">รายจ่าย</span>
                       <span className="font-black">฿{stats.monthlyExpense.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tax & Sync Card */}
           <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-6 text-left relative z-10">
                 <div className="flex items-center gap-3 text-indigo-600">
                    <PieChart size={20} />
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Accounting Ready</span>
                 </div>
                 <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">ยอดค้างชำระ (Pending Receivables)</p>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">฿{stats.totalPending.toLocaleString()}</h3>
                 </div>
                 <div className="pt-6 border-t border-slate-50 space-y-4">
                    <Link href="/tax-reports" className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                       จัดการรายงานภาษี <ArrowRight size={18} />
                    </Link>
                    <SyncMonthlyButton />
                 </div>
              </div>
           </div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "ออกใบแจ้งหนี้", sub: "Sales Account", href: "/invoices/new", icon: Receipt, color: "bg-indigo-50 text-indigo-600" },
             { label: "บันทึกรายจ่าย", sub: "Cash Flow", href: "/vouchers/new", icon: Wallet, color: "bg-emerald-50 text-emerald-600" },
             { label: "ผู้ติดต่อ/ลูกค้า", sub: "CRM Data", href: "/contacts", icon: Users, color: "bg-amber-50 text-amber-600" },
             { label: "สมุดรายวัน", sub: "Journal Entries", href: "/journals", icon: BarChart3, color: "bg-slate-900 text-white" },
           ].map((item, i) => (
             <Link key={i} href={item.href} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group relative text-left">
                <div className={cn("inline-flex p-4 rounded-3xl mb-10", item.color)}>
                   <item.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{item.label}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.sub}</p>
             </Link>
           ))}
        </div>

        {/* Recent Journal (Automation Log) */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                 <Zap className="text-amber-500 fill-amber-500 w-5 h-5" /> 
                 รายการบัญชีล่าสุด (Automation Log)
              </h3>
              <Link href="/journals" className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest transition-all">View All</Link>
           </div>
           
           <div className="space-y-3">
              {recentJournals.length > 0 ? recentJournals.map((j: any) => (
                <div key={j.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center justify-between group hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300">
                   <div className="flex items-center gap-4 text-left">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px]", Number(j.debit) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600")}>
                         {Number(j.debit) > 0 ? "DR" : "CR"}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-black text-slate-700 leading-none">{j.account_name}</span>
                         <span className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase truncate max-w-[200px]">{j.description}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={cn("text-sm font-black tabular-nums", Number(j.debit) > 0 ? "text-emerald-500" : "text-slate-900")}>
                         ฿{Number(j.debit || j.credit).toLocaleString()}
                      </span>
                      <p className="text-[8px] text-slate-300 font-black mt-1 uppercase tracking-tighter">{new Date(j.entry_date).toLocaleDateString()}</p>
                   </div>
                </div>
              )) : (
                <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 text-center italic font-bold text-xs">
                   ยังไม่มีการบันทึกบัญชีอัตโนมัติ
                </div>
              )}
           </div>
        </div>

        <div className="text-center py-10 opacity-30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Microtronic Enterprise Ledger • 2026 Edition</p>
        </div>

      </div>
    </main>
  );
}
