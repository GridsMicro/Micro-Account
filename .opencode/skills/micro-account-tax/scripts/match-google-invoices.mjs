#!/usr/bin/env node
// แมปบิล Google (tax_invoice_no) กับไฟล์ใน Google Drive ว่าครบ/อยู่โฟลเดอร์ไหน
// ใช้: node scripts/match-google-invoices.mjs
// อ่าน .env.local (POSTGRES_URL/DATABASE_URL) + Google OAuth จาก DB company_settings
import { readFileSync } from 'fs';
import postgres from 'pg';
import { google } from 'googleapis';
const { Pool } = postgres;

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.trim().startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const u = env.POSTGRES_URL || env.DATABASE_URL;
const c = new URL(u);
const ssl = c.searchParams.get('sslmode');
c.searchParams.delete('sslmode');
const pool = new Pool({ connectionString: c.toString(), ssl: ssl === 'disable' ? false : { rejectUnauthorized: true } });

const nm = new Map();
async function nameOf(drive, id) {
  if (!id) return '(root)';
  if (nm.has(id)) return nm.get(id);
  try {
    const r = await drive.files.get({ fileId: id, fields: 'id,name' });
    nm.set(id, r.data.name);
    return r.data.name;
  } catch {
    nm.set(id, '(ลบ/ไม่เข้า)');
    return nm.get(id);
  }
}

async function driveClient() {
  const s = (await pool.query('SELECT google_client_id, google_client_secret, google_refresh_token, google_redirect_uri FROM company_settings LIMIT 1')).rows[0];
  if (!s?.google_client_id || !s?.google_refresh_token) throw new Error('Google OAuth ไม่พร้อมใน company_settings');
  const oauth = new google.auth.OAuth2(s.google_client_id, s.google_client_secret, s.google_redirect_uri || 'https://developers.google.com/oauthplayground');
  oauth.setCredentials({ refresh_token: s.google_refresh_token });
  return google.drive({ version: 'v3', auth: oauth });
}

try {
  const drive = await driveClient();
  const rows = (await pool.query(`
    SELECT id, expense_date, vendor, tax_invoice_no, amount, vat_amount, net_amount, tax_deductible, pp36_exempt
    FROM expenses
    WHERE vendor ILIKE '%google%' OR notes ILIKE '%google%'
    ORDER BY expense_date
  `)).rows;
  let found = 0, missing = 0;
  console.log(`expenses ที่เกี่ยวกับ Google: ${rows.length} รายการ\n`);
  for (const r of rows) {
    const no = r.tax_invoice_no || '(ไม่มีเลข)';
    let loc = '—';
    let copies = 0;
    if (/^\d+$/.test(no)) {
      const hits = (await drive.files.list({ q: `name = '${no}.pdf' and trashed = false`, pageSize: 50, fields: "files(id,parents)" })).data.files || [];
      copies = hits.length;
      const plocs = new Set();
      for (const h of hits) for (const p of (h.parents || [])) plocs.add(await nameOf(drive, p));
      loc = copies ? `✓ ${copies} copy → ${[...plocs].join(' | ')}` : '❌ ไม่พบใน Drive';
      if (copies) found++; else missing++;
    }
    const d = r.expense_date instanceof Date ? r.expense_date.toISOString().slice(0, 10) : String(r.expense_date).slice(0, 10);
    console.log(`#${r.id} ${d} | ${String(r.vendor).padEnd(28)} | ${no.padEnd(13)} | amt=${r.amount} vat=${r.vat_amount} ded=${r.tax_deductible} pp36x=${r.pp36_exempt} | ${loc}`);
  }
  console.log(`\nสรุป: พบใน Drive ${found} / ไม่พบ ${missing}`);
} catch (e) {
  console.error('ERR', e.message);
  process.exitCode = 1;
}
await pool.end();