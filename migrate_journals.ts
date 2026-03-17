// @ts-nocheck

import { sql } from "@vercel/postgres";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function migrate() {
  try {
    console.log("🚀 Starting Database Migration for 5 Journals...");
    
    // 1. Add journal_type column
    await sql`ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS journal_type VARCHAR(20) DEFAULT 'general'`;
    console.log("✅ Added 'journal_type' column.");

    // 2. Set existing entries to 'general' (already default, but to be sure)
    await sql`UPDATE journal_entries SET journal_type = 'general' WHERE journal_type IS NULL`;
    
    // 3. Optional: Try to auto-categorize based on descriptions
    await sql`UPDATE journal_entries SET journal_type = 'sales' WHERE description ILIKE '%ใบแจ้งหนี้%' OR description ILIKE '%invoice%'`;
    console.log("✅ Auto-categorized existing entries.");

    console.log("🏁 Migration Complete!");
  } catch (error) {
    console.error("❌ Migration Failed:", error);
  }
}

migrate();
