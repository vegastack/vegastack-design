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
//      data-list→table+checkbox+skeleton+empty-state) we run the ACTUAL shadcn 4.7.0 CLI
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
//      → consumer-layout resolution (shipped `resolveTargetPath`) + `@/`→`~/` alias rewrite +
//      shipped `--post-write` alias-aware verify + one consolidated `tsc --noEmit` per layout.
//      This is breadth; the real `shadcn add` above is the load-bearing depth.
//
// The verdict states BOTH: "real shadcn add: N/N item graphs installed via the CLI ✓" AND
// "simulated coverage: 64/64 × 2 layouts ✓". Exit 0 only when BOTH pass.
//
// NOTHING IS PUBLISH-GATED ANY MORE: the one previously-gated step (npm-install of the
// unpublished @vegastack/*@^0.1.0) is solved LOCALLY via pack + local npm registry. We do NOT
// publish, push, run registry:build, or touch registry item hashes.
//
// Run:  export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node tooling/verify-shadcn-consume.mjs
// Exit: 0 only when the real-shadcn-add representative set AND the all-items×2-layout sim pass.

import { spawnSync, spawn } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const registryDir = join(repoRoot, 'apps/docs/public/r');
const shippedVerifier = join(repoRoot, 'packages/design/bin/verify-registry-item.mjs');
const docsNodeModules = join(repoRoot, 'apps/docs/node_modules');
const tscBin = join(repoRoot, 'node_modules/.bin/tsc');
const shadcnBin = join(docsNodeModules, '.bin/shadcn');

// Import the SHIPPED verifier's canonical logic directly — the SAME functions the bin uses, so
// the simulated path verifies "the same way" the shipped verifier does, in-process.
const { itemHash, resolveTargetPath, readConsumerAliases } = await import(
  pathToFileURL(shippedVerifier).href
);

// Hard caps so the run can NEVER hang — every subprocess gets these.
const SUBPROCESS_TIMEOUT_MS = 60_000;
const KILL = 'SIGKILL';

// Declared @vegastack/* deps across registry items — these must be installable locally for the
// REAL `shadcn add` (verified: items declare exactly @vegastack/design + @vegastack/design-tokens).
const VEGASTACK_DEP_PKGS = [
  { name: '@vegastack/design', dir: join(repoRoot, 'packages/design') },
  { name: '@vegastack/design-tokens', dir: join(repoRoot, 'packages/design-tokens') },
];

// Representative dependency-graph set for the REAL `shadcn add` gate.
//   button         — leaf (no registryDependencies).
//   split-button   — → button + dropdown-menu.
//   data-list      — → table + checkbox + skeleton + empty-state (deep fan-out).
//   field          — hidden-dependency regression guard: must bring input on a clean install.
//   sonner         — dependency-sensitive provider/toaster item.
//   text-edit      — heavy rich-text dependency graph.
//   country-select — search/select graph with popover + command + button.
const REAL_REPRESENTATIVE = [
  'button',
  'split-button',
  'data-list',
  'field',
  'sonner',
  'text-edit',
  'country-select',
];

// The import alias root the SIMULATED path rewrites to (`@/` → `~/`), deliberately different so
// the rewrite + post-write alias-aware compare are genuinely exercised.
const CONSUMER_ALIAS = '~';

// ── the two consumer layouts the SIMULATED path proves (Codex R12: non-default required) ──
const LAYOUTS = [
  {
    name: 'default (components/ui)',
    aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
    tscPaths: { [`${CONSUMER_ALIAS}/*`]: ['./*'] },
    tscInclude: ['components/**/*.ts', 'components/**/*.tsx', 'app/**/*.ts', 'app/**/*.tsx'],
  },
  {
    name: 'non-default (src/components/ui)',
    aliases: { components: 'src/components', utils: 'src/lib/utils', ui: 'src/components/ui', lib: 'src/lib', hooks: 'src/hooks' },
    tscPaths: { [`${CONSUMER_ALIAS}/*`]: ['./src/*'] },
    tscInclude: ['src/**/*.ts', 'src/**/*.tsx', 'app/**/*.ts', 'app/**/*.tsx'],
  },
];

const log = (m) => console.log(m);
const ok = (m) => console.log(`  ✓ ${m}`);
const info = (m) => console.log(`  • ${m}`);
const fail = (m) => console.error(`  ✗ ${m}`);

