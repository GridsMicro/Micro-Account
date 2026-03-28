
"use client";

import { Download, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { exportPP30ToTxt, exportPND53ToTxt, batchSubmitToRDPortal } from "@/app/actions";
import { useState } from "react";

interface TaxExportButtonProps {
  id: string;
}

export default function TaxExportButton({ id }: TaxExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [rdSubmitting, setRDSubmitting] = useState(false);

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

  const handleRDSubmit = async () => {
    if (!confirm("ต้องการส่งข้อมูลไปยังกรมสรรพากรผ่าน RD API ใช่หรือไม่?")) {
      return;
    }

    setRDSubmitting(true);
    try {
      // For demo purposes, we'll submit sample documents
      // In real implementation, you'd get actual document IDs from the database
      const sampleIds = ["1", "2", "3"]; // Replace with actual IDs

      const type = id === "pp30" ? "invoice" : "wht";
      const result = await batchSubmitToRDPortal(sampleIds, type);

      if (result.success && "summary" in result) {
        alert(`✅ ส่งสำเร็จ ${result.summary.successful}/${result.summary.total} เอกสาร`);
      } else {
        const errorMessage = "results" in result
          ? result.results.find((r: { id: string; result: { success: boolean; error?: string } }) => !r.result.success)?.result.error
          : result.error;
        alert(`❌ ส่งไม่สำเร็จ: ${errorMessage || "Unknown error"}`);
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาดในการส่ง: " + err.message);
    } finally {
      setRDSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full h-10 bg-white border border-green-500 text-green-600 font-bold rounded flex items-center justify-center gap-2 hover:bg-green-50 transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        {loading ? (
          <Clock size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {loading ? "กำลังส่งออก..." : "ส่งออกไฟล์"}
      </button>

      {/* RD API Submit Button */}
      <button
        onClick={handleRDSubmit}
        disabled={rdSubmitting}
        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        {rdSubmitting ? (
          <Clock size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {rdSubmitting ? "กำลังส่ง..." : "ส่ง RD API"}
      </button>
    </div>
  );
}
