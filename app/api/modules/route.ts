import { NextResponse } from "next/server";
import { getUserCompanyId } from "@/lib/auth";
import { applyModuleOverrides, getEnabledModules, MODULE_CATEGORIES, getPermissionModules } from "@/lib/module-registry";
import { getCompanyModuleOverrides } from "@/lib/module-config";
import { requireActiveUser, authErrorResponse } from "@/lib/server-auth";

export async function GET() {
  const guard = await requireActiveUser();
  if (!guard.ok) return authErrorResponse(guard);

  const baseModules = getEnabledModules();
  const companyId = await getUserCompanyId(guard.userId);
  const overrides = await getCompanyModuleOverrides(companyId);
  const modules = applyModuleOverrides(baseModules, overrides);

  return NextResponse.json({
    modules,
    categories: MODULE_CATEGORIES,
    permissionModules: getPermissionModules(),
  });
}

