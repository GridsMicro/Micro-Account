# Incident Log

Use this file for production incidents, root cause, and recovery notes.

## Template

### [YYYY-MM-DD HH:mm] Incident Title
- Severity:
- Impact:
- Detection:
- Root cause:
- Mitigation:
- Recovery verification:
- Follow-up actions:

---

### [2026-04-09 00:00] Baseline Entry
- Severity: Info
- Impact: None
- Detection: Knowledge system initialization
- Root cause: N/A
- Mitigation: Created persistent knowledge pack and canonical standards
- Recovery verification: N/A
- Follow-up actions: Keep this log updated on real incidents

---

### [2026-09-21] Upload Receipt fails: invalid_client (Google OAuth)
- Severity: Medium (blocks receipt upload on expenses; tax evidence filing affected)
- Impact: Cannot attach/upload receipts via Google Drive in expenses module
- Detection: ผู้ใช้รายงาน error "❌ อัปโหลดไม่สำเร็จ: invalid_client"
- Root cause: ทุกวิถี OAuth credential ไม่ถูกต้อง:
  - `company_settings` (DB): `google_client_id/secret/refresh_token` = EMPTY + `google_drive_enabled = false`
  - `.env.local`: client_id (len 42) ไม่ลงท้าย `.apps.googleusercontent.com`; client_secret (len 26) สั้นกว่า GOCSPX ปกติ (~41); refresh_token (len 22) สั้นมาก (ปกติ ~180) — ดูเหมือนค่าตัวอย่าง/ถูกเขียนทับผิด
  - Service Account: `microtronic-finance-bot-4f97b39e64d1.json` หาย + `GOOGLE_SERVICE_ACCOUNT_JSON` ไม่ได้ตั้ง
  - Flow: DB → .env → ServiceAccount ทุกทางล้ม
- Mitigation: ต้องได้ชุด credential ที่ถูกต้องจาก Google Cloud Console (Client ID/Secret/Refresh Token) หรือหาไฟล์ Service Account กลับมา แล้วตั้งที่ Settings → Google Drive (OAuth2)
- Recovery verification: [2026-09-21] setup ครบแล้ว —
  - `.env.local`: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN / GOOGLE_REDIRECT_URI ตั้งค่าจริงแล้ว
  - DB `company_settings`: google_client_id/secret/refresh_token + google_redirect_uri + google_drive_enabled=true
  - `checkGoogleAuth()` ผ่าน (OAuth2 from Database)
  - ทดสอบ `uploadToGoogleDrive` end-to-end สำเร็จ (ไฟล์ทดสอบขึ้น Drive: https://drive.google.com/file/d/1irVd2Xf6erP1sKuehOjlYOcrosqVUMRm/view) — ไม่มี invalid_client
  - แก้บั๊กเพิ่ม: `lib/google-server.ts` lazy client export เป็น undefined ตอน import → เปลี่ยน caller ทุกจุดให้ใช้ `getGoogleDrive()`/`getGoogleSheets()` (lib/actions-helpers.ts, app/actions/google-drive.ts, app/actions/tax-reports.ts)
  - Root cause ย่อย: Drive API ยังไม่ถูก Enable ในโปรเจกต์ → enable แล้ว (403 หาย)
- Follow-up actions: ทดสอบ upload ใบเสร็จจริงผ่านหน้า Expenses UI / ลบไฟล์ทดสอบ auth-test.txt ออกจาก Drive folder "Micro Account Documents" / Google Sheets API v4 ต้อง Enable แยกก่อนฟีเจอร์ export sheets

