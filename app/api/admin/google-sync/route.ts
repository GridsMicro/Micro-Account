import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runGoogleScript } from "@/lib/googleScriptRunner";

export const dynamic = "force-dynamic";

const TASKS = {
  backup: ["auto-backup"],
  dashboard: ["dashboard-sheet"],
  all: ["auto-backup", "dashboard-sheet"],
} as const;

type TaskName = keyof typeof TASKS;

/**
 * POST /api/admin/google-sync
 *
 * PRIVILEGED ENDPOINT: Runs Google Account sync scripts on demand.
 * Body: { task: "backup" | "dashboard" | "all" }
 * REQUIRES: authenticated admin user only.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      console.warn(`[AUDIT] Unauthorized google-sync attempt`);
      return NextResponse.json({ error: "Unauthorized — not authenticated" }, { status: 401 });
    }

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== "ADMIN") {
      console.warn(`[AUDIT] google-sync denied - user ${session.user.email} (role: ${session.user.role})`);
      return NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 });
    }

    const body: { task?: string } | null = await req.json().catch(() => null);
    const task: TaskName = (body?.task as TaskName) || "all";

    console.log(
      `[AUDIT] Google sync (${task}) initiated by admin: ${session.user.email} (ID: ${session.user.id}) at ${new Date().toISOString()}`
    );

    const results: Record<string, { ok: boolean; stderr: string }> = {};
    let anyFailed = false;

    for (const name of TASKS[task] ?? TASKS.all) {
      const res = await runGoogleScript(name);
      results[name] = { ok: res.ok, stderr: res.stderr.slice(-2000) };
      if (!res.ok) anyFailed = true;
      console.log(`[AUDIT] google-sync ${name} → ${res.ok ? "OK" : "FAILED"}`);
    }

    return NextResponse.json({ success: !anyFailed, results });
  } catch (error) {
    console.error(`[ERROR] google-sync operation failed:`, error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}