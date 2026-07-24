#!/usr/bin/env node
// vegastack-design verify — fail-closed registry trust preflight for consumers.
//
// Run this BEFORE `shadcn add @vegastack/<name>` to prove the registry item you are
// about to copy in is the exact artifact VegaStack published — AND run it again
// (--post-write) AFTER `shadcn add` to prove the files copied onto your disk are
// byte-faithful to that exact verified item. The post-write pass is what closes the
// time-of-check/time-of-use (TOCTOU) window: `shadcn add` re-fetches the item from the
// registry, so a registry compromised/changed BETWEEN the preflight and the copy-in
// would otherwise be undetected. Comparing the copied files against the bytes we
// hash/signature-verified — not a re-fetch — slams that window shut.
//
// This is the SHIPPED, self-contained verifier delivered as a `bin` from the public
// `@vegastack/design` package. It has NO repo-relative imports — the canonical item-hash
// logic is inlined below and is kept byte-for-byte identical to the repo source of truth
// (tooling/registry-hash.mjs). Consumers have no `tooling/` dir, so they MUST use this.
//
// Modes:
//   • full (default)  — verify the Sigstore-signed manifest against the pinned GitHub
//                       OIDC release identity (via `cosign verify-blob`), THEN recompute
//                       and compare the item hash. Aborts on signature OR hash mismatch.
//                       Requires the deployed signed manifest + the `cosign` CLI.
//   • --hash-only     — SKIP the cosign signature step; ONLY fetch the manifest and verify
//                       the item hash against it (and against the item's own meta.integrity).
//                       For local dev / environments without cosign or before the signed
//                       manifest is deployed. This trusts the manifest's transport; it does
//                       NOT prove provenance — use full mode for the real trust boundary.
//   • --post-write    — OFFLINE. No network. Re-read a PREVIOUSLY verified item JSON saved
//                       by a prior pre-write run (--item) and compare every file in it
//                       against the file `shadcn add` actually wrote on disk (located via
//                       the item's `target`, rooted at --target-dir). Fail-closed on ANY
//                       byte mismatch, modulo the narrowly modeled transforms shadcn applies
//                       (leading-comment removal + configured alias rewriting — see below).
//                       This is the TOCTOU closer.
//
// Pre-write modes (full / --hash-only) accept --save <path> to persist the EXACT verified
// item bytes for the post-write pass. Without --save they default to a private temp file. The
// printed post-write command includes an independently retained expected integrity so a local
// replacement of the saved item cannot be authenticated by changing its self-hash too.
//
// Usage:
//   # 1) pre-write: verify + SAVE the trusted item bytes
//   VERIFY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vegastack-verify.XXXXXX")"
//   SAVE_PATH="$VERIFY_DIR/button.json" # must not already exist
//   npx --package=@vegastack/design vegastack-design verify --hash-only --save "$SAVE_PATH" button
//   # 2) retain the printed expected integrity; shadcn add @vegastack/button
//   # 3) run the exact integrity-pinned post-write command printed by step 1
//   vegastack-design verify --help
//
// Env:
//   VEGASTACK_REGISTRY        registry base URL (default https://design.vegastack.com/r)
//   CF_ACCESS_CLIENT_ID       Cloudflare Access service-token id (registry is service-token-only)
//   CF_ACCESS_CLIENT_SECRET   Cloudflare Access service-token secret
//   VEGASTACK_SIGNER_REPO     OIDC signer repo  (default vegastack/vegastack-design)  [full mode]
//   VEGASTACK_SIGNER_REF      OIDC signer ref   (default refs/heads/main)             [full mode]
import { execFileSync } from "node:child_process";
import {
  closeSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { join, resolve, basename, relative, isAbsolute, sep } from "node:path";
import { createHash } from "node:crypto";
import tsconfigPaths from "tsconfig-paths";

const { loadConfig: loadTsconfigPaths } = tsconfigPaths;

// ── canonical item hash (INLINED from tooling/registry-hash.mjs — keep IDENTICAL) ──
// Covers the WHOLE item (not just file content); meta.integrity is excluded so the hash
// is self-describing and stable. The provenance header (`// @vegastack <name>@<version>
// sha256-<sha>`, requirements §157.3) is line 1 of every shipped file — including this item's
// `files[].content` and the file shadcn copies on disk. Because that header EMBEDS the item's
// own sha, the hash MUST be computed over the HEADERLESS content (strip the header line + its
// blank separator); otherwise the embedded sha could never equal the hash. The post-write
// compare sees the header in BOTH the saved item content and the copied file, so it still
// matches line-for-line.
const PROVENANCE_HEADER_RE = /^\/\/ @vegastack \S+@\S+ sha256-\S+\n(?:\n)?/;

function stripProvenanceHeader(content) {
  if (typeof content !== "string") return content;
  return content.replace(PROVENANCE_HEADER_RE, "");
}

function canonical(o) {
  if (Array.isArray(o)) return o.map(canonical);
  if (o && typeof o === "object") {
    return Object.fromEntries(
      Object.keys(o)
        .sort()
        .map((k) => [k, canonical(o[k])]),
    );
  }
  return o;
}

function itemHash(item) {
  const { meta = {}, files, ...rest } = item;
  const m = { ...meta };
  delete m.integrity;
  const f = Array.isArray(files)
    ? files.map((file) =>
        file && typeof file === "object" && "content" in file
          ? { ...file, content: stripProvenanceHeader(file.content) }
          : file,
      )
    : files;
  return (
    "sha256-" +
    createHash("sha256")
      .update(
        JSON.stringify(
          canonical({
            ...rest,
            ...(f !== undefined ? { files: f } : {}),
            meta: m,
          }),
        ),
      )
      .digest("base64")
  );
}
// ───────────────────────────────────────────────────────────────────────────────────

const DEFAULT_REGISTRY = "https://design.vegastack.com/r";
const DEFAULT_TRUSTED_REGISTRY_ORIGIN = new URL(DEFAULT_REGISTRY).origin;
const REQUEST_TIMEOUT_MS = 15_000;
const ITEM_NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INTEGRITY_RE = /^sha256-[A-Za-z0-9+/]{43}=$/;

function assertItemName(name) {
  if (!ITEM_NAME_RE.test(name)) {
    throw new Error(`invalid registry item name: ${name}`);
  }
  return name;
}

function requestHeaders() {
  return Object.fromEntries(
    Object.entries({
      "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
      "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
    }).filter(([, value]) => value != null && value !== ""),
  );
}

/**
 * Credential material that must never appear in a request URL or in printed output. Kept in step
 * with the same defense in check-updates.mjs: the trusted-origin check below is scoped to requests
 * that carry credential HEADERS, so a URL carrying the token in a query string bypassed it entirely
 * and was fetched — and then echoed into logs. Credentials belong in headers; a URL is recorded in
 * server access logs, proxy logs and CDN caches even when the origin is fully trusted.
 *
 * This CLI takes its base URL from VEGASTACK_REGISTRY (process env only, never components.json),
 * so the bar is higher here than in check-updates — but the two published entrypoints must not
 * diverge on a security boundary.
 */
const MIN_SECRET_LENGTH = 8;
function secretValues() {
  const out = new Map();
  for (const name of ["CF_ACCESS_CLIENT_SECRET", "CF_ACCESS_CLIENT_ID"]) {
    const v = process.env[name];
    if (typeof v === "string" && v.length >= MIN_SECRET_LENGTH)
      out.set(v, `\${${name}}`);
  }
  return out;
}

function redact(text) {
  let out = String(text);
  for (const [secret, placeholder] of secretValues()) {
    out = out.split(secret).join(placeholder);
    const encoded = encodeURIComponent(secret);
    if (encoded !== secret) out = out.split(encoded).join(placeholder);
  }
  return out;
}

function assertNoSecretInUrl(url) {
  const text = String(url);
  for (const [secret, placeholder] of secretValues()) {
    const encoded = encodeURIComponent(secret);
    if (
      text.includes(secret) ||
      (encoded !== secret && text.includes(encoded))
    ) {
      throw new Error(
        `refusing to put ${placeholder} in a registry URL — credentials must be sent as headers, ` +
          `never in a URL (URLs are recorded in access, proxy, and CDN logs). ` +
          `Remove it from VEGASTACK_REGISTRY.`,
      );
    }
  }
}

function assertRegistryRequest(url, headers) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`registry URL is invalid: ${redact(url)}`);
  }
  if (parsed.username || parsed.password) {
    throw new Error("registry URL must not contain embedded credentials");
  }
  // Unconditional, and BEFORE the header-scoped origin check: a URL-borne secret leaks even to a
  // fully trusted origin, and an uncredentialed request skips everything below.
  assertNoSecretInUrl(url);
  if (Object.keys(headers).length === 0) return parsed;

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

