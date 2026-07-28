#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  affectedOracleEscapes,
  affectedScenarioCandidates,
  planAffectedImpact,
  proposedTurboExternalInputs,
  REQUIRED_AFFECTED_SCENARIOS,
  summarizeAffectedSamples,
  turboExternalFingerprint,
  turboShadowSnapshot,
  validateTurboScriptInventory,
} from "./lib/gate-impact.mjs";

function expectFull(path, label) {
  const plan = planAffectedImpact([path]);
  for (const lane of ["unit", "smoke", "all-browsers", "contracts", "consume"])
    assert.equal(plan.lanes[lane].mode, "full", `${label}: ${lane}`);
  assert.equal(
    plan.unknownPaths.includes(path),
    true,
    `${label}: unknown path retained`,
  );
}

const prose = planAffectedImpact(["docs/plans/example.md"]);
assert.equal(prose.lanes.unit.mode, "none");
assert.equal(prose.lanes.contracts.mode, "none");
assert.equal(prose.lanes.consume.mode, "none");
assert.deepEqual(prose.staticChecks, [
  "operator-docs",
  "prettier",
  "skill-lint",
]);

const workflow = planAffectedImpact([".github/workflows/ci.yml"]);
assert.equal(workflow.lanes.unit.mode, "none");
assert.ok(workflow.staticChecks.includes("workflow-security"));
const guide = planAffectedImpact(["apps/docs/content/docs/guides/example.mdx"]);
assert.equal(guide.lanes.contracts.mode, "none");
assert.deepEqual(guide.turboTasks, ["@vegastack/docs#build"]);

const unit = planAffectedImpact([
  "packages/ui/registry/ui/notification-bell.test.tsx",
]);
assert.deepEqual(unit.lanes.unit.files, [
  "packages/ui/registry/ui/notification-bell.test.tsx",
]);
assert.equal(unit.lanes.smoke.mode, "selected");
assert.deepEqual(unit.lanes["all-browsers"].files, [
  "packages/ui/registry/ui/notification-bell.test.tsx",
]);

const button = planAffectedImpact(["packages/ui/registry/ui/button.tsx"]);
assert.equal(button.lanes.unit.mode, "selected");
assert.ok(
  button.lanes.unit.files.includes(
    "packages/ui/registry/ui/copy-button.test.tsx",
  ),
  "button must invalidate dependent unit tests",
);
assert.ok(
  affectedScenarioCandidates(
    ["packages/ui/registry/ui/button.tsx"],
    button,
  ).includes("foundation"),
);
assert.deepEqual(affectedScenarioCandidates(["docs/plans/example.md"], prose), [
  "prose",
]);
assert.ok(
  affectedScenarioCandidates(["packages/ui/registry/ui/button.tsx"], button, {
    failures: [{ id: "unit", status: "fail" }],
  }).includes("unit-failure"),
);
assert.ok(
  button.lanes.contracts.routes.includes("/docs/components/copy-button"),
  "button must invalidate dependent contract routes",
);
assert.ok(
  button.lanes.smoke.files.includes(
    "packages/ui/registry/ui/sortable-list.test.tsx",
  ),
  "button must invalidate dependent smoke tests",
);
assert.deepEqual(
  affectedOracleEscapes(button, {
    failures: [{ id: "unit", status: "fail" }],
    retryTargets: [
      {
        kind: "vitest",
        lane: "unit",
        file: "packages/ui/registry/ui/copy-button.test.tsx",
      },
    ],
  }),
  [],
  "a failure inside the predicted unit closure is not an escape",
);
assert.equal(
  affectedOracleEscapes(button, {
    failures: [{ id: "consume", status: "fail" }],
  }).length,
  1,
  "a selected consume plan cannot claim an escape verdict without a validated attached consume report",
);
assert.equal(
  affectedOracleEscapes(planAffectedImpact(["new/unknown/file.ts"]), {
    failures: [{ id: "consume", status: "fail" }],
  }).length,
  0,
  "a full consume plan contains a full consume failure",
);

const header = planAffectedImpact(["apps/docs/public/_headers"]);
assert.equal(header.lanes.contracts.mode, "none");
assert.deepEqual(header.boundaryChecks, [
  "build-public",
  "deployment-boundaries",
]);

const registry = planAffectedImpact(["packages/ui/registry/ui/button.tsx"]);
assert.equal(registry.lanes.consume.mode, "selected-shadow");
assert.ok(registry.lanes.consume.items.includes("copy-button"));
assert.equal(
  registry.lanes.consume.execution,
  "shadow-command-available-full-oracle-still-required",
);
assert.equal(registry.consumePlan.shadowOnly, true);
assert.equal(registry.consumePlan.evidenceReusable, false);
assert.equal(registry.consumePlan.fullOracleStillRequired, true);

const generated = planAffectedImpact(["apps/docs/public/r/button.json"]);
assert.equal(generated.lanes.unit.mode, "none");
assert.equal(generated.lanes.contracts.mode, "none");
assert.equal(generated.lanes.consume.mode, "selected-shadow");
assert.ok(generated.lanes.consume.items.includes("copy-button"));
assert.equal(generated.consumePlan.fullOracleStillRequired, true);
const animatedIcon = planAffectedImpact([
  "packages/ui/registry/ui/icons/a-arrow-down.tsx",
]);
assert.equal(animatedIcon.lanes.consume.mode, "selected-shadow");
assert.deepEqual(animatedIcon.lanes.consume.items, ["icon-a-arrow-down"]);
assert.equal(animatedIcon.consumePlan.roots.length, 1);
for (const authority of [
  "packages/ui/registry.json",
  "packages/ui/component-contracts.json",
]) {
  const authorityPlan = planAffectedImpact([authority]);
  for (const lane of ["unit", "smoke", "all-browsers", "contracts", "consume"])
    assert.equal(
      authorityPlan.lanes[lane].mode,
      "full",
      `${authority}: ${lane}`,
    );
}
const smokeAuthority = planAffectedImpact([
  "packages/ui/smoke-impact.generated.json",
]);
assert.equal(smokeAuthority.lanes.smoke.mode, "full");

