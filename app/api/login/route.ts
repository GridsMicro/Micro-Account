import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "secret-key"
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    console.log("[LOGIN API] Email:", email);

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Query user
    const res = await query(
      "SELECT id, email, password, name, role, status FROM users WHERE email = $1",
      [email]
    );

    if (res.rows.length === 0) {
      console.log("[LOGIN API] User not found");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const user = res.rows[0];
    console.log("[LOGIN API] User found:", user.email, "Status:", user.status);

    if (user.status === "Inactive") {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    console.log("[LOGIN API] Password match:", match);

    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create JWT
    const token = await new SignJWT({
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
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

    console.log("[LOGIN API] Success");
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("[LOGIN API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
