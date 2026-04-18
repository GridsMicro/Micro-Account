"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Loader2,
  Paperclip,
  PieChart,
  Plus,
  Tag,
  Trash2,
  User,
  Wallet,
  Banknote,
  FileBadge,
} from "lucide-react";
import GoogleDrivePicker from "@/components/GoogleDrivePicker";
import {
  createExpense,
  deleteExpense,
  getExpenses,
} from "@/app/expense-actions";
import { getContacts } from "@/app/actions";
import { EXPENSE_CATEGORIES, EXPENSE_CLASSIFICATIONS } from "@/lib/expenses";

const THAI_MONTHS = [
  "",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const CATEGORY_COLORS: Record<string, string> = {
  "เงินเดือนและค่าแรง": "bg-violet-100 text-violet-700 border-violet-200",
  "ค่าเช่าสถานที่": "bg-blue-100 text-blue-700 border-blue-200",
  "ค่าสาธารณูปโภค": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "การตลาดและโฆษณา": "bg-pink-100 text-pink-700 border-pink-200",
  "ค่า License/Software": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "ค่าขนส่งและเดินทาง": "bg-amber-100 text-amber-700 border-amber-200",
  "วัสดุและอุปกรณ์": "bg-orange-100 text-orange-700 border-orange-200",
  "ค่าซ่อมบำรุง": "bg-red-100 text-red-700 border-red-200",
  "ต้นทุนสินค้า (COGS)": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "อื่นๆ": "bg-slate-100 text-slate-700 border-slate-200",
};

export default function ExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  });

  const [form, setForm] = useState({
    contact_id: "",
    title: "",
    category: "อื่นๆ",
    classification: "OPEX",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    reference_no: "",
    tax_invoice_no: "",
    tax_invoice_date: "",
    vat_amount: "",
    wht_rate: "3",
    wht_amount: "",
    net_amount: "",
    is_service: false,
    notes: "",
    receipt_url: "",
    receipt_file_name: "",
  });

  const fetchData = async () => {
    setLoading(true);
    const res = await getExpenses(String(year), String(month));
    if (res.success) {
      setExpenses(res.data || []);
      setSummary(res.summary || []);
      setTotalExpense(res.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  useEffect(() => {
    const fetchVendors = async () => {
      const res = await getContacts("expense");
      if (res.success) {
        setVendors(res.data || []);
      }
    };

    fetchVendors();
  }, []);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
      return;
    }
    setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
      return;
    }
    setMonth((m) => m + 1);
  };

  const resetForm = () =>
    setForm({
      contact_id: "",
      title: "",
      category: "อื่นๆ",
      classification: "OPEX",
      amount: "",
      expense_date: new Date().toISOString().split("T")[0],
      reference_no: "",
      tax_invoice_no: "",
      tax_invoice_date: "",
      vat_amount: "",
      wht_rate: "3",
      wht_amount: "",
      net_amount: "",
      is_service: false,
      notes: "",
      receipt_url: "",
      receipt_file_name: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) {
      setStatus({ type: "error", message: "กรุณากรอกหัวข้อและจำนวนเงินให้ครบถ้วน" });
      return;
    }

    startTransition(async () => {
      // Calculate WHT
      const amount = parseFloat(form.amount) || 0;
      const vatAmount = parseFloat(form.vat_amount) || 0;
      const netAmount = amount - vatAmount; // Amount before VAT
      const whtRate = parseFloat(form.wht_rate) || 0;
      const whtAmount = form.is_service ? (netAmount * whtRate / 100) : 0;
      
      const res = await createExpense({
        contact_id: form.contact_id ? parseInt(form.contact_id, 10) : undefined,
        title: form.title,
        category: form.category,
        classification: form.classification,
        amount: amount,
        expense_date: form.expense_date,
        reference_no: form.reference_no || undefined,
        tax_invoice_no: form.tax_invoice_no || undefined,
        tax_invoice_date: form.tax_invoice_date || undefined,
        vat_amount: vatAmount,
        wht_rate: whtRate,
        wht_amount: whtAmount,
        net_amount: netAmount,
        is_service: form.is_service,
        notes: form.notes || undefined,
        receipt_url: form.receipt_url || undefined,
        receipt_file_name: form.receipt_file_name || undefined,
      });

      if (res.success) {
        setStatus({ type: "success", message: "บันทึกค่าใช้จ่ายเรียบร้อยแล้ว" });
        resetForm();
        setShowForm(false);
        fetchData();
        setTimeout(() => setStatus({ type: null, message: "" }), 3000);
      } else {
        setStatus({ type: "error", message: res.error || "เกิดข้อผิดพลาด" });
      }
    });
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`ลบรายการ "${title}" ?`)) return;
    startTransition(async () => {
      await deleteExpense(id);
      fetchData();
    });
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-violet-600"
            >
              <ArrowLeft size={16} /> กลับหน้าหลัก
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
              <span className="rounded-2xl bg-rose-500 p-3 shadow-lg shadow-rose-200">
                <Wallet className="h-6 w-6 text-white" />
              </span>
              ค่าใช้จ่ายองค์กร (Expenses)
            </h1>
            <p className="ml-1 mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              Module 12 - Professional Expense Tracking
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex h-12 items-center gap-2 rounded-xl bg-rose-500 px-6 text-sm font-black text-white shadow-xl shadow-rose-200 transition-all hover:-translate-y-0.5 hover:bg-rose-600 active:scale-95"
          >
            <Plus size={18} /> บันทึกค่าใช้จ่าย
          </button>
        </div>

        {status.type ? (
          <div
            className={`animate-in fade-in flex items-center gap-3 rounded-xl border-2 p-4 ${
              status.type === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-red-100 bg-red-50 text-red-700"
            }`}
          >
            {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-bold">{status.message}</span>
          </div>
        ) : null}

        {showForm ? (
          <div className="animate-in slide-in-from-top-4 overflow-hidden rounded-3xl border border-rose-50 bg-white shadow-xl">
            <div className="border-b border-rose-100 bg-rose-50 px-8 py-4">
              <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-rose-700">
                <FileText size={16} /> เพิ่มค่าใช้จ่ายแบบมืออาชีพ
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <User size={10} /> Vendor
                </label>
                <select
                  value={form.contact_id}
                  onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
                  className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                >
                  <option value="">เลือกผู้ขาย / Supplier</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                      {vendor.tax_id ? ` (${vendor.tax_id})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  หัวข้อค่าใช้จ่าย *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น ค่าซื้ออะไหล่, ค่าเช่าออฟฟิศ, ซื้อคอมพิวเตอร์"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-50"
                />
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Tag size={10} /> หมวดหมู่
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Classification
                </label>
                <select
                  value={form.classification}
                  onChange={(e) => setForm({ ...form, classification: e.target.value })}
                  className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                >
                  {EXPENSE_CLASSIFICATIONS.map((classification) => (
                    <option key={classification} value={classification}>
                      {classification}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 text-rose-500">
                  <Wallet size={10} /> จำนวนเงินรวม VAT (บาท) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => {
                    const amount = parseFloat(e.target.value) || 0;
                    const vatAmount = (amount * 7 / 107).toFixed(2); // VAT 7% included
                    setForm({ ...form, amount: e.target.value, vat_amount: vatAmount });
                  }}
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-right text-sm font-semibold outline-none focus:border-rose-400"
                />
                <p className="text-[10px] text-slate-400">ระบบคำนวณ VAT 7% ให้อัตโนมัติ</p>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Calendar size={10} /> วันที่
                </label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  เลขอ้างอิง
                </label>
                <input
                  type="text"
                  value={form.reference_no}
                  onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                  placeholder="เช่น INV-001, BILL-APR-01"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  เลขที่ใบภาษีซื้อ
                </label>
                <input
                  type="text"
                  value={form.tax_invoice_no}
                  onChange={(e) => setForm({ ...form, tax_invoice_no: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  วันที่ใบภาษีซื้อ
                </label>
                <input
                  type="date"
                  value={form.tax_invoice_date}
                  onChange={(e) => setForm({ ...form, tax_invoice_date: e.target.value })}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  VAT
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.vat_amount}
                  onChange={(e) => setForm({ ...form, vat_amount: e.target.value })}
                  placeholder="0.00"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-right text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              {/* WHT Section */}
              <div className="space-y-3 md:col-span-2 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_service}
                    onChange={(e) => setForm({ ...form, is_service: e.target.checked })}
                    className="w-5 h-5 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-sm font-bold text-violet-700">
                    เป็นงานบริการ (ต้องหัก ณ ที่จ่าย 3%)
                  </span>
                </label>
                
                {form.is_service && (
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                        WHT Rate (%)
                      </label>
                      <select
                        value={form.wht_rate}
                        onChange={(e) => setForm({ ...form, wht_rate: e.target.value })}
                        className="h-11 w-full rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold outline-none focus:border-violet-400"
                      >
                        <option value="3">3%</option>
                        <option value="5">5%</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                        ยอดก่อน VAT (Base)
                      </label>
                      <div className="h-11 w-full rounded-xl border border-violet-200 bg-white px-4 text-right text-sm font-semibold flex items-center justify-end text-violet-700">
                        ฿{(parseFloat(form.amount || '0') - parseFloat(form.vat_amount || '0')).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                        WHT หัก (3%)
                      </label>
                      <div className="h-11 w-full rounded-xl border border-violet-200 bg-violet-100 px-4 text-right text-sm font-bold flex items-center justify-end text-violet-700">
                        ฿{((parseFloat(form.amount || '0') - parseFloat(form.vat_amount || '0')) * parseFloat(form.wht_rate || '3') / 100).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="บันทึกรายละเอียดค่าใช้จ่ายเพิ่มเติม"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <Paperclip size={12} /> File Upload
                </label>
                <GoogleDrivePicker
                  value={form.receipt_url}
                  onChange={(url, name) => setForm({ ...form, receipt_url: url, receipt_file_name: name })}
                  onClear={() => setForm({ ...form, receipt_url: "", receipt_file_name: "" })}
                />
                {form.receipt_file_name ? (
                  <p className="text-xs font-semibold text-slate-500">Attached: {form.receipt_file_name}</p>
                ) : null}
              </div>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex h-11 items-center gap-2 rounded-xl bg-rose-500 px-8 text-sm font-black text-white shadow-lg shadow-rose-100 transition-all disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  บันทึกค่าใช้จ่าย
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-11 rounded-xl bg-slate-100 px-6 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 p-8 text-white shadow-2xl shadow-rose-200">
            <div className="mb-6 flex items-center justify-between">
              <button onClick={prevMonth} className="rounded-xl bg-white/20 p-2 transition-all hover:bg-white/30">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest opacity-70">{year}</p>
                <h2 className="text-2xl font-black">{THAI_MONTHS[month]}</h2>
              </div>
              <button onClick={nextMonth} className="rounded-xl bg-white/20 p-2 transition-all hover:bg-white/30">
                <ChevronRight size={18} />
              </button>
            </div>

            <div>
              <p className="mb-1 text-xs font-black uppercase tracking-widest opacity-60">ค่าใช้จ่ายรวมเดือนนี้</p>
              <p className="text-4xl font-black tabular-nums">฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              <p className="mt-2 text-xs opacity-60">{expenses.length} รายการ</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm lg:col-span-2">
            <h3 className="mb-6 flex items-center gap-2 text-sm font-black text-slate-700">
              <PieChart size={16} className="text-rose-500" /> แยกตามหมวดหมู่
            </h3>
            {summary.length > 0 ? (
              <div className="space-y-3">
                {summary.map((item: any) => {
                  const pct = totalExpense > 0 ? (Number(item.total) / totalExpense) * 100 : 0;
                  const colorClass = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["อื่นๆ"];
                  return (
                    <div key={item.category} className="flex items-center gap-4">
                      <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-black ${colorClass}`}>
                        {item.category}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-50">
                        <div className="h-full rounded-full bg-rose-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-28 shrink-0 text-right text-sm font-black tabular-nums text-slate-700">
                        ฿{Number(item.total).toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                      </span>
                      <span className="w-10 text-right text-[10px] font-bold text-slate-400">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 text-sm font-bold text-slate-300">
                ยังไม่มีข้อมูลค่าใช้จ่ายในเดือนนี้
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 px-8 py-5">
            <h3 className="text-sm font-black text-slate-700">
              รายการค่าใช้จ่าย - {THAI_MONTHS[month]} {year}
            </h3>
            <Link href="/reports/profit-loss" className="text-[10px] font-black uppercase tracking-widest text-violet-600 hover:underline">
              ดู P&amp;L Report →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 p-20 text-slate-300">
              <Loader2 size={24} className="animate-spin" /> กำลังโหลด...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">วันที่</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">หัวข้อ</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">หมวดหมู่</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Vendor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">อ้างอิง</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ใบภาษีซื้อ</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Attachment</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">VAT</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">จำนวนเงิน</th>
                    <th className="w-16 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length > 0 ? (
                    expenses.map((expense: any) => (
                      <tr key={expense.id} className="group transition-all hover:bg-rose-50/10">
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(expense.expense_date).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-semibold text-slate-800">{expense.title}</span>
                            {expense.notes ? <p className="mt-0.5 text-[10px] text-slate-400">{expense.notes}</p> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block rounded-lg border px-2.5 py-1 text-[10px] font-black ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS["อื่นๆ"]}`}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          <div>
                            <p className="font-semibold text-slate-700">{expense.vendor_name || "—"}</p>
                            {expense.vendor_tax_id ? <p className="text-[10px] text-slate-400">{expense.vendor_tax_id}</p> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-black uppercase text-violet-700">
                            {expense.classification || "OPEX"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">{expense.reference_no || "—"}</td>
                        <td className="px-6 py-4">
                          {expense.tax_invoice_no ? (
                            <div className="text-xs text-slate-500">
                              <p className="font-mono text-slate-700">{expense.tax_invoice_no}</p>
                              <p>
                                {expense.tax_invoice_date
                                  ? new Date(expense.tax_invoice_date).toLocaleDateString("th-TH", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "รอระบุวันที่"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {expense.receipt_url ? (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                            >
                              <FolderOpen size={12} /> {expense.receipt_file_name || "Open file"}
                            </a>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold tabular-nums text-sky-600">
                            ฿{Number(expense.vat_amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold tabular-nums text-rose-600">
                            ฿{Number(expense.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                          {Number(expense.wht_amount || 0) > 0 && (
                            <Link
                              href={`/expenses/${expense.id}/wht53`}
                              className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"
                              title="ใบหัก ณ ที่จ่าย (ภ.ง.ด. 53)"
                            >
                              <FileBadge size={14} />
                            </Link>
                          )}
                          <Link
                            href={`/vouchers/new?expenseId=${expense.id}&amount=${expense.amount}&payee=${encodeURIComponent(expense.vendor_name || '')}&contactId=${expense.contact_id || ''}`}
                            className="rounded-lg p-2 text-slate-300 opacity-0 transition-all hover:bg-emerald-50 hover:text-emerald-600 group-hover:opacity-100"
                            title="จ่ายเงิน (Pay Bill)"
                          >
                            <Banknote size={14} />
                          </Link>
                          <button
                            onClick={() => handleDelete(expense.id, expense.title)}
                            className="rounded-lg p-2 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
                            <Wallet size={24} className="text-rose-200" />
                          </div>
                          <p className="font-bold text-slate-400">ยังไม่มีรายการค่าใช้จ่ายในเดือนนี้</p>
                          <button onClick={() => setShowForm(true)} className="text-xs font-black uppercase tracking-widest text-rose-500 hover:underline">
                            + บันทึกรายการแรก
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {expenses.length > 0 ? (
                  <tfoot>
                    <tr className="border-t border-rose-100 bg-rose-50/30">
                      <td colSpan={9} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-500">
                        รวมทั้งหมด {expenses.length} รายการ
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-black tabular-nums text-rose-600">
                          ฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          )}
        </div>

        <div className="py-8 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
            Module 12 - Expense Management - Micro-Account 2026
          </p>
        </div>
      </div>
    </main>
  );
}
