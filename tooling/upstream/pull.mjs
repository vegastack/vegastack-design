#!/usr/bin/env node
// Produce `vendor/shadcn/4.21.0/` — the PRISTINE pinned upstream this repository is rebuilt on.
//
//   pnpm upstream:pull                   write the baseline
//   pnpm upstream:pull --check           fail if re-deriving the baseline would change it
//   pnpm upstream:pull --verify-integrity  OFFLINE: hash the committed tree against manifest.json
//   pnpm upstream:pull --self-test       prove the gate can fail
//
// WHY THIS SCRIPT EXISTS
//   "Pull upstream and adapt only what is necessary" is aspiration until something can say what
//   upstream WAS. This writes that down once, byte for byte, with a sha256 per file, so
//   `verify-parity.mjs` can prove every canonical component is upstream's file plus an approved
//   patch. Nothing under `vendor/` is ever hand-edited; the only way to change it is to re-run this
//   against a version MK approved.
//
// THE TWO PROOFS, AND WHY THEY ARE DIFFERENT (added 2026-09-18, Codex review of `main..HEAD`)
//   `--check` re-derives the baseline from the network and the CLI, which makes it slow, online,
//   and — because `ensureApp()` reuses `.upstream-cache/` whenever the version-and-flags lock
//   matches — a proof about the STAGED app rather than about the committed bytes. So it is not the
//   gate a PR runs. `--verify-integrity` is: it opens `vendor/<cli>/manifest.json`, hashes every
//   committed file under that directory, and fails on a content mismatch, on a recorded file that
//   is gone, and on a file nobody recorded. It touches no network and no cache, so it is what
//   `pnpm upstream:check` runs, and it is what makes "nothing under `vendor/` is ever hand-edited"
//   a checked claim instead of a comment. `--check` remains the way to move a version.
//
// HOW THE BASELINE IS PRODUCED
//   The registry JSON is not the baseline. The CLI applies two transforms the raw JSON does not
//   carry — the `--rtl` logical-property rewrite (`pr-2` -> `pe-2`, `ml-auto` -> `ms-auto`) and the
//   `@/registry/<style>/ui/*` -> `@/components/ui/*` import rewrite — so the baseline must come
//   from a real scaffolded app the real CLI wrote into. That app lives in `.upstream-cache/`
//   (gitignored) and is reused when its lock matches, because `create-next-app` plus a full
//   `add --all` costs minutes and its inputs are pinned.
//
// TWO THINGS THE PLAN PREDICTED SLIGHTLY DIFFERENTLY (implementation.md § 3.1), recorded here
// because this script is the enforcing authority and the plan is a point-in-time record:
//   1. The preset is `nova`, not `base-nova`. `base-nova` is the STYLE — `-b base` plus `-p nova`.
//      `-p base-nova` is rejected by the CLI by name.
//   2. `shadcn docs <name> --json` returns LINKS, not sections. The docs markdown that carries the
//      `##` section list is served at `<docs link>.md`, so the cache is fetched from there and the
//      parsed section list is written beside it as JSON. The gate stays offline and deterministic.

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";

import { ROOT, walk, relativeToRoot, readJson, fatal } from "../lib/fs.mjs";
import {
  CLI_VERSION,
  STYLE,
  BASE,
  PRESET,
  REGISTRY,
  PORTED_STYLE,
  VENDOR,
  CACHE,
  report,
  sha256,
} from "./lib.mjs";

const PREFIX = "upstream:pull";
const APP = join(CACHE, "app");
const STAGED = join(CACHE, "staged");
const FLAGS = ["-t", "next", "-b", BASE, "-p", PRESET, "--pointer", "--rtl"];
const LOCK = join(CACHE, "app.lock");

/**
 * The Base UI blocks staged for comparison. A literal list: the registry serves no block index.
 * The style ships 30; DS-78 (2026-09-24) removed the 28 non-conforming demo blocks from this
 * system (the dashboard, login 02-05, signup 01-05, sidebar 01-16 and third preview compositions), so
 * a pull no longer stages them. `login-01` stays because it is still ours to compare against, and
 * `preview`/`preview-02` stay as the style's own showcase pages, staged for comparison only.
 */
const BLOCKS = ["login-01", "preview", "preview-02"];

/**
 * The 68 chart blocks. They exist only under `new-york-v4` (verified: every name below is 200 there
 * and 404 under base-nova), and they touch nothing but `card` + `chart` + recharts, so porting them
 * is one import rewrite. A literal list for the same reason as BLOCKS.
 */
