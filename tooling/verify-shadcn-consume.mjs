// verify-shadcn-consume — strongest HONEST local proof that the built registry is
// actually CONSUMABLE end-to-end, not just hash-parity-green.
//
// WHY THIS EXISTS (Codex R11 HIGH → R13): `registry-header.mjs` re-syncs the docs copy-in by
// directly copying registry SOURCE into `apps/docs/components/ui/` — which BYPASSES the real
// `shadcn add` install path. So the "copy-in" matrix column can be green while the built
// registry is NOT proven consumable. This script proves consumability TWO ways:
//
//   A) THE LOAD-BEARING GATE — REAL `shadcn add` (Codex R13): for a representative
//      dependency-graph set (button leaf, split-button→button+dropdown-menu,
//      data-list→table+checkbox+skeleton+empty-state) we run the repository-pinned shadcn CLI
//      against a served local component registry, with the declared `@vegastack/*` deps made
//      INSTALLABLE LOCALLY (no public-npm publish) by:
//         • `pnpm pack`-ing each declared @vegastack/* dep (utils, tokens) into tarballs, and
//         • serving them from a minimal LOCAL npm registry (packument + tarball) that the
//           scratch consumer's `.npmrc` points `@vegastack:registry` at — so shadcn's real
//           `pnpm add @vegastack/<x>@^0.1.0` resolves OFFLINE from our tarballs, not npmjs.org.
//      We assert the CLI EXITS 0, writes files to the components.json-resolved targets, installs
//      the @vegastack/* deps from the local registry, and the consumed files `tsc --noEmit`.
//      Any failure here (schema/target/deps/CLI) FAILS the script — this is the publish gate.
//
//   B) COMPREHENSIVE COVERAGE — SIMULATED consume over ALL registry items × TWO layouts
//      (default `components/ui` + non-default `src/components/ui`): fetch + transitive
//      registryDependencies + integrity preflight (shipped `itemHash`) + `@ui/…` placeholder
//      → consumer-layout resolution (including standard tsconfig `@/*`→`src/*`) + exact
//      components.json alias rewriting +
//      shipped `--post-write` alias-aware verify + one consolidated `tsc --noEmit` per layout.
//      This is breadth; the real `shadcn add` above is the load-bearing depth.
//
// The verdict states BOTH: "real shadcn add: N/N item graphs installed via the CLI ✓" AND
// "simulated coverage: 538/538 × 2 layouts ✓". Exit 0 only when BOTH pass.
//
// NOTHING IS PUBLISH-GATED ANY MORE: the one previously-gated step (npm-install of the
// unpublished @vegastack/*@^0.1.0) is solved LOCALLY via pack + local npm registry. We do NOT
// publish, push, run registry:build, or touch registry item hashes.
//
// Run:  export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node tooling/verify-shadcn-consume.mjs
// Exit: 0 only when the real-shadcn-add representative set AND the all-items×2-layout sim pass.

import { createHash } from "node:crypto";
import { spawnSync, spawn } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  symlinkSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, relative, resolve } from "node:path";

import {
  declaredVegastackPackages,
  validateConsumeReport,
  writeImmutableJson,
} from "./lib/consume-isolation.mjs";
import { reverseConsumeClosure } from "./lib/consume-plan.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const registryDir = join(repoRoot, "apps/docs/public/r");
const shippedVerifier = join(
  repoRoot,
  "packages/design/bin/verify-registry-item.mjs",
);
const docsNodeModules = join(repoRoot, "apps/docs/node_modules");
const tscBin = join(repoRoot, "node_modules/.bin/tsc");
const shadcnBin = join(docsNodeModules, ".bin/shadcn");

const USAGE = `Usage: node tooling/verify-shadcn-consume.mjs [options]

  --mode <full|affected|diagnostic>  full is the unchanged CI/ship oracle (default)
  --root <item>                      exact item root; repeatable for affected mode
  --layout <default|src>             layout selector; diagnostic requires exactly one
  --report <path>                    structured report (default: .gates/consume-<run>.json)

Full mode always runs real CLI isolated roots, isolated simulated parity roots, and the exhaustive
consolidated two-layout oracle. Affected/diagnostic modes are local shadow evidence only: they cannot
write a receipt, enable reuse, or replace CI's full consume reexecution while D1 is unapproved.

Exit codes: 0 selected proof passed · 1 proof failed · 2 invalid selector/prerequisite.`;

const options = { mode: "full", roots: [], layouts: [], report: null };
function optionFatal(message) {
  console.error(`verify-shadcn-consume: ${message}\n\n${USAGE}`);
  process.exit(2);
}
for (let index = 2; index < process.argv.length; index++) {
  const flag = process.argv[index];
  const value = () => {
    const next = process.argv[++index];
    if (next === undefined) optionFatal(`${flag} requires a value`);
    return next;
  };
  if (flag === "--mode") options.mode = value();
  else if (flag === "--root") options.roots.push(value());
  else if (flag === "--layout") options.layouts.push(value());
  else if (flag === "--report") options.report = resolve(value());
  else if (flag === "--help" || flag === "-h") {
    console.log(USAGE);
    process.exit(0);
  } else optionFatal(`unknown option ${flag}`);
}
if (!["full", "affected", "diagnostic"].includes(options.mode))
  optionFatal(`--mode must be full, affected, or diagnostic`);
if (options.mode === "full" && options.roots.length > 0)
  optionFatal("full mode derives every root; --root is not accepted");
if (options.mode === "full" && options.layouts.length > 0)
  optionFatal("full mode always proves both layouts; --layout is not accepted");
if (options.mode !== "full" && options.roots.length === 0)
  optionFatal(`${options.mode} mode requires a nonempty --root selector`);
