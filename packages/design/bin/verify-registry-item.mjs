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
//                       byte mismatch, modulo the one legitimate transform shadcn applies
//                       (import-alias rewriting — see below). This is the TOCTOU closer.
//
// Pre-write modes (full / --hash-only) accept --save <path> to persist the EXACT verified
// item bytes for the post-write pass. Without --save they default to a temp file whose path
// is printed (and reused as the post-write default), so the fail-closed flow works with zero
// extra flags.
//
// Usage:
//   # 1) pre-write: verify + SAVE the trusted item bytes
//   npx --package=@vegastack/design vegastack-design verify --hash-only --save /tmp/vega-button.json button
//   # 2) shadcn add @vegastack/button   (copies files onto disk, rewriting aliases)
//   # 3) post-write: prove the copied files match the SAVED item, fail-closed
//   npx --package=@vegastack/design vegastack-design verify --post-write --item /tmp/vega-button.json --target-dir .
//   vegastack-design verify --help
//
// Env:
//   VEGASTACK_REGISTRY        registry base URL (default https://design.vegastack.com/r)
//   CF_ACCESS_CLIENT_ID       Cloudflare Access service-token id (registry is service-token-only)
//   CF_ACCESS_CLIENT_SECRET   Cloudflare Access service-token secret
//   VEGASTACK_SIGNER_REPO     OIDC signer repo  (default VegaStack/vegastack-design)  [full mode]
//   VEGASTACK_SIGNER_REF      OIDC signer ref   (default refs/heads/main)             [full mode]
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';

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
  if (typeof content !== 'string') return content;
  return content.replace(PROVENANCE_HEADER_RE, '');
}

function canonical(o) {
  if (Array.isArray(o)) return o.map(canonical);
  if (o && typeof o === 'object') {
    return Object.fromEntries(Object.keys(o).sort().map((k) => [k, canonical(o[k])]));
  }
  return o;
}

function itemHash(item) {
  const { meta = {}, files, ...rest } = item;
  const m = { ...meta };
  delete m.integrity;
  const f = Array.isArray(files)
    ? files.map((file) =>
        file && typeof file === 'object' && 'content' in file
          ? { ...file, content: stripProvenanceHeader(file.content) }
          : file,
      )
    : files;
  return (
    'sha256-' +
    createHash('sha256')
      .update(JSON.stringify(canonical({ ...rest, ...(f !== undefined ? { files: f } : {}), meta: m })))
      .digest('base64')
  );
}
// ───────────────────────────────────────────────────────────────────────────────────

// ── post-write file comparison (alias-rewrite-aware, fail-closed) ────────────────────
//
// GUARANTEE: comparePostWrite proves the file `shadcn add` wrote on disk is byte-identical
// to the file embedded in the (already hash+signature-verified) registry item, EXCEPT for
// the single transform shadcn is allowed to apply on copy-in: import-alias rewriting. Every
// non-import line must match byte-for-byte. An import (or `export … from`) line may differ
// ONLY in its module-specifier string, and ONLY when BOTH the original and the on-disk
// specifier are "aliased" (start with one of the sanctioned alias roots below, i.e. the
// registry's source aliases or a consumer alias) — that is the exact set of specifiers
// shadcn is permitted to rewrite. Anything else — a changed import target that is NOT a
// sanctioned alias rewrite, a changed bare/relative specifier, any altered non-specifier
// token on an import line, any altered non-import line, a missing file, or a line-count
// change — is a mismatch and fails closed.
//
// LIMIT: this proves byte-faithfulness modulo alias rewriting; it does NOT re-derive the
// consumer's exact alias map (we don't read their components.json), so a rewrite from one
// sanctioned alias root to another sanctioned alias root is accepted as legitimate. Tampering
// that masquerades as an alias rewrite would still have to (a) leave every other byte of every
// file untouched and (b) only ever change a sanctioned-alias module specifier into another
// sanctioned-alias module specifier — it cannot inject code, change logic, or alter any
// non-import line without being caught.

// Alias roots shadcn may legitimately rewrite. These are the registry's source aliases
// (`@/components`, `@/lib`, `@/hooks`, `@/registry`, `@/ui`) and the consumer-side forms
// they get rewritten to, including package-import (`#…`) and tilde (`~/…`) styles. A
// specifier is "aliased" if it starts with one of these roots.
const ALIAS_ROOTS = [
  '@/components',
  '@/lib',
  '@/hooks',
  '@/registry',
  '@/ui',
  '@/utils',
  '#components',
  '#lib',
  '#hooks',
  '#ui',
  '#utils',
  '~/components',
  '~/lib',
  '~/hooks',
  '~/ui',
  '~/utils',
];

