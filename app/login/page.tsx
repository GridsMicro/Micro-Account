"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Lock, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold text-gray-800 tracking-tight uppercase">
              Micro<span className="text-blue-600">Account</span>
           </h1>
           <p className="text-gray-500 mt-2 font-medium">เข้าสู่ระบบจัดการบัญชีอัจฉริยะ</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded shadow-md border-t-4 border-blue-600 p-8 overflow-hidden relative">
           <div className="flex items-center gap-2 mb-8 justify-center py-2 bg-blue-50 rounded border border-blue-100 italic">
              <ShieldCheck size={18} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Secure Admin Portal</span>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Username / Email</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium"
                      placeholder="admin@microtronic.biz"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Password</label>
                 <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium"
                      placeholder="••••••••"
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                 <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-500 select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    จดจำฉัน
                 </label>
                 <button type="button" className="text-blue-600 font-bold hover:underline">ลืมรหัสผ่าน?</button>
              </div>

              <button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
              >
                <LogIn size={20} />
                เข้าสู่ระบบ
              </button>
           </form>

           <div className="mt-10 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">
                 ยังไม่มีบัญชี? <Link href="#" className="text-blue-600 font-bold hover:underline">ลงทะเบียนขอเข้าใช้งาน</Link>
              </p>
           </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs font-medium">
           Copyright © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
