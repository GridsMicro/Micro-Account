import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { ToastProvider } from "@/components/ToastProvider";
import LayoutWrapper from "@/components/LayoutWrapper";
import { Providers } from "@/components/Providers";
import GlobalAiChat from "@/components/GlobalAiChat";

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
    <html lang="th">
      <body
        className="antialiased font-sans bg-[#fdfaff] text-slate-900 scroll-smooth"
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
      </body>
    </html>
  );
}