if (
  options.mode === "diagnostic" &&
  (options.roots.length !== 1 || options.layouts.length !== 1)
)
  optionFatal("diagnostic mode requires exactly one --root and one --layout");
for (const layout of options.layouts)
  if (!["default", "src"].includes(layout))
    optionFatal(
      `unknown layout ${JSON.stringify(layout)}; expected default or src`,
    );
if (new Set(options.roots).size !== options.roots.length)
  optionFatal("duplicate --root selectors are forbidden");
if (new Set(options.layouts).size !== options.layouts.length)
  optionFatal("duplicate --layout selectors are forbidden");

// Import the SHIPPED verifier's canonical logic directly — the SAME functions the bin uses, so
// the simulated path verifies "the same way" the shipped verifier does, in-process.
const {
  itemHash,
  resolveTargetPath,
  readConsumerConfiguration,
  rewriteRegistryAliases,
  stripShadcnLeadingCommentPrologue,
  stripProvenanceHeader,
} = await import(pathToFileURL(shippedVerifier).href);

// Hard caps so the run can NEVER hang — every subprocess gets these.
const SUBPROCESS_TIMEOUT_MS = 60_000;
const KILL = "SIGKILL";

// Public @vegastack/* packages are packed into the sidecar. Each isolated real root must install
// exactly the subset declared by its resolved graph; requiring the global union would recreate the
// accumulated-consumer bug this runner is intended to expose.
const VEGASTACK_DEP_PKGS = [
  { name: "@vegastack/design", dir: join(repoRoot, "packages/design") },
  {
    name: "@vegastack/design-tokens",
    dir: join(repoRoot, "packages/design-tokens"),
  },
];

// Baseline dependency-graph set for the REAL `shadcn add` gate.
//   button         — leaf (no registryDependencies).
//   split-button   — → button + dropdown-menu.
//   data-list      — → table + checkbox + skeleton + empty-state (deep fan-out).
//   field          — hidden-dependency regression guard: must bring input on a clean install.
//   sonner         — dependency-sensitive provider/toaster item.
//   text-edit      — heavy rich-text dependency graph.
//   country-select — search/select graph with popover + command + button.
const REAL_CRITICAL_GRAPHS = [
  "button",
  "split-button",
  "data-list",
  "field",
  "sonner",
  "text-edit",
  "country-select",
];

// Required external dependency/engine families. The actual roots are selected from the built
// registry with a deterministic greedy set-cover over TRANSITIVE registry graphs. This prevents a
// hand-maintained representative list from silently dropping Motion, message-scroller, date-picker,
// Markdown, resizable, Recharts, or the dashboard block when dependency ownership changes.
const REQUIRED_EXTERNAL_FAMILIES = {
  motion: (dependencies, name) =>
    dependencies.some(
      (dependency) =>
        dependency === "motion" || dependency.startsWith("motion@"),
    ),
  "message-scroller": (dependencies, name) =>
    dependencies.some((dependency) => dependency.startsWith("@shadcn/react")),
  "date-picker": (dependencies, name) =>
    dependencies.some((dependency) =>
      dependency.startsWith("react-day-picker"),
    ),
  markdown: (dependencies, name) =>
    dependencies.some((dependency) =>
      dependency.startsWith("react-markdown"),
    ) && dependencies.some((dependency) => dependency.startsWith("remark-gfm")),
  resizable: (dependencies, name) =>
    dependencies.some((dependency) =>
      dependency.startsWith("react-resizable-panels"),
    ),
  recharts: (dependencies, name) =>
    dependencies.some((dependency) => dependency.startsWith("recharts")),
  "dashboard-block": (_dependencies, name) => name === "dashboard-01",
};

// ── the two consumer layouts the SIMULATED path proves (Codex R12: non-default required) ──
const LAYOUTS = [
  {
    id: "default",
    name: "default (components/ui)",
    sourceRoot: "",
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    tscPaths: { "@/*": ["./*"] },
    tscInclude: [
      "components/**/*.ts",
      "components/**/*.tsx",
      "app/**/*.ts",
      "app/**/*.tsx",
    ],
  },
  {
    id: "src",
    name: "standard Next src layout (@/* → src/*)",
    sourceRoot: "src",
    aliases: {
      components: "@/components",
      utils: "@/lib/utils",
      ui: "@/components/ui",
      lib: "@/lib",
      hooks: "@/hooks",
    },
    tscPaths: { "@/*": ["./src/*"] },
    tscInclude: ["src/**/*.ts", "src/**/*.tsx", "app/**/*.ts", "app/**/*.tsx"],
  },
];

const log = (m) => console.log(m);
const ok = (m) => console.log(`  ✓ ${m}`);
const info = (m) => console.log(`  • ${m}`);
const fail = (m) => console.error(`  ✗ ${m}`);

function readItem(name) {
  const p = join(registryDir, `${name}.json`);
  if (!existsSync(p)) throw new Error(`registry item not found: ${name}.json`);
  return JSON.parse(readFileSync(p, "utf8"));
}

function allItemNames() {
  const reg = JSON.parse(
    readFileSync(join(registryDir, "registry.json"), "utf8"),
  );
  return reg.items.map((i) => i.name);
}

function depToItemName(dep) {
  return dep.startsWith("@vegastack/") ? dep.slice("@vegastack/".length) : dep;
}

