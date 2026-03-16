"use client";
import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { exportJournalsToSheets, exportJournalsToExcel } from '@/app/actions';

const ExportButton = () => {
  const [loading, setLoading] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

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
        {/* ปุ่ม Export Excel */}
        <button
          onClick={handleExcelExport}
          disabled={loadingExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all shadow-sm font-medium disabled:opacity-50 active:scale-95"
        >
          {loadingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Export Excel
        </button>

        {/* ปุ่ม Google Sheets */}
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
        <div className={`flex items-start gap-2 text-sm p-4 rounded-xl animate-in fade-in slide-in-from-top-1 shadow-sm border ${
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-100' : 'bg-red-50 text-red-800 border-red-100'
        } max-w-md w-full`}>
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
