#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  parseSelectedFiles,
  reconcileVitestSelection,
  vitestEvidenceBoundary,
} from "./lib/vitest-selection.mjs";

let checks = 0;

assert.deepEqual(
  parseSelectedFiles(
    '["packages/ui/registry/ui/button.test.tsx","packages/ui/registry/ui/copy-button.test.tsx"]',
  ),
  [
    "packages/ui/registry/ui/button.test.tsx",
    "packages/ui/registry/ui/copy-button.test.tsx",
  ],
);
checks++;

for (const [value, expected] of [
  ["[]", /nonempty/],
  ["{}", /JSON array/],
  ['["button.test.tsx", "button.test.tsx"]', /duplicate/],
  ['["button.test.tsx", 3]', /nonempty string/],
]) {
  assert.throws(() => parseSelectedFiles(value), expected);
  checks++;
}

const planned = [
  "packages/ui/registry/ui/button.test.tsx",
  "packages/ui/registry/ui/copy-button.test.tsx",
];
const listed = planned.map((file) => ({
  file,
  projectName: "chromium",
  name: "runs",
}));
const executed = planned.map((file) => ({
  file,
  engine: "chromium",
  testName: "runs",
  status: "passed",
}));
const reconciled = reconcileVitestSelection({
  plannedFiles: planned,
  listed,
  executed,
});
assert.equal(reconciled.status, "pass");
assert.equal(reconciled.listedLeaves, 2);
assert.equal(reconciled.executedLeaves, 2);
checks += 3;

assert.deepEqual(vitestEvidenceBoundary(), {
  diagnosticOnly: false,
  selectedShadow: false,
  evidenceWritten: true,
  receiptWritten: false,
  evidenceEligibility: "gate-candidate",
});
assert.deepEqual(vitestEvidenceBoundary({ selectedShadow: true }), {
  diagnosticOnly: true,
  selectedShadow: true,
  evidenceWritten: false,
  receiptWritten: false,
  evidenceEligibility: "diagnostic-only",
});
checks += 2;

for (const [label, overrides, expected] of [
  ["empty list", { listed: [] }, /listed zero/],
  [
    "missing planned file",
    { listed: listed.slice(0, 1) },
    /planned\/listed file mismatch/,
  ],
  [
    "unexpected file",
    {
      listed: [
        ...listed,
        {
          file: "packages/ui/registry/ui/extra.test.tsx",
          projectName: "chromium",
          name: "runs",
        },
      ],
    },
    /planned\/listed file mismatch/,
  ],
  ["wrong engine", { engine: "webkit" }, /listed project mismatch/],
  ["zero execution", { executed: [] }, /executed zero/],
  [
    "missing executed leaf",
    { executed: executed.slice(0, 1) },
    /listed\/executed leaf mismatch/,
  ],
  [
    "skipped-only leaf",
    { executed: executed.map((entry) => ({ ...entry, status: "skipped" })) },
    /executed zero/,
  ],
  [
    "one skipped leaf",
    { executed: [{ ...executed[0], status: "skipped" }, executed[1]] },
    /listed\/executed leaf mismatch/,
  ],
  [
    "missing listed name",
    { listed: [{ ...listed[0], name: null }, listed[1]] },
    /exact test name/,
  ],
  [
    "duplicate exact leaf",
    { listed: [listed[0], listed[0]] },
    /planned\/listed|duplicate/,
  ],
]) {
  assert.throws(
    () =>
      reconcileVitestSelection({
        plannedFiles: planned,
        listed,
        executed,
        ...overrides,
      }),
    expected,
    label,
  );
  checks++;
}

console.log(
  `✓ Vitest selection: ${checks} exact selector/reconciliation mutations fail closed`,
);
