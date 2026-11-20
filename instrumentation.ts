// Next.js server instrumentation — runs once at server startup.
// Fails fast if required environment variables are missing (P2-02).
export async function register() {
  const { validateEnv } = await import("@/lib/env");
  validateEnv();
  // jobs/scheduleMaintenance → lib/googleScriptRunner ใช้ node-cron/child_process
  // ต้องไม่ถูก bundle เข้า Edge runtime — Next.js แนะนำให้เช็ก NEXT_RUNTIME
  // อ้างอิง: nextjs.org/docs/app/api-reference/file-conventions/instrumentation#specifying-the-runtime
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.CRON_ENABLED === "true") {
    const { registerMaintenance } = await import("@/jobs/scheduleMaintenance");
    registerMaintenance();
  }
  // การแจ้งเตือนภาษีใช้ Vercel Cron (/api/cron/tax-line) ผ่าน vercel.json
  // ห้าม register node-cron ที่นี่ — serverless อาจเรียกซ้ำกับ Vercel cron
}