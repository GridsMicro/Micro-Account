// =====================================================
// Micro-Account: Server-side authorization boundary
// -----------------------------------------------------
// ใช้กับ Server Action / Route Handler เท่านั้น (ไม่ใช้ใน Edge middleware)
// หลักการ:
//  - ห้ามเชื่อ role/status จาก JWT เพียงอย่างเดียว → อ่านสถานะล่าสุดจาก DB ทุกครั้ง
//  - Pending / Inactive / ไม่มีตัวตนใน DB → ปฏิเสธทันที (fail-closed)
//  - สิทธิ์มาจาก group_permissions (RBAC) + role กลาง (superadmin/admin)
// =====================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { canAccessAdmin } from "@/lib/core-standards";
import {
  checkPermission,
  isAdmin,
  type ModuleName,
  type PermissionAction,
} from "@/lib/permissions";
import { isActiveStatus } from "@/lib/security-rules";

export type ServerAuthResult =
  | { ok: true; userId: string; email: string | null; role: string }
  | { ok: false; status: 401 | 403 | 500; error: string };

function denied(status: 401 | 403 | 500, error: string): ServerAuthResult {
  return { ok: false, status, error };
}

/** ตรวจ session + สถานะผู้ใช้ล่าสุดจาก DB (fail-closed) */
export async function requireActiveUser(): Promise<ServerAuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return denied(401, "Unauthorized — not authenticated");
  }

  type AuthRow = {
    id: number | string;
    email: string | null;
    role: string | null;
    status: string | null;
  };
  let user: AuthRow | undefined;
  try {
    const res = await query(
      "SELECT id, email, role, status FROM users WHERE id = $1 LIMIT 1",
      [session.user.id]
    );
    user = res.rows[0] as AuthRow | undefined;
  } catch {
    // ขาด DB = ไม่มีทางยืนยันสิทธิ์ → ปฏิเสธ
    return denied(500, "Unable to verify account status");
  }

  if (!user) {
    return denied(401, "Unauthorized — account not found");
  }
  if (!isActiveStatus(user.status)) {
    return denied(403, "Forbidden — account is not active");
  }

  return {
    ok: true,
    userId: String(user.id),
    email: user.email ?? null,
    role: String(user.role || ""),
  };
}

/** ตรวจสิทธิ์ต่อ module/action (superadmin/admin ผ่านทุก module ตาม RBAC_STANDARD) */
export async function requirePermission(
  module: ModuleName | string,
  action: PermissionAction
): Promise<ServerAuthResult> {
  const base = await requireActiveUser();
  if (!base.ok) return base;
  if (canAccessAdmin(base.role)) return base;

  const allowed = await checkPermission(base.userId, module, action);
  if (!allowed) {
    return denied(403, `Forbidden — ${module}:${action} permission required`);
  }
  return base;
}

/** ตรวจขอบเขต admin (role กลางหรือ group admin) */
export async function requireAdmin(): Promise<ServerAuthResult> {
  const base = await requireActiveUser();
  if (!base.ok) return base;
  if (canAccessAdmin(base.role)) return base;
  if (await isAdmin(base.userId)) return base;
  return denied(403, "Forbidden — admin access required");
}

/** แปลงผล guard เป็น JSON response สำหรับ API route */
export function authErrorResponse(guard: Exclude<ServerAuthResult, { ok: true }>) {
  return NextResponse.json(
    { success: false, error: guard.error },
    { status: guard.status }
  );
}

/** แปลงผล guard เป็น result รูปแบบ { success:false, error } สำหรับ Server Action */
export function authActionError(guard: Exclude<ServerAuthResult, { ok: true }>) {
  return { success: false as const, error: guard.error };
}

/**
 * helper สำหรับ Server Action: คืน null เมื่อผ่าน หรือ result {success:false}
 * ที่เอาไป `return` ได้ทันทีเมื่อไม่ผ่าน
 *
 *   const denied = await requireActionPermission("invoices", "create");
 *   if (denied) return denied;
 */
export async function requireActionPermission(
  module: ModuleName | string,
  action: PermissionAction
): Promise<{ success: false; error: string } | null> {
  const guard = await requirePermission(module, action);
  return guard.ok ? null : authActionError(guard);
}

/** helper สำหรับ Server Action ที่ต้องการแค่ผู้ใช้ Active (หน้าฟอร์ม/ข้อมูลพื้นฐาน) */
export async function requireActiveAction(): Promise<{ success: false; error: string } | null> {
  const guard = await requireActiveUser();
  return guard.ok ? null : authActionError(guard);
}
