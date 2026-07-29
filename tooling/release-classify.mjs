#!/usr/bin/env node
// Answer "what will Release actually DO with this push?" before pushing it.
//
// WHY THIS EXISTS
//   `release.yml`'s `changes` job decides the receipt requirements, then resolves an explicit,
//   resumable release state. The workflow scripts normally do not execute until a push reaches
//   `main`, where being wrong is expensive.
//
//   It has been wrong. On 2026-07-25 the visual classifier was changed to stop re-running the gate on
//   a pure version bump, and the change was WRONG in both directions at different points: first it
//   still reported `visual=true` (in the dated 2026-07-25 incident, version-sync re-stamped a provenance header into 1082 component
//   files, which a filename filter cannot distinguish from a real edit), and an intermediate revision
//   referenced an unbound variable inside `$( … || true )` so it reported `visual=false` for a real
//   component change AND exited 0 — a completely fail-open gate with a green log. Reading the shell
//   did not catch either. Executing it did.
//
// WHAT IT DOES
//   Extracts the `detect` and `state` step scripts verbatim from `.github/workflows/release.yml` and runs them
//   against two refs with the same environment Actions gives it. No reimplementation — reimplementing
//   the logic here would just create a second thing to keep in sync, and the bug would hide in the
//   gap.
//
//   The classification itself now lives in `tooling/classify-change.mjs`, which that step calls, and
//   `tooling/verify-classify-change.mjs` proves against real history. So this tool no longer carries
//   the only executable check on the logic — but it remains the only check on the WIRING: that the
//   step still exists, still runs, and still sets every output the receipt guard reads. An output the
//   step forgets to set reads as `false` in an `if:`, which relaxes a gate rather than failing it.
//
// USAGE
//   node tooling/release-classify.mjs                          # origin/main → HEAD (what a push does)
//   node tooling/release-classify.mjs --before main --after changeset-release/main
//   node tooling/release-classify.mjs --before <sha> --after <sha>

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = join(ROOT, ".github/workflows/release.yml");

function fail(message) {
  console.error(`release-classify: ${message}`);
  process.exit(2);
}

const options = { before: null, after: "HEAD" };
for (let i = 0; i < process.argv.length - 2; i++) {
  const flag = process.argv[i + 2];
  if (flag === "--before") options.before = process.argv[++i + 2];
  else if (flag === "--after") options.after = process.argv[++i + 2];
  else if (flag === "--help" || flag === "-h") {
    console.log(
      "Usage: node tooling/release-classify.mjs [--before <ref>] [--after <ref>]",
    );
    process.exit(0);
  } else fail(`unknown option ${flag}`);
}

const git = (args) => {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
};

const before =
  options.before ??
  (git(["rev-parse", "--verify", "--quiet", "origin/main"])
    ? "origin/main"
    : "main");
const beforeSha = git(["rev-parse", `${before}^{commit}`]);
const afterSha = git(["rev-parse", `${options.after}^{commit}`]);
if (!beforeSha) fail(`--before ref does not resolve: ${before}`);
if (!afterSha) fail(`--after ref does not resolve: ${options.after}`);

// Pull the script out of the workflow rather than copying it. If the step is renamed or restructured
// this fails loudly instead of silently classifying with stale logic.
const workflow = parse(readFileSync(WORKFLOW, "utf8"));
const steps = ["detect", "state"].map((id) =>
  (workflow.jobs?.changes?.steps ?? []).find((step) => step.id === id),
);
if (steps.some((step) => !step?.run))
  fail(
    "release.yml must have `changes` steps with ids `detect` and `state`, each carrying a run script — " +
      "this tool extracts those scripts verbatim and cannot guess a replacement",
  );

