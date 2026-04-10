"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  UserCog, 
  Save, 
  ChevronRight,
  ShieldCheck,
  Mail,
  User,
  Key,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/components/ToastProvider"; // Use our custom hook
import { updateUserAction } from "../../actions";
import { normalizeRole } from "@/lib/core-standards";

export default function EditMemberClient({ user }: { user: any }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    role: normalizeRole(user.role),
    status: user.status || "Pending"
  });

  const roles = [
    "superadmin",
    "admin",
    "user"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await updateUserAction(user.id.toString(), formData);
      if (res.success) {
        showToast(res.message || "บันทึกเรียบร้อย", "success");
        // Wait then redirect
        setTimeout(() => {
          router.push("/admin/members");
          router.refresh();
        }, 1500);
      } else {
        showToast(res.error || "เกิดข้อผิดพลาด", "error");
      }
    } catch (err: any) {
      showToast(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#fcfaff]">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top Bar with Navigation */}
          <div className="flex items-center justify-between">
            <Link href="/admin/members" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest group">
               <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> กลับหน้าจัดการสมาชิก
            </Link>
            
            <button 
              type="submit"
              disabled={loading}
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-900/20 transition-all text-sm uppercase tracking-widest disabled:opacity-50 active:scale-95"
            >
              <Save size={18} /> {loading ? "กำลังบันทึก..." : "ยืนยันการเปลี่ยนแปลง"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                   <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 font-black text-slate-700 flex items-center gap-3 uppercase tracking-widest text-[10px]">
                      <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                        <User size={14} />
                      </div>
                      User Information
                   </div>
                   
                   <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ-นามสกุล (Full Name)</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 transition-all outline-none" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                               อีเมล (Login Email)
                            </label>
                            <input 
                              type="email" 
                              required
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 transition-all outline-none" 
                            />
                         </div>
                      </div>

                      <div className="border-t border-slate-50 pt-8 mt-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">สิทธิ์การเข้าถึง (Role)</label>
                               <select 
                                 value={formData.role}
                                 onChange={e => setFormData({...formData, role: e.target.value as "user" | "superadmin" | "admin"})}
                                 className="w-full h-12 px-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-indigo-700 shadow-sm outline-none cursor-pointer"
                               >
                                  {roles.map(r => (
                                      <option key={r} value={r}>{r}</option>
                                  ))}
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">สถานะระบบ (Status)</label>
                               <select 
                                 value={formData.status}
                                 onChange={e => setFormData({...formData, status: e.target.value})}
                                 className={`w-full h-12 px-4 border rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold transition-all outline-none cursor-pointer ${formData.status === 'Active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}
                               >
                                  <option value="Active">Active (เปิดใช้งาน)</option>
                                  <option value="Pending">Pending (รออนุมัติ)</option>
                                  <option value="Inactive">Inactive (ระงับชั่วคราว)</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col items-center">
                   <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-200 font-black uppercase tracking-widest text-3xl">
                      {formData.name.charAt(0)}
                   </div>
                   <h3 className="font-black text-slate-800 uppercase tracking-tight mb-2 text-center text-lg">{formData.name || "User Name"}</h3>
                   <div className="flex gap-2">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg border border-indigo-500 shadow-lg shadow-indigo-900/20 tracking-widest">
                        {formData.role}
                      </span>
                      <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border tracking-widest shadow-lg ${formData.status === 'Active' ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-900/20' : 'bg-rose-500 border-rose-400 text-white shadow-rose-900/20'}`}>
                        {formData.status}
                      </span>
                   </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 flex flex-col items-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                   <ShieldCheck size={48} className="mb-6 text-indigo-400 relative z-10 group-hover:scale-110 transition-transform" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-center text-indigo-400">Security Control</p>
                   <p className="text-[10px] opacity-60 text-center leading-relaxed font-bold">
                      Neon RBAC Integration Enabled.
                      ระบบจะทำการสลับโหมดและสิทธิ์ผู้ใช้งานทันทีหลังบันทึก
                   </p>
                </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
