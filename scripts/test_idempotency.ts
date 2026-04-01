import { Pool } from 'pg';
import { POST as generate } from '../app/api/recurring/generate/route';

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
  if (!process.env.RECURRING_SECRET) throw new Error('RECURRING_SECRET required');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // Create a test contact
    const email = `test-sub-${Date.now()}@example.com`;
    const contactRes = await client.query(`INSERT INTO contacts (name, email) VALUES ($1, $2) RETURNING id`, ['Test Sub', email]);
    const contactId = contactRes.rows[0].id;

    // Create recurring subscription
    const nextBilling = new Date();
    nextBilling.setDate(1);
    const nextBillingStr = nextBilling.toISOString().slice(0,10);
    const subRes = await client.query(
      `INSERT INTO recurring_invoices (client_name, email, cycle, amount, next_billing_date, status, billing_day, due_day)
       VALUES ($1,$2,$3,$4,$5,'Active',1,17) RETURNING id`,
      ['Test Sub', email, 'Monthly', 1000, nextBillingStr]
    );
    const subId = subRes.rows[0].id;

    // Prepare request object for generator
    const req1 = new Request('http://localhost/api/recurring/generate', {
      method: 'POST',
      headers: { 'x-recurring-secret': process.env.RECURRING_SECRET!, 'content-type': 'application/json' },
      body: JSON.stringify({ date: nextBillingStr })
    });

    console.log('Running generator #1');
    const res1 = await generate(req1 as any);
    console.log('First run status ->', JSON.stringify(await res1.json()));

    console.log('Running generator #2');
    const res2 = await generate(req1 as any);
    console.log('Second run status ->', JSON.stringify(await res2.json()));

    // Check invoices for this contact this month
    const invs = await client.query(`SELECT * FROM invoices WHERE contact_id=$1 AND date_trunc('month', created_at)=date_trunc('month',$2::date)`, [contactId, nextBillingStr]);
    console.log('Invoices count for contact this month:', invs.rows.length);
    if (invs.rows.length > 1) throw new Error('Idempotency failed: duplicate invoices created');

    console.log('Idempotency test passed: no duplicate invoices created.');

  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  run().catch(e => { console.error(e); process.exit(1); });
}
