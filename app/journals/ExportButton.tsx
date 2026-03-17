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

  // ฟังก์ชันดาวน์โหลด Blob แบบมาตรฐาน (ชัวร์ที่สุด)
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // ทำความสะอาดหลังดาวน์โหลด 1 วินาที
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 1000);
  };

  const handlePDFExport = async () => {
    setLoadingPDF(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await getJournalEntries();
      if (!result.success || !result.data) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(45, 85, 255);
      doc.text("GENERAL JOURNAL REPORT", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("MICRO ACCOUNTING SYSTEM", 14, 30);
      doc.text(`DATE PRINTED: ${new Date().toLocaleString('th-TH')}`, 14, 35);
      doc.setDrawColor(230);
      doc.line(14, 40, 196, 40);

      const tableData = result.data.map((entry: any) => [
        new Date(entry.entry_date).toLocaleDateString('th-TH'),
        entry.reference_no || "-",
        entry.account_name,
        entry.description,
        Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['DATE', 'REFERENCE', 'ACCOUNT NAME', 'DESCRIPTION', 'DEBIT', 'CREDIT']],
        body: tableData,
        headStyles: { fillColor: [45, 85, 255], textColor: 255, fontSize: 10, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
        columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' } },
        alternateRowStyles: { fillColor: [250, 251, 255] },
        margin: { top: 45 }
      });

      // ดึง Blob ออกมาแล้วดาวน์โหลดเองเพื่อให้มั่นใจว่าลงเครื่อง
      const pdfBlob = doc.output('blob');
      const filename = `Journal_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadBlob(pdfBlob, filename);
      
      setStatus({ type: 'success', message: 'บันทึกไฟล์ PDF ลงเครื่องเรียบร้อยแล้ว!' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: "PDF Error: " + err.message });
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
        // แปลง Base64 เป็น Blob
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const excelBlob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const filename = result.filename || `Journal_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        downloadBlob(excelBlob, filename);

        setStatus({ type: 'success', message: 'บันทึกไฟล์ Excel ลงเครื่องเรียบร้อยแล้ว!' });
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
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md font-bold disabled:opacity-50 active:scale-95"
        >
          {loadingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
          Export PDF
        </button>

        {/* Export Excel */}
        <button
          onClick={handleExcelExport}
          disabled={loadingExcel}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md font-bold disabled:opacity-50 active:scale-95"
        >
          {loadingExcel ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          Export Excel
        </button>

        {/* Google Sheets */}
        <button
          onClick={handleSheetsExport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 border-2 border-gray-100 rounded-xl hover:border-green-500 hover:shadow-lg transition-all font-bold disabled:opacity-50 active:scale-95"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-green-600" />}
          Google Sheets
        </button>
      </div>

      {status.type && (
        <div className={`flex items-start gap-3 text-sm p-4 rounded-xl shadow-lg border-2 animate-in fade-in slide-in-from-top-2 w-full max-w-md ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="flex flex-col gap-1">
            <span className="font-black uppercase text-[10px] tracking-widest opacity-70">
              สถานะ: {status.type === 'success' ? 'ดาวน์โหลดสำเร็จ' : 'แจ้งเตือน'}
            </span>
            <span className="font-bold leading-relaxed">{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
