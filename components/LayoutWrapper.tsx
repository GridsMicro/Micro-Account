
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";

interface LayoutWrapperProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  userName: string;
  userRole: string;
  isPending: boolean;
}

export default function LayoutWrapper({ 
  children, 
  isLoggedIn, 
  userName, 
  userRole, 
  isPending 
}: LayoutWrapperProps) {
  const pathname = usePathname();
  
  // รายชื่อหน้าที่ "ห้าม" โชว์ Sidebar เด็ดขาด
  const authPaths = ["/login", "/register", "/promote"];
  const isAuthPage = authPaths.includes(pathname);

  // เงื่อนไขการโชว์ Sidebar ที่แม่นยำ 100%
  const showSidebar = isLoggedIn && !isAuthPage && !isPending;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar แสดงเฉพาะเมื่อล็อกอินแล้ว และไม่ได้อยู่ในหน้า Auth */}
      {showSidebar && (
        <Sidebar isLoggedIn={isLoggedIn} userName={userName} userRole={userRole} />
      )}
      
      {/* Main Content Area - Full height and flex to fill remaining space */}
      <div className="flex-1 flex flex-col overflow-x-hidden relative">
        {/* Subtle Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none -z-10"></div>
        
        {/* Main Content: Takes full height and fills remaining space */}
        <div className={cn(
          "flex-1 relative z-10 transition-all duration-300",
          showSidebar ? "pt-16 lg:pt-0" : ""
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}
