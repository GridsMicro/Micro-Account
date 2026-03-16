import { query } from "@/lib/db";
import { Users, Plus, Mail, Phone, MapPin, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  let contacts = [];
  try {
    const res = await query('SELECT * FROM contacts ORDER BY name ASC');
    contacts = res.rows;
  } catch (e) {
    contacts = [];
  }

  return (
    <main className="p-10 font-sans min-h-screen bg-[#020617] text-slate-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-indigo-400 font-black text-xs uppercase tracking-widest">
           <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
           <ArrowRight size={14} className="text-slate-700" />
           <span className="text-slate-500">Contacts</span>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-5xl lg:text-6xl font-black text-white italic tracking-tighter">
               CONTACT<span className="text-indigo-500">S</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg uppercase tracking-wider">จัดการข้อมูลผู้ติดต่อ ลูกค้า และซัพพลายเออร์</p>
          </div>
          <Link href="/contacts/new" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] shadow-2xl shadow-indigo-900/40 transition-all flex items-center gap-3 active:scale-95 group text-lg">
            <Plus size={24} className="group-hover:rotate-12 transition-transform" />
            เพิ่มรายชื่อใหม่
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          {contacts.length > 0 ? contacts.map((contact: any) => (
            <div key={contact.id} className="bg-[#0f172a] p-10 rounded-[3rem] border border-white/5 shadow-2xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-20 h-20 bg-slate-950 border border-white/10 rounded-[1.5rem] flex items-center justify-center text-indigo-400 font-black text-3xl uppercase italic shadow-2xl group-hover:border-indigo-500 transition-colors">
                    {contact.name.charAt(0)}
                  </div>
                  <UserCheck size={28} className="text-slate-800 group-hover:text-indigo-600 transition-colors" />
                </div>

                <h3 className="text-2xl font-black text-white mb-2 italic tracking-tighter uppercase">{contact.name}</h3>
                <span className="inline-block px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl mb-10 border border-indigo-500/20">
                  {contact.contact_type || 'General'}
                </span>

                <div className="space-y-6">
                  <div className="flex items-center gap-5 text-slate-400 group-hover:text-slate-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-cyan-400 transition-all">
                        <Mail size={18} />
                    </div>
                    <span className="text-sm font-bold truncate tracking-wide">{contact.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-5 text-slate-400 group-hover:text-slate-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-cyan-400 transition-all">
                        <Phone size={18} />
                    </div>
                    <span className="text-sm font-bold tracking-wide">{contact.phone || '-'}</span>
                  </div>
                  <div className="flex items-start gap-5 text-slate-400 group-hover:text-slate-200 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-cyan-400 transition-all shrink-0">
                        <MapPin size={18} />
                    </div>
                    <span className="text-sm font-bold leading-relaxed line-clamp-2">{contact.address || '-'}</span>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5 flex justify-end">
                   <button className="text-[10px] font-black text-slate-700 uppercase tracking-widest hover:text-indigo-400 transition-colors flex items-center gap-2">
                      View History <ArrowRight size={14} />
                   </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-40 text-center bg-[#0f172a] rounded-[4rem] border border-dashed border-white/10 flex flex-col items-center gap-8">
               <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-slate-700">
                  <Users size={48} />
               </div>
               <div className="space-y-2">
                  <p className="text-white font-black italic text-2xl uppercase tracking-widest">No Contacts Found</p>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.5em]">Network Status: Active</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
