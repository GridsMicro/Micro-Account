import cron from "node-cron";
import { runGoogleScript } from "../lib/googleScriptRunner";

export function registerMaintenance() {
  cron.schedule("0 2 * * *", async () => {
    const res = await runGoogleScript("auto-backup");
    if (res.ok) {
      console.log(`[CRON] auto-backup OK (${new Date().toISOString()})`);
    } else {
      console.error(`[CRON] auto-backup failed: ${res.stderr}`);
    }
  });

  cron.schedule("5 2 * * *", async () => {
    const res = await runGoogleScript("dashboard-sheet");
    if (res.ok) {
      console.log(`[CRON] dashboard-sheet OK (${new Date().toISOString()})`);
    } else {
      console.error(`[CRON] dashboard-sheet failed: ${res.stderr}`);
    }
  });

  console.log("[CRON] Maintenance registered: auto-backup 02:00, dashboard-sheet 02:05");
}

export async function runMaintenanceOnce() {
  const results = await Promise.all([
    runGoogleScript("auto-backup"),
    runGoogleScript("dashboard-sheet"),
  ]);
  return {
    backup: results[0],
    dashboard: results[1],
  };
}