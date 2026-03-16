import { query } from "@/lib/db";
import { 
  Receipt, 
  Save, 
  User, 
  Calendar, 
  ChevronRight,
  ArrowLeft,
  Trash2,
  Plus,
  Zap,
  Building2
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getInvoice(id: string) {
  try {
    const res = await query(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      LEFT JOIN contacts c ON i.contact_id = c.id 
      WHERE i.id = $1
    `, [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id);

  if (!invoice) {
    notFound();
  }

  // Sample items for visualization since the items table might not be fully linked/populated in this simplified view
  const sampleItems = [{ id: 1, desc: "บริการปรึกษาระบบ", qty: 1, price: invoice.net_amount }];

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
               แก้ไขใบแจ้งหนี้: <span className="text-blue-600">{invoice.invoice_number}</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
               <Link href="/invoices" className="text-blue-500 hover:underline">Invoices</Link>
               <ChevronRight size={10} />
               <span>Edit Document</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/invoices" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                ยกเลิก
             </Link>
            <button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm">
              <Save size={18} /> บันทึกการแก้ไข
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Selection Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <User size={18} /> ข้อมูลลูกค้า
                   </h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">ลูกค้ารายการเดิม</label>
                      <input 
                        type="text" 
                        readOnly 
                        defaultValue={invoice.customer_name || 'ไม่ระบุ'} 
                        className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded text-sm font-bold text-gray-600" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">สถานะใบแจ้งหนี้</label>
                      <select 
                        defaultValue={invoice.status}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold"
                      >
                         <option value="draft">Draft (ร่างเอกสาร)</option>
                         <option value="sent">Sent (ส่งแล้ว)</option>
                         <option value="paid">Paid (ชำระแล้ว)</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">วันที่สร้าง (Date)</label>
                      <input 
                        type="date" 
                        defaultValue={new Date(invoice.created_at).toISOString().split('T')[0]}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                      />
                   </div>
                </div>
            </div>

            {/* Line Items Table Card */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Receipt size={18} /> รายการในเอกสาร
                   </h3>
                </div>

                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Description</th>
                            <th className="px-4 py-4 text-center w-24">Qty</th>
                            <th className="px-4 py-4 text-right w-40">Price/Unit</th>
                            <th className="px-8 py-4 text-right w-40">Total</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {sampleItems.map((item) => (
                            <tr key={item.id} className="text-sm">
                               <td className="px-8 py-6">
                                  <input 
                                    type="text" 
                                    defaultValue={item.desc}
                                    className="w-full border-b border-gray-200 focus:border-blue-500 focus:outline-none font-bold text-gray-700 py-1 transition-all" 
                                  />
                               </td>
                               <td className="px-4 py-6">
                                  <input type="number" defaultValue={item.qty} className="w-full bg-gray-50 border border-gray-200 rounded py-2 px-3 text-center font-bold" />
                               </td>
                               <td className="px-4 py-6">
                                  <input type="number" defaultValue={item.price} className="w-full bg-gray-50 border border-gray-200 rounded py-2 px-3 text-right font-bold" />
                               </td>
                               <td className="px-8 py-6 text-right font-bold text-blue-600">
                                  ฿{Number(item.price * item.qty).toLocaleString()}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
          </div>

          {/* Totals Sidebar Card */}
          <div className="space-y-6">
             <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-8 border-b border-gray-100 pb-4">สรุปยอดเงินสุทธิ</h3>
                
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <span>Invoiced Amount</span>
                      <span className="text-gray-800">฿{Number(invoice.net_amount).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-gray-500 font-bold text-xs uppercase tracking-wider">
                      <span>VAT 7.0%</span>
                      <span className="text-gray-800">฿{Number(invoice.net_amount * 0.07).toLocaleString()}</span>
                   </div>
                   <div className="h-px bg-gray-100 my-4" />
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">ยอดรวมทั้งหมด</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">฿{Number(invoice.net_amount * 1.07).toLocaleString()}</span>
                   </div>
                </div>
             </div>

             <div className="bg-[#343a40] text-gray-400 p-6 rounded shadow-sm text-center border border-gray-700">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Audit Control</p>
                <p className="text-xs font-mono text-blue-400 font-bold">INV#{invoice.id}</p>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
