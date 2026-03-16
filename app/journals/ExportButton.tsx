"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { exportJournalsToSheets } from "@/app/actions";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await exportJournalsToSheets();
      if (res.success && res.url) {
        window.open(res.url, "_blank");
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (err) {
      alert("ไม่สามารถส่งออกข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className={`h-11 px-6 bg-white border border-gray-300 text-gray-700 font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm hover:bg-gray-50 ${loading ? 'opacity-50 cursor-wait' : ''}`}
    >
      <FileSpreadsheet size={18} className="text-green-600" /> 
      {loading ? "กำลังสร้างไฟล์..." : "Export Google Sheets"}
    </button>
  );
}
