// Next.js server instrumentation — runs once at server startup.
// Fails fast if required environment variables are missing (P2-02).
export async function register() {
  const { validateEnv } = await import("@/lib/env");
  validateEnv();
  if (process.env.CRON_ENABLED === "true") {
    const { registerMaintenance } = await import("@/jobs/scheduleMaintenance");
    registerMaintenance();
  }
  // การแจ้งเตือนภาษีใช้ Vercel Cron (/api/cron/tax-line) ผ่าน vercel.json
  // ห้าม register node-cron ที่นี่ — serverless อาจเรียกซ้ำกับ Vercel cron
}