"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  FileText,
  User,
  Zap,
  ChevronRight,
} from "lucide-react";

import { updateQuotation, getProducts } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function EditQuotationClient({ quotation }: { quotation: any }) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [status, setStatus] = useState(quotation.status || "draft");
  const [notes, setNotes] = useState(quotation.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);
  const [isRecurring, setIsRecurring] = useState(quotation.is_recurring || false);
  const [recurringInterval, setRecurringInterval] = useState(quotation.recurring_interval || "monthly");

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const getRecurringLabel = () => {
    if (!isRecurring) return "";
    const now = new Date();
    if (recurringInterval === "monthly") {
      return `(ประจำเดือน ${thaiMonths[now.getMonth()]} ${now.getFullYear() + 543})`;
    }
    return `(ประจำปี ${now.getFullYear() + 543})`;
  };

  useEffect(() => {
    // Load existing items
    if (quotation.items) {
      setItems(quotation.items.map((i: any) => ({
        id: i.id,
        desc: i.description,
        qty: i.quantity,
        price: i.unit_price
      })));
    } else {
      setItems([{ id: Date.now(), desc: "", qty: 1, price: 0 }]);
    }

    const loadProducts = async () => {
      try {
        const res = await getProducts();
        if (res.success) setProducts(res.data ?? []);
      } catch (err) {}
    };
    loadProducts();
  }, [quotation]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: "", qty: 1, price: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };
  
  const handleItemChange = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === "desc" && typeof value === "string") {
          const match = products.find(p => p.name === value);
          if (match && match.price) updatedItem.price = Number(match.price);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (items.length === 0) return alert("กรุณาเพิ่มอย่างน้อย 1 รายการ");
    
    setIsSaving(true);
    const subtotal = calculateTotal();
    const vatAmount = includeVat ? (subtotal * 0.07) : 0;
    const netAmount = subtotal + vatAmount;

    // Append recurring label ONLY if it's not already there? 
    // Actually, on EDIT, maybe they want to change the notes. 
    // I'll leave it as is, or the user can manually append it.
    
    const res = await updateQuotation(quotation.id, {
      contact_id: quotation.contact_id,
      total_amount: subtotal,
      vat_amount: vatAmount,
      net_amount: netAmount,
      notes,
      status,
      items: items.map(i => ({ desc: i.desc, qty: i.qty, price: i.price })),
      is_recurring: isRecurring,
      recurring_interval: isRecurring ? recurringInterval : 'none'
    });

    setIsSaving(false);
    if (res.success) {
      alert("อัปเดตใบเสนอราคาสำเร็จ!");
      router.push(`/quotations/${quotation.id}/preview`);
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาด: " + res.error);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
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
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
            >
              <Save size={18} /> {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-700">
                   <User size={18} /> ข้อมูลลูกค้า / คู่ค้า
                </div>
                <div className="p-8 grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ลูกค้ารายการเดิม</label>
                      <input 
                        type="text" 
                        readOnly 
                        defaultValue={quotation.customer_name || 'ไม่ระบุ'} 
                        className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded text-sm font-bold text-gray-600 outline-none" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">สถานะเอกสาร</label>
                      <select 
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold"
                      >
                         <option value="draft">Draft (ฉบับร่าง)</option>
                         <option value="sent">Sent (ส่งใบเสนอราคาแล้ว)</option>
                         <option value="accepted">Accepted (ลูกค้าตกลง)</option>
                         <option value="rejected">Rejected (ยกเลิกงาน)</option>
                      </select>
                   </div>
                </div>
            </div>

            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex justify-between items-center">
                   <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <FileText size={18} /> รายการเสนอราคา
                   </h3>
                   <button onClick={addItem} className="h-8 px-3 bg-blue-50 text-blue-600 border border-blue-200 rounded text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1">
                      <Plus size={14} /> เพิ่มแถว
                   </button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <th className="px-8 py-4">Description</th>
                            <th className="px-4 py-4 text-center w-20">Qty</th>
                            <th className="px-4 py-4 text-right w-36">Price/Unit</th>
                            <th className="px-8 py-4 text-right w-36">Total</th>
                            <th className="px-4 py-4 w-10"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {items.map((item) => (
                            <tr key={item.id} className="text-sm">
                               <td className="px-8 py-5">
                                  <input 
                                    type="text" 
                                    list="products-list"
                                    value={item.desc}
                                    onChange={(e) => handleItemChange(item.id, 'desc', e.target.value)}
                                    className="w-full border-b border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700 py-1" 
                                  />
                               </td>
                               <td className="px-4 py-5 text-center">
                                  <input 
                                    type="number" 
                                    value={item.qty}
                                    onChange={(e) => handleItemChange(item.id, 'qty', Number(e.target.value))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-center" 
                                  />
                               </td>
                               <td className="px-4 py-5">
                                  <input 
                                    type="number" 
                                    value={item.price}
                                    onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-right" 
                                  />
                               </td>
                               <td className="px-8 py-5 text-right font-bold text-blue-600">
                                  ฿{(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                               </td>
                               <td className="px-4 py-5 text-right">
                                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500">
                                     <Trash2 size={16} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                <datalist id="products-list">
                  {products.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
            </div>
          </div>

          <div className="space-y-6">
             {/* Recurring Settings */}
             <div className="bg-white rounded shadow-sm border border-gray-200 p-8 space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" /> การเกิดซ้ำ (Recurring)
                   </h3>
                   <button 
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`w-10 h-6 rounded-full transition-all relative ${isRecurring ? 'bg-amber-500' : 'bg-gray-200'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-5' : 'left-1'}`} />
                   </button>
                </div>
                
                {isRecurring && (
                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                      <select 
                         value={recurringInterval}
                         onChange={(e) => setRecurringInterval(e.target.value)}
                         className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded text-sm font-bold text-slate-700"
                      >
                         <option value="monthly">รายเดือน (Monthly)</option>
                         <option value="yearly">รายปี (Yearly)</option>
                      </select>
                   </div>
                )}
             </div>

             <div className="bg-white rounded shadow-sm border border-gray-200 p-8">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-4 flex items-center gap-2">
                   <CalendarIcon size={18} className="text-blue-600" /> หมายเหตุ
                </h3>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded text-sm outline-none focus:bg-white"
                  rows={4}
                />
             </div>

             <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-6">สรุปยอดรวม</h3>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                      <span>Subtotal</span>
                      <span className="text-slate-900 font-black">฿{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500">VAT 7%</span>
                      <span className="text-sm font-black text-blue-600">฿{(calculateTotal() * 0.07).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="h-px bg-gray-100 my-4" />
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Grand Total</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">฿{(calculateTotal() * 1.07).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
