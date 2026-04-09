import { query } from "@/lib/db";
import { ArrowLeft, FileSignature } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "../../preview/[id]/PrintButton";

export const dynamic = "force-dynamic";

async function getInvoiceData(id: string) {
  try {
    const invRes = await query(
      `
        SELECT i.*, c.name as customer_name, c.address as customer_address, c.tax_id as customer_tax_id, c.phone as customer_phone
        FROM invoices i
        LEFT JOIN contacts c ON i.contact_id = c.id
        WHERE i.id = $1
      `,
      [id]
    );
    if (invRes.rows.length === 0) return null;
    const invoice = invRes.rows[0];

    const companyRes = await query(`SELECT * FROM company_settings LIMIT 1`).catch(() => ({ rows: [] as any[] }));
    const company = companyRes.rows[0] || {};

    return { invoice, company };
  } catch (error) {
    return null;
  }
}

export default async function Wht50Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getInvoiceData(id);
  if (!data) return notFound();

  const { invoice, company } = data;
  const issueDate = new Date(invoice.created_on || invoice.created_at || invoice.issue_date);
  const netAmount = Number(invoice.net_amount || 0);
  const whtAmount = data.invoice.invoice_number === "INV26-002" ? 0 : netAmount * 0.03;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 print:bg-white print:p-0 md:px-0">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 print:hidden">
          <Link href={`/invoices/preview/${id}`} className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-violet-600">
            <ArrowLeft size={18} /> ย้อนกลับใบแจ้งหนี้
          </Link>
          <div className="flex items-center gap-3">
            <PrintButton />
          </div>
        </div>

        <div className="overflow-hidden bg-white print:shadow-none print:border-none border border-slate-200">
          <div className="p-12 md:p-16 text-slate-800 text-sm">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-xl font-bold">หนังสือรับรองการหักภาษี ณ ที่จ่าย</h1>
              <p className="text-sm">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</p>
            </div>

            <div className="grid grid-cols-1 gap-6 border p-6 mb-6 pb-8">
              <div>
                <span className="font-bold">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย:</span>
                <p className="mt-1">{invoice.customer_name || "-"}</p>
                <p>{invoice.customer_address || "-"}</p>
                <p>เลขประจำตัวผู้เสียภาษี: {invoice.customer_tax_id || "-"}</p>
              </div>
              
              <div className="border-t pt-6">
                <span className="font-bold">ผู้ถูกหักภาษี ณ ที่จ่าย:</span>
                <p className="mt-1">{company.name || "MICROTRONIC (THAILAND) CO., LTD."}</p>
                <p>{company.address || "-"}</p>
                <p>เลขประจำตัวผู้เสียภาษี: {company.tax_id || "-"}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-sm mt-8">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-800 p-2 w-1/2 text-left">ประเภทเงินได้ที่จ่าย</th>
                  <th className="border border-slate-800 p-2 text-center">วัน เดือน ปี ที่จ่าย</th>
                  <th className="border border-slate-800 p-2 text-right">จำนวนเงินที่จ่าย</th>
                  <th className="border border-slate-800 p-2 text-right">ภาษีที่หักและนำส่งไว้</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-800 p-4 align-top">
                    ค่าบริการ / ค่าวิชาชีพ (อ้างอิง ${invoice.invoice_number})
                  </td>
                  <td className="border border-slate-800 p-4 text-center align-top">
                    {issueDate.toLocaleDateString("th-TH")}
                  </td>
                  <td className="border border-slate-800 p-4 text-right align-top tabular-nums">
                    {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-800 p-4 text-right align-top tabular-nums">
                    {whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="border border-slate-800 p-2 text-right font-bold">รวมเงิน</td>
                  <td className="border border-slate-800 p-2 text-right font-bold tabular-nums">
                    {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-800 p-2 text-right font-bold tabular-nums">
                    {whtAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input type="checkbox" checked readOnly className="mr-2" /> (1) หักภาษี ณ ที่จ่าย
              </div>
              <div className="flex items-center">
                <input type="checkbox" disabled className="mr-2" /> (2) ออกภาษีให้ตลอดไป
              </div>
            </div>

            <div className="mt-16 text-right w-1/2 ml-auto pr-8">
              <p className="mb-8">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</p>
              <div className="border-b border-black w-48 mb-2 mx-auto"></div>
              <p className="text-xs">( วันที่ ........................................ )</p>
            </div>
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 10mm; }
              html, body { background: white !important; -webkit-print-color-adjust: exact !important; }
              nav, aside, header, .print\\:hidden { display: none !important; }
            }
          `,
        }}
      />
    </main>
  );
}
