import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv(file = path.join(root, ".env.local")) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

async function dbPool() {
  const env = loadEnv();
  const url = new URL(env.POSTGRES_URL || env.DATABASE_URL);
  const ssl = url.searchParams.get("sslmode");
  url.searchParams.delete("sslmode");
  return new Pool({
    connectionString: url.toString(),
    ssl: ssl === "disable" ? false : { rejectUnauthorized: true },
  });
}

async function googleAuth() {
  const pool = await dbPool();
  const s = (
    await pool.query(
      "SELECT google_client_id,google_client_secret,google_redirect_uri,google_refresh_token FROM company_settings LIMIT 1"
    )
  ).rows[0];
  await pool.end();
  if (!s?.google_refresh_token) throw new Error("No google_refresh_token in company_settings");
  const { google } = await import("googleapis");
  const oauth = new google.auth.OAuth2(
    s.google_client_id,
    s.google_client_secret,
    s.google_redirect_uri || "https://developers.google.com/oauthplayground"
  );
  oauth.setCredentials({ refresh_token: s.google_refresh_token });
  return oauth;
}

async function drive(auth = null) {
  const { google } = await import("googleapis");
  return google.drive({ version: "v3", auth: auth || (await googleAuth()) });
}

export { loadEnv, dbPool, googleAuth, drive, root };