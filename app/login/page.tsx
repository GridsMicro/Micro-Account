"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Lock, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("[LOGIN] Calling custom API...");
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      console.log("[LOGIN] API response:", data);

      if (!res.ok) {
        setError(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      } else {
        console.log("[LOGIN] Redirecting to /");
        window.location.href = "/";
      }
    } catch (err: unknown) {
      console.error("[LOGIN] Exception:", err);
      setError("เกิดข้อผิดพลาด: " + ((err as Error).message || "กรุณาลองใหม่"));
    } finally {
      setIsLoading(false);
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

           {/* Error Alert */}
           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex gap-3">
               <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
               <div>
                 <p className="font-bold text-red-800 text-sm">เข้าสู่ระบบไม่สำเร็จ</p>
                 <p className="text-red-700 text-xs mt-1">{error}</p>
               </div>
             </div>
           )}

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-1">Email</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="อีเมล"
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
                      disabled={isLoading}
                      className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                 <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-500 select-none">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" disabled={isLoading} />
                    จดจำฉัน
                 </label>
                 <button type="button" className="text-blue-600 font-bold hover:underline disabled:opacity-50" disabled={isLoading}>ลืมรหัสผ่าน?</button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black rounded shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm disabled:cursor-not-allowed"
              >
                <LogIn size={20} />
                {isLoading ? "กำลังประมวลผล..." : "เข้าสู่ระบบ"}
              </button>
           </form>

           <div className="mt-10 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">
                 ยังไม่มีบัญชี? <Link href="/register" className="text-blue-600 font-bold hover:underline">ลงทะเบียนขอเข้าใช้งาน</Link>
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
