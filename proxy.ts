import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/register"];
const PUBLIC_PREFIXES = ["/api/auth"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isPublicPrefix = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isPublicPath || isPublicPrefix) {
    return NextResponse.next();
  }

  const session = (req as NextRequest & { auth?: unknown }).auth;
  if (session) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
