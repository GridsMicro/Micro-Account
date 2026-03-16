# 🛠️ คู่มือสร้าง Service Account (แบบละเอียด)

### ขั้นตอนที่ 1: เข้าสู่จุดเริ่มต้น
- ไปที่: [console.cloud.google.com](https://console.cloud.google.com/)
- สร้างโปรเจกต์ใหม่ชื่อ: `Microtronic-Finance-Bot`

### ขั้นตอนที่ 2: เปิดสวิตช์การซิงค์ข้อมูล (APIs)
ไปที่เมนู **APIs & Services > Library** แล้วค้นหาและ **Enable** 2 ตัวนี้:
1. **Google Cloud Reseller API** (เพื่อเข้าถึงยอด Billing)
2. **Admin SDK API** (เพื่อเข้าถึงรายชื่อลูกค้า)

### ขั้นตอนที่ 3: สร้างตัวตนให้หุ่นยนต์
ไปที่เมนู **IAM & Admin > Service Accounts**:
1. กด **+ CREATE SERVICE ACCOUNT**
2. ตั้งชื่อ: `finance-sync-bot`
3. ในส่วน Role: เลือกเป็น **Owner** หรือ **Project Editor**
4. กด Done

### ขั้นตอนที่ 4: รับกุญแจ (JSON)
1. คลิกที่อีเมลหุ่นยนต์ที่คุณเพิ่งสร้าง
2. ไปที่แท็บ **Keys** > กด **ADD KEY** > **Create new key**
3. เลือก **JSON** แล้วกด Create
4. *คุณจะได้ไฟล์ .json มาเก็บไว้ในเครื่อง* (ห้ามทำหาย!)

### ขั้นตอนที่ 5: ให้สิทธิ์เข้าหน้า Reseller Console
1. ไปที่ [Partner Sales Console](https://channel.cloud.google.com/)
2. ไปที่ **Settings** หรือ **Permissions**
3. เพิ่มอีเมลของ 'หุ่นยนต์' (ที่ลงท้ายด้วย @...gserviceaccount.com) พร้อมให้สิทธิ์ดูแล Billing
