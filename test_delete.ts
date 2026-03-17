
import { query } from "./lib/db";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testDelete() {
  try {
    const res = await query("SELECT id, account_name FROM journal_entries LIMIT 1");
    if (res.rows.length === 0) {
      console.log("No entries found to test delete.");
      return;
    }
    const id = res.rows[0].id;
    const name = res.rows[0].account_name;
    console.log(`Found entry: ID=${id}, Name=${name}. Attempting to delete...`);
    
    const delRes = await query("DELETE FROM journal_entries WHERE id = $1", [id]);
    console.log(`Delete Result: rowCount=${delRes.rowCount}`);
    
    if (delRes.rowCount > 0) {
      console.log("Successfully deleted.");
    } else {
      console.log("Failed to delete.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testDelete();
