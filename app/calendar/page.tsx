import { getReminders } from "@/app/actions";
import CalendarClient from "./CalendarClient";
import { Calendar as CalendarIcon, Bell, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const res = await getReminders();
  const reminders = res.success ? (res.data ?? []) : [];
  const pendingReminders = reminders.filter((r: any) => r.status === "pending");

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-6 text-left">
            <div className="p-4 bg-amber-500 rounded-3xl shadow-xl shadow-amber-100 text-white">
               <CalendarIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight leading-none text-slate-900">
                Calendar & Planning
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-2 flex items-center gap-2">
                 <Bell size={16} className="text-amber-500" /> แพลนงานและระบบแจ้งเตือนอัจฉริยะ
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             <Link href="/" className="h-14 px-8 bg-slate-50 text-slate-400 font-black rounded-2xl flex items-center justify-center text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100">
                Dashboard
             </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           
           {/* Sidebar: Upcoming & Filters */}
           <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 text-left">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Bell size={16} className="text-amber-500" /> แจ้งเตือนด่วน
                 </h3>
                 <div className="space-y-4">
                    {pendingReminders.length > 0 ? (
                      pendingReminders.slice(0, 5).map((r: any) => (
                        <div key={r.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-all">
                           <p className="text-xs font-black text-slate-800 line-clamp-1">{r.title}</p>
                           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">
                              {new Date(r.due_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}
                           </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs font-bold text-slate-300 italic">ไม่มีรายการค้างชำระ</p>
                    )}
                 </div>
              </div>
              
              <div className="bg-indigo-950 p-8 rounded-[2rem] shadow-xl text-white text-left relative overflow-hidden">
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300 mb-4 opacity-70">Pro Tip</h3>
                 <p className="text-sm font-bold leading-relaxed">
                   ระบบจะแจ้งเตือนการ "ต่ออายุใบเสนอราคา" อัตโนมัติสำหรับรายการที่เป็น Recurring รายเดือนและรายปี
                 </p>
              </div>
           </div>

           {/* Calendar View */}
           <div className="lg:col-span-3 bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <CalendarClient initialReminders={reminders} />
           </div>

        </div>

      </div>
    </main>
  );
}
