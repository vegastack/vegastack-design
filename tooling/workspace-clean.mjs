#!/usr/bin/env node
// Reclaim local scratch that the verification loop produces, and nothing else.
//
// WHY THIS EXISTS
//   Measured 2026-09-08 on the development Mac: `.turbo` 5.3 GB, `.next`/`out`/`test-results`/
//   `.vrt-review` 2.1 GB, stale Playwright browser builds ~0.5 GB, 22 agent worktrees at 54 GB.
//   None of it is tracked, all of it regenerates, and every byte of it accumulated because no step
//   of the loop ever removed anything. `pnpm verify` now calls `--after-run` unconditionally (pass
//   or fail), so a failed run leaves a clean tree instead of a directory of Playwright artifacts
//   that the next `git status --porcelain` check has to be taught to ignore.
//
// THE SAFETY RULE, AND IT IS ABSOLUTE
//   This script never removes `node_modules`, the pnpm store, anything under `.git`, or any file
//   git tracks. Those are the four things whose loss costs real time or real work. Every removal
//   below is a path this repository's own tooling wrote, and `assertRemovable()` re-checks each one
//   against that rule immediately before deleting it rather than trusting the list above it.
//
// MODES
//   --dry-run   (default) print what would be removed, and the bytes, and remove nothing.
//   --after-run remove the per-run test artifacts. Called by `pnpm verify` in a `finally`.
//   --weekly    additionally prune stale turbo cache, merged agent worktrees, and Playwright
//               browser builds that do not match the pinned version.
//
// Exit codes: 0 on success (including "nothing to do"). Non-zero only if a removal that was
// attempted actually failed — a refusal (a dirty worktree) is reported and is NOT a failure, because
// the operator has to decide what to do with the work in it.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));

/**
 * Repository root. Resolved from this file rather than `process.cwd()` so the script behaves the
 * same from a package directory — but overridable with `--root`, which is what the test fixture
 * uses to point it at a throwaway tree instead of this one.
 */
function parseArgs(argv) {
  const args = {
    mode: "dry-run",
    root: resolve(SELF_DIR, ".."),
    quiet: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--after-run") args.mode = "after-run";
    else if (arg === "--weekly") args.mode = "weekly";
    else if (arg === "--dry-run") args.mode = "dry-run";
    else if (arg === "--quiet") args.quiet = true;
    else if (arg === "--root") args.root = resolve(argv[++index]);
    else if (arg.startsWith("--root=")) args.root = resolve(arg.slice(7));
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`workspace-clean: unknown argument ${arg}`);
  }
  return args;
}

const USAGE = `Usage: node tooling/workspace-clean.mjs [--dry-run|--after-run|--weekly] [--root <dir>] [--quiet]

  --dry-run    (default) report what would be removed; remove nothing
  --after-run  remove per-run test artifacts (called by \`pnpm verify\`)
  --weekly     also prune stale turbo cache, merged agent worktrees, and stale Playwright browsers
`;

// ------------------------------------------------------------------ what may ever be removed
//
// Per-run artifacts. Every one of these is written by a test runner during a single `pnpm verify`
// and is meaningless afterwards. Globs are deliberately absent for all but `.vitest-attachments`,
// which vitest writes wherever the failing test lived.
const AFTER_RUN_PATHS = [
  "apps/docs/test-results",
  "apps/docs/playwright-report",
  "packages/ui/.vitest",
  "packages/ui/test/__screenshots__",
];
/** Directory name that may appear anywhere in the tree (vitest browser-mode attachments). */
const AFTER_RUN_ANYWHERE = [".vitest-attachments"];

/** Directories never descended into when hunting for `AFTER_RUN_ANYWHERE`. */
const NEVER_DESCEND = new Set([
  "node_modules",
  ".git",
  ".turbo",
  ".next",
  "out",
  "dist",
  ".source",
]);

/** Never removable, whatever any list says. The last line of defence, checked per path. */
const FORBIDDEN_SEGMENTS = new Set(["node_modules", ".git"]);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// ------------------------------------------------------------------ helpers

