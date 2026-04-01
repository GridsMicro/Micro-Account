import { query } from "@/lib/db";
import { CalendarClock, Mail, Plus, Repeat, Search, StopCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import RecurringRunButton from "./RecurringRunButton";

export const dynamic = "force-dynamic";

export default async function RecurringInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const search = (await searchParams)?.search || "";
  let records: any[] = [];

  try {
    await query(`
      ALTER TABLE recurring_invoices
      ADD COLUMN IF NOT EXISTS billing_day INTEGER,
      ADD COLUMN IF NOT EXISTS due_day INTEGER DEFAULT 17,
      ADD COLUMN IF NOT EXISTS wht_rate DECIMAL(5, 2) DEFAULT 3.00,
      ADD COLUMN IF NOT EXISTS last_billed_at TIMESTAMP NULL
    `).catch(() => null);

    await query(`
      UPDATE recurring_invoices
      SET billing_day = EXTRACT(
        DAY FROM COALESCE(
          NULLIF(next_billing_date, '')::date,
          NULLIF(start_date, '')::date,
          CURRENT_DATE
        )
      )::int
      WHERE billing_day IS NULL
    `).catch(() => null);

    let q = `
      SELECT
        r.*,
        c.name AS client_name,
        c.email
      FROM recurring_invoices r
      LEFT JOIN contacts c ON c.id = r.customer_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      q += ` AND (COALESCE(c.name, '') ILIKE $1 OR COALESCE(c.email, '') ILIKE $1)`;
    }

    q += ` ORDER BY NULLIF(r.next_billing_date, '')::date ASC NULLS LAST, r.id ASC`;
    const res = await query(q, params);
    records = res.rows;
  } catch {
    records = [];
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              <Repeat className="text-blue-600" /> ระบบแจ้งหนี้รายเดือนอัตโนมัติ
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <span>Manager billing console for recurring invoice generation and follow-up.</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex h-11 cursor-not-allowed items-center gap-2 rounded bg-blue-600 px-6 text-sm font-bold text-white opacity-50 shadow-sm transition-all">
              <Plus size={18} />
              สร้างรอบบิลใหม่
            </button>
            <RecurringRunButton />
          </div>
        </div>

        <form method="GET" className="mb-8 flex flex-col items-center gap-4 md:flex-row">
          <div className="group relative w-full flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500" size={20} />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="ค้นหาชื่อลูกค้า หรืออีเมล..."
              className="h-14 w-full rounded-xl border border-blue-50 bg-white pl-14 pr-6 text-sm font-bold shadow-sm transition-all focus:border-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex h-14 items-center gap-3 rounded-xl bg-blue-600 px-8 text-xs font-black uppercase tracking-widest text-white shadow-sm">
              <Search size={16} /> Search
            </button>
            <Link href="/recurring" className="flex h-14 items-center gap-3 rounded-xl border border-blue-50 bg-white px-8 text-xs font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-600">
              Clear
            </Link>
          </div>
        </form>

        <div className="mb-8 rounded border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <h3 className="mb-2 font-bold tracking-tight text-blue-800">Billing Day Status</h3>
          <p className="max-w-4xl text-sm leading-relaxed text-blue-700">
            The recurring batch now reads the live subscription schema, supports Manager-triggered runs, and calculates VAT 7%
            plus WHT receivable 3% through the invoice journal pipeline.
          </p>
        </div>

        <div className="mb-12 overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-700">
              <CalendarClock size={16} className="text-blue-500" /> Schedules
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">ลูกค้า</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Frequency</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Net Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Next Billing</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Billing Day</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.length > 0 ? (
                  records.map((record: any) => (
                    <tr key={record.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{record.client_name || `Customer #${record.customer_id}`}</span>
                          <span className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                            <Mail size={10} /> {record.email || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-blue-600">
                        {record.frequency || "monthly"}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">
                        ฿{Number(record.net_amount || record.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {record.next_billing_date ? new Date(record.next_billing_date).toLocaleDateString("th-TH") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-600">{record.billing_day || "-"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-widest",
                            record.status === "Active"
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          )}
                        >
                          {record.status || "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="rounded border border-red-200 p-2 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white" title="ยกเลิกรอบบิล">
                            <StopCircle size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-20 text-center font-bold italic text-gray-400">
                      ยังไม่มีรายการ recurring billing ที่มองเห็นได้สำหรับ Manager คนนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
