"use client";
import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader2, AlertCircle, CheckCircle2, FileText, Printer } from 'lucide-react';
import { exportJournalsToExcel, getJournalEntries } from '@/app/actions';

// ฟังก์ชันสร้าง PDF แบบใช้ "โหมดพิมพ์ผ่านหน้าต่างเบราว์เซอร์" 
// วิธีนี้เป็นวิธีที่ "ภาษาไทยสวยที่สุด 100%" เพราะใช้ Engine ของ Chrome โดยตรง ไม่ต้องฝังฟอนต์ให้ไฟล์อืดครับ!
const ExportButton = () => {
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handlePDFPrint = async () => {
    setLoadingPDF(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await getJournalEntries();
      if (!result.success || !result.data) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");

      // สร้างหน้าต่างใหม่ชั่วคราวเพื่อพิมพ์ (วิธีนี้ภาษาไทยจะเป๊ะ 100%)
      const printWindow = window.open('', '_blank');
      if (!printWindow) throw new Error("โหมด Pop-up ถูกบล็อก กรุณาอนุญาตก่อนครับ");

      const html = `
        <html>
          <head>
            <title>Journal Report - ${new Date().toLocaleDateString('th-TH')}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #2d55ff; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { color: #2d55ff; margin: 0; font-size: 28px; }
              .header p { margin: 5px 0; color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #2d55ff; color: white; padding: 12px; text-align: left; font-size: 14px; }
              td { border-bottom: 1px solid #eee; padding: 10px; font-size: 13px; }
              .text-right { text-align: right; }
              .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>GENERAL JOURNAL REPORT</h1>
              <p>MICRO ACCOUNTING SYSTEM | INNOVATION FOR THE FUTURE</p>
              <p>วันที่พิมพ์: ${new Date().toLocaleString('th-TH')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เอกสารอ้างอิง</th>
                  <th>ชื่อบัญชี</th>
                  <th>รายการ</th>
                  <th class="text-right">เดบิต (Dr.)</th>
                  <th class="text-right">เครดิต (Cr.)</th>
                </tr>
              </thead>
              <tbody>
                ${result.data.map((entry: any) => `
                  <tr>
                    <td>${new Date(entry.entry_date).toLocaleDateString('th-TH')}</td>
                    <td>${entry.reference_no || "-"}</td>
                    <td>${entry.account_name}</td>
                    <td>${entry.description}</td>
                    <td class="text-right">${Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td class="text-right">${Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>© 2026 บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
            </div>
            <script>
              window.onload = function() { 
                window.print(); 
                // window.close(); // ปิดอัตโนมัติหลังพิมพ์เสร็จ (เลือกเปิดได้)
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      setStatus({ type: 'success', message: 'เตรียมหน้าพิมพ์รายงานเรียบร้อย (เลือก Save as PDF ได้เลยครับ!)' });
    } catch (err: any) {
      setStatus({ type: 'error', message: "Error: " + err.message });
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleExcelExport = async () => {
    setLoadingExcel(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await exportJournalsToExcel();
      if (result.success && result.data) {
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const excelBlob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(excelBlob);
        link.download = `Journal_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setStatus({ type: 'success', message: 'ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว!' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingExcel(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handlePDFPrint}
          disabled={loadingPDF}
          className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md font-bold disabled:opacity-50 active:scale-95 text-sm"
        >
          {loadingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
          Export PDF
        </button>

        <button
          onClick={handleExcelExport}
          disabled={loadingExcel}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md font-bold disabled:opacity-50 active:scale-95 text-sm"
        >
          {loadingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          Export Excel
        </button>
      </div>

      {status.type && (
        <div className={`flex items-start gap-3 text-sm p-4 rounded-xl shadow-lg border-2 animate-in fade-in slide-in-from-top-2 w-full max-w-md ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="flex flex-col gap-1">
            <span className="font-black uppercase text-[10px] tracking-widest opacity-70">สถานะระบบ</span>
            <span className="font-bold leading-relaxed">{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
