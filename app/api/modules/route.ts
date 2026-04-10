import { NextResponse } from "next/server";
import { auth, getUserCompanyId } from "@/lib/auth";
import { applyModuleOverrides, getEnabledModules, MODULE_CATEGORIES, getPermissionModules } from "@/lib/module-registry";
import { getCompanyModuleOverrides } from "@/lib/module-config";

export async function GET() {
  const baseModules = getEnabledModules();
  let modules = baseModules;

  const session = await auth();
  if (session?.user?.id) {
    const companyId = await getUserCompanyId(session.user.id);
    const overrides = await getCompanyModuleOverrides(companyId);
    modules = applyModuleOverrides(baseModules, overrides);
  }

  return NextResponse.json({
    modules,
    categories: MODULE_CATEGORIES,
    permissionModules: getPermissionModules(),
  });
}