function isAliasedSpecifier(spec) {
  return ALIAS_ROOTS.some((root) => spec === root || spec.startsWith(root + '/'));
}

// Canonicalize an aliased specifier by stripping ONLY the leading alias-style symbol
// (`@/` ↔ `#` ↔ `~/`). shadcn's alias rewrite changes the root SYMBOL but never the
// category or the path after it, so two specifiers are a legitimate rewrite of each other
// IFF their canonical remainders are byte-identical. Without this, `@/components/ui/button`
// → `@/components/ui/evil` (or any cross-target repoint) would masquerade as a "sanctioned
// alias rewrite" and pass the TOCTOU verifier — a supply-chain bypass (Codex R8 CRITICAL).
function aliasCanonical(spec) {
  if (spec.startsWith('@/') || spec.startsWith('~/')) return spec.slice(2);
  if (spec.startsWith('#')) return spec.slice(1);
  return spec;
}

// A change from one specifier to another is a SANCTIONED alias rewrite only when BOTH are
// aliased AND they canonicalize to the same category+path (only the root symbol differs).
function isSanctionedAliasRewrite(expSpec, actSpec) {
  return (
    isAliasedSpecifier(expSpec) &&
    isAliasedSpecifier(actSpec) &&
    aliasCanonical(expSpec) === aliasCanonical(actSpec)
  );
}

