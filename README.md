# Micro-Account Expert (Next Era 2026)

ระบบจัดการบัญชีและเอกสารบริษัทนวัตกรรมใหม่ ที่รวมพลังระหว่าง **Online 100% (Cloud)** และ **Hybrid (Local Backup)** เข้าด้วยกันอย่างสมบูรณ์แบบ

## 🏗️ โครงสร้างโครงการ (Project Structure)

โครงการถูกแบ่งออกเป็น 2 ส่วนหลักเพื่อความยืดหยุ่นและความปลอดภัยสูงสุด:

### 1. 🌐 Online 100% Version (Root Directory)
ระบบงานหลักสำหรับพนักงานทุกคน ทำงานผ่านระบบคลาวด์เต็มรูปแบบ
- **Technology:** Next.js 16+, TypeScript, Tailwind CSS 4
- **Database:** Neon (PostgreSQL Cloud)
- **Deployment:** Vercel
- **จุดเด่น:** เข้าถึงได้จากทุกที่ทั่วโลก, ข้อมูล Real-time, UI ระดับ Premium

### 2. 🏮 Hybrid / Local Version (`/hybrid`)
ระบบกึ่งออนไลน์สำหรับใช้เป็น Backup หรือทำงานในที่ที่อินเทอร์เน็ตไม่เสถียร
- **Technology:** Python, NiceGUI, SQLAlchemy
- **Database:** SQLite (`database.db`) สำหรับ Local และเชื่อมต่อ Neon สำหรับ Online
- **จุดเด่น:** ทำงานได้โดยไม่ต้องต่อเน็ตภายนอก, มีสำเนาข้อมูลล่าสุดในเครื่องเสมอ

---

## 🚀 วิธีการใช้งาน (Getting Started)

### สำหรับการทำงานออนไลน์ (Next.js):
1. ตรวจสอบไฟล์ `.env` ว่ามี `DATABASE_URL` (Neon) เรียบร้อยแล้ว
2. รันคำสั่งพัฒนา:
   ```bash
   npm install
   npm run dev
   ```
3. เข้าใช้งานผ่าน `http://localhost:3000`

### สำหรับการทำงานกึ่งออนไลน์ (Python Hybrid):
1. เข้าไปที่โฟลเดอร์ `hybrid/`
2. รันไฟล์ `start.bat` (Windows) หรือ `./run.sh` (Linux)
3. ระบบจะเปิดหน้าจอ NiceGUI ที่ `http://localhost:8080`

---

## 📂 รายละเอียดไฟล์สำคัญ
- `app/` - โค้ดหน้าจอหลักของระบบออนไลน์ (Next.js)
- `hybrid/pure_app.py` - โค้ดหลักของระบบกึ่งออนไลน์ (Python)
- `hybrid/sync_to_cloud.py` - สคริปต์สำหรับซิงค์ข้อมูลจากเครื่องขึ้นคลาวด์

---
**พัฒนาโดย Antigravity AI | มุ่งสู่ระบบบัญชีไร้พรมแดน 2026**
