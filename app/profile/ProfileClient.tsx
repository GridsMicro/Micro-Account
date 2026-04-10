"use client";

import { useState } from "react";
import { User, Mail, Phone, Building2, Lock, Save, Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { normalizeRole } from "@/lib/core-standards";

interface Member {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function ProfileClient({ member }: { member: Member | null }) {
  const normalizedRole = normalizeRole(member?.role);
  const [name, setName] = useState(member?.name || "Administrator");
  const [email, setEmail] = useState(member?.email || "admin@microtronic.biz");
  const [phone, setPhone] = useState(member?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <main className="p-6 md:p-10 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <User className="text-violet-600" /> ข้อมูลโปรไฟล์ผู้ใช้
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">Security & Personnel Management</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-xl bg-violet-600 flex items-center justify-center text-white text-4xl font-black border-4 border-violet-100 shadow-xl overflow-hidden">
                  {name.charAt(0).toUpperCase()}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors border-2 border-white"
                >
                  <Camera size={13} />
                </button>
              </div>
              <div>
                <p className="font-black text-slate-900 text-2xl tracking-tighter">{name}</p>
                <div className="flex items-center gap-3 mt-2">
                   <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest ${
                     normalizedRole !== 'user' ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                   }`}>
                     <Building2 size={11} />
                     {normalizedRole === 'superadmin'
                      ? 'เจ้าของระบบ (SUPERADMIN)'
                      : normalizedRole === 'admin'
                      ? 'ผู้ดูแลระบบ (ADMIN)'
                      : 'ผู้ใช้งาน (USER)'}
                   </span>
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Status ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
              <User size={16} className="text-violet-500" /> ข้อมูลส่วนตัว
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-md focus:ring-4 focus:ring-violet-50 focus:bg-white text-sm font-black text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">อีเมล</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-md focus:ring-4 focus:ring-violet-50 focus:bg-white text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="อีเมล"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">เบอร์โทรศัพท์</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-md focus:ring-4 focus:ring-violet-50 focus:bg-white text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="0xx-xxx-xxxx"
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
              <Lock size={16} className="text-amber-500" /> เปลี่ยนรหัสผ่าน
              <span className="text-[10px] font-black text-slate-400 lowercase tracking-normal ml-auto">(Leave empty to keep existing)</span>
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full h-12 px-6 bg-slate-50 border-none rounded-md focus:ring-4 focus:ring-violet-50 focus:bg-white text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">รหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-12 px-6 bg-slate-50 border-none rounded-md focus:ring-4 focus:ring-violet-50 focus:bg-white text-sm font-medium text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full h-12 px-6 bg-slate-50 border border-transparent rounded-md focus:bg-white text-sm font-medium text-slate-800 transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-rose-400 focus:ring-4 focus:ring-rose-50'
                      : 'focus:ring-4 focus:ring-violet-50'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-lg flex items-center justify-center gap-3 shadow-xl shadow-violet-100 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-30 disabled:translate-y-0"
          >
            {saved ? (
              <><span className="text-green-300">✅</span> บันทึกเรียบร้อยแล้ว!</>
            ) : loading ? (
              <><span className="animate-spin">⏳</span> กำลังบันทึก...</>
            ) : (
              <><Save size={18} /> บันทึกข้อมูล</>
            )}
          </button>

        </form>
      </div>
    </main>
  );
}
