import { execSync } from "node:child_process";

const BASE_REF = process.env.BASE_REF || "origin/main";
const HEAD_REF = process.env.HEAD_REF || "HEAD";

const CODE_PATH_PREFIXES = ["app/", "components/", "lib/", "jobs/"];
const KNOWLEDGE_FILES = new Set([
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
]);

function getChangedFiles() {
  const output = execSync(`git diff --name-only ${BASE_REF}...${HEAD_REF}`, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) => file.replace(/\\/g, "/"));
}

function isCodeFile(file) {
  return CODE_PATH_PREFIXES.some((prefix) => file.startsWith(prefix));
}

function isKnowledgeFile(file) {
  return KNOWLEDGE_FILES.has(file);
}

export function evaluateKnowledgeSync(changedFiles) {
  const changed = changedFiles.map((file) => file.replace(/\\/g, "/"));
  const codeChanged = changed.some(isCodeFile);
  const knowledgeChanged = changed.some(isKnowledgeFile);

  if (!codeChanged) {
    return { status: "skipped", message: "Knowledge check skipped: no app/component/lib/job changes." };
  }

  if (knowledgeChanged) {
    return { status: "passed", message: "Knowledge check passed: code changes include knowledge updates." };
  }

  return {
    status: "failed",
    message: "You changed application logic but did not update project knowledge docs.",
    requiredKnowledgeFiles: [...KNOWLEDGE_FILES],
  };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  try {
    const changed = getChangedFiles();
    const result = evaluateKnowledgeSync(changed);

    if (result.status === "skipped" || result.status === "passed") {
      console.log(result.message);
      process.exit(0);
    }

    console.error("Knowledge check failed.");
    console.error(result.message);
    console.error("Update at least one of:");
    for (const file of result.requiredKnowledgeFiles) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  } catch (error) {
    console.error("Knowledge check script error:", error?.message || error);
    process.exit(2);
  }
}

