#!/usr/bin/env node
// vegastack-design check-updates — show which copied-in VegaStack components have a newer version
// published in the registry, so you know what to re-pull. shadcn registries are copy-in ("you own
// the code") with NO automatic updates; this turns that into a single command.
//
// HOW IT WORKS (one network request):
//   1. Resolve the @vegastack registry url + auth headers from components.json (or env).
//   2. Scan the components dir for files carrying the provenance header the registry stamps:
//        // @vegastack <name>@<version> sha256-<integrity>
//      That header IS the version pin recorded at copy-in time.
//   3. Fetch the registry INDEX once (…/registry.json) — every item carries meta.version + meta.integrity.
//   4. Compare BY HASH (not version number): if the published integrity differs from the one in your
//      header, that component changed → an update is available. (Comparing by hash avoids false
//      "update" noise when the global version bumps but a given component's content didn't change.)
//
// It does NOT detect local edits to a component's body (the header is the PUBLISHED hash, not a hash
// of your current file) — that is what `vegastack-design verify --post-write` is for. The footer
// reminds you to `git diff` before `--overwrite`.
//
// Usage:
//   npx vegastack-design check-updates
//   npx vegastack-design check-updates --filter button,dialog --json
//   npx vegastack-design check-updates --fail-on-update     # CI drift gate (exit 1 if stale)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const PROVENANCE_RE = /^\/\/ @vegastack (\S+)@(\S+) sha256-([A-Za-z0-9+/=]+)/;
const DEFAULT_REGISTRY = 'https://design.vegastack.com/r';
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', '.turbo', 'out']);

const USAGE = `vegastack-design check-updates — show which copied-in components have newer registry versions

Usage: vegastack-design check-updates [options]

Options:
  --dir <path>        Components directory (default: components.json aliases.ui, else components/ui)
  --filter <names>    Comma-separated component names (supports * globs)
  --json              Machine-readable output
  --fail-on-update    Exit 1 if any component has an update (for CI)
  --registry <url>    Override registry URL template (…/{name}.json)
  --cwd <path>        Project root holding components.json (default: cwd)
  --no-color          Disable ANSI colors
  -h, --help          Show this help

Config: reads the @vegastack registry url + headers from components.json; \${ENV} placeholders expand
from .env.local / .env or the shell; falls back to VEGASTACK_REGISTRY + CF_ACCESS_CLIENT_ID/SECRET.`;

// ── arg parsing ────────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { filter: null, json: false, failOnUpdate: false, noColor: false, dir: null, cwd: '.', registry: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--json') out.json = true;
    else if (a === '--fail-on-update') out.failOnUpdate = true;
    else if (a === '--no-color') out.noColor = true;
    else if (a === '--dir') out.dir = argv[++i];
    else if (a === '--cwd') out.cwd = argv[++i];
    else if (a === '--registry') out.registry = argv[++i];
    else if (a === '--filter') out.filter = argv[++i];
    else throw new UsageError(`unknown option: ${a}`);
  }
  return out;
}
class UsageError extends Error {}

// ── env expansion + config resolution ────────────────────────────────────────────────────────────
// shadcn expands ${VAR} in components.json from .env.local/.env too, so we load them (process/shell
// env still wins) — otherwise the gated prod registry would 403 here while `shadcn add` succeeds.
let ENV = process.env;
function loadEnv(cwd) {
  const merged = {};
  for (const f of ['.env', '.env.local']) {
    let txt;
    try {
      txt = readFileSync(join(cwd, f), 'utf8');
    } catch {
      continue;
    }
    for (const raw of txt.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      merged[key] = val;
    }
  }
  return { ...merged, ...process.env }; // process/shell env wins (dotenv semantics)
}

