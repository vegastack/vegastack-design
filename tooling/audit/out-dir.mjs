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
// NOT A BUILD INPUT
//   Nothing under `tooling/audit/` is executed by a build, so it is deliberately absent from
//   `turbo.json`'s `globalDependencies`; `tooling/verify-turbo-inputs.mjs` asserts that adding it
//   there is rejected.

import { mkdirSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";

import { ROOT } from "../lib/fs.mjs";

/** The audit whose committed documents `graph.mjs` and `histogram.mjs` regenerate. */
export const AUDIT_DOCS_DIR = join(ROOT, "docs/audits/2026-09-07-system-audit");

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
  const dir = override() ?? AUDIT_DOCS_DIR;
  mkdirSync(dir, { recursive: true });
  return dir;
}
