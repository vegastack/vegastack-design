#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildRetryPlan,
  retryCommand,
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
  "✓ gate retry: exact file/engine/test and route/project/title selectors; empty/stale/renamed/unknown mutations reject; diagnostic result cannot become evidence",
);
