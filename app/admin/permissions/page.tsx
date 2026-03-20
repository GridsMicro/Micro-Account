"use client";

import { ShieldCheck, Lock, Users, Eye, Edit, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

export default function PermissionsPage() {
  const { showToast } = useToast();

  const roles = [
    { 
      name: "superadmin", 
      label: "เจ้าของระบบ / Super Admin",
      desc: "เข้าถึงได้ทุกส่วนของระบบ รวมถึงการตั้งค่าความปลอดภัยระดับสูงสุด", 
      permissions: ["Full Context", "Root Auth", "Infra Control"] 
    },
    { 
      name: "Admin", 
      label: "ผู้ดูแลระบบ / Administrator",
      desc: "จัดการผู้ใช้งาน สิทธิ์ และข้อมูลบริษัททั้งหมด", 
      permissions: ["Manage Users", "Company Settings", "All Modules"] 
    },
    { 
      name: "Manager", 
      label: "ผู้จัดการ / Manager",
      desc: "จัดการใบแจ้งหนี้ ใบเสนอราคา และคลังสินค้าทั้งหมด", 
      permissions: ["Quotations", "Invoices", "Inventory", "Contacts"] 
    },
    { 
      name: "Staff", 
      label: "พนักงาน / Staff",
      desc: "ดูข้อมูลคลังสินค้าและออกเอกสารเบื้องต้น", 
      permissions: ["View Inventory", "Create Simple Docs"] 
    },
    { 
      name: "Tester", 
      label: "ผู้ทดสอบ / Tester",
      desc: "เข้าดูระบบตัวอย่างเพื่อทดสอบก่อนการอนุมัติจริง", 
      permissions: ["Demo Access Only"] 
    },
    { 
      name: "User", 
      label: "ผู้ใช้ทั่วไป / General User",
      desc: "ระดับพื้นหลัง รอการกำหนดสิทธิ์เพิ่มเติม", 
      permissions: ["Limited Access"] 
    },
  ];

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
               <ShieldCheck size={32} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                 จัดการสิทธิ์การเข้าถึง
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                 <Lock size={14} className="text-indigo-500" /> RBAC Security Module v2.1
              </p>
            </div>
          </div>
          <Link href="/admin/members" className="h-14 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 group">
             จัดการสมาชิกรายคน <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {roles.map((role, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 flex flex-col overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group">
                 <div className="p-8 flex-1 text-left">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                       <Lock size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight uppercase">{role.label}</h3>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-8 h-12 overflow-hidden">{role.desc}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Granted Actions</p>
                       <div className="flex flex-wrap gap-2">
                          {role.permissions.map((p, pIdx) => (
                             <span key={pIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                <CheckCircle2 size={10} /> {p}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-50 flex justify-between items-center">
                    <button 
                      onClick={() => showToast("ฟังก์ชันแก้ไขกฎสิทธิ์ส่วนกลางกำลังพัฒนาเพิ่มเติม...", "info")}
                      className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:text-slate-950 transition-colors flex items-center gap-2"
                    >
                       <Edit size={14} /> ปรับจูนสิทธิ์
                    </button>
                    <Link 
                      href={`/admin/members?role=${role.name}`}
                      className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
                    >
                       <Users size={16} /> 
                       <span className="text-[10px] font-black uppercase tracking-widest">ผู้ใช้ในกลุ่ม</span>
                    </Link>
                 </div>
              </div>
           ))}
        </div>

        {/* Informational Panel */}
        <div className="bg-indigo-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-10">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-50"></div>
           <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shrink-0 translate-y-0 hover:-translate-y-2 transition-transform duration-500">
              <Eye size={40} className="text-white opacity-80" />
           </div>
           <div className="text-left space-y-4 flex-1">
              <h4 className="text-xl font-black uppercase tracking-tight">Granular Access Architecture</h4>
              <p className="text-sm opacity-60 font-bold leading-relaxed max-w-2xl">
                 ระบบจัดการสิทธิ์ของเราออกแบบมาบนหลักการ Least Privilege ของ Neon RBAC เพื่อความปลอดภัยสูงสุด 
                 ในเวอร์ชันนี้ สิทธิ์จะถูกผูกเข้ากับบทบาทผู้ใช้งาน (Roles) โดยตรง คุณสามารถจัดการสิทธิ์ที่ละคนได้ที่หน้า "จัดการสมาชิก"
              </p>
           </div>
           <Link href="/admin/members" className="h-14 px-8 bg-white text-indigo-950 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shrink-0">
              ไปหน้าจัดการสมาชิก <ArrowRight size={18} />
           </Link>
        </div>

        <div className="py-10 text-center opacity-30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Microtronic Security Shield • RBAC v2.1</p>
        </div>
      </div>
    </main>
  );
}
