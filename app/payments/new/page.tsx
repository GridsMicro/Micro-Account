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

      const newPaymentId = paymentRes.id || null;
      setPaymentId(newPaymentId);
      if (newPaymentId) {
        localStorage.setItem('lastPaymentId', newPaymentId);
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
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Sarabun', sans-serif; 
              padding: 0; 
              color: #1e293b; 
              max-width: 210mm; 
              margin: 0 auto; 
              background: white;
              line-height: 1.6;
            }
            .receipt-container {
              padding: 30px 40px;
              min-height: 100vh;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              padding-bottom: 25px; 
              margin-bottom: 30px;
              border-bottom: 3px solid #6366f1;
            }
            .company-section {
              flex: 1;
            }
            .company-name { 
              font-size: 28px; 
              font-weight: 700; 
              color: #1e1b4b;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .company-details {
              font-size: 13px;
              color: #64748b;
              line-height: 1.8;
            }
            .doc-badge {
              text-align: center;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 15px 30px;
              border-radius: 12px;
              box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
            }
            .doc-title {
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 4px;
            }
            .doc-subtitle {
              font-size: 12px;
              opacity: 0.9;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .info-box {
              background: #f8fafc;
              padding: 20px;
              border-radius: 10px;
              border-left: 4px solid #6366f1;
            }
            .info-label {
              font-size: 11px;
              font-weight: 600;
              color: #6366f1;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 8px;
            }
            .info-value {
              font-size: 14px;
              color: #1e293b;
              font-weight: 600;
            }
            .info-value.secondary {
              font-weight: 400;
              color: #64748b;
              margin-top: 4px;
              font-size: 13px;
            }
            table { 
              width: 100%; 
              border-collapse: separate;
              border-spacing: 0;
              margin: 25px 0; 
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            thead { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); }
            th { 
              color: white;
              padding: 14px 16px; 
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            th:last-child { text-align: right; }
            td { 
              padding: 16px; 
              border-bottom: 1px solid #e2e8f0;
              background: white;
            }
            td:last-child { 
              text-align: right; 
              font-weight: 600;
            }
            tbody tr:hover { background: #f8fafc; }
            .summary-box {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 12px;
              padding: 25px;
              margin-top: 25px;
              border: 1px solid #e2e8f0;
            }
            .summary-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0;
              font-size: 14px;
              color: #475569;
            }
            .summary-row:not(:last-child) {
              border-bottom: 1px dashed #cbd5e1;
            }
            .total-row { 
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              padding: 18px 25px;
              border-radius: 10px;
              margin-top: 15px;
              font-weight: 700;
              font-size: 20px;
              box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
            }
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              gap: 40px;
            }
            .sign-box { 
              flex: 1;
              text-align: center;
            }
            .sign-line { 
              border-bottom: 2px solid #1e1b4b; 
              padding-top: 50px;
              margin-bottom: 12px;
              width: 80%;
              margin-left: auto;
              margin-right: auto;
            }
            .sign-label {
              font-size: 13px;
              color: #475569;
              font-weight: 500;
            }
            .sign-date {
              font-size: 11px;
              color: #94a3b8;
              margin-top: 4px;
            }
            .footer-note {
              margin-top: 40px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              padding-top: 20px;
              border-top: 1px dashed #e2e8f0;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(99, 102, 241, 0.03);
              font-weight: 700;
              pointer-events: none;
              z-index: 0;
            }
            @media print { 
              body { padding: 0; }
              .receipt-container { padding: 20px 30px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="watermark">RECEIPT</div>
          <div class="receipt-container">
            <div class="header">
              <div class="company-section">
                <div class="company-name">${company.name}</div>
                <div class="company-details">
                  ${company.address}<br/>
                  เลขประจำตัวผู้เสียภาษี: ${company.tax_id || '-'}<br/>
                  โทรศัพท์: ${company.phone || '-'}
                </div>
              </div>
              <div class="doc-badge">
                <div class="doc-title">ใบเสร็จรับเงิน</div>
                <div class="doc-subtitle">RECEIPT / TAX INVOICE</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-box">
                <div class="info-label">ลูกค้า / Customer</div>
                <div class="info-value">${selectedContact.name}</div>
                <div class="info-value secondary">${selectedContact.address || 'ไม่ระบุที่อยู่'}</div>
                <div class="info-value secondary">Tax ID: ${selectedContact.tax_id || '-'}</div>
              </div>
              <div class="info-box">
                <div class="info-label">รายละเอียดเอกสาร</div>
                <div class="info-value">เลขที่: ${formData.reference}</div>
                <div class="info-value secondary">วันที่: ${new Date(formData.date).toLocaleDateString('th-TH', {year: 'numeric', month: 'long', day: 'numeric'})}</div>
                <div class="info-value secondary">วิธีชำระ: ${formData.paymentMethod}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 60px;">ลำดับ</th>
                  <th>รายการ / Description</th>
                  <th style="text-align: right; width: 150px;">จำนวนเงิน / Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>${formData.description}</td>
                  <td>${amountNum.toLocaleString('th-TH', {minimumFractionDigits: 2})}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-row">
                <span>รวมเงิน (Subtotal)</span>
                <span>${amountNum.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
              </div>
              <div class="summary-row">
                <span>ภาษีมูลค่าเพิ่ม 7% (VAT)</span>
                <span>${vatAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
              </div>
              ${whtAmount > 0 ? `
              <div class="summary-row" style="color: #dc2626;">
                <span>หัก ณ ที่จ่าย ${formData.whtRate}% (WHT)</span>
                <span>- ${whtAmount.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
              </div>` : ''}
              <div class="total-row">
                <span>รวมยอดรับสุทธิ (Total Received)</span>
                <span>฿${totalReceived.toLocaleString('th-TH', {minimumFractionDigits: 2})}</span>
              </div>
            </div>

            <div class="signatures">
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-label">ผู้รับเงิน / Receiver</div>
                <div class="sign-date">วันที่ _____________</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-label">ผู้มีอำนาจลงนาม / Authorized</div>
                <div class="sign-date">วันที่ _____________</div>
              </div>
              <div class="sign-box">
                <div class="sign-line"></div>
                <div class="sign-label">ลูกค้า / Customer</div>
                <div class="sign-date">วันที่ _____________</div>
              </div>
            </div>

            <div class="footer-note">
              เอกสารนี้เป็นหลักฐานการรับชำระเงิน กรุณาเก็บรักษาไว้เพื่อการอ้างอิง<br/>
              This document serves as proof of payment. Please retain for your records.
            </div>
          </div>
          <script>window.onload = function() { setTimeout(() => window.print(), 300); }</script>
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
            {paymentId && (
              <button 
                onClick={() => { localStorage.removeItem('lastPaymentId'); handlePrintReceipt(); }} 
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
