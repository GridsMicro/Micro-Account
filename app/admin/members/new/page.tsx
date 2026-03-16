"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UserPlus, 
  Save, 
  ChevronRight,
  ShieldCheck,
  Mail,
  User,
  Key
} from "lucide-react";

export default function NewMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Pending",
    status: "Inactive"
  });

  const roles = [
    "Super Admin",
    "Manager",
    "Sales (ฝ่ายขาย)",
    "Service (ฝ่ายบริการ)",
    "Stock (ฝ่ายคลังสินค้า)",
    "Finance (ฝ่ายการเงิน)",
    "Production (ฝ่ายผลิต)",
    "Dev / Debugger",
    "Staff",
    "Pending"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder for actual create logic
    alert("จำลองการเพิ่มผู้ใช้เข้าระบบสำเร็จ\nข้อมูลที่เลือก: " + formData.role);
    setLoading(false);
    router.push("/admin/members");
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
               <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                  <UserPlus className="text-blue-600" /> เพิ่มสมาชิกใหม่
               </h1>
               <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
                  <Link href="/admin/members" className="text-blue-500 hover:underline">Members</Link>
                  <ChevronRight size={10} />
                  <span>New Access</span>
               </div>
            </div>
            <div className="flex gap-2">
               <Link href="/admin/members" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
               </Link>
               <button 
                type="submit"
                disabled={loading}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
               >
                  <Save size={18} /> {loading ? "กำลังบันทึก..." : "เพิ่มสมาชิกใหม่"}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                   <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tighter">
                      <User size={18} className="text-blue-500" /> ข้อมูลผู้ใช้งาน (User Profile)
                   </div>
                   
                   <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ชื่อ-นามสกุล</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                               <Mail size={12} /> อีเมล (Email)
                            </label>
                            <input 
                              type="email" 
                              required
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                            />
                         </div>
                      </div>

                      <div className="border-t border-gray-100 pt-6 mt-6">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                             <Key size={14} /> System Access Level & Status
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">บทบาทและสิทธิ์ (Role)</label>
                               <select 
                                 value={formData.role}
                                 onChange={e => setFormData({...formData, role: e.target.value})}
                                 className="w-full h-11 px-4 bg-blue-50 border border-blue-200 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-blue-700 shadow-inner"
                               >
                                  {roles.map(r => (
                                      <option key={r} value={r}>{r}</option>
                                  ))}
                               </select>
                            </div>
                            <div className="space-y-1">
                               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">สถานะบัญชี (Status)</label>
                               <select 
                                 value={formData.status}
                                 onChange={e => setFormData({...formData, status: e.target.value})}
                                 className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700"
                               >
                                  <option value="Active">Active (เปิดใช้งานทันที)</option>
                                  <option value="Inactive">Inactive (รออนุมัติ / ระงับชั่วคราว)</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex flex-col items-center">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border border-blue-100 font-bold uppercase tracking-widest text-2xl">
                      {formData.name ? formData.name.charAt(0) : '?'}
                   </div>
                   <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-2 text-center">{formData.name || 'New User'}</h3>
                   <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                      {formData.role}
                   </span>
                </div>

                <div className="bg-blue-600 text-white p-8 rounded shadow-sm flex flex-col items-center">
                   <ShieldCheck size={40} className="mb-4 opacity-50" />
                   <p className="text-xs font-black uppercase tracking-[0.2em] mb-1 text-center">New Member Allocation</p>
                   <p className="text-[10px] opacity-70 text-center leading-relaxed font-bold">
                      ผู้ใช้งานใหม่จะไม่สามารถเข้าระบบได้จนกว่าจะได้รับสถานะ Active
                   </p>
                </div>
            </div>
          </div>
        </form>

        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand. Security Shield v2.1
        </div>
      </div>
    </main>
  );
}
