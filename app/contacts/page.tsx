import { query } from "@/lib/db";
import { Users, Plus, Mail, Phone, MapPin, ArrowRight, UserCheck, Edit } from "lucide-react";
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
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Content Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการข้อมูลลูกค้า/คู่ค้า</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>รายชื่อทั้งหมดในระบบ</span>
            </div>
          </div>
          <Link href="/contacts/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm">
            <Plus size={18} />
            เพิ่มรายชื่อใหม่
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {contacts.length > 0 ? contacts.map((contact: any) => (
            <div key={contact.id} className="bg-white rounded shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
               <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                     <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center text-blue-600 text-xl font-bold border border-gray-200">
                        {contact.name.charAt(0)}
                     </div>
                     <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase rounded border border-blue-100">
                        {contact.contact_type || 'General'}
                     </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800 mb-4">{contact.name}</h3>

                  <div className="space-y-3 text-sm text-gray-600">
                     <div className="flex items-center gap-3">
                        <Mail size={14} className="text-gray-400" />
                        <span className="truncate">{contact.email || '-'}</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <Phone size={14} className="text-gray-400" />
                        <span>{contact.phone || '-'}</span>
                     </div>
                     <div className="flex items-start gap-3">
                        <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{contact.address || '-'}</span>
                     </div>
                  </div>
               </div>
               
               <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                  <Link href={`/contacts/edit/${contact.id}`} className="text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                     <Edit size={14} /> แก้ไขข้อมูล
                  </Link>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                     <ArrowRight size={16} />
                  </button>
               </div>
            </div>
          )) : (
            <div className="col-span-full py-24 text-center bg-white rounded border border-dashed border-gray-300">
               <Users size={48} className="text-gray-200 mx-auto mb-4" />
               <p className="text-gray-500 font-bold">ไม่พบข้อมูลรายชื่อในระบบ</p>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div className="text-center text-gray-400 text-xs font-medium pb-8 border-t border-gray-200 pt-6">
           © 2026 Microtronic Thailand.
        </div>
      </div>
    </main>
  );
}
