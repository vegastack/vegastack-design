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

// Deferred-VRT-coverage rot (Codex R14): the VRT suite no longer ships as `describe.skip` with a
// `TODO(VRT)` until Docker — `apps/docs/vrt/components.spec.ts` self-activates and snapshots every
// route in its `PAGES` array. So a skipped visual `describe` or a literal `TODO(VRT)` in a VRT spec
// or in an authoring skill is now stale guidance that would yield components with NO active visual
// coverage. Reject both, scoped to the VRT specs + the skill markdown that teach the workflow.
const VRT_SCAN_DIRS = [join(ROOT, "apps/docs/vrt"), join(ROOT, "skills")];
const VRT_EXT = /\.(md|mdx|ts|tsx|mts|cts|js|mjs|cjs|jsx)$/;
// A SKIPPED visual/VRT describe — `describe.skip(`, `test.describe.skip(`, `it.skip(` style calls.
const SKIPPED_DESCRIBE_RE = /\b(?:test\.|it\.)?describe\.skip\s*\(/g;
// The exact deferred-coverage token.
const TODO_VRT_RE = /TODO\(VRT\)/g;

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

// Reject stale deferred-VRT-coverage guidance: skipped visual describes + `TODO(VRT)`.
const seenVrtFiles = new Set();
for (const dir of VRT_SCAN_DIRS) {
  for (const file of walk(dir, [], VRT_EXT)) {
    if (seenVrtFiles.has(file)) continue;
    seenVrtFiles.add(file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const { re, label, msg } of [
        {
          re: SKIPPED_DESCRIBE_RE,
          label: "vrt-skip",
          msg: "a skipped visual `describe.skip(` leaves a component with no active VRT coverage — the suite self-activates per contract-generated route, so add the component contract instead of skipping.",
        },
        {
          re: TODO_VRT_RE,
          label: "vrt-todo",
          msg: "the `TODO(VRT)` deferred-coverage workflow is obsolete — VRT runs on every PR via vrt.yml. Add the component contract and commit all four Linux lanes instead.",
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
  "✓ content-lint: clean (docs audience/metadata, shadcn CLI, and VRT guidance)",
);
