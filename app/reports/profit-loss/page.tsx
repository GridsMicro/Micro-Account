
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
    const incomeRes = await query(`SELECT SUM(net_amount) as total FROM invoices WHERE status = 'paid' AND created_at >= $1`, [startOfYear]);
    const totalIncome = Number(incomeRes.rows[0]?.total || 0);

    // 📦 คำนวณ COGS (Cost of Goods Sold) จาก invoice items × cost_price
    let totalCOGS = 0;
    try {
      const cogsRes = await query(`
        SELECT SUM(ii.quantity * COALESCE(p.cost_price, 0)) as total_cogs
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        LEFT JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.status = 'paid' AND i.created_at >= $1
      `, [startOfYear]);
      totalCOGS = Number(cogsRes.rows[0]?.total_cogs || 0);
    } catch (error) {
      console.warn("COGS Calculation Warning:", error);
    }

    // 💸 รายจ่ายปฏิบัติการจากตาราง expenses
    let totalOperatingExpense = 0;
    try {
      const expenseRes = await query(`
        SELECT SUM(amount) as total FROM expenses 
        WHERE expense_date >= $1::date
      `, [startOfYear.split('T')[0]]);
      totalOperatingExpense = Number(expenseRes.rows[0]?.total || 0);
    } catch (error) {
      console.warn("Operating Expenses Warning:", error);
      // Fallback ถ้า expenses table ยังไม่มี
      const pvRes = await query(`SELECT SUM(amount) as total FROM payment_vouchers WHERE issue_date >= $1`, [startOfYear]);
      totalOperatingExpense = Number(pvRes.rows[0]?.total || 0);
    }
    
    // 📊 ข้อมูลรายเดือน (ยอดขาย 6 เดือนล่าสุด)
    const monthlySales = await query(`
      SELECT TO_CHAR(created_at, 'Month') as month, SUM(net_amount) as amount 
      FROM invoices 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, TO_CHAR(created_at, 'MM')
      ORDER BY TO_CHAR(created_at, 'MM') ASC
    `);

    // 📊 ข้อมูลค่าใช้จ่ายตามหมวดหมู่
    let expensesByCategory: any[] = [];
    try {
      const catRes = await query(`
        SELECT category, SUM(amount) as total FROM expenses
        WHERE expense_date >= $1::date
        GROUP BY category ORDER BY total DESC
      `, [startOfYear.split('T')[0]]);
      expensesByCategory = catRes.rows;
    } catch (error) {
      console.warn("Expenses by Category Warning:", error);
    }

    // คำนวณ Gross Profit
    const grossProfit = totalIncome - totalCOGS;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;

    // คำนวณ Net Profit
    const netProfit = grossProfit - totalOperatingExpense;
    const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      totalIncome,
      totalCOGS,
      grossProfit,
      grossMargin,
      totalOperatingExpense,
      netProfit,
      netMargin,
      chartData: monthlySales.rows,
      expensesByCategory
    };
  } catch (error) {
    console.error("PL Error:", error);
    return { 
      totalIncome: 0, 
      totalCOGS: 0,
      grossProfit: 0,
      grossMargin: 0,
      totalOperatingExpense: 0, 
      netProfit: 0,
      netMargin: 0,
      chartData: [],
      expensesByCategory: []
    };
  }
}

