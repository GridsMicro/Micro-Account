"use client";

import { useState } from "react";
import { Building2, Lock, User, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate Login
    setTimeout(() => {
      if (username === "Admin" && password === "Admin1234") {
        router.push("/");
      } else {
        alert("ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง (ลอง Admin / Admin1234)");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] -mr-96 -mt-96 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] -ml-64 -mb-64" />
      
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
        
        {/* Left Side: Brand & Vision */}
        <div className="hidden lg:flex flex-col space-y-12">
           <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] animate-bounce">
                 <Sparkles size={32} />
              </div>
              <div>
                 <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Micro<span className="text-indigo-400">Account</span></h1>
                 <p className="text-[10px] text-cyan-400 font-black tracking-[0.4em] uppercase mt-2">Intelligence Enterprise 2026</p>
              </div>
           </div>

           <div className="space-y-6">
              <h2 className="text-6xl font-black text-white leading-tight tracking-tighter">
                 THE FUTURE OF <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">SMART FINANCE.</span>
              </h2>
              <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-lg">
                 ระบบจัดการบัญชีและภาษีออนไลน์แบบ 100% เชื่อมต่อคลาวด์มาตรฐานโลก ปลอดภัย แม่นยำ และทรงพลังที่สุดสำหรับพนักงานยุคใหม่
              </p>
           </div>

           <div className="flex items-center gap-10 pt-4">
              <div className="flex flex-col">
                 <span className="text-3xl font-black text-white italic tracking-tighter">100%</span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cloud Uptime</span>
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div className="flex flex-col">
                 <span className="text-3xl font-black text-white italic tracking-tighter">Military</span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade Crypto</span>
              </div>
           </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex justify-center lg:justify-end">
          <div className="w-full max-w-[480px] bg-[#0f172a] p-12 lg:p-16 rounded-[4rem] border border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative">
            <div className="absolute top-0 right-16 w-1 hover:w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent transition-all duration-1000" />
            
            <div className="text-center mb-12">
               <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center text-indigo-400 border border-white/5 mx-auto mb-6">
                  <ShieldCheck size={32} />
               </div>
               <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Authorized Access</h3>
               <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">ระบบควบคุมการเข้าถึงพนักงานผู้ได้รับอนุญาต</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Username / Email</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ระบุชื่อผู้ใช้งาน" 
                    className="w-full h-16 pl-14 pr-6 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-200 placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Access Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ระหัสผ่าน 8-16 ตัวอักษร" 
                    className="w-full h-16 pl-14 pr-6 bg-slate-950/50 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-bold text-slate-200 placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={isLoading}
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      ENTER SYSTEM
                      <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-8 border-t border-white/5">
                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    Managed by <span className="text-indigo-400">Microtronic Thailand</span>
                 </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
