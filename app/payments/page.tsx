"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Payment {
  id: string;
  payment_date: string;
  customer_name: string | null;
  payment_no: string | null;
  amount: number;
  payment_method: string | null;
  invoice_id: string | null;
}

const MANAGER_ROLES = ['MANAGER', 'ADMIN', 'SUPERADMIN'];

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || "";
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const canDelete = userRole ? MANAGER_ROLES.includes(userRole.toUpperCase()) : false;

  useEffect(() => {
    fetchPayments();
    fetchUserRole();
  }, [search]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.user?.role || null);
      }
    } catch (e) {
      console.error('Failed to fetch user role');
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/payments?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันลบรายการนี้? ข้อมูลจะถูกลบถาวร')) return;
    
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPayments(payments.filter(p => p.id !== id));
      }
    } catch (e) {
      alert('ลบไม่สำเร็จ');
    }
  };

  const handlePrint = (payment: Payment) => {
    window.open(`/payments/print/${payment.id}`, '_blank');
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ประวัติการชำระเงิน (Payments)</h1>
            <p className="text-sm text-gray-500 mt-1">ติดตามการรับเงินเข้าสู่ระบบบริษัท</p>
          </div>
          <Link href="/payments/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm">
            <Plus size={18} />
            บันทึกการรับเงิน
          </Link>
        </div>

        {/* Search Bar */}
        <form method="GET" className="flex flex-col md:flex-row gap-4 items-center mb-8">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="ค้นหาชื่อลูกค้า หรือเลขที่อ้างอิง..." 
                className="w-full pl-14 pr-6 h-14 bg-white border border-blue-50 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 text-sm font-bold shadow-sm transition-all" 
              />
           </div>
           <div className="flex gap-2">
              <button type="submit" className="h-14 px-8 bg-blue-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-3 uppercase tracking-widest">
                 <Search size={16} /> Search
              </button>
              <Link href="/payments" className="h-14 px-8 bg-white border border-blue-50 rounded-xl text-xs font-black text-slate-500 hover:bg-blue-50 hover:text-blue-600 shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest">
                 Clear
              </Link>
           </div>
        </form>

        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden mb-12">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่รับชำระ</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">เลขที่</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">จำนวนเงิน</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">ช่องทาง</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {loading ? (
                      <tr><td colSpan={6} className="py-24 text-center text-gray-400">กำลังโหลด...</td></tr>
                   ) : payments.length > 0 ? (
                      payments.map((p) => (
                         <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-gray-600">
                               {new Date(p.payment_date).toLocaleDateString('th-TH')}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-800">{p.customer_name || 'ไม่ระบุ'}</td>
                            <td className="px-6 py-4 text-sm text-blue-600 font-bold uppercase">{p.payment_no || '-'}</td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">฿{Number(p.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 text-center">
                               <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">
                                  {p.payment_method || 'Bank Transfer'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => window.open(`/payments/print/${p.id}`, '_blank')}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="พิมพ์ใบเสร็จ"
                                  >
                                    <Printer size={16} />
                                  </button>
                                  {canDelete && (
                                    <button 
                                      onClick={() => handleDelete(p.id)}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="ลบ (Manager+)"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                               </div>
                            </td>
                         </tr>
                      ))
                   ) : (
                      <tr>
                         <td colSpan={6} className="py-24 text-center text-gray-400 font-bold">
                            ไม่พบประวัติการรับชำระเงิน
                         </td>
                      </tr>
                   )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </main>
  );
}
