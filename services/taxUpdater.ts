import { askGemini } from './aiAssistant';
import fetch from 'node-fetch';

/**
 * ดึงข้อมูลอัปเดตภาษีล่าสุดจากกรมสรรพากร (RSS หรือ API) แล้วสรุปด้วย Gemini
 * @returns สรุปข้อความของการเปลี่ยนแปลงภาษี
 */
export async function fetchLatestTaxUpdates(): Promise<string> {
  // ตัวอย่าง URL RSS ของกรมสรรพากร – สามารถเปลี่ยนเป็น API จริงได้
  const rssUrl = 'https://www.rd.go.th/rss/tax-updates.xml';
  const rssResponse = await fetch(rssUrl);
  if (!rssResponse.ok) {
    throw new Error(`ไม่สามารถดึง RSS ได้: ${rssResponse.status}`);
  }
  const rssText = await rssResponse.text();

  // ใช้ Gemini สรุปเนื้อหา RSS ให้สั้นลงและเข้าใจง่าย
  const prompt = `สรุปข้อกำหนดภาษีล่าสุดจากข้อความต่อไปนี้ (ภาษาไทย):\n${rssText}`;
  const summary = await askGemini(prompt);
  return summary;
}
