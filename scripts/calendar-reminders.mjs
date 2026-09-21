import { googleAuth } from "./google-auth.mjs";

const CALENDAR_ID = "c_3b0d4eede14220f420b6d11c52b4119d22916c2c30105e973d8cd4d74db92c63@group.calendar.google.com";
const TZ = "Asia/Bangkok";

const reminders = [
  { method: "popup", minutes: 1440 },
  { method: "email", minutes: 1440 },
];

async function create(cal, event) {
  return cal.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: event,
    fields: "id,summary,start",
  });
}

async function main() {
  const auth = await googleAuth();
  const { google } = await import("googleapis");
  const cal = google.calendar({ version: "v3", auth });

  const bill = await create(cal, {
    summary: "จ่ายบิล Google Workspace (ค่า Workspace/คลาวด์)",
    description: "จ่ายบิล Google Workspace Business Plus + ค่าบริการจาก clēอัตโนมัติ (ดูบิลใน Gmail/Drive)",
    start: { dateTime: "2026-10-01T09:00:00", timeZone: TZ },
    end: { dateTime: "2026-10-01T09:30:00", timeZone: TZ },
    recurrence: ["RRULE:FREQ=MONTHLY;BYMONTHDAY=1"],
    reminders: { useDefault: false, overrides: [
      { method: "popup", minutes: 4320 },
      { method: "email", minutes: 4320 },
    ] },
  });

  const dhrlt = await create(cal, {
    summary: "ต่ออายุ Google Workspace dhrlt.com (127→ตรวจ seats + RENEW_CURRENT_USERS)",
    description: "Annual ต่ออายุ ~25 มี.ค. 2027 — เช็กจำนวน seats/lastLogin ลูกค้า และตั้งให้ต่ออายุตามผู้ใช้จริง (RENEW_CURRENT_USERS) ก่อนวันนี้",
    start: { dateTime: "2027-03-25T10:00:00", timeZone: TZ },
    end: { dateTime: "2027-03-25T10:30:00", timeZone: TZ },
    reminders: { useDefault: false, overrides: [
      { method: "popup", minutes: 64800 },
      { method: "email", minutes: 64800 },
    ] },
  });

  console.log("CALENDAR OK");
  console.log("บิล GWS monthly →", bill.data.id, "|", bill.data.start?.dateTime);
  console.log("ต่ออายุ dhrlt 2027-03-25 →", dhrlt.data.id, "| reminder -45 วัน");
}

main().catch((e) => {
  console.error("CALENDAR FAILED:", e.message);
  process.exit(1);
});