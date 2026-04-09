import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { ToastProvider } from "@/components/ToastProvider";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Providers } from "@/components/Providers";
import GlobalAiChat from "@/components/GlobalAiChat";

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
  title: "Micro-Account Excellence | ระบบจัดการบัญชีอัจฉริยะ",
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

  // 🔥 Fetch latest status to ensure security
  const userStatusRes = isLoggedIn ? await query("SELECT status FROM users WHERE id = $1", [session?.user?.id]) : { rows: [] };
  const isPending = userStatusRes.rows[0]?.status === "Pending";

  const userName = session?.user?.name || "Administrator";
  const userRole = (session?.user as any)?.role || "Active Edge";

  return (
    <html lang="th" className={`${fontOutfit.variable} ${fontInter.variable}`}>
      <body
        className="antialiased font-inter bg-[#fdfaff] text-slate-900 scroll-smooth"
      >
        <Providers>
          <ToastProvider>
            <LayoutWrapper 
              isLoggedIn={isLoggedIn} 
              userName={userName} 
              userRole={userRole} 
              isPending={isPending}
            >
              {children}
            </LayoutWrapper>
          </ToastProvider>
        </Providers>
        <GlobalAiChat />
        <GlobalAiChat />
      </body>
    </html>
  );
}
