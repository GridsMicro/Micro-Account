"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  FileText, 
  Receipt, 
  CreditCard, 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  ShieldCheck,
  UserCog
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "หน้าแรก", href: "/" },
  { icon: FileText, label: "ใบเสนอราคา", href: "/quotations" },
  { icon: Receipt, label: "ใบแจ้งหนี้", href: "/invoices" },
  { icon: CreditCard, label: "การชำระเงิน", href: "/payments" },
  { icon: Package, label: "คลังสินค้า", href: "/inventory" },
  { icon: Users, label: "ลูกค้า/คู่ค้า", href: "/contacts" },
  { icon: BarChart3, label: "รายงานภาษี", href: "/tax-reports" },
  { icon: Settings, label: "ตั้งค่าระบบ", href: "/settings" },
];

const adminItems = [
  { icon: UserCog, label: "จัดการสมาชิก", href: "/admin/members" },
  { icon: ShieldCheck, label: "จัดการสิทธิ์", href: "/admin/permissions" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen bg-[#343a40] text-[#c2c7d0] transition-all duration-300 flex flex-col shadow-xl",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-700 bg-[#343a40]">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shrink-0">
          M
        </div>
        {!isCollapsed && (
          <span className="ml-3 font-bold text-white text-lg tracking-tight truncate">
            MICRO ACCOUNT
          </span>
        )}
      </div>

      {/* Profile */}
      {!isCollapsed && (
        <div className="px-6 py-6 border-b border-gray-700 hidden md:block">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white border border-gray-500">
                 N
              </div>
              <div className="flex flex-col truncate">
                 <span className="text-sm font-semibold text-white">Administrator</span>
                 <span className="text-xs text-gray-400">Online</span>
              </div>
           </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded transition-colors group relative",
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                      : "hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!isCollapsed && (
          <div className="mt-6 mb-2 px-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Administrator</span>
          </div>
        )}

        <ul className="space-y-1 px-3">
          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded transition-colors group relative",
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                      : "hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!isCollapsed && (
          <div className="mt-6 mb-2 px-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Administrator</span>
          </div>
        )}

        <ul className="space-y-1 px-3">
          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded transition-colors group relative",
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                      : "hover:bg-gray-700 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-white" : "text-gray-400 group-hover:text-white")} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-gray-800 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-gray-700">
                      {item.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700 space-y-2 bg-[#2f343a]">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full h-10 flex items-center justify-center gap-3 hover:bg-gray-700 rounded transition-colors"
        >
          {isCollapsed ? <Menu size={18} /> : <div className="flex items-center gap-3"><ChevronLeft size={18} /> <span className="text-sm">หุบแถบเมนู</span></div>}
        </button>
        
        <Link 
          href="/login"
          className="w-full h-10 flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white rounded transition-colors group"
        >
          <LogOut size={18} className="text-gray-400 group-hover:text-white" />
          {!isCollapsed && <span className="text-sm">ออกจากระบบ</span>}
        </Link>
      </div>
    </aside>
  );
}
