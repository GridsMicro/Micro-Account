
import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { auth } from "@/lib/auth";

const fontOutfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Micro-Account Excellence | ม่วงพาสเทลพรีเมียม",
  description: "ระบบจัดการบัญชีและภาษีออนไลน์ 100% สไตล์ Enterprise Premium โดย Microtronic (Thailand)",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isLoggedIn = !!session;
  
  // 🔥 Hide sidebar on login/register/promote pages
  const isAuthPage = children && (
    (children as any).props?.childProp?.segment === 'login' || 
    (children as any).props?.childProp?.segment === 'register' ||
    (children as any).props?.childProp?.segment === 'promote'
  );

  // Fallback for metadata-based detection if segments fail
  const userName = session?.user?.name || "Administrator";
  const userRole = (session?.user as any)?.role || "Active Edge";

  return (
    <html lang="th" className={`${fontOutfit.variable} ${fontInter.variable}`}>
      <body
        className="antialiased font-inter bg-[#fdfaff] text-slate-900 scroll-smooth"
      >
        <div className="flex min-h-screen">
          {/* Hide Sidebar on Login/Register pages even if session exists somehow */}
          {isLoggedIn && !isAuthPage && (
            <Sidebar isLoggedIn={isLoggedIn} userName={userName} userRole={userRole} />
          )}
          <div className="flex-1 overflow-x-hidden relative">
            {/* Subtle Gradient Overlay for Premium Look */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none -z-10"></div>
            
            {/* Main Content: apply padding only if sidebar is present */}
            <div className={`relative z-10 ${isLoggedIn && !isAuthPage ? 'pt-16 lg:pt-0' : ''}`}>
               {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
