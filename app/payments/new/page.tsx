"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Hash,
  FileText
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { getContacts, getCompanySettings, createPayment } from "@/app/actions";

export default function NewPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [status, setStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  
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
      const [contactRes, companyRes] = await Promise.all([getContacts(), getCompanySettings()]);
      if (contactRes.success) setContacts(contactRes.data!);
      if (companyRes.success) setCompany(companyRes.data);
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
      setStatus({type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วนครับ'});
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

      setStatus({type: 'success', message: 'บันทึกสำเร็จแล้วครับพี่! ระบบจัดการภาษีและสมุดรายวันให้เรียบร้อยแล้ว'});
    } catch (err: any) {
      setStatus({type: 'error', message: err.message});
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const selectedContact = contacts.find(c => c.id == formData.contactId);
    if (!selectedContact || !company) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>ใบเสร็จรับเงิน - ${formData.reference}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2d55ff; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { color: #2d55ff; margin: 0; font-size: 24px; }
            .doc-type { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background-color: #f8fafc; border-bottom: 2px solid #eee; padding: 12px; text-align: left; }
            td { border-bottom: 1px solid #f1f5f9; padding: 12px; }
            .summary { margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .total-row { border-top: 2px solid #2d55ff; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #2d55ff; }
            .footer { margin-top: 100px; display: flex; justify-content: space-between; }
            .sign-box { width: 200px; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div class="company-info">
              <h1>${company.name}</h1>
              <p>${company.address}</p>
              <p>Tax ID: ${company.tax_id}</p>
            </div>
            <div class="doc-type">
              <h2>ใบเสร็จรับเงิน (RECEIPT)</h2>
              <p>เลขที่: ${formData.reference}</p>
              <p>วันที่: ${new Date(formData.date).toLocaleDateString('th-TH')}</p>
            </div>
          </div>
          <div style="margin-bottom: 30px;">
            <strong>ลูกค้า:</strong> ${selectedContact.name}<br/>
            ${selectedContact.address || '-'}<br/>
            Tax ID: ${selectedContact.tax_id || '-'}
          </div>
          <table>
            <thead><tr><th>รายการ</th><th style="text-align: right;">จำนวนเงิน</th></tr></thead>
            <tbody><tr><td>${formData.description}</td><td style="text-align: right;">${amountNum.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr></tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>รวมเงิน:</span><span>${amountNum.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            <div class="summary-row"><span>VAT 7%:</span><span>${vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
            ${whtAmount > 0 ? `<div class="summary-row"><span>หัก ณ ที่จ่าย:</span><span>- ${whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>` : ''}
            <div class="summary-row total-row"><span>รับสุทธิ:</span><span>${totalReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
          </div>
          <div class="footer"><div class="sign-box">ผู้รับเงิน</div><div class="sign-box">ผู้มีอำนาจลงนาม</div></div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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
            {status.type === 'success' && (
              <button onClick={handlePrintReceipt} className="h-11 px-4 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"><Printer size={18} /> พิมพ์ใบเสร็จ</button>
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
                  <select value={formData.contactId} onChange={e => setFormData({...formData, contactId: e.target.value})} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold">
                    <option value="">เลือกรายชื่อลูกค้า</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">เลขที่อ้างอิง</label>
                  <input type="text" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-green-600">ยอดเงิน (ก่อนภาษี)</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full h-11 px-4 bg-green-50 border border-green-100 rounded-xl font-black text-green-700 text-lg" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">วันที่รับชำระ</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">คำอธิบาย</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-blue-600">ช่องทางการเงิน</label>
                  <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full h-11 px-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 font-bold">
                    <option>Bank Transfer (โอนเงินผ่านธนาคาร)</option>
                    <option>Cash (เงินสด)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-red-500">หัก ณ ที่จ่าย (WHT)</label>
                  <select value={formData.whtRate} onChange={e => setFormData({...formData, whtRate: parseInt(e.target.value)})} className="w-full h-11 px-4 bg-red-50 border border-red-100 rounded-xl text-red-700 font-bold">
                    <option value="0">ไม่มีการหัก</option>
                    <option value="3">หัก 3% (บริการ)</option>
                    <option value="5">หัก 5% (ค่าสิทธิ)</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-purple-600">ประเภทรายการ</label>
                  <div className="flex gap-2 p-1 bg-purple-50 rounded-xl border border-purple-100">
                    <button type="button" onClick={() => setFormData({...formData, isService: true})} className={cn("flex-1 py-2 rounded-lg text-xs font-black uppercase", formData.isService ? "bg-purple-600 text-white shadow-md" : "text-purple-400 hover:bg-purple-100")}>งานบริการ</button>
                    <button type="button" onClick={() => setFormData({...formData, isService: false})} className={cn("flex-1 py-2 rounded-lg text-xs font-black uppercase", !formData.isService ? "bg-purple-600 text-white shadow-md" : "text-purple-400 hover:bg-purple-100")}>สินค้า</button>
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
                  <label className="flex items-center gap-2 cursor-pointer"><span className="text-gray-500">VAT (7%)</span><input type="checkbox" checked={formData.isVatRegistered} onChange={e => setFormData({...formData, isVatRegistered: e.target.checked})} /></label>
                  <span className="font-bold text-purple-600">+ ฿{vatAmount.toLocaleString()}</span>
                </div>
                {whtAmount > 0 && <div className="flex justify-between items-center text-sm"><span className="text-red-500 font-bold">หัก ณ ที่จ่าย ({formData.whtRate}%)</span><span className="font-bold text-red-600">- ฿{whtAmount.toLocaleString()}</span></div>}
              </div>
              <div className="pt-6 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ยอดรับสุทธิ</p>
                <p className="text-4xl font-black text-blue-600 tracking-tighter">฿{totalReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
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
