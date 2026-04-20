"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  Plus,
  Receipt,
  Search,
  Users,
} from "lucide-react";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const data = await res.json();
        setReceipts(data.payments || []);
      }
    } catch (e) {
      console.error("Fetch receipts error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-violet-600"
            >
              <ArrowLeft size={16} /> กลับหน้าหลัก
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
              <span className="rounded-2xl bg-emerald-500 p-3 shadow-lg shadow-emerald-200">
                <Receipt className="h-6 w-6 text-white" />
              </span>
              ใบเสร็จรับเงิน (Receipts)
            </h1>
            <p className="ml-1 mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              Sales Receipt Management - Customer Payment Tracking
            </p>
          </div>
          <button className="flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-black text-white shadow-xl shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-600 active:scale-95">
            <Plus size={18} /> บันทึกใบเสร็จ
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 rounded-xl border border-violet-50 bg-white p-4 shadow-sm">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบเสร็จ, ชื่อลูกค้า, หรือจำนวนเงิน..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Receipts Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-50 px-8 py-5">
            <h3 className="text-sm font-black text-slate-700">
              รายการใบเสร็จรับเงินทั้งหมด
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-20 text-slate-300">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : receipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      เลขที่ใบเสร็จ
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      วันที่
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      ลูกค้า
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      ใบแจ้งหนี้อ้างอิง
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      สถานะ
                    </th>
                    <th className="w-16 px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {receipts.map((receipt) => (
                    <tr key={receipt.id} className="group transition-all hover:bg-emerald-50/10">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-800">
                          {receipt.payment_no}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(receipt.payment_date).toLocaleDateString("th-TH")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                            <Users size={16} className="text-emerald-600" />
                          </div>
                          <span className="font-semibold text-slate-800">{receipt.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {receipt.invoice_number ? (
                          <Link
                            href={`/invoices/${receipt.invoice_id}`}
                            className="text-xs font-mono text-violet-600 hover:underline"
                          >
                            {receipt.invoice_number}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold tabular-nums text-emerald-600">
                          ฿{Number(receipt.amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                          <CheckCircle2 size={10} />
                          ชำระแล้ว
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/payments/print/${receipt.id}`}
                          className="rounded-lg p-2 text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 inline-block"
                          title="พิมพ์ใบเสร็จ"
                        >
                          <FileText size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Receipt size={32} className="text-emerald-200" />
                </div>
                <div>
                  <p className="font-bold text-slate-400">ยังไม่มีรายการใบเสร็จรับเงิน</p>
                  <p className="text-sm text-slate-300 mt-1">บันทึกใบเสร็จแรกเพื่อเริ่มต้นการติดตามการชำระเงิน</p>
                </div>
                <button className="text-xs font-black uppercase tracking-widest text-emerald-500 hover:underline">
                  + บันทึกใบเสร็จแรก
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="py-8 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
            Receipts Module - Micro-Account 2026
          </p>
        </div>
      </div>
    </main>
  );
}
