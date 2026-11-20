/**
 * ส่งแจ้งเตือนภาษี: LINE ก่อน → Discord webhook เป็นทางสำรอง
 *
 * บันทึกโดย ฌอน 2026-11-20 ตามคำสั่งพี่ฆัง:
 * - ทางหลัก = LINE Messaging API (LINE_CHANNEL_ID + LINE_CHANNEL_ACCESS_TOKEN)
 * - ทางสำรอง = Discord webhook (DISCORD_WEBHOOK_URL) ใช้เมื่อ LINE ส่งไม่สำเร็จ
 * - dryRun = แสดงข้อความใน console เท่านั้น ไม่ยิง URL ภายนอกใด ๆ
 * - ห้าม log หรือ hardcode ค่า credential และ webhook URL
 */

import { sendLinePush, type LineDeliveryResult } from "./lineClient";

export interface DiscordDeliveryResult {
  ok: boolean;
  sent: boolean;
  mode: "live" | "dry-run" | "no-credentials";
  reason?: string;
}

export interface TaxNotificationResult {
  sent: boolean;
  channel: "line" | "discord" | "none";
  dryRun: boolean;
  line: LineDeliveryResult;
  discord?: DiscordDeliveryResult;
  reason?: string;
}

const DISCORD_LIMIT = 1900; // Discord content limit 2000 — เผื่อ margins

/** ส่งข้อความหา Discord webhook (ไม่ log URL) */
async function sendDiscord(
  text: string,
  opts?: { dryRun?: boolean }
): Promise<DiscordDeliveryResult> {
  const webhook = process.env.DISCORD_WEBHOOK_URL?.trim();
  if (!webhook) {
    return { ok: false, sent: false, mode: "no-credentials", reason: "DISCORD_WEBHOOK_URL not configured" };
  }
  if (opts?.dryRun) {
    console.log("[discord DRY-RUN] ข้อความสำรองที่จะส่ง:\n" + text);
    return { ok: true, sent: false, mode: "dry-run", reason: "dry-run" };
  }
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.slice(0, DISCORD_LIMIT) }),
    });
    if (!res.ok) {
      return {
        ok: false,
        sent: false,
        mode: "live",
        reason: `Discord responded ${res.status}`,
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

/**
 * ส่งแจ้งเตือนภาษี — พยายาม LINE ก่อน ถ้าไม่สำเร็จค่อยส่ง Discord
 */
export async function sendTaxNotification(
  text: string,
  opts?: { dryRun?: boolean }
): Promise<TaxNotificationResult> {
  const line = await sendLinePush(text, opts);

  // dry-run ของ LINE แปลว่าทดสอบสำเร็จ — ไม่ต้องยิง Discord ซ้ำ
  if (line.mode === "dry-run") {
    return { sent: false, channel: "none", dryRun: true, line, reason: "dry-run" };
  }
  if (line.sent) {
    return { sent: true, channel: "line", dryRun: false, line };
  }

  console.warn("[notify] LINE ส่งไม่สำเร็จ (" + line.reason + ") — ลอง Discord แทน");
  const discord = await sendDiscord(text, opts);
  if (discord.sent) {
    return { sent: true, channel: "discord", dryRun: false, line, discord };
  }
  return {
    sent: false,
    channel: "none",
    dryRun: false,
    line,
    discord,
    reason: discord.reason || line.reason,
  };
}
