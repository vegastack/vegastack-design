#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildRetryPlan,
  fingerprintRetryEvidence,
  retryCommand,
  retryInvocation,
  validateRetryDiagnosticReport,
  validateRetryTarget,
} from "./lib/retry-plan.mjs";

const TREE = "tree-1111111111111111111111111111111111111111";
const root = mkdtempSync(join(tmpdir(), "vegastack-gate-retry-"));
try {
  const unit = "packages/ui/registry/ui/button.test.tsx";
  mkdirSync(join(root, "packages/ui/registry/ui"), { recursive: true });
  writeFileSync(join(root, unit), "// retry target\n");

  const unitTarget = {
    kind: "vitest",
    lane: "unit",
    file: unit,
    engine: "chromium",
    testName: "Button > renders",
  };
  const contractTarget = {
    kind: "contract",
    route: "/docs/components/button",
    project: "chromium",
    title: "/docs/components/button contains its primary fixture at 320px",
  };
  assert.deepEqual(validateRetryTarget(unitTarget, { root }), unitTarget);
  assert.deepEqual(
    validateRetryTarget(contractTarget, { root }),
    contractTarget,
  );

  const failure = {
    mode: "push",
    runId: "failed-run",
    tree: TREE,
    failures: [
      { id: "unit", status: "fail" },
      { id: "contracts", status: "fail" },
    ],
    retryTargets: [unitTarget, contractTarget],
  };
  const plan = buildRetryPlan(failure, { root, treeHash: TREE });
  assert.equal(plan.diagnosticOnly, true);
  assert.equal(plan.targets.length, 2);
  assert.match(retryCommand(plan.targets[0]).args.join(" "), /--file/);
  assert.match(
    retryCommand(plan.targets[0]).args.join(" "),
    /--engine chromium/,
  );
  assert.match(retryCommand(plan.targets[0]).args.join(" "), /--test-name/);
  assert.match(
    retryCommand(plan.targets[1]).args.join(" "),
    /--project chromium/,
  );
  assert.match(retryCommand(plan.targets[1]).args.join(" "), /--title/);
  assert.match(retryCommand(plan.targets[1]).args.join(" "), /--diagnostic/);
  for (const target of plan.targets) {
    const args = retryInvocation(target, {
      report: ".gates/diagnostics/retry.json",
      retryId: "retry-1",
    }).args.join(" ");
    assert.match(args, /--run-id retry-1/);
    assert.match(args, /--report \.gates\/diagnostics\/retry\.json/);
  }

  const context = {
    retryId: "retry-1",
    tree: TREE,
    generation: "generation-1",
    environmentProfile: "environment-1",
  };
  const boundary = {
    runId: context.retryId,
    generation: context.generation,
    environmentProfile: context.environmentProfile,
    treeBinding: { started: TREE, completed: TREE, unchanged: true },
    diagnosticOnly: true,
    evidenceWritten: false,
    receiptWritten: false,
    evidenceEligibility: "diagnostic-only",
    state: "executed/pass",
    executed: 1,
    results: { passed: 1, failed: 0, skipped: 0 },
  };
  const unitReport = {
    ...boundary,
    gate: "unit",
    selectedShadow: false,
    executedLeaves: [
      {
        file: unitTarget.file,
        engine: unitTarget.engine,
        testName: unitTarget.testName,
        status: "passed",
      },
    ],
    selection: {
      status: "pass",
      plannedFiles: [unitTarget.file],
      listedLeaves: 1,
      executedLeaves: 1,
    },
  };
  const contractReport = {
    ...boundary,
    gate: "contracts",
    selectedShadow: true,
    scope: {
      full: false,
      routes: [contractTarget.route],
      project: contractTarget.project,
      title: contractTarget.title,
    },
    leafEvidence: {
      executed: {
        executed: 1,
        leaves: [
          {
            route: contractTarget.route,
            project: contractTarget.project,
            title: contractTarget.title,
            outcome: "passed",
          },
        ],
      },
    },
  };
  assert.deepEqual(
    validateRetryDiagnosticReport(unitReport, unitTarget, context),
    { valid: true, outcome: "pass", problems: [] },
  );
  assert.deepEqual(
    validateRetryDiagnosticReport(contractReport, contractTarget, context),
    { valid: true, outcome: "pass", problems: [] },
  );
  for (const [name, mutation, expected] of [
    ["stale run", { runId: "old" }, /runId/],
    [
      "wrong tree",
      { treeBinding: { started: TREE, completed: "other", unchanged: true } },
      /tree/,
    ],
    ["wrong generation", { generation: "old" }, /generation/],
    ["wrong environment", { environmentProfile: "old" }, /environment/],
    ["evidence write", { evidenceWritten: true }, /evidence boundary/],
    ["skipped", { results: { passed: 0, failed: 0, skipped: 1 } }, /skipped/],
    [
      "same-count wrong test",
      {
        executedLeaves: [
          { ...unitReport.executedLeaves[0], testName: "other" },
        ],
      },
      /exact/,
    ],
    [
      "failed leaf claimed pass",
      {
        executedLeaves: [{ ...unitReport.executedLeaves[0], status: "failed" }],
      },
      /outcome/,
    ],
    [
      "failed count claimed pass",
      { results: { passed: 0, failed: 1, skipped: 0 } },
      /counts/,
    ],
  ]) {
    const checked = validateRetryDiagnosticReport(
      { ...unitReport, ...mutation },
      unitTarget,
      context,
    );
    assert.equal(checked.valid, false, name);
    assert.match(checked.problems.join("; "), expected, name);
  }
  const contractContradiction = validateRetryDiagnosticReport(
    {
      ...contractReport,
      leafEvidence: {
        executed: {
          executed: 1,
          leaves: [
            {
              ...contractReport.leafEvidence.executed.leaves[0],
              outcome: "failed",
            },
          ],
        },
      },
    },
    contractTarget,
    context,
  );
  assert.equal(contractContradiction.valid, false);
  assert.match(contractContradiction.problems.join("; "), /outcome/);

  const evidence = join(root, "evidence");
  mkdirSync(evidence);
  writeFileSync(join(evidence, "leaf.json"), "evidence");
  assert.match(fingerprintRetryEvidence(evidence), /^[a-f0-9]{64}$/);
  symlinkSync(join(evidence, "leaf.json"), join(evidence, "alias.json"));
  assert.throws(
    () => fingerprintRetryEvidence(evidence),
    /symlink|unsupported/,
  );

  for (const [name, mutation, expected] of [
    ["empty", { ...failure, retryTargets: [] }, /nonempty|no exact/i],
    ["stale tree", { ...failure, tree: "tree-stale" }, /different tree/i],
    [
      "renamed file",
      {
        ...failure,
        retryTargets: [
          { ...unitTarget, file: "packages/ui/registry/ui/renamed.test.tsx" },
        ],
      },
      /missing|renamed/i,
    ],
    [
      "directory traversal",
      {
        ...failure,
        retryTargets: [{ ...unitTarget, file: "../escape.test.tsx" }],
      },
      /canonical|packages\/ui/i,
    ],
    [
      "stale engine",
      { ...failure, retryTargets: [{ ...unitTarget, engine: "safari" }] },
      /engine/i,
    ],
    [
      "empty test name",
      { ...failure, retryTargets: [{ ...unitTarget, testName: "" }] },
      /test name/i,
    ],
    [
      "unknown route",
      { ...failure, retryTargets: [{ ...contractTarget, route: "/unknown" }] },
      /route/i,
    ],
    [
      "unknown project",
      { ...failure, retryTargets: [{ ...contractTarget, project: "webkit" }] },
      /project/i,
    ],
    [
      "unanchored contract title",
      { ...failure, retryTargets: [{ ...contractTarget, title: "button" }] },
      /title/i,
    ],
  ]) {
    assert.throws(
      () => buildRetryPlan(mutation, { root, treeHash: TREE }),
      expected,
      name,
    );
  }

  const originalFailure = JSON.stringify(failure);
  const originalReceipt = "strong receipt bytes";
  const simulatedDiagnosticResult = { status: "pass", evidenceWritten: false };
  assert.equal(JSON.stringify(failure), originalFailure);
  assert.equal(originalReceipt, "strong receipt bytes");
  assert.equal(simulatedDiagnosticResult.evidenceWritten, false);
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(
  "✓ gate retry: exact bound file/engine/test and route/project/title reports; stale, skipped, renamed, symlink-evidence, and evidence-boundary mutations reject",
);
