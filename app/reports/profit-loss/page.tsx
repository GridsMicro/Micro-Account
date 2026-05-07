import { query } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, Package, Receipt, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface MonthlyPLData {
  month: string;
  income_amount: number;
  cogs_amount: number;
  expense_amount: number;
}

interface ExpenseCategory {
  category: string;
  total: number;
}

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
          WHERE expense_date >= $1
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
            date_trunc('month', $1),
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
          SELECT date_trunc('month', expense_date) AS month_start, SUM(amount) AS amount
          FROM expenses
          WHERE expense_date >= $2
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
    ).catch(() => ({ rows: [] as MonthlyPLData[] }));

    let expensesByCategory: ExpenseCategory[] = [];
    try {
      const catRes = await query(
        `
          SELECT category, SUM(amount) as total FROM expenses
          WHERE expense_date >= $1
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
      monthlyTrend: monthlyProfitTrend,
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
      monthlyTrend: [],
    };
  }
}

export default async function ProfitLossPage() {
  const data = await getPLData();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าหลัก
            </Link>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              รายงานกำไรขาดทุน
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-bold">
              ปีงบประมาณ {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
            <div className="mb-6 inline-flex p-4 rounded-3xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รายได้รวม</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {formatCurrency(data.totalIncome)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-bold text-emerald-500">Revenue</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
            <div className="mb-6 inline-flex p-4 rounded-3xl bg-amber-50 text-amber-600">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ต้นทุนสินค้า</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {formatCurrency(data.totalCOGS)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-amber-500" />
              <span className="text-xs font-bold text-amber-500">COGS</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group">
            <div className="mb-6 inline-flex p-4 rounded-3xl bg-indigo-50 text-indigo-600">
              <Calculator className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">กำไรขั้นต้น</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
              {formatCurrency(data.grossProfit)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-500">{data.grossMargin.toFixed(1)}% margin</span>
            </div>
          </div>

          <div className={cn(
            "p-8 rounded-[2.5rem] shadow-sm border transition-all hover:shadow-2xl hover:-translate-y-2 group",
            data.netProfit >= 0 
              ? "bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-500/30 text-white" 
              : "bg-gradient-to-br from-rose-600 to-rose-700 border-rose-500/30 text-white"
          )}>
            <div className={cn(
              "mb-6 inline-flex p-4 rounded-3xl",
              data.netProfit >= 0 ? "bg-white/20" : "bg-white/20"
            )}>
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">กำไรสุทธิ</p>
            <p className="mt-2 text-3xl font-black tracking-tight">
              {formatCurrency(data.netProfit)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs font-bold text-white/80">{data.netMargin.toFixed(1)}% margin</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              รายได้รายเดือน
            </h2>
            <div className="space-y-4">
              {data.chartData.length > 0 ? (
                data.chartData.map((item: { month: string; amount: number }, index: number) => {
                  const maxAmount = Math.max(...data.chartData.map((d: { amount: number }) => d.amount));
                  const percentage = maxAmount > 0 ? (Number(item.amount) / maxAmount) * 100 : 0;
                  return (
                    <div key={index} className="group">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">{item.month}</span>
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(Number(item.amount))}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400">
                  <p className="text-sm font-bold">ไม่มีข้อมูลรายได้</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <Receipt className="h-5 w-5 text-rose-600" />
              </div>
              ค่าใช้จ่ายตามหมวดหมู่
            </h2>
            <div className="space-y-4">
              {data.expensesByCategory.length > 0 ? (
                data.expensesByCategory.map((item: { category: string; total: number }, index: number) => {
                  const maxTotal = Math.max(...data.expensesByCategory.map((d: { total: number }) => d.total));
                  const percentage = maxTotal > 0 ? (Number(item.total) / maxTotal) * 100 : 0;
                  return (
                    <div key={index} className="group">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600">{item.category}</span>
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(Number(item.total))}
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-rose-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400">
                  <p className="text-sm font-bold">ไม่มีข้อมูลค่าใช้จ่าย</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-slate-900 tracking-tight">
            <div className="p-3 bg-violet-50 rounded-2xl">
              <Calculator className="h-5 w-5 text-violet-600" />
            </div>
            สรุปรายได้-รายจ่าย-กำไร รายเดือน
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">เดือน</th>
                  <th className="text-right py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">รายได้</th>
                  <th className="text-right py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">ต้นทุนขาย</th>
                  <th className="text-right py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">ค่าใช้จ่าย</th>
                  <th className="text-right py-4 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">กำไรสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.monthlyTrend.length > 0 ? (
                  data.monthlyTrend.map((row: any, index: number) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold text-slate-700">{row.month}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-black text-emerald-600">{formatCurrency(Number(row.income_amount))}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-bold text-amber-600">{formatCurrency(Number(row.cogs_amount))}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-sm font-bold text-rose-600">{formatCurrency(Number(row.expense_amount))}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={cn(
                          "text-sm font-black",
                          row.net_profit >= 0 ? "text-indigo-600" : "text-rose-600"
                        )}>
                          {formatCurrency(row.net_profit)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-sm font-bold">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h2 className="mb-8 text-xl font-black text-slate-900 tracking-tight">
            สรุปบัญชีกำไรขาดทุน
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-2xl">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">รายได้รวม</span>
              </div>
              <span className="text-lg font-black text-emerald-600">
                {formatCurrency(data.totalIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 rounded-2xl">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">ต้นทุนสินค้า (COGS)</span>
              </div>
              <span className="text-lg font-black text-amber-600">
                -{formatCurrency(data.totalCOGS)}
              </span>
            </div>

            <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-2xl">
                  <Calculator className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-indigo-700">กำไรขั้นต้น</span>
              </div>
              <span className="text-lg font-black text-indigo-600">
                {formatCurrency(data.grossProfit)}
              </span>
            </div>

            <div className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-2xl">
                  <Receipt className="h-5 w-5 text-rose-600" />
                </div>
                <span className="text-sm font-bold text-slate-700">ค่าใช้จ่ายปฏิบัติการ</span>
              </div>
              <span className="text-lg font-black text-rose-600">
                -{formatCurrency(data.totalOperatingExpense)}
              </span>
            </div>

            <div className={cn(
              "flex items-center justify-between p-5 rounded-2xl border",
              data.netProfit >= 0 
                ? "bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100" 
                : "bg-gradient-to-r from-rose-50 to-red-50 border-rose-100"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl",
                  data.netProfit >= 0 ? "bg-indigo-100" : "bg-rose-100"
                )}>
                  <TrendingUp className={cn(
                    "h-5 w-5",
                    data.netProfit >= 0 ? "text-indigo-600" : "text-rose-600"
                  )} />
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  data.netProfit >= 0 ? "text-indigo-700" : "text-rose-700"
                )}>กำไรสุทธิ</span>
              </div>
              <span className={cn(
                "text-xl font-black",
                data.netProfit >= 0 ? "text-indigo-600" : "text-rose-600"
              )}>
                {formatCurrency(data.netProfit)}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center py-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">
            รายงานกำไรขาดทุน • ปีงบประมาณ {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </main>
  );
}
