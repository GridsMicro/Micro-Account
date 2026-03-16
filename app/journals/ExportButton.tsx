"use client";
import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader2, AlertCircle, CheckCircle2, FileText, Printer } from 'lucide-react';
import { exportJournalsToSheets, exportJournalsToExcel, getJournalEntries } from '@/app/actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportButton = () => {
  const [loading, setLoading] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handlePDFExport = async () => {
    setLoadingPDF(true);
    setStatus({ type: null, message: '' });
    try {
      // 1. ดึงข้อมูลเด็ดๆ มาใช้งาน
      const result = await getJournalEntries();
      if (!result.success || !result.data) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");

      const doc = new jsPDF();
      
      // 2. ออกแบบ Header รายงาน
      doc.setFontSize(22);
      doc.setTextColor(45, 85, 255); // สีน้ำเงิน Brand
      doc.text("GENERAL JOURNAL REPORT", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("MICRO ACCOUNTING SYSTEM | INNOVATION FOR THE FUTURE", 14, 30);
      doc.text(`DATE PRINTED: ${new Date().toLocaleString('th-TH')}`, 14, 35);
      
      doc.setDrawColor(230);
      doc.line(14, 40, 196, 40);

      // 3. เตรียมข้อมูลตาราง (เน้นภาษาอังกฤษเป็นหลักเพื่อความคมชัด)
      const tableData = result.data.map((entry: any) => [
        new Date(entry.entry_date).toLocaleDateString('th-TH'),
        entry.reference_no || "-",
        entry.account_name,
        entry.description,
        Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]);

      // 4. สร้างตารางแบบ High-End
      autoTable(doc, {
        startY: 45,
        head: [['DATE', 'REFERENCE', 'ACCOUNT NAME', 'DESCRIPTION', 'DEBIT', 'CREDIT']],
        body: tableData,
        headStyles: { 
          fillColor: [45, 85, 255], 
          textColor: 255, 
          fontSize: 10, 
          fontStyle: 'bold',
          halign: 'center' 
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          valign: 'middle'
        },
        columnStyles: {
          4: { halign: 'right' }, // Debit
          5: { halign: 'right' }, // Credit
        },
        alternateRowStyles: { fillColor: [250, 251, 255] },
        margin: { top: 45 }
      });

      // 5. เซฟไฟล์ลงเครื่องพี่ทันที!
      doc.save(`Journal_Report_${new Date().getTime()}.pdf`);
      setStatus({ type: 'success', message: 'สร้างรายงาน PDF พรีเมียมและดาวน์โหลดเรียบร้อยแล้ว!' });
      
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: "เกิดข้อผิดพลาดในการสร้าง PDF: " + err.message });
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
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || 'export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setStatus({ type: 'success', message: 'ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว!' });
      } else {
        setStatus({ type: 'error', message: result.error || 'เกิดข้อผิดพลาดในการสร้างไฟล์' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoadingExcel(false);
    }
  };

  const handleSheetsExport = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await exportJournalsToSheets();
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        setStatus({ type: 'success', message: 'ส่งออกไปยัง Google Sheets สำเร็จ!' });
      } else {
        setStatus({ type: 'error', message: result.error || 'เกิดข้อผิดพลาด' });
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex flex-wrap gap-2">
        {/* Export PDF */}
        <button
          onClick={handlePDFExport}
          disabled={loadingPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all shadow-sm font-medium disabled:opacity-50 active:scale-95"
          title="ดาวน์โหลดเป็น PDF สำหรับพิมพ์"
        >
          {loadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          Export PDF
        </button>

        {/* Export Excel */}
        <button
          onClick={handleExcelExport}
          disabled={loadingExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-sm font-medium disabled:opacity-50 active:scale-95"
        >
          {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Export Excel
        </button>

        {/* Google Sheets */}
        <button
          onClick={handleSheetsExport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:shadow-md transition-all font-medium disabled:opacity-50 active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-green-600" />}
          Export Google Sheets
        </button>
      </div>

      {status.type && (
        <div className={`flex items-start gap-2 text-sm p-4 rounded-xl animate-in fade-in shadow-sm border ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'
        } max-w-md w-full animate-in slide-in-from-top-1`}>
          {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <div className="flex flex-col gap-1">
            <span className="font-bold underline uppercase text-[10px] tracking-widest opacity-70">
              {status.type === 'success' ? 'สำเร็จ' : 'แจ้งเตือนระบบ'}
            </span>
            <span className="break-words font-medium leading-relaxed">{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
