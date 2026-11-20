import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Enforce JWT secret: MUST be set in environment, no fallback allowed
function getJWTSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "FATAL: JWT secret is not configured. Set NEXTAUTH_SECRET or AUTH_SECRET environment variable. " +
      "This is a security-critical requirement to prevent session forgery."
    );
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getJWTSecret();

const GENERIC_LOGIN_ERROR = "Invalid credentials";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    // Query user — ไม่ log อีเมล/สถานะ/ผลเทียบรหัส (กันข้อมูลระบุตัวตนหลุดใน log)
    const res = await query(
      "SELECT id, email, password, name, role, status FROM users WHERE email = $1",
      [email]
    );

    // คำตอบเดียวกันทุกกรณีที่ล็อกอินไม่ได้ → ป้องกัน user enumeration
    if (res.rows.length === 0) {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    const user = res.rows[0];
    const status = String(user.status || "").trim().toLowerCase();

    // P0: เฉพาะบัญชี Active เท่านั้นที่ได้ session (Pending/Inactive/อื่น ๆ ปฏิเสธหมด)
    if (status !== "active") {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 401 });
    }

    // Create JWT — แนบ status ให้ proxy กรอง session เก่าที่ไม่ใช่ Active ได้ทันที
    const token = await new SignJWT({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: "Active",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(SECRET);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 1 day
      path: "/",
    });

    // log แค่เหตุการณ์ ไม่แนบตัวตน/รายละเอียด error กลับไปหา client
    console.log("[LOGIN API] sign-in succeeded");
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch {
    console.error("[LOGIN API] sign-in failed");
    return NextResponse.json({ error: GENERIC_LOGIN_ERROR }, { status: 500 });
  }
}
