// dotenv must load .env.local BEFORE any module that reads process.env DB vars.
// Static imports are hoisted, so the db-touching libs must be imported dynamically.
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config({ path: '.env.local' });

/**
 * งาน cron ที่รันทุกวันตอน 03:00 น. เพื่อดึงและบันทึกอัปเดตภาษี
 */
export async function runTaxUpdateOnce() {
  const { fetchLatestTaxUpdates } = await import('../services/taxUpdater');
  const { query } = await import('../lib/db');
  const { TaxCalendarAlerts } = await import('../lib/taxAutomator');

  console.log('🔄 เริ่มดึงข้อมูลอัปเดตภาษีจากกรมสรรพากร...');
  const summary = await fetchLatestTaxUpdates();
  // บันทึกลงในตารางที่เกี่ยวข้อง (ตัวอย่างเช่นอัปเดตวันที่เช็คล่าสุด)
  await query("UPDATE company_settings SET updated_at = NOW() WHERE id = 1");
  console.log('✅ อัปเดตภาษีเสร็จสิ้น (ข้อมูลสรุป: ' + summary + ')');

  // แจ้งเตือนปฏิทินภาษี
  console.log('📅 ตรวจสอบแจ้งเตือนปฏิทินภาษีประจำวัน...');
  const todayAlerts = TaxCalendarAlerts.getAlertsForDate(new Date());
  if (todayAlerts.length > 0) {
    console.log('🚨 มีแจ้งเตือนภาษีสำหรับวันนี้:');
    todayAlerts.forEach(alert => console.log(`   - ${alert}`));
    // TODO: ส่งอีเมลหรือแจ้งเตือนไปยังระบบจัดการ (เช่น Line Notify)
  } else {
    console.log('✅ ไม่มีแจ้งเตือนภาษีสำหรับวันนี้');
  }
}

cron.schedule('0 3 * * *', async () => {
  try {
    await runTaxUpdateOnce();
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดขณะอัปเดตภาษี:', error);
  }
});

// Guard that works in both CJS (node) and ESM (tsx) contexts — register the
// cron when imported by the app, and run the job immediately when invoked directly.
const isMainEntry =
  process.argv[1] && import.meta.url === "file://" + process.argv[1];

if (isMainEntry) {
  console.log('🕒 เริ่มงาน cron สำหรับอัปเดตภาษี (โหลดข่าวสาร + แจ้งเตือนปฏิทินวันนี้)...');
  runTaxUpdateOnce()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}