// Transitively resolve an item + all its registryDependencies (deps before dependents).
function resolveGraph(rootName) {
  const order = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const item = readItem(name);
    for (const dep of item.registryDependencies ?? [])
      visit(depToItemName(dep));
    order.push(name);
  };
  visit(rootName);
  return order;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function externalFamilySetCover(itemNames) {
  const coverageByRoot = new Map();
  for (const name of itemNames) {
    const dependencies = resolveGraph(name).flatMap(
      (graphName) => readItem(graphName).dependencies ?? [],
    );
    const covered = Object.entries(REQUIRED_EXTERNAL_FAMILIES)
      .filter(([, matches]) => matches(dependencies, name))
      .map(([family]) => family);
    if (covered.length) coverageByRoot.set(name, covered);
  }

  const uncovered = new Set(Object.keys(REQUIRED_EXTERNAL_FAMILIES));
  const selected = [];
  while (uncovered.size) {
    const candidates = [...coverageByRoot.entries()]
      .map(([name, families]) => ({
        name,
        families: families.filter((family) => uncovered.has(family)),
      }))
      .filter((candidate) => candidate.families.length)
      .sort(
        (a, b) =>
          b.families.length - a.families.length || a.name.localeCompare(b.name),
      );
    const best = candidates[0];
    if (!best)
      throw new Error(
        `external dependency set-cover cannot cover: ${[...uncovered].join(", ")}`,
      );
    selected.push(best);
    for (const family of best.families) uncovered.delete(family);
  }
  return selected;
}

// Run a subprocess with a hard timeout + SIGKILL. Returns { ok, status, signal, out }.
function runCapped(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    encoding: "utf8",
    timeout: SUBPROCESS_TIMEOUT_MS,
    killSignal: KILL,
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  if (r.signal === KILL || r.error?.code === "ETIMEDOUT") {
    return {
      ok: false,
      status: r.status,
      signal: r.signal,
      out: `${out}\n[timed out — killed]`,
    };
  }
  if (r.error)
    return {
      ok: false,
      status: r.status,
      signal: r.signal,
      out: `${out}\n[spawn error: ${r.error.message}]`,
    };
  return { ok: r.status === 0, status: r.status, signal: r.signal, out };
}

// ── SIDECAR registry server (runs in a SEPARATE process) ─────────────────────────────────
// CRITICAL: the main process uses blocking `spawnSync` (for pnpm / shadcn / tsc, so each is hard-
// capped). A blocking spawnSync STARVES the event loop — an in-PROCESS HTTP server cannot answer
// requests while it blocks, so shadcn's `pnpm add` (which fetches @vegastack/* from our local npm
// registry) sees ECONNRESET → 10s retries → timeout. Running the servers in a sidecar CHILD process
// keeps them responsive throughout the main process's blocking calls. The sidecar serves BOTH:
//   • the component registry (apps/docs/public/r at /r/<name>.json and /<name>.json), and
//   • a minimal npm registry (packument + tarball) for the packed @vegastack/* deps,
// and prints `PORTS <componentPort> <npmPort>` on stdout once both are listening.
const SIDECAR_SRC = `
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, extname } from 'node:path';

const registryDir = process.argv[2];
const tarballDir = process.argv[3];
const repoRoot = process.argv[4];

// Build the npm-registry package map from the packed tarballs in tarballDir.
const pkgs = {};
for (const f of readdirSync(tarballDir).filter((n) => n.endsWith('.tgz'))) {
  const m = /^vegastack-(.+)-(\\d+\\.\\d+\\.\\d+)\\.tgz$/.exec(f);
  if (!m) continue;
  pkgs['@vegastack/' + m[1]] = { pkg: m[1], version: m[2], file: join(tarballDir, f), tarballName: f };
}

// Component registry: serves the shadcn registry items.
const componentServer = createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname.replace(/^\\/+/, '').replace(/^r\\//, '');
  const filePath = join(registryDir, name);
  if (!filePath.startsWith(registryDir) || extname(filePath) !== '.json' || !existsSync(filePath)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'application/json' }).end(readFileSync(filePath));
});

// npm registry: packument + tarball for @vegastack/* from the local tarballs.
const npmServer = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const tb = /^\\/(@vegastack\\/[^/]+)\\/-\\/.+\\.tgz$/.exec(url);
  if (tb && pkgs[tb[1]]) {
    res.writeHead(200, { 'content-type': 'application/octet-stream' }).end(readFileSync(pkgs[tb[1]].file));
    return;
  }
  const pm = /^\\/(@vegastack\\/[^/]+)$/.exec(url);
  if (pm && pkgs[pm[1]]) {
    const p = pkgs[pm[1]];
    const buf = readFileSync(p.file);
    const manifest = JSON.parse(readFileSync(join(repoRoot, 'packages', p.pkg, 'package.json'), 'utf8'));
    // Mirror what "pnpm pack" does to the tarball's own manifest: workspace:* ranges are
    // rewritten to concrete versions at pack time (e.g. design's dependency on tokens).
    // The packument must match, or the consumer's resolver chokes on "workspace:*".
    for (const depField of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      const deps = manifest[depField];
      if (!deps) continue;
      for (const dn of Object.keys(deps)) {
        if (String(deps[dn]).startsWith('workspace:')) {
          deps[dn] = pkgs[dn] ? pkgs[dn].version : p.version;
        } else if (String(deps[dn]).startsWith('catalog:')) {
          deps[dn] = '*'; // pnpm resolves catalog: at pack time too; any version satisfies here
        }
      }
    }
    const tarballUrl = 'http://127.0.0.1:' + npmServer.address().port + '/' + pm[1] + '/-/' + p.tarballName;
    const packument = {
      name: pm[1],
      'dist-tags': { latest: p.version },
      versions: { [p.version]: { ...manifest, dist: {
        tarball: tarballUrl,
        shasum: createHash('sha1').update(buf).digest('hex'),
        integrity: 'sha512-' + createHash('sha512').update(buf).digest('base64'),
      } } },
    };
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(packument));
    return;
  }
  res.writeHead(404).end('not found');
});

let up = 0;
const announce = () => { if (++up === 2) console.log('PORTS ' + componentServer.address().port + ' ' + npmServer.address().port); };
componentServer.listen(0, '127.0.0.1', announce);
npmServer.listen(0, '127.0.0.1', announce);
`;

