#!/usr/bin/env node
// changelog-lint — fail-closed validation of the root CHANGELOG.md:
//   • entry headings: `## [x.y.z] — <Month D, YYYY>` (em dash, friendly date), descending versions
//   • section headings from the FIXED vocabulary only
//   • every commit link's sha exists in this repo (git cat-file)
//   • every /docs (or design.vegastack.com/docs) link resolves to a real content page
// Wired into the docs lint chain; also run by the ship skill before releasing.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import assert from "node:assert/strict";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "CHANGELOG.md");
const CONTENT = join(ROOT, "apps/docs/content");

const VOCAB = new Set([
  "🧩 New components",
  "🔧 Changed components",
  "🗑 Removed / renamed",
  "🛠 CLI & tooling",
  "📦 npm",
  "📚 Docs",
  "🐛 Fixed",
  "⚠️ Breaking",
]);
const ENTRY_RE =
  /^## \[(\d+\.\d+\.\d+)\] — (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}$/;

const lines = readFileSync(SRC, "utf8").split("\n");
const problems = [];
const versions = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith("## ")) {
    const m = ENTRY_RE.exec(line);
    if (!m)
      problems.push(
        `L${i + 1}: bad entry heading (want "## [x.y.z] — July 19, 2026"): ${line}`,
      );
    else versions.push(m[1]);
  }
  if (line.startsWith("### ")) {
    const name = line.slice(4).trim();
    if (!VOCAB.has(name))
      problems.push(`L${i + 1}: section "${name}" not in the fixed vocabulary`);
  }
}

// descending semver order
const num = (v) => v.split(".").map(Number);
for (let i = 1; i < versions.length; i++) {
  const [a, b] = [num(versions[i - 1]), num(versions[i])];
  const cmp = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  if (cmp <= 0)
    problems.push(
      `entries out of order: ${versions[i - 1]} then ${versions[i]} (must be descending)`,
    );
}
if (versions.length === 0) problems.push("no version entries found");

const src = lines.join("\n");

// commit shas exist
for (const m of src.matchAll(/commit\/([0-9a-f]{7,40})/g)) {
  try {
    execSync(`git cat-file -e ${m[1]}^{commit}`, {
      cwd: ROOT,
      stdio: "ignore",
    });
  } catch {
    problems.push(`commit link references unknown sha: ${m[1]}`);
  }
}

// Docs links resolve to content pages. Anchors and query strings refine the destination; they must
// not make the underlying page disappear from validation.
const docsLinkPattern =
  /\((?:https:\/\/design\.vegastack\.com)?(\/docs\/[a-z0-9\-/]+)(?:[?#][^)\s]+)?\)/g;
const docsLinks = (text) =>
  [...text.matchAll(docsLinkPattern)].map((match) => match[1]);
assert.deepEqual(
  docsLinks("See [API](/docs/components/button#api-reference)."),
  ["/docs/components/button"],
);
assert.deepEqual(
  docsLinks(
    "See [API](https://design.vegastack.com/docs/components/button?tab=api#props).",
  ),
  ["/docs/components/button"],
);
for (const path of docsLinks(src)) {
  const rel = path.replace(/^\/docs\//, "");
  const ok =
    existsSync(join(CONTENT, "docs", `${rel}.mdx`)) ||
    existsSync(join(CONTENT, "docs", rel, "index.mdx"));
  if (!ok) problems.push(`docs link resolves to no content page: ${path}`);
}

if (problems.length) {
  console.error(
    `✗ changelog-lint: ${problems.length} problem(s) in CHANGELOG.md`,
  );
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `✓ changelog-lint: ${versions.length} entr${versions.length === 1 ? "y" : "ies"}, vocabulary/dates/order/shas/links all valid`,
);
