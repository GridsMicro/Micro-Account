"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { ShieldCheck, Bot, X, CheckCircle, RefreshCw, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiAlert {
  id: number;
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  detail: string;
  recommendation?: string;
  reference_label?: string;
  created_at: string;
}

const SEVERITY_STYLE: Record<string, { icon: any; bg: string; text: string; border: string }> = {
  critical: { icon: AlertOctagon, bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  info: { icon: Info, bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
};

function AlertCard({ alert, onResolve, compact }: { alert: AiAlert; onResolve: (id: number) => void; compact?: boolean }) {
  const s = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.info;
  const Icon = s.icon;
  return (
    <div className={cn("rounded-2xl border p-4 text-left", s.bg, s.border, compact ? "space-y-2" : "space-y-3")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", s.text)} />
          <span className={cn("text-xs font-black", s.text)}>{alert.title}</span>
        </div>
        <button
          onClick={() => onResolve(alert.id)}
          className="p-1.5 rounded-lg hover:bg-white/70 text-slate-400 hover:text-emerald-600 transition-all"
          title="ทำเครื่องหมายว่าแก้ไขแล้ว"
        >
          <CheckCircle size={16} />
        </button>
      </div>
      <p className="text-xs text-slate-600 font-medium leading-relaxed">{alert.detail}</p>
      {alert.recommendation && !compact && (
        <div className="bg-white/70 rounded-xl p-3 border border-white/60">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">💡 คำแนะนำจาก AI</p>
          <p className="text-[11px] text-slate-700 font-medium leading-relaxed whitespace-pre-line">{alert.recommendation}</p>
        </div>
      )}
      {alert.reference_label && (
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{alert.reference_label}</span>
      )}
    </div>
  );
}

export default function AiAdvisorWidget({ compact = false }: { compact?: boolean }) {
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/ai/audit");
      setAlerts(res.data.alerts || []);
    } catch (err) {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setRunning(true);
    try {
      await axios.post("/api/ai/audit", {});
      await load();
    } catch (err) {
      // ignore
    } finally {
      setRunning(false);
    }
  };

  const resolve = async (id: number) => {
    try {
      await axios.post("/api/ai/audit", { action: "resolve", alertId: id });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    load();
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  return (
    <div className={cn("bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100", compact ? "lg:col-span-2" : "")}>
      <div className="flex items-center justify-between mb-6 text-left">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
          <ShieldCheck className="text-indigo-600 w-5 h-5" />
          AI ผู้ตรวจสอบบัญชี (Auditor)
        </h3>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black rounded-full">{criticalCount} จุดวิกฤต</span>
          )}
          <button
            onClick={runAudit}
            disabled={running}
            className="h-9 px-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <RefreshCw size={13} className={running ? "animate-spin" : ""} />
            {running ? "กำลังตรวจ..." : "ตรวจใหม่"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Bot className="w-8 h-8 text-slate-300 mx-auto animate-pulse mb-3" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">กำลังดึงข้อมูลการตรวจสอบ...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
          </div>
          <p className="text-sm font-black text-slate-700">ไม่พบความผิดปกติทางบัญชี</p>
          <p className="text-[10px] font-bold text-slate-400 mt-2">AI ตรวจสอบทุกอย่างเรียบร้อย ✅</p>
        </div>
      ) : (
        <div className={cn("grid gap-4", compact ? "lg:grid-cols-2" : "grid-cols-1")}>
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onResolve={resolve} compact={compact} />
          ))}
        </div>
      )}
    </div>
  );
}
