import cron from 'node-cron';
import { runAiAudit, getOpenAiAlerts } from '../lib/aiAudit';

/**
 * งาน cron AI Auditor - รันทุกวันตอน 06:00 น. เพื่อตรวจสอบความผิดปกติทางบัญชี
 * และวันจันทร์ตอน 06:00 น. ทำการตรวจเชิงลึกมากขึ้น
 */
export async function executeDailyAudit() {
  try {
    console.log('🕵️ AI Auditor: เริ่มตรวจสอบบัญชีอัตโนมัติ...');
    const result = await runAiAudit();
    const alerts = await getOpenAiAlerts();
    console.log(`✅ AI Auditor: ตรวจสอบเสร็จ พบ ${result.findings.length} จุด (ใหม่ ${result.inserted}, เดิม ${result.existing})`);
    console.log(`🔔 แจ้งเตือนที่ยังเปิดอยู่: ${alerts.length} รายการ`);
    if (alerts.length > 0) {
      alerts.slice(0, 5).forEach(a => console.log(`   - [${a.severity}] ${a.title}`));
    }
    return result;
  } catch (error: any) {
    console.error('❌ AI Auditor ตรวจสอบล้มเหลว:', error.message);
    throw error;
  }
}

// ตรวจทุกวันตอน 06:00 น.
cron.schedule('0 6 * * *', () => {
  executeDailyAudit().catch(() => {});
});

if (require.main === module) {
  executeDailyAudit()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
