import { NextResponse } from "next/server";
import { getUserPermissions } from "@/lib/permissions";
import { requireActiveUser, authErrorResponse } from "@/lib/server-auth";

// GET /api/user/permissions - Get current user's permissions
export async function GET() {
  const guard = await requireActiveUser();
  if (!guard.ok) return authErrorResponse(guard);
  try {
    const permissions = await getUserPermissions(guard.userId);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("GET /api/user/permissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