// Start the sidecar; resolve once it prints its two ports. Returns { child, componentPort, npmPort }.
function startSidecar(scratchRoot, tarballDir) {
  const sidecarPath = join(scratchRoot, "registry-sidecar.mjs");
  writeFileSync(sidecarPath, SIDECAR_SRC);
  return new Promise((resolveServer, reject) => {
    const child = spawn(
      "node",
      [sidecarPath, registryDir, tarballDir, repoRoot],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let buf = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("sidecar did not report ports within 10s"));
    }, 10_000);
    child.stdout.on("data", (d) => {
      buf += d.toString();
      const m = /PORTS (\d+) (\d+)/.exec(buf);
      if (m) {
        clearTimeout(timer);
        resolveServer({
          child,
          componentPort: Number(m[1]),
          npmPort: Number(m[2]),
        });
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code) => {
      if (code !== null && code !== 0)
        reject(new Error(`sidecar exited early (${code})`));
    });
  });
}

// `pnpm pack` each declared @vegastack/* dep into <scratch>/.tarballs (the sidecar npm registry
// serves these). Returns { tarballDir, packed: [{name, version}] }.
function packVegastackDeps(scratchRoot) {
  const tarballDir = join(scratchRoot, ".tarballs");
  mkdirSync(tarballDir, { recursive: true });
  const packed = [];
  for (const { name, dir } of VEGASTACK_DEP_PKGS) {
    const r = runCapped("pnpm", ["pack", "--pack-destination", tarballDir], {
      cwd: dir,
      timeout: 30_000,
    });
    if (!r.ok) throw new Error(`pnpm pack ${name} failed:\n${r.out}`);
    const manifest = JSON.parse(
      readFileSync(join(dir, "package.json"), "utf8"),
    );
    const file = join(
      tarballDir,
      `vegastack-${name.split("/")[1]}-${manifest.version}.tgz`,
    );
    if (!existsSync(file))
      throw new Error(`expected packed tarball missing: ${file}`);
    packed.push({ name, version: manifest.version });
  }
  return { tarballDir, packed };
}

