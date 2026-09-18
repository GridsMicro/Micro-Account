/**
 * Custom JWT Authentication Session Route
 * 
 * NOTE: This is NOT the NextAuth.js library route.
 * This is a custom JWT-based session verification endpoint.
 * 
 * Endpoint: GET/POST /api/auth/session
 * Purpose: Verify current user session from JWT cookie
 * Authentication: Requires valid session-token cookie with JWT
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET - Get current session
export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { user: session.user }
    );
  } catch (error) {
    console.error("Auth GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Login or verify session
export async function POST() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { user: session.user }
    );
  } catch (error) {
    console.error("Auth POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
