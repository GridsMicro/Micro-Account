"use client";
import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader2, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
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
        // สร้างระบบดาวน์โหลดไฟล์ใน Browser
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

      {/* แจ้งเตือนเมื่อผิดพลาด */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-start gap-3 max-w-xs animate-in shake-1">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <p className="text-[11px] font-bold text-red-800 uppercase tracking-wider">เกิดปัญหาตอนดึงข้อมูล</p>
            <p className="text-[10px] text-red-600 font-medium leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
