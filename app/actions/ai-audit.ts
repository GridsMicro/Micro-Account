"use server";
import { requireActionPermission } from "@/lib/server-auth";


import { revalidatePath } from "next/cache";
import {
  runAiAudit,
  getOpenAiAlerts,
  getAlertCount,
  resolveAlert,
  dismissAlert,
} from "@/lib/aiAudit";
import { auth } from "@/lib/auth";

export async function getAllAiAlerts() {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (reports:read)
  const __guard = await requireActionPermission("reports", "read");
  if (__guard) return __guard;
  try {
    const alerts = await getOpenAiAlerts();
    return { success: true, data: alerts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAiAlertCount() {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (reports:read)
  const __guard = await requireActionPermission("reports", "read");
  if (__guard) return __guard;
  try {
    const count = await getAlertCount();
    return { success: true, count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function triggerAiAudit() {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (reports:create)
  const __guard = await requireActionPermission("reports", "create");
  if (__guard) return __guard;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const result = await runAiAudit();
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveAiAlert(id: number) {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (reports:update)
  const __guard = await requireActionPermission("reports", "update");
  if (__guard) return __guard;
  try {
    await resolveAlert(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function dismissAiAlert(id: number) {
  // P0-1: server-side authorization — ห้ามเชื่อการซ่อนปุ่มใน UI (reports:update)
  const __guard = await requireActionPermission("reports", "update");
  if (__guard) return __guard;
  try {
    await dismissAlert(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
