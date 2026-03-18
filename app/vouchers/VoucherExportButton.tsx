
"use client";
import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { exportVouchersToSheets } from '@/app/actions';

const VoucherExportButton = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleExport = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });
    try {
      const result = await exportVouchersToSheets();
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        setStatus({ type: 'success', message: 'ส่งออกใบสำคัญจ่ายไปยัง Google Sheets เรียบร้อย!' });
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleExport}
        disabled={loading}
        className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
        Export to Sheets
      </button>

      {status.type && (
        <div className={cn(
          "fixed bottom-10 right-10 flex items-start gap-3 p-4 rounded-xl shadow-2xl border-2 animate-in slide-in-from-bottom-5 duration-500 z-50",
          status.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        )}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple utility to use cn outside of main components if needed
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default VoucherExportButton;
