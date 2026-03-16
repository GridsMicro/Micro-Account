import { query } from "@/lib/db";
import { 
  FileText, 
  Save, 
  User, 
  Calendar, 
  ChevronRight,
  ArrowLeft,
  Trash2,
  Plus,
  Zap
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

async function getQuotation(id: string) {
  try {
    const res = await query(`
      SELECT q.*, c.name as customer_name 
      FROM quotations q 
      LEFT JOIN contacts c ON q.contact_id = c.id 
      WHERE q.id = $1
    `, [id]);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quotation = await getQuotation(id);

  if (!quotation) {
    notFound();
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
               แก้ไขใบเสนอราคา: <span className="text-blue-600">{quotation.quotation_number}</span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
               <Link href="/quotations" className="text-blue-500 hover:underline">Quotations</Link>
               <ChevronRight size={10} />
               <span>Edit Quotation</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/quotations" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                ยกเลิก
             </Link>
            <button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm">
              <Save size={18} /> บันทึกการแก้ไข
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-700">
                   <User size={18} /> ข้อมูลลูกค้า / คู่ค้า
                </div>
                <div className="p-8 space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ข้อมูลลูกค้าแฝงในเอกสาร</label>
                      <input 
                        type="text" 
                        readOnly 
                        defaultValue={quotation.customer_name || 'ไม่ระบุรายชื่อ'}
                        className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded text-sm font-bold text-gray-600 outline-none" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">สถานะเอกสาร</label>
                      <select 
                        defaultValue={quotation.status}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold"
                      >
                         <option value="pending">Pending (รอการตอบกลับ)</option>
                         <option value="sent">Sent (ส่งใบเสนอราคาแล้ว)</option>
                         <option value="accepted">Accepted (ลูกค้าตกลง)</option>
                         <option value="rejected">Rejected (ยกเลิกงาน)</option>
                      </select>
                   </div>
                </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center text-gray-700 font-bold">
                   <h3 className="flex items-center gap-2">
                      <FileText size={18} /> รายการเสนอราคา (Items)
                   </h3>
                </div>
                <div className="overflow-x-auto p-0">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Description</th>
                            <th className="px-4 py-4 text-center w-20">Qty</th>
                            <th className="px-4 py-4 text-right w-36">Price/Unit</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         <tr className="text-sm">
                            <td className="px-8 py-5">
                               <input type="text" defaultValue="บริการตามใบเสนอราคา" className="w-full border-b border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700 py-1" />
                            </td>
                            <td className="px-4 py-5 text-center">
                               <input type="number" defaultValue={1} className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-center" />
                            </td>
                            <td className="px-4 py-5">
                               <input type="number" defaultValue={quotation.total_amount} className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-right font-bold" />
                            </td>
                         </tr>
                      </tbody>
                   </table>
                </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white rounded shadow-sm border border-gray-200 p-8 space-y-6">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                   <Calendar size={18} className="text-blue-600" /> ข้อมูลเอกสาร
                </h3>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Document Number</label>
                      <input type="text" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded font-bold text-blue-600" defaultValue={quotation.quotation_number} />
                   </div>
                </div>
             </div>

             <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Total Amount</p>
                <p className="text-4xl font-black text-gray-900 tracking-tighter">฿{Number(quotation.total_amount).toLocaleString()}</p>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
