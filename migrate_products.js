const { query } = require("./lib/db");

async function updateSchema() {
  try {
    console.log("Checking and updating product schema...");
    
    // Add columns if they don't exist
    await query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS source_info TEXT,
      ADD COLUMN IF NOT EXISTS storage_location TEXT,
      ADD COLUMN IF NOT EXISTS product_notes TEXT,
      ADD COLUMN IF NOT EXISTS sku_number VARCHAR(50) UNIQUE;
    `);
    
    console.log("Schema updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating schema:", err);
    process.exit(1);
  }
}

updateSchema();
