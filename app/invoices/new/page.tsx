"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Calendar, CheckCircle2, Hash, Loader2, Plus, Save, ShoppingBag, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContact,
  createInvoice,
  createJournalEntry,
  getCompanySettings,
  getContacts,
  getNextInvoiceNumber,
  getQuotation,
} from "@/app/actions";
import { useSearchParams } from "next/navigation";

const PROFIT_OPTIONS = [10, 15, 20, 25, 30, 50, 100, 200];
const DISCOUNT_OPTIONS = [0, 3, 5, 10, 15];

type InvoiceItem = {
  id: number;
  productId: string;
  isCustom: boolean;
  desc: string;
  detail: string;
  qty: number;
  price: number;
  discount: number;
  markupCost: string;
  markupProfit: number;
};

function createEmptyItem(): InvoiceItem {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    productId: "",
    isCustom: false,
    desc: "",
    detail: "",
    qty: 1,
    price: 0,
    discount: 0,
    markupCost: "",
    markupProfit: 20,
  };
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotationId");
  
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    name: "",
    type: "CUSTOMER",
    email: "",
    phone: "",
    address: "",
    tax_id: "",
  });

  const [invoiceData, setInvoiceData] = useState({
    contactId: "",
    billingAddress: "",
    billingTaxId: "",
    reference: "Loading...",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: [createEmptyItem()],
    vatRate: 7,
    isVatRegistered: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [contactRes, companyRes, nextRefRes] = await Promise.all([
        getContacts("invoice"),
        getCompanySettings(),
        getNextInvoiceNumber(),
      ]);

      if (contactRes.success) {
        setContacts(contactRes.data || []);
      }

      if (nextRefRes.success) {
        setInvoiceData((prev) => ({ ...prev, reference: nextRefRes.data || prev.reference }));
      }

      // Check for Quotation Linkage
      if (quotationId) {
        const qRes = await getQuotation(quotationId);
        if (qRes.success && qRes.data) {
          const qData = qRes.data;
          setInvoiceData((prev) => ({
            ...prev,
            contactId: String(qData.contact_id),
            items: qData.items.map((it: any) => ({
              id: Date.now() + Math.random(),
              productId: "",
              isCustom: true,
              desc: it.description,
              detail: "",
              qty: Number(it.quantity),
              price: Number(it.unit_price),
              discount: 0,
              markupCost: "",
              markupProfit: 20,
            })),
          }));
        }
      }

      if (!companyRes.success) {
        console.error("Failed to load company settings");
      }

      try {
        const inventoryRes = await fetch("/api/inventory");
        const inventoryData = await inventoryRes.json();
        if (inventoryRes.ok && inventoryData.success) {
          setProducts(inventoryData.products || []);
        }
      } catch (error) {
        console.error("Failed to load inventory", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const selectedContact = contacts.find((contact) => String(contact.id) === String(invoiceData.contactId));
    setInvoiceData((prev) => ({
      ...prev,
      billingAddress: selectedContact?.address || "",
      billingTaxId: selectedContact?.tax_id || "",
    }));
  }, [contacts, invoiceData.contactId]);

  const selectedContact = contacts.find((contact) => String(contact.id) === String(invoiceData.contactId));

  const updateItem = (id: number, field: keyof InvoiceItem | "productId", value: any) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item;

        if (field === "productId") {
          if (value === "custom") {
            return { ...item, productId: "", isCustom: true, desc: "", price: 0 };
          }

          const product = products.find((entry) => String(entry.id) === String(value));
          if (product) {
            return {
              ...item,
              productId: String(product.id),
              isCustom: false,
              desc: product.name,
              price: Number(product.price || 0),
            };
          }

          return { ...item, productId: "", desc: "" };
        }

        if (field === "desc") {
          return { ...item, desc: value, productId: "", isCustom: true };
        }

        return { ...item, [field]: value };
      }),
    }));
  };

  const addItem = () => {
    setInvoiceData((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  };

  const removeItem = (id: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((item) => item.id !== id) : prev.items,
    }));
  };

  const applyMarkupPrice = (id: number) => {
    const currentItem = invoiceData.items.find((item) => item.id === id);
    if (!currentItem) return;

    const supplierCost = Number(currentItem.markupCost || 0);
    const targetProfit = Number(currentItem.markupProfit || 0);
    const sellingPrice = parseFloat((supplierCost * (1 + targetProfit / 100)).toFixed(2));

    updateItem(id, "price", sellingPrice);
  };

  const calculateLineTotal = (item: InvoiceItem) => {
    const gross = Number(item.qty || 0) * Number(item.price || 0);
    const discountFactor = 1 - Number(item.discount || 0) / 100;
    return parseFloat((gross * discountFactor).toFixed(2));
  };

  const subtotal = parseFloat(invoiceData.items.reduce((sum, item) => sum + calculateLineTotal(item), 0).toFixed(2));
  const vatAmount = invoiceData.isVatRegistered ? parseFloat(((subtotal * invoiceData.vatRate) / 100).toFixed(2)) : 0;
  const totalAmount = parseFloat((subtotal + vatAmount).toFixed(2));

  const handleQuickAddContact = async () => {
    if (!quickAdd.name.trim()) {
      setStatus({ type: "error", message: "Please enter the customer name before quick adding." });
      return;
    }

    setLoading(true);
    try {
      const createRes = await createContact(quickAdd);
      if (!createRes.success) {
        throw new Error(createRes.error || "Unable to create contact");
      }

      const contactRes = await getContacts("invoice");
      if (!contactRes.success) {
        throw new Error(contactRes.error || "Unable to refresh contacts");
      }

      const nextContacts = contactRes.data || [];
      setContacts(nextContacts);
      const createdContact = nextContacts.find((contact: any) => contact.id === createRes.id);

      setInvoiceData((prev) => ({
        ...prev,
        contactId: createdContact ? String(createdContact.id) : prev.contactId,
        billingAddress: createdContact?.address || "",
        billingTaxId: createdContact?.tax_id || "",
      }));

      setQuickAdd({
        name: "",
        type: "CUSTOMER",
        email: "",
        phone: "",
        address: "",
        tax_id: "",
      });
      setShowQuickAdd(false);
      setStatus({ type: "success", message: "Customer added and selected for this invoice." });
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Quick add contact failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceData.contactId || subtotal <= 0) {
      setStatus({ type: "error", message: "Please select a customer and add billable line items." });
      return;
    }

    setLoading(true);
    try {
      if (!selectedContact) {
        throw new Error("Customer record not found.");
      }

      const res = await createInvoice({
        invoice_number: invoiceData.reference,
        contact_id: invoiceData.contactId,
        net_amount: subtotal,
        vat_amount: vatAmount,
        status: "sent",
        due_date: invoiceData.dueDate,
        date: invoiceData.date,
        items: invoiceData.items,
        quotation_id: quotationId, // ส่ง ID เชื่อมโยงไปด้วย
      });

      if (!res.success) throw new Error(res.error);

      setStatus({ type: "success", message: "Invoice created successfully." });
      setTimeout(() => router.push("/invoices"), 1500);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message || "Failed to create invoice." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f9] p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/invoices" className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:border-blue-200 hover:text-blue-500">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800">Invoice Creation</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">Billing Day Console</p>
            </div>
          </div>

          <button
            onClick={handleSaveInvoice}
            disabled={loading}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-8 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Create Invoice
          </button>
        </div>

        {status.type ? (
          <div
            className={`flex items-center gap-3 rounded-xl border-2 p-4 ${
              status.type === "success" ? "border-green-100 bg-green-50 text-green-800" : "border-red-100 bg-red-50 text-red-800"
            }`}
          >
            {status.type === "success" ? <CheckCircle2 className="h-6 w-6 shrink-0" /> : <AlertCircle className="h-6 w-6 shrink-0" />}
            <span className="font-bold">{status.message}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-8">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-8 py-4">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-700">
                  <User size={18} className="text-blue-500" /> Customer & Document
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Select Customer</label>
                  <select
                    value={invoiceData.contactId}
                    onChange={(e) => setInvoiceData((prev) => ({ ...prev, contactId: e.target.value }))}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">Select customer</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} {contact.tax_id ? `(${contact.tax_id})` : ""}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setShowQuickAdd((prev) => !prev)}
                      className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-all hover:bg-blue-100"
                    >
                      <Plus size={14} className="mr-2 inline" />
                      Quick Add Contact
                    </button>
                    {selectedContact ? (
                      <span className="inline-flex items-center rounded-xl bg-emerald-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        Ready: {selectedContact.name}
                      </span>
                    ) : null}
                  </div>

                  {showQuickAdd ? (
                    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={quickAdd.name}
                        onChange={(e) => setQuickAdd({ ...quickAdd, name: e.target.value })}
                        placeholder="Customer name"
                        className="h-11 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-400"
                      />
                      <input
                        type="text"
                        value={quickAdd.tax_id}
                        onChange={(e) => setQuickAdd({ ...quickAdd, tax_id: e.target.value })}
                        placeholder="Tax ID"
                        className="h-11 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-400"
                      />
                      <input
                        type="email"
                        value={quickAdd.email}
                        onChange={(e) => setQuickAdd({ ...quickAdd, email: e.target.value })}
                        placeholder="Email"
                        className="h-11 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-400"
                      />
                      <input
                        type="text"
                        value={quickAdd.phone}
                        onChange={(e) => setQuickAdd({ ...quickAdd, phone: e.target.value })}
                        placeholder="Phone"
                        className="h-11 rounded-xl border border-blue-100 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-400"
                      />
                      <textarea
                        rows={2}
                        value={quickAdd.address}
                        onChange={(e) => setQuickAdd({ ...quickAdd, address: e.target.value })}
                        placeholder="Billing address"
                        className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 md:col-span-2"
                      />
                      <div className="flex justify-end md:col-span-2">
                        <button
                          type="button"
                          onClick={handleQuickAddContact}
                          disabled={loading}
                          className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add And Select
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Billing Address</label>
                  <textarea
                    rows={3}
                    value={invoiceData.billingAddress}
                    readOnly
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Tax ID</label>
                  <input
                    type="text"
                    value={invoiceData.billingTaxId}
                    readOnly
                    className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-600 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Reference</label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={invoiceData.reference}
                      onChange={(e) => setInvoiceData((prev) => ({ ...prev, reference: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-red-500">Due Date</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-3.5 text-red-400" />
                    <input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData((prev) => ({ ...prev, dueDate: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-red-100 bg-red-50/30 pl-11 pr-4 text-sm font-bold text-red-700 outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-8 py-4">
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-700">
                  <ShoppingBag size={18} className="text-purple-500" /> Product / Service Lines
                </h3>
                <button
                  onClick={addItem}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
                >
                  <Plus size={14} className="mr-2 inline" />
                  Add Line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="bg-gray-50/50">
                    <tr className="border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      <th className="px-8 py-4">Product / Service</th>
                      <th className="px-4 py-4 text-center">Qty</th>
                      <th className="px-4 py-4 text-right">Price / Markup</th>
                      <th className="px-4 py-4 text-center">Discount</th>
                      <th className="px-8 py-4 text-right">Total</th>
                      <th className="px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoiceData.items.map((item) => (
                      <tr key={item.id} className="align-top text-sm transition-colors hover:bg-gray-50/50">
                        <td className="px-8 py-6">
                          {item.isCustom ? (
                            <div className="space-y-2">
                                <input
                                  type="text"
                                  value={item.desc}
                                  onChange={(e) => updateItem(item.id, "desc", e.target.value)}
                                  placeholder="Custom / Non-Inventory Item"
                                  className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-gray-700 outline-none focus:border-blue-500"
                                />
                                <input
                                  type="text"
                                  value={item.detail}
                                  onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                                  placeholder="เดือน/ปี หรือรายละเอียดเพิ่มเติม (เช่น 04/2026)"
                                  className="w-full rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 outline-none focus:border-blue-400"
                                />
                              <button
                                type="button"
                                onClick={() => updateItem(item.id, "isCustom", false)}
                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline"
                              >
                                Back To Inventory List
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                                <select
                                  value={item.productId || ""}
                                  onChange={(e) => updateItem(item.id, "productId", e.target.value)}
                                  className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/10"
                                >
                                  <option value="">Select inventory item</option>
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name} {product.sku_number ? `(${product.sku_number})` : ""}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={item.detail}
                                  onChange={(e) => updateItem(item.id, "detail", e.target.value)}
                                  placeholder="เดือน/ปี หรือรายละเอียดเพิ่มเติม (เช่น 04/2026)"
                                  className="w-full rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 outline-none focus:border-blue-400"
                                />
                                <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                  <span>{item.desc || "Select an inventory item"}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateItem(item.id, "productId", "custom")}
                                    className="text-blue-600 hover:underline"
                                  >
                                    Custom Item
                                  </button>
                                </div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-6">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value, 10) || 0)}
                            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                          />
                        </td>

                        <td className="px-4 py-6">
                          <div className="space-y-3">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-right font-bold outline-none focus:ring-2 focus:ring-blue-500/10"
                            />

                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">Markup Calculator</p>
                              <div className="grid grid-cols-1 gap-2">
                                <input
                                  type="number"
                                  value={item.markupCost || ""}
                                  onChange={(e) => updateItem(item.id, "markupCost", e.target.value)}
                                  placeholder="Supplier Cost"
                                  className="h-9 rounded-lg border border-emerald-100 bg-white px-3 text-right text-xs font-bold outline-none focus:border-emerald-400"
                                />
                                <select
                                  value={item.markupProfit}
                                  onChange={(e) => updateItem(item.id, "markupProfit", parseInt(e.target.value, 10))}
                                  className="h-9 rounded-lg border border-emerald-100 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-400"
                                >
                                  {PROFIT_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      Profit {option}%
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => applyMarkupPrice(item.id)}
                                  className="h-9 rounded-lg bg-emerald-600 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-6">
                          <select
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, "discount", parseInt(e.target.value, 10))}
                            className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/10"
                          >
                            {DISCOUNT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}%
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-8 py-6 text-right text-lg font-black tracking-tighter text-blue-600">
                          ฿{calculateLineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-6 text-right">
                          <button onClick={() => removeItem(item.id)} className="text-gray-300 transition-colors hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
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
              <h3 className="mb-8 border-b border-dashed border-gray-100 pb-4 text-sm font-black uppercase tracking-tighter text-gray-800">
                Net Amount Summary
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotal</span>
                  <span className="text-lg font-black text-gray-900">฿{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">VAT {invoiceData.vatRate}%</span>
                    <input
                      type="checkbox"
                      checked={invoiceData.isVatRegistered}
                      onChange={(e) => setInvoiceData((prev) => ({ ...prev, isVatRegistered: e.target.checked }))}
                      className="h-4 w-4 rounded text-blue-600"
                    />
                  </div>
                  <span className="text-lg font-black text-purple-600">+ ฿{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="text-center">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 underline">Grand Total</span>
                  <span className="block text-4xl font-black tracking-tighter text-gray-900">
                    ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-800 p-8 text-center text-white shadow-2xl">
              <p className="mb-1 text-sm font-black uppercase tracking-widest italic">Professional Billing</p>
              <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Markup, discount, VAT-ready</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
