"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, Lock, Users, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";

type Group = {
  id: number;
  name: string;
  color: string;
  is_system: boolean;
  member_count: number;
  permission_count: number;
};

export default function PermissionsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coreRoles = [
    { 
      name: "superadmin", 
      label: "เจ้าของระบบ / superadmin",
      desc: "สิทธิ์สูงสุดของระบบ สามารถดูแลกลุ่มระบบและสิทธิ์ทั้งหมดได้",
      permissions: ["Manage System Groups", "Manage Members", "Manage Permissions"]
    },
    { 
      name: "admin", 
      label: "ผู้ดูแลระบบ / admin",
      desc: "ดูแลสมาชิก กลุ่ม และการตั้งค่าธุรกิจภายใต้นโยบาย RBAC",
      permissions: ["Manage Members", "Manage Custom Groups", "Module Administration"]
    },
    { 
      name: "user", 
      label: "ผู้ใช้ทั่วไป / user",
      desc: "ใช้งานตามสิทธิ์ที่ได้รับจากกลุ่มที่ถูกมอบหมายเท่านั้น",
      permissions: ["Group-Based Access", "Least Privilege"]
    },
  ];

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setError(null);
        const response = await fetch("/api/groups");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "โหลดข้อมูลกลุ่มไม่สำเร็จ");
        }
        setGroups(data.groups || []);
      } catch (e: any) {
        setError(e?.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const stats = useMemo(() => {
    const totalMembers = groups.reduce((sum, g) => sum + Number(g.member_count || 0), 0);
    const totalPermissionRows = groups.reduce((sum, g) => sum + Number(g.permission_count || 0), 0);
    return { totalMembers, totalPermissionRows };
  }, [groups]);

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
               <ShieldCheck size={32} />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                 จัดการสิทธิ์การเข้าถึง
              </h1>
              <p className="text-slate-400 font-bold text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                 <Lock size={14} className="text-indigo-500" /> Canonical RBAC + Core Roles
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/groups" className="h-14 px-8 bg-slate-900 text-white rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 group">
              จัดการกลุ่ม <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/admin/members" className="h-14 px-8 bg-white text-slate-800 border border-slate-200 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
              จัดการสมาชิก
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {coreRoles.map((role, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] shadow-lg shadow-slate-100 border border-slate-100 flex flex-col overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all group">
                 <div className="p-8 flex-1 text-left">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6 border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                       <Lock size={20} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight uppercase">{role.label}</h3>
                    <p className="text-[11px] font-bold text-slate-400 leading-relaxed mb-8 h-12 overflow-hidden">{role.desc}</p>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">Granted Actions</p>
                       <div className="flex flex-wrap gap-2">
                          {role.permissions.map((p, pIdx) => (
                             <span key={pIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                <CheckCircle2 size={10} /> {p}
                             </span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
           ))}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">RBAC Groups Snapshot</h3>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">
              Groups: {groups.length} | Members: {stats.totalMembers} | Permission Rows: {stats.totalPermissionRows}
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500 font-bold">กำลังโหลดข้อมูลกลุ่ม...</div>
          ) : error ? (
            <div className="p-8 text-red-700 flex items-center gap-3 font-bold">
              <AlertCircle size={18} /> {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-500">
                    <th className="px-8 py-4">Group</th>
                    <th className="px-8 py-4">Type</th>
                    <th className="px-8 py-4">Members</th>
                    <th className="px-8 py-4">Permission Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) => (
                    <tr key={group.id} className="border-b border-slate-50">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                          <span className="font-bold text-slate-800">{group.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold text-slate-600">{group.is_system ? "system" : "custom"}</td>
                      <td className="px-8 py-4 text-sm font-bold text-slate-600">{group.member_count}</td>
                      <td className="px-8 py-4 text-sm font-bold text-slate-600">{group.permission_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="py-10 text-center opacity-30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.8em]">Microtronic Security Shield • RBAC v2.1</p>
        </div>
      </div>
    </main>
  );
}
