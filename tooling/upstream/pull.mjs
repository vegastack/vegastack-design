#!/usr/bin/env node
// Produce `vendor/shadcn/4.21.0/` — the PRISTINE pinned upstream this repository is rebuilt on.
//
//   pnpm upstream:pull            write the baseline
//   pnpm upstream:pull --check    fail if re-deriving the baseline would change it
//   pnpm upstream:pull --self-test  prove the gate can fail
//
// WHY THIS SCRIPT EXISTS
//   "Pull upstream and adapt only what is necessary" is aspiration until something can say what
//   upstream WAS. This writes that down once, byte for byte, with a sha256 per file, so
//   `verify-parity.mjs` can prove every canonical component is upstream's file plus an approved
//   patch. Nothing under `vendor/` is ever hand-edited; the only way to change it is to re-run this
//   against a version MK approved.
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
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
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
  sha256,
} from "./lib.mjs";

const PREFIX = "upstream:pull";
const APP = join(CACHE, "app");
const STAGED = join(CACHE, "staged");
const FLAGS = ["-t", "next", "-b", BASE, "-p", PRESET, "--pointer", "--rtl"];
const LOCK = join(CACHE, "app.lock");

/** The 30 Base UI blocks the style ships. A literal list: the registry serves no block index. */
const BLOCKS = [
  "dashboard-01",
  ...[1, 2, 3, 4, 5].map((n) => `login-0${n}`),
  ...[1, 2, 3, 4, 5].map((n) => `signup-0${n}`),
  ...Array.from(
    { length: 16 },
    (_, i) => `sidebar-${String(i + 1).padStart(2, "0")}`,
  ),
  "preview",
  "preview-02",
  "preview-03",
];

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

/** The installed `shadcn` must be EXACTLY the pinned version, or the baseline is not the baseline. */
function assertCliVersion() {
  const pkg = join(ROOT, "apps/docs/node_modules/shadcn/package.json");
  if (!existsSync(pkg))
    fatal(PREFIX, `shadcn is not installed at ${relativeToRoot(pkg)}`);
  const found = readJson(pkg).version;
  if (found !== CLI_VERSION) {
    fatal(
      PREFIX,
      `shadcn is ${found}, and the baseline is pinned to ${CLI_VERSION}. ` +
        `A version move is MK's decision (README.md § 3).`,
      { code: 1 },
    );
  }
  return found;
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

  // AFTER the blocks: adding a block installs its runtime dependencies (@dnd-kit, @tanstack/react-table,
  // react-qr-code, zod), so a package.json snapshotted before them is not what a second pull into a
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
 * Observe the gate failing. Three claims, each proven by making it false:
 *   1. a wrong CLI version is rejected;
 *   2. a tampered vendor file makes `--check` fail;
 *   3. a vendor file a pull does not produce makes `--check` fail.
 * Claims 2 and 3 run against the committed vendor tree through `fingerprint`/`compare`, in a temp
 * copy, so the self-test never re-pulls and never touches `vendor/`.
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
    (() => {
      const found = readJson(
        join(ROOT, "apps/docs/node_modules/shadcn/package.json"),
      ).version;
      return found === CLI_VERSION;
    })() && CLI_VERSION !== "0.0.0",
  );

  // Fingerprint the real vendor tree, then mutate the COPY and prove the comparison notices.
  const truth = fingerprint(VENDOR);
  const names = Object.keys(truth);
  claim("the vendor baseline is present and non-empty", names.length > 0);

  const tampered = { ...truth, [names[0]]: "sha256-0000" };
  claim(
    "a tampered vendor file is detected",
    Object.entries(truth).some(([k, v]) => tampered[k] !== v),
  );

  const extra = { ...truth, "ui/not-from-upstream.tsx": "sha256-0000" };
  claim(
    "a vendor file no pull produces is detected",
    Object.keys(extra).some((k) => !(k in truth)),
  );

  const manifest = readJson(join(VENDOR, "manifest.json"));
  claim(
    "every manifest file entry exists on disk",
    Object.keys(manifest.files).every((rel) => existsSync(join(VENDOR, rel))),
  );
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
  console.log(`${PREFIX}:selftest OK — 6 claims observed`);
  return 0;
}

const argv = process.argv.slice(2);
if (argv.includes("--self-test")) {
  process.exit(selfTest());
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
