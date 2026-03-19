"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Lock, Mail, User, AlertCircle, ArrowLeft, CheckCircle, Database } from "lucide-react";
import Link from "next/link";
import { registerUser } from "./actions";
import { checkAndInitUsersTable } from "./db-init";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const router = useRouter();

  async function handleDBFix() {
    setIsFixing(true);
    setError("กำลังซ่อมแซมตารางใน Neon...");
    const result = await checkAndInitUsersTable();
    if (result.success) {
      setError(`✅ ${result.message} กรุณาลองสมัครใหม่อีกครั้ง`);
    } else {
      setError(`❌ แก้ไขไม่สำเร็จ: ${result.error}`);
    }
    setIsFixing(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
       setError(result.error);
       setIsLoading(false);
    } else {
       setSuccess(true);
       setTimeout(() => router.push("/login"), 3000);
    }
  }

  if (success) {
    return (
       <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
         <div className="w-full max-w-md bg-white rounded shadow-md border-t-4 border-emerald-500 p-8 text-center ring-1 ring-black/5">
           <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
               <CheckCircle size={40} />
             </div>
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">ลงทะเบียนสำเร็จ!</h2>
           <p className="text-gray-600 mb-6 font-medium">ระบบกำลังพาคุณไปที่หน้าเข้าสู่ระบบ...</p>
           <Link href="/login" className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-2">
             <ArrowLeft size={16} /> กลับสู่หน้าเข้าสู่ระบบ
           </Link>
         </div>
       </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800 tracking-tight uppercase">
              Micro<span className="text-blue-600">Account</span>
           </h1>
           <p className="text-gray-500 mt-2 font-medium">สร้างบัญชีผู้ใช้งานใหม่</p>
        </div>

        <div className="bg-white rounded shadow-md border-t-4 border-blue-600 p-8 overflow-hidden relative ring-1 ring-black/5">
           <div className="flex items-center gap-2 mb-8 justify-center py-2 bg-blue-50 rounded border border-blue-100 italic">
              <UserPlus size={18} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">New User Registration</span>
           </div>

           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex flex-col gap-3">
               <div className="flex gap-3">
                 <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                 <div>
                   <p className="font-bold text-red-800 text-sm">การลงทะเบียนไม่สำเร็จ</p>
                   <p className="text-red-700 text-xs mt-1">{error}</p>
                 </div>
               </div>
               
               {/* Show Fix Button only for DB Errors */}
               {(error.includes("column") || error.includes("relation") || error.includes("table") || error.includes("null values")) && (
                 <button 
                  onClick={handleDBFix}
                  disabled={isFixing}
                  className="mt-2 w-full p-2 bg-white border border-red-200 text-red-600 text-[10px] font-black uppercase rounded hover:bg-red-50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                 >
                   <Database size={12} /> {isFixing ? "กำลังซ่อมแซม..." : "🛠️ คลิกเพื่อแก้ตารางใน Neon (Rename & Recreate)"}
                 </button>
               )}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                 <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input name="name" type="text" required placeholder="ชื่อ-นามสกุล" className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                    <input name="email" type="email" required placeholder="อีเมล" className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium" />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input name="password" type="password" required placeholder="รหัสผ่าน" className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                   <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" size={16} />
                      <input name="confirmPassword" type="password" required placeholder="ยืนยัน" className="w-full h-11 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium" />
                   </div>
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="w-full h-12 mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black rounded shadow-lg shadow-blue-200 transition-all uppercase tracking-widest text-sm">
                {isLoading ? "กำลังประมวลผล..." : "ลงทะเบียนเข้าใช้งาน"}
              </button>
           </form>

           <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">มีบัญชีอยู่แล้ว? <Link href="/login" className="text-blue-600 font-bold hover:underline">เข้าสู่ระบบ</Link></p>
           </div>
        </div>
      </div>
    </main>
  );
}
