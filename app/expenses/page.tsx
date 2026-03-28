"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  TrendingDown,
  Wallet,
  Calendar,
  Tag,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PieChart,
} from "lucide-react";
import {
  getExpenses,
  createExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
} from "@/app/expense-actions";

const THAI_MONTHS = [
  "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
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
  const [summary, setSummary] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  const [form, setForm] = useState({
    title: "",
    category: "อื่นๆ",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    reference_no: "",
    notes: "",
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

  useEffect(() => { fetchData(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || parseFloat(form.amount) <= 0) {
      setStatus({ type: "error", message: "กรุณากรอกหัวข้อและจำนวนเงินให้ครบถ้วน" });
      return;
    }
    startTransition(async () => {
      const res = await createExpense({
        title: form.title,
        category: form.category,
        amount: parseFloat(form.amount),
        expense_date: form.expense_date,
        reference_no: form.reference_no || undefined,
        notes: form.notes || undefined,
      });
      if (res.success) {
        setStatus({ type: "success", message: "บันทึกค่าใช้จ่ายเรียบร้อยแล้ว!" });
        setForm({ title: "", category: "อื่นๆ", amount: "", expense_date: new Date().toISOString().split("T")[0], reference_no: "", notes: "" });
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
    <main className="p-6 md:p-10 min-h-screen bg-[#f8f5ff]">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-slate-400 hover:text-violet-600 flex items-center gap-2 text-sm font-bold mb-2 transition-colors">
              <ArrowLeft size={16} /> กลับหน้าหลัก
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-200">
                <Wallet className="text-white w-6 h-6" />
              </span>
              ค่าใช้จ่ายองค์กร (Expenses)
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1 mt-1">Module 12 — Cost Management</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="h-12 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl flex items-center gap-2 shadow-xl shadow-rose-200 transition-all hover:-translate-y-0.5 active:scale-95 text-sm"
          >
            <Plus size={18} /> บันทึกค่าใช้จ่าย
          </button>
        </div>

        {/* Status */}
        {status.type && (
          <div className={`p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in ${status.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"}`}>
            {status.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold text-sm">{status.message}</span>
          </div>
        )}

        {/* Add Expense Form */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-xl border border-rose-50 overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="bg-rose-50 px-8 py-4 border-b border-rose-100">
              <h3 className="font-black text-rose-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                <FileText size={16} /> บันทึกค่าใช้จ่ายใหม่
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หัวข้อค่าใช้จ่าย *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ค่าเช่าออฟฟิศ เดือนมีนาคม"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-50 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Tag size={10} /> หมวดหมู่</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-rose-400 cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  className="w-full h-11 px-4 bg-rose-50/30 border border-rose-100 rounded-xl text-sm font-bold outline-none focus:border-rose-400 text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={10} /> วันที่</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={e => setForm({ ...form, expense_date: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">เลขอ้างอิง (ถ้ามี)</label>
                <input
                  type="text"
                  placeholder="เช่น INV-001, OR-202603"
                  value={form.reference_no}
                  onChange={e => setForm({ ...form, reference_no: e.target.value })}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-rose-400"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">หมายเหตุ</label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-rose-400 resize-none"
                />
              </div>

              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-8 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl flex items-center gap-2 shadow-lg shadow-rose-100 transition-all disabled:opacity-50 text-sm"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  บันทึกค่าใช้จ่าย
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="h-11 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-all">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Month Navigation + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Month Nav + Total */}
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-8 rounded-3xl shadow-2xl shadow-rose-200 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-black opacity-70 uppercase tracking-widest">{year}</p>
                <h2 className="text-2xl font-black">{THAI_MONTHS[month]}</h2>
              </div>
              <button onClick={nextMonth} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
                <ChevronRight size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs font-black opacity-60 uppercase tracking-widest mb-1">ค่าใช้จ่ายรวมเดือนนี้</p>
              <p className="text-4xl font-black tabular-nums">฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              <p className="text-xs opacity-60 mt-2">{expenses.length} รายการ</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-sm font-black text-slate-700 flex items-center gap-2 mb-6">
              <PieChart size={16} className="text-rose-500" /> แยกตามหมวดหมู่
            </h3>
            {summary.length > 0 ? (
              <div className="space-y-3">
                {summary.map((s: any) => {
                  const pct = totalExpense > 0 ? (Number(s.total) / totalExpense) * 100 : 0;
                  const colorClass = CATEGORY_COLORS[s.category] || CATEGORY_COLORS["อื่นๆ"];
                  return (
                    <div key={s.category} className="flex items-center gap-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg border shrink-0 ${colorClass}`}>
                        {s.category}
                      </span>
                      <div className="flex-1 bg-slate-50 rounded-full h-2 overflow-hidden">
                        <div className="bg-rose-400 h-full rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-black text-slate-700 tabular-nums shrink-0 w-28 text-right">
                        ฿{Number(s.total).toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 font-bold text-sm">
                ยังไม่มีข้อมูลค่าใช้จ่ายในเดือนนี้
              </div>
            )}
          </div>
        </div>

        {/* Expense List Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-700 text-sm">รายการค่าใช้จ่าย — {THAI_MONTHS[month]} {year}</h3>
            <Link href="/reports/profit-loss" className="text-[10px] font-black text-violet-600 hover:underline uppercase tracking-widest">
              ดู P&L Report →
            </Link>
          </div>

          {loading ? (
            <div className="p-20 flex items-center justify-center gap-3 text-slate-300">
              <Loader2 size={24} className="animate-spin" /> กำลังโหลด...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">วันที่</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">หัวข้อ</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">หมวดหมู่</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">อ้างอิง</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.length > 0 ? expenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-rose-50/10 transition-all group">
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">
                          {new Date(exp.expense_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-semibold text-slate-800">{exp.title}</span>
                          {exp.notes && <p className="text-[10px] text-slate-400 mt-0.5">{exp.notes}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[10px] font-black px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[exp.category] || CATEGORY_COLORS["อื่นๆ"]}`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400 font-mono">{exp.reference_no || "—"}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-rose-600 tabular-nums">
                          ฿{Number(exp.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(exp.id, exp.title)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center">
                            <Wallet size={24} className="text-rose-200" />
                          </div>
                          <p className="text-slate-400 font-bold">ยังไม่มีรายการค่าใช้จ่ายในเดือนนี้</p>
                          <button onClick={() => setShowForm(true)} className="text-rose-500 font-black hover:underline text-xs uppercase tracking-widest">
                            + บันทึกรายการแรก
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                {expenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-rose-50/30 border-t border-rose-100">
                      <td colSpan={4} className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">รวมทั้งหมด {expenses.length} รายการ</td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-black text-rose-600 tabular-nums">
                          ฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        <div className="text-center py-8 opacity-30">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Module 12 — Expense Management • Micro-Account 2026</p>
        </div>
      </div>
    </main>
  );
}
