#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  buildImportGraph,
  importDependencies,
  importImpact,
  repositoryImportGraph,
} from "./lib/import-closure.mjs";

let checks = 0;

function graph(sources, owners = {}) {
  return buildImportGraph({
    sources: new Map(Object.entries(sources)),
    owners: new Map(Object.entries(owners)),
    aliases: new Map([
      ["@/components/ui/", "packages/ui/registry/ui/"],
      ["@/components/preview/", "apps/docs/components/preview/"],
    ]),
  });
}

const closure = graph(
  {
    "packages/ui/registry/ui/shared.ts": "export const shared = true;",
    "packages/ui/registry/ui/button.tsx": 'export { shared } from "./shared";',
    "packages/ui/registry/ui/copy-button.tsx":
      'import { Button } from "@/components/ui/button"; export { Button };',
    "packages/ui/registry/ui/menu.tsx":
      'const load = () => import("./copy-button"); export { load };',
  },
  {
    "packages/ui/registry/ui/button.tsx": "button",
    "packages/ui/registry/ui/copy-button.tsx": "copy-button",
    "packages/ui/registry/ui/menu.tsx": "menu",
  },
);
assert.deepEqual(
  importImpact(["packages/ui/registry/ui/shared.ts"], closure).owners,
  ["button", "copy-button", "menu"],
  "relative, re-export, alias, and literal dynamic-import edges must form one reverse closure",
);
checks++;

assert.deepEqual(
  importDependencies(["packages/ui/registry/ui/menu.tsx"], closure).owners,
  ["button", "copy-button", "menu"],
  "forward dependency traversal must reveal every modeled component rendered by a consumer",
);
checks++;

const barrel = graph(
  {
    "packages/ui/registry/ui/index.ts": 'export * from "./button";',
    "packages/ui/registry/ui/button.tsx": "export const Button = 1;",
    "apps/docs/components/preview/button.tsx":
      'import { Button } from "@/components/ui/index"; export { Button };',
  },
  {
    "packages/ui/registry/ui/button.tsx": "button",
    "apps/docs/components/preview/button.tsx": "button-preview",
  },
);
assert.deepEqual(
  importImpact(["packages/ui/registry/ui/button.tsx"], barrel).owners,
  ["button", "button-preview"],
  "barrel consumers must be reached from the exported leaf",
);
checks++;

for (const [label, source, expected] of [
  [
    "computed dynamic import",
    "const name = 'button'; import(`./${name}`);",
    /computed dynamic import/,
  ],
  [
    "unresolved relative import",
    'import "./missing";',
    /unresolved internal import/,
  ],
  [
    "unresolved modeled alias",
    'import "@/components/ui/missing";',
    /unresolved modeled alias/,
  ],
]) {
  const unsafe = graph({ "packages/ui/registry/ui/example.tsx": source });
  const impact = importImpact(["packages/ui/registry/ui/example.tsx"], unsafe);
  assert.equal(impact.full, true, `${label} must widen to full`);
  assert.ok(
    impact.reasons.some((reason) => expected.test(reason)),
    `${label} must retain its exact widening reason`,
  );
  checks += 2;
}

const unrelatedComputed = graph({
  "packages/ui/registry/ui/button.tsx": "export const Button = true;",
  "packages/ui/registry/ui/unrelated.tsx":
    "const name = 'unknown'; export const load = () => import(`./${name}`);",
});
assert.equal(
  importImpact(["packages/ui/registry/ui/button.tsx"], unrelatedComputed).full,
  true,
  "a target change must widen when a computed importer elsewhere has an unbounded domain",
);
checks++;

for (const source of [
  "export const value = import(`@/components/ui/${name}`)",
  "export const value = require(name)",
  "export const value =\n  import(\n    `@/components/ui/${name}`\n  )",
  "{\n  import(\n    routeName\n  )\n}",
]) {
  const unsafeMdx = graph({
    "packages/ui/registry/ui/button.tsx": "export const Button = true;",
    "apps/docs/content/docs/example.mdx": source,
  });
  assert.equal(
    importImpact(["packages/ui/registry/ui/button.tsx"], unsafeMdx).full,
    true,
    "unmodeled dynamic MDX must widen a later target change",
  );
  assert.match(unsafeMdx.issues[0].reason, /computed MDX/);
  checks += 2;
}

