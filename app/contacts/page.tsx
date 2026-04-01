
import { query } from "@/lib/db";
import { Users, Plus, Mail, Phone, MapPin, ArrowRight, UserCheck, Edit, ShieldCheck, Heart, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { normalizeContactType } from "@/lib/contacts";

export const dynamic = 'force-dynamic';

export default async function ContactsPage({ searchParams }: { searchParams: { search?: string } }) {
  const search = (await searchParams)?.search || "";
  let contacts = [];
  try {
    let q = 'SELECT * FROM contacts WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      params.push(`%${search}%`);
      q += ` AND (name ILIKE $1 OR COALESCE(contact_type, type, '') ILIKE $1)`;
    }
    
    q += ' ORDER BY name ASC';
    const res = await query(q, params);
    contacts = res.rows;
  } catch (e) {
    console.error("Fetch Contacts Error:", e);
    contacts = [];
  }

  return (
    <main className="p-6 md:p-12 min-h-screen bg-[#fdfaff]">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="space-y-2 text-left">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
               <span className="p-3 bg-violet-600 rounded-2xl shadow-xl shadow-violet-200">
                  <Users className="text-white w-8 h-8" /> 
               </span>
               ลูกค้าและคู่ค้า (CRM)
            </h1>
            <div className="flex items-center gap-3 ml-2">
               <span className="text-violet-400 font-black text-[10px] uppercase tracking-[0.3em]">
                  Stakeholder Relationship Management
               </span>
               <div className="h-px w-12 bg-violet-100"></div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden lg:flex items-center gap-2 bg-pink-50 px-4 py-2 rounded-xl border border-pink-100 mr-2">
                <Heart size={16} className="text-pink-500 fill-pink-500" />
                <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest leading-none">VIP Relations Active</span>
             </div>
             <Link 
              href="/contacts/new" 
              className="h-14 px-8 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl flex items-center gap-3 shadow-xl hover:-translate-y-1 active:scale-95 transition-all text-sm"
             >
                <Plus size={20} /> เพิ่มรายชื่อใหม่
             </Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <form method="GET" className="flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 group w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-violet-500 transition-colors" size={20} />
              <input 
                type="text" 
                name="search"
                defaultValue={search}
                placeholder="ค้นหารายชื่อ เบอร์โทร หรือประเภทคู่ค้า..." 
                className="w-full pl-14 pr-6 h-14 bg-white border border-violet-50 rounded-xl focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 text-sm font-bold shadow-sm transition-all" 
              />
           </div>
           <div className="flex gap-2">
              <button type="submit" className="h-14 px-8 bg-violet-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-3 uppercase tracking-widest">
                 <Search size={16} /> Search
              </button>
              <Link href="/contacts" className="h-14 px-8 bg-white border border-violet-50 rounded-xl text-xs font-black text-slate-500 hover:bg-violet-50 hover:text-violet-600 shadow-sm transition-all flex items-center gap-3 uppercase tracking-widest">
                 Clear
              </Link>
           </div>
        </form>

        {/* Contacts Gallery Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {contacts.length > 0 ? contacts.map((contact: any, i: number) => (
            <div key={contact.id} className="bg-white rounded-3xl shadow-sm border border-violet-50 hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50/30 rounded-full translate-x-12 -translate-y-12 group-hover:scale-150 transition-transform duration-700"></div>
               
               <div className="p-10 pb-6 relative">
                  <div className="flex items-start justify-between mb-8">
                     <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-violet-100">
                        {contact.name.charAt(0)}
                     </div>
                     <span className="px-4 py-2 bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-100">
                        {normalizeContactType(contact.contact_type || contact.type)}
                     </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight line-clamp-1 group-hover:text-violet-600 transition-colors uppercase">{contact.name}</h3>

                  <div className="space-y-4 text-left">
                     <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-violet-100 transition-all">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><Mail size={14} className="text-violet-400" /></div>
                        <span className="text-sm font-bold text-slate-600 truncate">{contact.email || '-'}</span>
                     </div>
                     <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-violet-100 transition-all">
                        <div className="p-2 bg-white rounded-xl shadow-sm"><Phone size={14} className="text-violet-400" /></div>
                        <span className="text-sm font-bold text-slate-600">{contact.phone || '-'}</span>
                     </div>
                     <div className="flex items-start gap-4 bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-violet-100 transition-all">
                        <div className="p-2 bg-white rounded-xl shadow-sm shrink-0"><MapPin size={14} className="text-violet-400" /></div>
                        <span className="text-xs font-medium text-slate-400 line-clamp-2 leading-relaxed">{contact.address || 'ไม่ระบุที่อยู่ติดต่อ'}</span>
                     </div>
                  </div>
               </div>
               
               <div className="bg-violet-50/30 px-10 py-6 border-t border-violet-50 flex justify-between items-center group-hover:bg-violet-600 transition-all duration-300">
                  <Link href={`/contacts/edit/${contact.id}`} className="text-violet-600 group-hover:text-white text-[10px] font-black flex items-center gap-2 uppercase tracking-widest">
                     <Edit size={14} /> Edit Identity
                  </Link>
                  <button className="text-violet-300 group-hover:text-white transition-colors">
                     <ArrowRight size={18} />
                  </button>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-32 text-center bg-violet-50/5 rounded-3xl border-4 border-dashed border-violet-100 group">
               <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-100 group-hover:scale-110 transition-transform">
                  <Users size={48} className="text-violet-200" />
               </div>
               <p className="text-slate-400 font-black text-xl mb-4 tracking-tight">Everything is Quiet here</p>
               <p className="text-slate-400/60 text-sm max-w-xs mx-auto italic mb-10">ยังไม่พบรายชื่อผู้ติดต่อหรือลูกค้าในระบบคลาวด์ของคุณ</p>
               <Link 
                 href="/contacts/new" 
                 className="px-8 py-4 bg-violet-600 text-white font-black rounded-xl shadow-xl hover:bg-violet-700 transition-all uppercase text-xs tracking-widest"
               >
                 Register First Stakeholder
               </Link>
            </div>
          )}
        </div>

        {/* Global Footer */}
        <div className="text-center py-10 opacity-30">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Entity Relationship Management System • 2026</p>
        </div>
      </div>
    </main>
  );
}
