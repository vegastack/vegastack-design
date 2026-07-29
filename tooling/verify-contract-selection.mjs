#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  contractLeavesFromPlaywright,
  expectedContractLeaves,
  reconcileContractLeaves,
} from "./lib/contract-selection.mjs";

const ROOT = resolve(import.meta.dirname, "..");

const expectedLeaves = expectedContractLeaves({
  routes: ["/docs/components/button"],
});
const playwrightReport = (leaves) => ({
  suites: [
    {
      specs: leaves.map((leaf) => ({
        title: leaf.title,
        tests: [{ projectName: leaf.project }],
      })),
    },
  ],
});
const actualLeaves = contractLeavesFromPlaywright(
  playwrightReport(expectedLeaves),
);
assert.equal(
  reconcileContractLeaves(expectedLeaves, actualLeaves, "fixture").executed,
  8,
);
assert.throws(
  () =>
    reconcileContractLeaves(
      expectedLeaves,
      [...actualLeaves.slice(0, -1), actualLeaves[0]],
      "same-count mutation",
    ),
  /duplicate|mismatch/,
  "a duplicate replacing a missing contract leaf must not pass by count",
);
assert.throws(
  () =>
    reconcileContractLeaves(
      expectedLeaves,
      actualLeaves.map((leaf, index) => ({
        ...leaf,
        outcome: index === 0 ? "skipped" : "passed",
      })),
      "renamed execution phase",
      { requirePassed: true },
    ),
  /did not pass/,
  "a skipped required contract leaf must not satisfy exact identity reconciliation",
);
const oneFailedLeaf = actualLeaves.map((leaf, index) => ({
  ...leaf,
  outcome: index === 0 ? "failed" : "passed",
}));
assert.equal(
  reconcileContractLeaves(
    expectedLeaves,
    oneFailedLeaf,
    "runtime identity before failure classification",
  ).executed,
  expectedLeaves.length,
  "a complete failed run must retain its exact leaf universe for retry targeting",
);
assert.throws(
  () =>
    reconcileContractLeaves(
      expectedLeaves,
      oneFailedLeaf,
      "passing evidence freeze",
      { requirePassed: true },
    ),
  /did not pass/,
  "the same failed leaf universe can never become passing receipt evidence",
);
assert.throws(
  () =>
    reconcileContractLeaves(
      expectedLeaves,
      [
        ...actualLeaves.slice(0, -1),
        {
          ...actualLeaves.at(-1),
          title:
            "/docs/components/not-button contains its primary fixture at 320px",
          route: "/docs/components/not-button",
        },
      ],
      "same-count extra mutation",
    ),
  /mismatch/,
  "a same-count extra route replacing a required route must fail",
);

function run(args) {
  return spawnSync(process.execPath, ["tooling/contracts-run.mjs", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    timeout: 20_000,
  });
}

const missing = run(["--diagnostic"]);
assert.equal(missing.status, 2);
assert.match(
  `${missing.stdout}\n${missing.stderr}`,
  /--diagnostic requires a nonempty exact --routes selector/,
);

const empty = run(["--diagnostic", "--routes", ","]);
assert.equal(empty.status, 2);
assert.match(
  `${empty.stdout}\n${empty.stderr}`,
  /--diagnostic requires a nonempty exact --routes selector/,
);

const canonicalOverwrite = run([
  "--diagnostic",
  "--routes",
  "/docs/components/button",
  "--report",
  ".gates/contracts.json",
  "--dry-run",
]);
assert.equal(canonicalOverwrite.status, 2);
assert.match(
  `${canonicalOverwrite.stdout}\n${canonicalOverwrite.stderr}`,
  /must be under \.gates\/diagnostics/,
);

const directory = join(
  ROOT,
  ".gates",
  "diagnostics",
  "contract-selection-test",
);
rmSync(directory, { recursive: true, force: true });
mkdirSync(directory, { recursive: true });
try {
  const reportPath = join(directory, "report.json");
  const selected = run([
    "--diagnostic",
    "--routes",
    "/docs/components/button",
    "--dry-run",
    "--report",
    reportPath,
  ]);
  assert.equal(selected.status, 0, `${selected.stdout}\n${selected.stderr}`);
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  assert.equal(report.status, "dry-run");
  assert.equal(report.diagnosticOnly, true);
  assert.equal(report.selectedShadow, true);
  assert.equal(report.evidenceWritten, false);
  assert.equal(report.receiptWritten, false);
  assert.equal(report.evidenceEligibility, "diagnostic-only");
  assert.deepEqual(report.scope.routes, ["/docs/components/button"]);
  assert.equal(report.scope.full, false);
  assert.equal(report.expected, 8);
  assert.equal(report.executed, 0);

  const gateReportPath = join(directory, "gate-report.json");
  const gateCandidate = run([
    "--routes",
    "/docs/components/button",
    "--dry-run",
    "--report",
    gateReportPath,
  ]);
  assert.equal(
    gateCandidate.status,
    0,
    `${gateCandidate.stdout}\n${gateCandidate.stderr}`,
  );
  const gateReport = JSON.parse(readFileSync(gateReportPath, "utf8"));
  assert.equal(gateReport.diagnosticOnly, true);
  assert.equal(gateReport.evidenceWritten, false);
  assert.equal(gateReport.receiptWritten, false);
  assert.equal(gateReport.evidenceEligibility, "diagnostic-only");

  const protectedDryRun = run([
    "--all",
    "--dry-run",
    "--report",
    ".gates/contracts.json",
  ]);
  assert.equal(protectedDryRun.status, 2);
  assert.match(
    `${protectedDryRun.stdout}\n${protectedDryRun.stderr}`,
    /must be under \.gates\/diagnostics/,
  );

  const outside = run([
    "--diagnostic",
    "--routes",
    "/docs/components/button",
    "--dry-run",
    "--report",
    "/tmp/contracts-report.json",
  ]);
  assert.equal(outside.status, 2);
  assert.match(`${outside.stdout}\n${outside.stderr}`, /must be under/);
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log(
  "✓ contract selection: exact route/project/assertion leaves reject same-count substitutions; diagnostics cannot write receipt evidence",
);