function readItem(name) {
  const p = join(registryDir, `${name}.json`);
  if (!existsSync(p)) throw new Error(`registry item not found: ${name}.json`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

function allItemNames() {
  const reg = JSON.parse(readFileSync(join(registryDir, 'registry.json'), 'utf8'));
  return reg.items.map((i) => i.name);
}

function depToItemName(dep) {
  return dep.startsWith('@vegastack/') ? dep.slice('@vegastack/'.length) : dep;
}

// Transitively resolve an item + all its registryDependencies (deps before dependents).
function resolveGraph(rootName) {
  const order = [];
  const seen = new Set();
  const visit = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const item = readItem(name);
    for (const dep of item.registryDependencies ?? []) visit(depToItemName(dep));
    order.push(name);
  };
  visit(rootName);
  return order;
}

// shadcn's import-alias rewrite (SIMULATED path): `@/...` → `~/...` inside import/export module
// specifiers only. Symbol only — category+path preserved — the sanctioned transform class.
const SPEC_RE = /(\bfrom\s*|^\s*import\s*|^\s*}\s*from\s*)(['"])(@\/[^'"]*)\2/gm;
function rewriteAliases(content) {
  let count = 0;
  const out = content.replace(SPEC_RE, (_m, head, quote, spec) => {
    count++;
    return `${head}${quote}${CONSUMER_ALIAS}${spec.slice(1)}${quote}`;
  });
  return { out, count };
}

// Run a subprocess with a hard timeout + SIGKILL. Returns { ok, status, signal, out }.
function runCapped(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    timeout: SUBPROCESS_TIMEOUT_MS,
    killSignal: KILL,
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  if (r.signal === KILL || r.error?.code === 'ETIMEDOUT') {
    return { ok: false, status: r.status, signal: r.signal, out: `${out}\n[timed out — killed]` };
  }
  if (r.error) return { ok: false, status: r.status, signal: r.signal, out: `${out}\n[spawn error: ${r.error.message}]` };
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
  const sidecarPath = join(scratchRoot, 'registry-sidecar.mjs');
  writeFileSync(sidecarPath, SIDECAR_SRC);
  return new Promise((resolveServer, reject) => {
    const child = spawn('node', [sidecarPath, registryDir, tarballDir, repoRoot], { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('sidecar did not report ports within 10s'));
    }, 10_000);
    child.stdout.on('data', (d) => {
      buf += d.toString();
      const m = /PORTS (\d+) (\d+)/.exec(buf);
      if (m) {
        clearTimeout(timer);
        resolveServer({ child, componentPort: Number(m[1]), npmPort: Number(m[2]) });
      }
    });
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('exit', (code) => { if (code !== null && code !== 0) reject(new Error(`sidecar exited early (${code})`)); });
  });
}

// `pnpm pack` each declared @vegastack/* dep into <scratch>/.tarballs (the sidecar npm registry
// serves these). Returns { tarballDir, packed: [{name, version}] }.
function packVegastackDeps(scratchRoot) {
  const tarballDir = join(scratchRoot, '.tarballs');
  mkdirSync(tarballDir, { recursive: true });
  const packed = [];
  for (const { name, dir } of VEGASTACK_DEP_PKGS) {
    const r = runCapped('pnpm', ['pack', '--pack-destination', tarballDir], { cwd: dir, timeout: 30_000 });
    if (!r.ok) throw new Error(`pnpm pack ${name} failed:\n${r.out}`);
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const file = join(tarballDir, `vegastack-${name.split('/')[1]}-${manifest.version}.tgz`);
    if (!existsSync(file)) throw new Error(`expected packed tarball missing: ${file}`);
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
  if (got !== item.meta?.integrity) throw new Error(`hash ${got} ≠ meta.integrity ${item.meta?.integrity}`);
  if (got !== manifest[name]) throw new Error(`hash ${got} ≠ manifest[${name}] ${manifest[name]}`);
  return itemText;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// A) THE LOAD-BEARING GATE — REAL `shadcn add`
// ════════════════════════════════════════════════════════════════════════════════════════
// One real scratch consumer; @types pre-installed (offline from cache) so the consumed files
// typecheck; .npmrc → local npm registry; components.json registries → served component registry.
// Run the actual shadcn CLI for each representative graph, assert exit 0 + files written, then
// one tsc over everything. Returns { installed: [{root, files[]}], problems[] }.
function proveRealShadcnAdd(scratchRoot, componentPort, npmPort) {
  const problems = [];
  const consumerRoot = join(scratchRoot, '__real-shadcn');
  mkdirSync(join(consumerRoot, 'components/ui'), { recursive: true });
  mkdirSync(join(consumerRoot, 'lib'), { recursive: true });
  mkdirSync(join(consumerRoot, 'app'), { recursive: true });

  // package.json with @types/react|react-dom|typescript so the consumed files have React types.
  writeFileSync(join(consumerRoot, 'package.json'), JSON.stringify({
    name: 'vega-real-consumer', private: true, version: '0.0.0', type: 'module',
    devDependencies: { '@types/react': '19.2.17', '@types/react-dom': '19.2.3', typescript: '6.0.3' },
  }, null, 2));
  // .npmrc → @vegastack scope resolves from our LOCAL npm registry (the publish-gate solver).
  writeFileSync(join(consumerRoot, '.npmrc'), `@vegastack:registry=http://127.0.0.1:${npmPort}/\n`);
  // tsconfig + global.css shadcn requires; components.json registries → served component registry.
  writeFileSync(join(consumerRoot, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext',
      moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true,
      esModuleInterop: true, noEmit: true, ignoreDeprecations: '6.0',
      baseUrl: '.', paths: { '@/*': ['./*'] },
    },
    include: ['components/**/*.tsx'],
  }, null, 2));
  writeFileSync(join(consumerRoot, 'app/global.css'), '/* tailwind entry */\n');
  writeFileSync(join(consumerRoot, 'components.json'), JSON.stringify({
    $schema: 'https://ui.shadcn.com/schema.json',
    style: 'base-vega', rsc: true, tsx: true,
    tailwind: { config: '', css: 'app/global.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
    iconLibrary: 'lucide',
    aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
    registries: { '@vegastack': { url: `http://127.0.0.1:${componentPort}/r/{name}.json` } },
  }, null, 2));

  // Install @types up front (offline from the pnpm content-addressable store).
  const inst = runCapped('pnpm', ['install'], { cwd: consumerRoot, timeout: 60_000 });
  if (!inst.ok) {
    problems.push(`real-shadcn: pre-install of @types failed\n${inst.out}`);
    return { installed: [], problems };
  }

  const installedGraphs = [];
  for (const name of REAL_REPRESENTATIVE) {
    const before = new Set(safeReaddir(join(consumerRoot, 'components/ui')));
    const r = runCapped(shadcnBin, ['add', `@vegastack/${name}`, '--yes', '--cwd', consumerRoot], { timeout: 60_000 });
    if (!r.ok) {
      problems.push(`real-shadcn: \`shadcn add @vegastack/${name}\` FAILED (exit ${r.status})\n${r.out}`);
      continue;
    }
    // Assert the expected graph files exist on disk at the components.json-resolved target.
    // Components are .tsx; hooks (registry:hook, e.g. use-animation-replay) are plain .ts.
    const expected = resolveGraph(name);
    const missing = expected.filter(
      (n) =>
        !existsSync(join(consumerRoot, 'components/ui', `${n}.tsx`)) &&
        !existsSync(join(consumerRoot, 'components/ui', `${n}.ts`)),
    );
    if (missing.length) {
      problems.push(`real-shadcn: ${name}: CLI exited 0 but expected file(s) missing: ${missing.map((m) => `components/ui/${m}.tsx|.ts`).join(', ')}`);
      continue;
    }
    // Assert the declared @vegastack/* deps were installed from the LOCAL npm registry.
    const depsMissing = VEGASTACK_DEP_PKGS
      .map((p) => p.name)
      .filter((n) => !existsSync(join(consumerRoot, 'node_modules', n, 'package.json')));
    if (depsMissing.length) {
      problems.push(`real-shadcn: ${name}: CLI exited 0 but @vegastack dep(s) not installed: ${depsMissing.join(', ')}`);
      continue;
    }
    const after = safeReaddir(join(consumerRoot, 'components/ui'));
    const newFiles = after.filter((f) => !before.has(f));
    installedGraphs.push({ name, graph: expected, newFiles });
  }

  // One consolidated tsc over ALL real-consumed files (uses the consumer's OWN installed tsc +
  // @types + the @vegastack/design it installed from the local registry).
  if (installedGraphs.length === REAL_REPRESENTATIVE.length) {
    const consumerTsc = join(consumerRoot, 'node_modules/.bin/tsc');
    const tscPath = existsSync(consumerTsc) ? consumerTsc : tscBin;
    const tsc = runCapped(tscPath, ['-p', join(consumerRoot, 'tsconfig.json')], { timeout: 60_000 });
    if (!tsc.ok) problems.push(`real-shadcn: consolidated tsc --noEmit of consumed files FAILED\n${tsc.out}`);
  }

  return { installed: installedGraphs, problems };
}

function safeReaddir(dir) {
  try { return readdirSync(dir); } catch { return []; }
}

// ════════════════════════════════════════════════════════════════════════════════════════
// B) COMPREHENSIVE COVERAGE — SIMULATED consume, all items × one layout
// ════════════════════════════════════════════════════════════════════════════════════════
async function proveLayout(layout, base, manifest, itemNames, scratchRoot) {
  const consumerRoot = join(scratchRoot, 'sim-' + layout.name.replace(/[^a-z0-9]+/gi, '-'));
  mkdirSync(consumerRoot, { recursive: true });
  writeFileSync(
    join(consumerRoot, 'components.json'),
    JSON.stringify({ $schema: 'https://ui.shadcn.com/schema.json', aliases: layout.aliases }, null, 2),
  );
  symlinkSync(docsNodeModules, join(consumerRoot, 'node_modules'), 'dir');
  const consumerAliases = readConsumerAliases(consumerRoot);

  const savedDir = join(consumerRoot, '.verified-items');
  mkdirSync(savedDir, { recursive: true });

  const problems = [];
  let provenItems = 0;
  let rewrites = 0;
  const savedForPostWrite = [];

  for (const rootName of itemNames) {
    let order;
    try {
      order = resolveGraph(rootName);
    } catch (err) {
      problems.push(`[${layout.name}] ${rootName}: graph resolution failed: ${err.message}`);
      continue;
    }
    let itemFailed = false;
    for (const name of order) {
      let itemText;
      try {
        itemText = await preflightIntegrity(base, name, manifest);
      } catch (err) {
        problems.push(`[${layout.name}] ${rootName}/${name}: integrity preflight FAILED — ${err.message}`);
        itemFailed = true;
        break;
      }
      const savedItemPath = join(savedDir, `${name}.json`);
      writeFileSync(savedItemPath, itemText);
      const verifiedItem = JSON.parse(itemText);
      for (const file of verifiedItem.files ?? []) {
        if (typeof file.content !== 'string') continue;
        const { out, count } = rewriteAliases(file.content);
        rewrites += count;
        const dest = resolveTargetPath(file, consumerRoot, consumerAliases);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, out);
      }
      if (!savedForPostWrite.some((s) => s.name === name)) savedForPostWrite.push({ name, savedItemPath });
    }
    if (itemFailed) continue;
    provenItems++;
  }

  for (const { name, savedItemPath } of savedForPostWrite) {
    const r = runCapped('node', [shippedVerifier, '--post-write', '--item', savedItemPath, '--target-dir', consumerRoot]);
    if (!r.ok) problems.push(`[${layout.name}] ${name}: shipped-verifier POST-WRITE FAILED\n${r.out}`);
  }

  const tsconfig = {
    compilerOptions: {
      target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext',
      moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true,
      esModuleInterop: true, resolveJsonModule: true, isolatedModules: true, noEmit: true,
      ignoreDeprecations: '6.0', paths: layout.tscPaths,
    },
    include: layout.tscInclude,
  };
  writeFileSync(join(consumerRoot, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
  const tsc = runCapped(tscBin, ['-p', join(consumerRoot, 'tsconfig.json')]);
  if (!tsc.ok) problems.push(`[${layout.name}] consolidated tsc --noEmit FAILED\n${tsc.out}`);

  return { provenItems, totalItems: itemNames.length, rewrites, tscOk: tsc.ok, installed: savedForPostWrite.length, problems };
}

async function main() {
  log('verify-shadcn-consume — local end-to-end consumability proof\n');
  log(`registry source : ${registryDir}`);
  log(`shipped verifier: ${shippedVerifier}`);
  log(`shadcn CLI      : ${shadcnBin}\n`);

  for (const f of [registryDir, shippedVerifier, docsNodeModules, tscBin, shadcnBin]) {
    if (!existsSync(f)) {
      fail(`prerequisite missing: ${f}`);
      fail('run `pnpm install` and `pnpm registry:build` first (Node 24).');
      return 2;
    }
  }

  const itemNames = allItemNames();
  const scratchRoot = mkdtempSync(join(tmpdir(), 'vega-consume-'));
  let sidecar;
  const allProblems = [];
  let realResult = { installed: [], problems: ['real-shadcn: did not run'] };
  const simSummaries = [];

  try {
    // ── pack @vegastack/* deps + start the SIDECAR registry process ──
    log('── preparing local install path (no publish) ' + '─'.repeat(20));
    const { tarballDir, packed } = packVegastackDeps(scratchRoot);
    ok(`pnpm pack → ${packed.map((p) => `${p.name}@${p.version}`).join(', ')} (local tarballs)`);

    sidecar = await startSidecar(scratchRoot, tarballDir);
    const componentPort = sidecar.componentPort;
    const npmPort = sidecar.npmPort;
    ok(`sidecar registry process up — component registry on :${componentPort}  ·  local npm registry on :${npmPort}`);
    const base = `http://127.0.0.1:${componentPort}`;
    log('');

    // ── A) REAL shadcn add (the load-bearing gate) ──
    log('── REAL `shadcn add` (load-bearing gate — Codex R13) ' + '─'.repeat(12));
    info(`representative graphs: ${REAL_REPRESENTATIVE.join(', ')}`);
    realResult = proveRealShadcnAdd(scratchRoot, componentPort, npmPort);
    for (const g of realResult.installed) {
      ok(`shadcn add @vegastack/${g.name} → CLI exit 0 · wrote [${g.newFiles.join(', ')}] · @vegastack/* installed from local registry`);
    }
    if (realResult.problems.length === 0) {
      ok(`real shadcn add: ${realResult.installed.length}/${REAL_REPRESENTATIVE.length} item graphs installed via the CLI + consumed files tsc ✓`);
    } else {
      fail(`real shadcn add FAILED (${realResult.installed.length}/${REAL_REPRESENTATIVE.length} graphs ok)`);
    }
    allProblems.push(...realResult.problems);
    log('');

    // ── B) SIMULATED comprehensive coverage (all items × both layouts) ──
    log('── SIMULATED coverage (all items × both layouts) ' + '─'.repeat(15));
    const manifest = await fetch(`${base}/integrity-manifest.json`).then((r) => {
      if (!r.ok) throw new Error(`fetch integrity-manifest.json → HTTP ${r.status}`);
      return r.json();
    });
    for (const layout of LAYOUTS) {
      const res = await proveLayout(layout, base, manifest, itemNames, scratchRoot);
      simSummaries.push({ layout: layout.name, ...res });
      const status = res.provenItems === res.totalItems && res.tscOk && !res.problems.length ? '✓' : '✗';
      const logFn = status === '✓' ? ok : fail;
      logFn(`${layout.name}: ${res.provenItems}/${res.totalItems} graphs · ${res.installed} files · ` +
        `${res.rewrites} alias rewrites · post-write ${res.problems.some((p) => p.includes('POST-WRITE')) ? '✗' : '✓'} · tsc ${res.tscOk ? '✓' : '✗'}`);
      allProblems.push(...res.problems);
    }
    log('');
  } catch (err) {
    allProblems.push(`fatal: ${err.message}`);
  } finally {
    if (sidecar?.child) sidecar.child.kill('SIGKILL');
    if (!process.env.KEEP_SCRATCH) {
      try { rmSync(scratchRoot, { recursive: true, force: true }); } catch { /* best effort */ }
    } else {
      log(`KEEP_SCRATCH set — scratch left at ${scratchRoot}\n`);
    }
  }

  // ── verdict ─────────────────────────────────────────────────────────────────────────
  log('═'.repeat(68));
  if (allProblems.length) {
    fail(`verify-shadcn-consume FAILED — ${allProblems.length} problem(s):`);
    for (const p of allProblems) console.error(`\n${p}`);
    return 1;
  }
  const totalItems = simSummaries[0]?.totalItems ?? 0;
  log('✓ verify-shadcn-consume PASSED — registry is consumable end-to-end:');
  log(`    · real shadcn add   : ${realResult.installed.length}/${REAL_REPRESENTATIVE.length} item graphs installed via the actual CLI ✓`);
  log(`                          (${REAL_REPRESENTATIVE.join(', ')}; @vegastack/* installed from a local npm registry — no publish)`);
  log(`    · simulated coverage: ${totalItems}/${totalItems} items × ${LAYOUTS.length} layouts ✓`);
  for (const s of simSummaries) log(`                          - ${s.layout}: ${s.provenItems}/${s.totalItems} · ${s.installed} files · tsc ✓`);
  log('  Real CLI proves: registry fetch · registryDependencies install · @ui/… target resolution ·');
  log('  @vegastack/* dep install (local npm registry, pack-based — no publish) · files written · tsc.');
  log('  Simulation proves the SAME across ALL items × both layouts via the shipped verifier + post-write.');
  return 0;
}

const code = await main().catch((err) => {
  console.error(`verify-shadcn-consume crashed: ${err.stack || err.message}`);
  return 2;
});
process.exit(code);
