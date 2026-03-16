# 🔐 การตั้งค่า Google Workspace API

คู่มือนี้จะนำพาคุณตั้งค่า Google Cloud APIs สำหรับ Micro Account
ตั้งแต่เริ่มต้นจนถึงการใช้งานจริงบน Vercel

---

## 📋 ภาพรวมสิ่งที่ต้องทำ

```
1. สร้าง Google Cloud Project (หรือใช้อันเดิม)
2. เปิดใช้งาน APIs ที่จำเป็น
3. สร้าง OAuth 2.0 Client ID
4. สร้าง API Key
5. ใส่ค่า Environment Variables ใน Vercel
6. ทดสอบระบบ
```

---

## ขั้นตอนที่ 1 — Google Cloud Project

!!! note "ใช้ Project ที่มีอยู่แล้วได้"
    ถ้ามี Google Cloud Project อยู่แล้วข้ามขั้นตอนนี้ได้เลย

1. ไปที่ [console.cloud.google.com](https://console.cloud.google.com)
2. คลิก **"Select a project"** ที่มุมบนซ้าย
3. คลิก **"New Project"** หรือเลือก Project ที่มีอยู่

---

## ขั้นตอนที่ 2 — เปิดใช้งาน APIs

ไปที่ **APIs & Services → Library** แล้วค้นหาและ Enable:

| API | ใช้ทำอะไร |
|---|---|
| **Google Drive API** | อ่าน/แสดงไฟล์ใบเสร็จ |
| **Google Picker API** | UI เลือกไฟล์จาก Drive |
| **Gmail API** | ส่งอีเมลบิลอัตโนมัติ |
| **Google Sheets API** | Export รายงานบัญชี |
| **Google Calendar API** | แจ้งเตือนรอบบิล |

---

## ขั้นตอนที่ 3 — OAuth Consent Screen

!!! warning "ต้องทำก่อนสร้าง Client ID"

1. ไปที่ **APIs & Services → OAuth consent screen**
2. เลือก **User Type: Internal** (ใช้เฉพาะในองค์กร)
3. กรอกข้อมูล:
   - **App name**: `Micro Account`
   - **User support email**: อีเมลองค์กรของคุณ
4. กด **Save and Continue** จนครบทุก Step

---

## ขั้นตอนที่ 4 — สร้าง OAuth 2.0 Client ID

1. ไปที่ **APIs & Services → Credentials**
2. คลิก **+ Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Micro Account Web`
5. เพิ่ม **Authorized JavaScript origins**:
   ```
   https://your-project.vercel.app
   http://localhost:3000
   ```
6. คลิก **Create** → Copy **Client ID** ที่ได้

---

## ขั้นตอนที่ 5 — สร้าง API Key

1. คลิก **+ Create Credentials → API Key**
2. Copy **API Key** ที่ได้
3. คลิก **Edit API Key** เพื่อจำกัดการใช้งาน:

**Website restrictions:**
```
https://your-project.vercel.app/*
http://localhost:3000/*
```

**API restrictions → Restrict key → เลือก:**
- ✅ Google Drive API  
- ✅ Google Picker API

4. กด **Save**

---

## ขั้นตอนที่ 6 — ใส่ Environment Variables ใน Vercel

1. เปิด [vercel.com/dashboard](https://vercel.com/dashboard)
2. เลือก Project **micro-account**
3. ไปที่ **Settings → Environment Variables**
4. เพิ่มค่าต่อไปนี้ทีละตัว:

| Variable Name | ค่าที่ต้องใส่ | Environment |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string จาก Neon | All |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID จากขั้นตอนที่ 4 | All |
| `GOOGLE_CLIENT_SECRET` | Client Secret จากขั้นตอนที่ 4 | All |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | API Key จากขั้นตอนที่ 5 | All |
| `GMAIL_FROM` | อีเมลองค์กรที่ใช้ส่ง | All |
| `GMAIL_APP_PASSWORD` | App Password จาก Google Account | All |

5. กด **Save** แล้วกด **Redeploy**

!!! tip "วิธีสร้าง Gmail App Password"
    1. ไปที่ [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
    2. ต้องเปิด **2-Step Verification** ก่อน
    3. Select app: **Mail** / Select device: **Other** → พิมพ์ `Micro Account`
    4. Copy รหัส 16 ตัวอักษรที่ได้ → ใส่ใน `GMAIL_APP_PASSWORD`

---

## ขั้นตอนที่ 7 — ทดสอบ

หลัง Redeploy แล้ว ทดสอบที่:

1. ไปที่ [สมุดรายวัน → ลงบัญชีใหม่](/journals/new)
2. ส่วน **"📎 แนบใบเสร็จ"** จะมีปุ่ม **"เลือกจาก Google Drive"**
3. คลิกปุ่ม → Login Google → เลือกไฟล์ → แนบสำเร็จ ✅

---

## 🔧 แก้ปัญหาที่พบบ่อย

### ปุ่ม Google Drive ขึ้น Error "Client ID ไม่ถูกต้อง"
- ตรวจสอบว่า **Authorized JavaScript origins** มี URL ของ Vercel ถูกต้อง
- รอ 5 นาทีหลัง Save ใน Google Cloud (Settings ใช้เวลา propagate)

### ปุ่มเปิด Picker แล้วขึ้น Error "Access blocked"  
- OAuth Consent Screen ต้องเป็น **Internal** หรือ App ต้องผ่าน Verification
- ตรวจสอบว่า User ที่ Login เป็น Email ใน Organization เดียวกัน

### ไฟล์แนบแล้วแต่เปิดไม่ได้
- ตรวจสอบว่าไฟล์ใน Google Drive มีสิทธิ์ **"Anyone with the link can view"**
