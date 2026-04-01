import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const files = [
    path.join(__dirname, 'migrate_licensing.sql'),
    path.join(__dirname, 'migrate_recurring_add_columns.sql'),
    path.join(__dirname, 'migrate_subscription_invoices.sql'),
  ];
  if (!process.env.DATABASE_URL) {
    console.error('Please set DATABASE_URL in your environment (e.g. export DATABASE_URL=...)');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    for (const filePath of files) {
      if (!fs.existsSync(filePath)) {
        console.warn(`Migration file not found, skipping: ${filePath}`);
        continue;
      }
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log('Running migration:', filePath);
      await client.query(sql);
    }
    console.log('All migrations completed successfully.');
  } catch (err: any) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});

// Usage: npx ts-node scripts/run_migration.ts