const scratch = mkdtempSync(join(tmpdir(), "release-classify-"));
const output = join(scratch, "github-output");
writeFileSync(output, "");
const results = steps.map((step, index) => {
  const script = join(scratch, `${index === 0 ? "detect" : "state"}.sh`);
  writeFileSync(script, step.run);
  return spawnSync("bash", [script], {
    cwd: ROOT,
    encoding: "utf8",
    env: {
      ...process.env,
      BEFORE_SHA: beforeSha,
      CURRENT_SHA: afterSha,
      GITHUB_OUTPUT: output,
    },
  });
});

console.log(
  `release-classify: ${before} (${beforeSha.slice(0, 8)}) → ${options.after} (${afterSha.slice(0, 8)})`,
);
for (const [index, result] of results.entries()) {
  if (result.stdout?.trim()) {
    const lines = result.stdout.trim().split("\n");
    console.log(`  ${index === 0 ? "detect" : "state"}:`);
    console.log(
      lines.length > 30
        ? `  …${lines.length} lines of step output, last 10:\n${lines
            .slice(-10)
            .map((l) => `  ${l}`)
            .join("\n")}`
        : lines.map((l) => `  ${l}`).join("\n"),
    );
  }
}
const failed = results.findIndex((result) => result.status !== 0);
if (failed !== -1) {
  const result = results[failed];
  console.error(
    `\nrelease-classify: the ${failed === 0 ? "detect" : "state"} step EXITED ${result.status}`,
  );
  if (result.stderr?.trim()) console.error(result.stderr.trim());
  console.error(
    "A non-zero exit here means the job would fail on `main` — fix the script, do not interpret the outputs below.",
  );
}

const outputs = Object.fromEntries(
  readFileSync(output, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("=")),
);

// An output the job never set is the dangerous case: `needs.changes.outputs.contracts == 'true'` is
// false for an unset value, so a script that aborted early silently RELAXES the receipt requirement
// instead of failing.
const KEYS = [
  "contracts",
  "contracts_scope",
  "unit",
  "smoke",
  "release_state",
  "release_required",
  "version_pr",
  "npm_publish",
];
const missing = KEYS.filter((key) => outputs[key] === undefined);

console.log("\noutputs");
for (const key of KEYS)
  console.log(`  ${key.padEnd(16)} ${outputs[key] ?? "(UNSET)"}`);

console.log("\nwhat the gate receipt must therefore contain");
for (const [key, lane] of [
  ["contracts", `behaviour contracts (${outputs.contracts_scope ?? "?"})`],
  ["unit", "browser unit suite + axe"],
  ["smoke", "cross-engine smoke (Chromium + WebKit + Firefox)"],
])
  console.log(
    `  ${key.padEnd(16)} ${outputs[key] === "true" ? `REQUIRED — ${lane}` : `not required for this change`}`,
  );
console.log(
  "  typecheck/lint   always required (and independently re-executed on the mini)",
);

console.log("\nwhat that means on a push to main");
console.log(
  `  receipt-guard    RUNS — rejects the push unless .gates/receipt.json covers this tree`,
);
console.log(`  release-state    ${outputs.release_state ?? "unknown"}`);
console.log(
  `  quality-gate     ${outputs.release_required === "true" ? "RUNS (free, self-hosted)" : "skipped (clean no-op)"}`,
);
console.log(
  `  version-pr       ${outputs.version_pr === "true" ? "RUNS — create/update only; MK merge approval remains separate" : "skipped"}`,
);
console.log(
  `  package-build    ${outputs.npm_publish === "true" ? "RUNS — hosted isolated exact-byte producer" : "skipped"}`,
);
console.log(
  `  publish          ${outputs.npm_publish === "true" ? "RUNS — hosted npm OIDC, no NPM_TOKEN" : "skipped"}`,
);

if (missing.length > 0 || failed !== -1) {
  console.error(
    `\nrelease-classify: FAIL — ${missing.length > 0 ? `unset output(s): ${missing.join(", ")}. ` : ""}` +
      "An unset output reads as false in an `if:`, so the gate it guards would be SKIPPED, not failed.",
  );
  process.exit(1);
}
console.log(
  "\nrelease-classify: the detect step ran clean and set every output.",
);