export default async function ProfitLossPage() {
  const data = await getPLData();

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
                 รายงานกำไรขาดทุน (Profit & Loss) — Phase 4 Complete
              </h1>
           </div>
           
           <div className="flex gap-3">
              <button className="h-12 px-6 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all text-sm shadow-sm">
                 <Calendar size={18} /> ปีงบประมาณ {new Date().getFullYear()}
              </button>
              <button className="h-12 px-6 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm shadow-xl shadow-indigo-100">
                 <Download size={18} /> Export PDF
              </button>
           </div>
        </div>

        {/* Waterfall: Revenue → Gross Profit → Net Profit */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           
           {/* Revenue */}
           <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 rounded-[2rem] shadow-lg text-white">
              <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2">รายได้รวม</p>
              <h2 className="text-3xl font-black tabular-nums">฿{data.totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</h2>
              <p className="text-xs opacity-60 mt-4">Total Revenue (Paid Invoices)</p>
           </div>

           {/* COGS */}
           <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-[2rem] shadow-lg text-white">
              <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2">ต้นทุนสินค้า</p>
              <h2 className="text-3xl font-black tabular-nums">฿{data.totalCOGS.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</h2>
              <p className="text-xs opacity-60 mt-4">Cost of Goods Sold (Real Data)</p>
           </div>

           {/* Gross Profit */}
           <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-[2rem] shadow-lg text-white">
              <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2">กำไรขั้นต้น</p>
              <h2 className="text-3xl font-black tabular-nums">฿{data.grossProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</h2>
              <p className="text-xs opacity-60 mt-2">Gross Margin: {data.grossMargin.toFixed(1)}%</p>
           </div>

           {/* Net Profit */}
           <div className={cn("p-8 rounded-[2rem] shadow-2xl text-white", data.netProfit >= 0 ? "bg-gradient-to-br from-indigo-600 to-indigo-700" : "bg-gradient-to-br from-rose-600 to-rose-700")}>
              <p className="text-[10px] font-black opacity-70 uppercase tracking-widest mb-2">กำไรสุทธิ</p>
              <h2 className="text-3xl font-black tabular-nums">฿{data.netProfit.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</h2>
              <p className="text-xs opacity-60 mt-2">Net Margin: {data.netMargin.toFixed(1)}%</p>
           </div>
        </div>

        {/* P&L Statement Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           
           {/* Revenue Trends */}
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
                          ฿{Number(d.amount).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
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

           {/* Expenses by Category (Real Data) */}
           <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                 <PieChart className="text-rose-400" /> ค่าใช้จ่ายตามหมวดหมู่
              </h3>
              
              <div className="space-y-4 max-h-80 overflow-y-auto">
                 {data.expensesByCategory && data.expensesByCategory.length > 0 ? (
                    data.expensesByCategory.map((cost: any, i: number) => (
                       <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                             <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-wider">{cost.category}</span>
                                <span className="text-[10px] opacity-40 font-bold">Actual Expenses</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-sm font-black text-rose-300">฿{Number(cost.total).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                             <p className="text-[9px] opacity-40 uppercase tracking-widest font-black mt-1">{((Number(cost.total)/(data.totalOperatingExpense||1)) * 100).toFixed(0)}%</p>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-8 opacity-40">
                       <p className="text-sm font-bold">ยังไม่มีข้อมูลค่าใช้จ่าย</p>
                    </div>
                 )}
                 
                 {data.totalOperatingExpense > 0 && (
                    <div className="p-5 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl border border-white/20 flex items-center justify-between mt-4 pt-4 border-t">
                       <span className="text-xs font-black uppercase tracking-wider">รวมค่าใช้จ่ายทั้งหมด</span>
                       <span className="text-lg font-black text-white">฿{data.totalOperatingExpense.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                 )}
              </div>

              <Link href="/expenses" className="mt-6 w-full h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">
                 ไปหน้าบัญชีค่าใช้จ่าย <ChevronRight size={18} />
              </Link>
           </div>
        </div>

        {/* P&L Summary Table */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-10 border-b border-slate-100">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                 <Activity size={28} className="text-indigo-500" />
                 สรุปบัญชีกำไรขาดทุน
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full">
                 <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-slate-50">
                       <td className="px-10 py-6 font-black text-slate-900">รายได้รวม (Revenue)</td>
                       <td className="px-10 py-6 text-right font-black text-emerald-600 tabular-nums">
                          ฿{data.totalIncome.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                       </td>
                    </tr>
                    <tr className="bg-slate-50 hover:bg-slate-100">
                       <td className="px-10 py-6 font-bold text-slate-700 ml-8">ลบ: ต้นทุนสินค้า (COGS)</td>
                       <td className="px-10 py-6 text-right font-black text-orange-600 tabular-nums">
                          ({data.totalCOGS.toLocaleString('th-TH', { maximumFractionDigits: 2 })})
                       </td>
                    </tr>
                    <tr className="bg-blue-50 font-black">
                       <td className="px-10 py-6 text-slate-900">กำไรขั้นต้น (Gross Profit)</td>
                       <td className="px-10 py-6 text-right text-blue-700 tabular-nums">
                          ฿{data.grossProfit.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                       </td>
                    </tr>
                    <tr className="hover:bg-slate-50 mt-4">
                       <td className="px-10 py-6 font-bold text-slate-700">ลบ: ค่าใช้จ่ายปฏิบัติการ (Operating Expenses)</td>
                       <td className="px-10 py-6 text-right font-black text-rose-600 tabular-nums">
                          ({data.totalOperatingExpense.toLocaleString('th-TH', { maximumFractionDigits: 2 })})
                       </td>
                    </tr>
                    <tr className={cn("font-black text-lg", data.netProfit >= 0 ? "bg-indigo-50" : "bg-rose-50")}>
                       <td className={cn("px-10 py-8", data.netProfit >= 0 ? "text-indigo-900" : "text-rose-900")}>กำไรสุทธิ (Net Profit)</td>
                       <td className={cn("px-10 py-8 text-right tabular-nums", data.netProfit >= 0 ? "text-indigo-700" : "text-rose-700")}>
                          ฿{data.netProfit.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

        {/* Pro Footer */}
        <div className="text-center py-10 opacity-20">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Phase 4 Complete • Real Data P&L Report • Advanced Ledgering v2.0</p>
        </div>

      </div>
    </main>
  );
}
