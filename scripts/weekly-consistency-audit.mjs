import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_DOCS = [
  "CORE_RULES.md",
  "README.md",
  "docs/KNOWLEDGE_PACK.md",
  "docs/RBAC_STANDARD.md",
  "docs/BUSINESS_RULES.md",
  "docs/ARCHITECTURE.md",
  "docs/DECISIONS.md",
  "docs/OPERATION_RUNBOOK.md",
  "docs/INCIDENT_LOG.md",
  "docs/CHANGELOG_PROJECT.md",
];

const SCAN_DIRS = ["app", "components", "lib"];
const ALLOWED_EXT = new Set([".ts", ".tsx"]);

const LEGACY_ROLE_PATTERNS = [
  /SUPER_ADMIN/g,
  /\bsuper admin\b/gi,
  /\bsuper_admin\b/gi,
  /role\s*[:=][^\n]{0,60}["'`](manager|staff|tester)["'`]/gi,
  /includes\([^\)]*["'`](manager|staff|tester)["'`]/gi,
];

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function walk(dirRel, out = []) {
  const abs = path.join(ROOT, dirRel);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dirRel, entry.name);
    if (entry.isDirectory()) {
      walk(rel, out);
    } else if (ALLOWED_EXT.has(path.extname(entry.name))) {
      out.push(rel.replace(/\\/g, "/"));
    }
  }
  return out;
}

function assertRequiredDocs() {
  const missing = REQUIRED_DOCS.filter((p) => !fs.existsSync(path.join(ROOT, p)));
  if (missing.length) {
    throw new Error(`Missing required docs:\n${missing.map((p) => `- ${p}`).join("\n")}`);
  }
}

function assertCoreLinks() {
  const readme = readText("README.md");
  const core = readText("CORE_RULES.md");
  const missing = [];
  if (!readme.includes("docs/KNOWLEDGE_PACK.md")) missing.push("README.md -> docs/KNOWLEDGE_PACK.md");
  if (!readme.includes("docs/RBAC_STANDARD.md")) missing.push("README.md -> docs/RBAC_STANDARD.md");
  if (!core.includes("docs/KNOWLEDGE_PACK.md")) missing.push("CORE_RULES.md -> docs/KNOWLEDGE_PACK.md");
  if (!core.includes("docs/RBAC_STANDARD.md")) missing.push("CORE_RULES.md -> docs/RBAC_STANDARD.md");
  if (missing.length) {
    throw new Error(`Missing canonical references:\n${missing.map((m) => `- ${m}`).join("\n")}`);
  }
}

function assertNoLegacyRoleUsage() {
  const files = SCAN_DIRS.flatMap((d) => walk(d));
  const findings = [];

  for (const file of files) {
    const text = readText(file);
    for (const pattern of LEGACY_ROLE_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(`${file} :: ${pattern}`);
      }
      pattern.lastIndex = 0;
    }
  }

  if (findings.length) {
    throw new Error(`Legacy role tokens found in source:\n${findings.map((f) => `- ${f}`).join("\n")}`);
  }
}

export function runConsistencyAudit() {
  assertRequiredDocs();
  assertCoreLinks();
  assertNoLegacyRoleUsage();
  return true;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  try {
    runConsistencyAudit();
    console.log("Weekly consistency audit passed.");
  } catch (error) {
    console.error("Weekly consistency audit failed.");
    console.error(error?.message || error);
    process.exit(1);
  }
}

