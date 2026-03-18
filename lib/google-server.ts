import { google } from 'googleapis';
import path from 'path';

/**
 * ตั้งค่าการยืนยันตัวตน (Authentication)
 * รองรับ 2 โหมด:
 * 1. OAuth2 (Regular Account) - ใช้ Client ID, Secret และ Refresh Token (แนะนำสำหรับ Account ทั่วไป)
 * 2. Service Account - ใช้ไฟล์ JSON (สำหรับบอทเฉพาะทาง)
 */

let auth: any;

// โหมด 1: OAuth2 สำหรับ Account ธรรมดา (หลีกเลี่ยงข้อจำกัด Service Account)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  auth = oauth2Client;
  console.log("🛡️ Google Auth: Using OAuth2 (Regular User Account)");
} 
// โหมด 2: Service Account (Fallback)
else {
  const SERVICE_ACCOUNT_FILE = path.join(process.cwd(), 'microtronic-finance-bot-4f97b39e64d1.json');
  const authOptions: any = {
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  };

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      authOptions.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (err) {
      console.error("❌ GOOGLE_SERVICE_ACCOUNT_JSON Parse Error:", err);
    }
  } else {
    authOptions.keyFile = SERVICE_ACCOUNT_FILE;
  }

  auth = new google.auth.GoogleAuth(authOptions);
  console.log("🤖 Google Auth: Using Service Account");
}

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
    if (auth.getClient) {
      await auth.getClient();
    } else {
      // For OAuth2Client, we just check if we can get an access token
      await auth.getAccessToken();
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