const multilineMdx = graph({
  "packages/ui/registry/ui/button.tsx": "export const Button = true;",
  "apps/docs/content/docs/example.mdx": `
import {
  Button
} from "@/components/ui/button"
export {
  Button as ReExportedButton
} from "@/components/ui/button"
{condition ? import(
  "@/components/ui/button"
) : null}
`,
});
assert.equal(multilineMdx.issues.length, 0);
assert.equal(
  multilineMdx.edges.filter(
    ({ from, to }) =>
      from === "apps/docs/content/docs/example.mdx" &&
      to === "packages/ui/registry/ui/button.tsx",
  ).length,
  3,
  "multiline MDX static import, re-export, and literal dynamic import must all be modeled",
);
checks += 2;

const globAndCss = graph({
  "packages/ui/registry/ui/icons/a.tsx": "export const A = true;",
  "packages/ui/registry/ui/icons/b.tsx": "export const B = true;",
  "packages/ui/registry/ui/animated-icons.test.tsx":
    'const icons = import.meta.glob("./icons/*.tsx"); export { icons };',
  "packages/ui/test/contrast.css":
    '@source "../registry/ui/icons/**/*.tsx"; @import "./theme.css";',
  "packages/ui/test/theme.css": ":root {}",
});
assert.equal(globAndCss.issues.length, 0);
assert.equal(
  globAndCss.edges.filter(({ kind }) => kind === "import-meta-glob").length,
  2,
  "literal import.meta.glob must expand every exact source match",
);
assert.equal(
  globAndCss.edges.filter(({ kind }) => kind === "css-source").length,
  2,
  "CSS @source globs must enter the dependency graph",
);
assert.equal(
  globAndCss.edges.filter(({ kind }) => kind === "css-import").length,
  1,
  "relative CSS @import must enter the dependency graph",
);
checks += 4;
for (const source of [
  "const modules = import.meta.glob(pattern);",
  "const modules = import.meta.glob(`./icons/${kind}.tsx`);",
]) {
  const computedGlob = graph({
    "packages/ui/registry/ui/example.tsx": source,
  });
  assert.match(computedGlob.issues[0].reason, /computed import\.meta\.glob/);
  checks++;
}

const cycle = graph(
  {
    "packages/ui/registry/ui/a.ts": 'export * from "./b";',
    "packages/ui/registry/ui/b.ts": 'export * from "./a";',
  },
  {
    "packages/ui/registry/ui/a.ts": "a",
    "packages/ui/registry/ui/b.ts": "b",
  },
);
assert.deepEqual(importImpact(["packages/ui/registry/ui/a.ts"], cycle).owners, [
  "a",
  "b",
]);
checks++;

assert.throws(
  () =>
    buildImportGraph({
      sources: new Map([["same.ts", "export {};"]]),
      ownerEntries: [
        ["same.ts", "a"],
        ["same.ts", "b"],
      ],
    }),
  /duplicate file ownership/,
  "duplicate ownership must fail instead of selecting one owner",
);
checks++;

const real = repositoryImportGraph();
assert.ok(
  real.sources.length > 100,
  "real graph must cover the product sources",
);
assert.match(real.digest, /^[a-f0-9]{64}$/);
assert.equal(
  real.issues.length,
  0,
  "the current product graph must have no unresolved/computed edge",
);
const realButton = importImpact(["packages/ui/registry/ui/button.tsx"], real);
assert.ok(realButton.owners.includes("button"));
assert.ok(
  realButton.owners.includes("copy-button"),
  "real source imports must independently reach a known Button consumer",
);
checks += 5;

console.log(
  `✓ import closure: ${checks} fail-closed assertions; ${real.sources.length} real product sources, ${real.edges.length} internal edges, ${real.issues.length} retained issue(s)`,
);
