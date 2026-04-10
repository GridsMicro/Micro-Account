import test from "node:test";
import assert from "node:assert/strict";
import { evaluateKnowledgeSync } from "../scripts/verify-knowledge-sync.mjs";
import { runConsistencyAudit } from "../scripts/weekly-consistency-audit.mjs";

test("knowledge guard skips when no code paths changed", () => {
  const result = evaluateKnowledgeSync(["docs/DECISIONS.md"]);
  assert.equal(result.status, "skipped");
});

test("knowledge guard fails when code changed without knowledge update", () => {
  const result = evaluateKnowledgeSync(["app/page.tsx"]);
  assert.equal(result.status, "failed");
});

test("knowledge guard passes when code and knowledge files changed", () => {
  const result = evaluateKnowledgeSync(["app/page.tsx", "docs/CHANGELOG_PROJECT.md"]);
  assert.equal(result.status, "passed");
});

test("weekly consistency audit baseline passes", () => {
  assert.equal(runConsistencyAudit(), true);
});

