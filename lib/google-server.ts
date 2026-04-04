import { google } from 'googleapis';
import path from 'path';
import { query } from '@/lib/db';

/**
 * ตั้งค่าการยืนยันตัวตน (Authentication)
 * รองรับ 3 โหมด:
 * 1. OAuth2 from Database - อ่านจาก company_settings (แนะนำ)
 * 2. OAuth2 from .env - ใช้ Environment Variables (fallback)
 * 3. Service Account - ใช้ไฟล์ JSON (สำหรับบอทเฉพาะทาง)
 */

let auth: any;
let driveClient: any;
let sheetsClient: any;

/**
 * ดึงการตั้งค่า Google Drive จาก Database
 */
async function getGoogleSettingsFromDB() {
  try {
    const result = await query(
      `SELECT google_client_id, google_client_secret, google_refresh_token, 
              google_redirect_uri, google_drive_enabled 
       FROM company_settings 
       LIMIT 1`
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching Google settings from DB:', error);
    return null;
  }
}

/**
 * สร้าง OAuth2 Client
 */
function createOAuth2Client(clientId: string, clientSecret: string, redirectUri: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

/**
 * สร้าง Service Account Auth
 */
function createServiceAccountAuth() {
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
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON Parse Error:', err);
    }
  } else {
    authOptions.keyFile = SERVICE_ACCOUNT_FILE;
  }

  return new google.auth.GoogleAuth(authOptions);
}

/**
 * เริ่มต้น Authentication (ต้องเรียกก่อนใช้งาน)
 */
export async function initializeGoogleAuth() {
  try {
    // โหมด 1: ลองอ่านจาก Database ก่อน
    const dbSettings = await getGoogleSettingsFromDB();
    
    if (dbSettings?.google_drive_enabled && 
        dbSettings?.google_client_id && 
        dbSettings?.google_client_secret && 
        dbSettings?.google_refresh_token) {
      
      auth = createOAuth2Client(
        dbSettings.google_client_id,
        dbSettings.google_client_secret,
        dbSettings.google_redirect_uri || 'https://developers.google.com/oauthplayground',
        dbSettings.google_refresh_token
      );
      
      console.log('🛡️ Google Auth: Using OAuth2 from Database');
    }
    // โหมด 2: Fallback ไป .env
    else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      auth = createOAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground',
        process.env.GOOGLE_REFRESH_TOKEN
      );
      
      console.log('🛡️ Google Auth: Using OAuth2 from Environment Variables');
    }
    // โหมด 3: Service Account (Fallback สุดท้าย)
    else {
      auth = createServiceAccountAuth();
      console.log('🤖 Google Auth: Using Service Account');
    }

    // สร้าง Clients
    driveClient = google.drive({ version: 'v3', auth });
    sheetsClient = google.sheets({ version: 'v4', auth });
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Google Auth Initialization Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * ดึง Google Drive Client (lazy init)
 */
export async function getGoogleDrive() {
  if (!driveClient) {
    await initializeGoogleAuth();
  }
  return driveClient;
}

/**
 * ดึง Google Sheets Client (lazy init)
 */
export async function getGoogleSheets() {
  if (!sheetsClient) {
    await initializeGoogleAuth();
  }
  return sheetsClient;
}

/**
 * ตรวจสอบความพร้อมของระบบ
 */
export async function checkGoogleAuth() {
  try {
    if (!auth) {
      await initializeGoogleAuth();
    }
    
    if (auth.getClient) {
      await auth.getClient();
    } else {
      await auth.getAccessToken();
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// สำหรับ backward compatibility - export ที่เรียก init อัตโนโมติ
// แต่แนะนำให้เรียก initializeGoogleAuth() ใน startup
initializeGoogleAuth().catch(err => {
  console.log('⚠️ Google Auth auto-init failed (will retry on first use):', err.message);
});

// Export clients สำหรับใช้งาน (จะถูก update เมื่อ init สำเร็จ)
export { driveClient as googleDrive, sheetsClient as googleSheets };