function bytes(count) {
  if (count < 1024) return `${count} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = count / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/** Recursive apparent size. Symlinks are counted as themselves and never followed. */
function sizeOf(path) {
  let total = 0;
  let stat;
  try {
    stat = lstatSync(path);
  } catch {
    return 0;
  }
  if (stat.isSymbolicLink()) return stat.size;
  if (!stat.isDirectory()) return stat.size;
  let entries;
  try {
    entries = readdirSync(path, { withFileTypes: true });
  } catch {
    return total;
  }
  for (const entry of entries) total += sizeOf(join(path, entry.name));
  return total;
}

/**
 * Reject anything outside the root, anything under `node_modules`/`.git`, and the root itself.
 *
 * Checked per path immediately before removal — not once over the list — because the lists above
 * are edited by humans and a `--weekly` discovery pass builds its list at runtime.
 */
function assertRemovable(root, path) {
  const absolute = resolve(path);
  const rel = relative(root, absolute);
  // `startsWith(root + sep)` and not `relative()` alone: on a different drive `relative()` returns an
  // ABSOLUTE path with no leading `..`, which a `..`-only test would read as "inside the root".
  if (rel === "" || rel.startsWith("..") || !absolute.startsWith(root + sep))
    throw new Error(
      `workspace-clean: refusing to remove ${absolute} — outside the repository root ${root}`,
    );
  for (const segment of rel.split(sep)) {
    if (FORBIDDEN_SEGMENTS.has(segment))
      throw new Error(
        `workspace-clean: refusing to remove ${absolute} — it is inside a ${segment} directory`,
      );
  }
}

function git(root, args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** Tracked files never get removed. A path git knows about is a bug in the list, not scratch. */
function isTracked(root, path) {
  const rel = relative(root, resolve(path));
  try {
    const out = execFileSync(
      "git",
      ["ls-files", "--error-unmatch", "--", rel],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

/** Every directory named one of `names`, excluding `NEVER_DESCEND` subtrees. */
function findAnywhere(root, names, directory = root, found = []) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    if (names.includes(entry.name)) {
      found.push(join(directory, entry.name));
      continue; // do not descend into a directory already scheduled for removal
    }
    if (NEVER_DESCEND.has(entry.name)) continue;
    findAnywhere(root, names, join(directory, entry.name), found);
  }
  return found;
}

// ------------------------------------------------------------------ the modes

/** Per-run test artifacts. */
function collectAfterRun(root) {
  const targets = [];
  for (const rel of AFTER_RUN_PATHS) {
    const path = join(root, rel);
    if (existsSync(path)) targets.push(path);
  }
  targets.push(...findAnywhere(root, AFTER_RUN_ANYWHERE));
  return targets;
}

/** Turbo cache entries whose mtime is older than seven days. */
function collectStaleTurboCache(root, now = Date.now()) {
  const cache = join(root, ".turbo", "cache");
  if (!existsSync(cache)) return [];
  const targets = [];
  for (const entry of readdirSync(cache, { withFileTypes: true })) {
    const path = join(cache, entry.name);
    let stat;
    try {
      stat = statSync(path);
    } catch {
      continue;
    }
    if (now - stat.mtimeMs > SEVEN_DAYS_MS) targets.push(path);
  }
  return targets;
}

/**
 * Agent worktrees under `.claude/worktrees/` that are BOTH clean and whose branch is already merged
 * into `origin/main`.
 *
 * A dirty worktree is listed and refused — never removed, never silently skipped. Losing an agent's
 * uncommitted work to a cleanup script is the one failure mode this whole file exists to avoid, and
 * "it looked merged" is not a reason to delete a tree with changes in it.
 */
function collectMergedWorktrees(root) {
  const parent = join(root, ".claude", "worktrees");
  const removable = [];
  const refused = [];
  if (!existsSync(parent)) return { removable, refused };

  let mergedBranches = new Set();
  try {
    mergedBranches = new Set(
      git(root, [
        "branch",
        "--format=%(refname:short)",
        "--merged",
        "origin/main",
      ])
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
  } catch (error) {
    refused.push({
      path: parent,
      reason: `cannot resolve origin/main (${String(error.message).split("\n")[0]}) — no worktree is safe to judge merged`,
    });
    return { removable, refused };
  }

  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const path = join(parent, entry.name);
    let branch;
    let status;
    try {
      branch = git(path, ["rev-parse", "--abbrev-ref", "HEAD"]);
      status = git(path, ["status", "--porcelain"]);
    } catch (error) {
      refused.push({
        path,
        reason: `not a readable git worktree (${String(error.message).split("\n")[0]})`,
      });
      continue;
    }
    if (status.length > 0) {
      refused.push({
        path,
        reason: `DIRTY — ${status.split("\n").length} uncommitted change(s) on ${branch}`,
      });
      continue;
    }
    if (!mergedBranches.has(branch)) {
      refused.push({
        path,
        reason: `branch ${branch} is not merged into origin/main`,
      });
      continue;
    }
    removable.push(path);
  }
  return { removable, refused };
}

/**
 * Playwright browser builds under the user cache whose version does not match the pinned
 * `playwright` in `pnpm-lock.yaml`.
 *
 * `npx playwright uninstall` removes the CURRENT version's browsers, which is the opposite of what
 * is wanted — so this identifies the stale directories itself. The pinned version's directories are
 * never touched, and neither is anything whose name does not parse as a Playwright browser build.
 */
function pinnedPlaywrightVersion(root) {
  const lock = readFileSync(join(root, "pnpm-lock.yaml"), "utf8");
  const versions = [
    ...new Set(
      [...lock.matchAll(/^ {2}playwright@([^\s:]+):$/gm)].map((m) => m[1]),
    ),
  ];
  if (versions.length !== 1)
    throw new Error(
      `workspace-clean: pnpm-lock.yaml resolves ${versions.length} playwright versions (${versions.join(", ") || "none"}); ` +
        "refusing to guess which browser builds are stale",
    );
  return versions[0];
}

/** `chromium_headless_shell` and `chromium-headless-shell` are the same build. */
function normalizeBuildName(name) {
  return name.replaceAll("_", "-");
}

function playwrightCacheDir() {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH)
    return process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (process.platform === "darwin")
    return join(homedir(), "Library", "Caches", "ms-playwright");
  if (process.platform === "win32")
    return join(homedir(), "AppData", "Local", "ms-playwright");
  return join(homedir(), ".cache", "ms-playwright");
}

/**
 * Browser builds installed for a Playwright revision other than the pinned one.
 *
 * Playwright names these `<browser>-<revision>` (e.g. `chromium-1234`), and the revision is NOT the
 * Playwright version — so a name cannot be matched against `pinnedVersion` directly. The mapping
 * lives in the installed `playwright-core`'s `browsers.json`; when it cannot be read, NOTHING is
 * removed and the reason is printed. Guessing here would delete the browsers the suite needs.
 */
function collectStalePlaywrightBrowsers(root) {
  const cache = playwrightCacheDir();
  const result = { targets: [], note: null, cache };
  if (!existsSync(cache)) {
    result.note = `no Playwright browser cache at ${cache}`;
    return result;
  }
  let current;
  try {
    // Resolved through `playwright`, in TWO hops, and neither is optional. pnpm's strict store puts
    // `playwright-core` under `node_modules/.pnpm/…`, reachable only from `playwright` itself, which
    // in turn is a devDependency of `@vegastack/ui` and not of the workspace root. A root-relative
    // path join — or a single hop from the root — reports ENOENT forever, which reads exactly like
    // "there is nothing stale" while removing nothing.
    const fromUi = createRequire(join(root, "packages/ui/package.json"));
    const fromPlaywright = createRequire(fromUi.resolve("playwright"));
    // `.resolve("playwright-core/browsers.json")` is rejected: the package's `exports` map does not
    // declare that subpath. Resolve the package ENTRY (which it does declare) and walk up from it to
    // the directory holding `browsers.json` — how deep the entry sits inside the package is an
    // implementation detail that has moved between Playwright releases.
    let directory = dirname(fromPlaywright.resolve("playwright-core"));
    let registryPath = null;
    for (let hop = 0; hop < 5 && registryPath === null; hop += 1) {
      const candidate = join(directory, "browsers.json");
      if (existsSync(candidate)) registryPath = candidate;
      else directory = dirname(directory);
    }
    if (registryPath === null)
      throw new Error(
        "browsers.json not found above the resolved playwright-core entry",
      );
    const registry = JSON.parse(readFileSync(registryPath, "utf8"));
    // NORMALISED, and this is load-bearing. `browsers.json` names the headless shell
    // `chromium-headless-shell`, but the directory Playwright installs is
    // `chromium_headless_shell-1228` — an EXACT name comparison therefore reported the browser the
    // suite is currently using as stale, and `--weekly` would have deleted it. Sidecars (ffmpeg,
    // winldd) are listed in the same array and are matched the same way.
    current = new Set(
      registry.browsers.map(
        (browser) => `${normalizeBuildName(browser.name)}-${browser.revision}`,
      ),
    );
  } catch (error) {
    result.note =
      `cannot read node_modules/playwright-core/browsers.json (${String(error.message).split("\n")[0]}) — ` +
      "refusing to guess which browser builds belong to the pinned version";
    return result;
  }
  for (const entry of readdirSync(cache, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (!/^[a-z_]+(?:-[a-z_]+)*-\d+$/.test(entry.name)) continue; // not a browser build
    if (current.has(normalizeBuildName(entry.name))) continue;
    result.targets.push(join(cache, entry.name));
  }
  result.note = `pinned playwright ${pinnedPlaywrightVersion(root)}; ${current.size} current build(s)`;
  return result;
}

// ------------------------------------------------------------------ main

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  const { root, mode } = args;
  const log = (line) => {
    if (!args.quiet) console.log(line);
  };
  const dryRun = mode === "dry-run";

  /** @type {{path: string, size: number}[]} */
  const planned = [];
  /** @type {{path: string, reason: string}[]} */
  const refusals = [];

  const add = (path) => {
    assertRemovable(root, path);
    if (isTracked(root, path)) {
      refusals.push({
        path,
        reason: "git tracks this path — it is not scratch",
      });
      return;
    }
    planned.push({ path, size: sizeOf(path) });
  };

  for (const path of collectAfterRun(root)) add(path);

  if (mode === "weekly" || dryRun) {
    for (const path of collectStaleTurboCache(root)) add(path);

    const worktrees = collectMergedWorktrees(root);
    for (const path of worktrees.removable) add(path);
    refusals.push(...worktrees.refused);

    let browsers;
    try {
      browsers = collectStalePlaywrightBrowsers(root);
    } catch (error) {
      browsers = { targets: [], note: String(error.message), cache: null };
    }
    if (browsers.note) log(`  playwright: ${browsers.note}`);
    for (const path of browsers.targets) {
      // Outside the repository root by construction, so assertRemovable does not apply. The name
      // pattern and the browsers.json cross-check above are what bound this one.
      planned.push({ path, size: sizeOf(path) });
    }
  }

  const total = planned.reduce((sum, item) => sum + item.size, 0);

  log(
    `workspace-clean: ${mode}${dryRun ? " (nothing will be removed)" : ""} — ` +
      `${planned.length} path(s), ${bytes(total)}`,
  );
  for (const item of planned)
    log(
      `  ${dryRun ? "would remove" : "remove"} ${relativeLabel(root, item.path)}  ${bytes(item.size)}`,
    );
  if (refusals.length > 0) {
    log(`  refused ${refusals.length}:`);
    for (const item of refusals)
      log(`    ${relativeLabel(root, item.path)} — ${item.reason}`);
  }

  if (dryRun) return 0;

  let removed = 0;
  for (const item of planned) {
    try {
      rmSync(item.path, { recursive: true, force: true });
      removed += 1;
    } catch (error) {
      console.error(
        `workspace-clean: failed to remove ${item.path} — ${String(error.message).split("\n")[0]}`,
      );
      return 1;
    }
  }

  if (mode === "weekly") {
    try {
      git(root, ["worktree", "prune"]);
      log("  git worktree prune: done");
    } catch (error) {
      console.error(
        `workspace-clean: git worktree prune failed — ${String(error.message).split("\n")[0]}`,
      );
      return 1;
    }
  }

  log(`workspace-clean: removed ${removed} path(s), reclaimed ${bytes(total)}`);
  return 0;
}

function relativeLabel(root, path) {
  const rel = relative(root, path);
  return rel.startsWith("..") ? path : rel || basename(path);
}

export {
  AFTER_RUN_ANYWHERE,
  AFTER_RUN_PATHS,
  collectAfterRun,
  collectMergedWorktrees,
  collectStaleTurboCache,
  main,
  normalizeBuildName,
};

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  try {
    process.exit(main());
  } catch (error) {
    console.error(`workspace-clean: ${error.message}`);
    process.exit(1);
  }
}
