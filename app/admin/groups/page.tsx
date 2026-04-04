"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Shield, 
  Plus, 
  Users, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  X,
  ChevronDown,
  ChevronRight,
  Lock,
  Eye,
  Save
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

// Modal Portal Component - renders outside normal DOM hierarchy
function ModalPortal({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Use requestAnimationFrame to avoid cascading renders
    const rafId = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!mounted || !isOpen) return null;
  
  return createPortal(
    children,
    document.body
  );
}
// Module definitions with Thai labels
const MODULES = [
  { id: "dashboard", name: "แดชบอร์ด", icon: "📊" },
  { id: "quotations", name: "ใบเสนอราคา", icon: "📄" },
  { id: "invoices", name: "ใบแจ้งหนี้", icon: "🧾" },
  { id: "recurring", name: "ใบแจ้งหนี้ประจำ", icon: "🔄" },
  { id: "receipts", name: "ใบเสร็จ", icon: "🧾" },
  { id: "inventory", name: "คลังสินค้า", icon: "📦" },
  { id: "expenses", name: "ค่าใช้จ่าย", icon: "💸" },
  { id: "journals", name: "สมุดรายวัน", icon: "📒" },
  { id: "vouchers", name: "ใบสำคัญ", icon: "📋" },
  { id: "contacts", name: "รายชื่อ", icon: "👥" },
  { id: "payments", name: "การชำระเงิน", icon: "💳" },
  { id: "tax_reports", name: "รายงานภาษี", icon: "📈" },
  { id: "reports", name: "รายงาน", icon: "📊" },
  { id: "calendar", name: "ปฏิทิน", icon: "📅" },
  { id: "settings", name: "ตั้งค่า", icon: "⚙️" },
  { id: "member_management", name: "จัดการสมาชิก", icon: "👤" },
  { id: "permissions", name: "สิทธิ์การใช้งาน", icon: "🔐" },
  { id: "groups", name: "กลุ่มผู้ใช้", icon: "🏢" },
];

// Permission actions with Thai labels
const PERMISSIONS = [
  { key: "can_create", label: "สร้าง", color: "bg-green-500" },
  { key: "can_read", label: "ดู", color: "bg-blue-500" },
  { key: "can_update", label: "แก้ไข", color: "bg-yellow-500" },
  { key: "can_delete", label: "ลบ", color: "bg-red-500" },
  { key: "can_export", label: "ส่งออก", color: "bg-purple-500" },
  { key: "can_manage", label: "จัดการ", color: "bg-indigo-500" },
];

interface Group {
  id: number;
  name: string;
  description: string | null;
  color: string;
  is_system: boolean;
  member_count: number;
  permission_count: number;
  created_at: string;
}

interface GroupPermission {
  id: number;
  group_id: number;
  module: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
  can_export: boolean;
  can_manage: boolean;
}

