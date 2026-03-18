
"use client";

import { Download } from "lucide-react";
import { exportPP30ToTxt, exportPND53ToTxt } from "@/app/actions";
import { useState } from "react";

interface TaxExportButtonProps {
  id: string;
}

export default function TaxExportButton({ id }: TaxExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      let res;
      if (id === "pp30") {
        res = await exportPP30ToTxt(month, year);
      } else if (id === "pnd53") {
        res = await exportPND53ToTxt(month, year);
      } else {
        alert("ยังไม่รองรับการ Export สำหรับฟิลด์นี้ในขณะนี้");
        setLoading(false);
        return;
      }

      if (res.success && res.data && res.filename) {
        // สร้าง Link สำหรับดาวน์โหลด
        const link = document.createElement("a");
        link.href = `data:text/plain;base64,${res.data}`;
        link.download = res.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("ไม่พบข้อมูลสำหรับการส่งออกในเดือนนี้: " + (res.error || "No data"));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      disabled={loading}
      className="w-full h-10 bg-white border border-gray-300 text-gray-700 font-bold rounded flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
    >
      <Download size={16} /> 
      {loading ? "กำลังเตรียมไฟล์..." : "โหลดไฟล์ยื่นแบบ (.txt)"}
    </button>
  );
}
