# Google Apps Inventory — สิทธิ์ Business Plus (฿1,000/เดือน)

> จัดทำ 2026-09-21 โดยฌอน ตามภาพ launcher ที่พี่ฆังให้ Gemini scan
> ใช้ประกอบการทำงาน "ใช้แอพในสิทธิ์ให้เกิดประโยชน์สูงสุด"

## รายการแอพในสิทธิ์ Google Workspace Business Plus

| # | แอพ | หมวด | ฌอนเข้าถึงผ่าน API ได้? | หมายเหตุ/โอกาสใช้กับธุรกิจ |
|---|------|-------|------------------------|---------------------------|
| 1 | Gmail | Office | ❌ ยัง (ต้อง scope `gmail.readonly/send`) | สแกนบิล/อีเมลสำคัญ; auto แยกระบบ |
| 2 | Docs | Office | ✅ ผ่าน Drive API | เอกสารสัญญา/รายงาน |
| 3 | Sheets | Office | ✅ (หลัง enable Sheets API) | Dashboard ภาษี (ทำแล้ว) |
| 4 | Slides | Office | ✅ ผ่าน Drive API | งานนำเสนอ |
| 5 | Forms | Office | ⚠️ ผ่าน Drive+AppScript | แบบฟอร์มเก็บข้อมูล |
| 6 | Drive | Office | ✅ ใช้อยู่ | Cloud 5TB (ใช้ 7.8%) + Backup-Auto |
| 7 | Keep | Office | ⚠️ รอ scope | เก็บลิงก์/เตือนความจำ |
| 8 | Calendar | Office | ✅ ใช้อยู่ | เตือนภาษี/บิล/นัด (ทำแล้ว) |
| 9 | Vids | Office | ❌ | สร้างวิดีโอเพื่อการตลาด |
| 10 | Meet | Comm | ❌ | ประชุม |
| 11 | Chat | Comm | ⚠️ ผ่าน Admin directory | ทำงานร่วมทีม |
| 12 | Contacts | Comm | ✅ ผ่าน Admin directory (users) | รายชื่อลูกค้า |
| 13 | Groups | Comm | ✅ admin.directory.group.readonly | กลุ่มแจ้งข่าวลูกค้า |
| 14 | Workspace Extensions | Comm | ❌ | ปลั๊กอิน |
| 15 | Gemini | AI | ❌ (รอ scope/service) | ผู้ช่วย AI (พี่ใช้ scan ภาพได้) |
| 16 | NotebookLM | AI | ❌ | วิเคราะห์เอกสาร |
| 17 | Analytics | AI | ❌ | กับเว็บไซต์บริษัท |
| 18 | Account | Admin | — สิทธิ์พี่ (UI) | ตั้งค่า/ความปลอดภัย |
| 19 | Admin | Admin | ✅ read-only | จัดการ users/groups |
| 20 | Business Profile | Admin | ❌ | ร้าน/หมุดแผนที่ |
| 21 | Ads | Admin | ❌ | โฆษณา |
| 22 | Merchant Center | Admin | ❌ | ขายออนไลน์ |
| 23 | Sites | Admin | ⚠️ ผ่าน Drive | เว็บง่าย ๆ |
| 24 | Cloud Search | Admin | ❌ | ค้นหาในองค์กร |
| 25 | Password Manager | Admin | ❌ | รหัสผ่าน (มีของ Chrome อยู่) |
| 26 | Vault | Admin | ⚠️ ต้อง scope admin (สูง) | retention ตามกฎหมาย 7-10 ปี (สำคัญบัญชี/ภาษี) |
| 27 | Maps | Lifestyle | ⚠️ ต้อง Maps API key | วางแผนที่/ลูกค้า |
| 28 | YouTube | Lifestyle | ⚠️ ต้อง YouTube API | คอนเทนต์/ช่องฝึกอบรม |
| 29 | News | Lifestyle | ❌ | ติดตามข่าวธุรกิจ |
| 30 | Photos | Lifestyle | ❌ (ต้อง scope photos) | เก็บรูปหลักฐานบิล/ย้อนงาน |
| 31 | Translate | Lifestyle | ⚠️ ใช้ Cloud Translate API (key) | แปลเอกสาร |
| 32 | Earth / Saved / Travel / Wallet / Search | Lifestyle | ❌ (UI) | — |

