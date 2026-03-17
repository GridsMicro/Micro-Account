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
import { getContacts, createJournalEntry, getCompanySettings } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [status, setStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  
  // States สำหรับฟอร์ม
  const [formData, setFormData] = useState({
    contactId: '',
    reference: `RE-${new Date().getFullYear().toString().slice(-2)}${Math.floor(Math.random() * 9000) + 1000}`,
    date: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'Bank Transfer (โอนเงินผ่านธนาคาร)',
    description: 'ชำระค่า License Software',
    vatRate: 7,
    whtRate: 0, // 0, 3, 5
    isVatRegistered: true
  });

  useEffect(() => {
    const fetchData = async () => {
      const [contactRes, companyRes] = await Promise.all([getContacts(), getCompanySettings()]);
      if (contactRes.success) setContacts(contactRes.data!);
      if (companyRes.success) setCompany(companyRes.data);
    };
    fetchData();
  }, []);

  // คำนวณภาษี
  const amountNum = parseFloat(formData.amount) || 0;
  const vatAmount = formData.isVatRegistered ? (amountNum * formData.vatRate) / 100 : 0;
  const whtAmount = (amountNum * formData.whtRate) / 100;
  const totalReceived = amountNum + vatAmount - whtAmount;

  const handleSave = async () => {
    if (!formData.amount || !formData.contactId) {
      setStatus({type: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วนครับพี่'});
      return;
    }

    setLoading(true);
    try {
      // 1. ลงบัญชีฝั่ง Debit: เงินสด/ธนาคาร (ยอดที่ได้รับจริง)
      await createJournalEntry({
        entry_date: formData.date,
        reference_no: formData.reference,
        account_name: formData.paymentMethod.includes('ธนาคาร') ? 'เงินฝากธนาคาร' : 'เงินสด',
        description: `รับชำระค่าลิขสิทธิ์จาก ${contacts.find(c => c.id === formData.contactId)?.name} (${formData.description})`,
        debit: totalReceived,
        credit: 0
      });

      // 2. ลงบัญชีฝั่ง Credit: รายได้ (ยอดก่อนภาษี)
      await createJournalEntry({
        entry_date: formData.date,
        reference_no: formData.reference,
        account_name: 'รายได้จากการขายสิทธิ/ลิขสิทธิ์',
        description: formData.description,
        debit: 0,
        credit: amountNum
      });

      // 3. ถ้ามี VAT ลงภาษีขาย
      if (vatAmount > 0) {
        await createJournalEntry({
          entry_date: formData.date,
          reference_no: formData.reference,
          account_name: 'ภาษีขาย',
          description: `ภาษีขายจาก ${formData.reference}`,
          debit: 0,
          credit: vatAmount
        });
      }

      // 4. ถ้ามี WHT ลงภาษีเงินได้ถูกหัก ณ ที่จ่าย
      if (whtAmount > 0) {
        await createJournalEntry({
          entry_date: formData.date,
          reference_no: formData.reference,
          account_name: 'ภาษีเงินได้ถูกหัก ณ ที่จ่าย',
          description: `WHT ถูกหักไว้จาก ${formData.reference}`,
          debit: whtAmount,
          credit: 0
        });
      }

      setStatus({type: 'success', message: 'บันทึกรายการและลงบัญชีเรียบร้อยครับพี่! เตรียมพิมพ์ใบเสร็จได้เลย'});
      // ไม่ redirect ทันที เพื่อให้พี่กดพิมพ์ใบเสร็จก่อน
    } catch (err: any) {
      setStatus({type: 'error', message: err.message});
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const selectedContact = contacts.find(c => c.id === formData.contactId);
    if (!selectedContact || !company) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>ใบเสร็จรับเงิน - ${formData.reference}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header-flex { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2d55ff; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { color: #2d55ff; margin: 0; font-size: 24px; text-transform: uppercase; }
            .doc-type { text-align: right; }
            .doc-type h2 { margin: 0; color: #333; font-size: 22px; }
            .grid-info { display: grid; grid-cols: 2; display: flex; gap: 40px; margin-bottom: 30px; }
            .info-box { flex: 1; font-size: 14px; line-height: 1.6; }
            .info-label { font-weight: bold; color: #666; font-size: 12px; display: block; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background-color: #f8fafc; border-bottom: 2px solid #eee; padding: 12px; text-align: left; font-size: 14px; }
            td { border-bottom: 1px solid #f1f5f9; padding: 12px; font-size: 14px; }
            .summary { margin-left: auto; width: 300px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
            .total-row { border-top: 2px solid #2d55ff; margin-top: 10px; padding-top: 10px; font-weight: bold; font-size: 18px; color: #2d55ff; }
            .footer { margin-top: 100px; display: flex; justify-content: space-between; font-size: 14px; }
            .sign-box { width: 200px; text-align: center; border-top: 1px solid #333; padding-top: 10px; }
            @media print { body { box-shadow: none; padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div class="company-info">
              <h1>${company.name}</h1>
              <p>${company.address}</p>
              <p>โทร: ${company.phone} | Tax ID: ${company.tax_id}</p>
            </div>
            <div class="doc-type">
              <h2>ใบเสร็จรับเงิน</h2>
              <p style="font-weight: bold;">(RECEIPT)</p>
              <p>เลขที่: ${formData.reference}</p>
              <p>วันที่: ${new Date(formData.date).toLocaleDateString('th-TH')}</p>
            </div>
          </div>

          <div class="grid-info">
             <div class="info-box">
                <span class="info-label">ลูกค้า / CUSTOMER</span>
                <strong>${selectedContact.name}</strong><br/>
                ${selectedContact.address || '-'}<br/>
                Tax ID: ${selectedContact.tax_id || '-'}
             </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="10%">ลำดับ</th>
                <th>รายการ (DESCRIPTION)</th>
                <th style="text-align: right;">จำนวนเงิน (AMOUNT)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>${formData.description}</td>
                <td style="text-align: right;">${amountNum.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>ยอดเงินรวม (Subtotal):</span>
              <span>${amountNum.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div class="summary-row">
              <span>ภาษีมูลค่าเพิ่ม ${formData.vatRate}%:</span>
              <span>${vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            ${whtAmount > 0 ? `
            <div class="summary-row" style="color: #ef4444;">
              <span>หัก ณ ที่จ่าย (${formData.whtRate}%):</span>
              <span>- ${whtAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>` : ''}
            <div class="summary-row total-row">
              <span>ยอดรับสุทธิ:</span>
              <span>${totalReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div class="footer">
             <div class="sign-box">ผู้รับเงิน</div>
             <div class="sign-box">ผู้มีอำนาจลงนาม</div>
          </div>

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
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/payments" className="bg-white p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm">
               <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">บันทึกรับเงิน & ออกใบเสร็จ</h1>
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Payment & Receipt Automation</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {status.type === 'success' && (
              <button 
                onClick={handlePrintReceipt}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all text-sm animate-bounce"
              >
                <Printer size={18} /> พิมพ์ใบเสร็จทันที
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="h-11 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-green-200 transition-all text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {status.type === 'success' ? 'บันทึกสำเร็จ' : 'บันทึกรายการ'}
            </button>
          </div>
        </div>

        {status.type && (
          <div className={cn(
            "mb-6 p-4 rounded-xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
            status.type === 'success' ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
          )}>
            {status.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : <AlertCircle className="w-6 h-6 shrink-0" />}
            <span className="font-bold">{status.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 font-black text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <CreditCard size={18} className="text-blue-500" /> ข้อมูลการรับชำระเงินจริง
               </div>
               
               <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ลูกค้า (Customer)</label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
                          <select 
                            value={formData.contactId}
                            onChange={(e) => setFormData({...formData, contactId: e.target.value})}
                            className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                          >
                             <option value="">เลือกรายชื่อลูกค้า</option>
                             {contacts.map(c => (
                               <option key={c.id} value={c.id}>{c.name}</option>
                             ))}
                          </select>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เลขที่ใบเสร็จ (Ref No)</label>
                        <div className="relative">
                          <Hash size={16} className="absolute left-4 top-3.5 text-gray-400" />
                          <input 
                            type="text" 
                            value={formData.reference}
                            onChange={(e) => setFormData({...formData, reference: e.target.value})}
                            className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm font-mono font-bold" 
                          />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-green-600">ค่า License (ยอดก่อนภาษี)</label>
                        <div className="relative">
                          <DollarSign size={20} className="absolute left-4 top-3 text-green-600" />
                          <input 
                            type="number" 
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="w-full h-12 pl-12 pr-4 bg-green-50/50 border-2 border-green-100 rounded-xl focus:border-green-500 focus:bg-white outline-none text-xl font-black text-green-700 placeholder:text-green-200" 
                          />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">วันที่รับชำระ</label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-4 top-3.5 text-gray-400" />
                          <input 
                            type="date" 
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none" 
                          />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">คำอธิบายรายการ (Description)</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none" 
                        placeholder="เช่น ชำระค่า License รายปี 2026"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-blue-600">ช่องทางการเงิน</label>
                        <select 
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                          className="w-full h-11 px-4 bg-blue-50/50 border border-blue-100 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-blue-700"
                        >
                           <option>Bank Transfer (โอนเงินผ่านธนาคาร)</option>
                           <option>Cash (เงินสด)</option>
                           <option>Credit Card (บัตรเครดิต)</option>
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-500">ติ๊กเลือกการหักภาษี ณ ที่จ่าย (WHT)</label>
                        <select 
                          value={formData.whtRate}
                          onChange={(e) => setFormData({...formData, whtRate: parseInt(e.target.value)})}
                          className="w-full h-11 px-4 bg-red-50/50 border border-red-100 rounded-xl focus:border-red-500 outline-none text-sm font-bold text-red-700"
                        >
                           <option value="0">ไม่มีการหัก ณ ที่จ่าย</option>
                           <option value="3">หัก 3% (ค่าบริการทั่วไป)</option>
                           <option value="5">หัก 5% (ค่า License / ลิขสิทธิ์)</option>
                        </select>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {/* summary Sidebar */}
          <div className="space-y-6">
             <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 shadow-blue-900/5">
                <h3 className="font-black text-gray-800 uppercase tracking-tighter text-sm mb-6 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-500" /> สรุปยอดเงิน (Live Summary)
                </h3>
                
                <div className="space-y-4 pb-6 border-b border-dashed border-gray-100">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">ราคาหน้าลิขสิทธิ์</span>
                      <span className="font-bold">฿{amountNum.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">VAT (7%)</span>
                        <input 
                          type="checkbox" 
                          checked={formData.isVatRegistered}
                          onChange={(e) => setFormData({...formData, isVatRegistered: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600" 
                        />
                      </div>
                      <span className="font-bold text-purple-600">+ ฿{vatAmount.toLocaleString()}</span>
                   </div>
                   {whtAmount > 0 && (
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-red-500 font-medium font-bold">หัก ณ ที่จ่าย ({formData.whtRate}%)</span>
                        <span className="font-bold text-red-600">- ฿{whtAmount.toLocaleString()}</span>
                     </div>
                   )}
                </div>

                <div className="pt-6">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">ยอดโอนเงินเข้าจริง (Net Total)</p>
                   <p className="text-4xl font-black text-blue-600 text-center tracking-tighter">
                     ฿{totalReceived.toLocaleString(undefined, {minimumFractionDigits: 2})}
                   </p>
                </div>
             </div>

             <div className="bg-blue-900 p-5 rounded-2xl text-white shadow-lg">
                <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-2 italic">Accounting Tip:</p>
                <p className="text-xs leading-relaxed text-blue-100 font-medium">
                  ค่า License Software ในประเทศไทยต้องหักภาษี ณ ที่จ่าย **5%** (ตามมาตรา 40(3)) 
                  อย่าลืมขอหนังสือรับรองหัก ณ ที่จ่ายจากลูกค้าเพื่อเตรียมยื่นภาษีนะครับพี่!
                </p>
             </div>
          </div>
        </div>

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด
        </div>
      </div>
    </main>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
