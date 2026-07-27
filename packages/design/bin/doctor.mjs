// `vegastack-design doctor` — check a consuming project's setup.
//
// Motivated by a real consumer failure (VegaStack CRM, 2026-07-27): a missing
// `@tailwindcss/postcss` plugin produces two different, equally misleading results.
// Under Turbopack the build dies with `Can't resolve 'tw-animate-css'`, naming a
// dependency that is installed and fine. Under webpack the build SUCCEEDS, the token
// theme lands (it is literal CSS inside preset.css), and zero utility classes are
// generated — so the app renders with correct colours and no spacing or layout, which
// reads as "the design system is broken".
//
// A human will not attribute either symptom correctly, which is exactly why this is a
// command and not a paragraph in a guide. Every check here maps to a documented failure
// mode in the Troubleshooting guide.
//
// Read-only: it never writes, installs, or edits. Exit 0 = all good, 1 = a real problem,
// so it composes into CI as `vegastack-design doctor`.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const POSTCSS_CONFIGS = [
  "postcss.config.mjs",
  "postcss.config.js",
  "postcss.config.cjs",
  "postcss.config.ts",
  "postcss.config.json",
  ".postcssrc",
  ".postcssrc.json",
];

const CSS_SEARCH_DIRS = [
  "app",
  "src/app",
  "src/styles",
  "styles",
  "src",
  "apps",
];

const USAGE = `
Usage: vegastack-design doctor [options]

Checks a consuming project's VegaStack setup and reports what is wrong and how to fix it.

Options:
  --dir <path>   Project root to inspect (default: the current directory)
  -h, --help     Show this help

Exit codes: 0 = no problems · 1 = at least one failure · 2 = bad usage
`.trim();

/** Collect .css files under a few conventional roots, shallowly, without walking node_modules. */
function findCssFiles(root, max = 200) {
  const out = [];
  const seen = new Set();
  const walk = (dir, depth) => {
    if (out.length >= max || depth > 4) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= max) return;
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = join(dir, e.name);
      if (seen.has(full)) continue;
      seen.add(full);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (e.name.endsWith(".css")) out.push(full);
    }
  };
  for (const d of CSS_SEARCH_DIRS) {
    const full = join(root, d);
    if (existsSync(full) && statSync(full).isDirectory()) walk(full, 0);
  }
  return out;
}

/** CSS comments frequently *mention* the thing we are looking for — strip them before matching. */
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** Nearest ancestor of `from` (inclusive) that has a package.json, bounded by `root`. */
function nearestPackageRoot(from, root) {
  let dir = from;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(join(dir, "package.json"))) return dir;
    if (dir === root) break;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return root;
}

