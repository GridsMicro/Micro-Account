
import { query } from "./lib/db";

async function migrate() {
  try {
    console.log("🚀 Starting Database Migration for 5 Journals...");
    
    // 1. Add journal_type column
    await query("ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS journal_type VARCHAR(20) DEFAULT 'general'");
    console.log("✅ Added 'journal_type' column.");

    // 2. Set default for Nulls
    await query("UPDATE journal_entries SET journal_type = 'general' WHERE journal_type IS NULL");
    
    // 3. Auto-categorize based on descriptions
    // Sales: Invoice
    await query("UPDATE journal_entries SET journal_type = 'sales' WHERE description ILIKE '%ใบแจ้งหนี้%' OR description ILIKE '%invoice%'");
    
    // Receipts: Payments received
    await query("UPDATE journal_entries SET journal_type = 'receipt' WHERE (description ILIKE '%รับเงิน%' OR description ILIKE '%receipt%') AND debit > 0");
    
    // Payments: Payments made
    await query("UPDATE journal_entries SET journal_type = 'payment' WHERE (description ILIKE '%จ่าย%' OR description ILIKE '%payment%') AND credit > 0");

    console.log("🏁 Migration Complete!");
  } catch (error) {
    console.error("❌ Migration Failed:", error);
  }
}

migrate();
