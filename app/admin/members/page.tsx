import { query } from "@/lib/db";
import { UserCog, Plus, Mail, Shield, Trash2, Edit } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  // Attempt to fetch users, or use dummy if table doesn't exist/empty
  let users = [];
  try {
    const res = await query('SELECT * FROM users ORDER BY created_at DESC');
    users = res.rows;
  } catch (e) {
    // If table doesn't exist, we'll show dummy for demonstration
    users = [
      { id: 1, name: "Administrator", email: "admin@microtronic.biz", role: "Super Admin", status: "Active" },
      { id: 2, name: "Urasaya Pruksanusak", email: "urasayap@gmail.com", role: "Editor", status: "Active" },
      { id: 3, name: "New Member", email: "pending@example.com", role: "Pending", status: "Inactive" },
    ];
  }

  return (
    <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-3">
               <UserCog className="text-blue-600" /> จัดการสมาชิก (Member Management)
            </h1>
            <p className="text-gray-500 text-sm mt-1">จัดการผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</p>
          </div>
          <Link href="/admin/members/new" className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm">
            <Plus size={18} /> เพิ่มสมาชิกใหม่
          </Link>
        </div>

        {/* Member Table Card */}
        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
           <div className="bg-gray-50 px-8 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-700 uppercase tracking-tighter text-sm flex items-center gap-2">
                 <Shield size={16} className="text-blue-500" /> รายชื่อผู้ใช้งานทั้งหมด
              </h3>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                       <th className="px-8 py-4">User</th>
                       <th className="px-8 py-4">Email</th>
                       <th className="px-8 py-4">Role</th>
                       <th className="px-8 py-4">Status</th>
                       <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {users.map((user: any) => (
                       <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold border border-blue-100">
                                   {user.name.charAt(0)}
                                </div>
                                <span className="font-bold text-gray-800 text-sm">{user.name}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-sm text-gray-600">
                             <div className="flex items-center gap-2">
                                <Mail size={14} className="text-gray-400" />
                                {user.email}
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded border border-gray-200">
                                {user.role || 'Member'}
                             </span>
                          </td>
                          <td className="px-8 py-5">
                             <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${
                                user.status === 'Active' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                             }`}>
                                {user.status || 'Unknown'}
                             </span>
                          </td>
                           <td className="px-8 py-5 text-right">
                              <div className="flex justify-end gap-2">
                                 <Link href={`/admin/members/edit/${user.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit size={16} />
                                 </Link>
                                 <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs font-medium">
           © 2026 Microtronic Thailand. Control Panel v1.0
        </div>
      </div>
    </main>
  );
}
