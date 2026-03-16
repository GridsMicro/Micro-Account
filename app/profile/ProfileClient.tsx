"use client";

import { useState } from "react";
import { User, Mail, Phone, Building2, Lock, Save, Camera, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Member {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function ProfileClient({ member }: { member: Member | null }) {
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
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 hover:bg-gray-200 rounded transition-colors text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <User className="text-blue-600" /> ข้อมูลโปรไฟล์ผู้ใช้
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">แก้ไขข้อมูลส่วนตัวและรหัสผ่าน</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black border-4 border-blue-100">
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
                <p className="font-bold text-gray-800 text-lg">{name}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                  member?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Building2 size={11} />
                  {member?.role === 'admin' ? 'ผู้ดูแลระบบ' : member?.role || 'ผู้ดูแลระบบ'}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> ข้อมูลส่วนตัว
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white text-sm font-bold transition-all"
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
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white text-sm transition-all"
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
                  className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white text-sm transition-all"
                  placeholder="0xx-xxx-xxxx"
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
            <h2 className="font-bold text-gray-700 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Lock size={16} className="text-orange-500" /> เปลี่ยนรหัสผ่าน
              <span className="text-xs font-normal text-gray-400">(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white text-sm transition-all"
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
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-500 focus:bg-white text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full h-11 px-4 bg-gray-50 border rounded-lg focus:bg-white text-sm transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
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
