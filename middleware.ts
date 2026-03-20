import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // เช็คคุ้กกี้ของ NextAuth ตรงๆ (ทั้งแบบ http และ https)
  const token = req.cookies.get("next-auth.session-token") || 
                req.cookies.get("__Secure-next-auth.session-token");
  
  const isLoginPage = req.nextUrl.pathname === "/login";

  // 1. ถ้าไม่มี Token (ไม่ได้ล็อกอิน) และไม่ใช่หน้า Login -> เตะไปหน้า Login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 2. ถ้ามี Token (ล็อกอินแล้ว) แต่จะเข้าหน้า Login -> โยนไปหน้า Dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

// กำหนดทุกหน้ายกเว้นรูปภาพและ API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
