"use client";

import { useState } from "react";
import { Building2, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simple demo auth for now - in reality this would be a server action
    setTimeout(() => {
      if (username === "Admin" && password === "Admin1234") {
        window.location.href = "/";
      } else {
        alert("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl -ml-64 -mb-64" />

      <div className="w-full max-w-[460px] relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-slate-100 p-10 md:p-14">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 mb-6">
              <Building2 size={32} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">เข้าสู่ระบบ</h1>
            <p className="text-slate-500 font-medium tracking-tight">
              Micro-Account Expert <br /> ยินดีต้อนรับกลับสู่ระบบจัดการบัญชีของคุณ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">ชื่อผู้ใช้งาน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-bold text-slate-700"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">รหัสผ่าน</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-bold text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "กำลังโหลด..." : (
                  <>
                    ลงชื่อเข้าใช้งาน
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400">
              ลืมรหัสผ่านหรือมีปัญหาการใช้งาน? <br />
              <span className="text-blue-600 font-bold cursor-pointer hover:underline uppercase tracking-tighter text-xs">ติดต่อฝ่าย IT Support</span>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-xs uppercase font-bold tracking-[0.2em]">
          © 2026 Microtronic (Thailand) Co., Ltd.
        </p>
      </div>
    </main>
  );
}
