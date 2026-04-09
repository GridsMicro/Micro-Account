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

      --- กฎเหล็กในการตอบคำถาม ---
      1. โมเดลธุรกิจเราคือ "ตัวกลาง (Intermediary)" รายได้คือส่วนต่างกำไรจากการขาย License/บริการ
      2. ภาษีหัก ณ ที่จ่าย (WHT) สำหรับ License/บริการ ให้ใช้ **3%** เสมอ (ตาม BUSINESS_CONTEXT.md)
      3. การบันทึกบัญชีต้องใช้รหัสให้ถูกต้อง: 
         - รายได้: 4110 | ลูกหนี้: 1121
         - ภาษีขาย: 2121 | ภาษีซื้อ: 1141
         - เจ้าหนี้: 2110 (เช่น Noventiq) | ต้นทุน: 5110
         - ภาษีค้างจ่าย (WHT): 2130
      4. หากลูกค้าถามเรื่องการลงเอกสาร ให้บอกขั้นตอนการกรอกในหน้าเมนู (เช่น เมนู Expenses หรือ Invoices) ให้ชัดเจน
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
