import { NextResponse } from "next/server";

/**
 * DEBUG AUTH ENDPOINT - DISABLED FOR SECURITY
 * 
 * This endpoint previously exposed sensitive information:
 * - User existence (user enumeration)
 * - Password match status (credential guessing)
 * - Stack traces (system reconnaissance)
 * 
 * For development diagnostics, use application logs instead.
 * For production, all auth failures return generic messages.
 */

export async function GET() {
  return NextResponse.json(
    {
      error: "Not found",
      message: "Debug endpoints are disabled in this build"
    },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Not found",
      message: "Debug endpoints are disabled in this build"
    },
    { status: 404 }
  );
}