const CHART_BLOCKS = [
  "chart-area-axes",
  "chart-area-default",
  "chart-area-gradient",
  "chart-area-icons",
  "chart-area-interactive",
  "chart-area-legend",
  "chart-area-linear",
  "chart-area-stacked",
  "chart-area-stacked-expand",
  "chart-area-step",
  "chart-bar-active",
  "chart-bar-default",
  "chart-bar-horizontal",
  "chart-bar-interactive",
  "chart-bar-label",
  "chart-bar-label-custom",
  "chart-bar-mixed",
  "chart-bar-multiple",
  "chart-bar-negative",
  "chart-bar-stacked",
  "chart-line-default",
  "chart-line-dots",
  "chart-line-dots-colors",
  "chart-line-dots-custom",
  "chart-line-interactive",
  "chart-line-label",
  "chart-line-label-custom",
  "chart-line-linear",
  "chart-line-multiple",
  "chart-line-step",
  "chart-pie-donut",
  "chart-pie-donut-active",
  "chart-pie-donut-text",
  "chart-pie-interactive",
  "chart-pie-label",
  "chart-pie-label-custom",
  "chart-pie-label-list",
  "chart-pie-legend",
  "chart-pie-separator-none",
  "chart-pie-simple",
  "chart-pie-stacked",
  "chart-radar-default",
  "chart-radar-dots",
  "chart-radar-grid-circle",
  "chart-radar-grid-circle-fill",
  "chart-radar-grid-circle-no-lines",
  "chart-radar-grid-custom",
  "chart-radar-grid-fill",
  "chart-radar-grid-none",
  "chart-radar-label-custom",
  "chart-radar-legend",
  "chart-radar-lines-only",
  "chart-radar-multiple",
  "chart-radial-grid",
  "chart-radial-label",
  "chart-radial-shape",
  "chart-radial-simple",
  "chart-radial-stacked",
  "chart-radial-text",
  "chart-tooltip-advanced",
  "chart-tooltip-default",
  "chart-tooltip-formatter",
  "chart-tooltip-icons",
  "chart-tooltip-indicator-line",
  "chart-tooltip-indicator-none",
  "chart-tooltip-label-custom",
  "chart-tooltip-label-formatter",
  "chart-tooltip-label-none",
];

const IMPORT_REWRITE = [`@/registry/${PORTED_STYLE}/ui/`, "@/components/ui/"];

// ---------------------------------------------------------------------------------------------

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const cli = (args, cwd) =>
  run("pnpm", ["dlx", `shadcn@${CLI_VERSION}`, ...args], cwd);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.text();
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

/**
 * The complaint a given installed `shadcn` version earns, or `null` when it is the pin.
 *
 * Split out from `assertCliVersion` so the self-test can invoke the REAL comparison with a wrong
 * version, rather than re-stating the equality it is supposed to be proving.
 */
export function cliVersionProblem(found) {
  if (found === CLI_VERSION) return null;
  return (
    `shadcn is ${found}, and the baseline is pinned to ${CLI_VERSION}. ` +
    `A version move is MK's decision (README.md § 3).`
  );
}

/** The installed `shadcn` must be EXACTLY the pinned version, or the baseline is not the baseline. */
function assertCliVersion() {
  const pkg = join(ROOT, "apps/docs/node_modules/shadcn/package.json");
  if (!existsSync(pkg))
    fatal(PREFIX, `shadcn is not installed at ${relativeToRoot(pkg)}`);
  const found = readJson(pkg).version;
  const problem = cliVersionProblem(found);
  if (problem) fatal(PREFIX, problem, { code: 1 });
  return found;
}

/**
 * OFFLINE: prove the committed vendor tree is byte-for-byte what `manifest.json` records.
 *
 * Three ways to fail, and all three are how a hand-edit shows up:
 *   - a recorded file whose sha256 no longer matches (someone edited upstream in place);
 *   - a recorded file that is gone (someone deleted one);
 *   - a file under `vendor/` that no pull produced (someone added one).
 * `manifest.json` itself is excluded, because it is written after the hashes and cannot hash itself.
 *
 * This is a pure function of one directory so `--self-test` runs it against a tampered COPY of the
 * real baseline and watches it fail, which is the only evidence that it can.
 */
