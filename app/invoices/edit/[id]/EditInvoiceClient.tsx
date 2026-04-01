"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Hash, Loader2, Plus, Save, ShoppingBag, Trash2, User, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getContacts,
  getInvoiceItems,
  updateInvoice,
} from "@/app/actions";

const PROFIT_OPTIONS = [10, 15, 20, 25, 30, 50, 100, 200];
const DISCOUNT_OPTIONS = [0, 3, 5, 10, 15];

type InvoiceItem = {
  id: number;
  productId: string;
  isCustom: boolean;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  markupCost: string;
  markupProfit: number;
  total_price: number;
};

export default function EditInvoiceClient({ invoice }: { invoice: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const [invoiceData, setInvoiceData] = useState({
    contactId: String(invoice.contact_id || ""),
    billingAddress: "",
    billingTaxId: "",
    reference: invoice.invoice_number || "",
    date: invoice.issue_date || new Date().toISOString().split("T")[0],
    dueDate: invoice.due_date || new Date().toISOString().split("T")[0],
    status: invoice.status || "draft",
    items: [] as InvoiceItem[],
    vatRate: 7,
    isVatRegistered: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      const [contactRes, itemsRes] = await Promise.all([
        getContacts("invoice"),
        getInvoiceItems(invoice.id),
      ]);

      if (contactRes.success) {
        setContacts(contactRes.data || []);
      }

      // Load existing items from DB
      if (itemsRes.success) {
        const dbItems = (itemsRes.data || []).map((item: any) => ({
          id: item.id,
          productId: String(item.product_id || ""),
          isCustom: !item.product_id,
          description: item.description || "",
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          total_price: Number(item.total_price || 0),
          discount: item.discount_rate || 0, // Fallback if schema differs
          markupCost: "",
          markupProfit: 20,
        }));
        
        setInvoiceData((prev) => ({ 
          ...prev, 
          items: dbItems.length > 0 ? dbItems : [createEmptyItem()] 
        }));
      }

      // Load Products via API for autocomplete
      try {
        const inventoryRes = await fetch("/api/inventory");
        const inventoryData = await inventoryRes.json();
        if (inventoryRes.ok && inventoryData.success) {
          setProducts(inventoryData.products || []);
        }
      } catch (error) {
        console.error("Failed to load inventory", error);
      }
      setFetching(false);
    };

    fetchData();
  }, [invoice.id]);

  useEffect(() => {
    const selectedContact = contacts.find((c) => String(c.id) === String(invoiceData.contactId));
    if (selectedContact) {
      setInvoiceData((prev) => ({
        ...prev,
        billingAddress: selectedContact.address || "",
        billingTaxId: selectedContact.tax_id || "",
      }));
    }
  }, [contacts, invoiceData.contactId]);

  const createEmptyItem = (): InvoiceItem => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    productId: "",
    isCustom: false,
    description: "",
    quantity: 1,
    unit_price: 0,
    discount: 0,
    markupCost: "",
    markupProfit: 20,
    total_price: 0,
  });

  const addItem = () => {
    setInvoiceData((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  };

  const removeItem = (id: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  };

  const updateItem = (id: number, field: keyof InvoiceItem | "productId", value: any) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        if (field === "productId") {
          if (value === "custom") {
            return { ...item, productId: "", isCustom: true, description: "", unit_price: 0 };
          }
          const product = products.find((p) => String(p.id) === String(value));
          if (product) {
            return {
              ...item,
              productId: String(product.id),
              isCustom: false,
              description: product.name,
              unit_price: Number(product.price || 0),
            };
          }
        }
        
        if (field === "description") {
          return { ...item, description: value, productId: "", isCustom: true };
        }

        return { ...item, [field]: value };
      }),
    }));
  };

  const applyMarkupPrice = (id: number) => {
    const item = invoiceData.items.find((i) => i.id === id);
    if (!item) return;
    const cost = Number(item.markupCost || 0);
    const profit = Number(item.markupProfit || 0);
    const price = parseFloat((cost * (1 + profit / 100)).toFixed(2));
    updateItem(id, "unit_price", price);
  };

  const calculateLineTotal = (item: InvoiceItem) => {
    const gross = (item.quantity || 0) * (item.unit_price || 0);
    const discountFactor = 1 - (item.discount || 0) / 100;
    return parseFloat((gross * discountFactor).toFixed(2));
  };

  const subtotal = parseFloat(invoiceData.items.reduce((sum, i) => sum + calculateLineTotal(i), 0).toFixed(2));
  const vatAmount = invoiceData.isVatRegistered ? parseFloat(((subtotal * invoiceData.vatRate) / 100).toFixed(2)) : 0;
  const totalAmount = parseFloat((subtotal + vatAmount).toFixed(2));

  const handleUpdateInvoice = async () => {
    if (!invoiceData.contactId || subtotal <= 0) {
      setStatus({ type: "error", message: "Please select customer and add items." });
      return;
    }

    setLoading(true);
    try {
      const dbItems = invoiceData.items.map(item => ({
        product_id: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: calculateLineTotal(item),
        vat_rate: invoiceData.vatRate,
        markup_rate: item.markupProfit
      }));

      const res = await updateInvoice(invoice.id, {
        status: invoiceData.status,
        contact_id: invoiceData.contactId,
        net_amount: subtotal,
        vat_amount: vatAmount,
        due_date: invoiceData.dueDate,
        items: dbItems,
        notes: "",
        invoice_number: invoiceData.reference
      });

      if (res.success) {
        setStatus({ type: "success", message: "Invoice updated successfully." });
        setTimeout(() => router.push("/invoices"), 1000);
      } else {
        throw new Error(res.error || "Update failed");
      }
    } catch (err: any) {
      setStatus({ type: "error", message: err.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/invoices" className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:border-blue-200 hover:text-blue-500">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800">Edit Invoice</h1>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                <Link href="/invoices" className="text-blue-600">INVOICES</Link>
                <ChevronRight size={10} />
                <span>{invoice.invoice_number}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleUpdateInvoice}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            บันทึกการแก้ไข
          </button>
        </div>

        {status.type && (
          <div className={`flex items-center gap-3 rounded-xl border-2 p-4 ${status.type === "success" ? "border-green-100 bg-green-50 text-green-800" : "border-red-100 bg-red-50 text-red-800"}`}>
            {status.type === "success" ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            <span className="font-bold">{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-8 py-4">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-700">
                  <User size={18} className="text-blue-500" /> ข้อมูลลูกค้าและเอกสาร
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">ลูกค้ารายนี้</label>
                   <select 
                    value={invoiceData.contactId}
                    onChange={(e) => setInvoiceData(p => ({ ...p, contactId: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500"
                   >
                     {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">อ้างอิงเลขที่</label>
                      <input type="text" value={invoiceData.reference} readOnly className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-4 text-sm font-mono font-bold text-gray-500" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">สถานะ</label>
                      <select value={invoiceData.status} onChange={e => setInvoiceData(p => ({ ...p, status: e.target.value }))} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold">
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                      </select>
                   </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
               <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-8 py-4">
                  <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-700">
                    <ShoppingBag size={18} className="text-purple-500" /> แก้ไขรายการ
                  </h3>
                  <button onClick={addItem} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-blue-700">
                    <Plus size={14} className="mr-2 inline" /> เพิ่มรายการ
                  </button>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full min-w-[1000px] text-left">
                    <thead className="bg-gray-50/50">
                       <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                          <th className="px-8 py-4 text-left">Service / Product</th>
                          <th className="px-4 py-4 w-24">QTY</th>
                          <th className="px-4 py-4 w-60 text-right">Price / Markup</th>
                          <th className="px-8 py-4 text-right">Total</th>
                          <th className="px-4 py-4" />
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoiceData.items.map(item => (
                        <tr key={item.id} className="align-top hover:bg-gray-50/50 transition-colors">
                           <td className="px-8 py-6">
                              {item.isCustom ? (
                                <input 
                                  value={item.description} 
                                  onChange={e => updateItem(item.id, "description", e.target.value)} 
                                  className="w-full h-10 rounded-lg border border-blue-100 bg-blue-50 px-3 text-sm font-bold" 
                                  placeholder="New Custom Item"
                                />
                              ) : (
                                <select 
                                  value={item.productId} 
                                  onChange={e => updateItem(item.id, "productId", e.target.value)}
                                  className="w-full h-10 rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm font-bold"
                                >
                                  <option value="">Select Item</option>
                                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                  <option value="custom">-- Custom Entry --</option>
                                </select>
                              )}
                              <p className="mt-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.description || "Pick from inventory"}</p>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <input type="number" value={item.quantity} onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value)||0)} className="w-16 h-10 rounded-lg border border-gray-100 text-center font-bold" />
                           </td>
                           <td className="px-4 py-6">
                              <div className="space-y-4">
                                <input type="number" value={item.unit_price} onChange={e => updateItem(item.id, "unit_price", parseFloat(e.target.value)||0)} className="w-full h-10 rounded-lg border border-gray-100 text-right font-bold pr-4" />
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 flex flex-col gap-2">
                                   <input type="number" value={item.markupCost} onChange={e => updateItem(item.id, "markupCost", e.target.value)} placeholder="Cost" className="h-8 rounded-lg border px-2 text-xs text-right font-bold" />
                                   <div className="flex gap-1">
                                      <select value={item.markupProfit} onChange={e => updateItem(item.id, "markupProfit", parseInt(e.target.value))} className="h-8 flex-1 rounded-lg border text-[10px] font-black uppercase">
                                        {PROFIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}% Profit</option>)}
                                      </select>
                                      <button onClick={() => applyMarkupPrice(item.id)} className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase">Apply</button>
                                   </div>
                                </div>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right font-black text-blue-600 text-lg tracking-tighter">
                              ฿{calculateLineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                           </td>
                           <td className="px-4 py-6 text-right">
                              <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-blue-900/5">
              <h3 className="mb-8 border-b border-dashed border-gray-100 pb-4 text-sm font-black uppercase tracking-tighter text-gray-800 text-center italic">Calculated Summary</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center px-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Pre-VAT</span>
                   <span className="text-lg font-black text-gray-800">฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center px-2">
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">VAT {invoiceData.vatRate}%</span>
                      <input type="checkbox" checked={invoiceData.isVatRegistered} onChange={e => setInvoiceData(p=>({...p, isVatRegistered: e.target.checked}))} className="h-4 w-4 rounded text-blue-600" />
                   </div>
                   <span className="text-lg font-black text-purple-600">+ ฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="text-center p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Grand Final Amount</p>
                   <p className="text-4xl font-black text-gray-900 tracking-tighter italic">฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-gray-900 p-8 text-center text-white shadow-2xl">
               <p className="mb-1 text-sm font-black uppercase tracking-widest italic leading-tight">Autonomous Accounting Console</p>
               <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Automatic Journal Synchronization Activated</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