function readIfExists(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function readJson(path) {
  const raw = readIfExists(path);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function main(argv = []) {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(USAGE);
    return 0;
  }
  const dirFlag = argv.indexOf("--dir");
  if (dirFlag !== -1 && argv[dirFlag + 1] == null) {
    console.error("doctor: --dir requires a path\n");
    console.error(USAGE);
    return 2;
  }
  const root = dirFlag === -1 ? process.cwd() : argv[dirFlag + 1];

  if (!existsSync(root)) {
    console.error(`doctor: no such directory: ${root}`);
    return 2;
  }

  const results = [];
  const ok = (name, detail) => results.push({ level: "ok", name, detail });
  const warn = (name, detail, fix) =>
    results.push({ level: "warn", name, detail, fix });
  const fail = (name, detail, fix) =>
    results.push({ level: "fail", name, detail, fix });

  // ---- 1. the design system is installed -------------------------------------------------
  const pkg = readJson(join(root, "package.json"));
  const deps = {
    ...(pkg?.dependencies ?? {}),
    ...(pkg?.devDependencies ?? {}),
  };
  const designInstalled =
    "@vegastack/design" in deps ||
    existsSync(join(root, "node_modules", "@vegastack", "design"));

  if (designInstalled) {
    const installed = readJson(
      join(root, "node_modules", "@vegastack", "design", "package.json"),
    );
    ok(
      "@vegastack/design installed",
      installed?.version
        ? `v${installed.version}`
        : (deps["@vegastack/design"] ?? ""),
    );
  } else {
    fail(
      "@vegastack/design installed",
      "not found in package.json or node_modules",
      "pnpm add @vegastack/design",
    );
  }

  // ---- 2. the preset is imported ----------------------------------------------------------
  const cssFiles = findCssFiles(root);
  const presetFiles = cssFiles.filter((f) =>
    (readIfExists(f) ?? "").includes("@vegastack/design/preset.css"),
  );

  if (presetFiles.length > 0) {
    ok(
      "preset.css imported",
      presetFiles.map((f) => relative(root, f)).join(", "),
    );
  } else {
    fail(
      "preset.css imported",
      cssFiles.length === 0
        ? "no .css files found under app/, src/, or styles/"
        : `none of ${cssFiles.length} .css file(s) import it`,
      'add `@import "@vegastack/design/preset.css";` to your global stylesheet',
    );
  }

  // ---- 3. THE BIG ONE: the Tailwind PostCSS plugin ----------------------------------------
  // Without it Tailwind never runs: no utilities are generated, and depending on the bundler
  // you either get a misleading `Can't resolve 'tw-animate-css'` or a silently unstyled app.
  // In a workspace the config correctly lives in the APP package, not the repo root, so search
  // every package that owns a preset-importing stylesheet as well as the root itself.
  const postcssRoots = [
    root,
    ...presetFiles.map((f) => nearestPackageRoot(dirname(f), root)),
  ].filter((d, i, a) => a.indexOf(d) === i);
  const postcssPath = postcssRoots
    .flatMap((d) => POSTCSS_CONFIGS.map((n) => join(d, n)))
    .find(existsSync);
  const postcssOwnerPkg = postcssPath
    ? readJson(join(dirname(postcssPath), "package.json"))
    : null;
  const postcssInline = (postcssOwnerPkg ?? pkg)?.postcss
    ? JSON.stringify((postcssOwnerPkg ?? pkg).postcss)
    : null;
  const postcssSource = postcssPath ? readIfExists(postcssPath) : postcssInline;
  const hasPlugin =
    postcssSource != null && postcssSource.includes("@tailwindcss/postcss");

  if (hasPlugin) {
    ok(
      "Tailwind PostCSS plugin",
      postcssPath ? relative(root, postcssPath) : "package.json#postcss",
    );
  } else if (postcssSource != null) {
    fail(
      "Tailwind PostCSS plugin",
      `${postcssPath ? relative(root, postcssPath) : "package.json#postcss"} exists but does not configure @tailwindcss/postcss`,
      'add `"@tailwindcss/postcss": {}` to its plugins',
    );
  } else {
    fail(
      "Tailwind PostCSS plugin",
      "no PostCSS config found — Tailwind will not run, so NO utility classes are generated",
      'pnpm add -D @tailwindcss/postcss, then create postcss.config.mjs:\n     const config = { plugins: { "@tailwindcss/postcss": {} } };\n     export default config;',
    );
  }

  // ---- 4. no duplicate Tailwind import ----------------------------------------------------
  // preset.css already imports Tailwind; a second bare import is the documented cause of
  // "utilities exist but everything is unstyled".
  const duplicateTailwind = presetFiles.filter((f) => {
    const src = stripCssComments(readIfExists(f) ?? "");
    return /@import\s+["']tailwindcss["']/.test(src);
  });
  if (duplicateTailwind.length > 0) {
    warn(
      "no duplicate Tailwind import",
      `${duplicateTailwind.map((f) => relative(root, f)).join(", ")} also imports "tailwindcss" directly`,
      "remove it — preset.css imports Tailwind itself",
    );
  } else if (presetFiles.length > 0) {
    ok("no duplicate Tailwind import", "preset.css is the only Tailwind entry");
  }

  // ---- 5. registry access is configured ---------------------------------------------------
  let componentsJsonPath = join(root, "components.json");
  let componentsJson = readJson(componentsJsonPath);
  if (componentsJson == null) {
    // Walk up: in a workspace the canonical components.json commonly sits at the repo root.
    let dir = root;
    for (let i = 0; i < 5 && componentsJson == null; i += 1) {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
      const candidate = join(dir, "components.json");
      if (existsSync(candidate)) {
        componentsJsonPath = candidate;
        componentsJson = readJson(candidate);
      }
    }
  }
  if (componentsJson == null) {
    warn(
      "registry configured",
      "no components.json here or in any parent directory",
      "see the Quickstart — needed before `shadcn add @vegastack/<name>`",
    );
  } else if (componentsJson.registries?.["@vegastack"] == null) {
    fail(
      "registry configured",
      'components.json has no `registries["@vegastack"]` entry',
      "add the registries block from the Quickstart",
    );
  } else {
    ok(
      "registry configured",
      `${relative(root, componentsJsonPath) || "components.json"} declares @vegastack`,
    );
  }

  // ---- 6. monorepo hint --------------------------------------------------------------------
  // Source detection is relative to the CSS file, so components living outside the app's tree
  // compile to nothing unless declared. Only worth saying when this actually looks like a workspace.
  const isWorkspace =
    existsSync(join(root, "pnpm-workspace.yaml")) ||
    Array.isArray(pkg?.workspaces) ||
    pkg?.workspaces != null;
  if (isWorkspace && presetFiles.length > 0) {
    const declaresSource = presetFiles.some((f) =>
      (readIfExists(f) ?? "").includes("@source"),
    );
    if (declaresSource) {
      ok("monorepo sources declared", "@source directives present");
    } else {
      warn(
        "monorepo sources declared",
        "workspace detected but no @source directive — components outside this app's tree will compile to nothing",
        'add e.g. `@source "../../../../packages/ui/src";` next to the preset import',
      );
    }
  }

  // ---- report -------------------------------------------------------------------------------
  const glyph = { ok: "✓", warn: "!", fail: "✗" };
  console.log("");
  for (const r of results) {
    console.log(
      `  ${glyph[r.level]} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`,
    );
    if (r.fix) console.log(`     fix: ${r.fix}`);
  }

  const failures = results.filter((r) => r.level === "fail").length;
  const warnings = results.filter((r) => r.level === "warn").length;
  console.log("");
  if (failures > 0) {
    console.log(
      `  ${failures} problem(s), ${warnings} warning(s). See https://design.vegastack.com/docs/guides/troubleshooting`,
    );
    return 1;
  }
  console.log(
    warnings > 0
      ? `  setup looks correct (${warnings} warning(s)).`
      : "  setup looks correct.",
  );
  return 0;
}