export function checkManifestIntegrity(vendorDir) {
  const failures = [];
  const manifestPath = join(vendorDir, "manifest.json");
  if (!existsSync(manifestPath)) {
    return {
      failures: [
        `no manifest.json under ${relativeToRoot(vendorDir)} — the baseline has no integrity record`,
      ],
      checked: 0,
    };
  }
  const recorded = readJson(manifestPath).files;
  if (!recorded || Object.keys(recorded).length === 0) {
    return {
      failures: [
        `${relativeToRoot(manifestPath)} records no files — an empty integrity record proves nothing`,
      ],
      checked: 0,
    };
  }

  const onDisk = new Map();
  for (const absolute of walk(vendorDir)) {
    const rel = absolute
      .slice(vendorDir.length + 1)
      .split("\\")
      .join("/");
    if (rel === "manifest.json") continue;
    onDisk.set(rel, absolute);
  }

  for (const [rel, hash] of Object.entries(recorded)) {
    const absolute = onDisk.get(rel);
    if (!absolute) {
      failures.push(`${rel}: recorded in manifest.json, but not on disk`);
      continue;
    }
    const actual = sha256(readFileSync(absolute));
    if (actual !== hash) {
      failures.push(
        `${rel}: content does not match manifest.json (recorded ${hash}, found ${actual}) — ` +
          `vendor/ is never hand-edited; re-run \`pnpm upstream:pull\` instead`,
      );
    }
  }
  for (const rel of onDisk.keys()) {
    if (!(rel in recorded)) {
      failures.push(`${rel}: on disk, but no pull produced it`);
    }
  }

  return { failures, checked: Object.keys(recorded).length };
}

/** Scaffold the upstream app, or reuse the cached one when its lock matches. */
function ensureApp() {
  const lock = JSON.stringify({ cli: CLI_VERSION, flags: FLAGS });
  if (
    existsSync(LOCK) &&
    readFileSync(LOCK, "utf8") === lock &&
    existsSync(APP)
  ) {
    console.log(`${PREFIX}: reusing ${relativeToRoot(APP)} (lock matches)`);
    return;
  }
  console.log(`${PREFIX}: scaffolding ${relativeToRoot(APP)} …`);
  rmSync(APP, { recursive: true, force: true });
  mkdirSync(CACHE, { recursive: true });
  cli([...["init"], ...FLAGS, "--no-monorepo", "-y", "-n", "app"], CACHE);
  cli(["add", "--all", "--yes", "--overwrite"], APP);
  // `--all` skips `sonner` (it is not in the style's default set); `form` is a docs-only registry
  // item that ships no file at all, so there is nothing to add for it.
  cli(["add", "sonner", "--yes", "--overwrite"], APP);
  writeFileSync(LOCK, lock);
}

/** Where the CLI writes one registry file inside the app. */
const targetPath = (file) =>
  file.target ? file.target : join("components", basename(file.path));

/** Strip `registry/<style>/blocks/<block>/` from a registry path. */
const blockRelative = (file, name) =>
  file.path.replace(new RegExp(`^registry/[^/]+/blocks/${name}/`), "");

async function stageBlocks() {
  const ported = {};
  for (const name of BLOCKS) {
    const item = await fetchJson(REGISTRY.replace("{name}", name));
    cli(["add", name, "--yes", "--overwrite"], APP);
    for (const file of item.files) {
      const from = join(APP, targetPath(file));
      if (!existsSync(from))
        throw new Error(`${name}: CLI wrote no ${targetPath(file)}`);
      write(
        join(STAGED, "blocks", name, blockRelative(file, name)),
        readFileSync(from),
      );
    }
  }
  for (const name of CHART_BLOCKS) {
    const item = await fetchJson(
      `https://ui.shadcn.com/r/styles/${PORTED_STYLE}/${name}.json`,
    );
    if (item.files.length !== 1) {
      throw new Error(`${name}: expected one file, got ${item.files.length}`);
    }
    const content = item.files[0].content
      .split(IMPORT_REWRITE[0])
      .join(IMPORT_REWRITE[1]);
    const rel = `blocks/${name}/${name}.tsx`;
    write(join(STAGED, rel), content);
    ported[rel] = {
      from: PORTED_STYLE,
      rewrites: [`${IMPORT_REWRITE[0]}→${IMPORT_REWRITE[1]}`],
    };
  }
  return ported;
}

