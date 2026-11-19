import * as tls from "node:tls";

/**
 * Minimal SMTP sender for Gmail App Password (implicit TLS on port 465).
 *
 * Why this exists:
 * - The project already declares GMAIL_FROM / GMAIL_APP_PASSWORD in .env.example,
 *   but no mail transport was ever implemented (confirmed by code search 2026-11-19).
 * - Adding nodemailer would require regenerating package-lock.json on a machine
 *   without npm/npx, so we implement the small subset of SMTP we need with the
 *   Node built-in `tls` module instead. No new dependency is introduced.
 *
 * Security notes:
 * - Credentials are read from environment only; never logged or hardcoded.
 * - Header values are rejected if they contain CR/LF (header injection guard).
 * - TLS certificate validation is always on (rejectUnauthorized: true).
 * - This module only SENDS an email when explicitly called by an API route;
 *   importing it has no side effects.
 */

const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 465;
const SMTP_TIMEOUT_MS = 15000;

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
};

type SmtpConfig = { from: string; password: string };

function getSmtpConfig(): SmtpConfig | null {
  const from = process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_FROM : undefined;
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!from || !password) return null;
  return { from, password };
}

/** True only when both sender address and App Password are present in env. */
export function isMailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

function assertNoCrlf(value: string, label: string) {
  // SMTP header injection guard: a single CR/LF can add arbitrary headers.
  if (/[\r\n]/.test(value)) {
    throw new Error(`Invalid ${label}: contains CR/LF`);
  }
}

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

/** Read one complete SMTP reply, including multiline 250-/354- continuations. */
function readReply(socket: tls.TLSSocket): Promise<{ code: number; lines: string[] }> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    let code = 0;
    const lines: string[] = [];
    let settled = false;

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      // SMTP uses CRLF; tolerate LF-only responses from some relays.
      while (buffer.includes("\n")) {
        const idx = buffer.indexOf("\n");
        let line = buffer.slice(0, idx).replace(/\r$/, "");
        buffer = buffer.slice(idx + 1);
        const match = /^(\d{3})([- ])(.*)$/.exec(line);
        if (!match) continue;
        const lineCode = Number(match[1]);
        if (code === 0) code = lineCode;
        if (lineCode !== code) {
          fail(new Error(`Unexpected SMTP reply code ${lineCode} (expected ${code})`));
          return;
        }
        lines.push(line);
        if (match[2] === " ") {
          // Final line of a multiline reply.
          if (settled) return;
          settled = true;
          cleanup();
          resolve({ code, lines });
          return;
        }
      }
    };
    const onError = (err: Error) => fail(err);
    const onClose = () => fail(new Error("SMTP connection closed before reply"));

    socket.on("data", onData);
    socket.on("error", onError);
    socket.on("close", onClose);
  });
}

/**
 * Send a plain-text email through Gmail SMTP (AUTH LOGIN, port 465).
 * Throws on any SMTP error so callers can roll back a password-reset token
 * instead of reporting a false success.
 */
export async function sendMail(input: SendMailInput): Promise<void> {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error("Mail is not configured: set GMAIL_FROM and GMAIL_APP_PASSWORD.");
  }

  assertNoCrlf(input.to, "recipient");
  assertNoCrlf(input.subject, "subject");
  assertNoCrlf(config.from, "sender");
  // Body is dot-stuffed below, so CR/LF inside text is safe.

  const socket = tls.connect(
    {
      host: SMTP_HOST,
      port: SMTP_PORT,
      servername: SMTP_HOST,
      rejectUnauthorized: true,
    },
    () => {
      // Connection established — the SMTP greeting is handled by readReply below.
    }
  );
  socket.setTimeout(SMTP_TIMEOUT_MS, () => {
    socket.destroy(new Error("SMTP timeout"));
  });

  const send = async (command: string, expectedCode: number) => {
    socket.write(`${command}\r\n`);
    const reply = await readReply(socket);
    if (reply.code !== expectedCode) {
      throw new Error(`SMTP command failed (${command.split(" ")[0]}): ${reply.lines.join(" | ")}`);
    }
    return reply;
  };

  try {
    await readReply(socket); // 220 greeting
    await send(`EHLO micro-account.local`, 250);
    await send(`AUTH LOGIN`, 334);
    await send(encodeBase64(config.from), 334);
    await send(encodeBase64(config.password), 235);
    await send(`MAIL FROM:<${config.from}>`, 250);
    await send(`RCPT TO:<${input.to}>`, 250);
    await send("DATA", 354);

    // Dot-stuffing: a line starting with "." must be escaped on the wire.
    const body = input.text.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
    socket.write(
      `From: ${config.from}\r\nTo: ${input.to}\r\nSubject: ${input.subject}\r\n` +
        `Content-Type: text/plain; charset=UTF-8\r\n\r\n${body}\r\n.\r\n`
    );
    const dataReply = await readReply(socket);
    if (dataReply.code !== 250) {
      throw new Error(`SMTP DATA rejected: ${dataReply.lines.join(" | ")}`);
    }
    socket.write("QUIT\r\n");
  } finally {
    socket.end();
    socket.destroy();
  }
}
