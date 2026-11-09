#!/usr/bin/env node
// โหลดใบกำกับ Google จาก Google Drive (ค้นจากชื่อไฟล์ = tax_invoice_no.pdf) แล้ว extract ข้อความ (pdfplumber)
// ใช้: node scripts/read-google-invoice.mjs <tax_invoice_no>
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import postgres from 'pg';
import { google } from 'googleapis';
const { Pool } = postgres;

const PDF_TOOLS_VENV = '/home/neon13/workspace/services/python/pdf-tools/.venv/bin/python';
const PDF_TOOLS_ROOT = '/home/neon13/workspace/services/python/pdf-tools';

const env = Object.fromEntries(readFileSync('.env.local', 'utf8').split('\n').filter(l => l && !l.trim().startsWith('#')).map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const u = env.POSTGRES_URL || env.DATABASE_URL;
const c = new URL(u);
const ssl = c.searchParams.get('sslmode');
c.searchParams.delete('sslmode');
const pool = new Pool({ connectionString: c.toString(), ssl: ssl === 'disable' ? false : { rejectUnauthorized: true } });

const no = process.argv[2]?.trim();
if (!no || !/^\d+$/.test(no)) {
  console.error('ใช้: node scripts/read-google-invoice.mjs <tax_invoice_no>');
  process.exit(1);
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
  const hits = (await drive.files.list({ q: `name = '${no}.pdf' and trashed = false`, pageSize: 5, fields: "files(id,name,mimeType,parents)" })).data.files || [];
  if (!hits.length) {
    console.error(`ไม่พบไฟล์ ${no}.pdf ใน Drive`);
    process.exit(1);
  }
  const f = hits[0];
  console.log(`พบใบกำกับ: ${f.name}  id=${f.id}`);
  const buf = await drive.files.get({ fileId: f.id, alt: 'media' }, { responseType: 'arraybuffer' });
  const out = `/tmp/google_bill_${no}.pdf`;
  writeFileSync(out, Buffer.from(buf.data));
  console.log('โหลดแล้ว:', out, `(${hits.length} copy ใน Drive)`);
  const text = execSync(
    `${PDF_TOOLS_VENV} -c "import sys; sys.path.insert(0, '${PDF_TOOLS_ROOT}'); from pdf_toolkit import extract_text_pdfplumber; print(extract_text_pdfplumber('${out}'))"`,
    { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  );
  console.log(text);
} catch (e) {
  console.error('ERR', e.message);
  process.exitCode = 1;
}
await pool.end();