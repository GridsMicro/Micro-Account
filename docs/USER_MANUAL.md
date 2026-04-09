# 📘 คู่มือการใช้งานระบบ Micro-Account (ฉบับละเอียด)
ระบบบัญชีและจัดการภาษีอัจฉริยะสำหรับ Microtronic

---

## 1. ระบบรักษาความปลอดภัย (Security)
ระบบมีการล็อกประตูหน้าบ้าน (Middleware) อย่างหนาแน่น:
*   **การเข้าถึง:** หากยังไม่ผ่านการล็อกอิน (Login) ระบบจะดีดผู้ใช้งานกลับไปที่หน้า `/login` ทันทีโดยอัตโนมัติ
*   **การจัดการ Session:** ระบบตรวจจับการล็อกอินผ่าน Secure Cookies เพื่อความปลอดภัยสูงสุด (เช็คผ่าน session-token ในไฟล์ `middleware.ts`)

## 2. ระบบบันทึกบัญชีอัตโนมัติ (Automated Double-Entry)
นี่คือหัวใจของระบบที่ผมพัฒนาขึ้น:
*   **รายได้ (Invoices):** เมื่อมีการสร้างและบันทึกใบแจ้งหนี้ ระบบจะไปลงบันทึกใน **สมุดรายวัน (Journal Entries)** ให้ทันที
    *   *เดบิต:* ลูกหนี้การค้า
    *   *เครดิต:* รายได้ / ภาษีขาย (ถ้ามี)
*   **รายจ่าย (Payment Vouchers):** เมื่อมีการจ่ายเงินและบันทึกใบสำคัญจ่าย ระบบจะลงบัญชีให้อัตโนมัติ:
    *   *เดบิต:* ค่าใช้จ่าย / ภาษีซื้อ (ถ้ามี)
    *   *เครดิต:* เงินสด/เงินฝากธนาคาร และ ภาษีหัก ณ ที่จ่าย (WHT)

## 3. การจัดการเอกสารภาษี (Tax & Business Documents)
*   **การเก็บหลักฐาน:** ในหน้า **Payment Vouchers** พี่สามารถจัดเก็บลิงก์รูปถ่ายใบเสร็จหรือไฟล์ PDF (Receipt URL) เพื่อใช้เป็นหลักฐานลดหย่อนภาษีได้
*   **การรายงานภาษี:** ระบบเตรียมพร้อมสำหรับการดึงยอดเพื่อยื่น ภ.พ.30 และ ภ.ง.ด.53 โดยดึงข้อมูลจากสมุดรายวันโดยตรง

## 4. ระบบสรุปผลรายเดือนลง Google Drive (Monthly Sync)
บนหน้า Dashboard จะมีปุ่มสีน้ำเงิน **"Sync รายงานรายเดือน"**:
1.  เมื่อกดปุ่ม ระบบจะรวบรวม Invoices และ Vouchers ทั้งหมดของเดือนปัจจุบัน
2.  สร้างไฟล์ **Google Sheets** ใหม่ใน Folder `Micro Account Reports/Summaries`
3.  แยกชีทเป็น "รายได้" และ "รายจ่าย" พร้อมสรุปยอดสุทธิ
4.  พี่สามารถเปิดลิงก์เพื่อดูสรุปผลหรือส่งต่อให้ฝ่ายบัญชีได้ทันที

## 5. วิธีการแก้ไขปัญหาเบื้องต้น (Troubleshooting)
*   **หน้าจอขาว/Error Column:** ปัจจุบันแก้ไขแล้ว (เกิดจากฐานข้อมูลไม่มีคอลัมน์ `created_on` ระบบถูกปรับให้ใช้ `created_at` ทั้งหมดแล้ว)
*   **Build Fail:** หากเจอ Error เรื่อง `crypto` ใน Middleware ให้ใช้เวอร์ชันที่เช็ค Cookie ตรง (ซึ่งผมแก้ให้แล้วในเวอร์ชันล่าสุด ในไฟล์ `middleware.ts`)

---
*จัดทำโดย: Antigravity AI*
## Invoice Journal Standard Update

- Invoice journals now follow one display standard across old and new data.
- The receivable account shown in the UI should resolve to `ลูกหนี้การค้าทั่วไป`.
- The VAT line shown in the UI should resolve to `ภาษีขายจากใบแจ้งหนี้ #...`.
- If a historical invoice was posted under an older structure, the system will normalize the display instead of rewriting the original evidence immediately.

## Dashboard Profit Meaning

- `กำไรสุทธิประจำเดือน` on the dashboard is accrual-based.
- This means the system looks at invoices issued in the month, not only invoices already paid.
- Cash movement should be interpreted separately from accounting profit.
