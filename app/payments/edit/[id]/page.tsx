"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  payment_no: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string;
  invoice_id: string;
  customer_name: string;
}

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    notes: "",
    payment_method: "",
  });

  useEffect(() => {
    fetchPayment();
  }, [params.id]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/payments/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPayment(data.payment);
        setFormData({
          notes: data.payment.notes || "",
          payment_method: data.payment.payment_method || "Bank Transfer",
        });
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/payments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("บันทึกสำเร็จ");
        router.push("/payments");
      } else {
        alert("บันทึกไม่สำเร็จ");
      }
    } catch (e) {
      console.error("Save error:", e);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">ไม่พบข้อมูล</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/payments"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            <ArrowLeft size={20} /> กลับไปหน้ารายการ
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">แก้ไขรายการรับเงิน</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">เลขที่:</span>
                <span className="font-bold ml-2">{payment.payment_no}</span>
              </div>
              <div>
                <span className="text-gray-500">วันที่:</span>
                <span className="font-bold ml-2">{new Date(payment.payment_date).toLocaleDateString("th-TH")}</span>
              </div>
              <div>
                <span className="text-gray-500">ลูกค้า:</span>
                <span className="font-bold ml-2">{payment.customer_name || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500">จำนวนเงิน:</span>
                <span className="font-bold ml-2 text-green-600">฿{Number(payment.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วิธีการชำระเงิน
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Bank Transfer">โอนเงินผ่านธนาคาร</option>
                <option value="Cash">เงินสด</option>
                <option value="Credit Card">บัตรเครดิต</option>
                <option value="PromptPay">พร้อมเพย์</option>
                <option value="Check">เช็ค</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="เพิ่มหมายเหตุ..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
