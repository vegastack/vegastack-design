#!/usr/bin/env node
// Prove the change classifier, in both directions, against real history.
//
// WHY THIS EXISTS
//   The provenance subtraction it guards has already shipped wrong twice, both times as workflow
//   shell, and both times in a way reading could not catch (docs/ledger/operator-review.md,
//   2026-07-25):
//
//     - in the dated 2026-07-25 incident, reporting a rendered-surface change for a pure version
//       bump, so the then-768-check gate re-ran over 1082 files whose only diff was a re-stamped
//       provenance comment;
//     - then, after the fix, referencing an unbound variable inside `$( … || true )` so it reported
//       NO change for a real component edit and exited 0 — a fail-open with a green log.
//
//   Synthetic assertions alone would not have caught either. So this verifier asserts against actual
//   commits in this repository's history: a real Version Packages commit must require no contract
//   lane, and a real component change must require one.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, relative, resolve } from "node:path";

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
// The current public-boundary release's Version Packages commit. Keeping a second generation catches
// newly-added generated surfaces that the older fixture could not contain.
const CURRENT_VERSION_BUMP = "9553498";
// A real component change: 629 registry files reconciled.
const COMPONENT_CHANGE = "6c60d532745e411ca9c50d7039e50da5f368139a";

for (const [sha, label] of [
  [VERSION_BUMP, "the Version Packages commit"],
  [CURRENT_VERSION_BUMP, "the current Version Packages commit"],
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
  const bump = versionBumpOnly(
    `${CURRENT_VERSION_BUMP}~1`,
    CURRENT_VERSION_BUMP,
  );
  assert.equal(
    bump.ok,
    true,
    `the current Version Packages commit must remain valid version churn; first offender: ${bump.offenders[0]?.file} ${bump.offenders[0]?.line}`,
  );
  assert.ok(bump.files > 1_000, "the current fixture must exercise scale");
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

// ── working-tree mutation matrix ─────────────────────────────────────────────────────────────────
//
// Version PR carry is also produced before the bumped tree is committed. That path includes
// untracked files in its changed-file inventory, while `git diff` has no record for them. Exercise
// the real predicate in isolated repositories so a fixture can never alter this worktree.

function gitIn(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function commitStagedFixtureDelta(root, message) {
  try {
    gitIn(root, ["diff", "--cached", "--quiet", "--exit-code"]);
    return false;
  } catch (error) {
    if (error?.status !== 1) throw error;
  }
  gitIn(root, ["commit", "--quiet", "-m", message]);
  return true;
}

function copyCurrentModuleClosure(root, entryPaths) {
  const queue = [...entryPaths];
  const copied = new Set();
  while (queue.length > 0) {
    const repoPath = queue.shift();
    if (copied.has(repoPath)) continue;
    const sourcePath = join(ROOT, repoPath);
    assert.equal(
      existsSync(sourcePath),
      true,
      `classifier fixture dependency is missing from the source tree: ${repoPath}`,
    );
    const targetPath = join(root, repoPath);
    mkdirSync(dirname(targetPath), { recursive: true });
    cpSync(sourcePath, targetPath);
    copied.add(repoPath);
    const source = readFileSync(sourcePath, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*\()\s*["'](\.[^"']+)["']/g,
    )) {
      let dependency = resolve(dirname(sourcePath), match[1]);
      if (!extname(dependency) && existsSync(`${dependency}.mjs`))
        dependency = `${dependency}.mjs`;
      const dependencyPath = relative(ROOT, dependency).replaceAll("\\", "/");
      if (dependencyPath.startsWith("tooling/") && existsSync(dependency))
        queue.push(dependencyPath);
    }
  }
  // A future relative import cannot silently use the clone's older module: every source-relative
  // tooling edge discovered above must resolve to the copied current bytes.
  for (const repoPath of copied)
    assert.deepEqual(
      readFileSync(join(root, repoPath)),
      readFileSync(join(ROOT, repoPath)),
      `classifier fixture dependency drifted: ${repoPath}`,
    );
  return [...copied].sort();
}

function mutationRepository() {
  const root = mkdtempSync(join(tmpdir(), "version-bump-mutation-"));
  mkdirSync(join(root, "tooling/lib"), { recursive: true });
  mkdirSync(join(root, "packages/design"), { recursive: true });
  mkdirSync(join(root, "packages/ui"), { recursive: true });
  mkdirSync(join(root, "packages/ui/registry/ui"), { recursive: true });
  mkdirSync(join(root, "fixtures"), { recursive: true });
  cpSync(
    join(ROOT, "tooling/lib/change-set.mjs"),
    join(root, "tooling/lib/change-set.mjs"),
  );
  writeFileSync(
    join(root, "packages/design/package.json"),
    JSON.stringify({ name: "@vegastack/design", version: "1.0.0" }, null, 2) +
      "\n",
  );
  writeFileSync(
    join(root, "packages/ui/registry/ui/button.tsx"),
    "// @vegastack button@1.0.0 sha256-before\nexport const Button = true;\n",
  );
  writeFileSync(
    join(root, "packages/ui/smoke-impact.generated.json"),
    '{"contractSha256":"before"}\n',
  );
  writeFileSync(join(root, "fixtures/text.txt"), "before\n");
  writeFileSync(join(root, "fixtures/binary.bin"), Buffer.from([0, 1, 2, 3]));
  writeFileSync(join(root, "fixtures/executable.sh"), "#!/bin/sh\nexit 0\n");
  chmodSync(join(root, "fixtures/executable.sh"), 0o644);
  symlinkSync("text.txt", join(root, "fixtures/link"));
  gitIn(root, ["init", "--quiet"]);
  gitIn(root, ["config", "user.name", "classifier fixture"]);
  gitIn(root, ["config", "user.email", "classifier@example.invalid"]);
  gitIn(root, ["add", "-A"]);
  gitIn(root, ["commit", "--quiet", "-m", "fixture base"]);
  return root;
}

// `ci.yml` deliberately runs receipt-guard before `pnpm install`. Keep this executable instead of
// trusting the workflow comment: every module reachable from classify-change must load in a clean
// clone with no node_modules, even for an empty range. A top-level parser import otherwise turns the
// fail-closed receipt check into an infrastructure failure before it can inspect the receipt.
{
  const scratch = mkdtempSync(join(tmpdir(), "classifier-preinstall-"));
  const root = join(scratch, "repo");
  try {
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", ROOT, root], {
      encoding: "utf8",
    });
    copyCurrentModuleClosure(root, ["tooling/classify-change.mjs"]);
    assert.equal(
      existsSync(join(root, "node_modules")),
      false,
      "the pre-install classifier fixture must not inherit node_modules",
    );
    const result = JSON.parse(
      execFileSync(
        "node",
        [
          "tooling/classify-change.mjs",
          "--before",
          "HEAD",
          "--after",
          "HEAD",
          "--json",
        ],
        { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      ),
    );
    assert.equal(result.changedFiles, 0);
    writeFileSync(
      join(root, "packages/ui/registry/ui/button.tsx"),
      `${readFileSync(join(root, "packages/ui/registry/ui/button.tsx"), "utf8")}\n// pre-install mutation\n`,
    );
    const changed = JSON.parse(
      execFileSync(
        "node",
        ["tooling/classify-change.mjs", "--before", "HEAD", "--json"],
        { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      ),
    );
    assert.equal(
      changed.smoke,
      true,
      "a pre-install registry mutation with a stale dependency shadow must widen smoke coverage",
    );
    assert.equal(changed.smoke_scope, "all");
    checks += 4;
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function workingTreeVersionResult(mutate) {
  const root = mutationRepository();
  try {
    mutate(root);
    const module = new URL(`file://${join(root, "tooling/lib/change-set.mjs")}`)
      .href;
    const stdout = execFileSync(
      "node",
      [
        "--input-type=module",
        "--eval",
        `import { versionBumpOnly } from ${JSON.stringify(module)}; console.log(JSON.stringify(versionBumpOnly("HEAD")));`,
      ],
      { cwd: root, encoding: "utf8" },
    );
    return JSON.parse(stdout);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function classifyModeMutation({ committed }) {
  const scratch = mkdtempSync(join(tmpdir(), "classifier-mode-mutation-"));
  const root = join(scratch, "repo");
  try {
    execFileSync("git", ["clone", "--quiet", "--no-hardlinks", ROOT, root], {
      encoding: "utf8",
    });
    const copied = copyCurrentModuleClosure(root, [
      "tooling/classify-change.mjs",
    ]);
    if (!existsSync(join(root, "node_modules")))
      symlinkSync(join(ROOT, "node_modules"), join(root, "node_modules"));
    gitIn(root, ["config", "user.name", "classifier fixture"]);
    gitIn(root, ["config", "user.email", "classifier@example.invalid"]);
    gitIn(root, ["add", ...copied]);
    commitStagedFixtureDelta(root, "current classifier harness");
    chmodSync(join(root, "packages/ui/registry/ui/button.tsx"), 0o755);
    const args = ["tooling/classify-change.mjs", "--before", "HEAD"];
    if (committed) {
      gitIn(root, ["add", "packages/ui/registry/ui/button.tsx"]);
      gitIn(root, ["commit", "--quiet", "-m", "mode mutation"]);
      args.splice(2, 1, "HEAD~1");
      args.push("--after", "HEAD");
    }
    args.push("--json");
    return JSON.parse(
      execFileSync("node", args, { cwd: root, encoding: "utf8" }),
    );
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

{
  const root = mutationRepository();
  try {
    const unchangedHead = gitIn(root, ["rev-parse", "HEAD"]).trim();
    gitIn(root, ["add", "tooling/lib/change-set.mjs"]);
    assert.equal(
      commitStagedFixtureDelta(root, "must not be created"),
      false,
      "an already-current classifier harness must not require an empty commit",
    );
    assert.equal(
      gitIn(root, ["rev-parse", "HEAD"]).trim(),
      unchangedHead,
      "the no-delta fixture path must preserve HEAD",
    );
    writeFileSync(join(root, "fixtures/text.txt"), "after\n");
    gitIn(root, ["add", "fixtures/text.txt"]);
    assert.equal(
      commitStagedFixtureDelta(root, "real fixture delta"),
      true,
      "a real staged classifier fixture delta must be committed",
    );
    assert.notEqual(
      gitIn(root, ["rev-parse", "HEAD"]).trim(),
      unchangedHead,
      "the real-delta fixture path must advance HEAD",
    );
    checks += 4;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

for (const committed of [false, true]) {
  const result = classifyModeMutation({ committed });
  assert.equal(
    result.contracts,
    true,
    `${committed ? "commit-range" : "working-tree"} mode-only component change must require contracts`,
  );
  assert.equal(
    result.unit,
    true,
    "mode-only component change must require unit",
  );
  assert.equal(
    result.smoke,
    true,
    "mode-only component change must require smoke",
  );
  assert.equal(
    result.contracts_scope,
    "all",
    "mode-only component change must widen to the complete contract universe",
  );
  assert.equal(
    result.provenanceOnlyFiles,
    0,
    "mode-only component change must not be reported as provenance-only",
  );
  checks += 5;
}

for (const [label, mutate] of [
  [
    "an untracked component source",
    (root) =>
      writeFileSync(
        join(root, "packages/ui/registry/ui/new-component.tsx"),
        "export const NewComponent = true;\n",
      ),
  ],
  [
    "an untracked test",
    (root) =>
      writeFileSync(
        join(root, "packages/ui/registry/ui/button.test.tsx"),
        "throw new Error('untracked test');\n",
      ),
  ],
  [
    "an untracked binary",
    (root) =>
      writeFileSync(
        join(root, "fixtures/untracked.bin"),
        Buffer.from([0, 255]),
      ),
  ],
  [
    "an untracked symlink",
    (root) => symlinkSync("text.txt", join(root, "fixtures/untracked-link")),
  ],
  [
    "an untracked generated registry output",
    (root) => {
      mkdirSync(join(root, "apps/docs/public/r"), { recursive: true });
      writeFileSync(join(root, "apps/docs/public/r/untracked.json"), "{}\n");
    },
  ],
  [
    "an untracked unknown path",
    (root) => writeFileSync(join(root, "unknown.txt"), "unknown\n"),
  ],
  ["a deletion", (root) => unlinkSync(join(root, "fixtures/text.txt"))],
  [
    "a rename",
    (root) =>
      renameSync(
        join(root, "fixtures/text.txt"),
        join(root, "fixtures/renamed.txt"),
      ),
  ],
  [
    "a file-mode change",
    (root) => chmodSync(join(root, "fixtures/executable.sh"), 0o755),
  ],
  [
    "a binary content change",
    (root) =>
      writeFileSync(
        join(root, "fixtures/binary.bin"),
        Buffer.from([0, 1, 9, 3]),
      ),
  ],
  [
    "a symlink-target change",
    (root) => {
      unlinkSync(join(root, "fixtures/link"));
      symlinkSync("binary.bin", join(root, "fixtures/link"));
    },
  ],
  [
    "a version change mixed with an untracked file",
    (root) => {
      writeFileSync(
        join(root, "packages/design/package.json"),
        JSON.stringify(
          { name: "@vegastack/design", version: "1.0.1" },
          null,
          2,
        ) + "\n",
      );
      writeFileSync(join(root, "unknown.txt"), "must not ride along\n");
    },
  ],
  [
    "a generated smoke manifest change without a package version bump",
    (root) =>
      writeFileSync(
        join(root, "packages/ui/smoke-impact.generated.json"),
        '{"contractSha256":"after"}\n',
      ),
  ],
  [
    "a provenance restamp without a package version bump",
    (root) =>
      writeFileSync(
        join(root, "packages/ui/registry/ui/button.tsx"),
        "// @vegastack button@1.0.1 sha256-after\nexport const Button = true;\n",
      ),
  ],
]) {
  const result = workingTreeVersionResult(mutate);
  assert.equal(
    result.ok,
    false,
    `${label} must NOT be accepted as pure version churn`,
  );
  assert.ok(
    result.offenders.length > 0,
    `${label} must name a diagnostic offender`,
  );
  checks += 2;
}

for (const [label, mutate] of [
  [
    "a package version field only",
    (root) =>
      writeFileSync(
        join(root, "packages/design/package.json"),
        JSON.stringify(
          { name: "@vegastack/design", version: "1.0.1" },
          null,
          2,
        ) + "\n",
      ),
  ],
  [
    "a package version plus independently generated smoke manifest",
    (root) => {
      writeFileSync(
        join(root, "packages/design/package.json"),
        JSON.stringify(
          { name: "@vegastack/design", version: "1.0.1" },
          null,
          2,
        ) + "\n",
      );
      writeFileSync(
        join(root, "packages/ui/smoke-impact.generated.json"),
        '{"contractSha256":"after"}\n',
      );
    },
  ],
]) {
  const result = workingTreeVersionResult(mutate);
  assert.equal(result.ok, true, `${label} must remain valid version churn`);
  assert.deepEqual(result.offenders, [], `${label} must have no offender`);
  checks += 2;
}

// ── no output may ever be unset ──────────────────────────────────────────────────────────────────

// An output the workflow never set reads as false in an `if:`, so the gate it guards is SKIPPED
// rather than failed. That is the precise shape of the 2026-07-25 fail-open.
const REQUIRED_OUTPUTS = ["contracts", "contracts_scope", "unit", "smoke"];
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
