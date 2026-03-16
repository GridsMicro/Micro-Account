"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Users, 
  UserPlus,
  Mail, 
  Phone, 
  MapPin, 
  ChevronRight,
  ShieldCheck,
  Building2,
  Globe,
  CreditCard
} from "lucide-react";
import { createContact } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewContactPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "customer",
    email: "",
    phone: "",
    address: "",
    tax_id: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createContact(formData);
    setLoading(false);
    if (res.success) {
      alert("ลงทะเบียนรายชื่อใหม่เรียบร้อยแล้ว");
      router.push("/contacts");
      router.refresh();
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (res.error || "Unknown error"));
    }
  };

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit}>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
                 <UserPlus className="text-blue-600" /> ลงทะเบียนรายชื่อใหม่
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1 uppercase tracking-widest font-black text-[10px]">
                 <Link href="/contacts" className="text-blue-500 hover:underline">Contacts</Link>
                 <ChevronRight size={10} />
                 <span>New Entry</span>
              </div>
            </div>
            <div className="flex gap-2">
               <Link href="/contacts" className="h-11 px-6 bg-white border border-gray-300 rounded text-gray-700 font-bold flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                  ยกเลิก
               </Link>
               <button 
                type="submit"
                disabled={loading}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50"
               >
                  <Save size={18} /> {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                   <div className="bg-gray-50 px-8 py-4 border-b border-gray-200 font-bold text-gray-700 flex items-center gap-2 uppercase tracking-tighter">
                      <Building2 size={18} /> ข้อมูลพื้นฐาน (Basic Info)
                   </div>
                   
                   <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ชื่อเต็ม / ชื่อบริษัท</label>
                            <input 
                              type="text" 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                              placeholder="เช่น บริษัท เอบีซี จำกัด" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ประเภท</label>
                            <select 
                              value={formData.type}
                              onChange={e => setFormData({...formData, type: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700"
                            >
                               <option value="customer">Customer (ลูกค้า)</option>
                               <option value="vendor">Vendor (ซัพพลายเออร์)</option>
                               <option value="internal">Internal (ภายใน)</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <CreditCard size={12} /> TAX ID (เลขที่ผู้เสียภาษี)
                             </label>
                             <input 
                              type="text" 
                              value={formData.tax_id}
                              onChange={e => setFormData({...formData, tax_id: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                              placeholder="010XXXXXXXXXX" 
                             />
                          </div>
                         <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                               <Mail size={12} /> อีเมล (Email)
                            </label>
                            <input 
                              type="email" 
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                              placeholder="example@mail.com" 
                            />
                         </div>
                         <div className="md:col-span-2 space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                               <Phone size={12} /> เบอร์โทรศัพท์ (Phone)
                            </label>
                            <input 
                              type="text" 
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700" 
                              placeholder="02-XXX-XXXX" 
                            />
                         </div>
                      </div>
                      <div className="space-y-1 pt-4">
                         <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">ที่อยู่ (Registered Address)</label>
                         <textarea 
                          rows={4} 
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-300 rounded focus:border-blue-500 focus:bg-white text-sm font-bold text-gray-700 resize-none leading-relaxed" 
                          placeholder="ระบุที่อยู่สำนักงานใหญ่หรือสาขาสำหรับออกใบกำกับภาษี"
                         ></textarea>
                      </div>
                   </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white rounded shadow-sm border border-gray-200 p-8 flex flex-col items-center text-center">
                   <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 border border-blue-100 italic">
                      <Globe size={32} />
                   </div>
                   <h3 className="font-bold text-gray-800 uppercase tracking-tight mb-2">CRM Integrated</h3>
                   <p className="text-xs text-gray-500 leading-relaxed italic">
                      ข้อมูลผู้ติดต่อจะถูกนำไปใช้ในระบบใบเสนอราคาและใบแจ้งหนี้เพื่อความสะดวกในการจัดการบัญชี
                   </p>
                </div>

                <div className="bg-blue-600 text-white p-8 rounded shadow-sm flex flex-col items-center">
                   <ShieldCheck size={40} className="mb-4 opacity-50" />
                   <p className="text-xs font-black uppercase tracking-[0.2em] mb-1">Data Security</p>
                   <p className="text-[10px] opacity-70">Saved to Secure Neon Cloud Database</p>
                </div>
            </div>
          </div>
        </form>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
