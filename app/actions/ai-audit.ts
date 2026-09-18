"use server";

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
  try {
    const alerts = await getOpenAiAlerts();
    return { success: true, data: alerts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAiAlertCount() {
  try {
    const count = await getAlertCount();
    return { success: true, count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function triggerAiAudit() {
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
  try {
    await resolveAlert(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function dismissAiAlert(id: number) {
  try {
    await dismissAlert(id);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
