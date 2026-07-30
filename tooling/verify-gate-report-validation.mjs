#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  expectedContractLeaves,
  reconcileContractLeaves,
} from "./lib/contract-selection.mjs";
import {
  validateContractGateReport,
  validateSelectedContractDiagnosticReport,
  validateSelectedVitestDiagnosticReport,
  validateVitestGateReport,
} from "./lib/gate-report-validation.mjs";
import { reconcileVitestSelection } from "./lib/vitest-selection.mjs";
import { ROOT } from "./lib/change-set.mjs";

const common = {
  runId: "run-1",
  tree: "tree-1",
  generation: "generation-1",
  environmentProfile: "environment-1",
  runStartedAt: "2026-07-30T00:00:00.000Z",
};
const listed = [
  { file: "packages/ui/a.test.tsx", projectName: "chromium", name: "a" },
  { file: "packages/ui/a.test.tsx", projectName: "firefox", name: "a" },
  { file: "packages/ui/a.test.tsx", projectName: "webkit", name: "a" },
];
const executedLeaves = listed.map(
  ({ file, projectName: engine, name: testName }) => ({
    file,
    engine,
    testName,
    status: "passed",
  }),
);
const selection = reconcileVitestSelection({
  plannedFiles: ["packages/ui/a.test.tsx"],
  listed,
  executed: executedLeaves,
});
const vitest = {
  schema: 1,
  gate: "smoke",
  ...common,
  diagnosticOnly: false,
  selectedShadow: false,
  evidenceEligibility: "gate-candidate",
  evidenceWritten: true,
  receiptWritten: false,
  state: "executed/pass",
  status: "pass",
  startedAt: "2026-07-30T00:00:01.000Z",
  completedAt: "2026-07-30T00:00:02.000Z",
  treeBinding: { started: "tree-1", completed: "tree-1", unchanged: true },
  executed: 3,
  results: { passed: 3, failed: 0, skipped: 0 },
  failures: [],
  unhandledErrors: [],
  executedLeaves,
  selection,
};
const vitestContext = {
  gate: "smoke",
  ...common,
  expectedEngines: ["chromium", "firefox", "webkit"],
  expectedFiles: ["packages/ui/a.test.tsx"],
};
assert.deepEqual(validateVitestGateReport(vitest, vitestContext).problems, []);
const vitestWithReportedExclusion = structuredClone(vitest);
vitestWithReportedExclusion.results.skipped = 1;
vitestWithReportedExclusion.executedLeaves.push({
  file: "packages/ui/a.test.tsx",
  engine: "firefox",
  testName: "environment-inexpressible case",
  status: "skipped",
});
const exclusionValidation = validateVitestGateReport(
  vitestWithReportedExclusion,
  vitestContext,
);
assert.deepEqual(
  exclusionValidation.problems,
  [],
  "a runtime-reported skip omitted from the pre-run canonical list remains visible but is not a required evidence leaf",
);
assert.equal(
  exclusionValidation.leafManifest.length,
  3,
  "only pre-listed required leaves may enter passing evidence",
);
assert.equal(
  exclusionValidation.excludedLeafManifest.length,
  1,
  "runtime-reported exclusions remain visible for diagnosis",
);
for (const [label, mutate, expected] of [
  [
    "excluded count mismatch",
    (value) => (value.results.skipped = 2),
    /skip counts disagree/,
  ],
  [
    "missing visible excluded leaf",
    (value) => value.executedLeaves.pop(),
    /skip counts disagree/,
  ],
  [
    "duplicate excluded leaf",
    (value) => {
      value.executedLeaves.push(structuredClone(value.executedLeaves.at(-1)));
      value.results.skipped = 2;
    },
    /duplicates/,
  ],
  [
    "excluded leaf outside file authority",
    (value) =>
      (value.executedLeaves.at(-1).file = "packages/ui/foreign.test.tsx"),
    /outside the independent lane universe/,
  ],
  [
    "excluded leaf outside engine authority",
    (value) => (value.executedLeaves.at(-1).engine = "unknown-engine"),
    /outside the independent lane universe/,
  ],
  [
    "unknown runtime status",
    (value) => (value.executedLeaves.at(-1).status = "unknown"),
    /skip counts disagree|required Vitest leaf/,
  ],
  [
    "excluded leaf smuggled into required selection",
    (value) => {
      const leaf = value.executedLeaves.at(-1);
      value.selection.leafManifest.push(
        `${leaf.file}\0${leaf.engine}\0${leaf.testName}`,
      );
    },
    /pre-listed required Vitest leaf was skipped/,
  ],
]) {
  const value = structuredClone(vitestWithReportedExclusion);
  mutate(value);
  assert.match(
    validateVitestGateReport(value, vitestContext).problems.join("\n"),
    expected,
    label,
  );
}

