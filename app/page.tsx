import { query } from "@/lib/db";
import { 
  Building2, 
  Users, 
  Receipt, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  Settings,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    const company = await query('SELECT * FROM company_settings LIMIT 1');
    const stats = {
      totalInvoices: await query('SELECT COUNT(*) FROM invoices'),
      totalEarnings: await query('SELECT SUM(net_amount) FROM invoices WHERE status = \'paid\''),
      totalCustomers: await query('SELECT COUNT(*) FROM contacts'),
      pendingInvoices: await query('SELECT COUNT(*) FROM invoices WHERE status != \'paid\'')
    };

    return {
      company: company.rows[0],
      stats: {
        invoices: stats.totalInvoices.rows[0].count,
        earnings: stats.totalEarnings.rows[0].sum || 0,
        customers: stats.totalCustomers.rows[0].count,
        pending: stats.pendingInvoices.rows[0].count
      }
    };
  } catch (error) {
    console.error("Dashboard DB Error:", error);
    return {
      company: null,
      stats: { invoices: 0, earnings: 0, customers: 0, pending: 0 }
    };
  }
}

export default async function Dashboard() {
  const data = await getDashboardData();
  const { company, stats } = data;

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">หน้าแรก (Dashboard)</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>ภาพรวมระบบจัดการบัญชี</span>
            </div>
          </div>
          <div className="flex gap-2 text-xs font-medium text-gray-500">
            <span>Home</span>
            <span>/</span>
            <span className="text-gray-400">Dashboard</span>
          </div>
        </div>

        {/* Stats Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1 */}
          <div className="bg-white rounded shadow-sm border-l-4 border-blue-500 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ใบแจ้งหนี้ทั้งหมด</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.invoices}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded text-blue-500">
              <Receipt size={24} />
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-white rounded shadow-sm border-l-4 border-green-500 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">รายได้สุทธิ (ที่ชำระแล้ว)</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">฿{Number(stats.earnings).toLocaleString()}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded text-green-500">
              <TrendingUp size={24} />
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-white rounded shadow-sm border-l-4 border-cyan-500 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">จำนวนลูกค้า</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.customers}</h3>
            </div>
            <div className="bg-cyan-50 p-3 rounded text-cyan-500">
              <Users size={24} />
            </div>
          </div>
          {/* Card 4 */}
          <div className="bg-white rounded shadow-sm border-l-4 border-yellow-500 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">รอดำเนินการ</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.pending}</h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-yellow-500">
              <BarChart3 size={24} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Company Info Card */}
          <div className="lg:col-span-2 bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                   <Building2 size={18} /> ข้อมูลบริษัทปัจจุบัน
                </h3>
             </div>
             <div className="p-8">
                {company ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center text-white text-3xl font-bold">
                          {company.name.charAt(0)}
                       </div>
                       <div>
                          <h2 className="text-2xl font-bold text-gray-800">{company.name}</h2>
                          <p className="text-gray-500 font-medium">เลขประจำตัวผู้เสียภาษี: {company.tax_id}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 uppercase text-xs font-bold tracking-wider">
                       <div className="space-y-1">
                          <p className="text-gray-400">อีเมลติดต่อ</p>
                          <p className="text-gray-700">{company.email}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-gray-400">เบอร์โทรศัพท์</p>
                          <p className="text-gray-700">{company.phone}</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 italic">ยังไม่ได้ตั้งค่าข้อมูลบริษัท</p>
                )}
             </div>
             <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-right">
                <Link href="/settings" className="text-blue-600 text-sm font-bold flex items-center justify-end gap-1 hover:underline">
                   ตั้งค่าแก้ไขข้อมูล <ArrowRight size={14} />
                </Link>
             </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded shadow-sm border border-gray-200 flex flex-col">
             <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <h3 className="font-bold text-gray-700">ทางลัดจัดการ (Quick Actions)</h3>
             </div>
             <div className="p-6 flex-1 space-y-3">
                <Link href="/invoices/new" className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-600 hover:text-white rounded border border-gray-200 transition-all font-bold text-sm group">
                   <span>สร้างใบแจ้งหนี้ใหม่</span>
                   <Plus size={18} className="text-blue-600 group-hover:text-white" />
                </Link>
                <Link href="/quotations/new" className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-600 hover:text-white rounded border border-gray-200 transition-all font-bold text-sm group">
                   <span>สร้างใบเสนอราคาใหม่</span>
                   <Plus size={18} className="text-blue-600 group-hover:text-white" />
                </Link>
                <Link href="/inventory" className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-600 hover:text-white rounded border border-gray-200 transition-all font-bold text-sm group">
                   <span>ตรวจสอบสต็อกสินค้า</span>
                   <ArrowRight size={18} className="text-blue-600 group-hover:text-white" />
                </Link>
             </div>
          </div>
        </div>

        {/* Small Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           Copyright © 2026 <span className="text-gray-600 font-bold">Microtronic Thailand</span>. All rights reserved.
        </div>
      </div>
    </main>
  );
}
