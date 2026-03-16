import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Micro-Account Expert | ระบบบัญชีนวัตกรรมโลกใหม่",
  description: "ระบบจัการบัญชีและภาษีออนไลน์ 100% สำหรับธุรกิจยุคใหม่ โดย Microtronic (Thailand)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-[#f8fafc]`}
      >
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 overflow-x-hidden">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
