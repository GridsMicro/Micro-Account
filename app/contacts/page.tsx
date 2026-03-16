import { query } from "@/lib/db";
import { Users, Plus, Mail, Phone, MapPin } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const res = await query('SELECT * FROM contacts ORDER BY name ASC');
  const contacts = res.rows;

  return (
    <main className="p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">ลูกค้าและคู่ค้า (Contacts)</h1>
            <p className="text-slate-500 font-medium">จัดการข้อมูลผู้ติดต่อ ลูกค้า และซัพพลายเออร์ทั้งหมดของคุณ</p>
          </div>
          <button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 transition-all flex items-center gap-2 active:scale-95 leading-none">
            <Plus size={22} />
            เพิ่มรายชื่อใหม่่
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contacts.length > 0 ? contacts.map((contact: any) => (
            <div key={contact.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-900/5 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[3rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center text-blue-600 mb-6 font-black text-2xl uppercase">
                  {contact.name.charAt(0)}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{contact.name}</h3>
                <p className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.15em] rounded-lg mb-8">
                  {contact.contact_type || 'ทั่วไป'}
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-900 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                        <Mail size={16} />
                    </div>
                    <span className="text-sm font-bold truncate">{contact.email || '-'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-900 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500">
                        <Phone size={16} />
                    </div>
                    <span className="text-sm font-bold">{contact.phone || '-'}</span>
                  </div>
                  <div className="flex items-start gap-4 text-slate-500 group-hover:text-slate-900 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 shrink-0">
                        <MapPin size={16} />
                    </div>
                    <span className="text-sm font-bold line-clamp-2">{contact.address || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
               <Users size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">ยังไม่มีรายชื่อผู้ติดต่อ</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