const prelistedRuntimeSkip = structuredClone(vitest);
prelistedRuntimeSkip.executed = 2;
prelistedRuntimeSkip.results = { passed: 2, failed: 0, skipped: 1 };
prelistedRuntimeSkip.executedLeaves[0].status = "skipped";
assert.match(
  validateVitestGateReport(prelistedRuntimeSkip, vitestContext).problems.join(
    "\n",
  ),
  /pre-listed required Vitest leaf was skipped/,
  "a required leaf that dynamically skips after pre-listing cannot become passing evidence",
);
assert.match(
  validateVitestGateReport(vitest, {
    ...vitestContext,
    expectedFiles: ["packages/ui/a.test.tsx", "packages/ui/b.test.tsx"],
  }).problems.join("\n"),
  /independent lane authority|no executed leaf/,
  "an internally consistent report cannot omit an authority-required file",
);
const sameCountReplacementContext = {
  ...vitestContext,
  expectedFiles: ["packages/ui/required.test.tsx"],
};
assert.match(
  validateVitestGateReport(vitest, sameCountReplacementContext).problems.join(
    "\n",
  ),
  /independent lane authority|no executed leaf/,
  "a same-count replacement file cannot satisfy the required file universe",
);
for (const [label, mutate, expected] of [
  ["deletion", () => null, /missing/],
  ["stale run", (value) => (value.runId = "old"), /runId/],
  [
    "wrong tree",
    (value) => (value.treeBinding.completed = "other"),
    /exact unchanged/,
  ],
  ["wrong generation", (value) => (value.generation = "old"), /generation/],
  [
    "wrong environment",
    (value) => (value.environmentProfile = "other"),
    /environment/,
  ],
  ["zero executed", (value) => (value.executed = 0), /positive/],
  ["skipped", (value) => (value.results.skipped = 1), /counts/],
  [
    "missing engine",
    (value) => value.executedLeaves.pop(),
    /engine universe|count|manifest/,
  ],
  [
    "diagnostic substitution",
    (value) => (value.diagnosticOnly = true),
    /diagnostic/,
  ],
  [
    "leaf replacement",
    (value) => (value.executedLeaves[0].testName = "other"),
    /manifest|digest/,
  ],
  [
    "omitted file",
    (value) => {
      value.selection.plannedFiles = [];
      value.selection.listedFiles = [];
    },
    /independent lane authority|planned\/listed files/,
  ],
]) {
  const value = structuredClone(vitest);
  const replacement = mutate(value);
  assert.match(
    validateVitestGateReport(
      replacement === null ? null : value,
      vitestContext,
    ).problems.join("\n"),
    expected,
    label,
  );
}

const selectedVitest = {
  ...structuredClone(vitest),
  diagnosticOnly: true,
  selectedShadow: true,
  evidenceEligibility: "diagnostic-only",
  evidenceWritten: false,
};
assert.deepEqual(
  validateSelectedVitestDiagnosticReport(selectedVitest, vitestContext)
    .problems,
  [],
);
for (const [label, mutate, expected] of [
  [
    "same-count file",
    (value) => {
      for (const leaf of value.executedLeaves)
        leaf.file = "packages/ui/wrong.test.tsx";
    },
    /file universe|manifest/,
  ],
  [
    "wrong engine",
    (value) => (value.executedLeaves[0].engine = "webkit"),
    /duplicate|engine|manifest/,
  ],
  [
    "skipped leaf",
    (value) => (value.executedLeaves[0].status = "skipped"),
    /skipped|unknown/,
  ],
  [
    "duplicate leaf",
    (value) =>
      (value.executedLeaves[1] = structuredClone(value.executedLeaves[0])),
    /duplicate/,
  ],
  ["stale cohort", (value) => (value.generation = "old"), /generation/],
]) {
  const value = structuredClone(selectedVitest);
  mutate(value);
  assert.match(
    validateSelectedVitestDiagnosticReport(value, vitestContext).problems.join(
      "\n",
    ),
    expected,
    label,
  );
}

