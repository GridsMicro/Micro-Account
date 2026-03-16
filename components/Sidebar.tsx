"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Receipt, 
  Users, 
  Package, 
  Settings, 
  BarChart3, 
  FileText,
  CreditCard,
  LogOut,
  Menu,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  if (pathname === "/login") return null;

  return (
    <>
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-[#0f172a] border-r border-[#1e293b] z-40 transition-all duration-500 ease-in-out font-sans flex flex-col shadow-2xl shadow-black",
        isOpen ? "w-[280px]" : "w-[88px]"
      )}>
        {/* Header Logo */}
        <div className="h-24 flex items-center px-6 gap-4 border-b border-[#1e293b] bg-gradient-to-r from-indigo-950/20 to-transparent">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform hover:rotate-12 duration-300">
            <Sparkles size={24} />
          </div>
          {isOpen && (
            <div className="overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
              <h1 className="text-xl font-black text-white tracking-tight italic">MICRO<span className="text-indigo-400">ACCOUNT</span></h1>
              <p className="text-[10px] text-cyan-400 uppercase font-black tracking-[0.2em] leading-none">Intelligence 2026</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden pt-8">
          {menuItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative",
                  active 
                    ? "bg-indigo-600/10 text-white border border-indigo-500/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={22} className={cn(
                  "transition-all duration-300",
                  active ? "text-indigo-400 scale-110" : "text-slate-500 group-hover:text-cyan-400 group-hover:scale-110"
                )} />
                {isOpen && (
                  <span className={cn(
                    "font-black text-sm transition-all",
                    active ? "text-white" : "group-hover:translate-x-1"
                  )}>
                    {item.label}
                  </span>
                )}
                
                {active && isOpen && (
                  <ChevronRight size={16} className="ml-auto text-indigo-400 animate-pulse" />
                )}
                
                {active && (
                  <div className="absolute left-0 w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle & Logout */}
        <div className="p-4 border-t border-[#1e293b] space-y-2">
           <button 
             onClick={() => setIsOpen(!isOpen)}
             className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-800 transition-all group"
           >
             {isOpen ? <X size={20} /> : <Menu size={20} />}
             {isOpen && <span className="font-bold text-xs uppercase tracking-widest text-slate-400">หุบแถบเมนู</span>}
           </button>
           
           <button 
             onClick={() => router.push("/login")}
             className={cn(
               "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all group",
               !isOpen && "justify-center"
             )}
           >
            <LogOut size={22} className="group-hover:rotate-180 transition-transform duration-500" />
            {isOpen && <span className="font-black italic">ออกจากระบบ</span>}
           </button>
        </div>
      </aside>

      {/* Content Offset */}
      <div className={cn(
        "hidden lg:block transition-all duration-500",
        isOpen ? "w-[280px]" : "w-[88px]"
      )} />
    </>
  );
}
