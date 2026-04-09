"use client";

import { useState } from "react";
import { 
  Database, 
  Download, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  FileJson,
  FileCode
} from "lucide-react";
import Link from "next/link";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleBackup = async (format: 'sql' | 'json') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/backup?format=${format}`);
      if (!response.ok) throw new Error("Backup failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `micro_account_backup_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setComplete(true);
      setTimeout(() => setComplete(false), 5000);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการ Backup ครับพี่!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/" className="bg-white p-3 rounded-2xl shadow-sm hover:text-blue-600 transition-all border border-slate-100">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Database className="text-blue-600" /> Database Management
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">System Administration & Security</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Main Action Card */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200 border border-slate-100 space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Database size={120} />
             </div>
             
             <div>
                <h2 className="text-xl font-black text-slate-800 mb-2">สำรองข้อมูล (Create Backup)</h2>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                   แนะนำให้พี่ทำการ Backup ข้อมูลก่อนทำการสะสางโครงสร้าง 2 ยุคครับ
                   เพื่อความปลอดภัยของข้อมูลบัญชีทั้งหมด
                </p>
             </div>

             <div className="space-y-4">
                <button 
                  onClick={() => handleBackup('sql')}
                  disabled={loading}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-between px-6 transition-all group shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                   <div className="flex items-center gap-4 text-left">
                      <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                         <FileCode size={24} />
                      </div>
                      <div>
                         <p className="font-bold text-sm">Download SQL Schema</p>
                         <p className="text-[10px] opacity-70 font-medium uppercase tracking-widest">Recommended for Developers</p>
                      </div>
                   </div>
                   {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                </button>

                <button 
                  onClick={() => handleBackup('json')}
                  disabled={loading}
                  className="w-full h-16 bg-white border-2 border-slate-100 hover:border-violet-200 hover:bg-violet-50 text-slate-700 rounded-2xl flex items-center justify-between px-6 transition-all group disabled:opacity-50"
                >
                   <div className="flex items-center gap-4 text-left">
                      <div className="bg-violet-100 text-violet-600 p-2 rounded-xl group-hover:scale-110 transition-transform">
                         <FileJson size={24} />
                      </div>
                      <div>
                         <p className="font-bold text-sm text-slate-800">Download JSON Data</p>
                         <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">For Data Analysis & Audit</p>
                      </div>
                   </div>
                   {loading ? <Loader2 className="animate-spin" /> : <Download size={20} className="text-slate-300" />}
                </button>
             </div>

             {complete && (
               <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-700 animate-in fade-in slide-in-from-bottom-4">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-bold uppercase tracking-tight">Backup Downloaded Successfully!</span>
               </div>
             )}
          </div>

          {/* Info Card */}
          <div className="space-y-6">
             <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                <ShieldAlert className="text-amber-500 mb-6" size={32} />
                <h3 className="text-lg font-black mb-3">คำเตือนการจัดการระบบ</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
                   ไฟล์ Backup จะประกอบด้วยข้อมูลที่ละเอียดอ่อน เช่น รายชื่อลูกค้า, รายได้ส่วนบุคคล และการตั้งค่าระบบ 
                   กรุณาเก็บรักษาไฟล์ไว้อย่างระมัดระวัง พี่ยอดเยี่ยมมากที่รอบคอบครับ!
                </p>
                <div className="flex items-center gap-3 py-3 border-t border-white/10">
                   <Clock size={16} className="text-slate-500" />
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Backup: Never</span>
                </div>
             </div>

             <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-4">สถานะเซิร์ฟเวอร์</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">PostgreSQL Engine</span>
                      <span className="text-emerald-500 font-black tracking-tighter uppercase flex items-center gap-1.5">
                         <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> ONLINE
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Storage Cluster</span>
                      <span className="text-emerald-500 font-black tracking-tighter uppercase">Neon (Asia-SE)</span>
                   </div>
                </div>
             </div>
          </div>

        </div>

        <div className="text-center mt-20 opacity-20 hover:opacity-100 transition-opacity">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">System Recovery Console • Microtronic Labs 2026</p>
        </div>
      </div>
    </main>
  );
}
