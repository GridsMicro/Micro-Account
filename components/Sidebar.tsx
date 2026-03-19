
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
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
  UserCog,
  Repeat,
  BookOpen,
  ShoppingCart,
  Wallet,
  Truck,
  Banknote,
  Library,
  Palette,
  X,
  User,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: Home, label: "หน้าแรก Dashboard", href: "/" },
  { separator: "การดำเนินธุรกิจ" },
  { icon: FileText, label: "ใบเสนอราคา (QT)", href: "/quotations" },
  { icon: Receipt, label: "ใบแจ้งหนี้ (INV)", href: "/invoices" },
  { icon: Repeat, label: "รอบบิลอัตโนมัติ", href: "/recurring" },
  { icon: CreditCard, label: "การชำระเงิน", href: "/payments" },
  { icon: Package, label: "คลังสินค้า", href: "/inventory" },
  { icon: Users, label: "ลูกค้า/คู่ค้า", href: "/contacts" },
  
  { separator: "สมุดบัญชีรายวัน (5 เล่ม)" },
  { icon: ShoppingCart, label: "สมุดรายวันขาย (Sales)", href: "/journals?type=sales" },
  { icon: Wallet, label: "สมุดรายวันรับเงิน (Receipt)", href: "/journals?type=receipt" },
  { icon: Truck, label: "สมุดรายวันซื้อ (Purchase)", href: "/journals?type=purchase" },
  { icon: Banknote, label: "สมุดรายวันจ่ายเงิน (Payment)", href: "/journals?type=payment" },
  { icon: Library, label: "สมุดรายวันทั่วไป (General)", href: "/journals" },
  
  { separator: "รายงานและตั้งค่า" },
  { icon: Palette, label: "แพทเทิร์นเอกสาร", href: "/settings/patterns" },
  { icon: BarChart3, label: "รายงานภาษี", href: "/tax-reports" },
  { icon: Settings, label: "ตั้งค่าระบบ", href: "/settings" },
];

const adminItems = [
  { icon: UserCog, label: "จัดการสมาชิก", href: "/admin/members" },
  { icon: ShieldCheck, label: "จัดการสิทธิ์", href: "/admin/permissions" },
];

type SidebarProps = {
  isLoggedIn?: boolean;
  userName?: string;
  userRole?: string;
};

export default function Sidebar({ 
  isLoggedIn = false, 
  userName = "Administrator", 
  userRole = "Active Edge" 
}: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header Toolbar: ปรากฏเฉพาะบนมือถือ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-violet-50 flex items-center justify-between px-6 z-40 shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-violet-200">
               M
            </div>
            <span className="font-black text-slate-800 tracking-tighter text-sm uppercase">Micro Account</span>
         </div>
         <button 
           onClick={() => setIsMobileOpen(true)}
           className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all active:scale-90"
         >
           <Menu size={24} />
         </button>
      </div>

      {/* Mobile Overlay Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 lg:hidden transition-all duration-500",
          isMobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setIsMobileOpen(false)}
      ></div>

      {/* Sidebar main body */}
      <aside 
        className={cn(
          "bg-slate-900 text-slate-300 transition-all duration-500 flex flex-col shadow-2xl z-[60] fixed lg:static h-full",
          // Desktop Widths
          isCollapsed ? "lg:w-24" : "lg:w-80",
          // Mobile Widths & Animation
          isMobileOpen ? "translate-x-0 w-80" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Logo & Toggle */}
        <div className="h-24 flex items-center justify-between px-8 border-b border-white/5 relative bg-slate-950/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black shadow-2xl shadow-violet-600/40 group relative overflow-hidden shrink-0">
               <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
               <span className="relative">M</span>
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col">
                 <span className="font-black text-white text-lg tracking-tight uppercase leading-none">MICROTRONIC</span>
                 <span className="text-[9px] font-black text-violet-400 uppercase tracking-[0.4em] mt-1">Autonomous</span>
              </div>
            )}
          </div>
          
          {/* Close button for Mobile only */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Segment */}
        {isLoggedIn && (!isCollapsed || isMobileOpen) && (
          <Link href="/profile" className="mx-6 mt-8 mb-6 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group group relative text-left">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-xl shrink-0 uppercase">
                   {userName ? userName.charAt(0) : "A"}
                </div>
                <div className="flex flex-col truncate">
                   <span className="text-sm font-black text-white tracking-tight">{userName}</span>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{userRole}</span>
                   </div>
                </div>
                <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-hover:text-violet-400 transition-colors" />
             </div>
          </Link>
        )}

        {/* Navigation Content */}
        <nav className="flex-1 py-4 overflow-y-auto px-4 space-y-8 scrollbar-hide">
          
          <div className="space-y-1">
            {menuItems.map((item, idx) => {
              if ('separator' in item) {
                return (!isCollapsed || isMobileOpen) ? (
                  <div key={`sep-${idx}`} className="mt-8 mb-3 px-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 opacity-40">
                      {item.separator}
                    </span>
                  </div>
                ) : <div key={`sep-${idx}`} className="h-px bg-white/5 my-6 mx-4"></div>;
              }

              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href || '#'));
              const Icon = item.icon!;

              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all relative group overflow-hidden",
                    isActive 
                      ? "bg-violet-600 text-white shadow-xl shadow-violet-900/40" 
                      : "hover:bg-white/5 text-slate-400 hover:text-white"
                  )}
                >
                  <Icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-violet-400")} />
                  {(!isCollapsed || isMobileOpen) && <span className="text-sm font-black tracking-tight">{item.label}</span>}
                  
                  {/* Active Indicator Bar */}
                  {isActive && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full"></div>}
                  
                  {/* Tooltip for collapsed view */}
                  {(isCollapsed && !isMobileOpen) && (
                    <div className="fixed left-24 px-4 py-2 bg-slate-800 text-white text-xs font-black rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100] shadow-2xl border border-white/5 uppercase tracking-widest">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Admin Tools Segment */}
          <div className="space-y-1 pb-10">
             {(!isCollapsed || isMobileOpen) && (
               <div className="px-4 mb-3">
                 <span className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 opacity-40">Security Module</span>
               </div>
             )}
             {adminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-lg transition-all group overflow-hidden",
                      isActive 
                        ? "bg-violet-600 text-white shadow-xl shadow-violet-900/40" 
                        : "hover:bg-white/5 text-slate-400 hover:text-white"
                    )}
                  >
                    <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-violet-400")} />
                    {(!isCollapsed || isMobileOpen) && <span className="text-sm font-black tracking-tight">{item.label}</span>}
                  </Link>
                );
             })}
          </div>
        </nav>

        {/* Unified Bottom Actions */}
        <div className="p-6 bg-slate-950/20 border-t border-white/5 space-y-3">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full h-12 hidden lg:flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all group"
          >
            {isCollapsed ? <Menu size={20} /> : <div className="flex items-center gap-3"><ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> <span className="text-[10px] font-black uppercase tracking-widest">COLLAPSE SYSTEM</span></div>}
          </button>
          
          {isLoggedIn && (
            <button 
              onClick={() => signOut({ redirect: true })}
              className="w-full h-12 flex items-center justify-center gap-3 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-lg transition-all group border border-white/5"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              {(!isCollapsed || isMobileOpen) && <span className="text-[10px] font-black uppercase tracking-widest">Secure Logout</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
