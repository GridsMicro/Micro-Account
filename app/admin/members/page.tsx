"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserCog, Plus, Mail, Shield, Trash2, Edit, Users, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

// Modal Portal Component - safely renders to body
function ModalPortal({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
  const [mounted, setMounted] = useState(false);
  
  // Mount once on client
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Handle body scroll lock
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, mounted]);
  
  if (!mounted || !isOpen) return null;
  
  return createPortal(children, document.body);
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Group {
  id: number;
  name: string;
  color: string;
  is_system: boolean;
}

export default function MembersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [userGroups, setUserGroups] = useState<number[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const response = await fetch("/api/users");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch users");
      setUsers([
        { id: 1, name: "Administrator", email: "admin@microtronic.biz", role: "Super Admin", status: "Active" },
        { id: 2, name: "Urasaya Pruksanusak", email: "urasayap@gmail.com", role: "Manager", status: "Active" },
        { id: 3, name: "New Member", email: "pending@example.com", role: "Pending", status: "Inactive" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchUserGroups = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}/groups`);
      if (!response.ok) throw new Error("Failed to fetch user groups");
      const data = await response.json();
      setUserGroups(data.groups.map((g: Group) => g.id));
    } catch (error) {
      console.error("Error fetching user groups:", error);
      setUserGroups([]);
    }
  };

  const openGroupModal = async (user: User) => {
    setSelectedUser(user);
    await fetchUserGroups(user.id);
    setIsGroupModalOpen(true);
  };

  const toggleGroup = (groupId: number) => {
    setUserGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const saveUserGroups = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: userGroups, replaceExisting: true }),
      });

      if (!response.ok) throw new Error("Failed to update groups");

      showToast("อัปเดตกลุ่มสำเร็จ", "success");
      setIsGroupModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error saving groups:", error);
      showToast("ไม่สามารถอัปเดตกลุ่มได้", "error");
    }
  };

  if (loading) {
    return (
      <main className="p-6 md:p-8 min-h-screen bg-[#f4f6f9]">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">กำลังโหลด...</p>
          </div>
        </div>
      </main>
    );
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
            <p className="text-gray-500 text-sm mt-1">จัดการผู้ใช้งานและกลุ่มการเข้าถึงระบบ</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/groups" 
              className="h-11 px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm"
            >
              <Shield size={18} /> จัดการกลุ่ม
            </Link>
            <Link 
              href="/admin/members/new" 
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-2 transition-all shadow-sm text-sm"
            >
              <Plus size={18} /> เพิ่มสมาชิกใหม่
            </Link>
          </div>
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
                       <th className="px-8 py-4">Groups</th>
                       <th className="px-8 py-4">Status</th>
                       <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
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
                             <button
                                onClick={() => openGroupModal(user)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors"
                             >
                                <Users size={14} />
                                จัดการกลุ่ม
                             </button>
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

      {/* Group Assignment Modal */}
      <ModalPortal isOpen={isGroupModalOpen}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">จัดการกลุ่ม</h2>
                <p className="text-sm text-gray-500">{selectedUser?.name}</p>
              </div>
              <button 
                onClick={() => setIsGroupModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    userGroups.includes(group.id)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: group.color + '20' }}
                  >
                    <Shield size={20} style={{ color: group.color }} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-500">
                      {group.is_system ? 'กลุ่มระบบ' : 'กลุ่มที่กำหนดเอง'}
                    </p>
                  </div>
                  {userGroups.includes(group.id) && (
                    <CheckCircle2 size={24} className="text-indigo-600" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
              <button
                onClick={() => setIsGroupModalOpen(false)}
                className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={saveUserGroups}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> บันทึก
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </main>
  );
}
