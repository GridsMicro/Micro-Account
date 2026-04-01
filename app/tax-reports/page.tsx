import {
  Building2,
  User,
  Receipt,
  Globe,
  CalendarDays,
  Upload,
  ShieldCheck,
  Star,
  ArrowRight,
  Landmark,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getPNDReportDraft, getPP30Draft, getPP36Draft, getTaxSummary } from "@/app/actions";
import TaxExportButton from "./TaxExportButton";

export const dynamic = "force-dynamic";

const forms = [
  { id: "pnd3", name: "ภ.ง.ด. 3", description: "ภาษีหัก ณ ที่จ่าย (บุคคลธรรมดา)", icon: User, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", favorite: true },
  { id: "pnd53", name: "ภ.ง.ด. 53", description: "ภาษีหัก ณ ที่จ่าย (นิติบุคคล / License 5%)", icon: Building2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", favorite: true },
  { id: "pp30", name: "ภ.พ. 30", description: "ภาษีมูลค่าเพิ่ม 7% (ในประเทศ)", icon: Receipt, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", favorite: true },
  { id: "pp36", name: "ภ.พ. 36", description: "ภาษีมูลค่าเพิ่ม (บริการต่างประเทศ)", icon: Globe, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", favorite: true },
  { id: "pnd51", name: "ภ.ง.ด. 51", description: "ภาษีเงินได้นิติบุคคลครึ่งปี", icon: CalendarDays, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", favorite: false },
];

export default async function TaxReportsPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [summaryRes, pp30Res, pnd3Res, pnd53Res, pp36Res] = await Promise.all([
    getTaxSummary(),
    getPP30Draft(currentMonth, currentYear),
    getPNDReportDraft("pnd3", currentMonth, currentYear),
    getPNDReportDraft("pnd53", currentMonth, currentYear),
    getPP36Draft(currentMonth, currentYear),
  ]);

  const { vatSales = 0, vatPurchase = 0, wht = 0, netVat = 0 } = summaryRes.success && summaryRes.data ? summaryRes.data : {};
  const pp30Draft = pp30Res.success ? pp30Res.data : null;
  const pnd3Draft = pnd3Res.success ? pnd3Res.data : null;
  const pnd53Draft = pnd53Res.success ? pnd53Res.data : null;
  const pp36Draft = pp36Res.success ? pp36Res.data : null;

  return (
    <main className="min-h-screen bg-[#f8fafc] p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-600 p-3 text-white shadow-md"><Landmark size={28} /></div>
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-black uppercase tracking-tighter text-gray-800">E-Filing Dashboard</h1>
              <p className="text-sm font-medium text-gray-500">RD-ready tax center for VAT, withholding tax, and filing preparation.</p>
            </div>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-gray-700">MICROTRONIC (THAILAND) CO., LTD.</span>
            <span className="font-mono text-xs tracking-widest text-gray-500">TAX ID: 0105561182888</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-3 text-purple-600"><div className="rounded-lg bg-purple-50 p-2"><TrendingUp size={18} /></div><span className="text-xs font-bold uppercase tracking-wider">ภาษีขายเดือนนี้</span></div>
            <p className="text-2xl font-black text-gray-800">฿{vatSales.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-3 text-blue-600"><div className="rounded-lg bg-blue-50 p-2"><TrendingDown size={18} /></div><span className="text-xs font-bold uppercase tracking-wider">ภาษีซื้อเดือนนี้</span></div>
            <p className="text-2xl font-black text-gray-800">฿{vatPurchase.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-3 text-green-600"><div className="rounded-lg bg-green-50 p-2"><Calculator size={18} /></div><span className="text-xs font-bold uppercase tracking-wider">ภาษีหัก ณ ที่จ่าย</span></div>
            <p className="text-2xl font-black text-gray-800">฿{wht.toLocaleString()}</p>
          </div>
          <div className={cn("rounded-2xl border p-5 shadow-md", netVat >= 0 ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50")}>
            <div className="mb-2 flex items-center gap-3 text-gray-700"><span className="text-xs font-bold uppercase tracking-wider">ยอดภาษีที่ต้องชำระ (Net)</span></div>
            <p className={cn("text-2xl font-black", netVat >= 0 ? "text-red-600" : "text-emerald-600")}>฿{Math.abs(netVat).toLocaleString()}</p>
          </div>
        </div>

        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-800">PP.30 Draft Engine</h2>
              <p className="text-sm text-gray-500">Aggregates output VAT from sales and input VAT from purchase tax invoices in Expense Manager.</p>
            </div>
            <div className={cn("rounded-xl px-4 py-3 text-sm font-black", (pp30Draft?.netVatPayable || 0) >= 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
              Net VAT {pp30Draft ? `฿${Math.abs(pp30Draft.netVatPayable).toLocaleString("th-TH", { minimumFractionDigits: 2 })}` : "N/A"}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-purple-600">Output VAT</p>
              <p className="text-2xl font-black text-gray-900">฿{Number(pp30Draft?.sales.vatAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              <p className="mt-2 text-sm text-gray-500">Taxable base ฿{Number(pp30Draft?.sales.taxableAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} from {pp30Draft?.sales.documentCount || 0} sales docs</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-sky-600">Input VAT</p>
              <p className="text-2xl font-black text-gray-900">฿{Number(pp30Draft?.purchases.vatAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              <p className="mt-2 text-sm text-gray-500">Taxable base ฿{Number(pp30Draft?.purchases.taxableAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })} from {pp30Draft?.purchases.documentCount || 0} purchase tax invoices</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Expense</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Tax Invoice</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-500">VAT</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pp30Draft && pp30Draft.purchases.items.length > 0 ? pp30Draft.purchases.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-gray-700">{item.title}</td>
                    <td className="px-4 py-3 text-gray-500"><div>{item.tax_invoice_no}</div><div className="text-xs">{item.tax_invoice_date ? new Date(item.tax_invoice_date).toLocaleDateString("th-TH") : "-"}</div></td>
                    <td className="px-4 py-3 text-right font-bold text-sky-600">฿{Number(item.vat_amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">฿{Number(item.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm font-medium text-gray-400">ยังไม่มีรายจ่ายที่ระบุเลขที่ใบภาษีซื้อในเดือนนี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[{ label: "PND 3", draft: pnd3Draft, tone: "green" }, { label: "PND 53", draft: pnd53Draft, tone: "blue" }].map(({ label, draft, tone }) => (
            <section key={label} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-800">{label} Draft</h2>
                  <p className="text-sm text-gray-500">Category and payee tax ID are ready for RD review before filing.</p>
                </div>
                <div className={cn("rounded-xl px-4 py-3 text-sm font-black", tone === "green" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700")}>
                  WHT ฿{Number(draft?.totalWHT || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Voucher</th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Payee Tax ID</th>
                      <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Category</th>
                      <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-500">Base</th>
                      <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-500">WHT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {draft && draft.items.length > 0 ? draft.items.map((item: any) => (
                      <tr key={`${label}-${item.id}`}>
                        <td className="px-4 py-3"><div className="font-semibold text-gray-700">{item.voucher_no || "-"}</div><div className="text-xs text-gray-500">{item.payee_name || "-"}</div></td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.payee_tax_id || "-"}</td>
                        <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-gray-700">{item.category}</span></td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-700">฿{Number(item.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                        <td className={cn("px-4 py-3 text-right font-black", tone === "green" ? "text-green-600" : "text-blue-600")}>฿{Number(item.wht_amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-medium text-gray-400">No withholding entries found for this period.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-800">PP.36 Overseas VAT View</h2>
              <p className="text-sm text-gray-500">Filters expenses tagged as overseas so the finance team can see VAT to be self-submitted.</p>
            </div>
            <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">Self-assessed VAT ฿{Number(pp36Draft?.totalVat || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-orange-600">Overseas Base</p>
              <p className="text-2xl font-black text-gray-900">฿{Number(pp36Draft?.totalBase || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-amber-600">PP.36 VAT</p>
              <p className="text-2xl font-black text-gray-900">฿{Number(pp36Draft?.totalVat || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Expense</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-500">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-500">VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pp36Draft && pp36Draft.items.length > 0 ? pp36Draft.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3"><div className="font-semibold text-gray-700">{item.title}</div><div className="text-xs text-gray-500">{item.category || "Overseas service"}</div></td>
                    <td className="px-4 py-3 text-gray-500">{item.reference_no || item.tax_invoice_no || "-"}</td>
                    <td className="px-4 py-3 text-gray-500">{item.expense_date ? new Date(item.expense_date).toLocaleDateString("th-TH") : "-"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">฿{Number(item.amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-black text-orange-600">฿{Number(item.vat_amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-sm font-medium text-gray-400">No overseas expenses flagged for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mb-10 flex flex-col items-center justify-between gap-6 rounded-xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow-lg md:flex-row">
          <div className="flex-1">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-600/50 bg-blue-800/50 px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <Star size={12} className="text-yellow-400" fill="currentColor" /> Software & license tax workflow
            </div>
            <h2 className="mb-2 text-xl font-bold">Automated support for recurring WHT and software licensing flows</h2>
            <p className="text-sm leading-relaxed text-blue-100/80">The tax dashboard now keeps PP.30, PP.36, PND 3, and PND 53 visible together so operators can review filing impact in one place.</p>
          </div>
          <button className="flex h-12 items-center gap-2 whitespace-nowrap rounded-lg bg-white px-6 font-black text-blue-800 shadow-xl shadow-blue-900/20 transition-transform hover:scale-105">
            Tax Configuration <ArrowRight size={18} />
          </button>
        </div>

        <div className="mb-6 flex items-center gap-2 text-lg font-bold text-yellow-500"><Star size={20} fill="currentColor" /> รายการโปรด (Favorite Forms)</div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div key={form.id} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div className={cn("rounded-lg border p-3", form.bg, form.color, form.border)}><form.icon size={24} /></div>
                  {form.favorite ? <Star className="text-yellow-400" fill="currentColor" size={18} /> : null}
                </div>
                <h3 className="mb-1 text-2xl font-black tracking-tighter text-gray-800">{form.name}</h3>
                <p className="h-10 text-sm font-medium text-gray-500">{form.description}</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
                <button className="flex h-10 w-full items-center justify-center gap-2 rounded border border-green-500 bg-white text-sm font-bold text-green-600 shadow-sm transition-colors hover:bg-green-50">
                  <ShieldCheck size={16} /> ยื่นแบบออนไลน์ (E-Filing)
                </button>
                <TaxExportButton id={form.id} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-12 flex flex-col items-center justify-between rounded-xl border border-gray-200 bg-white p-8 shadow-sm md:flex-row">
          <div className="mb-4 flex items-center gap-6 md:mb-0">
            <div className="rounded-full border border-gray-200 bg-gray-100 p-4 text-gray-500"><Upload size={32} /></div>
            <div>
              <h4 className="text-lg font-bold uppercase tracking-tight text-gray-800">ตรวจสอบไฟล์ก่อนนำส่ง</h4>
              <p className="text-sm text-gray-500">Validate exported files before uploading to the Revenue Department.</p>
            </div>
          </div>
          <button className="h-12 w-full rounded-lg bg-gray-800 px-8 text-sm font-bold uppercase tracking-widest text-white shadow-md transition-all hover:bg-gray-900 md:w-auto">Scan File</button>
        </div>

        <div className="mt-12 border-t border-gray-200 pb-8 pt-8 text-center text-xs font-medium text-gray-400">
          <p className="mb-1 font-bold">© 2026 MICROTRONIC (THAILAND) CO., LTD.</p>
          <p className="italic opacity-80">Tax Modules (PP.30, PP.36, PND 3, PND 53) ready for daily operation.</p>
        </div>
      </div>
    </main>
  );
}
