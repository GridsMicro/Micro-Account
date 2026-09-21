"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDateDisplay } from "@/lib/dateFormatter";
import {
  ArrowLeft,
  Save,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Zap,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { getContacts, createPayment } from "@/app/actions";

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // Load from localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('lastPaymentId');
    if (saved) setPaymentId(saved);
  }, []);

  // URL Params for Linking
  const invoiceId = searchParams.get('invoiceId');
  const preFilledAmount = searchParams.get('amount');
  const preFilledContact = searchParams.get('contact');
  const preFilledRef = searchParams.get('ref');

  // States สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    contactId: preFilledContact || '',
    reference: preFilledRef ? `RE-OBJ-${preFilledRef}` : `RE-${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 9000) + 1000}`,
    date: new Date().toISOString().split('T')[0],
    amount: preFilledAmount || '',
    paymentMethod: 'Bank Transfer (โอนเงินผ่านธนาคาร)',
    description: preFilledRef ? `รับชำระตามใบแจ้งหนี้ #${preFilledRef}` : 'ชำระค่า License Software',
    vatRate: 7,
    whtRate: 0,
    isVatRegistered: true,
    isService: true
  });

  useEffect(() => {
    const fetchData = async () => {
      const [contactRes] = await Promise.all([getContacts()]);
      if (contactRes.success) setContacts(contactRes.data!);
    };
    fetchData();
  }, []);

  // Sync formData with URL Params
  useEffect(() => {
    if (preFilledContact || preFilledAmount) {
      setFormData(prev => ({
        ...prev,
        contactId: preFilledContact || prev.contactId,
        amount: preFilledAmount || prev.amount,
        reference: preFilledRef ? `RC-${preFilledRef}` : prev.reference,
        description: preFilledRef ? `รับชำระตามใบแจ้งหนี้ #${preFilledRef}` : prev.description
      }));
    }
  }, [preFilledContact, preFilledAmount, preFilledRef]);

  const amountNum = parseFloat(formData.amount) || 0;
  const vatAmount = formData.isVatRegistered ? (amountNum * formData.vatRate) / 100 : 0;
  const whtAmount = (amountNum * formData.whtRate) / 100;
  const totalReceived = amountNum + vatAmount - whtAmount;

  const handleSave = async () => {
    if (!formData.amount || !formData.contactId) {
      setStatus({ type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วนครับ' });
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        ...formData,
        invoiceId: invoiceId || null,
        withholdingAmount: whtAmount
      };

      const paymentRes = await createPayment(paymentData);

      if (!paymentRes.success) {
        throw new Error(paymentRes.error);
      }

      const newPaymentId = paymentRes.id || null;
      setPaymentId(newPaymentId);
      if (newPaymentId) {
        localStorage.setItem('lastPaymentId', newPaymentId);
      }
      setStatus({ type: 'success', message: 'บันทึกสำเร็จแล้วครับพี่! ระบบจัดการภาษีและสมุดรายวันให้เรียบร้อยแล้ว' });
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/payments" className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm"><ArrowLeft size={20} /></Link>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">บันทึกรับเงิน</h1>
          </div>
          <div className="flex gap-2">
            {paymentId && (
              <button
                onClick={() => { localStorage.removeItem('lastPaymentId'); window.open(`/payments/print/${paymentId}`, '_blank'); }}
                className="h-11 px-4 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Printer size={18} /> พิมพ์ใบเสร็จ
              </button>
            )}
            <button onClick={handleSave} disabled={loading} className="h-11 px-6 bg-green-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} บันทึกรายการ
            </button>
          </div>
        </div>

        {status.message && (
          <div className={cn("mb-6 p-4 rounded-xl border-2 flex items-center gap-3", status.type === 'success' ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800")}>
            {status.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}<span className="font-bold">{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ลูกค้า</label>
                  <select value={formData.contactId} onChange={e => setFormData({ ...formData, contactId: e.target.value })} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                    <option value="">เลือกรายชื่อลูกค้า</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">เลขที่อ้างอิง</label>
                  <input type="text" value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-green-600">ยอดเงิน (ก่อนภาษี)</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full h-11 px-4 bg-green-50 border border-green-100 rounded-xl font-black text-green-700 text-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">วันที่รับชำระ</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">คำอธิบาย</label>
                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-blue-600">ช่องทางการเงิน</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full h-11 px-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 font-bold">
                    <option>Bank Transfer (โอนเงินผ่านธนาคาร)</option>
                    <option>Cash (เงินสด)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-red-500">หัก ณ ที่จ่าย (WHT)</label>
                  <select value={formData.whtRate} onChange={e => setFormData({ ...formData, whtRate: parseInt(e.target.value) })} className="w-full h-11 px-4 bg-red-50 border border-red-100 rounded-xl text-red-700 font-bold">
                    <option value="0">ไม่มีการหัก</option>
                    <option value="3">หัก 3% (บริการ)</option>
                    <option value="5">หัก 5% (ค่าสิทธิ)</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-purple-600">ประเภทรายการ</label>
                  <div className="flex gap-2 p-1 bg-purple-50 rounded-xl border border-purple-100">
                    <button type="button" onClick={() => setFormData({ ...formData, isService: true })} className={cn("flex-1 py-2 rounded-lg text-xs font-black uppercase", formData.isService ? "bg-purple-600 text-white shadow-md" : "text-purple-400 hover:bg-purple-100")}>งานบริการ</button>
                    <button type="button" onClick={() => setFormData({ ...formData, isService: false })} className={cn("flex-1 py-2 rounded-lg text-xs font-black uppercase", !formData.isService ? "bg-purple-600 text-white shadow-md" : "text-purple-400 hover:bg-purple-100")}>สินค้า</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="font-black text-gray-800 text-sm mb-6 flex items-center gap-2 uppercase tracking-wider"><Zap size={16} className="text-yellow-500" /> สรุปยอดโอน</h3>
              <div className="space-y-4 pb-6 border-b border-dashed border-gray-100">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">ยอดเงิน</span><span className="font-bold">฿{amountNum.toLocaleString()}</span></div>
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center gap-2 cursor-pointer"><span className="text-gray-500">VAT (7%)</span><input type="checkbox" checked={formData.isVatRegistered} onChange={e => setFormData({ ...formData, isVatRegistered: e.target.checked })} /></label>
                  <span className="font-bold text-purple-600">+ ฿{vatAmount.toLocaleString()}</span>
                </div>
                {whtAmount > 0 && <div className="flex justify-between items-center text-sm"><span className="text-red-500 font-bold">หัก ณ ที่จ่าย ({formData.whtRate}%)</span><span className="font-bold text-red-600">- ฿{whtAmount.toLocaleString()}</span></div>}
              </div>
              <div className="pt-6 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ยอดรับสุทธิ</p>
                <p className="text-4xl font-black text-blue-600 tracking-tighter">฿{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
