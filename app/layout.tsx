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

  // P0: อ่านสถานะล่าสุดจาก DB ทุกครั้ง — ไม่เชื่อ role/status ใน JWT
  // ถ้าอ่าน DB ไม่ได้ → ปฏิเสธ (fail-closed) แต่แสดงหน้าแจ้งแทนการ 500 ทั้งแอพ
  let dbStatus = "";
  if (isLoggedIn) {
    try {
      const userStatusRes = await query(
        "SELECT status FROM users WHERE id = $1 LIMIT 1",
        [session?.user?.id]
      );
      dbStatus = String(userStatusRes.rows[0]?.status || "").trim().toLowerCase();
    } catch {
      dbStatus = "";
    }
  }
  const isActive = !isLoggedIn || dbStatus === "active";

  const userName = session?.user?.name || "Administrator";
  const userRole = (session?.user as any)?.role || "Active Edge";

  return (
    <html lang="th">
      <body
        className="antialiased font-sans bg-[#fdfaff] text-slate-900 scroll-smooth"
      >
        <Providers>
          <ToastProvider>
            {isActive ? (
              <LayoutWrapper
                isLoggedIn={isLoggedIn}
                userName={userName}
                userRole={userRole}
                isPending={false}
              >
                {children}
              </LayoutWrapper>
            ) : (
              // Server boundary: ไม่ส่ง children (เนื้อหาหน้า) ให้บัญชีที่ไม่ Active เด็ดขาด
              <div className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
                  <h1 className="text-xl font-semibold text-slate-900">ยังเข้าใช้งานไม่ได้</h1>
                  <p className="mt-2 text-sm text-slate-600">
                    บัญชีของคุณยังไม่เปิดใช้งาน илиถูกระงับ กรุณาติดต่อผู้ดูแลระบบ
                  </p>
                  <form action="/api/logout" method="post" className="mt-6">
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      ออกจากระบบ
                    </button>
                  </form>
                </div>
              </div>
            )}
          </ToastProvider>
        </Providers>
        {isActive && <GlobalAiChat />}
      </body>
    </html>
  );
}
