"use client";

import { useState } from "react";
import { FileSpreadsheet, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { exportJournalsToSheets } from "@/app/actions";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccessUrl(null);
    
    try {
      const res = await exportJournalsToSheets();
      if (res.success && res.url) {
        setSuccessUrl(res.url);
        // พยายามเปิดอัตโนมัติ
        window.open(res.url, "_blank");
      } else {
        setError(res.error || "ไม่ทราบสาเหตุแน่ชัด");
      }
    } catch (err: any) {
      setError("ระบบขัดข้อง: " + (err.message || "Unknown Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button 
        onClick={handleExport}
        disabled={loading}
        className={`h-11 px-6 bg-white border-2 border-green-100 text-gray-700 font-black rounded-xl flex items-center gap-2 transition-all shadow-sm text-sm hover:bg-green-50 hover:border-green-500 hover:text-green-700 active:scale-95 ${loading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <FileSpreadsheet size={18} className="text-green-600" /> 
        )}
        {loading ? "กำลังสื่อสารกับ Google..." : "Export Google Sheets"}
      </button>

      {/* แจ้งเตือนเมื่อสำเร็จ */}
      {successUrl && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-green-600 shrink-0" />
          <div className="flex flex-col">
            <p className="text-[11px] font-bold text-green-800">สร้างรายงานสำเร็จ!</p>
            <a 
              href={successUrl} 
              target="_blank" 
              className="text-xs text-blue-600 underline font-black flex items-center gap-1 hover:text-blue-800"
            >
              คลิกเพื่อเปิดไฟล์รายงานที่นี่ <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}

      {/* แจ้งเตือนเมื่อผิดพลาด */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3 max-w-xs animate-in shake-1">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider">เกิดปัญหาตอนดึงข้อมูล</p>
            <p className="text-[10px] text-red-600 font-medium leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
