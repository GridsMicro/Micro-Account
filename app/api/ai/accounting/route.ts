import { NextResponse } from 'next/server';
import { askGemini } from '../../../../services/aiAssistant';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 📂 อ่านข้อมูลกฎระเบียบและคู่มือภาษีของบริษัท (Context Injection)
    const coreRulesPath = path.join(process.cwd(), 'CORE_RULES.md');
    const taxGuidePath = path.join(process.cwd(), 'docs', 'THAI_TAX_GUIDE.md');
    const businessContextPath = path.join(process.cwd(), 'docs', 'BUSINESS_CONTEXT.md');
    const supplierGuidePath = path.join(process.cwd(), 'docs', 'SUPPLIER_INVOICE_GUIDE.md');

    let coreRules = "";
    let taxGuide = "";
    let businessContext = "";
    let supplierGuide = "";

    try {
      coreRules = fs.existsSync(coreRulesPath) ? fs.readFileSync(coreRulesPath, 'utf8') : "";
      taxGuide = fs.existsSync(taxGuidePath) ? fs.readFileSync(taxGuidePath, 'utf8') : "";
      businessContext = fs.existsSync(businessContextPath) ? fs.readFileSync(businessContextPath, 'utf8') : "";
      supplierGuide = fs.existsSync(supplierGuidePath) ? fs.readFileSync(supplierGuidePath, 'utf8') : "";
    } catch (e) {
      console.error("Error reading context files:", e);
    }

    const systemInstruction = `
      คุณคือ "ผู้เชี่ยวชาญบัญชีและภาษีพญามังกร" ประจำบริษัท Micro-Account (ประเทศไทย)
      หน้าที่ของคุณคือให้ข้อมูลที่แม่นยำที่สุดตามกฎระเบียบและโมเดลธุรกิจของบริษัทที่กำหนดไว้ดังนี้:

      --- [BUSINESS MODEL & CONTEXT] ---
      ${businessContext}

      --- [SUPPLIER INVOICE GUIDE] ---
      ${supplierGuide}

      --- [ACCOUNTING SCHEMA] ---
      ${coreRules.substring(0, 3000)}
      
      --- [THAI TAX PRINCIPLES] ---
      ${taxGuide.substring(0, 3000)}

      --- [BUSINESS STRATEGY & PRICING RULES] ---
      เป้าหมายของคุณคือทำให้ Micro-Account เป็นบริษัทที่เติบโตและไม่ขาดทุน 
      เมื่อผู้ใช้ขอให้ "ตั้งราคาขาย", "คำนวณกำไร" หรือ "คิดราคาให้บริษัทโต":
      - ขั้นต้น: รวบรวม **ต้นทุนพื้นฐานทั้งหมด (Base Cost)** = ต้นทุนสินค้า/License + ต้นทุนแรงงาน (Labor/Man-days) + ต้นทุนแฝงอื่นๆ
      - สูตรการตั้งราคา (Margin Gross-up): การตั้งราคาแบบนักธุรกิจ IT ที่ดี ไม่ใช่แค่ ต้นทุน + 30% (อันนั้นเรียก Markup และจะได้กำไรจริงน้อยกว่าที่คิด)
        *สูตรการหา Selling Price เพื่อให้ได้กำไรขั้นต้น (Gross Margin) ที่ X% คือ:*
        > **Price = Total Cost / (1 - Margin%)**
      - **คำแนะนำระดับบริษัทเติบโต (Growth Stage):** 
        - เราตั้งเป้า Gross Margin ขั้นต่ำที่ **35% - 40%** เพื่อให้ครอบคลุมค่าดำเนินการทางธุรกิจ (OPEX) และมีกระแสเงินสดเหลือไปต่อยอด
        - *ตัวอย่าง:* ทุน 10,000 อยากได้ Margin 35% -> Price = 10,000 / (1 - 0.35) = 15,384.62 บาท (กำไร 5,384.62 บาท)
      - **การป้องกันกระแสเงินสด (WHT Cushion):** เผื่อคำนวณให้ผู้ใช้เห็นว่าถ้าโดนหักภาษี ณ ที่จ่ายไป 3% ยอดเงินสดรับเข้าจริง (Cash in hand) จะเหลือเท่าไหร่ และกำไรกระแสเงินสดจริงๆ จะเป็นอย่างไร
      - อธิบายให้กระชับ โชว์ตัวเลขให้เห็นภาพชัดเจน และเชียร์ให้ผู้ใช้กล้าเรียกราคาที่คู่ควรกับคุณภาพงาน!

      --- กฎเหล็กในการตอบคำถาม ---
      1. โมเดลธุรกิจเราคือ "ตัวกลาง (Intermediary)" รายได้คือส่วนต่างกำไรจากการขาย License/บริการ
      2. ภาษีหัก ณ ที่จ่าย (WHT) สำหรับ License/บริการ ให้ใช้ **3%** เสมอ (ตาม BUSINESS_CONTEXT.md)
      3. การบันทึกบัญชีต้องใช้รหัสให้ถูกต้อง: 
         - รายได้: 4110 | ลูกหนี้: 1121
         - ภาษีขาย: 2121 | ภาษีซื้อ: 1141
         - เจ้าหนี้: 2110 (เช่น Noventiq) | ต้นทุน: 5110
         - ภาษีค้างจ่าย (WHT): 2130
      4. หากลูกค้าถามเรื่องการลงเอกสาร หรือตั้งราคา ให้ให้คำตอบแบบที่ปรึกษาผู้บริหาร (Consultant Style) ฟันธงชัดเจน
      5. ตอบเป็นภาษาไทยที่สุภาพ เข้าใจง่าย รวดเร็ว และเน้นช่วยแก้ปัญหา (สไตล์เพื่อนคู่คิดธุรกิจ)
    `;

    const fullPrompt = `${systemInstruction}\n\nคำถามจากผู้ใช้: ${prompt}`;
    const answer = await askGemini(fullPrompt);

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('AI Accounting error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
