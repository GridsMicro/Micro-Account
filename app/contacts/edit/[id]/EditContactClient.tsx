"use client";

import { 
  Building2, 
  Mail, 
  Phone, 
  ChevronRight,
  Save,
  Globe,
  ShieldCheck,
  CreditCard,
  Hash,
  ArrowLeft,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { updateContact } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

export default function EditContactClient({ contact }: { contact: any }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: contact.name || "",
    type: contact.type || "customer",
    email: contact.email || "",
    phone: contact.phone || "",
    address: contact.address || "",
    tax_id: contact.tax_id || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await updateContact(String(contact.id), formData);
      if (res.success) {
        showToast("อัปเดตข้อมูลรายชื่อเรียบร้อยแล้ว", "success");
        setTimeout(() => {
          router.push("/contacts");
          router.refresh();
        }, 1500);
      } else {
        showToast(res.error || "เกิดข้อผิดพลาดในการบันทึก", "error");
      }
    } catch (err: any) {
      showToast(err.message || "การเชื่อมต่อล้มเหลว", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Enhanced Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-slate-200 group">
                 <UserCheck size={32} className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                   แก้ไขข้อมูลคู่ค้า
                </h1>
                <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                   <Link href="/contacts" className="hover:text-indigo-600 transition-colors">Stakeholders</Link>
                   <ChevronRight size={10} />
                   <span className="text-indigo-500">Edit Identity: {contact.name}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 relative z-10">
               <Link href="/contacts" className="h-14 px-8 bg-white border border-slate-100 rounded-2xl text-slate-500 font-black flex items-center justify-center text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                  ยกเลิก
               </Link>
               <button 
                type="submit"
                disabled={loading}
                className="h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-900/20 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 active:scale-95"
               >
                  <Save size={18} /> {loading ? "กำลังบันทึก..." : "ยืนยันการแก้ไข"}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <div className="lg:col-span-2 space-y-8">
                {/* Form Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                   <div className="bg-slate-50/50 px-10 py-6 border-b border-slate-50 font-black text-slate-700 flex items-center gap-3 uppercase tracking-widest text-[10px]">
                      <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200/50">
                        <Building2 size={16} />
                      </div>
                      Stakeholder Identity (ข้อมูลพื้นฐาน)
                   </div>
                   
                   <div className="p-10 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อเต็ม / ชื่อบริษัท (Full Name)</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 outline-none transition-all" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ประเภทคู่ค้า (Type)</label>
                            <select 
                              value={formData.type}
                              onChange={e => setFormData({...formData, type: e.target.value})}
                              className="w-full h-14 px-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-indigo-700 outline-none cursor-pointer transition-all shadow-inner"
                            >
                               <option value="customer">Customer (ลูกค้า)</option>
                               <option value="vendor">Vendor (ซัพพลายเออร์)</option>
                               <option value="internal">Internal (ภายใน)</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เลขที่ผู้เสียภาษี (TAX ID)</label>
                              <div className="relative">
                                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                                <input 
                                 type="text" 
                                 value={formData.tax_id}
                                 onChange={e => setFormData({...formData, tax_id: e.target.value})}
                                 className="w-full h-14 pl-12 pr-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 outline-none transition-all" 
                                />
                              </div>
                           </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมล (Business Email)</label>
                            <div className="relative">
                              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                              <input 
                                type="email" 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full h-14 pl-12 pr-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 outline-none transition-all" 
                              />
                            </div>
                         </div>
                         <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์ (Contact Phone)</label>
                            <div className="relative">
                              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                              <input 
                                type="text" 
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                className="w-full h-14 pl-12 pr-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 outline-none transition-all" 
                              />
                            </div>
                         </div>
                      </div>
                      <div className="space-y-2 pt-4">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ที่อยู่จดทะเบียน (Registered Address)</label>
                         <textarea 
                          rows={4} 
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                          className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-700 resize-none leading-relaxed outline-none transition-all shadow-inner" 
                         ></textarea>
                      </div>
                   </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* ID/Sync Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-10 flex flex-col items-center">
                   <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-6 border border-slate-200 font-black text-2xl uppercase">
                      ID
                   </div>
                   <h3 className="font-black text-slate-800 uppercase tracking-tight mb-2 text-center text-sm">Internal Reference</h3>
                   <span className="px-5 py-2 bg-indigo-50 text-indigo-700 font-mono font-black text-xs rounded-xl border border-indigo-100 shadow-sm">
                      REF#{contact.id}
                   </span>
                </div>

                <div className="bg-indigo-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-900/40 flex flex-col items-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                   <ShieldCheck size={48} className="mb-6 opacity-50 group-hover:scale-110 transition-transform" />
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] mb-3 text-center">Neon Sync Protected</p>
                   <p className="text-[10px] opacity-70 text-center leading-relaxed font-bold italic px-2">
                      "การเปลี่ยนแปลงข้อมูลจะถูกบันทึกและซิงค์ไปยังทุกเอกสารที่เกี่ยวข้องทันที"
                   </p>
                </div>
            </div>
          </div>
        </form>

        <div className="text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.8em] py-10">
           Microtronic CRM Module v2.1
        </div>
      </div>
    </main>
  );
}
