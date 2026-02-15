# แผนงานโครงการ Micro Account (Smart Python Experience)

## 📌 สถานะปัจจุบัน (Current Status)
โครงการถูกเปลี่ยนจากระบบ Next.js/Docker ที่ซับซ้อน มาเป็น **Pure Python Desktop-Web Hybrid** ที่รันได้แบบ "คลิกเดียว" ทำให้ผู้ใช้ทั่วไปเข้าถึงง่ายและเบาสมองเครื่องมากขึ้น

---

## ✅ สิ่งที่ดำเนินการเสร็จสิ้น (Completed)
- [x] **Clean-up:** ลบโครงสร้าง Docker/Next.js/Flask เก่าออกทั้งหมด (Repo สะอาด 100%)
- [x] **Smart Launcher:** พัฒนา `start.bat` ที่ตรวจสอบเวอร์ชัน Python และอัปเดต Library อัตโนมัติ
- [x] **Onboarding System:** สร้างหน้า Setup Wizard สำหรับให้บริษัทกรอกข้อมูลครั้งแรก
- [x] **Auth System:** ระบบ Login และจัดการ Session สำหรับ Admin/Staff
- [x] **Admin Settings:** หน้าจัดการข้อมูลบริษัท ภาษี พนักงาน และโลโก้
- [x] **Database Migration:** เปลี่ยนไปใช้ SQLite เพื่อลดภาระการรัน Server

---

## � แผนพัฒนาต่อยอด (Future Roadmap)

### 📂 1. ระบบจัดการเอกสาร (Document Management)
- [ ] ระบบสร้างใบเสนอราคา / ใบกำกับภาษี PDF (ใช้ Library `fpdf2`)
- [ ] ระบบค้นหาเอกสารย้อนหลัง (Filter by Date/Customer)
- [ ] ระบบบันทึกเลขที่เอกสารอัตโนมัติ (Running Number)

### � 2. ระบบบัญชีเต็มรูปแบบ (Double Entry)
- [ ] เพิ่มหน้าบันทึก Journal Voucher (สมุดรายวัน)
- [ ] ระบบ General Ledger (สมุดแยกประเภท)
- [ ] รายงานงบกำไรขาดทุน (P&L) แบบเลือกช่วงเวลาได้

### 👥 3. ระบบพนักงานและสิทธิ์ (HR & Access Control)
- [ ] เพิ่ม/ลบ พนักงานในระบบได้จริง
- [ ] กำหนดสิทธิ์รายบุคคล (เช่น Staff ดูได้อย่างเดียว, Admin แก้ไขได้)
- [ ] บันทึก Log การใช้งาน (ใครแก้ไขข้อมูลไหน เมื่อไหร่)

---

## 📖 คู่มือสำหรับนักพัฒนา (Dev Manual)
- **UI Framework:** NiceGUI (Fast, Native-look, Python-only)
- **Database:** SQLAlchemy (SQLite)
- **Security:** PBKDF2 Hashing (สำหรับรหัสผ่าน)
- **Port:** 8080 (เริ่มต้น)

บันทึกโดย Antigravity | 15 กุมภาพันธ์ 2026
