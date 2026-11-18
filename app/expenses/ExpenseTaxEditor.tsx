"use client";

/**
 * ExpenseTaxEditor — แก้ข้อมูลภาษีซื้อของรายการเก่า (2026-11-18 / ฌอน, ข้อ 2)
 *
 * ทำไมต้องมี: หน้า /expenses เดิมมีแค่ "เพิ่ม/ลบ" ไม่มีแก้ไข ทำให้รายการเก่า
 * (เช่น Microsoft 365 VAT 241.99 ใบ MRSTHMCI2700383704 ที่วันที่เป็น "รอระบุวันที่")
 * แก้ไม่ได้เว้นแต่จะลบแล้วสร้างใหม่ ซึ่งจะกระทบ journal entries
 *
 * ความปลอดภัย:
 * - เรียก updateExpenseTaxInfo เฉพาะเมื่อผู้ใช้กด "บันทึก" (user-initiated)
 * - server action อัปเดตเฉพาะ tax_invoice_no / tax_invoice_date / tax_deductible
 * - ไม่แตะ amount / vat_amount / journal entries
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check } from "lucide-react";
import ThaiDateInput from "@/components/ThaiDateInput";
import { updateExpenseTaxInfo } from "@/app/expense-actions";

interface ExpenseTaxEditorProps {
  id: number;
  taxInvoiceNo: string | null;
  taxInvoiceDate: string | null;
  taxDeductible: boolean;
}

export default function ExpenseTaxEditor({
  id,
  taxInvoiceNo,
  taxInvoiceDate,
  taxDeductible,
}: ExpenseTaxEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [no, setNo] = useState(taxInvoiceNo || "");
  const [date, setDate] = useState(taxInvoiceDate || "");
  const [deductible, setDeductible] = useState(taxDeductible);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const res = await updateExpenseTaxInfo(id, {
      tax_invoice_no: no.trim() || null,
      tax_invoice_date: date || null,
      tax_deductible: deductible,
    });
    setSaving(false);
    if (!res.success) {
      setMessage(res.error || "บันทึกไม่สำเร็จ");
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-1">
      {!open ? (
        <div className="text-xs text-slate-500">
          {taxInvoiceNo ? (
            <>
              <p className="font-mono text-slate-700">{taxInvoiceNo}</p>
              <p>{taxInvoiceDate ? new Date(taxInvoiceDate).toLocaleDateString("th-TH") : "รอระบุวันที่"}</p>
            </>
          ) : (
            <span className="text-slate-300">—</span>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
                taxDeductible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {taxDeductible ? "หักได้" : "ยังไม่ยืนยัน"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline"
              title="แก้เลขที่/วันที่ใบภาษีซื้อ หรือยืนยันสิทธิหัก"
            >
              <Pencil size={11} /> แก้ภาษี
            </button>
          </div>
        </div>
      ) : (
        <div className="min-w-[220px] space-y-2 rounded-xl border border-rose-100 bg-white p-2">
          <input
            type="text"
            value={no}
            onChange={(e) => setNo(e.target.value)}
            placeholder="เลขที่ใบภาษีซื้อ"
            className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-rose-400"
          />
          <ThaiDateInput label="วันที่ใบภาษีซื้อ" value={date} onChange={setDate} />
          <label className="flex items-center gap-2 text-[10px] font-bold text-emerald-700">
            <input
              type="checkbox"
              checked={deductible}
              onChange={(e) => setDeductible(e.target.checked)}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
            />
            ยืนยันสิทธิหักภาษีซื้อ
          </label>
          {message ? <p className="text-[10px] font-bold text-rose-600">{message}</p> : null}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
            >
              <Check size={11} /> {saving ? "บันทึก..." : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
            >
              <X size={11} /> ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
