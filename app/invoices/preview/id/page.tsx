
import { query } from "@/lib/db";
import { ArrowLeft, Printer, Download, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getInvoiceData(id: string) {
  try {
    // 1. Fetch Invoice & Customer
    const invRes = await query(`
      SELECT i.*, c.name as customer_name, c.address as customer_address, c.tax_id as customer_tax_id, c.phone as customer_phone
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.id = $1
    `, [id]);

    if (invRes.rows.length === 0) return null;
    const invoice = invRes.rows[0];

    // 2. Fetch Invoice Items
    const itemsRes = await query(`
      SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC
    `, [id]);
    
    // 3. Mock Company Data (Normally from DB settings)
    const company = {
      name: "บริษัท ไมโครโทรนิค แอคเคาท์ติ้ง จำกัด",
      address: "123/45 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900",
      tax_id: "0105564000123",
      phone: "02-123-4567",
      email: "contact@microtronic.biz",
      website: "www.microtronic.biz"
    };

    return { invoice, items: itemsRes.rows, company };
  } catch (e) {
    console.error("Fetch Preview Data Error:", e);
    return null;
  }
}

export default async function InvoicePreviewPage({ params }: { params: { id: string } }) {
  const data = await getInvoiceData(params.id);

  if (!data) {
    return notFound();
  }

  const { invoice, items, company } = data;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 md:px-0 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Control Bar - Hidden during print */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 print:hidden">
          <Link href="/invoices" className="flex items-center gap-2 text-slate-500 hover:text-violet-600 transition-colors font-bold text-sm">
            <ArrowLeft size={18} /> ย้อนกลับหน้ารายการ
          </Link>
          <div className="flex items-center gap-3">
             <Link 
               href={`/invoices/edit/${params.id}`}
               className="h-12 px-6 bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm flex items-center transition-all"
             >
                แก้ไขเอกสาร
             </Link>
            <button 
              onClick={() => window.print()}
              className="px-6 h-12 bg-violet-600 text-white rounded-xl font-black text-sm flex items-center gap-3 shadow-lg shadow-violet-200 hover:-translate-y-1 active:scale-95 transition-all"
            >
              <Printer size={18} /> พิมพ์ใบแจ้งหนี้ (Print PDF)
            </button>
          </div>
        </div>

        {/* Invoice Page - A4 Container */}
        <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-100 print:shadow-none print:border-none print:rounded-none">
          
          {/* Header Part */}
          <div className="p-12 md:p-16 border-b border-slate-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full -translate-y-32 translate-x-32 print:hidden"></div>
             
             <div className="flex flex-col md:flex-row justify-between gap-12 relative z-10">
                <div className="space-y-6 flex-1">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200">
                         <ReceiptText size={42} className="text-white" />
                      </div>
                      <div>
                         <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{company.name}</h1>
                         <p className="text-[9px] font-black text-violet-500 uppercase tracking-[0.4em] mt-2">Cloud Intelligent Accounting Hub</p>
                      </div>
                   </div>
                   <div className="text-xs text-slate-500 leading-relaxed font-bold max-w-sm">
                      <p>{company.address}</p>
                      <p className="mt-3">เลขประจำตัวผู้เสียภาษี: <span className="text-black font-black">{company.tax_id}</span></p>
                      <p>โทร: {company.phone} • อีเมล: {company.email}</p>
                   </div>
                </div>

                <div className="text-right space-y-4">
                   <div className="inline-block px-5 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                      {invoice.status === 'paid' ? 'Tax Invoice / Receipt' : 'Invoice'}
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลขที่เอกสาร / No.</h2>
                      <p className="text-3xl font-mono font-black text-violet-600 tracking-tighter">{invoice.invoice_number}</p>
                   </div>
                   <div className="space-y-1">
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่ / Date</h2>
                      <p className="text-base font-black text-slate-900">
                         {new Date(invoice.created_on || invoice.created_at).toLocaleDateString('th-TH', { 
                            day: '2-digit', month: 'long', year: 'numeric' 
                         })}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Billing Info */}
          <div className="p-12 md:p-16 grid grid-cols-2 gap-12 bg-slate-50/20">
             <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <span className="w-1.5 h-4 bg-violet-600 rounded-full"></span> ข้อมูลผู้ซื้อ / Bill To
                </h3>
                <div className="space-y-1">
                   <h4 className="text-lg font-black text-slate-900">{invoice.customer_name}</h4>
                   <p className="text-xs text-slate-500 leading-relaxed font-bold">{invoice.customer_address || 'ไม่ระบุที่อยู่'}</p>
                </div>
                <div className="pt-2 text-[11px] font-bold text-slate-400 space-y-0.5">
                   <p>เลขประจำตัวผู้เสียภาษี: <span className="text-black">{invoice.customer_tax_id || '-'}</span></p>
                   <p>เบอร์ติดต่อ: <span className="text-black">{invoice.customer_phone || '-'}</span></p>
                </div>
             </div>
             <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-violet-100 rounded-3xl bg-white/50">
                <ShieldCheck size={32} className="text-violet-200" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Verified Digital Document</p>
                <p className="text-[8px] text-slate-300 font-bold mt-1 tracking-tight">E-Accounting Standard Compliant</p>
             </div>
          </div>

          {/* Table Area */}
          <div className="px-12 md:px-16 py-8">
             <table className="w-full">
                <thead>
                   <tr className="border-b-2 border-slate-900">
                      <th className="py-6 text-left text-[10px] font-black text-slate-900 uppercase tracking-widest">รายการสินค้า / Description</th>
                      <th className="py-6 text-center text-[10px] font-black text-slate-900 uppercase tracking-widest">จำนวน</th>
                      <th className="py-6 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest">ราคาหน่วย</th>
                      <th className="py-6 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest">ส่วนลด</th>
                      <th className="py-6 text-right text-[10px] font-black text-slate-900 uppercase tracking-widest">รวมเงิน</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {items.length > 0 ? items.map((item: any, idx: number) => (
                      <tr key={idx}>
                         <td className="py-8 font-black text-sm text-slate-900">{item.description}</td>
                         <td className="py-8 text-center text-sm font-bold text-slate-600">{Number(item.quantity).toLocaleString()}</td>
                         <td className="py-8 text-right text-sm font-bold text-slate-600">{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                         <td className="py-8 text-right text-sm font-bold text-slate-300">- {Number(item.discount || 0).toLocaleString()}</td>
                         <td className="py-8 text-right text-base font-black text-slate-900 tabular-nums tracking-tighter">
                            {Number(item.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </td>
                      </tr>
                   )) : (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-300 italic">ไม่มีรายการสำหรับเอกสารนี้</td></tr>
                   )}
                </tbody>
             </table>
          </div>

          {/* Calculation Footer */}
          <div className="p-12 md:p-16 flex flex-col md:flex-row justify-between gap-12 border-t border-slate-100">
             <div className="flex-1 space-y-4">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                   <h4 className="text-[9px] font-black text-slate-400 tracking-widest uppercase">หมายเหตุ (Remark)</h4>
                   <p className="text-xs text-slate-600 leading-relaxed mt-2 italic">ยินดีรับชำระผ่านพร้อมเพย์ หรือโอนเข้าบัญชีธนาคารกสิกรไทย เลขที่ 123-4-56789-0</p>
                </div>
                <p className="text-[10px] font-black text-violet-300 tracking-[0.5em] uppercase">Enterprise Ledger Engine</p>
             </div>
             
             <div className="w-full md:w-80 space-y-3">
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">รวมเงิน (Subtotal)</span>
                   <span className="text-sm font-black text-slate-600 tracking-tight">฿{Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ภาษี 7% (VAT)</span>
                   <span className="text-sm font-black text-slate-600 tracking-tight">฿{Number(invoice.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-slate-100 my-2"></div>
                <div className="flex justify-between items-center p-6 bg-violet-600 rounded-2xl shadow-xl shadow-violet-100">
                   <span className="text-[10px] font-black text-violet-100 uppercase tracking-widest">ยอดสุทธิ (Total)</span>
                   <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
                      ฿{Number(invoice.net_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </span>
                </div>
             </div>
          </div>

          {/* Authorized Signature */}
          <div className="p-12 md:p-16 bg-slate-50/30 grid grid-cols-2 gap-24 border-t border-slate-50">
             <div className="text-center pt-24 space-y-4">
                <div className="border-b border-slate-200 pb-4"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">ผู้รับสินค้า / Customer Signature</p>
             </div>
             <div className="text-center pt-24 space-y-4">
                <div className="border-b border-slate-900 pb-4"></div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">ผู้มีอำนาจลงนาม / Authorized Signature</p>
             </div>
          </div>
        </div>

        <div className="text-center opacity-30 pb-20 print:hidden text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">
           Microtronic Account Excellence 2026
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
        }
      `}} />
    </main>
  );
}
