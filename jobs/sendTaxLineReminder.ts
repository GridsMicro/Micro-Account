/**
 * ส่งแจ้งเตือนภาษีรายเดือน (LINE → Discord fallback)
 *
 * ใช้ได้ 2 แบบ:
 *   pnpm tax:notify          → ส่งจริงตามวันใน TAX_LINE_REMINDER_DAYS
 *   pnpm tax:notify:dry      → แสดงข้อความเท่านั้น (ไม่ยิง API/webhook)
 *   pnpm tax:notify --force  → ส่งจริงโดยไม่เช็กวัน (ใช้ทดสอบ)
 *
 * - งวดภาษี = เดือนก่อนหน้า · วันยื่น = 23 ของเดือนนี้ (e-Filing)
 * - READ-ONLY ต่อ DB — ไม่ UPDATE/DELETE
 * - dotenv โหลด .env.local ก่อน import lib/db (db fail-fast ถ้าไม่มี DATABASE_URL)
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export function reminderDays(): number[] {
  // ค่าเริ่มต้น = 1,10,14,20,22 (ตรวจ docs: 15 = กระดาษ, 23 = e-Filing)
  // ไม่ต้องตั้ง TAX_LINE_REMINDER_DAYS บน Vercel ก็ทำงานได้
  const raw = process.env.TAX_LINE_REMINDER_DAYS || "1,10,14,20,22";
  const days = raw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 31);
  return days.length ? days : [1, 10, 14, 20, 22];
}

export async function runSendTaxLineReminderOnce(opts?: {
  dryRun?: boolean;
  force?: boolean;
  now?: Date;
}): Promise<{
  skipped: boolean;
  reason?: string;
  summary?: Awaited<ReturnType<typeof import("../lib/taxMonthlySummary").buildMonthlyTaxMessage>>;
  delivery?: Awaited<ReturnType<typeof import("../lib/notificationClient").sendTaxNotification>>;
}> {
  const { bangkokNow, buildMonthlyTaxMessage } = await import("../lib/taxMonthlySummary");
  const { sendTaxNotification } = await import("../lib/notificationClient");

  const today = bangkokNow(opts?.now);
  const day = today.getDate();
  const days = reminderDays();
  if (!days.includes(day) && !opts?.dryRun && !opts?.force) {
    return { skipped: true, reason: `วันที่ ${day} ไม่อยู่ใน TAX_LINE_REMINDER_DAYS (${days.join(",")})` };
  }

  const summary = await buildMonthlyTaxMessage(today);
  const delivery = await sendTaxNotification(summary.message, { dryRun: opts?.dryRun });
  return { skipped: false, summary, delivery };
}

const isMainEntry =
  process.argv[1] && import.meta.url === "file://" + process.argv[1];

if (isMainEntry) {
  const dryRun = process.argv.includes("--dry") || process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  runSendTaxLineReminderOnce({ dryRun, force })
    .then((r) => {
      if (r.skipped) console.log("⏭ ไม่ส่ง: " + r.reason);
      else if (r.summary) {
        console.log(
          `📅 งวด ${r.summary.periodLabel} / ยื่นภายใน ${r.summary.deadlineLabel} / ภาษีขาย ฿${r.summary.outputVat.toFixed(2)} / ภาษีซื้อ ฿${r.summary.inputVat.toFixed(2)} / สุทธิ ฿${r.summary.netVat.toFixed(2)}`
        );
        console.log(
          "📢 แจ้งเตือน: " +
            (r.delivery?.sent
              ? `ส่งแล้วผ่าน ${r.delivery.channel}`
              : "ไม่ได้ส่ง (" + r.delivery?.reason + ")")
        );
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ ส่งแจ้งเตือนภาษีไม่สำเร็จ:", err);
      process.exit(1);
    });
}
