# ⚙️ การตั้งค่าระบบและการเชื่อมต่อ API

## การเชื่อมต่อ Google Workspace และ Cloud Billing

เพื่อให้ระบบ Micro-Account ซิงค์ข้อมูลอัตโนมัติ 100% คุณจำเป็นต้องตั้งค่า API และเพิ่มบัญชีหุ่นยนต์ (Service Account) ในระบบ 

### ขั้นตอนที่ 1: เข้าสู่จุดเริ่มต้น

1. ไปที่คอนโซล [Google Cloud Console](https://console.cloud.google.com/)
2. สร้างโปรเจกต์ใหม่ชื่อ: `Microtronic-Finance-Bot`

### ขั้นตอนที่ 2: เปิดสวิตช์การซิงค์ข้อมูล (APIs)

ไปที่เมนู **APIs & Services > Library** แล้วค้นหาและ **Enable** 2 ตัวนี้:

1. **Google Cloud Reseller API** (สำหรับเข้าถึงบิลลิ่ง Google Workspace)
2. **Admin SDK API** (เพื่อเข้าถึงรายชื่อลูกค้าและคู่ค้าต่างๆ)

### ขั้นตอนที่ 3: สร้างหุ่นยนต์ Service Account

ไปที่เมนู **IAM & Admin > Service Accounts**:

1. กดปุ่ม `+ CREATE SERVICE ACCOUNT`
2. กำหนดชื่อตัวอย่างเช่น: `finance-sync-bot`
3. ตรงช่อง Role (หน้าที่) ให้เลือก **Owner** (เจ้าของสิทธิ์) หรือ **Project Editor** เพื่อความคล่องตัวของบอท
4. เสร็จสิ้นการสร้าง

### ขั้นตอนที่ 4: รับกุญแจ (JSON)

1. คลิกที่อีเมลหุ่นยนต์เพิ่งสร้าง
2. เปิดแท็บ **Keys** 
3. เลือก **ADD KEY** > **Create new key**
4. เลือกรูปแบบ **JSON** แล้วกด Create
5. กุญแจ (JSON) จะถูกโหลดลงเครื่อง *กรุณาเก็บไฟล์นี้อย่างปลอดภัย! ห้ามแชร์กุญแจส่วนตัวให้ผู้ที่ไม่เกี่ยวข้อง* 
6. รหัสกุญแจจะถูกนำไปอัปโหลดบนระบบตั้งค่า Settings ของ Micro-Account

### ขั้นตอนที่ 5: ให้สิทธิ์เข้าหน้า Reseller Console

เพื่อให้หุ่นยนต์เช็คยอดค่าบริการได้

1. ล็อกอินเข้า [Partner Sales Console](https://channel.cloud.google.com/) ของ Google
2. เปิดแท็บ **Settings / Permissions**
3. เพิ่มอีเมลของหุ่นยนต์ (ที่ลงท้ายด้วย `@...gserviceaccount.com`) 
4. อนุมัติสิทธิ์ให้สามารถตรวจสอบ Billing ได้
