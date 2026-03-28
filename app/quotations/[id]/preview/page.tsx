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
    <main className="min-h-screen bg-gray-100 py-8 print:p-0 print:bg-white text-gray-800 font-sans">
      
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
      <div className="max-w-4xl mx-auto bg-white relative p-12 md:p-16 shadow-2xl print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0 min-h-[1056px]">
        
        {/* Header: Company & Doc Info */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
          <div className="w-1/2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
              {company?.name || "MICROTRONIC THAILAND"}
            </h1>
            <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
              {company?.address || "123 Business Road, District, Province\nTax ID: 0000000000000"}
            </p>
          </div>
          <div className="w-1/2 text-right">
            <h2 className="text-4xl font-black text-violet-600 tracking-widest uppercase mb-4">Quotation</h2>
            <div className="inline-block text-left text-sm font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <span className="text-slate-400 uppercase tracking-widest text-[10px]">No.</span>
                <span className="text-slate-800">{q.quotation_number}</span>
                <span className="text-slate-400 uppercase tracking-widest text-[10px]">Date</span>
                <span className="text-slate-800">{docDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-violet-50/50 p-6 rounded-2xl border border-violet-100 mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-3 ml-1">Prepared For</h3>
          <div className="font-bold text-slate-800 text-lg mb-1">{q.customer_name || "ไม่ระบุชื่อลูกค้า"}</div>
          {(q.customer_address || q.customer_tax_id) && (
            <div className="text-sm text-slate-600 font-medium leading-relaxed">
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
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 w-12 text-center">#</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center w-24">Qty</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Unit Price</th>
              <th className="py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item: any, i: number) => (
              <tr key={item.id} className="text-sm font-medium">
                <td className="py-4 text-center text-slate-400">{i + 1}</td>
                <td className="py-4 text-slate-800 font-bold">{item.description}</td>
                <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-4 text-right text-slate-600">฿{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-4 text-right text-slate-800 font-bold">฿{Number(item.total_price || (item.quantity * item.unit_price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain height if needed, optional */}
          </tbody>
        </table>

        {/* Totals & Notes */}
        <div className="flex justify-between items-end mb-16 pt-8 border-t border-slate-200">
          <div className="w-1/2 pr-8">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Remarks / Notes</h4>
            <p className="text-xs bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 min-h-[80px] font-medium whitespace-pre-wrap">
              {q.notes || "-"}
            </p>
          </div>
          <div className="w-[40%] bg-violet-50 p-6 rounded-2xl border border-violet-100">
             <div className="flex justify-between text-sm font-bold text-slate-600 mb-3">
               <span>Subtotal</span>
               <span>฿{Number(q.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between text-sm font-bold text-slate-600 mb-4 pb-4 border-b border-violet-200/50">
               <span>VAT (7%)</span>
               <span>฿{Number(q.vat_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex justify-between items-center text-violet-700">
               <span className="text-xs font-black uppercase tracking-widest">Grand Total</span>
               <span className="text-2xl font-black tabular-nums tracking-tighter">
                 ฿{Number(q.net_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </span>
             </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 mt-20 pt-10 px-8 text-center text-sm font-bold text-slate-600">
           <div>
              <div className="h-12 border-b-2 border-slate-300 w-4/5 mx-auto mb-4"></div>
              <p className="text-slate-800">ผู้เสนอราคา (Prepared By)</p>
              <p className="text-xs text-slate-400 mt-1">วันที่ (Date): ____/____/____</p>
           </div>
           <div>
              <div className="h-12 border-b-2 border-slate-300 w-4/5 mx-auto mb-4"></div>
              <p className="text-slate-800">ผู้อนุมัติ / ยืนยันสั่งซื้อ (Accepted By)</p>
              <p className="text-xs text-slate-400 mt-1">วันที่ (Date): ____/____/____</p>
           </div>
        </div>
        
      </div>

    </main>
  );
}