// Pull the module specifier out of an `import … from '<spec>'`, a side-effect
// `import '<spec>'`, or an `export … from '<spec>'` line. Returns null if the line is not
// such a statement. We match the LAST quoted string after a `from`/bare-import keyword so
// the rest of the line (identifiers, type-modifiers, etc.) is compared literally.
const IMPORT_FROM_RE = /^(\s*(?:import|export)\b[\s\S]*?\bfrom\s*)(['"])([^'"]*)\2(\s*;?\s*)$/;
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

// Compare one expected (registry) file against the on-disk copied file. Returns an array
// of human-readable mismatch strings (empty array = byte-faithful modulo alias rewrite).
function compareFile(expectedContent, actualContent, label) {
  const problems = [];
  // Normalize nothing — we compare raw. shadcn writes content verbatim except for alias
  // rewriting, so a trailing-newline / CRLF difference IS a real difference worth flagging.
  const expLines = expectedContent.split('\n');
  const actLines = actualContent.split('\n');
  if (expLines.length !== actLines.length) {
    problems.push(
      `${label}: line count differs (item has ${expLines.length}, on-disk has ${actLines.length}) — not an alias rewrite`,
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
      if (expImp.head === actImp.head && expImp.quote === actImp.quote && expImp.tail === actImp.tail) {
        if (expImp.spec === actImp.spec) {
          // identical specifier but lines differed elsewhere — impossible given head/tail
          // match, but guard anyway.
          problems.push(`${label}:${i + 1}: import line differs in an unexpected way`);
        } else if (isSanctionedAliasRewrite(expImp.spec, actImp.spec)) {
          // sanctioned alias rewrite — ONLY the alias root symbol differs; category + path
          // are byte-identical. A repoint to a DIFFERENT target falls through to the error.
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
function resolveTargetPath(file, targetDir, aliases = {}) {
  let t = file.target ?? file.path;
  // shadcn placeholder `@<name>/<rest>` (name is a components.json alias key: ui/components/lib/
  // hooks/utils). Resolve to that alias's on-disk dir when known.
  const ph = /^@([a-z]+)\/(.+)$/.exec(t);
  if (ph && aliases[ph[1]]) {
    // alias value e.g. "@/components/ui" | "~/src/components/ui" | "src/components/ui" — strip a
    // leading import prefix (@/, ~/, #) to get the targetDir-relative directory.
    const dir = aliases[ph[1]].replace(/^[@~#]\/?/, '');
    return resolve(targetDir, dir, ph[2]);
  }
  // No alias map (or unknown placeholder): strip a leading alias prefix to its tail.
  if (t.startsWith('@/') || t.startsWith('#') || t.startsWith('~/')) {
    // e.g. `@/components/ui/button.tsx` → `components/ui/button.tsx`
    t = t.replace(/^[@#~]\/?/, '');
  } else if (t.startsWith('@')) {
    // e.g. `@ui/button.tsx` → `ui/button.tsx`
    t = t.replace(/^@/, '');
  }
  return resolve(targetDir, t);
}

// Read a consumer's components.json `aliases` map (for placeholder target resolution). Returns
// {} when absent/unreadable — resolveTargetPath then uses its strip-leading-segment fallback.
function readConsumerAliases(targetDir) {
  try {
    const cj = JSON.parse(readFileSync(resolve(targetDir, 'components.json'), 'utf8'));
    return cj.aliases ?? {};
  } catch {
    return {};
  }
}

export { canonical, itemHash, stripProvenanceHeader, compareFile, isAliasedSpecifier, aliasCanonical, isSanctionedAliasRewrite, parseImportLine, resolveTargetPath, readConsumerAliases };
// ───────────────────────────────────────────────────────────────────────────────────

const USAGE = `vegastack-design verify — fail-closed registry trust preflight + post-write check

Usage:
  vegastack-design verify [--hash-only] [--save <path>] <name>     (pre-write)
  vegastack-design verify --post-write --item <path> --target-dir <dir>
  vegastack-design verify --help

Modes:
  full (default)   Pre-write. Sigstore signature (cosign) + item hash. Needs the deployed
                   signed manifest and the cosign CLI. This is the real trust boundary.
  --hash-only      Pre-write. Item hash only (skips cosign). For local dev / no cosign /
                   before the signed manifest is deployed. Does NOT prove provenance.
  --post-write     OFFLINE. Compare the files shadcn copied on disk against a SAVED item.
                   Closes the check->copy (TOCTOU) gap. Fail-closed on any byte mismatch
                   except sanctioned import-alias rewriting.

Pre-write flags:
  --save <path>    Persist the EXACT verified item JSON to <path> for the post-write pass.
                   Default: a temp file (path is printed) — pass it to --post-write --item.

Post-write flags:
  --item <path>    The item JSON saved by a prior pre-write run (the bytes we verified).
  --target-dir <d> Project root the files were copied into (resolves each file's target).

The fail-closed flow that closes the TOCTOU window:
  1) pre-write verify (full or --hash-only) WITH --save  → saves the trusted item bytes
  2) shadcn add @vegastack/<name>                        → copies files, rewrites aliases
  3) --post-write --item <saved> --target-dir <root>     → proves copies match the saved item

Env:
  VEGASTACK_REGISTRY        registry base URL (default https://design.vegastack.com/r)
  CF_ACCESS_CLIENT_ID       Cloudflare Access service-token id
  CF_ACCESS_CLIENT_SECRET   Cloudflare Access service-token secret
  VEGASTACK_SIGNER_REPO     OIDC signer repo  (default VegaStack/vegastack-design)  [full]
  VEGASTACK_SIGNER_REF      OIDC signer ref   (default refs/heads/main)             [full]`;

// small flag-value reader: `--flag value`
function flagValue(args, name) {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : undefined;
}

// Only run the CLI when invoked directly (so tests/imports don't trigger fetches).
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  // Deprecation notice when invoked under the legacy bin name (not via the `vegastack-design`
  // dispatcher, which sets VEGASTACK_DESIGN_DISPATCH). The alias still works for one more minor.
  if (
    basename(process.argv[1] ?? '') === 'verify-registry-item.mjs' &&
    !process.env.VEGASTACK_DESIGN_DISPATCH &&
    process.stderr.isTTY // interactive humans only — don't spam CI / piped / internal-tooling runs
  ) {
    console.error('[deprecated] `vegastack-verify-registry-item` is now `vegastack-design verify` — please switch.');
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  // ── POST-WRITE mode (offline, the TOCTOU closer) ──────────────────────────────────
  if (args.includes('--post-write')) {
    const itemPath = flagValue(args, '--item');
    const targetDir = flagValue(args, '--target-dir') ?? '.';
    if (!itemPath) {
      console.error('--post-write requires --item <path-to-saved-item.json>');
      console.error(USAGE);
      process.exit(2);
    }

    let item;
    try {
      item = JSON.parse(readFileSync(itemPath, 'utf8'));
    } catch (err) {
      console.error(`cannot read saved item ${itemPath}: ${err.message}`);
      process.exit(2);
    }

    const files = Array.isArray(item.files) ? item.files : [];
    if (files.length === 0) {
      console.error(`saved item ${itemPath} has no files[] to verify`);
      process.exit(2);
    }

    const allProblems = [];
    let checked = 0;
    const aliases = readConsumerAliases(targetDir); // resolve @ui/ etc. to the consumer's real layout
    for (const file of files) {
      const onDisk = resolveTargetPath(file, targetDir, aliases);
      const label = file.target ?? file.path;
      let actual;
      try {
        actual = readFileSync(onDisk, 'utf8');
      } catch {
        allProblems.push(`${label}: expected copied file missing at ${onDisk}`);
        continue;
      }
      const problems = compareFile(file.content ?? '', actual, label);
      if (problems.length) allProblems.push(...problems);
      checked++;
    }

    if (allProblems.length) {
      console.error(`post-write verification FAILED for ${item.name ?? itemPath}:`);
      for (const p of allProblems) console.error(`  ✗ ${p}`);
      console.error(
        '\nThe copied files do NOT match the verified item (beyond sanctioned alias rewriting).' +
          '\nThis is exactly the TOCTOU signal: treat the copy-in as untrusted.',
      );
      process.exit(1);
    }
    console.log(
      `post-write OK: ${checked} file(s) of ${item.name ?? itemPath} are byte-faithful to the saved item (modulo alias rewriting)`,
    );
    process.exit(0);
  }

  // ── PRE-WRITE modes (full / --hash-only) ──────────────────────────────────────────
  const hashOnly = args.includes('--hash-only');
  const savePath = flagValue(args, '--save');
  // positional name = first non-flag that isn't a flag value we consumed
  const consumed = new Set([savePath].filter(Boolean));
  const name = args.filter((a) => !a.startsWith('-') && !consumed.has(a))[0];
  if (!name) {
    console.error(USAGE);
    process.exit(2);
  }

  const base = process.env.VEGASTACK_REGISTRY ?? 'https://design.vegastack.com/r';
  const headers = {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID,
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET,
  };

  const manifestPath = join(tmpdir(), 'vega-manifest.json');

  if (hashOnly) {
    // hash-only: fetch the manifest over the transport, skip the signature.
    const mRes = await fetch(`${base}/integrity-manifest.json`, { headers });
    writeFileSync(manifestPath, await mRes.text());
    console.warn('[hash-only] skipping Sigstore signature verification — provenance NOT proven');
  } else {
    // full: fetch manifest + signature bundle, then verify the signature against the
    // EXACT release identity before trusting the manifest.
    const sigPath = join(tmpdir(), 'vega-manifest.sigstore');
    const [mRes, bRes] = await Promise.all([
      fetch(`${base}/integrity-manifest.json`, { headers }),
      fetch(`${base}/integrity-manifest.sigstore`, { headers }),
    ]);
    writeFileSync(manifestPath, await mRes.text());
    writeFileSync(sigPath, await bRes.text());

    // Pin the precise signer (the deploy workflow at the trusted ref) + repo, NOT a
    // repo-prefix regexp — a broad prefix would accept a manifest signed by ANY
    // workflow/ref in the repo that can obtain GitHub OIDC, defeating the registry
    // trust boundary. Override the ref (e.g. a tag) via env for tagged releases.
    const SIGNER_REPO = process.env.VEGASTACK_SIGNER_REPO ?? 'VegaStack/vegastack-design';
    const SIGNER_REF = process.env.VEGASTACK_SIGNER_REF ?? 'refs/heads/main';
    const SIGNER_IDENTITY = `https://github.com/${SIGNER_REPO}/.github/workflows/deploy.yml@${SIGNER_REF}`;
    execFileSync(
      'cosign',
      [
        'verify-blob',
        '--bundle', sigPath,
        '--certificate-identity', SIGNER_IDENTITY,
        '--certificate-oidc-issuer', 'https://token.actions.githubusercontent.com',
        '--certificate-github-workflow-repository', SIGNER_REPO,
        '--certificate-github-workflow-ref', SIGNER_REF,
        manifestPath,
      ],
      { stdio: 'inherit' },
    );
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  // Capture the EXACT bytes we fetch+verify. We parse from this same text so the saved item
  // is byte-for-byte what the hash was computed over — the post-write pass compares against
  // THESE bytes, not a re-fetch. That is what closes the TOCTOU window.
  const itemText = await fetch(`${base}/${name}.json`, { headers }).then((r) => r.text());
  const item = JSON.parse(itemText);
  const got = itemHash(item);
  if (got !== item.meta?.integrity || got !== manifest[name]) {
    console.error(`integrity mismatch for ${name}`);
    process.exit(1);
  }

  // Persist the verified item so --post-write can compare copies against THESE exact bytes.
  const outPath = savePath ?? join(tmpdir(), `vega-item-${name}.json`);
  writeFileSync(outPath, itemText);

  console.log(`verified ${name}${hashOnly ? ' (hash-only)' : ''}`);
  console.log(`saved verified item → ${outPath}`);
  console.log(
    `next: run \`shadcn add @vegastack/${name}\`, then close the TOCTOU gap with:\n` +
      `  vegastack-design verify --post-write --item ${outPath} --target-dir .`,
  );
}
