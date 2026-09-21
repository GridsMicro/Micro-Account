import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";
import { Readable } from "node:stream";
import { dbPool, googleAuth, drive, root } from "./google-auth.mjs";

const BACKUP_DIR = "Backup-Auto";
const KEEP_DAYS = 30;
const SKIP_TABLES = new Set(["users_backup_1773898881424"]);

async function dumpDatabase(pool) {
  const raw = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' ORDER BY table_name`
  );
  const tables = {};
  for (const { table_name } of raw.rows) {
    if (SKIP_TABLES.has(table_name)) continue;
    const { rows, rowCount } = await pool.query(`SELECT * FROM "${table_name}"`);
    tables[table_name] = { type: "rows", rows, count: rowCount };
  }
  return {
    meta: {
      kind: "micro-account-db-backup",
      created_at: new Date().toISOString(),
      source: "grids@microtronic.biz",
      table_count: Object.keys(tables).length,
    },
    tables,
  };
}

async function ensureFolder(service, name, parents = "root") {
  const find = await service.files.list({
    q: `name='${name.replaceAll("'", "\\'")}' and '${parents}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
    pageSize: 1,
  });
  if (find.data.files?.length) return find.data.files[0].id;
  const created = await service.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parents === "root" ? [] : [parents],
    },
    fields: "id",
  });
  return created.data.id;
}

async function upload(service, folderId, name, data, mimeType, parents) {
  const find = await service.files.list({
    q: `name='${name.replaceAll("'", "\\'")}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id)",
    pageSize: 1,
  });
  const meta = {
    name,
    mimeType,
    parents: parents || [folderId],
  };
  const media = { mimeType, body: Buffer.isBuffer(data) ? Readable.from(data) : data };
  if (find.data.files?.length) {
    const updated = await service.files.update({ fileId: find.data.files[0].id, requestBody: meta, media, fields: "id,modifiedTime" });
    return { id: updated.data.id, replaced: true };
  }
  const created = await service.files.create({ requestBody: meta, media, fields: "id,createdTime" });
  return { id: created.data.id, replaced: false };
}

async function cleanupOld(service, folderId) {
  const list = await service.files.list({
    q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id,name,modifiedTime)",
    pageSize: 100,
  });
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  let removed = 0;
  for (const f of list.data.files || []) {
    if (new Date(f.modifiedTime).getTime() < cutoff) {
      await service.files.delete({ fileId: f.id });
      removed++;
    }
  }
  return removed;
}

async function main() {
  const pool = await dbPool();
  const dump = await dumpDatabase(pool);
  await pool.end();

  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(dump, null, 0)));
  const stamp = new Date().toISOString().slice(0, 10);
  const name = `db-backup-${stamp}.json.gz`;

  const auth = await googleAuth();
  const service = await drive(auth);
  const folderId = await ensureFolder(service, BACKUP_DIR);
  const uploaded = await upload(service, folderId, name, gz, "application/gzip");
  const removed = await cleanupOld(service, folderId);

  const stats = JSON.parse(zlib.gunzipSync(gz).toString("utf8"));
  console.log(
    `BACKUP OK ${stamp} | ${uploaded.replaced ? "replaced" : "new"} | rows=${stats.meta.table_count} tables`
  );
  console.log(`file=${name} size=${Math.round(gz.length / 1024)} KB folder=${BACKUP_DIR}`);
  console.log(`cleanup: removed ${removed} old backups (> ${KEEP_DAYS} days)`);
}

main().catch((e) => {
  console.error("BACKUP FAILED:", e.message);
  process.exit(1);
});