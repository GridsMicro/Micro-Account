import { dbPool, googleAuth, drive } from "./google-auth.mjs";

const TITLE = "Micro-Account Dashboard (Auto)";
const SHEETS = ["ภาพรวมรายเดือน", "รายจ่ายแยกหมวด", "รายการล่าสุด"];

const round2 = (n) => (n == null ? 0 : Math.round(n * 100) / 100);

async function queryPool(pool, sql, params) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function ensureSpreadsheet(sheets, drv) {
  const list = await drv.files.list({
    q: `name='${TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    orderBy: "createdTime desc",
    fields: "files(id,createdTime)",
    pageSize: 10,
  });
  const found = list.data.files || [];
  let id;
  if (found.length) {
    id = found[0].id;
    for (const dup of found.slice(1)) await drv.files.delete({ fileId: dup.id });
  } else {
    const created = await sheets.spreadsheets.create({
      requestBody: { properties: { title: TITLE } },
      fields: "spreadsheetId",
    });
    id = created.data.spreadsheetId;
  }
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: "sheets.properties(sheetId,title)" });
  const titles = (meta.data.sheets || []).map((s) => s.properties.title);
  const requests = [];
  for (const name of SHEETS) if (!titles.includes(name)) requests.push({ addSheet: { properties: { title: name } } });
  const sheet1 = (meta.data.sheets || []).find((s) => s.properties.title === "Sheet1");
  if (sheet1 && !titles.includes(SHEETS[0]))
    requests.push({ updateSheetProperties: { properties: { sheetId: sheet1.properties.sheetId, title: SHEETS[0] }, fields: "title" } });
  if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId: id, requestBody: { requests } });
  return id;
}

async function collect() {
  const pool = await dbPool();

  const expByMonth = await queryPool(
    pool,
    `SELECT to_char(expense_date,'YYYY-MM') mo, count(*) n,
       round(sum(coalesce(amount,0))::numeric,2) total,
       round(sum(coalesce(net_amount,0))::numeric,2) net,
       round(sum(coalesce(vat_amount,0))::numeric,2) vat,
       round(sum(coalesce(vat_amount,0)) FILTER (WHERE tax_deductible IS true)::numeric,2) vat_ded,
       round(sum(coalesce(vat_amount,0)) FILTER (WHERE tax_deductible IS NULL)::numeric,2) vat_pending
     FROM expenses WHERE expense_date IS NOT NULL
     GROUP BY 1 ORDER BY 1`
  );
  const invByMonth = await queryPool(
    pool,
    `SELECT to_char(issue_date,'YYYY-MM') mo, count(*) n,
       round(sum(coalesce(net_amount,0))::numeric,2) net,
       round(sum(coalesce(vat_amount,0))::numeric,2) vat
     FROM invoices GROUP BY 1 ORDER BY 1`
  );
  const byCategory = await queryPool(
    pool,
    `SELECT category, count(*) n, round(sum(coalesce(amount,0))::numeric,2) total,
       round(sum(coalesce(net_amount,0))::numeric,2) net,
       round(sum(coalesce(vat_amount,0))::numeric,2) vat
     FROM expenses GROUP BY category ORDER BY total DESC`
  );
  const recent = await queryPool(
    pool,
    `SELECT expense_date, category, description, amount, net_amount, vat_amount, status, tax_deductible
     FROM expenses ORDER BY expense_date DESC, id DESC LIMIT 20`
  );
  await pool.end();
  return { expByMonth, invByMonth, byCategory, recent };
}

async function writeSheet(sheets, id, name, values) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${name}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function main() {
  const { expByMonth, invByMonth, byCategory, recent } = await collect();

  const months = new Set([
    ...expByMonth.map((r) => r.mo),
    ...invByMonth.map((r) => r.mo),
  ]);
  const monthRows = [...months].sort();
  const overview = [["เดือน", "ใบขาย", "ยอดขาย (net)", "VAT ขาย", "รายจ่าย (รายการ)", "ยอดจ่าย (amount)", "ค่าใช้จ่าย (net)", "VAT ซื้อ (คำนวณ)", "VAT ซื้อหักได้", "VAT ซื้อรอ confirm"]];
  for (const mo of monthRows) {
    const i = invByMonth.find((r) => r.mo === mo) || { n: 0, net: 0, vat: 0 };
    const e = expByMonth.find((r) => r.mo === mo) || { n: 0, total: 0, net: 0, vat: 0, vat_ded: 0, vat_pending: 0 };
    overview.push([mo, i.n, i.net, i.vat, e.n, e.total, e.net, e.vat, e.vat_ded, e.vat_pending]);
  }

  const catRows = [["หมวด", "รายการ", "ยอดรวม (amount)", "ค่าใช้จ่าย (net)", "VAT ซื้อ"]];
  for (const c of byCategory) catRows.push([c.category, c.n, c.total, c.net, c.vat]);

  const recentRows = [["วันที่", "หมวด", "รายละเอียด", "amount", "net", "VAT", "สถานะ", "หักได้"]];
  for (const r of recent) {
    recentRows.push([
      r.expense_date ? r.expense_date.toISOString().slice(0, 10) : "-",
      r.category || "",
      r.description || "",
      r.amount ?? "",
      r.net_amount ?? "",
      r.vat_amount ?? "",
      r.status || "",
      r.tax_deductible === true ? "✓" : r.tax_deductible === null ? "?" : "",
    ]);
  }

  const auth = await googleAuth();
  const { google } = await import("googleapis");
  const sheets = google.sheets({ version: "v4", auth });
  const drv = await drive(auth);
  const id = await ensureSpreadsheet(sheets, drv);
  await writeSheet(sheets, id, SHEETS[0], overview);
  await writeSheet(sheets, id, SHEETS[1], catRows);
  await writeSheet(sheets, id, SHEETS[2], recentRows);

  const link = `https://docs.google.com/spreadsheets/d/${id}`;
  console.log(`DASHBOARD OK | ${id}`);
  console.log(`latest: ${monthRows.at(-1) || "-"} | sheets updated`);
  console.log(`link: ${link}`);
}

main().catch((e) => {
  console.error("DASHBOARD FAILED:", e.message);
  process.exit(1);
});