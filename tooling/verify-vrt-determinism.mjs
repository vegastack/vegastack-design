#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export function vrtDeterminismProblems({ sourceConfig, captureSpec }) {
  const problems = [];
  if (
    !/rehypeCodeOptions:\s*\{[\s\S]{0,1600}engine:\s*["']oniguruma["']/.test(
      sourceConfig,
    )
  )
    problems.push(
      "source.config.ts: [syntax-engine] build-time highlighting must use Shiki's Oniguruma engine; the JavaScript engine produced different token scopes on identical-tree builds",
    );
  if (!/async function stabilizeDocumentationChrome\(/.test(captureSpec))
    problems.push(
      "components.spec.ts: [toc-state] full-page capture must stabilize Fumadocs' scroll-driven TOC state",
    );
  if (
    !/await stabilizeDocumentationChrome\(page\);[\s\S]{0,500}toHaveScreenshot\([^)]*\{[\s\S]{0,160}fullPage:\s*true/.test(
      captureSpec,
    )
  )
    problems.push(
      "components.spec.ts: [toc-order] TOC stabilization must run before the full-page screenshot",
    );
  return problems;
}

const valid = {
  sourceConfig: 'rehypeCodeOptions: { engine: "oniguruma" }',
  captureSpec:
    "async function stabilizeDocumentationChrome(page) {}\nawait stabilizeDocumentationChrome(page);\nawait expect(page).toHaveScreenshot('x', { fullPage: true });",
};
assert.deepEqual(vrtDeterminismProblems(valid), []);
assert.match(
  vrtDeterminismProblems({
    ...valid,
    sourceConfig: "rehypeCodeOptions: {}",
  }).join("\n"),
  /syntax-engine/,
);
assert.match(
  vrtDeterminismProblems({
    ...valid,
    captureSpec:
      "await expect(page).toHaveScreenshot('x', { fullPage: true });",
  }).join("\n"),
  /toc-state|toc-order/,
);

const problems = vrtDeterminismProblems({
  sourceConfig: readFileSync("apps/docs/source.config.ts", "utf8"),
  captureSpec: readFileSync("apps/docs/vrt/components.spec.ts", "utf8"),
});
if (problems.length > 0) {
  console.error(problems.map((problem) => `✗ ${problem}`).join("\n"));
  process.exit(1);
}
console.log(
  "✓ VRT determinism: build-time syntax engine and full-page TOC state are pinned; both semantic mutations rejected",
);
