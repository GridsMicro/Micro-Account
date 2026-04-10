"use client";

import { useEffect, useState } from "react";
import { Banknote, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type PayrollEntry = {
  id: number;
  employee_code: string | null;
  employee_name: string;
  payroll_month: string;
  gross_amount: number;
  tax_withheld: number;
  net_amount: number;
  currency: string;
  source_system: string;
  external_ref: string | null;
  created_at: string;
};

export default function PayrollPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({
    employee_code: "",
    employee_name: "",
    payroll_month: new Date().toISOString().slice(0, 7),
    gross_amount: 0,
    tax_withheld: 0,
    source_system: "manual",
    external_ref: "",
  });
  const [editForm, setEditForm] = useState({
    employee_code: "",
    employee_name: "",
    payroll_month: new Date().toISOString().slice(0, 7),
    gross_amount: 0,
    tax_withheld: 0,
    source_system: "manual",
    external_ref: "",
  });

  const loadEntries = async (selectedMonth?: string) => {
    setLoading(true);
    setLoadError("");
    try {
      const targetMonth = selectedMonth ?? month;
      const res = await fetch(`/api/payroll?month=${encodeURIComponent(targetMonth)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
      setEntries(Array.isArray(data?.payroll) ? data.payroll : []);
    } catch (error: any) {
      setLoadError(error?.message || "เกิดข้อผิดพลาด");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setCreateError("");
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "สร้างรายการไม่สำเร็จ");
      setForm({
        employee_code: "",
        employee_name: "",
        payroll_month: month,
        gross_amount: 0,
        tax_withheld: 0,
        source_system: "manual",
        external_ref: "",
      });
      await loadEntries();
    } catch (error: any) {
      setCreateError(error?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const onStartEdit = (item: PayrollEntry) => {
    setEditingId(item.id);
    setEditForm({
      employee_code: item.employee_code || "",
      employee_name: item.employee_name || "",
      payroll_month: String(item.payroll_month || "").slice(0, 7),
      gross_amount: Number(item.gross_amount || 0),
      tax_withheld: Number(item.tax_withheld || 0),
      source_system: item.source_system || "manual",
      external_ref: item.external_ref || "",
    });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditingSaving(false);
    setEditError("");
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    setEditingSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/payroll/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "อัปเดตรายการไม่สำเร็จ");
      setEditingId(null);
      await loadEntries(month);
    } catch (error: any) {
      setEditError(error?.message || "เกิดข้อผิดพลาด");
    } finally {
      setEditingSaving(false);
    }
  };

  const onDelete = async (id: number, name: string) => {
    if (!confirm(`ยืนยันการลบรายการของ "${name}" ?`)) return;
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "ลบรายการไม่สำเร็จ");
      await loadEntries(month);
    } catch (error: any) {
      alert(error?.message || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Banknote className="text-indigo-600" /> รายการค่าแรง (HR)
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            จัดการรายการเงินเดือน/ค่าแรง พร้อม API contract สำหรับเชื่อมระบบ HR ภายนอก
          </p>
        </div>

        <form onSubmit={onCreate} className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-7 gap-4">
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold"
            placeholder="Employee Code"
            value={form.employee_code}
            onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold md:col-span-2"
            placeholder="ชื่อพนักงาน"
            value={form.employee_name}
            onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
            required
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm"
            type="month"
            value={form.payroll_month}
            onChange={(e) => setForm({ ...form, payroll_month: e.target.value })}
            required
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm text-right"
            placeholder="Gross"
            type="number"
            step="0.01"
            value={form.gross_amount}
            onChange={(e) => setForm({ ...form, gross_amount: Number(e.target.value || 0) })}
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm text-right"
            placeholder="Tax"
            type="number"
            step="0.01"
            value={form.tax_withheld}
            onChange={(e) => setForm({ ...form, tax_withheld: Number(e.target.value || 0) })}
          />
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Save size={16} /> : <Plus size={16} />} เพิ่มรายการ
          </button>
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm"
            placeholder="Source System"
            value={form.source_system}
            onChange={(e) => setForm({ ...form, source_system: e.target.value })}
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm md:col-span-2"
            placeholder="External Reference"
            value={form.external_ref}
            onChange={(e) => setForm({ ...form, external_ref: e.target.value })}
          />
          {createError && (
            <div className="md:col-span-7 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {createError}
            </div>
          )}
        </form>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-black text-slate-700">Payroll Records</div>
            <div className="flex items-center gap-2">
              <input
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <button
                type="button"
                onClick={() => loadEntries(month)}
                className="h-10 px-4 rounded-lg bg-slate-900 text-white text-xs font-black"
              >
                ค้นหา
              </button>
            </div>
          </div>
          {loadError && (
            <div className="mb-4 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {loadError}
            </div>
          )}
          {editError && (
            <div className="mb-4 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {editError}
            </div>
          )}
          {loading ? (
            <div className="text-sm font-bold text-slate-500">กำลังโหลด...</div>
          ) : entries.length === 0 ? (
            <div className="text-sm font-bold text-slate-400">ยังไม่มีรายการค่าแรงในเดือนนี้</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-slate-100">
                    <th className="py-3">Employee</th>
                    <th className="py-3">Month</th>
                    <th className="py-3 text-right">Gross</th>
                    <th className="py-3 text-right">Tax</th>
                    <th className="py-3 text-right">Net</th>
                    <th className="py-3">Source</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3">
                        {editingId === item.id ? (
                          <div className="space-y-2">
                            <input
                              className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-bold w-full"
                              value={editForm.employee_name}
                              onChange={(e) => setEditForm({ ...editForm, employee_name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className="h-9 px-3 rounded-lg border border-slate-200 text-xs w-full"
                                placeholder="Employee Code"
                                value={editForm.employee_code}
                                onChange={(e) => setEditForm({ ...editForm, employee_code: e.target.value })}
                              />
                              <input
                                className="h-9 px-3 rounded-lg border border-slate-200 text-xs w-full"
                                placeholder="External Ref"
                                value={editForm.external_ref}
                                onChange={(e) => setEditForm({ ...editForm, external_ref: e.target.value })}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-800">{item.employee_name}</div>
                            <div className="text-xs text-slate-400">
                              {item.employee_code || "-"} {item.external_ref ? `| ${item.external_ref}` : ""}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-36"
                            type="month"
                            value={editForm.payroll_month}
                            onChange={(e) => setEditForm({ ...editForm, payroll_month: e.target.value })}
                          />
                        ) : (
                          String(item.payroll_month).slice(0, 10)
                        )}
                      </td>
                      <td className="py-3 text-right text-sm font-bold">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-right w-28 ml-auto"
                            type="number"
                            step="0.01"
                            value={editForm.gross_amount}
                            onChange={(e) => setEditForm({ ...editForm, gross_amount: Number(e.target.value || 0) })}
                          />
                        ) : (
                          Number(item.gross_amount || 0).toLocaleString()
                        )}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-right w-28 ml-auto"
                            type="number"
                            step="0.01"
                            value={editForm.tax_withheld}
                            onChange={(e) => setEditForm({ ...editForm, tax_withheld: Number(e.target.value || 0) })}
                          />
                        ) : (
                          Number(item.tax_withheld || 0).toLocaleString()
                        )}
                      </td>
                      <td className="py-3 text-right text-sm font-bold text-emerald-700">
                        {editingId === item.id
                          ? Number(Math.max(editForm.gross_amount - editForm.tax_withheld, 0)).toLocaleString()
                          : Number(item.net_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-xs font-bold text-slate-600">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-xs w-32"
                            value={editForm.source_system}
                            onChange={(e) => setEditForm({ ...editForm, source_system: e.target.value })}
                          />
                        ) : (
                          item.source_system || "manual"
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {editingId === item.id ? (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={onSaveEdit}
                              disabled={editingSaving}
                              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                              title="บันทึก"
                            >
                              <Save size={15} />
                            </button>
                            <button
                              onClick={onCancelEdit}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                              title="ยกเลิก"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => onStartEdit(item)}
                              className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                              title="แก้ไขรายการ"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => onDelete(item.id, item.employee_name)}
                              className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                              title="ลบรายการ"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