// In-process integrity preflight using the SHIPPED `itemHash` (SIMULATED path).
async function preflightIntegrity(base, name, manifest) {
  // Resilient fetch: the sidecar component registry serves over HTTP keep-alive. Across the
  // multi-second `tsc` gap BETWEEN the two layout passes an idle pooled socket can be closed
  // server-side, so the FIRST request of the next pass can hit a dead socket and reject with
  // `TypeError: fetch failed` (a connection-level error, NOT an HTTP status or hash mismatch).
  // Retry ONLY that class — mirrors the ECONNRESET-retry rationale already applied to the npm
  // registry path (see file header). HTTP-status errors and hash mismatches still fail fast.
  let itemText;
  for (let attempt = 1; ; attempt++) {
    try {
      itemText = await fetch(`${base}/${name}.json`).then((r) => {
        if (!r.ok) throw new Error(`fetch ${name}.json → HTTP ${r.status}`);
        return r.text();
      });
      break;
    } catch (err) {
      const connLevel = /fetch failed/i.test(String(err?.message));
      if (!connLevel || attempt >= 4) throw err;
      await new Promise((res) => setTimeout(res, 50 * attempt));
    }
  }
  const item = JSON.parse(itemText);
  const got = itemHash(item);
  if (got !== item.meta?.integrity)
    throw new Error(`hash ${got} ≠ meta.integrity ${item.meta?.integrity}`);
  if (got !== manifest[name])
    throw new Error(`hash ${got} ≠ manifest[${name}] ${manifest[name]}`);
  return itemText;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// A) THE LOAD-BEARING GATE — REAL `shadcn add`
// ════════════════════════════════════════════════════════════════════════════════════════
// One real scratch consumer; @types pre-installed (offline from cache) so the consumed files
// typecheck; .npmrc → local npm registry; components.json registries → served component registry.
// Run the actual shadcn CLI for each representative graph, assert exit 0 + files written, then
// one tsc over everything. Returns { installed: [{root, files[]}], problems[] }.
function proveRealShadcnAdd(
  layout,
  representative,
  scratchRoot,
  componentPort,
  npmPort,
  scopeId = "consolidated",
) {
  const problems = [];
  const consumerRoot = join(
    scratchRoot,
    "__real-shadcn-" + layout.id + "-" + scopeId.replace(/[^a-z0-9]+/gi, "-"),
  );
  const relativeAlias = (alias) =>
    alias.replace(/^@\//, "").replace(/^\.\//, "");
  const sourceRoot = layout.sourceRoot ? `${layout.sourceRoot}/` : "";
  const appRoot = `${sourceRoot}app`;
  mkdirSync(join(consumerRoot, sourceRoot, relativeAlias(layout.aliases.ui)), {
    recursive: true,
  });
  mkdirSync(join(consumerRoot, sourceRoot, relativeAlias(layout.aliases.lib)), {
    recursive: true,
  });
  mkdirSync(join(consumerRoot, appRoot), { recursive: true });

  // A real Next App Router config marker is required so shadcn recognizes the
  // framework and installs registry:page files instead of correctly skipping
  // pages for an unknown framework. Typescript/React types keep the consumed
  // graph typecheckable.
  writeFileSync(
    join(consumerRoot, "package.json"),
    JSON.stringify(
      {
        name: "vega-real-consumer",
        private: true,
        version: "0.0.0",
        type: "module",
        devDependencies: {
          "@types/react": "19.2.17",
          "@types/react-dom": "19.2.3",
          typescript: "6.0.3",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(join(consumerRoot, "next.config.mjs"), "export default {};\n");
  // .npmrc → @vegastack scope resolves from our LOCAL npm registry (the publish-gate solver).
  writeFileSync(
    join(consumerRoot, ".npmrc"),
    `@vegastack:registry=http://127.0.0.1:${npmPort}/\n`,
  );
  // tsconfig + global.css shadcn requires; components.json registries → served component registry.
  writeFileSync(
    join(consumerRoot, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          esModuleInterop: true,
          noEmit: true,
          ignoreDeprecations: "6.0",
          baseUrl: ".",
          paths: layout.tscPaths,
          resolveJsonModule: true,
        },
        include: layout.tscInclude,
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(consumerRoot, appRoot, "global.css"),
    "/* tailwind entry */\n",
  );
  writeFileSync(
    join(consumerRoot, appRoot, "page.tsx"),
    "export default function Page() { return null; }\n",
  );
  writeFileSync(
    join(consumerRoot, "components.json"),
    JSON.stringify(
      {
        $schema: "https://ui.shadcn.com/schema.json",
        style: "base-vega",
        rsc: true,
        tsx: true,
        tailwind: {
          config: "",
          css: `${appRoot}/global.css`,
          baseColor: "neutral",
          cssVariables: true,
          prefix: "",
        },
        iconLibrary: "lucide",
        aliases: layout.aliases,
        registries: {
          "@vegastack": {
            url: `http://127.0.0.1:${componentPort}/r/{name}.json`,
          },
        },
      },
      null,
      2,
    ),
  );

  // Install @types up front (offline from the pnpm content-addressable store).
  const inst = runCapped("pnpm", ["install"], {
    cwd: consumerRoot,
    timeout: 60_000,
  });
  if (!inst.ok) {
    problems.push(`real-shadcn: pre-install of @types failed\n${inst.out}`);
    return {
      consumerRoot,
      installed: [],
      postWriteOk: false,
      tscOk: false,
      problems,
    };
  }

  const installedGraphs = [];
  const consumerConfiguration = readConsumerConfiguration(consumerRoot);
  const consumerAliases = consumerConfiguration.aliases;
  for (const name of representative) {
    const before = new Set(
      safeReaddir(
        join(consumerRoot, sourceRoot, relativeAlias(layout.aliases.ui)),
      ),
    );
    const r = runCapped(
      shadcnBin,
      ["add", `@vegastack/${name}`, "--yes", "--cwd", consumerRoot],
      { timeout: 60_000 },
    );
    if (!r.ok) {
      problems.push(
        `real-shadcn: \`shadcn add @vegastack/${name}\` FAILED (exit ${r.status})\n${r.out}`,
      );
      continue;
    }
    // Assert every file in the expected graph exists at its components.json-resolved target,
    // including registry:page/file targets owned by dashboard-01.
    const expected = resolveGraph(name);
    const missing = expected.flatMap((graphName) =>
      (readItem(graphName).files ?? [])
        .map((file) =>
          resolveTargetPath(
            file,
            consumerRoot,
            consumerAliases,
            consumerConfiguration.paths,
          ),
        )
        .filter((target) => !existsSync(target)),
    );
    if (missing.length) {
      problems.push(
        `real-shadcn[${layout.name}]: ${name}: CLI exited 0 but expected file(s) missing: ${missing.join(", ")}`,
      );
      continue;
    }
    // Assert the declared @vegastack/* deps were installed from the LOCAL npm registry.
    const requiredPackages = declaredVegastackPackages(
      expected.map((graphName) => readItem(graphName)),
    );
    const depsMissing = requiredPackages.filter(
      (name) =>
        !existsSync(join(consumerRoot, "node_modules", name, "package.json")),
    );
    if (depsMissing.length) {
      problems.push(
        `real-shadcn: ${name}: CLI exited 0 but @vegastack dep(s) not installed: ${depsMissing.join(", ")}`,
      );
      continue;
    }
    // Exercise the shipped verifier against bytes produced by the actual shadcn transform. This
    // catches provenance-header stripping, exact alias rewriting, and target-resolution drift.
    const postWriteDir = join(consumerRoot, ".real-post-write");
    mkdirSync(postWriteDir, { recursive: true });
    let postWriteFailed = false;
    for (const graphName of expected) {
      const graphItem = readItem(graphName);
      const savedItemPath = join(postWriteDir, `${graphName}.json`);
      writeFileSync(savedItemPath, JSON.stringify(graphItem));
      const verification = runCapped("node", [
        shippedVerifier,
        "--post-write",
        "--item",
        savedItemPath,
        "--expected-integrity",
        graphItem.meta.integrity,
        "--target-dir",
        consumerRoot,
      ]);
      if (!verification.ok) {
        problems.push(
          `real-shadcn[${layout.name}]: ${name}/${graphName}: shipped POST-WRITE FAILED\n${verification.out}`,
        );
        postWriteFailed = true;
        break;
      }
    }
    if (postWriteFailed) continue;
    const after = safeReaddir(
      join(consumerRoot, sourceRoot, relativeAlias(layout.aliases.ui)),
    );
    const newFiles = after.filter((f) => !before.has(f));
    const outputs = expected.flatMap((graphName) =>
      (readItem(graphName).files ?? []).map((file) => {
        const target = resolveTargetPath(
          file,
          consumerRoot,
          consumerAliases,
          consumerConfiguration.paths,
        );
        return {
          target: relative(consumerRoot, target),
          sha256: sha256(readFileSync(target)),
        };
      }),
    );
    installedGraphs.push({ name, graph: expected, newFiles, outputs });
  }

  // One consolidated tsc over ALL real-consumed files (uses the consumer's OWN installed tsc +
  // @types + the @vegastack/design it installed from the local registry).
  let tscOk = false;
  if (installedGraphs.length === representative.length) {
    const consumerTsc = join(consumerRoot, "node_modules/.bin/tsc");
    const tscPath = existsSync(consumerTsc) ? consumerTsc : tscBin;
    const tsc = runCapped(
      tscPath,
      ["-p", join(consumerRoot, "tsconfig.json")],
      { timeout: 60_000 },
    );
    if (!tsc.ok)
      problems.push(
        `real-shadcn[${layout.name}]: consolidated tsc --noEmit of consumed files FAILED\n${tsc.out}`,
      );
    tscOk = tsc.ok;
  }

  return {
    consumerRoot,
    installed: installedGraphs,
    postWriteOk:
      installedGraphs.length === representative.length &&
      !problems.some((problem) => problem.includes("POST-WRITE")),
    tscOk,
    problems,
  };
}

function safeReaddir(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════
// B) COMPREHENSIVE COVERAGE — SIMULATED consume, all items × one layout
// ════════════════════════════════════════════════════════════════════════════════════════
async function proveLayout(
  layout,
  base,
  manifest,
  itemNames,
  scratchRoot,
  scopeId = "consolidated",
) {
  const consumerRoot = join(
    scratchRoot,
    "sim-" + layout.id + "-" + scopeId.replace(/[^a-z0-9]+/gi, "-"),
  );
  mkdirSync(consumerRoot, { recursive: true });
  writeFileSync(
    join(consumerRoot, "components.json"),
    JSON.stringify(
      { $schema: "https://ui.shadcn.com/schema.json", aliases: layout.aliases },
      null,
      2,
    ),
  );
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "react-jsx",
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      ignoreDeprecations: "6.0",
      paths: layout.tscPaths,
    },
    include: layout.tscInclude,
  };
  writeFileSync(
    join(consumerRoot, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2),
  );
  symlinkSync(docsNodeModules, join(consumerRoot, "node_modules"), "dir");
  const consumerConfiguration = readConsumerConfiguration(consumerRoot);
  const consumerAliases = consumerConfiguration.aliases;

  const savedDir = join(consumerRoot, ".verified-items");
  mkdirSync(savedDir, { recursive: true });

  const problems = [];
  const ownership = new Map();
  let provenItems = 0;
  let rewrites = 0;
  const savedForPostWrite = [];

  for (const rootName of itemNames) {
    let order;
    try {
      order = resolveGraph(rootName);
    } catch (err) {
      problems.push(
        `[${layout.name}] ${rootName}: graph resolution failed: ${err.message}`,
      );
      continue;
    }
    let itemFailed = false;
    for (const name of order) {
      let itemText;
      try {
        itemText = await preflightIntegrity(base, name, manifest);
      } catch (err) {
        problems.push(
          `[${layout.name}] ${rootName}/${name}: integrity preflight FAILED — ${err.message}`,
        );
        itemFailed = true;
        break;
      }
      const savedItemPath = join(savedDir, `${name}.json`);
      writeFileSync(savedItemPath, itemText);
      const verifiedItem = JSON.parse(itemText);
      for (const file of verifiedItem.files ?? []) {
        if (typeof file.content !== "string") continue;
        const rewritten = rewriteRegistryAliases(file.content, consumerAliases);
        rewrites += rewritten === file.content ? 0 : 1;
        const out = stripShadcnLeadingCommentPrologue(
          stripProvenanceHeader(rewritten),
          file.target ?? file.path ?? "",
          file.type,
        );
        const dest = resolveTargetPath(
          file,
          consumerRoot,
          consumerAliases,
          consumerConfiguration.paths,
        );
        const target = relative(consumerRoot, dest);
        const digest = sha256(out);
        const prior = ownership.get(target);
        if (prior && prior.sha256 !== digest) {
          problems.push(
            `[${layout.name}] target collision at ${target}: ${prior.item} (${prior.sha256}) versus ${name} (${digest})`,
          );
          itemFailed = true;
          break;
        }
        ownership.set(target, { item: name, sha256: digest });
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, out);
      }
      if (itemFailed) break;
      if (!savedForPostWrite.some((s) => s.name === name)) {
        savedForPostWrite.push({
          name,
          savedItemPath,
          expectedIntegrity: verifiedItem.meta.integrity,
        });
      }
    }
    if (itemFailed) continue;
    provenItems++;
  }

  for (const { name, savedItemPath, expectedIntegrity } of savedForPostWrite) {
    const r = runCapped("node", [
      shippedVerifier,
      "--post-write",
      "--item",
      savedItemPath,
      "--expected-integrity",
      expectedIntegrity,
      "--target-dir",
      consumerRoot,
    ]);
    if (!r.ok)
      problems.push(
        `[${layout.name}] ${name}: shipped-verifier POST-WRITE FAILED\n${r.out}`,
      );
  }

  const tsc = runCapped(tscBin, ["-p", join(consumerRoot, "tsconfig.json")]);
  if (!tsc.ok)
    problems.push(
      `[${layout.name}] consolidated tsc --noEmit FAILED\n${tsc.out}`,
    );

  return {
    consumerRoot,
    provenItems,
    totalItems: itemNames.length,
    rewrites,
    tscOk: tsc.ok,
    installed: savedForPostWrite.length,
    ownedTargets: ownership.size,
    targets: [...ownership.entries()]
      .map(([target, value]) => ({ target, ...value }))
      .sort((left, right) => left.target.localeCompare(right.target)),
    collisionsOk: !problems.some((problem) =>
      problem.includes("target collision"),
    ),
    postWriteOk: !problems.some((problem) => problem.includes("POST-WRITE")),
    problems,
  };
}

function collisionProblems(label, results, extract) {
  const owners = new Map();
  const problems = [];
  for (const result of results)
    for (const output of extract(result)) {
      const prior = owners.get(output.target);
      if (prior && prior.sha256 !== output.sha256)
        problems.push(
          `${label}: isolated-root collision at ${output.target}: ${prior.root} (${prior.sha256}) versus ${result.root} (${output.sha256})`,
        );
      else
        owners.set(output.target, { root: result.root, sha256: output.sha256 });
    }
  return { problems, targets: owners.size };
}

function writeConsumeReport(report) {
  const runId = report.startedAt.replace(/[:.]/g, "-");
  const path =
    options.report ?? join(repoRoot, ".gates", `consume-${runId}.json`);
  return writeImmutableJson(path, report);
}

async function main() {
  const startedAt = new Date().toISOString();
  const startedNs = process.hrtime.bigint();
  log("verify-shadcn-consume — local end-to-end consumability proof\n");
  log(`registry source : ${registryDir}`);
  log(`shipped verifier: ${shippedVerifier}`);
  log(`shadcn CLI      : ${shadcnBin}\n`);

  for (const f of [
    registryDir,
    shippedVerifier,
    docsNodeModules,
    tscBin,
    shadcnBin,
  ]) {
    if (!existsSync(f)) {
      fail(`prerequisite missing: ${f}`);
      fail("run `pnpm install` and `pnpm registry:build` first (Node 24).");
      return 2;
    }
  }

  const itemNames = allItemNames();
  const itemNameSet = new Set(itemNames);
  const unknownRoots = options.roots.filter((root) => !itemNameSet.has(root));
  if (unknownRoots.length > 0) {
    fail(`unknown or stale root selector(s): ${unknownRoots.join(", ")}`);
    return 2;
  }
  const setCover = externalFamilySetCover(itemNames);
  const representative = [
    ...new Set([
      ...REAL_CRITICAL_GRAPHS,
      ...setCover.map((entry) => entry.name),
    ]),
  ];
  const selectedRoots =
    options.mode === "full"
      ? representative
      : options.mode === "affected"
        ? reverseConsumeClosure(
            options.roots,
            itemNames.map((name) => readItem(name)),
          )
        : [...new Set(options.roots)].sort();
  const selectedLayouts =
    options.mode === "full" || options.layouts.length === 0
      ? LAYOUTS
      : LAYOUTS.filter((layout) => options.layouts.includes(layout.id));
  const scratchRoot = mkdtempSync(join(tmpdir(), "vega-consume-"));
  let sidecar;
  const allProblems = [];
  const realResults = [];
  const isolatedSimulated = [];
  const consolidated = [];
  const globalCollisionProblems = [];

  try {
    // ── pack @vegastack/* deps + start the SIDECAR registry process ──
    log("── preparing local install path (no publish) " + "─".repeat(20));
    const { tarballDir, packed } = packVegastackDeps(scratchRoot);
    ok(
      `pnpm pack → ${packed.map((p) => `${p.name}@${p.version}`).join(", ")} (local tarballs)`,
    );

    sidecar = await startSidecar(scratchRoot, tarballDir);
    const componentPort = sidecar.componentPort;
    const npmPort = sidecar.npmPort;
    ok(
      `sidecar registry process up — component registry on :${componentPort}  ·  local npm registry on :${npmPort}`,
    );
    const base = `http://127.0.0.1:${componentPort}`;
    log("");

    // ── A) REAL shadcn add (the load-bearing gate) ──
    log(
      "── REAL `shadcn add` (load-bearing gate — Codex R13) " + "─".repeat(12),
    );
    info(
      `external dependency set cover: ${setCover.map((entry) => `${entry.name} → ${entry.families.join("+")}`).join("; ")}`,
    );
    info(
      `${options.mode} isolated real CLI roots: ${selectedRoots.join(", ")}`,
    );
    for (const layout of selectedLayouts) {
      for (const root of selectedRoots) {
        const result = proveRealShadcnAdd(
          layout,
          [root],
          scratchRoot,
          componentPort,
          npmPort,
          root,
        );
        const graph = result.installed[0];
        const leaf = {
          root,
          layout: layout.id,
          consumer: result.consumerRoot,
          postWriteOk: result.postWriteOk,
          tscOk: result.tscOk,
          outputs: graph?.outputs ?? [],
          graph: graph?.graph ?? [],
          problems: result.problems,
        };
        realResults.push(leaf);
        if (result.problems.length === 0)
          ok(
            `[${layout.name}] isolated shadcn add @vegastack/${root}: post-write + tsc ✓`,
          );
        else
          fail(
            `[${layout.name}] isolated shadcn add @vegastack/${root} FAILED`,
          );
        allProblems.push(...result.problems);
      }
      const collision = collisionProblems(
        `real/${layout.id}`,
        realResults.filter((result) => result.layout === layout.id),
        (result) => result.outputs,
      );
      globalCollisionProblems.push(...collision.problems);
      allProblems.push(...collision.problems);
    }
    log("");

    // ── B) SIMULATED isolated parity plus the unchanged full consolidated oracle ──
    log("── SIMULATED isolated roots " + "─".repeat(36));
    const manifest = await fetch(`${base}/integrity-manifest.json`).then(
      (r) => {
        if (!r.ok)
          throw new Error(`fetch integrity-manifest.json → HTTP ${r.status}`);
        return r.json();
      },
    );
    for (const layout of selectedLayouts) {
      for (const root of selectedRoots) {
        const result = await proveLayout(
          layout,
          base,
          manifest,
          [root],
          scratchRoot,
          `isolated-${root}`,
        );
        const leaf = {
          root,
          layout: layout.id,
          consumer: result.consumerRoot,
          postWriteOk: result.postWriteOk,
          tscOk: result.tscOk,
          outputs: result.targets.map(({ target, sha256 }) => ({
            target,
            sha256,
          })),
          graphItems: result.installed,
          problems: result.problems,
        };
        isolatedSimulated.push(leaf);
        const logFn = result.problems.length === 0 ? ok : fail;
        logFn(
          `[${layout.name}] isolated simulated @vegastack/${root}: ${result.provenItems}/1 root · ${result.installed} graph files · post-write ${result.postWriteOk ? "✓" : "✗"} · tsc ${result.tscOk ? "✓" : "✗"}`,
        );
        allProblems.push(...result.problems);
      }
      const collision = collisionProblems(
        `simulated/${layout.id}`,
        isolatedSimulated.filter((result) => result.layout === layout.id),
        (result) => result.outputs,
      );
      globalCollisionProblems.push(...collision.problems);
      allProblems.push(...collision.problems);
    }

    if (options.mode === "full") {
      log("");
      log(
        "── SIMULATED consolidated full oracle (all items × both layouts) " +
          "─".repeat(5),
      );
      for (const layout of LAYOUTS) {
        const result = await proveLayout(
          layout,
          base,
          manifest,
          itemNames,
          scratchRoot,
          "consolidated",
        );
        const summary = {
          layout: layout.id,
          consumer: result.consumerRoot,
          provenItems: result.provenItems,
          totalItems: result.totalItems,
          installed: result.installed,
          rewrites: result.rewrites,
          postWriteOk: result.postWriteOk,
          tscOk: result.tscOk,
          collisionsOk: result.collisionsOk,
          problems: result.problems,
        };
        consolidated.push(summary);
        const logFn = result.problems.length === 0 ? ok : fail;
        logFn(
          `${layout.name}: ${result.provenItems}/${result.totalItems} roots · ${result.installed} graph files · post-write ${result.postWriteOk ? "✓" : "✗"} · collisions ${result.collisionsOk ? "✓" : "✗"} · tsc ${result.tscOk ? "✓" : "✗"}`,
        );
        allProblems.push(...result.problems);
      }
    }
    log("");
  } catch (err) {
    allProblems.push(`fatal: ${err.message}`);
  } finally {
    if (sidecar?.child) sidecar.child.kill("SIGKILL");
    if (!process.env.KEEP_SCRATCH) {
      try {
        rmSync(scratchRoot, { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    } else {
      log(`KEEP_SCRATCH set — scratch left at ${scratchRoot}\n`);
    }
  }

  const elapsedMs = Number(process.hrtime.bigint() - startedNs) / 1e6;
  const head = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  }).stdout.trim();
  const report = {
    schema: "vegastack-consume-report/v1",
    mode: options.mode,
    startedAt,
    durationMs: Math.round(elapsedMs),
    head,
    status: allProblems.length === 0 ? "pass" : "fail",
    selectedRoots,
    selectedLayouts: selectedLayouts.map((layout) => layout.id),
    exhaustiveRootCount: itemNames.length,
    isolatedReal: realResults,
    isolatedSimulated,
    consolidated,
    collisionProblems: globalCollisionProblems,
    fullOracleExecuted: options.mode === "full",
    shadowOnly: options.mode !== "full",
    reuseEnabled: false,
    evidenceReusable: false,
    receiptWritten: false,
    ciFullOracleRequired: true,
    problems: [...new Set(allProblems)],
  };
  const reportProblems = validateConsumeReport(report, {
    expectedRootCount: itemNames.length,
  });
  allProblems.push(...reportProblems);
  report.problems = [...new Set(allProblems)];
  report.status = report.problems.length === 0 ? "pass" : "fail";
  let reportPath;
  try {
    reportPath = writeConsumeReport(report);
  } catch (error) {
    fail(`structured report write failed: ${error.message}`);
    return 2;
  }

  // ── verdict ─────────────────────────────────────────────────────────────────────────
  log("═".repeat(68));
  if (allProblems.length) {
    fail(`verify-shadcn-consume FAILED — ${allProblems.length} problem(s):`);
    for (const p of allProblems) console.error(`\n${p}`);
    log(`structured report: ${reportPath}`);
    return 1;
  }
  log(
    `✓ verify-shadcn-consume PASSED — ${options.mode} proof is isolated end-to-end:`,
  );
  log(
    `    · real shadcn add   : ${realResults.length}/${selectedRoots.length * selectedLayouts.length} isolated root/layout consumers via the actual CLI ✓`,
  );
  log(
    `    · simulated parity  : ${isolatedSimulated.length}/${selectedRoots.length * selectedLayouts.length} isolated root/layout consumers ✓`,
  );
  if (options.mode === "full")
    log(
      `    · consolidated full: ${consolidated.map((entry) => `${entry.layout} ${entry.provenItems}/${entry.totalItems}`).join(" · ")} ✓`,
    );
  else
    log(
      "    · rollout           : shadow-only diagnostic; no receipt/reuse; CI full oracle remains mandatory (D1)",
    );
  log(
    "  Real CLI proves: registry fetch · registryDependencies install · @ui/… target resolution ·",
  );
  log(
    "  @vegastack/* dep install (local npm registry, pack-based — no publish) · files written · tsc.",
  );
  if (options.mode === "full")
    log(
      "  Simulation proves the SAME across ALL items × both layouts via the shipped verifier + post-write.",
    );
  else
    log(
      "  Simulation proves only the selected isolated roots/layouts; the consolidated full oracle was not executed.",
    );
  log(`  Structured report: ${reportPath}`);
  return 0;
}

const code = await main().catch((err) => {
  console.error(`verify-shadcn-consume crashed: ${err.stack || err.message}`);
  return 2;
});
process.exit(code);