async function fetchRegistryText(url, headers, label) {
  assertRegistryRequest(url, headers);
  let response;
  try {
    response = await fetch(url, {
      headers,
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new RegistryAccessError(`${label} request failed: ${error.message}`);
  }
  if (!response.ok) {
    throw new RegistryAccessError(
      `${label} fetch failed: HTTP ${response.status} ${response.statusText}`,
    );
  }
  return response.text();
}

class RegistryAccessError extends Error {}

function assertPathInside(root, candidate, label = "registry target") {
  const rootPath = resolve(root);
  const candidatePath = resolve(candidate);
  const rel = relative(rootPath, candidatePath);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${label} escapes the consumer root: ${candidate}`);
  }
  return candidatePath;
}

function assertExistingPathInside(root, candidate, label = "registry target") {
  const lexicalRoot = resolve(root);
  const lexicalCandidate = assertPathInside(lexicalRoot, candidate, label);
  const rel = relative(lexicalRoot, lexicalCandidate);
  let cursor = lexicalRoot;
  for (const segment of rel.split(sep)) {
    cursor = resolve(cursor, segment);
    if (lstatSync(cursor).isSymbolicLink()) {
      throw new Error(`${label} traverses a symlink: ${cursor}`);
    }
  }
  return assertPathInside(
    realpathSync(lexicalRoot),
    realpathSync(lexicalCandidate),
    label,
  );
}

function writeNewPrivateFile(filePath, contents) {
  // Exclusive creation refuses an existing file or final-component symlink. A normal write to a
  // predictable path in a shared temp directory could otherwise follow an attacker-created link.
  let descriptor;
  try {
    descriptor = openSync(filePath, "wx", 0o600);
    writeFileSync(descriptor, contents);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

// Single chokepoint for printed output: control-character scrub AND secret redaction, so no
// future call site can reintroduce a credential leak by forgetting to wrap its argument.
function terminalText(value) {
  return redact(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, "\uFFFD");
}

function shellArg(value) {
  return `'${terminalText(value).replaceAll("'", "'\\''")}'`;
}

// ── post-write file comparison (alias-rewrite-aware, fail-closed) ────────────────────
//
// GUARANTEE: comparePostWrite proves the file `shadcn add` wrote on disk is byte-identical
// to the file embedded in the (already hash+signature-verified) registry item, EXCEPT for
// the two transforms shadcn is allowed to apply on JS/TS copy-in: removing the contiguous leading
// comment/whitespace prologue for transformed file types and rewriting canonical imports to the
// exact aliases in the consumer's components.json. Every remaining non-import line must match
// byte-for-byte. An import (or
// `export … from`) line may differ only in its module specifier and only when the result equals
// the components.json-derived rewrite. Anything else — an arbitrary alternate alias root, a
// repointed import, changed bindings, a changed bare/relative specifier, any altered non-import
// line, a missing file, or a line-count change after the allowed prologue — is a mismatch and fails
// closed. Raw registry:file entries do not receive the comment transform.

// shadcn rewrites the registry's canonical aliases to the EXACT aliases declared by the consumer.
// Longest prefixes win (`@/components/ui` before `@/components`, `@/lib/utils` before `@/lib`).
// Accepting an arbitrary `@/` → `~/` symbol swap is unsafe: those symbols may resolve to different
// trees in the consumer's tsconfig. The local components.json is therefore the transformation spec.
const REGISTRY_ALIAS_RULES = [
  ["@/components/ui", "ui"],
  ["@/lib/utils", "utils"],
  ["@/components", "components"],
  ["@/registry", "registry"],
  ["@/hooks", "hooks"],
  ["@/utils", "utils"],
  ["@/lib", "lib"],
  ["@/ui", "ui"],
];

function rewriteRegistrySpecifier(specifier, aliases = {}) {
  for (const [canonicalPrefix, aliasName] of REGISTRY_ALIAS_RULES) {
    if (
      specifier !== canonicalPrefix &&
      !specifier.startsWith(`${canonicalPrefix}/`)
    )
      continue;
    const configured = aliases[aliasName];
    if (typeof configured !== "string" || configured.length === 0)
      return specifier;
    return (
      configured.replace(/\/$/, "") + specifier.slice(canonicalPrefix.length)
    );
  }
  return specifier;
}

function isSanctionedAliasRewrite(expSpec, actSpec, aliases = {}) {
  return (
    expSpec !== actSpec &&
    rewriteRegistrySpecifier(expSpec, aliases) === actSpec
  );
}

const MODULE_SPECIFIER_RE =
  /((?:\bfrom\s*|^\s*import\s*|^\s*}\s*from\s*|import\(\s*|require\(\s*))(['"])(@\/[^'"]*)\2/gm;
function rewriteRegistryAliases(content, aliases = {}) {
  return content.replace(
    MODULE_SPECIFIER_RE,
    (match, head, quote, specifier) => {
      const rewritten = rewriteRegistrySpecifier(specifier, aliases);
      return `${head}${quote}${rewritten}${quote}`;
    },
  );
}

// Pull the module specifier out of an `import … from '<spec>'`, a side-effect
// `import '<spec>'`, or an `export … from '<spec>'` line. Returns null if the line is not
// such a statement. We match the LAST quoted string after a `from`/bare-import keyword so
// the rest of the line (identifiers, type-modifiers, etc.) is compared literally.
const IMPORT_FROM_RE =
  /^(\s*(?:import|export)\b[\s\S]*?\bfrom\s*)(['"])([^'"]*)\2(\s*;?\s*)$/;
const IMPORT_BARE_RE = /^(\s*import\s*)(['"])([^'"]*)\2(\s*;?\s*)$/;
// MULTILINE import/export: the CLOSING line `} from '<spec>';` (the named bindings span the prior
// lines — which shadcn never rewrites and so compare literally — while ONLY this closing line carries
// the rewritten module specifier). Without this, the rewritten specifier on a multiline import's
// closing line is misread as a non-import mutation and a legitimate alias rewrite fails the verifier.
const IMPORT_CLOSE_RE = /^(\s*}\s*from\s*)(['"])([^'"]*)\2(\s*;?\s*)$/;

function parseImportLine(line) {
  let m = IMPORT_FROM_RE.exec(line);
  if (m) return { head: m[1], quote: m[2], spec: m[3], tail: m[4] };
  m = IMPORT_BARE_RE.exec(line);
  if (m) return { head: m[1], quote: m[2], spec: m[3], tail: m[4] };
  m = IMPORT_CLOSE_RE.exec(line);
  if (m) return { head: m[1], quote: m[2], spec: m[3], tail: m[4] };
  return null;
}

const JAVASCRIPT_LIKE_RE = /\.[cm]?[jt]sx?$/i;
const SHADCN_TRANSFORMED_FILE_TYPES = new Set([
  "registry:ui",
  "registry:hook",
  "registry:page",
  "registry:component",
]);

/**
 * Model the real shadcn transform narrowly: for JavaScript/TypeScript-family files only, it removes
 * the complete leading trivia prologue when that prologue contains at least one line or block
 * comment. Stop at the first non-trivia byte. An unterminated block comment is not sanctioned.
 */
function stripShadcnLeadingCommentPrologue(
  content,
  label = "",
  fileType = "registry:ui",
) {
  if (
    !JAVASCRIPT_LIKE_RE.test(label) ||
    !SHADCN_TRANSFORMED_FILE_TYPES.has(fileType)
  )
    return content;
  let cursor = 0;
  let sawComment = false;
  while (cursor < content.length) {
    while (/\s/.test(content[cursor] ?? "")) cursor++;
    if (content.startsWith("//", cursor)) {
      sawComment = true;
      const newline = content.indexOf("\n", cursor + 2);
      cursor = newline === -1 ? content.length : newline + 1;
      continue;
    }
    if (content.startsWith("/*", cursor)) {
      const close = content.indexOf("*/", cursor + 2);
      if (close === -1) return content;
      sawComment = true;
      cursor = close + 2;
      continue;
    }
    break;
  }
  return sawComment ? content.slice(cursor) : content;
}

// Compare one expected (registry) file against the on-disk copied file. Returns an array
// of human-readable mismatch strings (empty array = byte-faithful modulo modeled shadcn transforms).
function compareFile(
  expectedContent,
  actualContent,
  label,
  aliases = {},
  fileType = "registry:ui",
) {
  const problems = [];
  // Prefer the exact source. If it differs, permit only the real shadcn leading-comment prologue
  // removal for JS/TS-family files; internal/trailing comments remain part of the exact comparison.
  const strippedExpected = stripShadcnLeadingCommentPrologue(
    expectedContent,
    label,
    fileType,
  );
  const comparableExpected =
    expectedContent === actualContent ? expectedContent : strippedExpected;
  // Normalize nothing — we compare raw. shadcn writes content verbatim except for alias
  // rewriting, so a trailing-newline / CRLF difference IS a real difference worth flagging.
  const expLines = comparableExpected.split("\n");
  const actLines = actualContent.split("\n");
  if (expLines.length !== actLines.length) {
    problems.push(
      `${label}: line count differs (item has ${expLines.length}, on-disk has ${actLines.length}) after allowed leading-comment removal — not an alias rewrite`,
    );
    return problems;
  }
  for (let i = 0; i < expLines.length; i++) {
    const exp = expLines[i];
    const act = actLines[i];
    if (exp === act) continue;

    const expImp = parseImportLine(exp);
    const actImp = parseImportLine(act);
    if (expImp && actImp) {
      // Both are import lines. The ONLY sanctioned difference is the module specifier, and
      // only when both sides are aliased specifiers. Head/tail (everything except the
      // specifier) must still match byte-for-byte.
      if (
        expImp.head === actImp.head &&
        expImp.quote === actImp.quote &&
        expImp.tail === actImp.tail
      ) {
        if (expImp.spec === actImp.spec) {
          // identical specifier but lines differed elsewhere — impossible given head/tail
          // match, but guard anyway.
          problems.push(
            `${label}:${i + 1}: import line differs in an unexpected way`,
          );
        } else if (
          isSanctionedAliasRewrite(expImp.spec, actImp.spec, aliases)
        ) {
          // Exact components.json-derived rewrite. Any unconfigured alternate root or repointed
          // path falls through to the error.
          continue;
        } else {
          problems.push(
            `${label}:${i + 1}: import target changed and is NOT a sanctioned alias rewrite\n` +
              `    item:    from ${expImp.quote}${expImp.spec}${expImp.quote}\n` +
              `    on-disk: from ${actImp.quote}${actImp.spec}${actImp.quote}`,
          );
        }
      } else {
        problems.push(
          `${label}:${i + 1}: import line altered beyond its module specifier (head/tail mismatch)\n` +
            `    item:    ${exp}\n` +
            `    on-disk: ${act}`,
        );
      }
    } else {
      // At least one side is not an import line → a non-import line changed. Never allowed.
      problems.push(
        `${label}:${i + 1}: non-import line changed (no transform is permitted here)\n` +
          `    item:    ${exp}\n` +
          `    on-disk: ${act}`,
      );
    }
  }
  return problems;
}

// Resolve the on-disk path shadcn wrote a file to. `target` may be a shadcn placeholder
// (`@ui/button.tsx`, `@components/…`, `@lib/…`, `@hooks/…`, `@utils/…`) that resolves to the
// CONSUMER's configured directory, an `@/…`/`~/…`/`#…` alias-prefixed path, or a legacy relative
// path. When the consumer's `components.json` aliases are provided, a placeholder resolves to the
// real configured dir (so a `src/components/ui` layout is honored — Codex R12); otherwise we fall
// back to stripping the leading segment. Falls back to `path` when `target` is absent. Rooted at
// targetDir.
function resolveModulePath(specifier, paths = {}) {
  for (const [pattern, targets] of Object.entries(paths)) {
    const candidates = Array.isArray(targets) ? targets : [];
    if (pattern.includes("*")) {
      const [prefix, suffix] = pattern.split("*");
      if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix))
        continue;
      const captured = specifier.slice(
        prefix.length,
        specifier.length - suffix.length,
      );
      const target = candidates.find((value) => typeof value === "string");
      if (target) return target.replace("*", captured).replace(/^\.\//, "");
    } else if (specifier === pattern) {
      const target = candidates.find((value) => typeof value === "string");
      if (target) return target.replace(/^\.\//, "");
    }
  }
  return undefined;
}

function aliasDirectory(alias, paths) {
  return (resolveModulePath(alias, paths) ?? alias)
    .replace(/^[@~#]\/?/, "")
    .replace(/^\.\//, "");
}

function resolveTargetPath(file, targetDir, aliases = {}, paths = {}) {
  let t = file.target ?? file.path;
  if (typeof t !== "string" || t.length === 0) {
    throw new Error("registry file is missing a non-empty target/path");
  }
  const directTarget = file.target != null;
  // shadcn placeholder `@<name>/<rest>` (name is a components.json alias key: ui/components/lib/
  // hooks/utils). Resolve to that alias's on-disk dir when known.
  const ph = /^@([a-z]+)\/(.+)$/.exec(t);
  if (ph && aliases[ph[1]]) {
    // alias value e.g. "@/components/ui" | "~/src/components/ui" | "src/components/ui" — strip a
    // leading import prefix (@/, ~/, #) to get the targetDir-relative directory.
    const alias = aliases[ph[1]];
    if (typeof alias !== "string") {
      throw new Error(`consumer alias ${ph[1]} must be a string`);
    }
    const dir = aliasDirectory(alias, paths);
    return assertPathInside(
      targetDir,
      resolve(targetDir, dir, ph[2]),
      `registry target ${t}`,
    );
  }
  // No alias map (or unknown placeholder): strip a leading alias prefix to its tail.
  if (t.startsWith("@/") || t.startsWith("#") || t.startsWith("~/")) {
    // e.g. `@/components/ui/button.tsx` → `components/ui/button.tsx`
    t = t.replace(/^[@#~]\/?/, "");
  } else if (t.startsWith("@")) {
    // e.g. `@ui/button.tsx` → `ui/button.tsx`
    t = t.replace(/^@/, "");
  }
  // For a recognized Next src layout, shadcn prefixes direct non-placeholder registry:block targets
  // with `src/` (for example app/dashboard becomes src/app/dashboard). Explicit alias targets are
  // already rooted and must not be prefixed again.
  const usesSrcLayout = Object.values(aliases).some((value) => {
    if (typeof value !== "string") return false;
    return aliasDirectory(value, paths).startsWith("src/");
  });
  if (
    directTarget &&
    !file.target?.startsWith("~/") &&
    usesSrcLayout &&
    !t.startsWith("src/")
  ) {
    t = `src/${t}`;
  }
  return assertPathInside(
    targetDir,
    resolve(targetDir, t),
    `registry target ${file.target ?? file.path}`,
  );
}

function readConsumerConfiguration(targetDir) {
  let aliases = {};
  try {
    const cj = JSON.parse(
      readFileSync(resolve(targetDir, "components.json"), "utf8"),
    );
    aliases = cj.aliases ?? {};
  } catch {
    // Post-write will still fail missing/misresolved files rather than trusting a guessed alias.
  }
  let paths = {};
  const loaded = loadTsconfigPaths(targetDir);
  if (loaded.resultType === "success") {
    paths = Object.fromEntries(
      Object.entries(loaded.paths).map(([pattern, targets]) => [
        pattern,
        targets.map((target) =>
          relative(targetDir, resolve(loaded.absoluteBaseUrl, target))
            .split(sep)
            .join("/"),
        ),
      ]),
    );
  }
  return { aliases, paths };
}

function readConsumerAliases(targetDir) {
  return readConsumerConfiguration(targetDir).aliases;
}

export {
  canonical,
  itemHash,
  stripProvenanceHeader,
  stripShadcnLeadingCommentPrologue,
  compareFile,
  rewriteRegistrySpecifier,
  rewriteRegistryAliases,
  isSanctionedAliasRewrite,
  parseImportLine,
  resolveTargetPath,
  readConsumerAliases,
  readConsumerConfiguration,
  assertRegistryRequest,
  assertItemName,
  assertPathInside,
  assertExistingPathInside,
  writeNewPrivateFile,
  terminalText,
  parseCliArgs,
};
// ───────────────────────────────────────────────────────────────────────────────────

const USAGE = `vegastack-design verify — fail-closed registry trust preflight + post-write check

Usage:
  vegastack-design verify [--hash-only] [--save <path>] <name>     (pre-write)
  vegastack-design verify --post-write --item <path> --expected-integrity <sha256-base64> --target-dir <dir>
  vegastack-design verify --help

Modes:
  full (default)   Pre-write. Sigstore signature (cosign) + item hash. Needs the deployed
                   signed manifest and the cosign CLI. This is the real trust boundary.
  --hash-only      Pre-write. Item hash only (skips cosign). For local dev / no cosign /
                   before the signed manifest is deployed. Does NOT prove provenance.
  --post-write     OFFLINE. Authenticate a SAVED item against the independently retained
                   --expected-integrity, then compare the files shadcn copied on disk.
                   Closes the check->copy (TOCTOU) gap. Fail-closed on any byte mismatch
                   except shadcn's leading-comment removal and sanctioned alias rewriting.

Pre-write flags:
  --save <path>    Persist the EXACT verified item JSON to <path> for the post-write pass.
                   The path must not already exist. Default: a private unique temp file (path is
                   printed) — pass it to --post-write --item.

Post-write flags:
  --item <path>    The item JSON saved by a prior pre-write run (the bytes we verified).
  --expected-integrity <sha256-base64>
                   The independently retained digest printed by the pre-write run. Required.
  --target-dir <d> Project root the files were copied into (resolves each file's target).

The fail-closed flow that closes the TOCTOU window:
  1) pre-write verify (full or --hash-only) WITH --save  → saves the trusted item bytes
  2) shadcn add @vegastack/<name>                        → copies files, rewrites aliases
  3) Run the exact --post-write command printed by step 1 → authenticates the saved item and
     proves the copied files match it

Env:
  VEGASTACK_REGISTRY        registry base URL (default https://design.vegastack.com/r)
  VEGASTACK_TRUSTED_REGISTRY_ORIGIN
                            exact HTTPS origin allowed to receive credentials (defaults to
                            https://design.vegastack.com; set explicitly for a custom registry)
  CF_ACCESS_CLIENT_ID       Cloudflare Access service-token id
  CF_ACCESS_CLIENT_SECRET   Cloudflare Access service-token secret
  VEGASTACK_SIGNER_REPO     OIDC signer repo  (default vegastack/vegastack-design)  [full]
  VEGASTACK_SIGNER_REF      OIDC signer ref   (default refs/heads/main)             [full]`;

function parseCliArgs(args) {
  const parsed = {
    hashOnly: false,
    postWrite: false,
    savePath: undefined,
    itemPath: undefined,
    expectedIntegrity: undefined,
    targetDir: ".",
    positionals: [],
  };
  const seen = new Set();
  const setOnce = (flag) => {
    if (seen.has(flag)) throw new Error(`duplicate option: ${flag}`);
    seen.add(flag);
  };
  const valueAfter = (index, flag) => {
    const value = args[index + 1];
    if (!value || value.startsWith("-"))
      throw new Error(`${flag} requires a value`);
    return value;
  };
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--hash-only") {
      setOnce(argument);
      parsed.hashOnly = true;
    } else if (argument === "--post-write") {
      setOnce(argument);
      parsed.postWrite = true;
    } else if (
      argument === "--save" ||
      argument === "--item" ||
      argument === "--expected-integrity" ||
      argument === "--target-dir"
    ) {
      setOnce(argument);
      const value = valueAfter(index, argument);
      index++;
      if (argument === "--save") parsed.savePath = value;
      else if (argument === "--item") parsed.itemPath = value;
      else if (argument === "--expected-integrity")
        parsed.expectedIntegrity = value;
      else parsed.targetDir = value;
    } else if (argument.startsWith("-")) {
      throw new Error(`unknown option: ${argument}`);
    } else {
      parsed.positionals.push(argument);
    }
  }
  if (parsed.postWrite) {
    if (parsed.hashOnly || parsed.savePath) {
      throw new Error(
        "--post-write cannot be combined with --hash-only or --save",
      );
    }
    if (!parsed.itemPath)
      throw new Error("--post-write requires --item <path-to-saved-item.json>");
    if (!INTEGRITY_RE.test(parsed.expectedIntegrity ?? "")) {
      throw new Error(
        "--post-write requires --expected-integrity <sha256-base64> from the pre-write result",
      );
    }
    if (parsed.positionals.length > 0)
      throw new Error("--post-write does not accept an item name");
  } else {
    if (
      parsed.itemPath ||
      parsed.expectedIntegrity ||
      seen.has("--target-dir")
    ) {
      throw new Error(
        "--item, --expected-integrity, and --target-dir require --post-write",
      );
    }
    if (parsed.positionals.length !== 1) {
      throw new Error(
        "pre-write verification requires exactly one registry item name",
      );
    }
  }
  return { ...parsed, name: parsed.positionals[0] };
}

// Only run the CLI when invoked directly (so tests/imports don't trigger fetches).
// Naive `file://${argv[1]}` string-building breaks on any path needing percent-encoding (a space,
// '#', non-ASCII) — the comparison silently failed and the CLI exited 0 having verified NOTHING,
// i.e. the fail-closed preflight failed OPEN. pathToFileURL encodes identically to import.meta.url.
// (check-updates.mjs already uses this form; keep the two in step.)
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const args = process.argv.slice(2);

  // Deprecation notice when invoked under the legacy bin name (not via the `vegastack-design`
  // dispatcher, which sets VEGASTACK_DESIGN_DISPATCH). The alias still works for one more minor.
  if (
    basename(process.argv[1] ?? "") === "verify-registry-item.mjs" &&
    !process.env.VEGASTACK_DESIGN_DISPATCH &&
    process.stderr.isTTY // interactive humans only — don't spam CI / piped / internal-tooling runs
  ) {
    console.error(
      "[deprecated] `vegastack-verify-registry-item` is now `vegastack-design verify` — please switch.",
    );
  }
  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    process.exit(0);
  }

  let parsedArgs;
  try {
    parsedArgs = parseCliArgs(args);
  } catch (err) {
    console.error(terminalText(err.message));
    console.error(USAGE);
    process.exit(2);
  }

  // ── POST-WRITE mode (offline, the TOCTOU closer) ──────────────────────────────────
  if (parsedArgs.postWrite) {
    const itemPath = parsedArgs.itemPath;
    const expectedIntegrity = parsedArgs.expectedIntegrity;
    const targetDir = parsedArgs.targetDir;

    let item;
    try {
      item = JSON.parse(readFileSync(itemPath, "utf8"));
    } catch (err) {
      console.error(
        `cannot read saved item ${terminalText(itemPath)}: ${terminalText(err.message)}`,
      );
      process.exit(2);
    }

    const files = Array.isArray(item.files) ? item.files : [];
    if (files.length === 0) {
      console.error(
        `saved item ${terminalText(itemPath)} has no files[] to verify`,
      );
      process.exit(2);
    }
    const savedIntegrity = itemHash(item);
    if (
      savedIntegrity !== expectedIntegrity ||
      item.meta?.integrity !== expectedIntegrity
    ) {
      console.error(
        `saved item ${terminalText(itemPath)} does not match the independently retained pre-write integrity`,
      );
      process.exit(2);
    }

    const allProblems = [];
    let checked = 0;
    let realTargetDir;
    try {
      realTargetDir = realpathSync(targetDir);
    } catch (err) {
      console.error(
        `cannot resolve --target-dir ${terminalText(targetDir)}: ${terminalText(err.message)}`,
      );
      process.exit(2);
    }
    const configuration = readConsumerConfiguration(realTargetDir);
    const aliases = configuration.aliases;
    for (const file of files) {
      const label = file.target ?? file.path;
      let onDisk;
      let actual;
      try {
        onDisk = resolveTargetPath(
          file,
          realTargetDir,
          aliases,
          configuration.paths,
        );
        const realOnDisk = assertExistingPathInside(
          realTargetDir,
          onDisk,
          `registry target ${label}`,
        );
        actual = readFileSync(realOnDisk, "utf8");
      } catch (err) {
        allProblems.push(`${label}: ${err.message}`);
        continue;
      }
      const problems = compareFile(
        file.content ?? "",
        actual,
        label,
        aliases,
        file.type,
      );
      if (problems.length) allProblems.push(...problems);
      checked++;
    }

    if (allProblems.length) {
      console.error(
        `post-write verification FAILED for ${terminalText(item.name ?? itemPath)}:`,
      );
      for (const p of allProblems) console.error(`  ✗ ${terminalText(p)}`);
      console.error(
        "\nThe copied files do NOT match the verified item (beyond shadcn leading-comment removal and sanctioned alias rewriting)." +
          "\nThis is exactly the TOCTOU signal: treat the copy-in as untrusted.",
      );
      process.exit(1);
    }
    console.log(
      `post-write OK: ${checked} file(s) of ${terminalText(item.name ?? itemPath)} are byte-faithful to the saved item (modulo shadcn leading-comment removal and alias rewriting)`,
    );
    process.exit(0);
  }

  // ── PRE-WRITE modes (full / --hash-only) ──────────────────────────────────────────
  const hashOnly = parsedArgs.hashOnly;
  const savePath = parsedArgs.savePath;
  const name = parsedArgs.name;

  try {
    assertItemName(name);
  } catch (err) {
    console.error(terminalText(err.message));
    process.exit(2);
  }

  try {
    const base = (process.env.VEGASTACK_REGISTRY ?? DEFAULT_REGISTRY).replace(
      /\/$/,
      "",
    );
    const headers = requestHeaders();

    const tempDir = mkdtempSync(join(tmpdir(), "vegastack-verify-"));
    const manifestPath = join(tempDir, "manifest.json");

    if (hashOnly) {
      // hash-only: fetch the manifest over the transport, skip the signature.
      const manifestText = await fetchRegistryText(
        `${base}/integrity-manifest.json`,
        headers,
        "integrity manifest",
      );
      writeFileSync(manifestPath, manifestText, { mode: 0o600 });
      console.warn(
        "[hash-only] skipping Sigstore signature verification — provenance NOT proven",
      );
    } else {
      // full: fetch manifest + signature bundle, then verify the signature against the
      // EXACT release identity before trusting the manifest.
      const sigPath = join(tempDir, "manifest.sigstore");
      const [manifestText, bundleText] = await Promise.all([
        fetchRegistryText(
          `${base}/integrity-manifest.json`,
          headers,
          "integrity manifest",
        ),
        fetchRegistryText(
          `${base}/integrity-manifest.sigstore`,
          headers,
          "signature bundle",
        ),
      ]);
      writeFileSync(manifestPath, manifestText, { mode: 0o600 });
      writeFileSync(sigPath, bundleText, { mode: 0o600 });

      // Pin the precise signer (the deploy workflow at the trusted ref) + repo, NOT a
      // repo-prefix regexp — a broad prefix would accept a manifest signed by ANY
      // workflow/ref in the repo that can obtain GitHub OIDC, defeating the registry
      // trust boundary. Override the ref (e.g. a tag) via env for tagged releases.
      const SIGNER_REPO =
        process.env.VEGASTACK_SIGNER_REPO ?? "vegastack/vegastack-design";
      const SIGNER_REF = process.env.VEGASTACK_SIGNER_REF ?? "refs/heads/main";
      const SIGNER_IDENTITY = `https://github.com/${SIGNER_REPO}/.github/workflows/deploy.yml@${SIGNER_REF}`;
      try {
        execFileSync(
          "cosign",
          [
            "verify-blob",
            "--bundle",
            sigPath,
            "--certificate-identity",
            SIGNER_IDENTITY,
            "--certificate-oidc-issuer",
            "https://token.actions.githubusercontent.com",
            "--certificate-github-workflow-repository",
            SIGNER_REPO,
            "--certificate-github-workflow-ref",
            SIGNER_REF,
            manifestPath,
          ],
          { stdio: "inherit" },
        );
      } catch (error) {
        if (error.code === "ENOENT") {
          throw new RegistryAccessError(
            "cosign is not installed or is not available on PATH; install it before full verification",
          );
        }
        throw new Error("Sigstore signature verification failed");
      }
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    // Capture the EXACT bytes we fetch+verify. We parse from this same text so the saved item
    // is byte-for-byte what the hash was computed over — the post-write pass compares against
    // THESE bytes, not a re-fetch. That is what closes the TOCTOU window.
    const itemText = await fetchRegistryText(
      `${base}/${name}.json`,
      headers,
      `registry item ${name}`,
    );
    const item = JSON.parse(itemText);
    if (
      item.name !== name ||
      !Array.isArray(item.files) ||
      item.files.length === 0
    ) {
      throw new Error("registry item identity/files contract mismatch");
    }
    const got = itemHash(item);
    if (got !== item.meta?.integrity || got !== manifest[name]) {
      throw new Error(`integrity mismatch for ${name}`);
    }

    // Persist the verified item so --post-write can compare copies against THESE exact bytes.
    const outPath = savePath ?? join(tempDir, `item-${name}.json`);
    writeNewPrivateFile(outPath, itemText);

    console.log(`verified ${name}${hashOnly ? " (hash-only)" : ""}`);
    console.log(`saved verified item → ${terminalText(outPath)}`);
    console.log(
      `next: run \`shadcn add @vegastack/${name}\`, then close the TOCTOU gap with:\n` +
        `  vegastack-design verify --post-write --item ${shellArg(outPath)} --expected-integrity ${shellArg(got)} --target-dir .`,
    );
  } catch (error) {
    console.error(`verification failed: ${terminalText(error.message)}`);
    process.exit(error instanceof RegistryAccessError ? 2 : 1);
  }
}
