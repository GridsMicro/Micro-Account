import { query } from "@/lib/db";
import { getCompanySettings } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "./PrintButton";

export const dynamic = 'force-dynamic';

export default async function QuotationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const settingsRes = await getCompanySettings();
  const company = settingsRes.success ? settingsRes.data : null;

  // Fetch Quotation with Customer
  const { rows: qRows } = await query(`
    SELECT q.*, c.name as customer_name, c.tax_id as customer_tax_id, c.address as customer_address, c.contact_person, c.phone as customer_phone
    FROM quotations q
    LEFT JOIN contacts c ON q.contact_id = c.id
    WHERE q.id = $1
  `, [id]);

  if (qRows.length === 0) {
    return <div className="p-20 text-center font-bold text-red-500">❌ ไม่พบข้อมูลใบเสนอราคา หรือถูกลบไปแล้ว</div>;
  }
  const q = qRows[0];

  // Fetch Quotation Items
  const { rows: items } = await query(`
    SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC
  `, [id]);

  const docDate = new Date(q.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <main className="min-h-screen bg-gray-100 py-8 print:p-0 print:bg-white text-gray-800 font-sans print:text-[10px] print:leading-tight" style={{}}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4;
              margin: 12mm;
            }
            
            body {
              font-size: 10px !important;
              line-height: 1.2 !important;
            }
            
            table {
              page-break-inside: avoid;
            }
            
            tr {
              page-break-inside: avoid;
              height: 16px !important;
            }
            
            td {
              height: 16px !important;
            }
          }
        `
      }} />
      
      {/* Floating Toolbar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <Link 
          href="/quotations" 
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-violet-500 font-bold transition-all"
        >
          <ArrowLeft size={18} /> กลับไปหน้ารวม
        </Link>
        <PrintButton />
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-4xl mx-auto bg-white relative p-8 md:p-10 shadow-2xl print:shadow-none print:w-full print:max-w-none print:m-0 print:p-6 print:min-h-0 min-h-[1056px]">
        
        {/* Header: Company & Doc Info */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div className="w-1/2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">
              {company?.name || "MICROTRONIC THAILAND"}
            </h1>
            <p className="text-xs font-medium text-slate-600 leading-tight whitespace-pre-wrap">
              {company?.address || "123 Business Road, District, Province\nTax ID: 0000000000000"}
            </p>
          </div>
          <div className="w-1/2 text-right">
            <h2 className="text-3xl font-black text-violet-600 tracking-widest uppercase mb-2">Quotation</h2>
            <div className="inline-block text-left text-xs font-bold bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">No.</span>
                <span className="text-slate-800 text-xs">{q.quotation_number}</span>
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">Date</span>
                <span className="text-slate-800 text-xs">{docDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100 mb-6">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-violet-500 mb-2 ml-1">Prepared For</h3>
          <div className="font-bold text-slate-800 text-base mb-1">{q.customer_name || "ไม่ระบุชื่อลูกค้า"}</div>
          {(q.customer_address || q.customer_tax_id) && (
            <div className="text-xs text-slate-600 font-medium leading-tight">
              {q.customer_address && <span>{q.customer_address}<br/></span>}
              {q.customer_tax_id && <span>Tax ID: {q.customer_tax_id}</span>}
              {q.contact_person && <span><br/>Attn: {q.contact_person} {q.customer_phone ? `(${q.customer_phone})` : ''}</span>}
            </div>
          )}
        </div>

        {/* Items Table */}
        <table className="w-full text-left mb-8">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 w-12 text-center">#</th>
              <th className="py-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
              <th className="py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center w-20">Qty</th>
              <th className="py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-28">Unit Price</th>
              <th className="py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: any, i: number) => (
              <tr key={item.id} className="text-xs font-medium">
                <td className="py-2 text-center text-slate-400">{i + 1}</td>
                <td className="py-2 text-slate-800 font-bold">{item.description}</td>
                <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                <td className="py-2 text-right text-slate-600">฿{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-2 text-right text-slate-800 font-bold">฿{Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain height if needed, optional */}
          </tbody>
        </table>

        {/* Totals & Notes */}
        <div className="flex justify-between items-end mb-8 pt-6 border-t border-slate-200">
          <div className="w-1/2 pr-6">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Remarks / Notes</h4>
            <p className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-600 min-h-[60px] font-medium whitespace-pre-wrap">
              {q.notes || "-"}
            </p>
          </div>
          <div className="w-[35%] bg-violet-50 p-4 rounded-xl border border-violet-100">
             <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
               <span>Subtotal</span>
               <span>฿{Number(q.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between text-xs font-bold text-slate-600 mb-3 pb-3 border-b border-violet-200/50">
               <span>VAT (7%)</span>
               <span>฿{Number(q.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center text-violet-700">
               <span className="text-[9px] font-black uppercase tracking-widest">Grand Total</span>
               <span className="text-xl font-black tabular-nums tracking-tighter">
                 ฿{Number(q.net_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </span>
             </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 px-6 text-center text-xs font-bold text-slate-600">
           <div>
              <div className="h-10 border-b-2 border-slate-300 w-4/5 mx-auto mb-3"></div>
              <p className="text-slate-800 text-xs">ผู้เสนอราคา (Prepared By)</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่ (Date): ____/____/____</p>
           </div>
           <div>
              <div className="h-10 border-b-2 border-slate-300 w-4/5 mx-auto mb-3"></div>
              <p className="text-slate-800 text-xs">ผู้อนุมัติ / ยืนยันสั่งซื้อ (Accepted By)</p>
              <p className="text-[10px] text-slate-400 mt-1">วันที่ (Date): ____/____/____</p>
           </div>
        </div>
        
      </div>

    </main>
  );
}