const routes = ["/docs/components/button"];
const expectedLeaves = expectedContractLeaves({ routes });
const listedEvidence = reconcileContractLeaves(
  expectedLeaves,
  expectedLeaves.map((leaf) => ({ ...leaf, outcome: null })),
  "fixture list",
);
const executedEvidence = reconcileContractLeaves(
  expectedLeaves,
  expectedLeaves.map((leaf) => ({ ...leaf, outcome: "passed" })),
  "fixture run",
  { requirePassed: true },
);
const contracts = {
  schema: 1,
  gate: "contracts",
  ...common,
  diagnosticOnly: false,
  selectedShadow: false,
  evidenceEligibility: "gate-candidate",
  evidenceWritten: true,
  receiptWritten: false,
  state: "executed/pass",
  status: "pass",
  completedAt: "2026-07-30T00:00:02.000Z",
  treeBinding: { started: "tree-1", completed: "tree-1", unchanged: true },
  expected: expectedLeaves.length,
  executed: expectedLeaves.length,
  results: { passed: expectedLeaves.length, failed: 0, flaky: 0, skipped: 0 },
  failures: [],
  scope: { routes, full: false },
  leafEvidence: {
    expected: expectedLeaves,
    listed: listedEvidence,
    executed: executedEvidence,
  },
};
const contractContext = {
  gate: "contracts",
  ...common,
  expectedRoutes: routes,
  requireFull: false,
};
assert.deepEqual(
  validateContractGateReport(contracts, contractContext).problems,
  [],
);
for (const [label, mutate, expected] of [
  ["malformed", (value) => (value.schema = 0), /schema/],
  ["partial", (value) => value.leafEvidence.executed.leaves.pop(), /leaf/],
  ["flaky", (value) => (value.results.flaky = 1), /retry|flaky/],
  ["scoped-as-full", (value) => (value.scope.full = true), /full flag/],
  [
    "diagnostic",
    (value) => (value.evidenceEligibility = "diagnostic-only"),
    /diagnostic/,
  ],
  [
    "same-count replacement",
    (value) => (value.leafEvidence.executed.leaves[0].route = "/wrong"),
    /leaf/,
  ],
]) {
  const value = structuredClone(contracts);
  mutate(value);
  assert.match(
    validateContractGateReport(value, contractContext).problems.join("\n"),
    expected,
    label,
  );
}

const selectedContracts = {
  ...structuredClone(contracts),
  diagnosticOnly: true,
  selectedShadow: true,
  evidenceEligibility: "diagnostic-only",
  evidenceWritten: false,
  scope: { ...contracts.scope, project: null, title: null },
};
assert.deepEqual(
  validateSelectedContractDiagnosticReport(selectedContracts, {
    gate: "contracts",
    ...common,
    expectedRoutes: routes,
  }).problems,
  [],
);
for (const [label, mutate, expected] of [
  [
    "wrong route",
    (value) => (value.scope.routes = ["/docs/components/other"]),
    /scope/,
  ],
  [
    "same-count leaf",
    (value) => (value.leafEvidence.executed.leaves[0].route = "/wrong"),
    /leaves rejected/,
  ],
  [
    "skipped outcome",
    (value) => (value.leafEvidence.executed.leaves[0].outcome = "skipped"),
    /outcomes/,
  ],
  [
    "stale environment",
    (value) => (value.environmentProfile = "old"),
    /environment/,
  ],
]) {
  const value = structuredClone(selectedContracts);
  mutate(value);
  assert.match(
    validateSelectedContractDiagnosticReport(value, {
      gate: "contracts",
      ...common,
      expectedRoutes: routes,
    }).problems.join("\n"),
    expected,
    label,
  );
}

const gateSource = readFileSync(join(ROOT, "tooling/gates.mjs"), "utf8");
const freezeCondition =
  /if \(!treeIntegrityError && \(mode === "push" \|\| mode === "ship"\)\) \{/;
assert.match(
  gateSource,
  freezeCondition,
  "structured evidence freeze must run for push/ship even with --no-receipt",
);
assert.doesNotMatch(
  gateSource.match(freezeCondition)?.[0] ?? "",
  /options\.receipt/,
  "--no-receipt must never bypass child-report integrity validation",
);

const labelAgnostic = expectedLeaves.map((leaf) => ({
  ...leaf,
  outcome: "skipped",
}));
assert.throws(
  () =>
    reconcileContractLeaves(expectedLeaves, labelAgnostic, "renamed phase", {
      requirePassed: true,
    }),
  /did not pass/,
  "renaming the phase cannot disable runtime outcome validation",
);

console.log(
  "✓ gate report validation: deletion/corruption/stale tree/run/toolchain, required-skip/exclusion/engine/leaf/diagnostic/flaky mutations fail closed",
);
