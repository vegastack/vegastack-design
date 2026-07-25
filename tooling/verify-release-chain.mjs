#!/usr/bin/env node
// Exercise the ENTIRE release chain in one pass, before anything is pushed.
//
// WHY THIS EXISTS
//   On 2026-07-25/26 a release took SEVEN merge-and-watch cycles. Not because the bugs were subtle —
//   each was found the moment the chain actually ran — but because they were found SERIALLY. Fix,
//   push, merge, watch, discover the next link. Every cycle cost ~25 minutes.
//
//   A release is a chain: bump → version-sync → registry:build → verify-consume → classify → carry →
//   guard → publish. A defect anywhere fails all of it. This runs the whole chain against a simulated
//   bump in a THROWAWAY WORKTREE, so the discoveries happen together and locally.
//
//   Of the seven blockers, five would have surfaced in this single run:
//     · registry npm ranges not following the packages           (§1 of release-gotchas.md)
//     · the contract authority drifting from the manifest        (§2)
//     · a pure version bump demanding a browser lane             (§3)
//     · the receipt carry refusing, or being unverifiable        (§4, §5)
//     · version-sync reformatting what it rewrites               (§6)
//
// WHAT IT DOES NOT DO
//   Publish or push anything. It simulates the bump IN PLACE and restores the tree on every exit
//   path, refusing to start unless the tree is clean. `registry:verify-consume` is entirely offline —
//   every server it needs is a 127.0.0.1 sidecar.
//
// USAGE
//   node tooling/verify-release-chain.mjs            # simulate a minor bump
//   node tooling/verify-release-chain.mjs --patch    # simulate a patch bump

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ROOT, versionBumpOnly } from "./lib/change-set.mjs";

const bumpKind = process.argv.includes("--patch") ? "patch" : "minor";
const PUBLIC_PACKAGES = ["design", "design-tokens"];

/**
 * Runs IN PLACE, not in a worktree. A detached worktree cannot run pnpm here: with node_modules
 * symlinked, pnpm tries to purge the modules directory and aborts without a TTY, and installing again
 * per run is minutes. In-place is also the more faithful environment — it is the one a release
 * actually happens in.
 *
 * The safety is a hard precondition plus a guaranteed restore: this refuses to start on a dirty tree,
 * and every exit path runs `git checkout -- . && git clean -fd`, which restores tracked files and
 * removes new ones while leaving ignored paths (node_modules, .gates) alone.
 */
const git = (args) =>
  spawnSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });

const dirty = git(["status", "--porcelain"]).stdout.trim();
if (dirty) {
  console.error(
    "verify-release-chain: refusing to run on a dirty tree — it simulates a version bump in place\n" +
      "and restores by discarding changes, which would take your work with it. Commit or stash first.\n\n" +
      dirty.split("\n").slice(0, 10).join("\n"),
  );
  process.exit(2);
}

const baseCommit = git(["rev-parse", "HEAD"]).stdout.trim();

let restored = false;
const cleanup = () => {
  if (restored) return;
  restored = true;
  // reset --hard is safe HERE and only here: the tree was verified clean at start and baseCommit
  // was HEAD at that moment, so this restores exactly what was there — including undoing the
  // simulated Version Packages commit made below.
  git(["reset", "--hard", baseCommit, "--quiet"]);
  git(["clean", "-fd", "--quiet"]);
};
process.on("exit", cleanup);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    cleanup();
    process.exit(2);
  });

const run = (command, args, options = {}) =>
  spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    ...options,
  });

const step = (label) => process.stdout.write(`▸ ${label}… `);
const ok = (detail = "") => console.log(`ok${detail ? ` — ${detail}` : ""}`);

function bumpVersion(version, kind) {
  const [major, minor, patch] = version.split(".").map(Number);
  return kind === "patch"
    ? `${major}.${minor}.${patch + 1}`
    : `${major}.${minor + 1}.0`;
}

const baseCommit = git(["rev-parse", "HEAD"]).stdout.trim();
console.log(
  `▸ simulating against ${baseCommit.slice(0, 8)} (restored on exit)`,
);

// ── simulate the bump `changeset version` would perform ──────────────────────────────────────────

step(`simulating a ${bumpKind} bump`);
const bumped = {};
for (const directory of [...PUBLIC_PACKAGES, "ui"]) {
  const path = join(ROOT, `packages/${directory}/package.json`);
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  manifest.version = bumpVersion(manifest.version, bumpKind);
  bumped[directory] = manifest.version;
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
}
ok(
  Object.entries(bumped)
    .map(([name, version]) => `${name}@${version}`)
    .join(" "),
);

// ── the chain ────────────────────────────────────────────────────────────────────────────────────

step("version-sync (ranges, meta.version, registry rebuild)");
const sync = run("node", [join(ROOT, "tooling/version-sync.mjs")]);
assert.equal(
  sync.status,
  0,
  `version-sync failed — the release cannot proceed:\n${sync.stdout}\n${sync.stderr}`,
);
ok(
  (/(\d+) npm dependency range/.exec(sync.stdout)?.[1] ?? "0") +
    " ranges rewritten",
);

