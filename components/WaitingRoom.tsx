"use client";

import { Clock, ShieldAlert, LogOut, Mail, User } from "lucide-react";
import { signOut } from "next-auth/react";

export default function WaitingRoomPage({ userName, userEmail }: { userName?: string, userEmail?: string }) {
  return (
    <main className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
           <h1 className="text-4xl font-black text-gray-800 tracking-tighter uppercase">
              Micro<span className="text-blue-600">Account</span>
           </h1>
           <div className="h-1 w-20 bg-blue-600 mx-auto mt-2"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
           <div className="bg-blue-600 p-8 text-white text-center relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <ShieldAlert size={120} />
              </div>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-full mb-4">
                 <Clock size={40} className="text-white animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold">กำลังรอการอนุมัติ</h2>
              <p className="text-blue-100 mt-2 font-medium">เจ้าหน้าที่กำลังตรวจสอบข้อมูลของคุณ</p>
           </div>

           <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <User size={14} /> ข้อมูลผู้ใช้งาน
                    </h3>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                       <p className="text-sm font-bold text-gray-800">{userName || "ผู้ใช้ใหม่"}</p>
                       <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Mail size={12} /> {userEmail || "-"}
                       </p>
                    </div>
                    <div className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest">
                       Status: Pending Approval
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <ShieldAlert size={14} /> ขั้นต่อไปคืออะไร?
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-3 font-medium">
                       <li className="flex gap-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                          ระบบส่งข้อมูลไปยัง Admin เรียบร้อยแล้ว
                       </li>
                       <li className="flex gap-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                          Admin จะตรวจสอบและกำหนดสิทธิ์การใช้งาน
                       </li>
                       <li className="flex gap-2">
                          <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                          คุณจะสามารถเข้าใช้งานระบบได้ทันทีหลังอนุมัติ
                       </li>
                    </ul>
                 </div>
              </div>

              <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                 <p className="text-xs text-gray-400 text-center md:text-left max-w-sm">
                    ไม่ต้องห่วงครับ! ข้อมูลของคุณปลอดภัยและอยู่ในลำดับคิวเรียบร้อยแล้ว ในระหว่างนี้คุณสามารถปิดหน้านี้ไปก่อนได้
                 </p>
                 <button 
                  onClick={() => signOut()}
                  className="px-6 h-12 bg-gray-800 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 shadow-lg"
                 >
                    <LogOut size={16} /> ออกจากระบบ
                 </button>
              </div>
           </div>
        </div>

        <div className="mt-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
           Microtronic Thailand &bull; Security & Accountability System
        </div>
      </div>
    </main>
  );
}
