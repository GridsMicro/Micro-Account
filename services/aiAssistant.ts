import fetch from 'node-fetch';

/**
 * ส่งข้อความ Prompt ไปยังโมเดล Gemini พร้อมระบบ Retry เมื่อเซิร์ฟเวอร์ยุ่ง
 */
export async function askGemini(prompt: string, retries = 3, delay = 1000): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY ไม่ได้ตั้งค่าใน environment');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      if (response.status === 503 || response.status === 429) {
        if (i === retries - 1) throw new Error(`Gemini API ยุ่งเกินไป (503) หลังจากลอง ${retries} ครั้ง`);
        console.log(`⚠️ Gemini API ยุ่ง (พยายามครั้งที่ ${i + 1}/${retries})... รอ ${delay}ms`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // เพิ่มเวลารอแบบทวีคูณ (Exponential Backoff)
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      interface GeminiResponse {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      }

      const data = (await response.json()) as GeminiResponse;
      const result = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof result !== 'string') throw new Error('ไม่ได้รับข้อความผลลัพธ์จาก Gemini');
      return result.trim();

    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.error(`❌ ข้อผิดพลาดในการเรียก AI (ครั้งที่ ${i + 1}):`, error.message);
      await new Promise(res => setTimeout(res, delay));
      delay *= 2;
    }
  }
  
  throw new Error('ไม่สามารถเชื่อมต่อกับ AI ได้');
}

