"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Scale,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Users,
  Building,
  CreditCard
} from "lucide-react";

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [unreconciledEntries, setUnreconciledEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // TODO: Implement reconciliation data fetching
    // Mock data for demonstration
    const mockReconciliations = [
      {
        id: 1,
        date: '2026-04-01',
        accountName: 'เงินสด/ธนาคารกรุงเทย',
        accountCode: '1112',
        expectedBalance: 150000.00,
        actualBalance: 148750.00,
        difference: -1250.00,
        status: 'unreconciled',
        lastReconciled: '2026-03-15'
      },
      {
        id: 2,
        date: '2026-04-01',
        accountName: 'ลูกหนี้การค้า - บริษัท A',
        accountCode: '1121',
        expectedBalance: 285000.00,
        actualBalance: 285000.00,
        difference: 0.00,
        status: 'reconciled',
        lastReconciled: '2026-04-01'
      }
    ];

    const mockUnreconciledEntries = [
      {
        id: 1,
        date: '2026-04-01',
        description: 'ค่าเช่าสถานที่ไม่ตรงกับใบเสร็จ',
        amount: 2500.00,
        accountName: 'ค่าเช่าสถานที่',
        accountCode: '5320',
        journalEntryId: 12345,
        status: 'pending'
      },
      {
        id: 2,
        date: '2026-04-01',
        description: 'ภาษีซื้อที่ไม่สามารถนำไปหักลดหย่อน',
        amount: 1800.00,
        accountName: 'ภาษีซื้อที่นำไปหักลดหย่อน',
        accountCode: '1140',
        journalEntryId: 12346,
        status: 'pending'
      }
    ];

    setReconciliations(mockReconciliations);
    setUnreconciledEntries(mockUnreconciledEntries);
    setLoading(false);
  }, []);

  const filteredReconciliations = reconciliations.filter(r => 
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  const stats = {
    total: reconciliations.length,
    reconciled: reconciliations.filter(r => r.status === 'reconciled').length,
    unreconciled: reconciliations.filter(r => r.status === 'unreconciled').length,
    totalDifference: Math.abs(reconciliations.reduce((sum, r) => sum + r.difference, 0))
  };

  return (
    <main className="min-h-screen bg-[#f8f5ff] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Link
              href="/accounting"
              className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-violet-600"
            >
              <ArrowLeft size={16} /> กลับหน้าบัญชีการ
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
              <span className="rounded-2xl bg-indigo-500 p-3 shadow-lg shadow-indigo-200">
                <Scale className="h-6 w-6 text-white" />
              </span>
              การตรวจสอบบัญชี (Reconciliation)
            </h1>
            <p className="ml-1 mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              Double-Entry Verification & Balance Sheet Integrity
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex h-12 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-black text-white shadow-xl shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-600 active:scale-95">
              <RefreshCw size={18} /> ตรวจสอบใหม่
            </button>
            <button className="h-12 px-6 bg-white border border-violet-100 text-violet-600 font-medium rounded-xl flex items-center gap-3 shadow-sm hover:-translate-y-0.5 hover:bg-violet-50 transition-all">
              <FileText size={18} /> ส่งออกรายง
            </button>
          </div>
        </div>

        {/* Reconciliation Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.reconciled}</h3>
                <p className="text-sm text-slate-500">ตรวจสอบแล้วเรียบร้อย</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">บัญชีที่ตรวจสอบแล้ว</p>
              <p className="text-lg font-bold text-emerald-600">{((stats.reconciled / stats.total) * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.unreconciled}</h3>
                <p className="text-sm text-slate-500">ยังไม่ตรวจสอบ</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">บัญชีที่ยังไม่ตรวจสอบ</p>
              <p className="text-lg font-bold text-amber-600">{((stats.unreconciled / stats.total) * 100).toFixed(1)}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                <TrendingUp className="text-rose-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">฿{stats.totalDifference.toLocaleString()}</h3>
                <p className="text-sm text-slate-500">ผลต่างทั้งหมด</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">ยอดรวมของความต่าง</p>
              <p className="text-lg font-bold text-rose-600">รวม</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center">
                <Calendar className="text-violet-600" size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
                <p className="text-sm text-slate-500">บัญชีทั้งหมด</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 uppercase tracking-wider">บัญชีทั้งหมด</p>
              <p className="text-lg font-bold text-violet-600">รายการ</p>
            </div>
          </div>
        </div>

        {/* 4-Block Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Block 1: Reconciliation Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-linear-to-r from-violet-50 to-indigo-50 px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Scale className="text-violet-600" size={20} />
                <h2 className="text-xl font-bold text-slate-900">สถานะบัญชี</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="reconciled">ตรวจสอบแล้ว</option>
                  <option value="unreconciled">ยังไม่ตรวจสอบ</option>
                </select>
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="current-month">เดือนปัจจุบัน</option>
                  <option value="last-quarter">ไตรมาสดที่แล้ว</option>
                  <option value="fiscal-year">ปีบัญชี</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredReconciliations.map((reconciliation) => (
                  <div key={reconciliation.id} className="border-l border-slate-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Building className="text-slate-400" size={16} />
                        <div>
                          <h4 className="font-semibold text-slate-900">{reconciliation.accountName}</h4>
                          <p className="text-xs text-slate-500">รหัสบัญชี: {reconciliation.accountCode}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        reconciliation.status === 'reconciled' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : reconciliation.status === 'unreconciled'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {reconciliation.status === 'reconciled' ? 'ตรวจสอบแล้ว' : reconciliation.status === 'unreconciled' ? 'ยังไม่ตรวจสอบ' : 'กำลังอยู่'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">ยอดคงปัจจุบ</p>
                        <p className="font-semibold text-slate-900">฿{reconciliation.expectedBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">ยอดคงจริม</p>
                        <p className="font-semibold text-slate-900">฿{reconciliation.actualBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">ผลต่าง</p>
                        <p className={`font-semibold ${
                          reconciliation.difference === 0 ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          <span>{`฿${Number(reconciliation.difference).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`}</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black ${
                          reconciliation.difference === 0 
                            ? "bg-emerald-50 text-emerald-700" 
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {reconciliation.difference === 0 ? (
                            <>
                              <CheckCircle2 size={10} />
                              ตรงกัน
                            </>
                          ) : (
                            <>
                              <AlertCircle size={10} />
                              ไม่ตรงกัน
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-8 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
            Accounting Reconciliation - Micro-Account 2026
          </p>
        </div>
      </div>
    </main>
  );
}
