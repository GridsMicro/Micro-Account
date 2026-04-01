import { query } from "@/lib/db";
import {
  ArrowLeft,
  Download,
  Calendar,
  PieChart,
  BarChart,
  Activity,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getPLData() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

    const incomeRes = await query(
      `SELECT SUM(net_amount) as total FROM invoices WHERE status = 'paid' AND created_at >= $1`,
      [startOfYear]
    );
    const totalIncome = Number(incomeRes.rows[0]?.total || 0);

    let totalCOGS = 0;
    try {
      const cogsRes = await query(
        `
          SELECT SUM(ii.quantity * COALESCE(p.cost_price, 0)) as total_cogs
          FROM invoice_items ii
          LEFT JOIN products p ON ii.product_id = p.id
          LEFT JOIN invoices i ON ii.invoice_id = i.id
          WHERE i.status = 'paid' AND i.created_at >= $1
        `,
        [startOfYear]
      );
      totalCOGS = Number(cogsRes.rows[0]?.total_cogs || 0);
    } catch (error) {
      console.warn("COGS Calculation Warning:", error);
    }

    let totalOperatingExpense = 0;
    try {
      const expenseRes = await query(
        `
          SELECT SUM(amount) as total FROM expenses
          WHERE expense_date >= $1::date
        `,
        [startOfYear.split("T")[0]]
      );
      totalOperatingExpense = Number(expenseRes.rows[0]?.total || 0);
    } catch (error) {
      console.warn("Operating Expenses Warning:", error);
      const pvRes = await query(
        `SELECT SUM(amount) as total FROM payment_vouchers WHERE issue_date >= $1`,
        [startOfYear]
      );
      totalOperatingExpense = Number(pvRes.rows[0]?.total || 0);
    }

    const monthlySales = await query(`
      SELECT TO_CHAR(created_at, 'Mon') as month, SUM(net_amount) as amount
      FROM invoices
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, TO_CHAR(created_at, 'MM')
      ORDER BY TO_CHAR(created_at, 'MM') ASC
    `);

    const monthlyPLRes = await query(
      `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', $1::timestamp),
            date_trunc('month', NOW()),
            interval '1 month'
          ) AS month_start
        ),
        income AS (
          SELECT date_trunc('month', created_at) AS month_start, SUM(net_amount) AS amount
          FROM invoices
          WHERE status = 'paid' AND created_at >= $1
          GROUP BY 1
        ),
        cogs AS (
          SELECT date_trunc('month', i.created_at) AS month_start, SUM(ii.quantity * COALESCE(p.cost_price, 0)) AS amount
          FROM invoice_items ii
          LEFT JOIN products p ON ii.product_id = p.id
          LEFT JOIN invoices i ON ii.invoice_id = i.id
          WHERE i.status = 'paid' AND i.created_at >= $1
          GROUP BY 1
        ),
        expense AS (
          SELECT date_trunc('month', expense_date::timestamp) AS month_start, SUM(amount) AS amount
          FROM expenses
          WHERE expense_date >= $2::date
          GROUP BY 1
        )
        SELECT
          TO_CHAR(months.month_start, 'Mon') AS month,
          COALESCE(income.amount, 0) AS income_amount,
          COALESCE(cogs.amount, 0) AS cogs_amount,
          COALESCE(expense.amount, 0) AS expense_amount
        FROM months
        LEFT JOIN income ON income.month_start = months.month_start
        LEFT JOIN cogs ON cogs.month_start = months.month_start
        LEFT JOIN expense ON expense.month_start = months.month_start
        ORDER BY months.month_start ASC
      `,
      [sixMonthsAgo, sixMonthsAgo.split("T")[0]]
    ).catch(() => ({ rows: [] as any[] }));

    let expensesByCategory: any[] = [];
    try {
      const catRes = await query(
        `
          SELECT category, SUM(amount) as total FROM expenses
          WHERE expense_date >= $1::date
          GROUP BY category ORDER BY total DESC
        `,
        [startOfYear.split("T")[0]]
      );
      expensesByCategory = catRes.rows;
    } catch (error) {
      console.warn("Expenses by Category Warning:", error);
    }

    const grossProfit = totalIncome - totalCOGS;
    const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
    const netProfit = grossProfit - totalOperatingExpense;
    const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    const monthlyProfitTrend = monthlyPLRes.rows.map((row: any) => {
      const monthlyNetProfit =
        Number(row.income_amount || 0) -
        Number(row.cogs_amount || 0) -
        Number(row.expense_amount || 0);

      return {
        ...row,
        net_profit: monthlyNetProfit,
      };
    });

    const averageSixMonthProfit =
      monthlyProfitTrend.length > 0
        ? monthlyProfitTrend.reduce((sum: number, row: any) => sum + Number(row.net_profit || 0), 0) /
          monthlyProfitTrend.length
        : 0;
    const projectedAnnualProfit = averageSixMonthProfit * 12;

    return {
      totalIncome,
      totalCOGS,
      grossProfit,
      grossMargin,
      totalOperatingExpense,
      netProfit,
      netMargin,
      chartData: monthlySales.rows,
      expensesByCategory,
      averageSixMonthProfit,
      projectedAnnualProfit,
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
      expensesByCategory: [],
      averageSixMonthProfit: 0,
      projectedAnnualProfit: 0,
    };
  }
}

