#!/usr/bin/env node

import assert from "node:assert/strict";

import { buildConsumePlan } from "./lib/consume-plan.mjs";

const items = [
  {
    name: "leaf",
    registryDependencies: [],
    files: [{ path: "packages/ui/registry/ui/leaf.tsx" }],
  },
  {
    name: "middle",
    registryDependencies: ["@vegastack/leaf"],
    files: [{ path: "packages/ui/registry/ui/middle.tsx" }],
  },
  {
    name: "root",
    registryDependencies: ["@vegastack/middle"],
    files: [{ path: "packages/ui/registry/ui/root.tsx" }],
  },
  {
    name: "separate",
    registryDependencies: [],
    files: [{ path: "packages/ui/registry/ui/separate.tsx" }],
  },
];

const plan = (changedFiles, metadata = {}) =>
  buildConsumePlan({ changedFiles, items, metadata });

assert.deepEqual(
  plan(["packages/ui/registry/ui/leaf.tsx"]).roots,
  ["leaf", "middle", "root"],
  "a leaf change must select every reverse-dependent consumer root",
);
assert.deepEqual(plan(["apps/docs/public/r/separate.json"]).roots, [
  "separate",
]);
assert.deepEqual(plan(["apps/docs/components/ui/middle.tsx"]).roots, [
  "middle",
  "root",
]);

for (const path of [
  "packages/ui/registry.json",
  "apps/docs/public/r/integrity-manifest.json",
  "packages/design/bin/verify-registry-item.mjs",
  "tooling/verify-shadcn-consume.mjs",
  "package.json",
  "pnpm-lock.yaml",
  "packages/design/src/index.ts",
  "packages/design-tokens/src/tokens.ts",
  "skills/public/vegastack-consume/SKILL.md",
]) {
  const result = plan([path]);
  assert.equal(result.mode, "full", `${path} must select exhaustive consume`);
  assert.equal(result.roots.length, items.length);
}

for (const path of [
  "docs/RELEASING.md",
  "docs/plans/a-plan.md",
  ".github/workflows/ci.yml",
  "skills/internal/review/SKILL.md",
  ".husky/pre-push",
]) {
  const result = plan([path]);
  assert.equal(result.mode, "none", `${path} has no consumer-byte effect`);
  assert.equal(result.reuseEnabled, false);
  assert.equal(result.shadowOnly, true);
}

for (const [label, changedFiles, metadata] of [
  ["unknown path", ["new-root-surface.xyz"], {}],
  [
    "unknown registry item",
    ["packages/ui/registry/ui/not-in-authority.tsx"],
    {},
  ],
  ["deletion", ["packages/ui/registry/ui/leaf.tsx"], { deleted: true }],
  ["mode", ["packages/ui/registry/ui/leaf.tsx"], { modeChanged: true }],
  ["symlink", ["packages/ui/registry/ui/leaf.tsx"], { symlinkChanged: true }],
]) {
  assert.equal(
    plan(changedFiles, metadata).mode,
    "full",
    `${label} must widen`,
  );
}

const selected = plan(["packages/ui/registry/ui/middle.tsx"]);
assert.equal(selected.mode, "affected-shadow");
assert.deepEqual(selected.roots, ["middle", "root"]);
assert.deepEqual(selected.layouts, ["default", "src"]);
assert.equal(selected.fullOracleStillRequired, true);
assert.equal(selected.evidenceReusable, false);
assert.deepEqual(selected.runner.args.slice(0, 3), [
  "tooling/verify-shadcn-consume.mjs",
  "--mode",
  "affected",
]);
assert.deepEqual(
  selected.runner.args.filter(
    (value, index, values) => values[index - 1] === "--root",
  ),
  ["middle", "root"],
);

assert.throws(
  () =>
    buildConsumePlan({
      changedFiles: ["packages/ui/registry/ui/leaf.tsx"],
      items: [
        ...items,
        {
          name: "broken",
          registryDependencies: ["@vegastack/missing"],
          files: [{ path: "packages/ui/registry/ui/broken.tsx" }],
        },
      ],
    }),
  /unknown consume dependency missing/,
  "an unmodeled dependency must fail planning rather than disappear from the reverse closure",
);
assert.throws(
  () => buildConsumePlan({ changedFiles: [], items: [...items, items[0]] }),
  /duplicate consume item authority/,
);
assert.throws(
  () =>
    buildConsumePlan({
      changedFiles: [],
      items: [
        ...items,
        {
          name: "conflict",
          registryDependencies: [],
          files: [{ path: "packages/ui/registry/ui/leaf.tsx" }],
        },
      ],
    }),
  /conflicting consume file authority/,
);

console.log(
  "✓ consume plan: reverse closure plus source/manifest/dependency/verifier/alias/lock/unknown/deletion/mode/symlink mutations fail closed; prose/workflow remains shadow-only with the full CI oracle required",
);
