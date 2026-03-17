
import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${fontOutfit.variable} ${fontInter.variable}`}>
      <body
        className="antialiased font-inter bg-[#fdfaff] text-slate-900 scroll-smooth"
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 overflow-x-hidden relative">
            {/* Subtle Gradient Overlay for Premium Look */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-violet-50/50 to-transparent pointer-events-none -z-10"></div>
            
            {/* Main Content: pt-16 on mobile to avoid Toolbar overlap */}
            <div className="relative z-10 pt-16 lg:pt-0">
               {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
