"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  FileText,
  User,
  Zap,
  ChevronRight,
} from "lucide-react";

type Contact = {
  id: number;
  name: string;
  address?: string;
  tax_id?: string;
  phone?: string;
};

import { createQuotation, getNextQuotationNumber } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewQuotationPage() {
  const router = useRouter();
  const [items, setItems] = useState([{ id: 1, desc: "", qty: 1, price: 0 }]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [docNo, setDocNo] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [includeVat, setIncludeVat] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState("monthly");

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
    const loadContacts = async () => {
      try {
        const res = await fetch("/api/contacts?type=customer");
        if (!res.ok) throw new Error("Failed to fetch contacts");
        const data = await res.json();
        // The API currently returns simplified objects, let's fetch full if needed or assume it's there
        // Note: I will update the API or use a direct action if possible
        setContacts(data.contacts || []);
      } catch (error) {
        console.error("Failed to load contacts", error);
      } finally {
        setLoadingContacts(false);
      }
    };
    const loadProducts = async () => {
      try {
        const { getProducts } = await import("@/app/actions");
        const res = await getProducts();
        if (res.success) {
          setProducts(res.data ?? []);
        }
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };
    const loadNextNo = async () => {
      try {
        const res = await getNextQuotationNumber();
        if (res.success) setDocNo(res.data);
      } catch (err) {}
    };
    loadContacts();
    loadProducts();
    loadNextNo();
  }, []);

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
        // Auto-fill price if picking from product list
        if (field === "desc" && typeof value === "string") {
          const match = products.find(p => p.name === value);
          if (match && match.price) {
            updatedItem.price = Number(match.price);
          }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!selectedContact) {
      alert("กรุณาเลือกลูกค้า");
      return;
    }
    const validItems = items.filter(i => i.desc.trim() !== "");
    if (validItems.length === 0) {
      alert("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    setIsSaving(true);
    const subtotal = calculateTotal();
    const vatAmount = includeVat ? (subtotal * 0.07) : 0;
    const netAmount = subtotal + vatAmount;

    // Append recurring label to notes if active
    const finalNotes = isRecurring ? `${notes}\n${getRecurringLabel()}`.trim() : notes;

    const res = await createQuotation({
      quotation_number: docNo,
      contact_id: Number(selectedContact),
      total_amount: subtotal,
      vat_amount: vatAmount,
      net_amount: netAmount,
      notes: finalNotes,
      items: validItems,
      is_recurring: isRecurring,
      recurring_interval: isRecurring ? recurringInterval : 'none'
    });

    setIsSaving(false);
    if (res.success) {
      alert("บันทึกใบเสนอราคาสำเร็จ!");
      router.push(`/quotations/${res.id}/preview`);
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาด: " + res.error);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">สร้างใบเสนอราคาใหม่ (New Quotation)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
               <Link href="/quotations" className="text-blue-600 hover:underline">Quotations</Link>
               <span>/</span>
               <span>Create</span>
            </div>
          </div>
          <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
             <Save size={16} /> {isSaving ? "กำลังบันทึก..." : "บันทึกเอกสาร"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-700">
                   <User size={18} /> ข้อมูลลูกค้า / คู่ค้า
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">เลือกลูกค้า</label>
                          <select
                            value={selectedContact}
                            onChange={(e) => setSelectedContact(e.target.value)}
                            disabled={loadingContacts}
                            className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold shadow-sm"
                          >
                            <option value="">ยังไม่เลือกบริษัทลูกค้า</option>
                            {contacts.map((contact) => (
                              <option key={contact.id} value={String(contact.id)}>
                                {contact.name}
                              </option>
                            ))}
                          </select>
                          {loadingContacts && <p className="text-xs text-gray-500">กำลังโหลดรายชื่อลูกค้า...</p>}
                       </div>

                       {/* Customer Detail Display */}
                       {selectedContact && (
                          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 animate-in fade-in slide-in-from-top-2 duration-300">
                             {contacts.find(c => String(c.id) === selectedContact) && (
                                <div className="space-y-2">
                                   <div className="flex justify-between items-start">
                                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Customer Details</span>
                                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ID: {selectedContact}</span>
                                   </div>
                                   <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                      {contacts.find(c => String(c.id) === selectedContact)?.address || "ไม่มีข้อมูลที่อยู่"}
                                   </p>
                                   <div className="flex gap-4 text-xs font-bold text-slate-500">
                                      <span className="flex items-center gap-1"><Zap size={10} className="text-blue-500" /> Tax ID: {contacts.find(c => String(c.id) === selectedContact)?.tax_id || "-"}</span>
                                      <span className="flex items-center gap-1"><Zap size={10} className="text-blue-500" /> โทร: {contacts.find(c => String(c.id) === selectedContact)?.phone || "-"}</span>
                                   </div>
                                </div>
                             )}
                          </div>
                       )}
                    </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">หมายเหตุภายใน</label>
                      <textarea 
                        rows={2} 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm" 
                        placeholder="ระบุข้อมูลเพิ่มเติมถ้ามี..."
                      ></textarea>
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
                <div className="overflow-x-auto p-0">
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
                               <td className="px-8 py-5 relative">
                                  <input 
                                    type="text" 
                                    list={`products-list`}
                                    value={item.desc}
                                    onChange={(e) => handleItemChange(item.id, 'desc', e.target.value)}
                                    placeholder="ค้นหาชื่อสินค้าจากคลัง หรือพิมพ์ใหม่..." 
                                    className="w-full border-b border-gray-200 focus:border-blue-500 outline-none font-bold text-gray-700 py-1" 
                                  />
                               </td>
                               <td className="px-4 py-5 text-center">
                                  <input 
                                    type="number" 
                                    value={item.qty}
                                    onChange={(e) => handleItemChange(item.id, 'qty', Number(e.target.value))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-center focus:bg-white focus:border-blue-500" 
                                  />
                               </td>
                               <td className="px-4 py-5">
                                  <input 
                                    type="number" 
                                    value={item.price}
                                    onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded py-1 px-2 text-right focus:bg-white focus:border-blue-500" 
                                  />
                               </td>
                               <td className="px-8 py-5 text-right font-bold text-blue-600 italic">
                                  ฿{(item.qty * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                               </td>
                               <td className="px-4 py-5 text-right">
                                  <button type="button" onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500">
                                     <Trash2 size={16} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                       </tbody>
                    </table>
                 </div>
                 
                 {/* Datalist for Product Autocomplete */}
                 <datalist id="products-list">
                   {products.map(p => (
                     <option key={p.id} value={p.name} />
                   ))}
                 </datalist>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-white rounded shadow-sm border border-gray-200 p-8 space-y-6">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                   <Calendar size={18} className="text-blue-600" /> ข้อมูลเอกสาร
                </h3>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">หมายเลขเอกสาร</label>
                      <input 
                         type="text" 
                         value={docNo}
                         onChange={(e) => setDocNo(e.target.value)}
                         className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded font-bold text-blue-600" 
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">วันที่เอกสาร</label>
                      <input type="date" className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded text-sm font-medium" defaultValue={new Date().toISOString().split('T')[0]} />
                   </div>
                </div>
             </div>

             {/* Recurring Settings */}
             <div className="bg-white rounded shadow-sm border border-gray-200 p-8 space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" /> การเกิดซ้ำ (Recurring)
                   </h3>
                   <button 
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
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                         <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Preview Label</p>
                         <p className="text-xs font-bold text-amber-800">{getRecurringLabel()}</p>
                      </div>
                   </div>
                )}
             </div>

             <div className="bg-white rounded shadow-sm border-t-4 border-blue-600 p-8 shadow-md border border-gray-200">
                <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-6">สรุปยอดรวม</h3>
                <div className="space-y-3">
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Subtotal</span>
                      <span className="text-slate-900 font-black">฿{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">ภาษีมูลค่าเพิ่ม 7%</span>
                         <button 
                            onClick={() => setIncludeVat(!includeVat)}
                            className={`w-10 h-6 rounded-full transition-all relative ${includeVat ? 'bg-blue-600' : 'bg-gray-200'}`}
                         >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeVat ? 'left-5' : 'left-1'}`} />
                         </button>
                      </div>
                      <span className={`text-sm font-black transition-all ${includeVat ? 'text-blue-600' : 'text-slate-300'}`}>
                         ฿{(includeVat ? calculateTotal() * 0.07 : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                   </div>
                </div>
                <div className="h-px bg-gray-100 my-6" />
                <div className="flex justify-between items-end">
                   <span className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Grand Total</span>
                   <span className="text-3xl font-black text-gray-900 tracking-tighter">฿{(calculateTotal() * (includeVat ? 1.07 : 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
