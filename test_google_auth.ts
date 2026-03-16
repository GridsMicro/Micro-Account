import { google } from "googleapis";
import * as fs from "fs";

async function testFinalAuth() {
  try {
    console.log("🔍 เริ่มการทดสอบกุญแจ Google (ยิงเข้าโฟลเดอร์ใหม่ใน My Drive)...");
    const keyFile = "/media/devg/Micro-SV1/GitHub/GridsMicro/Micro-Account/microtronic-finance-bot-4f97b39e64d1.json";
    const folderId = "1BVEompPL0f0Qp3kYx6GiWOnfl93o5mGI"; // ID ใหม่จาก My Drive
    
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFile,
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });
    
    console.log("🚀 กำลังลองสร้าง Spreadsheet ใหม่ไว้ในโฟลเดอร์เป้าหมาย...");
    
    const fileMetadata = {
      name: "Accounting Report (Final Success Check)",
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [folderId],
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id, webViewLink",
    });

    console.log("✅ ยินดีด้วยครับพี่! สำเร็จ 100% บอทสร้างไฟล์ได้แล้ว!");
    console.log("🆔 File ID:", res.data.id);
    console.log("🔗 ลิงก์ไฟล์: ", res.data.webViewLink);
    
  } catch (error: any) {
    console.error("❌ ยังล้มเหลว! สาเหตุ:");
    console.error(JSON.stringify(error.response?.data || error.message, null, 2));
  }
}

testFinalAuth();