// §6 — it must not reformat what it rewrites.
step("version-sync left the manifest prettier-clean (§6)");
const formatted = run("pnpm", [
  "exec",
  "prettier",
  "--check",
  "packages/ui/registry.json",
]);
assert.equal(
  formatted.status,
  0,
  "version-sync reformatted packages/ui/registry.json — ~20KB of churn will land in the release diff\n" +
    "  See release-gotchas.md §6. Hand the file back to prettier after rewriting it.",
);
ok();

// §1 — the ranges must now name the versions actually being published.
step("registry ranges follow the published packages (§1)");
{
  const registry = JSON.parse(
    readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8"),
  );
  const declared = new Set();
  for (const item of registry.items ?? [])
    for (const dependency of item.dependencies ?? [])
      if (dependency.startsWith("@vegastack/")) declared.add(dependency);
  for (const directory of PUBLIC_PACKAGES) {
    const name = JSON.parse(
      readFileSync(join(ROOT, `packages/${directory}/package.json`), "utf8"),
    ).name;
    const expected = `${name}@^${bumped[directory]}`;
    const stale = [...declared].filter(
      (entry) => entry.startsWith(`${name}@`) && entry !== expected,
    );
    assert.deepEqual(
      stale,
      [],
      `registry items still declare ${stale.join(", ")} after bumping to ${bumped[directory]}.\n` +
        "  Shipping this makes every `shadcn add` install the PREVIOUS runtime, and npm versions are\n" +
        "  immutable. See release-gotchas.md §1.",
    );
  }
}
ok();

// §2 — and the machine authority must agree, or verify-component-contracts fails with 96 problems.
step("the contract authority agrees with the manifest (§2)");
const derived = run("pnpm", ["design:derived"]);
assert.equal(
  derived.status,
  0,
  `design:derived failed:\n${derived.stdout}${derived.stderr}`,
);
const contracts = run("node", [
  join(ROOT, "tooling/verify-component-contracts.mjs"),
]);
assert.equal(
  contracts.status,
  0,
  "verify-component-contracts rejects the bumped tree — the two authorities drifted.\n" +
    "  version-sync must rewrite BOTH registry.json and component-contracts.json.\n" +
    `  See release-gotchas.md §2.\n${String(contracts.stdout).split("\n").slice(0, 6).join("\n")}`,
);
ok();

// §3 — a pure version bump must require no browser lane.
step("a pure version bump requires no gate (§3)");
{
  run("git", ["add", "-A"]);
  const commit = run("git", [
    "-c",
    "user.name=release-chain",
    "-c",
    "user.email=release-chain@local",
    "commit",
    "-m",
    "Version Packages (simulated)",
    "--no-verify",
  ]);
  assert.equal(
    commit.status,
    0,
    `could not commit the simulated bump:\n${commit.stderr}`,
  );
  const head = run("git", ["rev-parse", "HEAD"]).stdout.trim();

  const proof = versionBumpOnly(baseCommit, head);
  assert.equal(
    proof.ok,
    true,
    `the bump is not recognised as pure version churn — the receipt carry will REFUSE it.\n` +
      `  ${proof.offenders.length} offender(s), e.g. ${proof.offenders[0]?.file}: ` +
      `${String(proof.offenders[0]?.line).slice(0, 120)}\n  See release-gotchas.md §4.`,
  );

  const classified = JSON.parse(
    run("node", [
      join(ROOT, "tooling/classify-change.mjs"),
      "--before",
      baseCommit,
      "--after",
      head,
      "--json",
    ]).stdout,
  );
  assert.equal(
    classified.pureVersionBump,
    true,
    "the classifier does not recognise the bump",
  );
  for (const lane of ["contracts", "unit", "smoke"])
    assert.equal(
      classified[lane],
      false,
      `a pure version bump must not require the ${lane} lane — the carried receipt records it as\n` +
        "  skipped, so the publish path could never open. See release-gotchas.md §3.",
    );
  assert.equal(
    classified.has_changesets,
    false,
    "has_changesets must be read from the classified ref, not the working tree (§7)",
  );
}
ok();

// §4/§5 — the consume round-trip is the gate that catches a broken release for real consumers.
step(
  "shadcn consume round-trip against the bumped registry (§1, the real proof)",
);
const consume = run("pnpm", ["registry:verify-consume"]);
assert.equal(
  consume.status,
  0,
  "registry:verify-consume FAILS on the bumped tree — this is exactly what blocks `quality-gate`\n" +
    "  during a release, and it is the gate that catches an unusable published registry.\n" +
    String(consume.stdout).split("\n").slice(-14).join("\n"),
);
ok(/(\d+)\/\1 graphs/.exec(consume.stdout)?.[0] ?? "");

cleanup();
console.log(
  `\n✓ release-chain: a simulated ${bumpKind} bump survives version-sync, both authorities, the ` +
    `classifier, the carry proof, and a full consume round-trip.\n` +
    `  Gotchas and their run ids: skills/internal/ship/references/release-gotchas.md`,
);
