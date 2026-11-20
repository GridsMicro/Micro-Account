import { NextResponse } from "next/server";
import { getPublicCompanySettings } from "@/lib/company-public";
import { requireActiveUser, authErrorResponse } from "@/lib/server-auth";

export async function GET() {
  // P0: ต้องล็อกอินด้วยบัญชี Active — และต้องไม่ส่ง secret column กลับไป
  const guard = await requireActiveUser();
  if (!guard.ok) return authErrorResponse(guard);

  try {
    const company = await getPublicCompanySettings();
    if (Object.keys(company).length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ company });
  } catch (e) {
    console.error("GET company error:", e);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}
