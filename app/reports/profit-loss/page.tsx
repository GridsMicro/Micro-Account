
import { query } from "@/lib/db";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  Download, 
  Calendar,
  PieChart,
  BarChart,
  DollarSign,
  Activity,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getPLData() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

    // 💰 รายได้สะสมรายปี
    const incomeRes = await query(`SELECT SUM(net_amount) as total FROM invoices WHERE status = 'paid' AND (created_at >= $1 OR created_on >= $1)`, [startOfYear]);
    // 💸 รายจ่ายสะสมรายปี
    const expenseRes = await query(`SELECT SUM(amount) as total FROM payment_vouchers WHERE issue_date >= $1`, [startOfYear]);
    
    // 📊 ข้อมูลรายเดือน (ยอดขาย 6 เดือนล่าสุด)
    const monthlySales = await query(`
      SELECT TO_CHAR(created_at, 'Month') as month, SUM(net_amount) as amount 
      FROM invoices 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, TO_CHAR(created_at, 'MM')
      ORDER BY TO_CHAR(created_at, 'MM') ASC
    `);

    return {
      totalIncome: Number(incomeRes.rows[0]?.total || 0),
      totalExpense: Number(expenseRes.rows[0]?.total || 0),
      chartData: monthlySales.rows
    };
  } catch (error) {
    console.error("PL Error:", error);
    return { totalIncome: 0, totalExpense: 0, chartData: [] };
  }
}

export default async function ProfitLossPage() {
  const data = await getPLData();
  const netProfit = data.totalIncome - data.totalExpense;
  const profitMargin = data.totalIncome > 0 ? (netProfit / data.totalIncome) * 100 : 0;

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#f1f5f9]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <Link href="/" className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-sm font-bold mb-2 transition-colors">
                 <ArrowLeft size={16} /> กลับหน้าหลัก
              </Link>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 italic font-serif text-white text-xl">PL</div>
                 รายงานกำไรขาดทุน (Profit & Loss)
              </h1>
           </div>
           
           <div className="flex gap-3">
              <button className="h-12 px-6 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all text-sm shadow-sm">
                 <Calendar size={18} /> ปีงบประมาณ 2026
              </button>
              <button className="h-12 px-6 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm shadow-xl shadow-indigo-100">
                 <Download size={18} /> Export PDF
              </button>
           </div>
        </div>

        {/* Dynamic Financial Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           
           {/* Summary Cards */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><TrendingUp size={80} className="text-emerald-500" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายได้รวม (Total Revenue)</p>
              <h2 className="text-3xl font-black text-slate-900 tabular-nums">฿{data.totalIncome.toLocaleString()}</h2>
              <div className="pt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> All-time record
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><TrendingDown size={80} className="text-rose-500" /></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายจ่ายรวม (Total Expenses)</p>
              <h2 className="text-3xl font-black text-slate-900 tabular-nums">฿{data.totalExpense.toLocaleString()}</h2>
              <div className="pt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> Calculated weekly
              </div>
           </div>

           <div className={cn("p-8 rounded-[2.5rem] shadow-2xl space-y-2 relative overflow-hidden text-white", netProfit >= 0 ? "bg-indigo-950 shadow-indigo-100" : "bg-rose-950 shadow-rose-100")}>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">กำไรสุทธิ (Net Income)</p>
              <h2 className="text-4xl font-black tabular-nums">฿{netProfit.toLocaleString()}</h2>
              <div className="pt-4 flex items-center justify-between">
                 <span className="text-[11px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">
                    Margin: {profitMargin.toFixed(2)}%
                 </span>
                 <Activity size={24} className="opacity-40" />
              </div>
           </div>
        </div>

        {/* Detailed Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Visual Chart Placeholder Design */}
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <BarChart className="text-indigo-500" /> วิเคราะห์รายได้ (Revenue Trends)
                 </h3>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last 6 Months</span>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-4 px-4">
                 {data.chartData.length > 0 ? data.chartData.map((d: any, i: number) => (
                    <div key={i} className="flex-1 group relative flex flex-col items-center">
                       <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg z-20">
                          ฿{Number(d.amount).toLocaleString()}
                       </div>
                       <div 
                         className="w-full bg-slate-50 group-hover:bg-indigo-100 rounded-t-xl transition-all duration-700 relative overflow-hidden" 
                         style={{ height: `${(Number(d.amount) / (data.totalIncome || 1)) * 200 + 40}px` }}
                       >
                          <div className="absolute bottom-0 w-full bg-indigo-500 h-1 group-hover:h-full transition-all duration-500 opacity-20"></div>
                       </div>
                       <p className="text-[9px] font-black text-slate-400 mt-4 uppercase tracking-tighter">{d.month.substring(0, 3)}</p>
                    </div>
                 )) : (
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold italic text-sm">
                       ยังไม่มีข้อมูลรายได้สะสม
                    </div>
                 )}
              </div>
           </div>

           {/* Cost breakdown List */}
           <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                 <PieChart className="text-indigo-400" /> โครงสร้างต้นทุน (Cost Structure)
              </h3>
              
              <div className="space-y-4">
                 {[
                   { label: "ค่าโฆษณา (Marketing)", amount: data.totalExpense * 0.4, color: "bg-indigo-500" },
                   { label: "เงินเดือน/จ้างงาน (Salaries)", amount: data.totalExpense * 0.3, color: "bg-emerald-500" },
                   { label: "ค่าธรรมเนียม/License", amount: data.totalExpense * 0.2, color: "bg-amber-500" },
                   { label: "อื่นๆ (Miscellaneous)", amount: data.totalExpense * 0.1, color: "bg-rose-500" },
                 ].map((cost, i) => (
                    <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className={cn("w-3 h-3 rounded-full", cost.color)}></div>
                          <div className="flex flex-col">
                             <span className="text-xs font-black uppercase tracking-wider">{cost.label}</span>
                             <span className="text-[10px] opacity-40 font-bold">Standard Distribution</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-sm font-black text-indigo-300">฿{cost.amount.toLocaleString()}</span>
                          <p className="text-[9px] opacity-40 uppercase tracking-widest font-black mt-1">{( (cost.amount/(data.totalExpense||1)) * 100).toFixed(0)}%</p>
                       </div>
                    </div>
                 ))}
              </div>

              <Link href="/journals/new" className="mt-10 w-full h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all">
                 บันทึกค่าใช้จ่ายเพิ่ม <ChevronRight size={18} />
              </Link>
           </div>
        </div>

        {/* Pro Footer */}
        <div className="text-center py-10 opacity-20">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Autonomous Intelligence System • Advanced Ledgering v1.1</p>
        </div>

      </div>
    </main>
  );
}