/**
 * Cache upstream's docs page per component: the raw markdown plus its parsed `##` section list.
 * The section list is what `verify-variant-coverage.mjs` reads, which is why it is cached rather
 * than fetched at gate time — a blocking gate must be offline and deterministic.
 */
async function stageDocs(components) {
  const sections = {};
  for (const name of components) {
    const url = `https://ui.shadcn.com/docs/components/${BASE}/${name}.md`;
    const markdown = await fetchText(url);
    const list = markdown
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.slice(3).trim());
    write(join(STAGED, "docs", `${name}.md`), markdown);
    write(
      join(STAGED, "docs", `${name}.json`),
      `${JSON.stringify({ component: name, base: BASE, url, sections: list }, null, 2)}\n`,
    );
    sections[name] = list;
  }
  return sections;
}

async function stage() {
  rmSync(STAGED, { recursive: true, force: true });
  mkdirSync(STAGED, { recursive: true });

  // Component sources, and the three app files that carry upstream's own configuration.
  cpSync(join(APP, "components/ui"), join(STAGED, "ui"), { recursive: true });
  cpSync(join(APP, "lib"), join(STAGED, "lib"), { recursive: true });
  cpSync(join(APP, "hooks"), join(STAGED, "hooks"), { recursive: true });
  write(
    join(STAGED, "css/globals.css"),
    readFileSync(join(APP, "app/globals.css")),
  );
  write(
    join(STAGED, "components.json"),
    readFileSync(join(APP, "components.json")),
  );

  const components = walk(join(STAGED, "ui"))
    .map((p) => basename(p, ".tsx"))
    .sort();

  const ported = await stageBlocks();
  await stageDocs(components);

  // AFTER the blocks: adding a block installs its runtime dependencies (whatever the
  // staged blocks declare), so a package.json snapshotted before them is not what a second pull into a
  // reused app produces. Staged last, it is the dependency set of "init + every component + every block".
  write(join(STAGED, "package.json"), readFileSync(join(APP, "package.json")));

  // The neutral colour contract, cached for the Batch 1 token migration.
  write(
    join(STAGED, "colors/neutral.json"),
    `${JSON.stringify(await fetchJson("https://ui.shadcn.com/r/colors/neutral.json"), null, 2)}\n`,
  );

  const files = {};
  for (const absolute of walk(STAGED)) {
    const rel = absolute
      .slice(STAGED.length + 1)
      .split("\\")
      .join("/");
    files[rel] = sha256(readFileSync(absolute));
  }
  write(
    join(STAGED, "manifest.json"),
    `${JSON.stringify(
      {
        cli: CLI_VERSION,
        style: STYLE,
        base: BASE,
        preset: PRESET,
        flags: [...FLAGS, "--no-monorepo"],
        registry: REGISTRY,
        pulledAt: new Date().toISOString(),
        components,
        blocks: BLOCKS,
        chartBlocks: CHART_BLOCKS,
        ported,
        files,
      },
      null,
      2,
    )}\n`,
  );
  return components;
}

/** Everything under a directory as `relative path -> sha256`, so two trees compare in one step. */
function fingerprint(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  for (const absolute of walk(dir)) {
    const rel = absolute
      .slice(dir.length + 1)
      .split("\\")
      .join("/");
    let content = readFileSync(absolute);
    // `pulledAt` is the one field that legitimately changes between two identical pulls.
    if (rel === "manifest.json") {
      const parsed = JSON.parse(content.toString("utf8"));
      delete parsed.pulledAt;
      content = Buffer.from(JSON.stringify(parsed));
    }
    out[rel] = sha256(content);
  }
  return out;
}

function compare(check) {
  const staged = fingerprint(STAGED);
  const vendor = fingerprint(VENDOR);
  const problems = [];
  for (const [rel, hash] of Object.entries(staged)) {
    if (!(rel in vendor)) problems.push(`missing from vendor: ${rel}`);
    else if (vendor[rel] !== hash)
      problems.push(`differs from upstream: ${rel}`);
  }
  for (const rel of Object.keys(vendor)) {
    if (!(rel in staged)) problems.push(`not produced by a pull: ${rel}`);
  }
  if (!check) {
    rmSync(VENDOR, { recursive: true, force: true });
    cpSync(STAGED, VENDOR, { recursive: true });
    console.log(
      `${PREFIX}: OK — wrote ${Object.keys(staged).length} files to ${relativeToRoot(VENDOR)}`,
    );
    return 0;
  }
  if (problems.length) {
    for (const problem of problems) console.error(`${PREFIX}: ${problem}`);
    console.error(
      `${PREFIX}: FAILED — ${relativeToRoot(VENDOR)} is not what a pull produces ` +
        `(${problems.length} difference(s))`,
    );
    return 1;
  }
  console.log(
    `${PREFIX}: OK — ${relativeToRoot(VENDOR)} matches a fresh pull (${Object.keys(staged).length} files)`,
  );
  return 0;
}

