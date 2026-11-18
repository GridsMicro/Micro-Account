
"use client";

/**
 * TaxExportButton — 2026-11-18 (ฌอน / ข้อ 3)
 *
 * ของเดิมปุ่ม "ส่ง RD API" ยิง batchSubmitToRDPortal(["1","2","3"]) ซึ่งคืน
 * success:true ปลอมโดยไม่ติดต่อสรรพากรเลย → เปลี่ยนเป็น:
 *   1) ซิงค์สถานะด้วยเลขอ้างอิงจริง (/oapi/result-form)
 *   2) ยื่น ภ.พ.30 ต้องพิมพ์ยืนยัน "ยื่น ภ.พ.30" ก่อน (/oapi/submit-form)
 * ทั้งสองอย่างมี confirm ชัดเจน — ไม่มีอะไรรันอัตโนมัติ
 */

import { Download, Send, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import {
  exportPP30ToTxt,
  exportPND53ToTxt,
  submitPP30ToRDPortal,
  syncRDStatusAction,
} from "@/app/actions";
import { useState } from "react";

interface TaxExportButtonProps {
  id: string;
}

export default function TaxExportButton({ id }: TaxExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [rdSubmitting, setRDSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refNo, setRefNo] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
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
        setMessage({ type: "error", text: "ยังไม่รองรับการ Export สำหรับฟิลด์นี้" });
        return;
      }

      if (res.success && res.data && res.filename) {
        // สร้าง Link สำหรับดาวน์โหลด (สรุปข้อมูล — ยังไม่ใช่ไฟล์ยื่นของ RD)
        const link = document.createElement("a");
        link.href = `data:text/plain;base64,${res.data}`;
        link.download = res.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setMessage({ type: "error", text: res.error || "ไม่พบข้อมูลสำหรับการส่งออกในเดือนนี้" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  /** ซิงค์สถานะจาก RD ด้วยเลขอ้างอิงที่ผู้ใช้กรอกเอง (ไม่เดา ID) */
  const handleSync = async () => {
    const value = refNo.trim();
    if (!value) {
      setMessage({ type: "error", text: "กรุณากรอกเลขอ้างอิงการยื่นแบบ (refNo)" });
      return;
    }
    setSyncing(true);
    setMessage(null);
    try {
      const res = await syncRDStatusAction({ refNo: value });
      if (res.success) {
        setMessage({
          type: "ok",
          text: `สถานะ: ${res.statusLabel || res.formStatusId || "-"} · refNo ${res.refNo || value}`,
        });
      } else {
        setMessage({ type: "error", text: res.error || "ซิงค์ไม่สำเร็จ" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  /** ยื่นจริง — ต้องพิมพ์ยืนยันตรง ๆ ก่อนถึงจะเรียก server action */
  const handleRDSubmit = async () => {
    if (confirmText !== "ยื่น ภ.พ.30") {
      setMessage({ type: "error", text: "พิมพ์ 'ยื่น ภ.พ.30' ให้ตรงเพื่อยืนยัน" });
      return;
    }
    const now = new Date();
    setRDSubmitting(true);
    setMessage(null);
    try {
      // batchSubmitToRDPortal คงไว้สำหรับหน้าอื่น แต่ตอนนี้คืน error ชัดเจน (ไม่มี success ปลอม)
      const res = await submitPP30ToRDPortal(now.getMonth() + 1, now.getFullYear(), confirmText);
      if (res.success) {
        setMessage({
          type: "ok",
          text: `ส่งแบบสำเร็จ · ${res.statusLabel || res.responseCode || ""} · refNo ${res.refNo || "-"} ${res.apiRefNo ? `(apiRefNo ${res.apiRefNo})` : ""}`,
        });
        setShowConfirm(false);
        setConfirmText("");
      } else {
        setMessage({ type: "error", text: res.error || "ส่งไม่สำเร็จ" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
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
        {loading ? <Clock size={16} className="animate-spin" /> : <Download size={16} />}
        {loading ? "กำลังส่งออก..." : "ส่งออกไฟล์"}
      </button>

      {/* ซิงค์สถานะจาก RD — ต้องกรอก refNo จริง */}
      <div className="rounded border border-slate-200 bg-slate-50 p-2">
        <label className="mb-1 block text-[10px] font-bold text-slate-500">
          ซิงค์สถานะจากสรรพากร (เลขอ้างอิงการยื่นแบบ)
        </label>
        <div className="flex gap-1">
          <input
            value={refNo}
            onChange={(e) => setRefNo(e.target.value)}
            placeholder="เช่น P300041469858"
            className="h-8 min-w-0 flex-1 rounded border border-slate-200 px-2 font-mono text-xs outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            title="สอบถามสถานะแบบจาก RD (/oapi/result-form) แล้วบันทึกในแอพ"
            className="inline-flex h-8 items-center gap-1 rounded bg-slate-700 px-2 text-[11px] font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "กำลังซิงค์" : "ซิงค์"}
          </button>
        </div>
      </div>

      {/* ปุ่มยื่นแบบจริง — เปิดกล่องยืนยันก่อน */}
      <button
        onClick={() => {
          setShowConfirm((v) => !v);
          setMessage(null);
        }}
        disabled={rdSubmitting}
        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        {rdSubmitting ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
        {rdSubmitting ? "กำลังส่ง..." : "ยื่น ภ.พ.30 (RD Open API)"}
      </button>

      {showConfirm ? (
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          <p className="font-black">ยืนยันการยื่นแบบจริงต่อกรมสรรพากร</p>
          <p className="mt-1 font-semibold">
            การนี้จะนำส่งข้อมูล ภ.พ.30 ของเดือนปัจจุบันผ่าน RD Open API
            ระบบจะปฏิเสธถ้ายังมีใบภาษีซื้อที่ไม่ครบหรือยังไม่ยืนยันสิทธิหัก
          </p>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="พิมพ์: ยื่น ภ.พ.30"
            className="mt-2 h-8 w-full rounded border border-rose-200 bg-white px-2 text-xs outline-none focus:border-rose-400"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleRDSubmit}
              disabled={rdSubmitting}
              className="rounded bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              ยืนยันและส่ง
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmText("");
              }}
              className="rounded bg-white px-3 py-1 text-[11px] font-bold text-slate-600"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <p
          className={`flex items-start gap-1 rounded p-2 text-[11px] font-semibold ${
            message.type === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.type === "ok" ? <CheckCircle size={13} className="mt-0.5 shrink-0" /> : <XCircle size={13} className="mt-0.5 shrink-0" />}
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
