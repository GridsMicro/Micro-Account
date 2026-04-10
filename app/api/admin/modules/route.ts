import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import {
  applyModuleOverrides,
  getEnabledModules,
  MODULE_CATEGORIES,
  MODULE_REGISTRY,
} from "@/lib/module-registry";
import {
  getCompanyModuleOverrides,
  saveCompanyModuleOverrides,
} from "@/lib/module-config";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const companyId = await getUserCompanyId(session.user.id);
    const overrides = await getCompanyModuleOverrides(companyId);
    const modules = applyModuleOverrides(getEnabledModules(), overrides);

    return NextResponse.json({
      companyId,
      modules,
      moduleRegistry: MODULE_REGISTRY,
      categories: MODULE_CATEGORIES,
      overrides,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch module settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await req.json();
    const rawOverrides = (body?.overrides || {}) as Record<string, boolean>;
    const validModuleIds = new Set(MODULE_REGISTRY.map((m) => m.id));
    const overrides: Record<string, boolean> = {};
    for (const [moduleId, value] of Object.entries(rawOverrides)) {
      if (validModuleIds.has(moduleId)) overrides[moduleId] = value === true;
    }
    const companyId = await getUserCompanyId(session.user.id);

    await saveCompanyModuleOverrides(companyId, overrides, parseInt(session.user.id, 10));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update module settings" }, { status: 500 });
  }
}