export default function GroupsPage() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });
  
  const [groupPermissions, setGroupPermissions] = useState<Record<string, GroupPermission>>({});

  const [error, setError] = useState<string | null>(null);

  // Fetch groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setError(null);
      const response = await fetch("/api/groups");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setGroups(data.groups || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      showToast("ไม่สามารถโหลดข้อมูลกลุ่มได้", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPermissions = async (groupId: number) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/permissions`);
      if (!response.ok) throw new Error("Failed to fetch permissions");
      const data = await response.json();
      
      // Convert to record for easy access
      const permRecord: Record<string, GroupPermission> = {};
      data.permissions.forEach((perm: GroupPermission) => {
        permRecord[perm.module] = perm;
      });
      
      // Fill in missing modules with defaults
      MODULES.forEach(mod => {
        if (!permRecord[mod.id]) {
          permRecord[mod.id] = {
            id: 0,
            group_id: groupId,
            module: mod.id,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
            can_export: false,
            can_manage: false,
          };
        }
      });
      
      setGroupPermissions(permRecord);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      showToast("ไม่สามารถโหลดข้อมูลสิทธิ์ได้", "error");
    }
  };

  const toggleGroupExpand = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create group");
      }

      showToast("สร้างกลุ่มสำเร็จ", "success");
      setIsCreateModalOpen(false);
      setFormData({ name: "", description: "", color: "#6366f1" });
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
      showToast(error instanceof Error ? error.message : "ไม่สามารถสร้างกลุ่มได้", "error");
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/api/groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update group");
      }

      showToast("อัปเดตกลุ่มสำเร็จ", "success");
      setIsEditModalOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      showToast(error instanceof Error ? error.message : "ไม่สามารถอัปเดตกลุ่มได้", "error");
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่ม "${group.name}"?`)) return;

    try {
      const response = await fetch(`/api/groups/${group.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete group");
      }

      showToast("ลบกลุ่มสำเร็จ", "success");
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      showToast(error instanceof Error ? error.message : "ไม่สามารถลบกลุ่มได้", "error");
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedGroup) return;

    try {
      const permissionsArray = Object.values(groupPermissions);
      
      const response = await fetch(`/api/groups/${selectedGroup.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsArray }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permissions");
      }

      showToast("บันทึกสิทธิ์สำเร็จ", "success");
      setIsPermissionModalOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error("Error saving permissions:", error);
      showToast(error instanceof Error ? error.message : "ไม่สามารถบันทึกสิทธิ์ได้", "error");
    }
  };

  const togglePermission = (module: string, permission: string) => {
    setGroupPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: !(prev[module] as unknown as Record<string, boolean>)[permission],
      },
    }));
  };

  const openEditModal = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      color: group.color,
    });
    setIsEditModalOpen(true);
  };

  const openPermissionModal = async (group: Group) => {
    setSelectedGroup(group);
    await fetchGroupPermissions(group.id);
    setIsPermissionModalOpen(true);
  };

  if (loading) {
    return (
      <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
        <div className="max-w-7xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">กำลังโหลด...</p>
          </div>
        </div>
      </main>
    );
  }

  // Error State
  if (error) {
    return (
      <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-red-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Shield className="text-red-500" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">เกิดข้อผิดพลาด</h1>
                <p className="text-slate-500">ไม่สามารถโหลดข้อมูลกลุ่มได้</p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
              <p className="text-red-700 font-mono text-sm">{error}</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchGroups}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                ลองใหม่
              </button>
              <Link 
                href="/"
                className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                กลับหน้าหลัก
              </Link>
            </div>
            {error.includes("relation") && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-amber-800 font-bold text-sm mb-2">⚠️ Database Migration ยังไม่ได้รัน</p>
                <p className="text-amber-700 text-sm">กรุณารันคำสั่ง SQL migration ในไฟล์:</p>
                <code className="block mt-2 p-3 bg-slate-900 text-green-400 rounded-lg text-xs font-mono">
                  scripts/migrate_rbac_groups.sql
                </code>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
               <Shield size={32} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                 จัดการกลุ่มผู้ใช้
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                 <Lock size={14} className="text-indigo-500" /> Dynamic RBAC Groups System
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-14 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={18} /> สร้างกลุ่มใหม่
          </button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 flex flex-col overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group">
                 <div className="p-8 flex-1 text-left">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 border-2 transition-all duration-500"
                      style={{ backgroundColor: group.color + '20', borderColor: group.color }}
                    >
                       <Shield size={20} style={{ color: group.color }} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">{group.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-6 h-12 overflow-hidden">
                      {group.description || "ไม่มีคำอธิบาย"}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex gap-4 mb-6">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Users size={16} />
                        <span className="text-sm font-bold">{group.member_count} สมาชิก</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <CheckCircle2 size={16} />
                        <span className="text-sm font-bold">{group.permission_count} สิทธิ์</span>
                      </div>
                    </div>
                    
                    {group.is_system && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                        <Lock size={10} /> กลุ่มระบบ
                      </span>
                    )}
                 </div>
                 
                 <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openPermissionModal(group)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                        title="จัดการสิทธิ์"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => openEditModal(group)}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                        title="แก้ไข"
                        disabled={group.is_system}
                        style={{ opacity: group.is_system ? 0.3 : 1 }}
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="ลบ"
                        disabled={group.is_system}
                        style={{ opacity: group.is_system ? 0.3 : 1 }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <Link 
                      href={`/admin/members?group=${group.id}`}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    >
                      ดูสมาชิก →
                    </Link>
                 </div>
              </div>
           ))}
        </div>

        {/* Create Group Modal */}
        <ModalPortal isOpen={isCreateModalOpen}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900">สร้างกลุ่มใหม่</h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อกลุ่ม</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="เช่น ฝ่ายบัญชี"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">คำอธิบาย</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                    rows={3}
                    placeholder="อธิบายหน้าที่และสิทธิ์ของกลุ่ม"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">สีประจำกลุ่ม</label>
                  <div className="flex gap-3 flex-wrap">
                    {['#dc2626', '#7c3aed', '#0891b2', '#059669', '#d97706', '#6b7280', '#6366f1', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-xl transition-all ${formData.color === color ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>

        {/* Edit Group Modal */}
        <ModalPortal isOpen={isEditModalOpen}>
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-slate-900">แก้ไขกลุ่ม</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อกลุ่ม</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">คำอธิบาย</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">สีประจำกลุ่ม</label>
                  <div className="flex gap-3 flex-wrap">
                    {['#dc2626', '#7c3aed', '#0891b2', '#059669', '#d97706', '#6b7280', '#6366f1', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-xl transition-all ${formData.color === color ? 'ring-4 ring-offset-2 ring-slate-300 scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>

        {/* Permission Matrix Modal - Side Drawer */}
        <ModalPortal isOpen={isPermissionModalOpen}>
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 transition-opacity"
              onClick={() => setIsPermissionModalOpen(false)}
            />
            {/* Side Drawer */}
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">จัดการสิทธิ์: {selectedGroup?.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">กำหนดสิทธิ์การเข้าถึงแต่ละโมดูล</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Check All Buttons */}
                  <div className="flex gap-2 mr-4">
                    <button
                      onClick={() => {
                        const allChecked: Record<string, GroupPermission> = {};
                        MODULES.forEach((mod) => {
                          allChecked[mod.id] = {
                            id: groupPermissions[mod.id]?.id || 0,
                            group_id: selectedGroup?.id || 0,
                            module: mod.id,
                            can_create: true,
                            can_read: true,
                            can_update: true,
                            can_delete: true,
                            can_export: true,
                            can_manage: true,
                          };
                        });
                        setGroupPermissions(allChecked);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200"
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      onClick={() => {
                        const allUnchecked: Record<string, GroupPermission> = {};
                        MODULES.forEach((mod) => {
                          allUnchecked[mod.id] = {
                            id: groupPermissions[mod.id]?.id || 0,
                            group_id: selectedGroup?.id || 0,
                            module: mod.id,
                            can_create: false,
                            can_read: false,
                            can_update: false,
                            can_delete: false,
                            can_export: false,
                            can_manage: false,
                          };
                        });
                        setGroupPermissions(allUnchecked);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      ยกเลิกทั้งหมด
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsPermissionModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              {/* Table Content */}
              <div className="flex-1 overflow-auto p-6">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b-2 border-slate-100">
                      <th className="text-left py-4 px-4 font-black text-slate-700 text-sm">โมดูล</th>
                      {PERMISSIONS.map((perm) => (
                        <th key={perm.key} className="text-center py-4 px-2 font-black text-slate-700 text-xs uppercase tracking-wider w-20">
                          <div className={`w-3 h-3 rounded-full ${perm.color} mx-auto mb-1`}></div>
                          {perm.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((module) => (
                      <tr key={module.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{module.icon}</span>
                            <span className="font-bold text-slate-700">{module.name}</span>
                          </div>
                        </td>
                        {PERMISSIONS.map((perm) => (
                          <td key={perm.key} className="py-3 px-2 text-center">
                            <button
                              onClick={() => togglePermission(module.id, perm.key)}
                              className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                                groupPermissions[module.id]?.[perm.key as keyof GroupPermission]
                                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                                  : 'bg-slate-100 hover:bg-slate-200'
                              }`}
                            >
                              {groupPermissions[module.id]?.[perm.key as keyof GroupPermission] && (
                                <CheckCircle2 size={16} />
                              )}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Footer Actions */}
              <div className="flex gap-3 p-6 border-t border-slate-100">
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} /> บันทึกสิทธิ์
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>

        <div className="py-10 text-center opacity-30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Microtronic Security Shield • RBAC Groups v1.0</p>
        </div>
      </div>
    </main>
  );
}