// ---------------------------------------------------------------------------------------------

/**
 * Observe the gate failing — by RUNNING it, never by re-stating what it should conclude.
 *
 * Every integrity claim calls `checkManifestIntegrity` itself, against a temp COPY of the real
 * committed baseline that the claim then tampers with. The version claim calls the real
 * `cliVersionProblem`. The previous shape compared two objects this function had just built, which
 * is a test of `Object.assign` (Codex review of `main..HEAD`, 2026-09-18).
 */
function selfTest() {
  const failures = [];
  const claim = (label, ok) => {
    console.log(
      `${PREFIX}:selftest ${ok ? "observed" : "DID NOT OBSERVE"} — ${label}`,
    );
    if (!ok) failures.push(label);
  };

  claim(
    "a CLI version other than the pin is rejected",
    cliVersionProblem("4.20.0") !== null &&
      cliVersionProblem(CLI_VERSION) === null,
  );

  // A COPY of the committed baseline. Every mutation below happens here; `vendor/` is never touched.
  const dir = mkdtempSync(join(tmpdir(), "vs-vendor-selftest-"));
  const fixture = join(dir, "vendor");
  cpSync(VENDOR, fixture, { recursive: true });
  const fails = () => checkManifestIntegrity(fixture).failures;

  claim(
    "the committed baseline hashes clean against its own manifest",
    checkManifestIntegrity(VENDOR).failures.length === 0,
  );
  claim("a faithful copy of it also hashes clean", fails().length === 0);

  const victim = join(fixture, "ui", "button.tsx");
  const original = readFileSync(victim);
  writeFileSync(victim, `${original.toString("utf8")}// tampered\n`);
  claim(
    "a tampered vendor file is detected by CONTENT, not by name",
    fails().some((f) => f.includes("ui/button.tsx: content does not match")),
  );
  writeFileSync(victim, original);
  claim("restoring the byte-for-byte original clears it", fails().length === 0);

  rmSync(victim);
  claim(
    "a recorded vendor file that is gone is detected",
    fails().some((f) => f.includes("ui/button.tsx: recorded in manifest.json")),
  );
  writeFileSync(victim, original);

  const intruder = join(fixture, "ui", "not-from-upstream.tsx");
  writeFileSync(intruder, "export const Nope = () => null\n");
  claim(
    "a vendor file no pull produced is detected",
    fails().some((f) => f.includes("ui/not-from-upstream.tsx: on disk")),
  );
  rmSync(intruder);

  rmSync(join(fixture, "manifest.json"));
  claim(
    "a baseline with no manifest.json fails closed",
    fails().some((f) => f.includes("no manifest.json")),
  );

  rmSync(dir, { recursive: true, force: true });

  const manifest = readJson(join(VENDOR, "manifest.json"));
  claim(
    "a docs cache entry exists for every component",
    manifest.components.every((n) =>
      existsSync(join(VENDOR, "docs", `${n}.json`)),
    ),
  );

  if (failures.length) {
    console.error(
      `${PREFIX}:selftest FAILED — ${failures.length} claim(s) not observed`,
    );
    return 1;
  }
  console.log(`${PREFIX}:selftest OK — 9 claims observed`);
  return 0;
}

const argv = process.argv.slice(2);
if (argv.includes("--self-test")) {
  process.exit(selfTest());
} else if (argv.includes("--verify-integrity")) {
  const { failures, checked } = checkManifestIntegrity(VENDOR);
  process.exit(
    report(
      "upstream:integrity",
      failures,
      `${checked} committed file(s) under ${relativeToRoot(VENDOR)} match manifest.json`,
    ),
  );
} else {
  const check = argv.includes("--check");
  assertCliVersion();
  ensureApp();
  const components = await stage();
  console.log(
    `${PREFIX}: staged ${components.length} components, ${BLOCKS.length} blocks, ${CHART_BLOCKS.length} chart blocks`,
  );
  process.exit(compare(check));
}
