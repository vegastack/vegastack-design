#!/usr/bin/env node
// Prove the change classifier, in both directions, against real history.
//
// WHY THIS EXISTS
//   The provenance subtraction it guards has already shipped wrong twice, both times as workflow
//   shell, and both times in a way reading could not catch (docs/ledger/operator-review.md,
//   2026-07-25):
//
//     - reporting a rendered-surface change for a pure version bump, so the 768-check gate re-ran
//       over 1082 files whose only diff was a re-stamped provenance comment;
//     - then, after the fix, referencing an unbound variable inside `$( … || true )` so it reported
//       NO change for a real component edit and exited 0 — a fail-open with a green log.
//
//   Synthetic assertions alone would not have caught either. So this verifier asserts against actual
//   commits in this repository's history: a real Version Packages commit must require no contract
//   lane, and a real component change must require one.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  isSubstantiveLine,
  resolveCommit,
  ROOT,
  splitDiffByFile,
  versionBumpOnly,
} from "./lib/change-set.mjs";

let checks = 0;

// ── the line rule ────────────────────────────────────────────────────────────────────────────────

for (const [line, expected, why] of [
  [
    "+// @vegastack button@0.2.0 sha256-abc123",
    false,
    "an added provenance header",
  ],
  [
    "-// @vegastack button@0.1.1 sha256-def456",
    false,
    "a removed provenance header",
  ],
  [
    "+// @vegastack app-shell@10.20.30 sha256-x",
    false,
    "a multi-digit version",
  ],
  ["+++ b/packages/ui/registry/ui/button.tsx", false, "the +++ file marker"],
  ["--- a/packages/ui/registry/ui/button.tsx", false, "the --- file marker"],
  ["   const unchanged = true;", false, "an unchanged context line"],
  ["@@ -1 +1 @@", false, "a hunk header"],
  ["+  const substantive = true;", true, "a real added line"],
  ["-  const substantive = true;", true, "a real removed line"],
  ["Binary files a/logo.png and b/logo.png differ", true, "a binary change"],
  // A hand-written comment that merely mentions the marker is NOT provenance: the real header always
  // carries `@<digit>`. Treating this as provenance would silently drop a genuine edit.
  [
    "+// @vegastack design system note",
    true,
    "a comment resembling the header but not versioned",
  ],
  ["+// @vegastack button@next sha256-abc", true, "a non-numeric version"],
]) {
  assert.equal(
    isSubstantiveLine(line),
    expected,
    `isSubstantiveLine: ${why} must be ${expected ? "substantive" : "non-substantive"}: ${line}`,
  );
  checks++;
}

// ── the diff splitter ────────────────────────────────────────────────────────────────────────────

const sample = [
  "diff --git a/packages/ui/registry/ui/button.tsx b/packages/ui/registry/ui/button.tsx",
  "index 1111111..2222222 100644",
  "--- a/packages/ui/registry/ui/button.tsx",
  "+++ b/packages/ui/registry/ui/button.tsx",
  "@@ -1 +1 @@",
  "-// @vegastack button@0.1.1 sha256-old",
  "+// @vegastack button@0.2.0 sha256-new",
  "diff --git a/packages/ui/registry/ui/card.tsx b/packages/ui/registry/ui/card.tsx",
  "--- a/packages/ui/registry/ui/card.tsx",
  "+++ b/packages/ui/registry/ui/card.tsx",
  "@@ -3 +3 @@",
  "-  const radius = 'rounded-md';",
  "+  const radius = 'rounded-lg';",
].join("\n");

const split = splitDiffByFile(sample);
assert.deepEqual(
  split.map(([file]) => file),
  ["packages/ui/registry/ui/button.tsx", "packages/ui/registry/ui/card.tsx"],
  "splitDiffByFile must attribute each hunk to its `b/` path",
);
assert.equal(
  split[0][1].some(isSubstantiveLine),
  false,
  "a provenance-only file must have no substantive line",
);
assert.equal(
  split[1][1].some(isSubstantiveLine),
  true,
  "a real edit must have a substantive line",
);
checks += 3;

// A rename must not read as empty. `--no-renames` is what forces delete+add so the body exists at
// all; without it git emits `rename from/to` with no +/- lines and the file looks untouched.
const renameOnly = [
  "diff --git a/packages/ui/registry/ui/old.tsx b/packages/ui/registry/ui/new.tsx",
  "similarity index 100%",
  "rename from packages/ui/registry/ui/old.tsx",
  "rename to packages/ui/registry/ui/new.tsx",
].join("\n");
assert.equal(
  splitDiffByFile(renameOnly)[0][1].some(isSubstantiveLine),
  false,
  "a rename WITHOUT --no-renames produces no substantive line — which is exactly why " +
    "dropProvenanceOnly passes --no-renames; if this ever becomes true the flag was dropped",
);
checks++;

// ── against real history ─────────────────────────────────────────────────────────────────────────

