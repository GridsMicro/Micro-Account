import { google } from 'googleapis';
import path from 'path';

// ค้นหาไฟล์ Service Account ในโฟลเดอร์หลัก
const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'microtronic-finance-bot-4f97b39e64d1.json');

// ตั้งค่าการยืนยันตัวตน (รองรับทั้งไฟล์ local และ Env Var บน Vercel)
const authOptions: any = {
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
};

if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  // สำหรับ Production บน Vercel: ใช้ JSON String จาก Env Var
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    authOptions.credentials = credentials;
  } catch (err) {
    console.error("❌ GOOGLE_SERVICE_ACCOUNT_JSON Parse Error:", err);
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not a valid JSON string. Please check Vercel environment variables.");
  }
} else {
  // สำหรับ Local: ใช้ไฟล์ JSON ในเครื่อง
  authOptions.keyFile = SERVICE_ACCOUNT_FILE;
}

const auth = new google.auth.GoogleAuth(authOptions);


/**
 * Google Drive Client
 */
export const googleDrive = google.drive({ version: 'v3', auth });

/**
 * Google Sheets Client
 */
export const googleSheets = google.sheets({ version: 'v4', auth });

/**
 * ฟังก์ชันตรวจสอบความพร้อมของระบบ
 */
export async function checkGoogleAuth() {
  try {
    const client = await auth.getClient();
    const project = await auth.getProjectId();
    return { success: true, project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
