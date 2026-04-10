"use client";

import { useEffect, useMemo, useState } from "react";
import { Save, Settings2 } from "lucide-react";

type RegistryModule = {
  id: string;
  label: string;
  category: string;
  route?: string;
  requiresAdmin?: boolean;
};

const categoryOrder = [
  "admin",
  "finance_accounting",
  "finance_tax",
  "stock",
  "hr",
  "sales_co",
  "service",
];

export default function AdminModulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registry, setRegistry] = useState<RegistryModule[]>([]);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/modules");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
      setRegistry(data.moduleRegistry || []);
      setOverrides(data.overrides || {});
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, RegistryModule[]> = {};
    for (const mod of registry) {
      if (!map[mod.category]) map[mod.category] = [];
      map[mod.category].push(mod);
    }
    return map;
  }, [registry]);

  const getValue = (moduleId: string) => {
    if (typeof overrides[moduleId] === "boolean") return overrides[moduleId];
    return true;
  };

  const setValue = (moduleId: string, value: boolean) => {
    setOverrides((prev) => ({ ...prev, [moduleId]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "บันทึกไม่สำเร็จ");
      alert("บันทึกการตั้งค่าโมดูลเรียบร้อยแล้ว");
      await load();
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Settings2 className="text-indigo-600" /> จัดการโมดูลระบบ
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              เปิด/ปิดเมนูและโมดูลตามโครงองค์กร โดยไม่ต้องแก้โค้ดหลายจุด
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={saving || loading}
            className="h-11 px-6 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 text-sm font-bold text-slate-500">กำลังโหลด...</div>
        ) : (
          categoryOrder.map((category) => {
            const mods = grouped[category] || [];
            if (mods.length === 0) return null;
            return (
              <div key={category} className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">{category}</h2>
                <div className="space-y-3">
                  {mods.map((mod) => (
                    <label key={mod.id} className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3">
                      <div>
                        <div className="font-bold text-slate-800">{mod.label}</div>
                        <div className="text-xs text-slate-400">{mod.route || "-"}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={getValue(mod.id)}
                        onChange={(e) => setValue(mod.id, e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}

