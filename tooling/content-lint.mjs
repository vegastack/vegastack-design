#!/usr/bin/env node
// Content lint for skills + docs prose: rejects stale shadcn CLI snippets in
// consumer-facing commands. VegaStack consumes current shadcn Base UI support via
// `pnpm dlx shadcn@latest`; old pinned `shadcn@4.7.0` snippets silently drift back
// toward the pre-Base workflow.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const STALE_SHADCN_RE = /\b(?:npx\s+)?shadcn@4\.7\.0\b/g;

// Only the CONSUMER-FACING surfaces — the agent skills and the published docs content (commands a
// consumer actually runs). Internal planning/ledger/research notes under docs/ are out of scope.
const SCAN_DIRS = [join(ROOT, "skills"), join(ROOT, "apps/docs/content")];
const PUBLIC_DOCS_DIR = join(ROOT, "apps/docs/content/docs");
const INTERNAL_DOCS_DIR = join(ROOT, "apps/docs/content/internal");
const DOCS_GLOBAL_CSS = join(ROOT, "apps/docs/app/global.css");

// Deferred-visual-coverage rot (Codex R14). `apps/docs/vrt/contracts.spec.ts` is the blocking gate
// and derives its routes from the component contract, so a skipped visual `describe` in a spec — or
// in an authoring skill that teaches the workflow — leaves a component with NO active behaviour
// coverage while reading as covered. Reject it, scoped to the specs plus the skill markdown.
const VISUAL_SCAN_DIRS = [join(ROOT, "apps/docs/vrt"), join(ROOT, "skills")];
const VISUAL_EXT = /\.(md|mdx|ts|tsx|mts|cts|js|mjs|cjs|jsx)$/;
// A SKIPPED visual describe — `describe.skip(`, `test.describe.skip(`, `it.skip(` style calls.
const SKIPPED_DESCRIBE_RE = /\b(?:test\.|it\.)?describe\.skip\s*\(/g;
// Committed screenshots were removed on 2026-07-25: captures are local, before/after, and never
// stored. Guidance that still tells an author to commit or regenerate a baseline sends them to a
// workflow that no longer exists — and `tooling/verify-workflow-security.mjs` will reject it.
// `--update-snapshots` is deliberately NOT matched: it is how tooling/vrt-review.mjs writes the
// base-ref capture, and with no persistent baseline there is nothing for it to silently overwrite.
const COMMITTED_BASELINE_RE =
  /commit\s+(?:the\s+)?(?:VRT\s+)?baselines?|update_baselines|verify:vrt-baselines/g;

function walk(dir, out = [], ext = /\.(md|mdx)$/) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out, ext);
    else if (ext.test(name)) out.push(p);
  }
  return out;
}

let violations = 0;

function frontmatterValue(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) return undefined;
  const value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

const titleOwners = new Map();
for (const [dir, expectedAudience] of [
  [PUBLIC_DOCS_DIR, "public"],
  [INTERNAL_DOCS_DIR, "internal"],
]) {
  for (const file of walk(dir, [], /\.mdx$/)) {
    const contents = readFileSync(file, "utf8");
    const frontmatterMatch = contents.match(/^---\n([\s\S]*?)\n---/);
    const relative = file.replace(ROOT + "/", "");
    if (!frontmatterMatch) {
      violations++;
      console.log(
        `${relative}:1 [docs-frontmatter] MDX docs must start with YAML frontmatter.`,
      );
      continue;
    }

    const frontmatter = frontmatterMatch[1];
    const audience = frontmatterValue(frontmatter, "audience");
    const title = frontmatterValue(frontmatter, "title");
    const description = frontmatterValue(frontmatter, "description");

    if (audience !== expectedAudience) {
      violations++;
      console.log(
        `${relative}:1 [docs-audience] expected audience: ${expectedAudience}, found ${audience ?? "missing"} — public and internal collections must fail closed at the source boundary.`,
      );
    }
    if (!title || title.length > 70) {
      violations++;
      console.log(
        `${relative}:1 [docs-title] title must be non-empty and at most 70 characters (found ${title?.length ?? 0}).`,
      );
    } else if (titleOwners.has(title)) {
      violations++;
      console.log(
        `${relative}:1 [docs-title] duplicate title "${title}"; first used by ${titleOwners.get(title)}.`,
      );
    } else {
      titleOwners.set(title, relative);
    }
    if (!description || description.length < 60 || description.length > 160) {
      violations++;
      console.log(
        `${relative}:1 [docs-description] description must be 60–160 characters (found ${description?.length ?? 0}).`,
      );
    } else if (/<[^>]+>|&(?:[a-z]+|#\d+);/i.test(description)) {
      violations++;
      console.log(
        `${relative}:1 [docs-description] description must be plain text without HTML or unresolved entities.`,
      );
    }
  }
}

const cssWithoutComments = readFileSync(DOCS_GLOBAL_CSS, "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
let sawNonImportRule = false;
for (const [index, line] of cssWithoutComments.split("\n").entries()) {
  const value = line.trim();
  if (!value) continue;
  if (value.startsWith("@import ")) {
    if (sawNonImportRule) {
      violations++;
      console.log(
        `apps/docs/app/global.css:${index + 1} [css-import-order] every @import must precede Tailwind directives and normal CSS rules.`,
      );
    }
  } else {
    sawNonImportRule = true;
  }
}

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      STALE_SHADCN_RE.lastIndex = 0;
      let m;
      while ((m = STALE_SHADCN_RE.exec(line))) {
        violations++;
        console.log(
          `${file.replace(ROOT + "/", "")}:${i + 1} [stale-shadcn-cli] "${m[0]}" — use the current Base UI CLI form, for example "pnpm dlx shadcn@latest ...".\n    ${line.trim()}`,
        );
      }
    });
  }
}

// Reject stale visual-coverage guidance: skipped visual describes + committed-baseline instructions.
const seenVisualFiles = new Set();
for (const dir of VISUAL_SCAN_DIRS) {
  for (const file of walk(dir, [], VISUAL_EXT)) {
    if (seenVisualFiles.has(file)) continue;
    seenVisualFiles.add(file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const { re, label, msg } of [
        {
          re: SKIPPED_DESCRIBE_RE,
          label: "visual-skip",
          msg: "a skipped visual `describe.skip(` leaves a component with no active behaviour coverage — the contract suite derives its routes from packages/ui/component-contracts.json, so add the component contract instead of skipping.",
        },
        {
          re: COMMITTED_BASELINE_RE,
          label: "committed-baseline",
          msg: "committed screenshot baselines were removed on 2026-07-25 — captures are local before/after via `node tooling/vrt-review.mjs` and are never committed. Rewrite this guidance.",
        },
      ]) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line))) {
          violations++;
          console.log(
            `${file.replace(ROOT + "/", "")}:${i + 1} [${label}] "${m[0]}" — ${msg}\n    ${line.trim()}`,
          );
        }
      }
    });
  }
}

if (violations) {
  console.error(`\n✗ content-lint: ${violations} violation(s)`);
  process.exit(1);
}
console.log(
  "✓ content-lint: clean (docs audience/metadata, shadcn CLI, and visual-coverage guidance)",
);
