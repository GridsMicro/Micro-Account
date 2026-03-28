const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    console.log("Looking for products with missing SKUs...");
    const missingSkus = await pool.query('SELECT id, name FROM products WHERE sku_number IS NULL OR sku_number = \'\'');
    
    if (missingSkus.rows.length > 0) {
        console.log(`Found ${missingSkus.rows.length} products needing SKUs. Generating now...`);
        for (const product of missingSkus.rows) {
            const randomSku = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
            console.log(`Updating ID ${product.id} (${product.name}) with ${randomSku}`);
            await pool.query('UPDATE products SET sku_number = $1 WHERE id = $2', [randomSku, product.id]);
        }
        console.log("All legacy products have been assigned new SKUs!");
    } else {
        console.log("No missing SKUs found.");
    }
    
    // Show updated list
    const finalRes = await pool.query('SELECT id, name, sku_number FROM products ORDER BY id ASC');
    console.log("=== Updated Products ===");
    console.log(JSON.stringify(finalRes.rows, null, 2));
  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    await pool.end();
  }
}
check();
