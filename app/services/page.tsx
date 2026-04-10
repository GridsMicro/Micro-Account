"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Trash2, Save, Pencil, X } from "lucide-react";
import { createService, deleteService, getServices, updateService } from "@/app/actions";

type ServiceItem = {
  id: number;
  service_code: string;
  name: string;
  description: string | null;
  service_type: string;
  unit_price: number;
  is_wht_applicable: boolean;
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingSaving, setEditingSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    service_code: "",
    name: "",
    description: "",
    service_type: "service",
    unit_price: 0,
    is_wht_applicable: true,
  });
  const [form, setForm] = useState({
    service_code: "",
    name: "",
    description: "",
    service_type: "service",
    unit_price: 0,
    is_wht_applicable: true,
  });

  const loadServices = async () => {
    setLoading(true);
    const res = await getServices();
    setServices((res.success ? res.data : []) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadServices();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await createService(form);
    setSaving(false);
    if (!res.success) {
      alert(res.error || "สร้างรายการไม่สำเร็จ");
      return;
    }
    setForm({
      service_code: "",
      name: "",
      description: "",
      service_type: "service",
      unit_price: 0,
      is_wht_applicable: true,
    });
    await loadServices();
  };

  const onDelete = async (id: number, name: string) => {
    if (!confirm(`ยืนยันการลบรายการ "${name}" ?`)) return;
    const res = await deleteService(id);
    if (!res.success) {
      alert(res.error || "ลบรายการไม่สำเร็จ");
      return;
    }
    await loadServices();
  };

  const onStartEdit = (item: ServiceItem) => {
    setEditingId(item.id);
    setEditForm({
      service_code: item.service_code,
      name: item.name,
      description: item.description || "",
      service_type: item.service_type || "service",
      unit_price: Number(item.unit_price || 0),
      is_wht_applicable: !!item.is_wht_applicable,
    });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setEditingSaving(false);
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    setEditingSaving(true);
    const res = await updateService(editingId, editForm);
    setEditingSaving(false);
    if (!res.success) {
      alert(res.error || "อัปเดตรายการไม่สำเร็จ");
      return;
    }
    setEditingId(null);
    await loadServices();
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Briefcase className="text-indigo-600" /> ราคากลางบริการ
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            จัดการรายการบริการมาตรฐานสำหรับเสนอราคาและออกเอกสาร
          </p>
        </div>

        <form onSubmit={onCreate} className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold"
            placeholder="Service Code"
            value={form.service_code}
            onChange={(e) => setForm({ ...form, service_code: e.target.value })}
            required
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold md:col-span-2"
            placeholder="ชื่อบริการ"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm"
            placeholder="ประเภท"
            value={form.service_type}
            onChange={(e) => setForm({ ...form, service_type: e.target.value })}
          />
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm"
            placeholder="ราคา"
            type="number"
            step="0.01"
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value || 0) })}
          />
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Save size={16} /> : <Plus size={16} />} เพิ่มรายการ
          </button>
          <input
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm md:col-span-5"
            placeholder="คำอธิบาย"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <label className="h-11 px-3 rounded-xl border border-slate-200 text-xs font-bold flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_wht_applicable}
              onChange={(e) => setForm({ ...form, is_wht_applicable: e.target.checked })}
            />
            ใช้ WHT อัตโนมัติ
          </label>
        </form>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
          {loading ? (
            <div className="text-sm font-bold text-slate-500">กำลังโหลด...</div>
          ) : services.length === 0 ? (
            <div className="text-sm font-bold text-slate-400">ยังไม่มีรายการบริการ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-slate-100">
                    <th className="py-3">Code</th>
                    <th className="py-3">ชื่อบริการ</th>
                    <th className="py-3">ประเภท</th>
                    <th className="py-3 text-right">ราคา</th>
                    <th className="py-3 text-center">WHT</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3 font-bold text-slate-700">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-bold w-full"
                            value={editForm.service_code}
                            onChange={(e) => setEditForm({ ...editForm, service_code: e.target.value })}
                          />
                        ) : (
                          item.service_code
                        )}
                      </td>
                      <td className="py-3">
                        {editingId === item.id ? (
                          <div className="space-y-2">
                            <input
                              className="h-9 px-3 rounded-lg border border-slate-200 text-sm font-bold w-full"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                            <input
                              className="h-9 px-3 rounded-lg border border-slate-200 text-xs w-full"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-xs text-slate-400">{item.description || "-"}</div>
                          </>
                        )}
                      </td>
                      <td className="py-3 text-sm text-slate-600">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm w-full"
                            value={editForm.service_type}
                            onChange={(e) => setEditForm({ ...editForm, service_type: e.target.value })}
                          />
                        ) : (
                          item.service_type
                        )}
                      </td>
                      <td className="py-3 text-right text-sm font-bold text-slate-800">
                        {editingId === item.id ? (
                          <input
                            className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-right w-32 ml-auto"
                            type="number"
                            step="0.01"
                            value={editForm.unit_price}
                            onChange={(e) => setEditForm({ ...editForm, unit_price: Number(e.target.value || 0) })}
                          />
                        ) : (
                          Number(item.unit_price || 0).toLocaleString()
                        )}
                      </td>
                      <td className="py-3 text-center text-xs font-bold">
                        {editingId === item.id ? (
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editForm.is_wht_applicable}
                              onChange={(e) => setEditForm({ ...editForm, is_wht_applicable: e.target.checked })}
                            />
                            WHT
                          </label>
                        ) : (
                          item.is_wht_applicable ? "YES" : "NO"
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
                              onClick={() => onDelete(item.id, item.name)}
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

