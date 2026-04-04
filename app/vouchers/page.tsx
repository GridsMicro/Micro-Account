"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ScrollText, 
  Plus, 
  Printer, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  Search,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import VoucherExportButton from "./VoucherExportButton";

interface Voucher {
  id: number;
  voucher_no: string;
  payee_name: string;
  issue_date: string;
  amount: number;
  wht_rate?: number;
  wht_amount?: number;
  net_payment?: number;
  payment_method: string;
  status: string;
  receipt_url?: string;
}

interface MonthlySummary {
  month: number;
  year: number;
  monthName: string;
  totalVouchers: number;
  totalAmount: number;
  totalWht: number;
  netPayment: number;
  vouchers: Voucher[];
}

export default function PaymentVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showSummary, setShowSummary] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "monthly">("all");

  // Calculate monthly summaries
  const monthlySummaries = useMemo(() => {
    const summaries = new Map<string, MonthlySummary>();
    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    
    vouchers.forEach(v => {
      const date = new Date(v.issue_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!summaries.has(key)) {
        summaries.set(key, {
          month: date.getMonth(),
          year: date.getFullYear(),
          monthName: monthNames[date.getMonth()],
          totalVouchers: 0,
          totalAmount: 0,
          totalWht: 0,
          netPayment: 0,
          vouchers: []
        });
      }
      
      const summary = summaries.get(key)!;
      summary.totalVouchers++;
      summary.totalAmount += Number(v.amount || 0);
      summary.totalWht += Number(v.wht_amount || 0);
      summary.netPayment += Number(v.net_payment || v.amount || 0);
      summary.vouchers.push(v);
    });
    
    return Array.from(summaries.values()).sort((a, b) => 
      b.year - a.year || b.month - a.month
    );
  }, [vouchers]);

  // Filter vouchers
  const filteredVouchers = useMemo(() => {
    let filtered = vouchers;
    
    // Filter by search
    if (search) {
      filtered = filtered.filter(v => 
        v.voucher_no?.toLowerCase().includes(search.toLowerCase()) ||
        v.payee_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by month
    if (selectedMonth !== null && viewMode === "monthly") {
      filtered = filtered.filter(v => {
        const date = new Date(v.issue_date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    }
    
    return filtered.sort((a, b) => 
      new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
    );
  }, [vouchers, search, selectedMonth, selectedYear, viewMode]);

  // Fetch vouchers
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/vouchers');
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers || []);
      }
    } catch (e) {
      console.error('Failed to fetch vouchers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
               <ScrollText className="text-blue-600" /> ใบสำคัญจ่าย (Payment Vouchers)
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>พิมพ์เอกสารสรุปยอดปลายเดือนสำหรับการทำบัญชี และลงสมุดรายวัน (Journal)</span>
            </div>
          </div>
          <div className="flex gap-2">
             <VoucherExportButton />
             <Link href="/journals" className="h-11 px-6 bg-white border border-gray-300 text-blue-700 font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm hover:bg-blue-50">
                <BookOpen size={18} /> สมุดบัญชีรายวัน
             </Link>
             <Link href="/vouchers/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm">
                <Plus size={18} />
                ออกใบสำคัญจ่าย
             </Link>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setViewMode("all"); setSelectedMonth(null); }}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm transition-all",
              viewMode === "all" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            <Filter size={14} className="inline mr-2" />
            ทั้งหมด
          </button>
          <button
            onClick={() => setViewMode("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg font-bold text-sm transition-all",
              viewMode === "monthly" 
                ? "bg-blue-600 text-white shadow-md" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            <Calendar size={14} className="inline mr-2" />
            รายงานรายเดือน
          </button>
        </div>

        {/* Monthly Summary Cards */}
        {viewMode === "monthly" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">เลือกเดือนที่ต้องการดู</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedYear(y => y - 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold text-gray-800">
                  {selectedYear + 543}
                </span>
                <button
                  onClick={() => setSelectedYear(y => y + 1)}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {monthlySummaries
                .filter(s => s.year === selectedYear)
                .map((summary) => (
                <button
                  key={`${summary.year}-${summary.month}`}
                  onClick={() => setSelectedMonth(selectedMonth === summary.month ? null : summary.month)}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all text-left",
                    selectedMonth === summary.month
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  )}
                >
                  <p className="text-xs text-gray-500 uppercase font-bold">{summary.monthName}</p>
                  <p className="text-lg font-black text-gray-800 mt-1">
                    ฿{summary.netPayment.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{summary.totalVouchers} รายการ</p>
                </button>
              ))}
              
              {monthlySummaries.filter(s => s.year === selectedYear).length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
                  ไม่มีข้อมูลใบสำคัญจ่ายในปี {selectedYear + 543}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Action Bar */}
        {(selectedMonth !== null || filteredVouchers.length > 0) && (
          <div className="bg-white border-l-4 border-l-blue-600 shadow-sm border border-gray-200 rounded-lg p-6 mb-6 flex justify-between items-center">
             <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-full border border-blue-100">
                   <Printer size={24} />
                </div>
                <div className="flex flex-col">
                   <span className="font-bold text-gray-800 text-base">
                     {selectedMonth !== null 
                       ? `รายงานเดือน${monthlySummaries.find(s => s.month === selectedMonth && s.year === selectedYear)?.monthName} ${selectedYear + 543}`
                       : `รายงานสรุป (${filteredVouchers.length} รายการ)`
                     }
                   </span>
                   <span className="text-gray-500 text-sm">
                     ยอดรวม: ฿{filteredVouchers.reduce((sum, v) => sum + Number(v.net_payment || v.amount || 0), 0).toLocaleString()}
                   </span>
                </div>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => handlePrintSummary()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2"
                >
                   <Printer size={18} /> พิมพ์รายงาน
                </button>
                {selectedMonth !== null && (
                  <button
                    onClick={() => setSelectedMonth(null)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold"
                  >
                    <X size={18} />
                  </button>
                )}
             </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาเลขที่ใบสำคัญ หรือชื่อผู้รับเงิน..." 
                className="w-full pl-11 pr-4 h-11 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm font-medium transition-all" 
              />
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setSearch("")}
                className="h-11 px-6 bg-white border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
              >
                 ล้างค่า
              </button>
           </div>
        </div>

        {/* Vouchers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm flex items-center gap-2">
                 <ScrollText size={16} className="text-blue-500" /> 
                 {selectedMonth !== null ? 'รายการใบสำคัญจ่ายในเดือน' : 'รายการใบสำคัญจ่ายทั้งหมด'}
                 <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                   {filteredVouchers.length} รายการ
                 </span>
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ใบสำคัญ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ผู้รับเงิน</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ออก</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">ยอดตามใบแจ้งหนี้</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">หัก ณ ที่จ่าย</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">ยอดจ่ายจริง</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-400 text-sm mt-2">กำลังโหลด...</p>
                      </td>
                    </tr>
                  ) : filteredVouchers.length > 0 ? filteredVouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-800">{v.voucher_no || `PV-${String(v.id).padStart(5, '0')}`}</span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 opacity-80 mt-1">{v.payment_method || 'เงินสด'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">{v.payee_name || 'ไม่ระบุ'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                         {v.issue_date ? new Date(v.issue_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">
                         ฿{Number(v.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {v.wht_amount && v.wht_amount > 0 ? (
                          <span className="text-red-600 font-medium text-sm">
                            - ฿{Number(v.wht_amount).toLocaleString()}
                            <span className="text-[10px] text-red-400 block">({v.wht_rate}%)</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600">
                         ฿{Number(v.net_payment || v.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handlePrintVoucher(v)}
                              className="p-2 border border-purple-200 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all shadow-sm" 
                              title="พิมพ์ใบสำคัญจ่าย"
                            >
                               <Printer size={16} />
                            </button>
                         </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="py-24 text-center text-gray-400 font-bold italic">
                         ไม่พบรายการใบสำคัญจ่าย
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6 mt-12">
           <p className="font-bold mb-1">© 2026 สงวนลิขสิทธิ์โดย บริษัท ไมโครทรอนิก (ไทยแลนด์) จำกัด</p>
           <p className="italic opacity-80">เราสร้าง Software เฉพาะทาง เพื่อขับเคลื่อนธุรกิจให้ก้าวล้ำ</p>
        </div>
      </div>
    </main>
  );

  // Print monthly summary
  function handlePrintSummary() {
    const vouchersToPrint = selectedMonth !== null 
      ? monthlySummaries.find(s => s.month === selectedMonth && s.year === selectedYear)?.vouchers || []
      : filteredVouchers;
    
    const totalAmount = vouchersToPrint.reduce((sum, v) => sum + Number(v.amount || 0), 0);
    const totalWht = vouchersToPrint.reduce((sum, v) => sum + Number(v.wht_amount || 0), 0);
    const netPayment = vouchersToPrint.reduce((sum, v) => sum + Number(v.net_payment || v.amount || 0), 0);
    
    const monthNames = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 
                        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const summary = selectedMonth !== null ? monthlySummaries.find(s => s.month === selectedMonth && s.year === selectedYear) : null;
    const periodText = summary 
      ? `เดือน${summary.monthName} ${summary.year + 543}`
      : 'ทั้งหมด';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>รายงานสรุปใบสำคัญจ่าย - ${periodText}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; max-width: 1000px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #2563eb; font-size: 28px; }
            .header h2 { margin: 10px 0 0; color: #666; font-size: 18px; font-weight: normal; }
            .summary-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; }
            .summary-item h3 { margin: 0; font-size: 14px; color: #64748b; font-weight: normal; }
            .summary-item p { margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 12px; }
            td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            tr:hover { background: #f8fafc; }
            .text-right { text-align: right; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; }
            .sign-box { width: 200px; text-align: center; }
            .sign-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>รายงานสรุปใบสำคัญจ่าย</h1>
            <h2>งวด ${periodText}</h2>
          </div>
          
          <div class="summary-box">
            <div class="summary-grid">
              <div class="summary-item">
                <h3>จำนวนรายการ</h3>
                <p>${vouchersToPrint.length} รายการ</p>
              </div>
              <div class="summary-item">
                <h3>ยอดตามใบแจ้งหนี้</h3>
                <p>฿${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div class="summary-item">
                <h3>หัก ณ ที่จ่ายรวม</h3>
                <p style="color: #dc2626;">- ฿${totalWht.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #cbd5e1;">
              <span style="font-size: 14px; color: #64748b;">ยอดจ่ายสุทธิ: </span>
              <span style="font-size: 28px; font-weight: bold; color: #059669;">฿${netPayment.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th width="8%">ลำดับ</th>
                <th width="15%">เลขที่ใบสำคัญ</th>
                <th width="20%">ผู้รับเงิน</th>
                <th width="12%">วันที่</th>
                <th width="15%" class="text-right">ยอดตามใบแจ้งหนี้</th>
                <th width="12%" class="text-right">หัก ณ ที่จ่าย</th>
                <th width="15%" class="text-right">ยอดจ่ายจริง</th>
              </tr>
            </thead>
            <tbody>
              ${vouchersToPrint.map((v, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${v.voucher_no || `PV-${String(v.id).padStart(5, '0')}`}</strong></td>
                  <td>${v.payee_name || '-'}</td>
                  <td>${new Date(v.issue_date).toLocaleDateString('th-TH')}</td>
                  <td class="text-right">฿${Number(v.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td class="text-right">${v.wht_amount && v.wht_amount > 0 ? `<span style="background: #fecaca; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold;">${v.wht_rate}%</span> ฿${Number(v.wht_amount).toLocaleString()}` : '-'}</td>
                  <td class="text-right"><strong>฿${Number(v.net_payment || v.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <div class="sign-box">
              <div class="sign-line">ผู้จัดทำ<br>วันที่ ....../....../......</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">ผู้ตรวจสอบ<br>วันที่ ....../....../......</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">ผู้อนุมัติ<br>วันที่ ....../....../......</div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8;">
            รายงานนี้สร้างจากระบบ Micro-Account | วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Print single voucher
  function handlePrintVoucher(voucher: Voucher) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>ใบสำคัญจ่าย - ${voucher.voucher_no}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
            body { font-family: 'Sarabun', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; }
            .voucher { border: 2px solid #2563eb; padding: 30px; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; color: #2563eb; font-size: 24px; }
            .header h2 { margin: 5px 0 0; color: #666; font-size: 14px; }
            .grid { display: grid; grid-template-columns: 120px 1fr; gap: 15px; margin-bottom: 20px; }
            .grid label { font-weight: bold; color: #64748b; }
            .grid div { padding: 8px 12px; background: #f8fafc; border-radius: 4px; }
            .amount-box { background: #ecfdf5; border: 2px solid #059669; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .amount-box h3 { margin: 0 0 10px; color: #059669; font-size: 14px; }
            .amount-box p { margin: 0; font-size: 32px; font-weight: bold; color: #1e293b; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .sign { width: 200px; text-align: center; }
            .sign-line { border-top: 1px solid #333; padding-top: 10px; font-size: 12px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <h1>ใบสำคัญจ่าย (PAYMENT VOUCHER)</h1>
              <h2>PV-${String(voucher.id).padStart(5, '0')}</h2>
            </div>
            
            <div class="grid">
              <label>ผู้รับเงิน:</label>
              <div>${voucher.payee_name || '-'}</div>
              
              <label>วันที่:</label>
              <div>${new Date(voucher.issue_date).toLocaleDateString('th-TH')}</div>
              
              <label>ช่องทาง:</label>
              <div>${voucher.payment_method || 'เงินสด'}</div>
            </div>

            <div class="amount-box">
              <h3>จำนวนเงินที่จ่าย</h3>
              <p>฿${Number(voucher.amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              ${voucher.wht_amount && voucher.wht_amount > 0 ? `<p style="font-size: 14px; margin-top: 10px; color: #dc2626;">(หัก ณ ที่จ่าย ${voucher.wht_rate}%: ฿${Number(voucher.wht_amount).toLocaleString()})</p>` : ''}
            </div>

            <div class="signatures">
              <div class="sign"><div class="sign-line">ผู้จัดทำ</div></div>
              <div class="sign"><div class="sign-line">ผู้อนุมัติ</div></div>
              <div class="sign"><div class="sign-line">ผู้รับเงิน</div></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}
