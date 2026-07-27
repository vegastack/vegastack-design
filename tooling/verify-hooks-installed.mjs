#!/usr/bin/env node
// Prove the git hooks are actually wired, executable, and running the gate ladder.
//
// WHY THIS IS LOAD-BEARING
//   Under the local-first topology no CI runner executes a browser gate. The unit suite, the
//   cross-engine smoke, and the 864 behaviour contracts run in `.husky/pre-push` and nowhere else.
//   A tree where `core.hooksPath` is unset, or where a hook lost its executable bit, or where a hook
//   was quietly emptied, is a tree with NO browser verification at all — and it would look completely
//   normal. So "the hooks are installed" has to be a checked fact, not an assumption.
//
//   This runs inside `pnpm lint`, so a repository in that state fails the gate chain rather than
//   passing it silently.
//
// WHAT IT DELIBERATELY DOES NOT DO
//   Install anything. `"prepare": "husky"` does that on `pnpm install`. A verifier that fixed the
//   problem it detects would make the failure unobservable, which is the pattern this file exists to
//   prevent.
//
// HOW HUSKY 9 ACTUALLY WIRES THIS — read from `.husky/_/h`, not assumed
//   `core.hooksPath` points at `.husky/_`, a GENERATED and gitignored directory of shims. Each shim
//   sources `.husky/_/h`, which resolves the committed hook one level up and runs it with `sh -e`.
//   Three consequences shape the assertions below:
//
//     1. `[ ! -f "$s" ] && exit 0` — if the committed hook is missing, husky exits ZERO and says
//        nothing. A deleted `.husky/pre-push` is therefore a silently disabled gate, which is
//        precisely the failure this file has to catch.
//     2. The committed hook is run via `sh -e`, so it does NOT need an executable bit. The SHIM does,
//        because git executes that. Asserting the wrong one of those would be a false constraint.
//     3. `HUSKY=0` in the environment disables every hook, silently. Nothing here can prevent that,
//        which is another reason the receipt — not the hook — is the enforcement point.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { accessSync, constants, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { ROOT } from "./lib/change-set.mjs";

/** hook → the substring its body must contain, so an emptied or rewritten hook is caught. */
const REQUIRED_HOOKS = {
  "pre-commit": "tooling/gates.mjs commit",
  "commit-msg": "tooling/verify-commit-message.mjs",
  "pre-push": "tooling/gates.mjs push",
};

const HOOKS_DIR = ".husky";
const SHIM_DIR = ".husky/_";
let checks = 0;

// ── the hooks directory is the one git will actually use ─────────────────────────────────────────

const configured = spawnSync("git", ["config", "--get", "core.hooksPath"], {
  cwd: ROOT,
  encoding: "utf8",
});
const hooksPath = (configured.stdout ?? "").trim();

assert.notEqual(
  hooksPath,
  "",
  "`core.hooksPath` is unset, so git is using .git/hooks and NOTHING in .husky/ runs. " +
    "Run `pnpm install` (the `prepare` script wires husky) — do not hand-edit .git/hooks.",
);
assert.equal(
  hooksPath.replace(/\/$/, ""),
  SHIM_DIR,
  `\`core.hooksPath\` is ${hooksPath}, not ${SHIM_DIR} — husky 9 points git at its shim directory, ` +
    "so any other value means the committed hooks are not the ones git runs",
);
checks += 2;

// ── husky is a real dependency, not an assumption ────────────────────────────────────────────────

const rootManifest = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
);
assert.equal(
  rootManifest.scripts?.prepare,
  "husky",
  'the root package.json must keep `"prepare": "husky"`, or a fresh clone gets no hooks at all',
);
assert.ok(
  rootManifest.devDependencies?.husky,
  "husky must be a root devDependency for the prepare script to resolve",
);
checks += 2;

// ── each hook exists, is executable, and still calls the ladder ──────────────────────────────────

for (const [hook, required] of Object.entries(REQUIRED_HOOKS)) {
  const path = join(ROOT, HOOKS_DIR, hook);

  let stats;
  try {
    stats = statSync(path);
  } catch {
    assert.fail(
      `${HOOKS_DIR}/${hook} is missing. husky's dispatcher exits ZERO when the committed hook is ` +
        "absent, so this is a silently disabled gate — not a loud one. That lane runs nowhere else.",
    );
  }
  assert.ok(stats.isFile(), `${HOOKS_DIR}/${hook} is not a regular file`);

  // The SHIM is what git executes, so its executable bit is the one that matters. git skips a
  // non-executable hook without a word.
  const shim = join(ROOT, SHIM_DIR, hook);
  let shimStats;
  try {
    shimStats = statSync(shim);
  } catch {
    assert.fail(
      `${SHIM_DIR}/${hook} is missing, so git has no hook to run for \`${hook}\` at all. ` +
        "Run `pnpm install` to regenerate husky's shims.",
    );
  }
  try {
    accessSync(shim, constants.X_OK);
  } catch {
    assert.fail(
      `${SHIM_DIR}/${hook} is not executable (mode ${(shimStats.mode & 0o777).toString(8)}) — ` +
        "git silently skips a non-executable hook.",
    );
  }

  const body = readFileSync(path, "utf8");
  assert.ok(
    body.includes(required),
    `${HOOKS_DIR}/${hook} no longer invokes \`${required}\` — the hook exists but does not run the gate`,
  );
  // A hook consisting only of comments is executable, present, and does nothing.
  const executable = body
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));
  assert.ok(
    executable.length > 0,
    `${HOOKS_DIR}/${hook} contains no executable line — it is comments only`,
  );
  checks += 5;
}

// The shim directory is generated on install and must stay out of the tree; committing it would
// freeze one machine's husky version into the repository.
assert.ok(
  spawnSync("git", ["check-ignore", "-q", `${SHIM_DIR}/pre-push`], {
    cwd: ROOT,
  }).status === 0,
  `${SHIM_DIR} must be gitignored — it is generated by \`husky\` on install, not committed`,
);
checks++;

// ── the ladder the hooks call must exist and answer ──────────────────────────────────────────────

for (const script of [
  "tooling/gates.mjs",
  "tooling/contracts-run.mjs",
  "tooling/verify-commit-message.mjs",
  "tooling/verify-gate-receipt.mjs",
]) {
  const result = spawnSync("node", ["--check", join(ROOT, script)], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `${script} does not parse, so the hook that calls it would fail with a syntax error:\n${result.stderr}`,
  );
  checks++;
}

console.log(
  `✓ hooks-installed: ${checks} assertions — core.hooksPath is ${SHIM_DIR}, ` +
    `${Object.keys(REQUIRED_HOOKS).length} committed hooks present with executable shims, all calling ` +
    `the gate ladder`,
);
