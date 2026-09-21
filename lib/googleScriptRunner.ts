import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SCRIPTS = {
  "auto-backup": "auto-backup.mjs",
  "dashboard-sheet": "dashboard-sheet.mjs",
  "calendar-reminders": "calendar-reminders.mjs",
} as const;

export type GoogleScriptName = keyof typeof SCRIPTS;

export interface GoogleScriptResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

export async function runGoogleScript(
  name: GoogleScriptName,
  timeoutMs = 120_000
): Promise<GoogleScriptResult> {
  const scriptPath = path.join(process.cwd(), "scripts", SCRIPTS[name]);

  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024,
      encoding: "utf8",
    });
    return { ok: true, stdout, stderr };
  } catch (error) {
    const err = error as { stderr?: string; stdout?: string; message?: string };
    const detail = err.stderr || err.stdout || err.message || String(error);
    return { ok: false, stdout: err.stdout || "", stderr: String(detail) };
  }
}