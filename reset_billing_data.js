const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetData() {
  const client = await pool.connect();
  try {
    console.log("🗑️  Starting data reset...");
    await client.query('BEGIN');

    // Clear billing documents
    await client.query('DELETE FROM quotation_items');
    console.log("✅ Cleared quotation_items");

    await client.query('DELETE FROM quotations');
    console.log("✅ Cleared quotations");

    await client.query('DELETE FROM invoices');
    console.log("✅ Cleared invoices");

    // Clear related journal entries (INV- and QT- prefix only)
    await client.query("DELETE FROM journal_entries WHERE reference_no LIKE 'INV%' OR reference_no LIKE 'QT%'");
    console.log("✅ Cleared related journal entries");

    // Reset sequences to 1
    await client.query('ALTER SEQUENCE quotations_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE invoices_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE quotation_items_id_seq RESTART WITH 1');
    console.log("✅ Reset sequences to 1");

    // Update document_patterns to use new short format (no year/month in pattern, we handle in code)
    await client.query(`
      UPDATE document_patterns 
      SET include_year = false, include_month = false, digits = 3, last_number = 0
      WHERE document_type IN ('quotation', 'invoice')
    `);
    console.log("✅ Updated document_patterns to 3-digit format");

    await client.query('COMMIT');
    console.log("🎉 Reset complete! Ready to start fresh.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Reset failed:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetData();
