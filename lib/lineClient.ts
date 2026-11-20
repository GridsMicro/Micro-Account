/**
 * LINE Messaging API client — แจ้งเตือนภาษีรายเดือน
 *
 * บันทึกโดย ฌอน 2026-11-20 ตามคำสั่งพี่ฆัง:
 * - ใช้ LINE Messaging API (LINE Notify ยุติบริการ 31 มี.ค. 2025)
 * - มาตรฐานเดียว: ปลายทาง = LINE_CHANNEL_ID · token = LINE_CHANNEL_ACCESS_TOKEN
 * - credential อ่านจาก env เท่านั้น — ห้าม hardcode / ห้าม log token
 * - ถ้าไม่มี credential หรือ dryRun → log ข้อความแทน ไม่ throw ให้ cron ล้ม
 */

export interface LineDeliveryResult {
  ok: boolean;
  sent: boolean;
  mode: "live" | "dry-run" | "no-credentials";
  reason?: string;
}

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

function getRecipient(): { to: string; source: string } | null {
  // มาตรฐานเดียวของพี่ฆัง — ไม่มีชื่อสำรอง
  const channelId = process.env.LINE_CHANNEL_ID?.trim();
  return channelId ? { to: channelId, source: "LINE_CHANNEL_ID" } : null;
}

/**
 * ส่งข้อความผ่าน LINE Messaging API push
 * @param text ข้อความที่ต้องการส่ง
 * @param opts.dryRun true = แสดงข้อความใน console เท่านั้น (ไม่ยิง API จริง)
 */
export async function sendLinePush(
  text: string,
  opts?: { dryRun?: boolean }
): Promise<LineDeliveryResult> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const recipient = getRecipient();

  if (!token || !recipient) {
    console.warn(
      "[line] ไม่ส่งจริง — ขาด credential (" +
        (!token ? "LINE_CHANNEL_ACCESS_TOKEN " : "") +
        (!recipient ? "LINE_CHANNEL_ID" : "") +
        ")\n" +
        text
    );
    return {
      ok: false,
      sent: false,
      mode: "no-credentials",
      reason: !token
        ? "LINE_CHANNEL_ACCESS_TOKEN not configured"
        : "LINE_CHANNEL_ID not configured",
    };
  }

  if (opts?.dryRun) {
    console.log("[line DRY-RUN] ข้อความที่จะส่ง (ปลายทางจาก " + recipient.source + "):\n" + text);
    return { ok: true, sent: false, mode: "dry-run", reason: "dry-run" };
  }

  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: recipient.to,
        messages: [{ type: "text", text: text.slice(0, 5000) }],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        sent: false,
        mode: "live",
        reason: `LINE responded ${res.status}${detail ? ": " + detail.slice(0, 200) : ""}`,
      };
    }
    return { ok: true, sent: true, mode: "live" };
  } catch (err: unknown) {
    return {
      ok: false,
      sent: false,
      mode: "live",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
