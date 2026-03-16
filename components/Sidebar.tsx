"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  X
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
  const [isOpen, setIsOpen] = useState(true);

  if (pathname === "/login") return null;

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 rounded-2xl text-white shadow-xl flex items-center justify-center transition-transform active:scale-95"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Sidebar Container */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out font-sans overflow-hidden",
        isOpen ? "w-[280px]" : "w-0 lg:w-[88px]"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-50">
            <div className="w-10 h-10 min-w-[40px] bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <FileText size={20} />
            </div>
            {isOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">MicroAccount</h1>
                <p className="text-[10px] text-blue-600 uppercase font-bold tracking-widest leading-none">Smart Finance</p>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative",
                    active 
                      ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={22} className={cn(
                    "transition-transform group-hover:scale-110",
                    active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {isOpen && (
                    <span className={cn(
                      "font-bold transition-all",
                      active ? "text-blue-600" : "text-slate-600"
                    )}>
                      {item.label}
                    </span>
                  )}
                  {active && (
                    <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer / Profile */}
          <div className="p-4 border-t border-slate-50">
            <button className={cn(
              "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all group",
              !isOpen && "justify-center"
            )}>
              <LogOut size={22} />
              {isOpen && <span className="font-bold">ออกจากระบบ</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Spacer for Layout */}
      <div className={cn(
        "hidden lg:block transition-all duration-300",
        isOpen ? "w-[280px]" : "w-[88px]"
      )} />
    </>
  );
}