for (const global of [
  "pnpm-lock.yaml",
  "packages/design-tokens/src/color.json",
  "apps/docs/app/global.css",
  "packages/ui/vitest.setup.ts",
  "apps/docs/playwright.config.ts",
  "tooling/gates.mjs",
]) {
  const plan = planAffectedImpact([global]);
  assert.equal(plan.lanes.unit.mode, "full", `${global}: unit full`);
  assert.equal(plan.lanes.smoke.mode, "full", `${global}: smoke full`);
  assert.equal(plan.lanes.contracts.mode, "full", `${global}: contracts full`);
}

for (const path of [
  "new/unknown/file.ts",
  "packages/ui/registry/ui/unmodeled-source.tsx",
  "apps/docs/components/unknown-neighbor.tsx",
])
  expectFull(path, path);

const modeChange = planAffectedImpact(["packages/ui/registry/ui/button.tsx"], {
  metadataChanged: new Set(["packages/ui/registry/ui/button.tsx"]),
});
assert.equal(modeChange.lanes.unit.mode, "full");
assert.equal(modeChange.lanes.contracts.mode, "full");
for (const label of ["deletion", "symlink", "untracked binary"]) {
  const metadata = planAffectedImpact(["packages/ui/registry/ui/button.tsx"], {
    metadataChanged: new Set(["packages/ui/registry/ui/button.tsx"]),
  });
  assert.equal(metadata.lanes.consume.mode, "full", `${label}: consume full`);
}

const inventory = validateTurboScriptInventory();
assert.ok(
  inventory.references > 0,
  "package task scripts must expose external tooling inputs",
);
assert.equal(
  turboShadowSnapshot(["@vegastack/design-tokens#build"]).activationEligible,
  false,
  "partial external-tool inventory must never authorize task-specific Turbo inputs",
);
const tokenBuild = proposedTurboExternalInputs(
  "@vegastack/design-tokens#build",
);
assert.ok(tokenBuild.includes("tooling/contrast-check.mjs"));
assert.ok(
  !tokenBuild.includes("tooling/release-classify.mjs"),
  "release tooling must not invalidate the token build shadow hash",
);
const baseline = turboExternalFingerprint("@vegastack/design-tokens#build");
const relevantMutation = turboExternalFingerprint(
  "@vegastack/design-tokens#build",
  {
    contentOverride: new Map([["tooling/contrast-check.mjs", "mutated"]]),
  },
);
const unrelatedMutation = turboExternalFingerprint(
  "@vegastack/design-tokens#build",
  {
    contentOverride: new Map([["tooling/release-classify.mjs", "mutated"]]),
  },
);
assert.notEqual(
  relevantMutation,
  baseline,
  "referenced tooling must change the shadow hash",
);
assert.equal(
  unrelatedMutation,
  baseline,
  "unrelated tooling must retain the shadow hash",
);

for (const taskId of [
  "@vegastack/design#lint",
  "@vegastack/design-tokens#build",
  "@vegastack/design-tokens#lint",
  "@vegastack/docs#lint",
  "@vegastack/ui#build",
  "@vegastack/ui#lint",
]) {
  const fingerprint = turboExternalFingerprint(taskId);
  for (const input of proposedTurboExternalInputs(taskId))
    assert.notEqual(
      turboExternalFingerprint(taskId, {
        contentOverride: new Map([[input, `mutation:${input}`]]),
      }),
      fingerprint,
      `${taskId}: mutating ${input} must change the proposed hash`,
    );
}

assert.throws(
  () =>
    validateTurboScriptInventory({
      scripts: { build: "node ../../tooling/${dynamic}.mjs" },
    }),
  /dynamic or unparsed tooling reference/,
);

const samples = Array.from({ length: 30 }, (_, index) => ({
  schema: 1,
  generation: "affected-shadow-v1",
  sampleId: `sample-${index}`,
  scenario:
    REQUIRED_AFFECTED_SCENARIOS[index % REQUIRED_AFFECTED_SCENARIOS.length],
  scenarioCandidates: [
    REQUIRED_AFFECTED_SCENARIOS[index % REQUIRED_AFFECTED_SCENARIOS.length],
  ],
  checkpointEligible: true,
  oracle: {
    status: "pass",
    profile: "production-full",
    valid: true,
    escapes: [],
    receiptUnchanged: true,
    evidenceUnchanged: true,
    treeUnchanged: true,
  },
}));
assert.equal(summarizeAffectedSamples(samples).checkpointReady, true);
assert.equal(
  summarizeAffectedSamples(samples.slice(0, 29)).checkpointReady,
  false,
  "29 samples cannot satisfy the checkpoint",
);
assert.equal(
  summarizeAffectedSamples([
    ...samples,
    {
      ...samples[0],
      oracle: { status: "fail", valid: true, escapes: ["miss"] },
    },
  ]).checkpointReady,
  false,
  "conflicting duplicate/escape must block the checkpoint",
);
assert.equal(
  summarizeAffectedSamples([...samples, { partial: true }]).checkpointReady,
  false,
  "partial/corrupt evidence must block the checkpoint",
);

console.log(
  "✓ gate impact: prose/workflow/unit/smoke/route/foundation/header/registry/global/unknown cases and Turbo external-input mutations fail closed",
);
