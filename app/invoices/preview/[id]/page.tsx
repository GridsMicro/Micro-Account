import { query } from "@/lib/db";
import { ArrowLeft, ReceiptText } from "lucide-react"; // [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - ลบ ShieldCheck ที่ไม่ได้ใช้
import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";

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

    const itemsRes = await query(`SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`, [id]).catch(
      () => ({ rows: [] as any[] })
    );
    const companyRes = await query(`SELECT * FROM company_settings LIMIT 1`).catch(() => ({ rows: [] as any[] }));
    const company = companyRes.rows[0] || {};

    return { invoice, items: itemsRes.rows, company };
  } catch (error) {
    console.error("Fetch Invoice Preview Error:", error);
    return null;
  }
}

export default async function InvoicePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getInvoiceData(id);
  if (!data) return notFound();

  const { invoice, items, company } = data;
  const issueDate = new Date(invoice.created_on || invoice.created_at || invoice.issue_date);
  const subtotal = Number(invoice.net_amount || 0);
  const vat = Number(invoice.vat_amount || 0);
  const total = subtotal + vat;
  const headerLabel = String(invoice.status || "").toLowerCase() === "paid" ? "Tax Invoice / Receipt" : "Invoice (ใบแจ้งหนี้)";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 print:bg-white print:p-0 md:px-0">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/50 print:hidden">
          <Link href="/invoices" className="flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-violet-600">
            <ArrowLeft size={18} /> ย้อนกลับหน้ารายการ
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/invoices/edit/${id}`}
              className="flex h-12 items-center rounded-xl border border-slate-100 bg-white px-6 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50"
            >
              แก้ไขเอกสาร
            </Link>
            <PrintButton />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl print:rounded-none print:border-none print:shadow-none">
          <div className="invoice-header relative overflow-hidden border-b border-slate-50 pt-16 pb-4 px-12 md:pt-16 md:pb-4 md:px-16">
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-32 -translate-y-32 rounded-full bg-violet-600/5 print:hidden" />

            <div className="relative z-10 flex flex-col justify-between gap-12 md:flex-row">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-violet-600 p-4 shadow-xl shadow-violet-200">
                    <ReceiptText size={42} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black leading-none tracking-tight text-slate-900">
                      {company.name || "MICROTRONIC (THAILAND) CO., LTD."}
                    </h1>
                    <p className="mt-2 text-[9px] font-black uppercase tracking-[0.4em] text-violet-500">
                      Tax Invoice Automation
                    </p>
                  </div>
                </div>

                <div className="max-w-sm space-y-1 text-xs font-bold leading-relaxed text-slate-500">
                  <p>{company.address || "Company address not configured"}</p>
                  <p className="pt-2">
                    เลขประจำตัวผู้เสียภาษี: <span className="font-black text-black">{company.tax_id || "-"}</span>
                  </p>
                  <p>
                    โทร: {company.phone || "-"} • อีเมล: {company.email || "-"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-right">
                <div className="inline-block rounded-full bg-slate-900 px-5 py-2 text-[9px] font-black uppercase tracking-widest text-white">
                  {headerLabel}
                </div>
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">เลขที่เอกสาร / No.</h2>
                  <p className="invoice-number text-3xl font-black tracking-tighter text-violet-600">{invoice.invoice_number}</p>
                </div>
                <div className="space-y-1">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">วันที่ / Date</h2>
                  <p className="text-base font-black text-slate-900">
                    {issueDate.toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="invoice-bill-to grid grid-cols-2 gap-12 bg-slate-50/20 p-12 pt-4 pb-4 px-12 md:pt-4 md:pb-4 md:px-16">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span className="h-4 w-1.5 rounded-full bg-violet-600" /> ข้อมูลผู้ซื้อ / Bill To
              </h3>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">{invoice.customer_name || "-"}</h4>
                <p className="text-xs font-bold leading-relaxed text-slate-500">{invoice.customer_address || "ไม่ระบุที่อยู่"}</p>
              </div>
              <div className="space-y-0.5 pt-2 text-[11px] font-bold text-slate-400">
                <p>
                  เลขประจำตัวผู้เสียภาษี: <span className="text-black">{invoice.customer_tax_id || "-"}</span>
                </p>
                <p>
                  เบอร์ติดต่อ: <span className="text-black">{invoice.customer_phone || "-"}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-violet-100 bg-white/50 p-8">
              <img
                src="/microtronic_logo6.png"
                alt="Microtronic Watermark"
                className="w-16 h-16 opacity-[0.20]" // [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - เปลี่ยนโลโก้เป็น Microtronic
              />
              <p className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Verified Digital Document</p>
              <p className="mt-1 text-[8px] font-bold text-slate-300">Invoice ready for print</p>
            </div>
          </div>

          <div className="invoice-body px-12 py-8 md:px-16">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-900">
                  <th className="py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-900">รายละเอียด</th>
                  <th className="py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-900">จำนวน</th>
                  <th className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">ราคาต่อหน่วย</th>
                  <th className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">ส่วนลด</th>
                  <th className="py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-900">รวมเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length > 0 ? (
                  items.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="invoice-item-row py-8 text-sm font-black text-slate-900">{item.description}</td>
                      <td className="invoice-item-row py-8 text-center text-sm font-bold text-slate-600">{Number(item.quantity || 0).toLocaleString()}</td>
                      <td className="invoice-item-row py-8 text-right text-sm font-bold text-slate-600">
                        {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="invoice-item-row py-8 text-right text-sm font-bold text-slate-300">
                        - {Number(item.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="invoice-item-row py-8 text-right text-base font-black tracking-tighter text-slate-900 tabular-nums">
                        {Number(item.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center italic text-slate-300">
                      ไม่มีรายการสำหรับเอกสารนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="invoice-footer flex flex-col justify-between gap-12 border-t border-slate-100 p-12 md:flex-row md:p-16">
            <div className="flex-1 space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">หมายเหตุ</h4>
                <p className="mt-2 text-xs italic leading-relaxed text-slate-600">
                  กรุณาชำระตามกำหนด หากมีการหักภาษี ณ ที่จ่าย ระบบจะบันทึกเป็น WHT receivable ทันทีหลังออกใบกำกับภาษี
                </p>
              </div>
            </div>

            <div className="w-full space-y-3 md:w-80">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">รวมเงิน (Subtotal)</span>
                <span className="text-sm font-black tracking-tight text-slate-600">
                  ฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ภาษี 7% (VAT)</span>
                <span className="text-sm font-black tracking-tight text-slate-600">
                  ฿{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="my-2 h-px bg-slate-100" />
              <div className="flex items-center justify-between rounded-2xl bg-violet-600 p-6 shadow-xl shadow-violet-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-100">ยอดสุทธิ (Total)</span>
                <span className="text-2xl font-black tracking-tighter text-white tabular-nums">
                  ฿{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="invoice-signatures px-12 py-2 pb-12 md:px-16">
            {/* [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - เพิ่ม Signature Block 2 คอลัมน์ */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-400">
                  {/* [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - ข้อความด้านบน */}
                  {'บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด'}
                </h4>
                <div className="flex items-end gap-4 pt-8">
                  <div className="flex-1 border-b-2 border-dashed border-slate-300 pb-1 flex flex-col items-center">
                    {/* [CHANGE] - โดย Cascade | เพิ่ม flex flex-col items-center เพื่อจัดกึ่งกลางรูปและข้อความ */}
                    <img
                      src="/Untitled-10.png"
                      className="h-8 w-auto object-contain -mb-1 pb-2" // ปรับความสูงเล็กน้อย และใช้ negative margin ดึงข้อความขึ้นมา
                      alt="signature"
                    />
                    <p className="text-[9px] text-slate-400 text-center w-full">
                      กฤศ จิวะพงศ์ (ผู้ออกใบแจ้งหนี้)
                    </p>
                    {/* [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - จัดรูปแบบกึ่งกลางสมบูรณ์ */}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase tracking-widest text-slate-400">
                  {/* [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - ข้อความด้านบน */}
                  {'ผู้รับสินค้า / CUSTOMER'}
                </h4>
                <div className="flex items-end gap-4 pt-8">
                  <div className="flex-1 border-b-2 border-dashed border-slate-300 pb-1">
                    {/* [จุดสำคัญ] - เพิ่ม Space ตรงนี้ให้สูง h-8 และมี margin ลบเท่ากับฝั่งลายเซ็น เพื่อให้เส้นประขนานกัน */}
                    <div className="h-8 -mb-1"></div>
                    <p className="text-[9px] text-slate-400 text-center">{issueDate.toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    {/* [CHANGE] - โดย Cascade | [DATE] - 2026-04-02 | [REASON] - ข้อความด้านล่าง */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-20 text-center text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 opacity-30 print:hidden">
          Microtronic Billing Day Ready
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* ตั้งค่าขอบกระดาษพื้นฐาน */
              @page { size: auto; margin: 10mm; }
              
              /* กำจัดองค์ประกอบที่ทำให้เกิดหน้าที่ 2 */
              html, body { height: auto !important; overflow: visible !important; background: white !important; -webkit-print-color-adjust: exact !important; }
              main { min-height: 0 !important; height: auto !important; padding: 0 !important; }
              /* [จุดตาย] - สั่งซ่อน Navbar และ Sidebar ทุกรูปแบบ */
              nav, 
              aside, 
              header, 
              [class*="Navbar"], 
              [class*="sidebar"], 
              [class*="Header"],
              .print\\:hidden,
              /* ดักจับ div ที่ชอบทำตัวเป็น Navbar (fixed/sticky) */
              div[class*="fixed"], 
              div[class*="sticky"] { 
                display: none !important; 
                height: 0 !important;
                width: 0 !important;
                position: absolute !important; 
                visibility: hidden !important;
              }

              /* [ดันเนื้อหา] - บังคับให้ใบแจ้งหนี้ดีดขึ้นไปชิดขอบบนสุด */
              body, main, #__next, .min-h-screen {
                margin-top: 0 !important;
                padding-top: 0 !important;
              }
              
              /* ขยายให้เต็มแผ่น (Fix อาการย่อจนเล็ก) */
              .mx-auto { margin: 0 !important; max-width: 100% !important; width: 100% !important; }
              .max-w-4xl { max-width: 100% !important; width: 100% !important; }
              
              /* ลบเงาและขอบที่ล้นแผ่น */
              * { box-shadow: none !important; text-shadow: none !important; }
              .shadow-2xl, .shadow-xl, .shadow-md, .shadow-sm { box-shadow: none !important; }
              .border, .rounded-\\[2\\.5rem\\] { border-radius: 0 !important; border: none !important; }
              
              /* เส้นแบ่งรายการที่จำเป็น */
              .invoice-header { border-bottom: 1px solid #f1f5f9 !important; padding: 1rem 3rem !important; }
              .invoice-bill-to { border-bottom: 1px solid #f1f5f9 !important; padding: 1rem 3rem !important; background: transparent !important; }
              .invoice-body { padding: 1rem 4rem !important; }
              .invoice-footer { border-top: 1px solid #f1f5f9 !important; padding: 2rem 3rem !important; }
              
              /* จัดการตารางให้ดูดี */
              .invoice-item-row { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; border-bottom: 1px solid #f8fafc !important; }
              th { border-bottom: 2px solid #0f172a !important; padding-bottom: 1rem !important; }
              
              /* ย่อขนาดตัวอักษรให้ดู Enterprise Premium */
              h1 { font-size: 1.5rem !important; }
              h4 { font-size: 0.8rem !important; }
              .invoice-number { font-size: 2rem !important; color: #7c3aed !important; }
              .text-xs { font-size: 10px !important; }
              .text-sm { font-size: 11px !important; }
              .text-base { font-size: 12px !important; }
              .text-lg { font-size: 14px !important; }
              
              /* บังคับไม่ให้ตัดขึ้นหน้าใหม่กลางคัน */
              .invoice-header, .invoice-bill-to, .invoice-body, .invoice-footer { break-inside: avoid !important; }
            }
          `,
        }}
      />
    </main>
  );
}
