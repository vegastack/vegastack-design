#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdirSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./lib/change-set.mjs";
import { validateDiagnosticReportPath } from "./lib/report-path.mjs";

const safe = join(ROOT, ".gates", "diagnostics", "test", "report.json");
assert.equal(validateDiagnosticReportPath(safe), safe);
for (const [label, path] of [
  ["receipt", join(ROOT, ".gates", "receipt.json")],
  ["evidence", join(ROOT, ".gates", "evidence", "leaf.json")],
  ["canonical", join(ROOT, ".gates", "contracts.json")],
  ["last failure", join(ROOT, ".gates", "last-failure.json")],
  ["tracked file", join(ROOT, "README.md")],
  ["outside", "/tmp/vegastack-report.json"],
])
  assert.throws(
    () => validateDiagnosticReportPath(path, label),
    /must be under/,
    label,
  );

const symlinkParent = join(ROOT, ".gates", "diagnostics", "path-test-link");
rmSync(symlinkParent, { recursive: true, force: true });
mkdirSync(join(ROOT, ".gates", "diagnostics"), { recursive: true });
symlinkSync("/tmp", symlinkParent);
try {
  assert.throws(
    () => validateDiagnosticReportPath(join(symlinkParent, "report.json")),
    /symlink/,
    "an existing descendant symlink must not redirect a report",
  );
} finally {
  rmSync(symlinkParent, { force: true });
}

console.log(
  "✓ diagnostic report paths: receipt, evidence, canonical, failure, tracked, outside, and symlink destinations fail closed",
);
