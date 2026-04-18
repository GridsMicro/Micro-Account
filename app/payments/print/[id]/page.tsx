"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Payment {
  id: string;
  payment_date: string;
  payment_no: string;
  amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
  customer_name: string;
  customer_address: string;
  customer_tax_id: string;
  invoice_number: string;
  vat_amount: number;
  withholding_amount: number;
  invoice_net_amount: number;
  invoice_vat_amount: number;
  invoice_total_amount: number;
  invoice_wht_amount: number;
  invoice_net_after_wht: number;
}

interface Company {
  name: string;
  address: string;
  tax_id: string;
  phone: string;
}

export default function PrintReceiptPage() {
  const params = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [paymentRes, companyRes] = await Promise.all([
        fetch(`/api/payments/${params.id}`),
        fetch("/api/company"),
      ]);

      if (paymentRes.ok) {
        const data = await paymentRes.json();
        setPayment(data.payment);
      }
      if (companyRes.ok) {
        const data = await companyRes.json();
        setCompany(data.company);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatNumber = (num: number) => {
    return num?.toLocaleString("th-TH", { minimumFractionDigits: 2 }) || "0.00";
  };

  // ใช้ค่าจาก Invoice โดยตรง ไม่คำนวณเอง
  const subtotal = payment?.invoice_net_amount || 0;
  const vatAmount = payment?.invoice_vat_amount || 0;
  const whtAmount = payment?.invoice_wht_amount || 0;
  // บัญชีแสดง WHT แต่ยอดสุทธิไม่หัก (รับผิดชอบเอง)
  const total = payment?.invoice_net_after_wht || payment?.invoice_total_amount || 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </main>
    );
  }

  if (!payment || !company) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-red-500">ไม่พบข้อมูล</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      {/* Toolbar - hidden when printing */}
      <div className="max-w-3xl mx-auto mb-4 no-print">
        <div className="flex justify-between items-center">
          <Link
            href="/payments"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            <ArrowLeft size={20} /> กลับไปหน้ารายการ
          </Link>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Printer size={20} /> พิมพ์ใบเสร็จ
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="max-w-3xl mx-auto bg-white shadow-xl print:shadow-none">
        <div className="p-8 print:py-0 print:px-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-4 mb-4 mt-4 print:mt-6">
            <div>
              <h1 className="text-3xl font-black text-indigo-900">{company.name}</h1>
              <p className="text-sm text-gray-600 mt-2">{company.address}</p>
              <p className="text-sm text-gray-600">Tax ID: {company.tax_id}</p>
              <p className="text-sm text-gray-600">Tel: {company.phone || "-"}</p>
            </div>
            <div className="text-center bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-8 py-4 rounded-xl">
              <div className="text-xl font-black">ใบเสร็จรับเงิน</div>
              <div className="text-xs opacity-80">RECEIPT / TAX INVOICE</div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-600">
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">ลูกค้า / Customer</div>
              <div className="font-bold text-gray-800">{payment.customer_name || "ไม่ระบุ"}</div>
              <div className="text-sm text-gray-600">{payment.customer_address || "-"}</div>
              <div className="text-sm text-gray-600">Tax ID: {payment.customer_tax_id || "-"}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border-l-4 border-indigo-600">
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">รายละเอียด</div>
              <div className="font-bold text-gray-800">เลขที่: {payment.payment_no || "-"}</div>
              <div className="text-sm text-gray-600">
                วันที่: {new Date(payment.payment_date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
              </div>
              <div className="text-sm text-gray-600">วิธีชำระ: {payment.payment_method || "Bank Transfer"}</div>
              {payment.invoice_number && (
                <div className="text-sm text-gray-600">อ้างอิงใบแจ้งหนี้: {payment.invoice_number}</div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-4">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wider rounded-tl-lg">ลำดับ</th>
                <th className="py-2 px-3 text-left text-xs font-bold uppercase tracking-wider">รายการ</th>
                <th className="py-2 px-3 text-right text-xs font-bold uppercase tracking-wider rounded-tr-lg">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-3">1</td>
                <td className="py-2 px-3">{payment.notes || "ค่าบริการ / สินค้า"}</td>
                <td className="py-2 px-3 text-right font-bold">{formatNumber(subtotal)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between py-2 border-b border-dashed border-gray-300">
              <span className="text-gray-600">รวมเงิน (Subtotal)</span>
              <span className="font-bold">{formatNumber(subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed border-gray-300">
              <span className="text-gray-600">ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
              <span className="font-bold">{formatNumber(vatAmount)}</span>
            </div>
            {whtAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-dashed border-gray-300 text-red-600">
                <span className="font-bold">หัก ณ ที่จ่าย (WHT)</span>
                <span className="font-bold">-{formatNumber(whtAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 rounded-lg">
              <span className="text-lg font-bold">รวมยอดรับสุทธิ</span>
              <span className="text-2xl font-black">฿{formatNumber(total)}</span>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="bg-slate-100 p-2 rounded-lg mb-4 text-center">
            <span className="text-sm text-gray-600">จำนวนเงินเป็นตัวอักษร / Amount in words:</span>
            <div className="font-bold text-gray-800 mt-1">*** {amountToThaiWords(total)} ***</div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-3">
            <div className="text-center">
              <div className="border-b-2 border-gray-800 pb-1 mb-1 h-12"></div>
              <div className="text-sm font-medium">ผู้รับเงิน / Receiver</div>
              <div className="text-xs text-gray-500">วันที่ ___/___/______</div>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-gray-800 pb-1 mb-1 h-12"></div>
              <div className="text-sm font-medium">ผู้มีอำนาจ / Authorized</div>
              <div className="text-xs text-gray-500">วันที่ ___/___/______</div>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-gray-800 pb-1 mb-1 h-12"></div>
              <div className="text-sm font-medium">ลูกค้า / Customer</div>
              <div className="text-xs text-gray-500">วันที่ ___/___/______</div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>เอกสารนี้เป็นหลักฐานการรับชำระเงิน กรุณาเก็บรักษาไว้เพื่อการอ้างอิง</p>
            <p>This document serves as proof of payment. Please retain for your records.</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print,
          aside,
          nav,
          [class*="sidebar"],
          [class*="Sidebar"],
          [class*="navigation"],
          [class*="Navigation"] {
            display: none !important;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}

// Helper function to convert number to Thai words
function amountToThaiWords(amount: number): string {
  if (!amount) return "ศูนย์บาทถ้วน";
  
  const baht = Math.floor(amount);
  const satang = Math.round((amount - baht) * 100);
  
  let result = numberToThai(baht) + "บาท";
  if (satang > 0) {
    result += numberToThai(satang) + "สตางค์";
  } else {
    result += "ถ้วน";
  }
  
  return result;
}

function numberToThai(num: number): string {
  const thaiNums = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const thaiPlaces = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  if (num === 0) return "";
  if (num < 10) return thaiNums[num];
  
  let result = "";
  const str = num.toString();
  const len = str.length;
  
  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i]);
    const place = len - i - 1;
    
    if (digit !== 0) {
      if (place === 1 && digit === 1) {
        result += "สิบ";
      } else if (place === 1 && digit === 2) {
        result += "ยี่สิบ";
      } else if (place === 0 && digit === 1 && len > 1) {
        result += "เอ็ด";
      } else {
        result += thaiNums[digit] + thaiPlaces[place % 6];
      }
    }
    
    if (place === 6 && i !== len - 1) {
      result += "ล้าน";
    }
  }
  
  return result;
}
