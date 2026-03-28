"use client";

import { useState, useTransition } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  CheckCircle,
  Clock,
  Bell,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createReminder, updateReminderStatus, deleteReminder } from "@/app/actions";
import { useRouter } from "next/navigation";

type Reminder = {
  id: number;
  title: string;
  description: string;
  due_date: string;
  status: string;
  type: string;
};

export default function CalendarClient({ initialReminders }: { initialReminders: Reminder[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const thaiMonths = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const days = Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => i + 1);
  const startDay = startDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const handleAddReminder = async () => {
    if (!newTitle || !newDate) return alert("กรุณาระบุชื่อและวันสำคัญ");
    
    startTransition(async () => {
      const res = await createReminder({
        title: newTitle,
        description: newDesc,
        due_date: newDate,
      });
      if (res.success) {
        setShowAddModal(false);
        setNewTitle("");
        setNewDate("");
        setNewDesc("");
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  const handleStatusToggle = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    startTransition(async () => {
      const res = await updateReminderStatus(id, nextStatus);
      if (res.success) router.refresh();
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบเตือนความจำนี้?")) return;
    startTransition(async () => {
      const res = await deleteReminder(id);
      if (res.success) router.refresh();
    });
  };

  return (
    <div className="flex flex-col h-full overlow-hidden">
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-8 border-b border-slate-50">
         <div className="flex flex-col gap-1 text-left">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
            </h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Selected Period</p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-2xl p-1 shadow-inner">
               <button onClick={handlePrevMonth} className="h-10 w-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={18} /></button>
               <button onClick={handleNextMonth} className="h-10 w-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all"><ChevronRight size={18} /></button>
            </div>
            <button 
               onClick={() => setShowAddModal(true)}
               className="h-12 px-6 bg-slate-900 text-white font-black rounded-2xl flex items-center gap-2 hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest shadow-xl shadow-slate-200"
            >
               <Plus size={16} /> New Event
            </button>
         </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-slate-50 relative">
        
        {/* Days of Week */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-slate-50 py-4 text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</span>
          </div>
        ))}

        {/* Padding for start of month */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-white/50 backdrop-blur-sm h-32 lg:h-40" />
        ))}

        {/* Month Days */}
        {days.map(day => {
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
          const dayReminders = initialReminders.filter(r => {
             const d = new Date(r.due_date);
             return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
          });

          return (
            <div key={day} className={cn(
              "bg-white h-32 lg:h-40 p-3 flex flex-col gap-2 group transition-all border border-slate-100/30",
              isToday ? "bg-indigo-50/20 ring-1 ring-inset ring-indigo-500/20" : "hover:bg-slate-50/50"
            )}>
              <span className={cn(
                "w-7 h-7 flex items-center justify-center text-sm font-black rounded-lg transition-transform group-hover:scale-110",
                isToday ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400"
              )}>
                {day}
              </span>
              
              <div className="flex-1 overflow-y-auto mt-1 space-y-1 scrollbar-hide">
                 {dayReminders.map(r => (
                    <div 
                      key={r.id}
                      onClick={() => handleStatusToggle(r.id, r.status)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all border relative group/item",
                        r.status === 'completed' ? "bg-slate-50 text-slate-400 border-slate-100 line-through opacity-50" : 
                        r.type === 'quotation_renewal' ? "bg-amber-50 text-amber-600 border-amber-100 shadow-sm" :
                        "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm"
                      )}
                    >
                       <span className="line-clamp-1">{r.title}</span>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="absolute -right-2 -top-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 bg-white rounded-full shadow-lg text-rose-500">
                          <X size={8} />
                       </button>
                    </div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
           <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl relative z-10 p-10 space-y-8 animate-in zoom-in-95">
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">วางแผนงานใหม่ (New Schedule)</h3>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Adding entry for {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หัวข้องานสำคัญ</label>
                    <input 
                      type="text" 
                      placeholder="เช่น วางบิลบริษัท Microtronic..." 
                      className="w-full h-14 px-6 bg-slate-50 border border-transparent focus:border-indigo-500 rounded-2xl font-black text-slate-700 outline-none transition-all"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">กำหนดส่ง / Deadline</label>
                       <input 
                         type="date" 
                         className="w-full h-14 px-6 bg-slate-50 border border-transparent focus:border-indigo-500 rounded-2xl font-black text-slate-700 outline-none transition-all"
                         value={newDate}
                         onChange={e => setNewDate(e.target.value)}
                         defaultValue={new Date().toISOString().split('T')[0]}
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ประเภทงาน</label>
                       <div className="h-14 px-6 bg-slate-50 rounded-2xl flex items-center gap-2 text-xs font-black text-slate-400 italic">
                          Manual Planning
                       </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รายละเอียดเพิ่มเติม</label>
                    <textarea 
                      className="w-full p-6 bg-slate-50 border border-transparent focus:border-indigo-500 rounded-3xl font-bold text-slate-500 outline-none transition-all"
                      placeholder="ใส่รายละเอียดที่ช่วยให้จำงานได้..."
                      rows={3}
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={() => setShowAddModal(false)}
                   className="flex-1 h-16 bg-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                 >
                   ยกเลิก
                 </button>
                 <button 
                    onClick={handleAddReminder}
                    disabled={isPending}
                    className="flex-[2] h-16 bg-slate-900 text-white font-black rounded-2xl hover:bg-indigo-600 transition-all text-xs uppercase tracking-widest shadow-xl shadow-slate-300 flex items-center justify-center gap-2"
                 >
                    {isPending ? <Loader2 className="animate-spin" /> : <SaveIcon className="w-4 h-4" size={16} />} 
                    บันทึกรายการ
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Transitional Loading Overlay */}
      {isPending && (
        <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500 animate-pulse z-50 overflow-hidden" />
      )}
    </div>
  );
}

function SaveIcon({ size, className }: { size?: number, className?: string }) {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
