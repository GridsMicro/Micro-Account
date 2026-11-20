/**
 * Vercel Cron endpoint — แจ้งเตือนภาษีรายเดือน (LINE → Discord fallback)
 *
 * เรียกโดย Vercel cron วันละครั้งตาม vercel.json:
 *   GET /api/cron/tax-line
 *   Authorization: Bearer <CRON_SECRET>
 *
 * params สำหรับทดสอบ (เรียกเองได้ ไม่ต้องรอรอบ cron):
 *   ?dry=1    → แสดงข้อความเท่านั้น ไม่ยิง LINE/Discord
 *   ?force=1  → ข้ามการเช็ก TAX_LINE_REMINDER_DAYS และ TAX_LINE_CRON_ENABLED
 *
 * ความจริง Vercel (docs 2026):
 * - Hobby = cron ได้วันละครั้ง, ความแม่นยำ ±59 นาที, timezone UTC
 * - cron รันเฉพาะ production; ทดสอบ endpoint ด้วยการเรียก URL ตรง ๆ ได้
 * - Vercel ไม่ retry และอาจเรียกซ้ำได้ → ด้าน broadcast ต้องทนต่อการซ้ำ
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  // Fail-closed: ไม่มี secret = ไม่ยอมให้ใครเรียก route นี้
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false, reason: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const force = url.searchParams.get("force") === "1";

  // safety switch: ต้องตั้ง true ชัดเจนถึงจะส่งจริง (ห้ามเปิดเอง — กฎห้ามส่งจนกว่าพี่ฆังสั่ง)
  if (!force && process.env.TAX_LINE_CRON_ENABLED !== "true") {
    return Response.json({
      ok: true,
      skipped: true,
      reason: "TAX_LINE_CRON_ENABLED !== true",
    });
  }

  const { runSendTaxLineReminderOnce } = await import("../../../../jobs/sendTaxLineReminder");
  const result = await runSendTaxLineReminderOnce({ dryRun, force });

  return Response.json({
    ok: result.skipped || dryRun || Boolean(result.delivery?.sent),
    ...result,
  });
}
