// Shared vocabulary for the four upstream scripts (pull, diff, verify-parity, verify-variant-coverage).
//
// WHY THIS FILE EXISTS
//   The shadcn reset (docs/plans/2026-09-18-shadcn-reset/) makes one claim enforceable: every
//   component we share with shadcn is UPSTREAM'S FILE PLUS AN APPROVED PATCH. Four scripts carry
//   that claim and they must agree on where the pinned upstream lives, which names are migrated,
//   and which decision IDs are allowed to justify a hunk. One definition each, here.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ROOT, readJson } from "../lib/fs.mjs";

/** The pinned shadcn CLI. `pull.mjs` refuses any other version; the vendor path carries it. */
export const CLI_VERSION = "4.21.0";
export const STYLE = "base-nova";
export const BASE = "base";
export const PRESET = "nova";
export const REGISTRY = `https://ui.shadcn.com/r/styles/${STYLE}/{name}.json`;
/** Chart blocks live only under new-york-v4; `pull.mjs` ports them (import rewrite only). */
export const PORTED_STYLE = "new-york-v4";

export const VENDOR = join(ROOT, "vendor/shadcn", CLI_VERSION);
export const CACHE = join(ROOT, ".upstream-cache", CLI_VERSION);
export const UPSTREAM_DIR = join(ROOT, "packages/ui/upstream");
export const PATCHES = join(UPSTREAM_DIR, "patches");
export const CANONICAL = join(ROOT, "packages/ui/registry/ui");
export const DOCS_PAGES = join(ROOT, "apps/docs/content/docs/components");
export const PREVIEW_BARREL = join(
  ROOT,
  "apps/docs/components/preview/index.tsx",
);

export const sha256 = (buffer) =>
  `sha256-${createHash("sha256").update(buffer).digest("hex")}`;

/**
 * The names this repository has already reset onto upstream.
 *
 * WHY A MIGRATED SET EXISTS (deviation from implementation.md § 3.3, recorded 2026-09-18)
 *   The plan asserts two things that cannot both hold literally: parity is enforced "for every
 *   component that has an upstream counterpart" (§ 3.3) AND `pnpm upstream:check` passes at the end
 *   of Batch 0 "with zero patches, because nothing is migrated yet" (§ 3.6). Before Batch 2, every
 *   shared component still carries years of VegaStack drift, so a literal reading fails 62 times on
 *   the day the gate is born. The reconciliation is this list: parity and variant coverage are
 *   enforced for the names on it, and each of Batches 2-6 appends the names it resets. It is empty
 *   at Batch 0 and complete at the end of Batch 6, at which point the two readings coincide.
 */
export function migrated() {
  return new Set(readJson(join(UPSTREAM_DIR, "migrated.json")).components);
}

/** Extras: names of ours with no upstream counterpart, with their `extras.md` disposition. */
export function ours() {
  return readJson(join(UPSTREAM_DIR, "ours.json")).items;
}

/** Names deleted in favour of an upstream replacement (Batch 7). */
export function retired() {
  return new Set(readJson(join(UPSTREAM_DIR, "retired.json")).components);
}

/**
 * The decision register, machine-readable.
 *
 * The prose register (`docs/plans/2026-09-18-shadcn-reset/decisions.md`, 169 rows) is an untracked
 * planning document by MK's instruction, so a committed gate cannot read it. `decisions.json` is
 * its committed derivative and the authority the gates use; `parseDecisionsMarkdown` below
 * regenerates it when the plan file is present.
 */
export function decisions() {
  return readJson(join(UPSTREAM_DIR, "decisions.json")).decisions;
}

/** Extract `ID -> "ours" | "shadcn"` from the prose register's markdown tables. */
export function parseDecisionsMarkdown(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const row = /^\|\s*([A-Z0-9]+-\d+)\s*\|\s*\*\*(ours|shadcn)\*\*\s*\|/.exec(
      line,
    );
    if (row) out[row[1]] = row[2];
  }
  return out;
}

/** Every component name the pinned upstream ships a file for, sorted. */
export function upstreamComponents() {
  const dir = join(VENDOR, "ui");
  if (!existsSync(dir)) return [];
  return readJson(join(VENDOR, "manifest.json")).components.slice().sort();
}

export const vendorComponent = (name) =>
  readFileSync(join(VENDOR, "ui", `${name}.tsx`), "utf8");

export const canonicalPath = (name) => join(CANONICAL, `${name}.tsx`);
export const patchPath = (name) => join(PATCHES, `${name}.patch`);

/**
 * A unified diff of two strings, in the shape `git apply` reverses with its default `-p1`.
 *
 * `git diff --no-index --no-prefix` over two temp directories literally named `a/` and `b/` yields
 * `a/<name>.tsx` / `b/<name>.tsx` paths. Git owns unified diff; nothing here reimplements it, and
 * both the generator (`diff.mjs`) and the verifier (`verify-parity.mjs`) speak the one dialect.
 */
export function unifiedDiff(name, before, after) {
  const dir = mkdtempSync(join(tmpdir(), "vs-diff-"));
  try {
    mkdirSync(join(dir, "a"));
    mkdirSync(join(dir, "b"));
    writeFileSync(join(dir, "a", `${name}.tsx`), before);
    writeFileSync(join(dir, "b", `${name}.tsx`), after);
    try {
      // Exit 0 means the two files are identical.
      execFileSync(
        "git",
        [
          "diff",
          "--no-index",
          "--no-prefix",
          "--unified=3",
          `a/${name}.tsx`,
          `b/${name}.tsx`,
        ],
        { cwd: dir, encoding: "utf8" },
      );
      return "";
    } catch (error) {
      // Exit 1 means "files differ", and the diff is on stdout. Anything else is a real failure.
      if (error.status !== 1) throw error;
      return error.stdout;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Parse a patch file's mandatory header.
 * Returns `{ component, decisions: [...], hunkNotes: [...], body }`.
 */
export function parsePatch(text) {
  const lines = text.split("\n");
  const header = [];
  let i = 0;
  for (; i < lines.length; i++) {
    if (!lines[i].startsWith("#")) break;
    header.push(lines[i]);
  }
  const field = (key) => {
    const line = header.find((l) => l.startsWith(`# ${key}:`));
    return line ? line.slice(`# ${key}:`.length).trim() : null;
  };
  const ids = field("decisions");
  return {
    component: field("component"),
    decisions: ids
      ? ids
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
    hunkNotes: header.filter((l) => /^#\s+\d+:/.test(l)),
    body: lines.slice(i).join("\n"),
  };
}

/** A one-line pass/fail banner every gate ends with, so a log always names its verdict. */
export function report(prefix, failures, summary) {
  if (failures.length === 0) {
    console.log(`${prefix}: OK — ${summary}`);
    return 0;
  }
  for (const failure of failures) console.error(`${prefix}: ${failure}`);
  console.error(`${prefix}: FAILED — ${failures.length} problem(s)`);
  return 1;
}
