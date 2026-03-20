import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // 🔍 ค้นหาคุ้กกี้ที่เกี่ยวข้องกับการล็อกอิน (รองรับทั้ง next-auth และ authjs ตัวใหม่)
  const allCookies = req.cookies.getAll();
  const hasSessionCookie = allCookies.some(c => c.name.includes("session-token"));
  
  const isLoginPage = req.nextUrl.pathname === "/login";
  const isRegisterPage = req.nextUrl.pathname.startsWith("/register") || req.nextUrl.pathname.startsWith("/promote");

  // 1. ถ้าไม่มี Session และไม่ใช่หน้า Login/Register -> เตะไปหน้า Login
  if (!hasSessionCookie && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 2. ถ้ามี Session (ล็อกอินแล้ว) แต่จะเข้าหน้า Login -> โยนไปหน้า Dashboard ทันที
  if (hasSessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

// กำหนดทุกหน้ายกเว้นรูปภาพและ API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
