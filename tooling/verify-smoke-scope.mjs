#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildSmokeModel,
  createVitestImpactContext,
  SMOKE_DEPENDENCY_SOURCES,
  smokeImpact,
  vitestImpact,
  vitestImpactInputDigest,
  vitestFullTestInventory,
} from "./lib/smoke-scope.mjs";
import { vitestImpactContentDigest } from "./lib/classifier-smoke.mjs";

const fullInventory = vitestFullTestInventory();
for (const path of [
  "packages/ui/registry/ui/animated-icons.test.tsx",
  "packages/ui/registry/ui/command.characterization.test.tsx",
  "packages/ui/registry/ui/field-form.test.tsx",
  "packages/ui/test/contrast.browser.test.tsx",
  "packages/ui/test/stacking.browser.test.tsx",
  "packages/ui/test/overlay-portal.browser.test.tsx",
])
  assert.ok(
    fullInventory.includes(path),
    `${path} must remain in the full lane inventory`,
  );
const inventoryFixture = mkdtempSync(join(tmpdir(), "vsk-vitest-inventory-"));
try {
  mkdirSync(join(inventoryFixture, "packages/ui/registry"), {
    recursive: true,
  });
  mkdirSync(join(inventoryFixture, "packages/ui/test"), { recursive: true });
  writeFileSync(
    join(inventoryFixture, "packages/ui/test/new-untracked.test.tsx"),
    "export {};",
  );
  assert.deepEqual(vitestFullTestInventory({ root: inventoryFixture }), [
    "packages/ui/test/new-untracked.test.tsx",
  ]);
  symlinkSync(
    join(inventoryFixture, "packages/ui/test/new-untracked.test.tsx"),
    join(inventoryFixture, "packages/ui/test/symlink.test.tsx"),
  );
  assert.throws(
    () => vitestFullTestInventory({ root: inventoryFixture }),
    /rejects symlink/,
  );
} finally {
  rmSync(inventoryFixture, { recursive: true, force: true });
}

const contentFixture = mkdtempSync(join(tmpdir(), "vsk-impact-content-"));
try {
  const path = join(contentFixture, "packages/ui/registry/ui/button.tsx");
  mkdirSync(join(contentFixture, "packages/ui/registry/ui"), {
    recursive: true,
  });
  writeFileSync(path, "export const Button = true;\n");
  const original = vitestImpactContentDigest({ root: contentFixture });
  writeFileSync(path, "export const Button = false;\n");
  const contentChanged = vitestImpactContentDigest({ root: contentFixture });
  assert.notEqual(
    contentChanged,
    original,
    "source bytes must move the digest",
  );
  chmodSync(path, 0o755);
  const modeChanged = vitestImpactContentDigest({ root: contentFixture });
  assert.notEqual(
    modeChanged,
    contentChanged,
    "file mode must move the digest",
  );
  unlinkSync(path);
  symlinkSync("button-target.tsx", path);
  const symlinkChanged = vitestImpactContentDigest({ root: contentFixture });
  assert.notEqual(
    symlinkChanged,
    modeChanged,
    "file-to-symlink replacement must move the digest",
  );
  unlinkSync(path);
  symlinkSync("different-missing-target.tsx", path);
  assert.notEqual(
    vitestImpactContentDigest({ root: contentFixture }),
    symlinkChanged,
    "two dangling symlink targets must not collapse to the same missing-file digest",
  );
} finally {
  rmSync(contentFixture, { recursive: true, force: true });
}

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
const nonSmoke = smokeImpact(["packages/ui/registry/ui/particle-field.tsx"]);
assert.equal(nonSmoke.full, false);
assert.equal(nonSmoke.required, false);
assert.deepEqual(nonSmoke.tests, []);
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
const currentContext = createVitestImpactContext();
const disagreement = smokeImpact(["packages/ui/registry/ui/button.tsx"], {
  context: currentContext,
  shadow: {
    ...currentContext.shadow,
    entries: {
      ...currentContext.shadow.entries,
      "packages/ui/registry/ui/button.tsx": {
        vitestTests: [],
        disagreement: true,
      },
    },
  },
});
assert.equal(
  disagreement.full,
  true,
  "any independent selector disagreement must widen full",
);
assert.equal(disagreement.disagreement, true);
assert.equal(
  disagreement.required,
  true,
  "selector disagreement must require the lane",
);

const unit = vitestImpact(["packages/ui/registry/ui/marker.tsx"]);
assert.equal(unit.shadowCurrent, true);
assert.equal(unit.full, false);
assert.ok(unit.tests.includes("packages/ui/registry/ui/timeline.test.tsx"));
for (const [path, content] of [
  ["packages/ui/tsconfig.json", '{"compilerOptions":{"paths":{}}}'],
  ["config/typescript-config/react-library.json", '{"extends":"./changed"}'],
  ["pnpm-workspace.yaml", "packages: []"],
  ["packages/ui/vitest.config.ts", "export default {}"],
  [
    "packages/ui/registry/ui/marker.tsx",
    'import "./new-dependency"; export const Marker = true;',
  ],
])
  assert.notEqual(
    vitestImpactInputDigest({ contentOverride: new Map([[path, content]]) }),
    vitestImpactInputDigest(),
    `${path} must invalidate the generated Vitest-related authority`,
  );

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
