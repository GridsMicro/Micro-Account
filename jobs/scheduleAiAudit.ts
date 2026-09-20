// dotenv must load .env.local BEFORE any module that reads process.env DB vars.
// Static imports are hoisted, so the db-touching libs must be imported dynamically.
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config({ path: '.env.local' });

/**
 * งาน cron AI Auditor - รันทุกวันตอน 06:00 น. เพื่อตรวจสอบความผิดปกติทางบัญชี
 * และวันจันทร์ตอน 06:00 น. ทำการตรวจเชิงลึกมากขึ้น
 */
export async function executeDailyAudit() {
  const { runAiAudit, getOpenAiAlerts } = await import('../lib/aiAudit');
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

// Guard that works in both CJS (node) and ESM (tsx) contexts
const isMainEntry =
  process.argv[1] && import.meta.url === "file://" + process.argv[1];

if (isMainEntry) {
  executeDailyAudit()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}