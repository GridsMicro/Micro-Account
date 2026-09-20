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
- Recovery verification: รอ credential ใหม่จากพี่กีโร่ ก่อนแก้ไขต่อ
- Follow-up actions: หลังได้ credential ให้ทดสอบ upload ใบเสร็จจริง + ตรวจฟอร์ม Settings ว่า save secret ใหม่ได้จริง (UI masked ไม่ทับของเดิม)

