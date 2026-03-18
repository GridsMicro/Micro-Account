
"use client";

import { CloudSync, ExternalLink, Loader2 } from "lucide-react";
import { exportMonthlySummaryToDrive } from "@/app/actions";
import { useState } from "react";

export default function SyncMonthlyButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);

  const handleSync = async () => {
    setStatus("loading");
    try {
      const res = await exportMonthlySummaryToDrive();
      if (res.success && res.url) {
        setUrl(res.url);
        setStatus("success");
      } else {
        alert("Error: " + res.error);
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={handleSync}
        disabled={status === "loading"}
        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <CloudSync size={20} />
        )}
        {status === "loading" ? "กำลังสรุปข้อมูล..." : "สรุปยอดส่งเข้า Google Drive"}
      </button>

      {status === "success" && url && (
        <a 
          href={url} 
          target="_blank" 
          className="text-[10px] font-black text-emerald-600 flex items-center justify-center gap-1 hover:underline animate-bounce"
        >
          <ExternalLink size={12} /> เปิดรายงานล่าสุด (Google Sheets)
        </a>
      )}
    </div>
  );
}
