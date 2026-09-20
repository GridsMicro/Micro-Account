import { askGemini } from './aiAssistant';
import fetch from 'node-fetch';

/**
 * ดึงข้อมูลอัปเดตภาษีล่าสุดจากกรมสรรพากร (RSS หรือ API) แล้วสรุปด้วย Gemini
 * @returns สรุปข้อความของการเปลี่ยนแปลงภาษี
 */
export async function fetchLatestTaxUpdates(): Promise<string> {
  const rssUrl = 'https://www.rd.go.th/rss/tax-updates.xml';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  // สิ้นสุดอย่างปลอดภัย ไม่ให้ script ค้างนานเกิน 15 วิ
  // (URL เดิมตรวจแล้ว 2026-09-21: HTTP 500 ~10 วิ — RD ปรับโครงเว็บไซต์)
  let rssResponse;
  try {
    rssResponse = await fetch(rssUrl, { signal: controller.signal });
    if (!rssResponse.ok) {
      return `⚠️ ไม่สามารถดึงข่าวสารจากกรมสรรพากรได้ (HTTP ${rssResponse.status} จาก ${rssUrl}). ตรวจสอบกำหนดยื่นจากคู่มือภาษีภายในระบบแทน.`;
    }
  } catch (err: unknown) {
    const msg = (err as { name?: string })?.name === 'AbortError'
      ? 'หมดเวลา 15 วินาที (timeout)'
      : (err as Error)?.message || String(err);
    return `⚠️ ไม่สามารถดึงข่าวสารจากกรมสรรพากรได้ (${msg}). ตรวจสอบกำหนดยื่นจากคู่มือภาษีภายในระบบแทน.`;
  } finally {
    clearTimeout(timer);
  }

  const rssText = await rssResponse.text();

  // ใช้ Gemini สรุปเนื้อหา RSS ให้สั้นลงและเข้าใจง่าย
  const prompt = `สรุปข้อกำหนดภาษีล่าสุดจากข้อความต่อไปนี้ (ภาษาไทย):\n${rssText}`;
  const summary = await askGemini(prompt);
  return summary;
}
