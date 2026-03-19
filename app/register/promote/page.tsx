"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// We use a small server action for this fix instead
export default function FixAdminPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handlePromote() {
    setStatus("loading");
    try {
      const { promoteUserAction } = await import("../db-init");
      const res = await promoteUserAction("k.net.game01@gmail.com");
      if (res.success) {
        setStatus("success");
        setMsg(res.message);
      } else {
        setStatus("error");
        setMsg(res.error);
      }
    } catch (e: any) {
      setStatus("error");
      setMsg(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-10 text-white shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 border border-blue-500/20">
            <ShieldCheck size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-center mb-2 tracking-tight">Promote Administrator</h1>
        <p className="text-slate-400 text-center text-sm mb-10">อัปเกรดสิทธิ์ผู้ใช้ k.net.game01@gmail.com</p>

        {status === "success" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
             <CheckCircle className="text-emerald-500 mx-auto" size={48} />
             <p className="text-emerald-400 font-bold text-sm">{msg}</p>
             <button onClick={() => window.location.href='/login'} className="w-full h-12 bg-emerald-500 text-white font-black rounded-xl uppercase tracking-widest text-xs">เข้าสู่ระบบได้เลย</button>
          </div>
        ) : (
          <div className="space-y-6">
            {status === "error" && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3 text-rose-400 text-xs">
                <AlertCircle size={16} /> {msg}
              </div>
            )}
            <button 
              onClick={handlePromote}
              disabled={status === "loading"}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40 uppercase tracking-widest text-sm transition-all"
            >
              {status === "loading" ? <Loader2 className="animate-spin" size={20} /> : "ยืนยันการเปลี่ยนสิทธิ์"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
