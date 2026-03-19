import { query } from "./lib/db";

async function setAdmin() {
  const email = "k.net.game01@gmail.com";
  console.log(`🚀 Setting ${email} to Admin...`);
  
  try {
    const res = await query(
      "UPDATE users SET role = 'admin', status = 'Active' WHERE email = $1 RETURNING id, name, role, status",
      [email]
    );

    if (res.rows.length > 0) {
      console.log("✅ Update successful:");
      console.table(res.rows[0]);
    } else {
      console.log(`❌ User with email ${email} not found in database.`);
    }
  } catch (err: any) {
    console.error("❌ SQL Error:", err.message);
  } finally {
    process.exit(0);
  }
}

setAdmin();
