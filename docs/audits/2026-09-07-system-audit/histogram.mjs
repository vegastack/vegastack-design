// Utility-class histogram over every registry source file. Buckets by design-system role so
// off-scale and near-duplicate values are visible. node docs/audits/2026-09-07-system-audit/histogram.mjs
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../../..");
const dirs = ["packages/ui/registry/ui", "packages/ui/registry/blocks"];
const files = [];
for (const d of dirs)
  for (const f of fs.readdirSync(path.join(root, d), { recursive: true }))
    if (/\.tsx?$/.test(f) && !/\.test\./.test(f) && !/icons\//.test(f))
      files.push(path.join(root, d, f));
const buckets = {
  padding: /^-?(p|px|py|pt|pr|pb|pl|ps|pe)-/,
  margin: /^-?(m|mx|my|mt|mr|mb|ml|ms|me)-/,
  gap: /^(gap|gap-x|gap-y|space-x|space-y)-/,
  size: /^(h|w|size|min-h|min-w|max-w|max-h)-/,
  radius: /^rounded/,
  text: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|\[|\(|display|body|caption|label|title|heading)/,
  leading: /^leading-/,
  font: /^font-/,
  tracking: /^tracking-/,
  shadow: /^shadow/,
  border: /^border(-\d|-\(|-\[)/,
  ring: /^(ring|outline)/,
  duration: /^duration-/,
  ease: /^ease-/,
  transition: /^transition/,
  animate: /^(animate|motion)-/,
  z: /^z-/,
  opacity: /^opacity-/,
  alpha: /\/(\d+|\(--alpha[^)]*\))$/,
  color:
    /^(bg|text|border|fill|stroke|ring|outline|decoration|shadow|from|to|via|accent|caret|placeholder)-(?!\[)([a-z-]+)$/,
};
const counts = {};
const where = {};
const classRe =
  /(?:className|class)\s*[=:]\s*(?:\{cn\()?\s*[`"']([^`"']*)[`"']|"([^"]*\b(?:flex|grid|p-|gap-|rounded|text-)[^"]*)"/g;
const tokenRe = /[a-z0-9:\-\[\]()\/.%*!]+/g;
for (const f of files) {
  const rel = path.relative(root, f);
  const text = fs.readFileSync(f, "utf8");
  // grab every string literal that looks like a class list
  const strings = [...text.matchAll(/["'`]([^"'`\n]*)["'`]/g)]
    .map((m) => m[1])
    .filter((s) =>
      /(^|\s)(flex|grid|inline|block|p[xytrbl]?-|gap-|rounded|text-|bg-|border|h-|w-|size-|font-|shadow|z-|duration|ease|animate|motion|opacity)/.test(
        s,
      ),
    );
  for (const s of strings)
    for (const cls of s.split(/\s+/)) {
      if (!cls || cls.includes("${")) continue;
      const bare = cls.replace(/^([a-z-]+:)+/, ""); // strip variants
      for (const [b, re] of Object.entries(buckets))
        if (re.test(bare)) {
          (counts[b] ??= {})[bare] = ((counts[b] ??= {})[bare] ?? 0) + 1;
          ((where[b] ??= {})[bare] ??= new Set()).add(rel.split("/").pop());
        }
    }
}
let md = `# 01 — Utility-class histogram\n\nGenerated ${new Date().toISOString().slice(0, 10)} over ${files.length} source files (tests and icons excluded). Variant prefixes (hover:, data-[…]:, md:) stripped so the value is what is counted. Arbitrary values (\`[…]\`) and raw numbers are the ones to look at.\n\n`;
for (const [b, m] of Object.entries(counts)) {
  const rows = Object.entries(m).sort((a, z) => z[1] - a[1]);
  md += `## ${b} — ${rows.length} distinct values, ${rows.reduce((n, r) => n + r[1], 0)} uses\n\n| class | uses | files |\n| --- | --- | --- |\n`;
  for (const [k, v] of rows)
    md += `| \`${k}\` | ${v} | ${[...where[b][k]].length}${[...where[b][k]].length <= 3 ? " (" + [...where[b][k]].join(", ") + ")" : ""} |\n`;
  md += "\n";
}
fs.writeFileSync(path.join(import.meta.dirname, "01-class-histogram.md"), md);
for (const [b, m] of Object.entries(counts))
  console.log(b, Object.keys(m).length, "distinct");
