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

      // ชื่อไฟล์ PDF ที่ชัดเจน
      const filename = `Journal_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      setStatus({ type: 'success', message: `บันทึกไฟล์ ${filename} เรียบร้อย!` });
    } catch (err: any) {
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
        // บังคับดาวน์โหลดด้วยวิธีกำชับชื่อไฟล์
        const base64Data = result.data;
        const filename = result.filename || `Journal_Export_${Date.now()}.xlsx`;
        
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setStatus({ type: 'success', message: `บันทึกไฟล์ ${filename} เรียบร้อย!` });
      } else {
        setStatus({ type: 'error', message: result.error || 'เกิดข้อผิดพลาด' });
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
        <button
          onClick={handlePDFExport}
          disabled={loadingPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-all shadow-sm font-medium disabled:opacity-50 active:scale-95"
        >
          {loadingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
          Export PDF
        </button>

        <button
          onClick={handleExcelExport}
          disabled={loadingExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-sm font-medium disabled:opacity-50 active:scale-95"
        >
          {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Export Excel
        </button>

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
        } max-w-md w-full animation-in slide-in-from-top-1`}>
          {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <div className="flex flex-col gap-1">
            <span className="font-bold underline uppercase text-[10px] tracking-widest opacity-70">
              {status.type === 'success' ? 'สำเร็จ' : 'แจ้งเตือน'}
            </span>
            <span className="break-words font-medium leading-relaxed">{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;
