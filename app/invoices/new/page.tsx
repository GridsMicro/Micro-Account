"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  Receipt,
  User,
  Zap,
  ShieldCheck,
  Building2,
  Printer,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  ShoppingBag
} from "lucide-react";
import { getContacts, createJournalEntry, getCompanySettings, getNextInvoiceNumber } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [status, setStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  
  const [invoiceData, setInvoiceData] = useState({
    contactId: '',
    reference: 'Loading...',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days credit
    items: [{ id: Date.now(), desc: "ค่า License Software (Micro-Account)", qty: 1, price: 0 }],
    vatRate: 7,
    isVatRegistered: true
  });

  useEffect(() => {
    const fetchData = async () => {
      const [contactRes, companyRes, nextRefRes] = await Promise.all([
        getContacts(), 
        getCompanySettings(),
        getNextInvoiceNumber()
      ]);
      if (contactRes.success) setContacts(contactRes.data!);
      if (companyRes.success) setCompany(companyRes.data);
      if (nextRefRes.success) setInvoiceData(prev => ({ ...prev, reference: nextRefRes.data! }));
    };
    fetchData();
  }, []);

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { id: Date.now(), desc: "", qty: 1, price: 0 }]
    });
  };

  const removeItem = (id: number) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData({
        ...invoiceData,
        items: invoiceData.items.filter(item => item.id !== id)
      });
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  // คำนวณยอดเงิน
  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const vatAmount = invoiceData.isVatRegistered ? (subtotal * invoiceData.vatRate) / 100 : 0;
  const totalAmount = subtotal + vatAmount;

  const handleSaveInvoice = async () => {
    if (!invoiceData.contactId || subtotal <= 0) {
      setStatus({type: 'error', message: 'กรุณาเลือกลูกค้าและใส่ข้อมูลราคาสินค้าให้เรียบร้อยครับพี่'});
      return;
    }

    setLoading(true);
    try {
      const selectedContact = contacts.find(c => c.id === invoiceData.contactId);
      
      // 1. ลงบัญชีฝั่ง Debit: ลูกหนี้การค้า (ยอดรวมทั้งหมดที่รอรับเงิน)
      await createJournalEntry({
        entry_date: invoiceData.date,
        reference_no: invoiceData.reference,
        account_name: 'ลูกหนี้การค้า',
        description: `ตั้งลูกหนี้ ${selectedContact.name} สำหรับ ${invoiceData.reference}`,
        debit: totalAmount,
        credit: 0
      });

      // 2. ลงบัญชีฝั่ง Credit: รายได้ (แยกตามรายการ)
      await createJournalEntry({
        entry_date: invoiceData.date,
        reference_no: invoiceData.reference,
        account_name: 'รายได้จากการขาย/บริการ',
        description: invoiceData.items.map(i => i.desc).join(', '),
        debit: 0,
        credit: subtotal
      });

      // 3. ลงบัญชีฝั่ง Credit: ภาษีขาย (ถ้ามี)
      if (vatAmount > 0) {
        await createJournalEntry({
          entry_date: invoiceData.date,
          reference_no: invoiceData.reference,
          account_name: 'ภาษีขาย',
          description: `ภาษีขายจากใบแจ้งหนี้ ${invoiceData.reference}`,
          debit: 0,
          credit: vatAmount
        });
      }

      setStatus({type: 'success', message: 'ออกใบแจ้งหนี้และบันทึกค้างรับเรียบร้อยครับพี่! สามารถพิมพ์ส่งลูกค้าได้ทันที'});
    } catch (err: any) {
      setStatus({type: 'error', message: err.message});
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    const selectedContact = contacts.find(c => c.id === invoiceData.contactId);
    if (!selectedContact || !company) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>INVOICE - ${invoiceData.reference}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.5; }
            .header-flex { display: flex; justify-content: space-between; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #1e40af; font-size: 26px; }
            .doc-title { text-align: right; }
            .doc-title h2 { margin: 0; font-size: 28px; color: #1e40af; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .info-label { font-weight: bold; font-size: 12px; color: #666; text-transform: uppercase; border-bottom: 1px solid #eee; margin-bottom: 5px; display: block; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px; font-size: 14px; text-align: left; }
            td { border: 1px solid #cbd5e1; padding: 12px; font-size: 14px; }
            .summary { margin-left: auto; width: 320px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 15px; }
            .total-row { border-top: 2px solid #000; border-bottom: 2px double #000; margin-top: 10px; padding: 12px 0; font-weight: bold; font-size: 20px; }
            .bank-info { margin-top: 50px; border: 1px dashed #cbd5e1; padding: 20px; background: #fff; border-radius: 8px; }
            .signatures { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; text-align: center; }
            .sign-box { border-top: 1px solid #000; padding-top: 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header-flex">
            <div class="company-info">
              <h1>${company.name}</h1>
              <p>${company.address}</p>
              <p>โทร: ${company.phone} | TAX ID: ${company.tax_id}</p>
            </div>
            <div class="doc-title">
              <h2>ใบแจ้งหนี้</h2>
              <p style="font-weight: bold; font-size: 18px;">(INVOICE)</p>
              <p>เลขที่: <strong>${invoiceData.reference}</strong></p>
              <p>วันที่: ${new Date(invoiceData.date).toLocaleDateString('th-TH')}</p>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <span class="info-label">ชื่อและที่อยู่ลูกค้า (Bill To)</span>
              <strong>${selectedContact.name}</strong><br/>
              ${selectedContact.address || '-'}<br/>
              Tax ID: ${selectedContact.tax_id || '-'}
            </div>
            <div style="text-align: right;">
              <span class="info-label">กำหนดชำระ (Terms)</span>
              <p>วันที่ครบกำหนด: <strong>${new Date(invoiceData.dueDate).toLocaleDateString('th-TH')}</strong></p>
              <p>เงื่อนไขการชำระ: เงินสด/โอนเงิน</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="5%">#</th>
                <th width="55%">รายการ (DESCRIPTION)</th>
                <th width="10%" style="text-align: center;">จำนวน</th>
                <th width="15%" style="text-align: right;">ราคา/หน่วย</th>
                <th width="15%" style="text-align: right;">รวมเงิน</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.desc}</td>
                  <td style="text-align: center;">${item.qty}</td>
                  <td style="text-align: right;">${item.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style="text-align: right;">${(item.qty * item.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>รวมเงินสุทธิ (Subtotal):</span>
              <span>${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div class="summary-row">
              <span>ภาษีมูลค่าเพิ่ม ${invoiceData.vatRate}% (VAT):</span>
              <span>${vatAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div class="summary-row total-row">
              <span>จำนวนเงินทั้งสิ้น (Total):</span>
              <span>${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div class="bank-info">
             <strong>ข้อมูลการชำระเงิน (Payment Method)</strong><br/>
             ธนาคาร: ${company.bank_name || 'ธนาคารกสิกรไทย'}<br/>
             ชื่อบัญชี: ${company.bank_account_name || company.name}<br/>
             เลขที่บัญชี: ${company.bank_account_number || '000-0-00000-0'}<br/>
             <small style="color: #666;">(กรุณาส่งหลักฐานการโอนเงินคืนบริษัท และระบุเลขที่ใบแจ้งหนี้เพื่อความรวดเร็ว)</small>
          </div>

          <div class="signatures">
            <div class="sign-box">ผู้ออกเอกสาร (Issuer)</div>
            <div class="sign-box">ผู้มีอำนาจลงนาม (Authorized Signature)</div>
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
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/invoices" className="bg-white p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm">
               <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase">ออกใบแจ้งหนี้ (Invoice Creation)</h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Enterprise Billing System</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {status.type === 'success' && (
              <button 
                onClick={handlePrintInvoice}
                className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-200 transition-all text-sm animate-bounce"
              >
                <Printer size={18} /> พิมพ์ใบแจ้งหนี้
              </button>
            )}
            <button 
              onClick={handleSaveInvoice}
              disabled={loading}
              className="h-11 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-green-200 transition-all text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {status.type === 'success' ? 'ออกเอกสารสำเร็จ' : 'ออกใบแจ้งหนี้'}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Selection Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                   <h3 className="font-black text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <User size={18} className="text-blue-500" /> ข้อมูลคู่ค้า / ลูกค้าที่เรียกเก็บ
                   </h3>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เลือกลูกค้าที่จะเรียกเก็บเงิน</label>
                      <select 
                        value={invoiceData.contactId}
                        onChange={(e) => setInvoiceData({...invoiceData, contactId: e.target.value})}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-bold transition-all cursor-pointer"
                      >
                         <option value="">-- กรุณาเลือกรายชื่อลูกค้า --</option>
                         {contacts.map(c => (
                           <option key={c.id} value={c.id}>{c.name} {c.tax_id ? `(${c.tax_id})` : ''}</option>
                         ))}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">เลขที่ใบแจ้งหนี้ (Reference)</label>
                      <div className="relative">
                        <Hash size={16} className="absolute left-4 top-3.5 text-gray-400" />
                        <input 
                          type="text" 
                          value={invoiceData.reference}
                          onChange={(e) => setInvoiceData({...invoiceData, reference: e.target.value})}
                          className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold outline-none focus:border-blue-500" 
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-red-500 underline">วันที่ครบกำหนดชำระ (Due Date)</label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-3.5 text-red-400" />
                        <input 
                          type="date" 
                          value={invoiceData.dueDate}
                          onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                          className="w-full h-11 pl-11 pr-4 bg-red-50/30 border border-red-100 rounded-xl text-sm font-bold outline-none focus:border-red-500 text-red-700" 
                        />
                      </div>
                   </div>
                </div>
            </div>

            {/* Line Items Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex justify-between items-center">
                   <h3 className="font-black text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <ShoppingBag size={18} className="text-purple-500" /> รายการสินค้า / บริการ / License
                   </h3>
                   <button onClick={addItem} className="h-9 px-4 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                      <Plus size={14} /> เพิ่มรายการสินค้า
                   </button>
                </div>

                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50/50">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                            <th className="px-8 py-4">Description</th>
                            <th className="px-4 py-4 text-center w-24">Qty</th>
                            <th className="px-4 py-4 text-right w-40">Price/Unit</th>
                            <th className="px-8 py-4 text-right w-40">Total</th>
                            <th className="px-4 py-4 w-12"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {invoiceData.items.map((item) => (
                            <tr key={item.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                               <td className="px-8 py-6">
                                  <textarea 
                                    rows={1}
                                    placeholder="เช่น ค่า License รายปีสำหรับระบบ Micro-Account V1.0" 
                                    value={item.desc}
                                    onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none font-bold text-gray-700 py-1 transition-all resize-none" 
                                  />
                               </td>
                               <td className="px-4 py-6">
                                  <input 
                                    type="number" 
                                    value={item.qty}
                                    onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-center font-bold" 
                                  />
                               </td>
                               <td className="px-4 py-6">
                                  <input 
                                    type="number" 
                                    value={item.price}
                                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-right font-bold" 
                                  />
                               </td>
                               <td className="px-8 py-6 text-right font-black text-blue-600 text-lg tracking-tighter">
                                  ฿{(item.qty * item.price).toLocaleString()}
                               </td>
                               <td className="px-4 py-6 text-right">
                                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                     <Trash2 size={16} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </div>
          </div>

          {/* Totals Sidebar Card */}
          <div className="space-y-6">
             <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 shadow-blue-900/5 sticky top-8">
                <h3 className="font-black text-gray-800 uppercase tracking-tighter text-sm mb-8 border-b border-dashed border-gray-100 pb-4">Net Amount Summary</h3>
                
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Subtotal Amount</span>
                      <span className="text-gray-900 font-black text-lg">฿{subtotal.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">VAT {invoiceData.vatRate}%</span>
                        <input 
                          type="checkbox" 
                          checked={invoiceData.isVatRegistered}
                          onChange={(e) => setInvoiceData({...invoiceData, isVatRegistered: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600" 
                        />
                      </div>
                      <span className="text-purple-600 font-black text-lg">+ ฿{vatAmount.toLocaleString()}</span>
                   </div>
                   <div className="h-px bg-gray-100 my-2" />
                   <div>
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-2 text-center underline">ยอดแจ้งหนี้สุทธิ (Total)</span>
                      <span className="text-4xl font-black text-gray-900 tracking-tighter block text-center">
                        ฿{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                   </div>
                </div>
                
                <div className="mt-10 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                   <Zap size={24} className="text-blue-600 shrink-0" />
                   <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed">
                     ข้อมูลนี้จะถูกบันทึกเพื่อรอรับชำระเงิน และลงสมุดรายวันทันที
                   </p>
                </div>
             </div>

             <div className="bg-gray-800 text-white p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center">
                <ShieldCheck size={48} className="text-blue-500 mb-4" />
                <p className="font-black text-sm uppercase tracking-widest mb-1 italic">Professional Billing</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter opacity-70">Powering Corporate Growth</p>
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