const missingEnv = new Set();
function expandEnv(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([A-Z0-9_]+)\}/gi, (_, name) => {
    const v = ENV[name];
    if (v == null || v === '') missingEnv.add(name);
    return v ?? '';
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function envHeaders() {
  const h = {};
  if (ENV.CF_ACCESS_CLIENT_ID) h['CF-Access-Client-Id'] = ENV.CF_ACCESS_CLIENT_ID;
  if (ENV.CF_ACCESS_CLIENT_SECRET) h['CF-Access-Client-Secret'] = ENV.CF_ACCESS_CLIENT_SECRET;
  return h;
}

// Resolve { urlTemplate, headers } in precedence order: --registry > components.json > env.
function resolveRegistry(opts, componentsJson) {
  if (opts.registry) {
    return { urlTemplate: opts.registry, headers: envHeaders() };
  }
  const reg = componentsJson?.registries?.['@vegastack'];
  if (reg) {
    if (typeof reg === 'string') return { urlTemplate: expandEnv(reg), headers: {} };
    const headers = {};
    for (const [k, v] of Object.entries(reg.headers ?? {})) headers[k] = expandEnv(v);
    return { urlTemplate: expandEnv(reg.url), headers };
  }
  return { urlTemplate: `${(ENV.VEGASTACK_REGISTRY ?? DEFAULT_REGISTRY).replace(/\/$/, '')}/{name}.json`, headers: envHeaders() };
}

// Turn an item-url template into the index url: replace {name}→registry, else append /registry.json.
function indexUrl(urlTemplate) {
  if (urlTemplate.includes('{name}')) return urlTemplate.replace('{name}', 'registry');
  return `${urlTemplate.replace(/\/$/, '')}/registry.json`;
}

// ── components dir + scan ──────────────────────────────────────────────────────────────────────
function resolveComponentsDir(cwd, dirFlag, componentsJson) {
  if (dirFlag) return resolve(cwd, dirFlag);
  const ui = componentsJson?.aliases?.ui;
  const rel = ui ? ui.replace(/^@\//, '').replace(/^~\//, '') : 'components/ui';
  const direct = resolve(cwd, rel); // assumes @/ = project root
  if (existsSync(direct)) return direct;
  const srcVariant = resolve(cwd, 'src', rel); // common alias: @/* -> src/*
  if (existsSync(srcVariant)) return srcVariant;
  return direct; // documented default; "none found" message hints --dir
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

function readHeader(file) {
  let firstLine = '';
  try {
    const fd = readFileSync(file, 'utf8');
    firstLine = fd.slice(0, fd.indexOf('\n') === -1 ? fd.length : fd.indexOf('\n'));
  } catch {
    return null;
  }
  const m = PROVENANCE_RE.exec(firstLine);
  return m ? { name: m[1], version: m[2], hash: `sha256-${m[3]}`, file } : null;
}

function globToRe(pattern) {
  return new RegExp('^' + pattern.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
}

// ── colors ─────────────────────────────────────────────────────────────────────────────────────
function makeColor(enabled) {
  const wrap = (code) => (s) => (enabled ? `[${code}m${s}[0m` : s);
  return { yellow: wrap(33), green: wrap(32), dim: wrap(2), bold: wrap(1), red: wrap(31) };
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────
export async function main(argv) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(err.message + '\n');
    console.error(USAGE);
    return 2;
  }
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }

  const cwd = resolve(opts.cwd);
  ENV = loadEnv(cwd); // pick up .env.local / .env (shadcn does the same)
  const color = makeColor(process.stdout.isTTY && !opts.noColor && !process.env.NO_COLOR);

  // components.json (optional when --registry + --dir are both given)
  let componentsJson = null;
  const cjPath = join(cwd, 'components.json');
  if (existsSync(cjPath)) {
    try {
      componentsJson = readJson(cjPath);
    } catch (err) {
      console.error(`✗ could not parse ${cjPath}: ${err.message}`);
      return 2;
    }
  } else if (!opts.registry || !opts.dir) {
    console.error(`✗ no components.json found at ${cjPath} (need it for the registry config + components dir, or pass --registry and --dir)`);
    return 2;
  }

  const { urlTemplate, headers } = resolveRegistry(opts, componentsJson);
  const idxUrl = indexUrl(urlTemplate);
  const dir = resolveComponentsDir(cwd, opts.dir, componentsJson);

  // scan for installed VegaStack components
  let installed = walk(dir).map(readHeader).filter(Boolean);
  if (opts.filter) {
    const res = opts.filter.split(',').map((s) => globToRe(s.trim()));
    installed = installed.filter((c) => res.some((re) => re.test(c.name)));
  }
  if (installed.length === 0) {
    if (opts.json) console.log(JSON.stringify({ registry: idxUrl, checked: 0, updates: 0, items: [] }, null, 2));
    else console.log(`No VegaStack components found in ${dir}. (Add some with \`shadcn add @vegastack/<name>\`.)`);
    return 0;
  }

  // fetch the registry index once
  let index;
  try {
    const res = await fetch(idxUrl, { headers });
    if (!res.ok) {
      console.error(`✗ registry index fetch failed: HTTP ${res.status} ${res.statusText} (${idxUrl})`);
      if (missingEnv.size) console.error(`  hint: these auth env vars are unset: ${[...missingEnv].join(', ')}`);
      return 2;
    }
    index = await res.json();
  } catch (err) {
    console.error(`✗ could not reach the registry at ${idxUrl}: ${err.message}`);
    return 2;
  }
  const remote = new Map();
  for (const item of index.items ?? []) remote.set(item.name, { version: item.meta?.version, integrity: item.meta?.integrity });

  // compare by hash
  const rows = installed
    .map((c) => {
      const r = remote.get(c.name);
      let status;
      if (!r) status = 'missing';
      else if (r.integrity && c.hash === r.integrity) status = 'current';
      else status = 'update';
      return { name: c.name, current: c.version, latest: r?.version ?? null, status };
    })
    .sort((a, b) => {
      const rank = { update: 0, current: 1, missing: 2 };
      return rank[a.status] - rank[b.status] || a.name.localeCompare(b.name);
    });

  const updates = rows.filter((r) => r.status === 'update');

  if (opts.json) {
    console.log(JSON.stringify({ registry: idxUrl, checked: rows.length, updates: updates.length, items: rows }, null, 2));
    return opts.failOnUpdate && updates.length ? 1 : 0;
  }

  // human table
  const host = (() => {
    try {
      return new URL(idxUrl).host + new URL(idxUrl).pathname.replace(/\/registry\.json$/, '');
    } catch {
      return idxUrl;
    }
  })();
  console.log(`\nChecking ${rows.length} VegaStack component(s) against ${host} …\n`);
  const nameW = Math.max(...rows.map((r) => r.name.length), 4);
  const GLYPH = { update: color.yellow('⬆'), current: color.green('✓'), missing: color.dim('?') };
  for (const r of rows) {
    const ver = r.status === 'update' ? `${r.current} → ${r.latest ?? '?'}` : r.current;
    const note =
      r.status === 'update' ? color.yellow('update available') :
      r.status === 'current' ? color.dim('up to date') :
      color.dim('not in registry (renamed/removed)');
    console.log(`  ${GLYPH[r.status]}  ${r.name.padEnd(nameW)}  ${ver.padEnd(16)}  ${note}`);
  }
  console.log('');
  if (updates.length) {
    const first = updates[0].name;
    console.log(color.bold(`${updates.length} update(s) available.`) + ' Review & apply (repeat per component):');
    console.log(`  npx shadcn@latest add @vegastack/${first} --diff`);
    console.log(`  npx shadcn@latest add @vegastack/${first} --overwrite`);
    console.log(color.dim('\nNote: --overwrite replaces files; if you customized a component, git diff first.'));
  } else {
    console.log(color.green('Everything is up to date.'));
  }

  return opts.failOnUpdate && updates.length ? 1 : 0;
}

// standalone execution (so `node check-updates.mjs` works; the dispatcher imports main() instead)
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href || basename(process.argv[1] ?? '') === 'check-updates.mjs') {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
