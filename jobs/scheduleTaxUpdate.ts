import cron from 'node-cron';
import { fetchLatestTaxUpdates } from '../services/taxUpdater';
import { query } from '../lib/db';
import { TaxCalendarAlerts } from '../lib/taxAutomator';

/**
 * งาน cron ที่รันทุกวันตอน 03:00 น. เพื่อดึงและบันทึกอัปเดตภาษี
 */
cron.schedule('0 3 * * *', async () => {
  try {
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

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดขณะอัปเดตภาษี:', error);
  }
});

// หากต้องการรันไฟล์นี้โดยตรง (เช่น npm run tax:update) ให้เริ่ม cron ทันที
if (require.main === module) {
  console.log('🕒 เริ่มงาน cron สำหรับอัปเดตภาษี');
}