## ขอบเขตการเข้าถึงจริงของฌอน (w4 ผ่าน OAuth ที่พี่ให้)

- Scope ที่มีอยู่: `drive`, `spreadsheets`, `drive.file`, `calendar`, `admin.directory.*.readonly`, `apps.licensing`, `apps.order`
- หมวดที่ใช้ได้ **ตอนนี้**: Drive, Sheets, Calendar, Admin (อ่าน), Reseller/Licensing
- หมวดที่พร้อมเปิดเพิ่มเมื่อพี่อนุมัติ scope: Gmail, Vault admin, Photos, Calendar (เต็มอยู่แล้ว)

## สถานะงานที่ทำแล้วตามสิทธิ์ (2026-09-21)

1. ✅ Auto-backup DB รายวัน → `Backup-Auto` ใน Drive (cron 02:00)
2. ✅ Calendar เตือนภาษี (15/20 ของเดือน) — ต่อยอดบิล/นัด ยังทำต่อ
3. 🔧 Sheets Dashboard ภาษี (รอ enable Sheets API)
4. 🔧 จัดระเบียบ My Drive (เสนอแผนให้พี่ก่อนย้าย)

## Roadmap — แผนใช้แอพในสิทธิ์ให้เกิดประโยชน์ (จด 2026-09-21 ตามคำสั่งพี่)

> อนาคต ถ้าทำแอพใหม่/โปรแกรมใหม่/เลือก provider → **ใช้ของในสิทธิ์นี้ก่อนเสมอ** (กฎ Google-First, DECISIONS.md)

**🟢 เล่นได้เลย (scope มีแล้ว):**
- [ ] Contacts/Groups: ลูกค้าจากระบบ → ผู้ติดต่อ + กลุ่มแจ้งข่าว (dhrlt, กลุ่มเรียน AI)
- [ ] PDF อัตโนมัติ: ใบเสนอราคา/สัญญา/ใบแจ้งหนี้จาก DB (jspdf) → เก็บ Drive/แชร์ลิงก์
- [ ] Sheets: ทะเบียนเอกสารส่งลูกค้า + ติดตามสถานะ
- [ ] Calendar: เตือน due ใบแจ้งหนี้/สัญญา + แชร์ปฏิทินบริษัท

**🟡 เปิดกล่องเมื่อพี่อนุมัติ scope/API เพิ่ม:**
- [ ] Gmail (`gmail.readonly`): สแกนบิลอัตโนมัติ → บันทึกค่าใช้จ่าย (กันคีย์มือ)
- [ ] Vault (admin): retention เอกสาร/อีเมล 7–10 ปีตามกฎหมาย
- [ ] Forms: แบบฟอร์มข้อมูลลูกค้า/ประเมิน → Sheets
- [ ] Photos: ภาพหลักฐานหน้างาน/สินค้า
- [ ] Cloud Translate API: แปลเอกสารต่างประเทศ

**🟡 ต้องคน/UI ลงมือ (ผมช่วยวางแผนได้):**
- [ ] Gemini/NotebookLM: วิเคราะห์เอกสาร (พี่ใช้ scan ภาพ)
- [ ] Meet/Chat: งานลูกค้าแทนอีเมล
- [ ] Ads/Merchant/Business Profile: แคมเปญ + หน้าร้าน
- [ ] Maps/YouTube: พื้นที่/ช่องอบรม
- [ ] Analytics: ต่อเว็บไซต์บริษัท