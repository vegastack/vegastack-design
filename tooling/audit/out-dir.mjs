// Where the audit harness writes.
//
// TWO KINDS OF OUTPUT, AND THEY DO NOT BELONG IN THE SAME PLACE
//   `graph.mjs` and `histogram.mjs` emit COMMITTED MARKDOWN — `00-graph.md`, `00-register.md`,
//   `01-class-histogram.md` are part of the audit's point-in-time record and are read months later.
//   `capture.mjs` and the three `probe-*.mjs` emit BROWSER EVIDENCE — thousands of PNGs and JSON
//   dumps, regenerated on demand, never committed, and specific to one run rather than one audit.
//
//   So the documents keep writing into their dated audit folder (default `docs/audits/<slug>/`) and
//   the evidence goes to a gitignored `.audit/` at the repository root. Before this move the
//   evidence lived at `docs/audits/2026-09-07-system-audit/captures/` behind a dated `.gitignore`
//   line — which meant the NEXT audit either inherited a stale folder name or needed a second
//   ignore rule. `.audit/` is dateless because the evidence is.
//
// OVERRIDING
//   `--out <dir>` on any harness script, or `AUDIT_OUT_DIR` in the environment; the flag wins.
//   A relative value resolves against the repository root, never the caller's cwd — these scripts
//   are run from the root, from `apps/docs`, and from git hooks.
//
// WHICH AUDIT THE DOCUMENTS BELONG TO
//   Derived, never hardcoded. This constant used to spell `2026-09-07-system-audit` literally, so
//   the next audit would have silently regenerated its documents into the previous audit's dated
//   folder — the same class of bug the `.audit/` move above was made to end. It is now the
//   newest `docs/audits/<date>-system-audit` directory (the slugs are ISO-date-prefixed, so
//   lexicographic max IS newest), overridable with `--audit <slug>` or `AUDIT_SLUG` when writing
//   into an older or a not-yet-created one. No folder and no override is a hard error: writing an
//   audit document into an invented directory is worse than refusing.
//
// NOT A BUILD INPUT
//   Nothing under `tooling/audit/` is executed by a build, so it is deliberately absent from
//   `turbo.json`'s `globalDependencies`; `tooling/verify-turbo-inputs.mjs` asserts that adding it
//   there is rejected.

import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import { fatal, ROOT } from "../lib/fs.mjs";

const AUDITS = join(ROOT, "docs/audits");
/** A dated system-audit folder, e.g. `2026-09-07-system-audit`. */
const AUDIT_SLUG = /^\d{4}-\d{2}-\d{2}-system-audit$/;

/** `--audit <slug>` from argv, else `AUDIT_SLUG`, else null. */
function slugOverride(argv = process.argv) {
  const index = argv.indexOf("--audit");
  const raw =
    (index !== -1 ? argv[index + 1] : undefined) ??
    process.env.AUDIT_SLUG ??
    null;
  if (!raw) return null;
  if (raw.includes("/") || raw.includes(".."))
    fatal("audit out-dir", `--audit takes a folder name, not a path: ${raw}`);
  return raw;
}

/**
 * The audit whose committed documents `graph.mjs` and `histogram.mjs` regenerate: the newest dated
 * `docs/audits/<date>-system-audit`, or the `--audit`/`AUDIT_SLUG` override.
 */
export function auditDocsDir() {
  const override = slugOverride();
  if (override) return join(AUDITS, override);
  const dated = existsSync(AUDITS)
    ? readdirSync(AUDITS, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && AUDIT_SLUG.test(entry.name))
        .map((entry) => entry.name)
        .sort()
    : [];
  if (dated.length === 0)
    fatal(
      "audit out-dir",
      `no docs/audits/<date>-system-audit folder exists — create one, or name it with ` +
        `--audit <slug> (or AUDIT_SLUG). Refusing to invent a folder for a committed document.`,
    );
  return join(AUDITS, dated.at(-1));
}

/** `--out <dir>` from argv, else `AUDIT_OUT_DIR`, else null. Resolved against ROOT. */
function override(argv = process.argv) {
  const index = argv.indexOf("--out");
  const raw =
    (index !== -1 ? argv[index + 1] : undefined) ??
    process.env.AUDIT_OUT_DIR ??
    null;
  if (!raw) return null;
  return isAbsolute(raw) ? raw : resolve(ROOT, raw);
}

/**
 * The directory for regenerated browser evidence, created if missing.
 * `evidenceDir("_states")` → `<repo>/.audit/_states`.
 */
export function evidenceDir(...segments) {
  const dir = join(override() ?? join(ROOT, ".audit"), ...segments);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** The directory for committed audit documents, created if missing. */
export function documentDir() {
  const dir = override() ?? auditDocsDir();
  mkdirSync(dir, { recursive: true });
  return dir;
}