function classify(before, after) {
  const scratch = mkdtempSync(join(tmpdir(), "classify-verify-"));
  const outputFile = join(scratch, "github-output");
  writeFileSync(outputFile, "");
  try {
    const stdout = execFileSync(
      "node",
      [
        join(ROOT, "tooling/classify-change.mjs"),
        "--before",
        before,
        "--after",
        after,
        "--json",
        "--github-output",
        outputFile,
      ],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    const outputs = Object.fromEntries(
      readFileSync(outputFile, "utf8")
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const separator = line.indexOf("=");
          return [line.slice(0, separator), line.slice(separator + 1)];
        }),
    );
    return { json: JSON.parse(stdout), outputs };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// A pure version bump. `Version Packages (#1)` re-stamped the provenance header into every component
// source and docs copy-in and changed every item's `meta.version`. Nothing it touched can move a
// contract assertion, and demanding the 13.6-minute sweep for it is the waste this repo already
// paid four times per release once.
const VERSION_BUMP = "bcd59ada8f4d793f54cdb422c34537926e80275d";
// A real component change: 629 registry files reconciled.
const COMPONENT_CHANGE = "6c60d532745e411ca9c50d7039e50da5f368139a";

for (const [sha, label] of [
  [VERSION_BUMP, "the Version Packages commit"],
  [COMPONENT_CHANGE, "the full-system reconcile commit"],
])
  assert.ok(
    resolveCommit(sha),
    `${label} (${sha.slice(0, 8)}) is not in this repository — the fixture must be updated, not skipped`,
  );

const bump = classify(`${VERSION_BUMP}~1`, VERSION_BUMP);
assert.ok(
  bump.json.provenanceOnlyFiles > 1_000,
  `the version bump must be recognised as provenance re-stamping at scale, got ${bump.json.provenanceOnlyFiles}`,
);
assert.equal(
  bump.json.contracts,
  false,
  "a pure version bump must NOT require the contract lane — nothing it touched can move an assertion",
);
// unit and smoke too. `packages/ui/package.json` matches UNIT_SURFACE, so without the version-bump
// short-circuit a Version PR demanded the browser-unit lane against a receipt that legitimately
// records it as skipped — a publish path that could never open. Measured on Version PR #11.
assert.equal(
  bump.json.unit,
  false,
  "a pure version bump must NOT require the browser-unit lane — a version field cannot break it",
);
assert.equal(
  bump.json.smoke,
  false,
  "a pure version bump must NOT require the cross-engine smoke lane",
);
assert.equal(
  bump.json.pureVersionBump,
  true,
  "a pure version bump must be RECOGNISED as one, not merely happen to require nothing",
);
assert.equal(
  bump.json.has_changesets !== undefined,
  true,
  "has_changesets must always be set",
);
checks += 3;

const real = classify(`${COMPONENT_CHANGE}~1`, COMPONENT_CHANGE);
assert.equal(
  real.json.contracts,
  true,
  "a real component change MUST require the contract lane — this is the fail-open direction",
);
assert.equal(
  real.json.pureVersionBump,
  false,
  "a real component change must never be classified as a pure version bump",
);
assert.ok(
  real.json.substantiveFiles > 100,
  `a real component change must retain its substantive files, got ${real.json.substantiveFiles}`,
);
checks += 2;

// ── the version-bump predicate, against real history ─────────────────────────────────────────────
//
// This is what makes the receipt carry safe: `tooling/gate-receipt-carry.mjs` may only move a receipt
// across a diff this predicate accepts, and `verify-gate-receipt.mjs` re-derives it independently. If
// it ever accepted a real code change, a Version PR could publish unverified code.

{
  const bump = versionBumpOnly(`${VERSION_BUMP}~1`, VERSION_BUMP);
  assert.equal(
    bump.ok,
    true,
    `the real Version Packages commit must be recognised as pure version churn, but ${bump.offenders.length} ` +
      `difference(s) were rejected, e.g. ${bump.offenders[0]?.file}: ${String(bump.offenders[0]?.line).slice(0, 120)}`,
  );
  assert.ok(
    bump.files > 1_000,
    `the fixture must actually exercise scale, got ${bump.files} files`,
  );
  checks += 2;
}
{
  const real = versionBumpOnly(`${COMPONENT_CHANGE}~1`, COMPONENT_CHANGE);
  assert.equal(
    real.ok,
    false,
    "a real component change must NOT be accepted as version churn — this is the fail-open direction",
  );
  checks++;
}

// ── no output may ever be unset ──────────────────────────────────────────────────────────────────

// An output the workflow never set reads as false in an `if:`, so the gate it guards is SKIPPED
// rather than failed. That is the precise shape of the 2026-07-25 fail-open.
const REQUIRED_OUTPUTS = [
  "contracts",
  "contracts_scope",
  "unit",
  "smoke",
  "publish",
  "has_changesets",
];
for (const [result, label] of [
  [bump, "the version bump"],
  [real, "the component change"],
]) {
  const missing = REQUIRED_OUTPUTS.filter(
    (key) => result.outputs[key] === undefined || result.outputs[key] === "",
  );
  assert.deepEqual(
    missing,
    [],
    `${label}: unset $GITHUB_OUTPUT key(s) ${missing.join(", ")} — an unset output reads as false ` +
      "in an `if:`, silently skipping the gate it guards",
  );
  checks++;
}

console.log(
  `✓ classify-change: ${checks} assertions — a real Version Packages commit (${bump.json.provenanceOnlyFiles} ` +
    `provenance-only files) requires no contract lane, a real component change requires one, and every ` +
    `$GITHUB_OUTPUT key is always set`,
);
