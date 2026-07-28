#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  buildSmokeModel,
  SMOKE_DEPENDENCY_SOURCES,
  smokeImpact,
} from "./lib/smoke-scope.mjs";

assert.equal(
  SMOKE_DEPENDENCY_SOURCES.length,
  12,
  "the audited 12 missing dependency sources must remain explicit",
);
for (const source of SMOKE_DEPENDENCY_SOURCES) {
  const result = smokeImpact([source]);
  assert.equal(result.required, true, `${source} must require smoke`);
  assert.ok(result.tests.length > 0, `${source} must reach a selected test`);
}

const button = smokeImpact(["packages/ui/registry/ui/button.tsx"]);
assert.deepEqual(button.tests, [
  "packages/ui/registry/ui/board.test.tsx",
  "packages/ui/registry/ui/copy-button.test.tsx",
  "packages/ui/registry/ui/notification-bell.test.tsx",
  "packages/ui/registry/ui/sortable-list.test.tsx",
]);
assert.ok(
  smokeImpact(["packages/ui/registry/ui/spinner.tsx"]).tests.includes(
    "packages/ui/registry/ui/copy-button.test.tsx",
  ),
  "transitive button -> spinner closure must reach copy-button",
);
assert.ok(
  smokeImpact(["packages/ui/registry/ui/use-file-drop.ts"]).tests.includes(
    "packages/ui/registry/ui/dropzone.test.tsx",
  ),
  "hook dependency must reach dropzone",
);

for (const path of [
  "packages/ui/vitest.config.ts",
  "packages/ui/vitest.setup.ts",
  "pnpm-lock.yaml",
  "packages/ui/contract-smoke-tests.generated.json",
  "packages/ui/registry/ui/unmodeled-new-source.tsx",
]) {
  const result = smokeImpact([path]);
  assert.equal(result.required, true, `${path} must require smoke`);
  assert.equal(result.full, true, `${path} must widen to full smoke`);
}

const stale = smokeImpact(["packages/ui/registry/ui/button.tsx"], {
  shadow: { contractSha256: "stale", entries: {} },
});
assert.equal(stale.full, true, "stale shadow data must widen");
const disagreement = smokeImpact(["packages/ui/registry/ui/button.tsx"], {
  shadow: {
    contractSha256: (await import("./lib/gate-receipt.mjs")).contractSha256(),
    entries: {
      "packages/ui/registry/ui/button.tsx": {
        vitestTests: [],
        disagreement: true,
      },
    },
  },
});
assert.equal(disagreement.full, true, "selector disagreement must widen");

const removedEdge = structuredClone(buildSmokeModel().records).map((record) =>
  record.name === "copy-button"
    ? { ...record, registryDependencies: [] }
    : record,
);
assert.ok(
  !buildSmokeModel(removedEdge)
    .impactByFile.get("packages/ui/registry/ui/button.tsx")
    ?.has("packages/ui/registry/ui/copy-button.test.tsx"),
  "edge-removal mutation must alter the closure oracle",
);

console.log(
  `✓ smoke scope: ${SMOKE_DEPENDENCY_SOURCES.length} audited dependency sources + direct/transitive/hook/global/unknown/stale/disagreement mutations fail closed`,
);