export default async function ProfitLossPage() {
  const data = await getPLData();

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link href="/" className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-indigo-600">
              <ArrowLeft size={16} /> กลับหน้าหลัก
            </Link>
            <h1 className="flex items-center gap-4 text-4xl font-black tracking-tight text-slate-900">
              <div className="rounded-2xl bg-indigo-600 p-3 text-xl font-serif italic text-white shadow-lg shadow-indigo-100">PL</div>
              รายงานกำไรขาดทุน (Profit & Loss)
            </h1>
          </div>

          <div className="flex gap-3">
            <button className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50">
              <Calendar size={18} /> ปีงบประมาณ {new Date().getFullYear()}
            </button>
            <button className="flex h-12 items-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-xl shadow-indigo-100 transition-all hover:bg-indigo-700">
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-white shadow-lg">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest opacity-70">รายได้รวม</p>
            <h2 className="text-3xl font-black tabular-nums">฿{data.totalIncome.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</h2>
            <p className="mt-4 text-xs opacity-60">Total Revenue (Paid Invoices)</p>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white shadow-lg">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest opacity-70">ต้นทุนสินค้า</p>
            <h2 className="text-3xl font-black tabular-nums">฿{data.totalCOGS.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</h2>
            <p className="mt-4 text-xs opacity-60">Cost of Goods Sold</p>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-blue-500 to-blue-600 p-8 text-white shadow-lg">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest opacity-70">กำไรขั้นต้น</p>
            <h2 className="text-3xl font-black tabular-nums">฿{data.grossProfit.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</h2>
            <p className="mt-2 text-xs opacity-60">Gross Margin: {data.grossMargin.toFixed(1)}%</p>
          </div>

          <div className={cn("rounded-[2rem] p-8 text-white shadow-2xl", data.netProfit >= 0 ? "bg-gradient-to-br from-indigo-600 to-indigo-700" : "bg-gradient-to-br from-rose-600 to-rose-700")}>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest opacity-70">กำไรสุทธิ</p>
            <h2 className="text-3xl font-black tabular-nums">฿{data.netProfit.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</h2>
            <p className="mt-2 text-xs opacity-60">Net Margin: {data.netMargin.toFixed(1)}%</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">PND 51 Forecast</p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">Projected Annual Profit</h2>
              <p className="mt-2 text-sm text-slate-500">
                Based on the last 6 months average net profit to help prepare a mid-year ภ.ง.ด. 51 estimate.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-emerald-50 px-6 py-5 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Annual Projection</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">฿{data.projectedAnnualProfit.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Avg / month ฿{data.averageSixMonthProfit.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col justify-between rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-sm">
            <div className="mb-10 flex items-center justify-between">
              <h3 className="flex items-center gap-3 text-xl font-black text-slate-900">
                <BarChart className="text-indigo-500" /> วิเคราะห์รายได้ (Revenue Trends)
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last 6 Months</span>
            </div>

            <div className="flex h-64 items-end justify-between gap-4 px-4">
              {data.chartData.length > 0 ? data.chartData.map((d: any, i: number) => (
                <div key={i} className="group relative flex flex-1 flex-col items-center">
                  <div className="absolute -top-10 scale-0 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-black text-white transition-transform group-hover:scale-100">
                    ฿{Number(d.amount).toLocaleString("th-TH", { maximumFractionDigits: 0 })}
                  </div>
                  <div className="relative w-full overflow-hidden rounded-t-xl bg-slate-50 transition-all duration-700 group-hover:bg-indigo-100" style={{ height: `${(Number(d.amount) / (data.totalIncome || 1)) * 200 + 40}px` }}>
                    <div className="absolute bottom-0 h-1 w-full bg-indigo-500 opacity-20 transition-all duration-500 group-hover:h-full" />
                  </div>
                  <p className="mt-4 text-[9px] font-black uppercase tracking-tighter text-slate-400">{String(d.month).substring(0, 3)}</p>
                </div>
              )) : (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 text-sm font-bold italic text-slate-300">
                  ยังไม่มีข้อมูลรายได้สะสม
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
            <h3 className="mb-8 flex items-center gap-3 text-xl font-black">
              <PieChart className="text-rose-400" /> ค่าใช้จ่ายตามหมวดหมู่
            </h3>

            <div className="max-h-80 space-y-4 overflow-y-auto">
              {data.expensesByCategory.length > 0 ? data.expensesByCategory.map((cost: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-5 transition-colors hover:bg-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-3 rounded-full bg-rose-400" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-wider">{cost.category}</span>
                      <span className="text-[10px] font-bold opacity-40">Actual Expenses</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-300">฿{Number(cost.total).toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
                    <p className="mt-1 text-[9px] font-black uppercase tracking-widest opacity-40">
                      {((Number(cost.total) / (data.totalOperatingExpense || 1)) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center opacity-40">
                  <p className="text-sm font-bold">ยังไม่มีข้อมูลค่าใช้จ่าย</p>
                </div>
              )}

              {data.totalOperatingExpense > 0 ? (
                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 to-white/5 p-5">
                  <span className="text-xs font-black uppercase tracking-wider">รวมค่าใช้จ่ายทั้งหมด</span>
                  <span className="text-lg font-black text-white">฿{data.totalOperatingExpense.toLocaleString("th-TH", { maximumFractionDigits: 0 })}</span>
                </div>
              ) : null}
            </div>

            <Link href="/expenses" className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-xs font-black uppercase tracking-widest text-slate-900 transition-all hover:bg-rose-500 hover:text-white">
              ไปหน้าบัญชีค่าใช้จ่าย <ChevronRight size={18} />
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-10">
            <h3 className="flex items-center gap-3 text-2xl font-black text-slate-900">
              <Activity size={28} className="text-indigo-500" />
              สรุปบัญชีกำไรขาดทุน
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="px-10 py-6 font-black text-slate-900">รายได้รวม (Revenue)</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums text-emerald-600">฿{data.totalIncome.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="bg-slate-50 hover:bg-slate-100">
                  <td className="px-10 py-6 font-bold text-slate-700">ลบ: ต้นทุนสินค้า (COGS)</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums text-orange-600">({data.totalCOGS.toLocaleString("th-TH", { maximumFractionDigits: 2 })})</td>
                </tr>
                <tr className="bg-blue-50 font-black">
                  <td className="px-10 py-6 text-slate-900">กำไรขั้นต้น (Gross Profit)</td>
                  <td className="px-10 py-6 text-right tabular-nums text-blue-700">฿{data.grossProfit.toLocaleString("th-TH", { maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="px-10 py-6 font-bold text-slate-700">ลบ: ค่าใช้จ่ายปฏิบัติการ (Operating Expenses)</td>
                  <td className="px-10 py-6 text-right font-black tabular-nums text-rose-600">({data.totalOperatingExpense.toLocaleString("th-TH", { maximumFractionDigits: 2 })})</td>
                </tr>
                <tr className={cn("text-lg font-black", data.netProfit >= 0 ? "bg-indigo-50" : "bg-rose-50")}>
                  <td className={cn("px-10 py-8", data.netProfit >= 0 ? "text-indigo-900" : "text-rose-900")}>กำไรสุทธิ (Net Profit)</td>
                  <td className={cn("px-10 py-8 text-right tabular-nums", data.netProfit >= 0 ? "text-indigo-700" : "text-rose-700")}>
                    ฿{data.netProfit.toLocaleString("th-TH", { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="py-10 text-center opacity-20">
          <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-400">Phase 4 Complete • Real Data P&L Report • PND 51 Forecast Ready</p>
        </div>
      </div>
    </main>
  );
}
