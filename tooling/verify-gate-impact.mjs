#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import {
  affectedCohortIdentity,
  affectedOracleEscapes,
  affectedScenarioAttainability,
  affectedScenarioCandidates,
  planAffectedImpact,
  proposedTurboExternalInputs,
  REQUIRED_AFFECTED_SCENARIOS,
  summarizeAffectedSamples,
  turboExternalFingerprint,
  turboShadowSnapshot,
  validateTurboScriptInventory,
} from "./lib/gate-impact.mjs";
import {
  AFFECTED_SAMPLES_DIR,
  fingerprintAffectedProtectedDirectory,
  loadAffectedSamples,
  readAffectedProtectedFile,
  validateAffectedSummaryPath,
  writeImmutableAffectedSample,
} from "./lib/affected-paths.mjs";

function expectFull(path, label) {
  const plan = planAffectedImpact([path]);
  for (const lane of [
    "unit",
    "smoke",
    "all-browsers",
    "contracts",
    "vrt",
    "consume",
  ])
    assert.equal(plan.lanes[lane].mode, "full", `${label}: ${lane}`);
  assert.equal(
    plan.unknownPaths.includes(path),
    true,
    `${label}: unknown path retained`,
  );
}

const prose = planAffectedImpact([
  "docs/plans/2026-07-29-dynamic-dependency-aware-verification.md",
]);
assert.equal(prose.lanes.unit.mode, "none");
assert.equal(prose.lanes.contracts.mode, "none");
assert.equal(prose.lanes.vrt.mode, "none");
assert.equal(prose.lanes.vrt.state, "safely-skipped");
assert.equal(prose.lanes.vrt.reasonCode, "no-vrt-impact");
assert.equal(prose.lanes.consume.mode, "none");
assert.match(prose.selectorDigest, /^[a-f0-9]{64}$/);
assert.deepEqual(prose.staticChecks, [
  "operator-docs",
  "prettier",
  "skill-lint",
]);
for (const unknownOperational of [
  "docs/new-tool.mjs",
  "skills/internal/ship/scripts/new-tool.mjs",
  "docs/assets/new-font.woff2",
  "docs/unknown.asset",
])
  expectFull(
    unknownOperational,
    `${unknownOperational} cannot inherit the prose safe-skip from its directory`,
  );

// Classification is based on explicit authority membership, not a friendly-looking suffix or
// prefix. These files exist while the planner reads them, reproducing how a future tracked file
// would otherwise inherit a fail-open safe skip.
for (const fixture of [
  "docs/unmodeled-current-fixture.md",
  "tooling/release-future-lookalike.mjs",
  "tooling/registry-future-lookalike.mjs",
]) {
  const absolute = join(process.cwd(), fixture);
  writeFileSync(absolute, "fixture\n");
  try {
    expectFull(fixture, `${fixture} is not a declared authority`);
  } finally {
    rmSync(absolute, { force: true });
  }
}

const internalSkill = planAffectedImpact(["skills/internal/ship/SKILL.md"]);
for (const lane of Object.values(internalSkill.lanes))
  assert.equal(lane.mode, "none", "internal skill is operational prose");
assert.equal(
  internalSkill.turboTasks.includes("@vegastack/design#build"),
  false,
);

for (const publicSkillPath of [
  "skills/public/vegastack-design-system/SKILL.md",
  "packages/design/skills/vegastack-design-system/SKILL.md",
]) {
  const publicSkill = planAffectedImpact([publicSkillPath]);
  for (const lane of Object.values(publicSkill.lanes))
    assert.equal(
      lane.mode,
      "none",
      `${publicSkillPath}: public skill is shipped but non-rendered`,
    );
  assert.ok(publicSkill.staticChecks.includes("skill-mirror"));
  assert.ok(publicSkill.staticChecks.includes("package-exports"));
  assert.deepEqual(publicSkill.turboTasks, ["@vegastack/design#build"]);
}

const workflow = planAffectedImpact([".github/workflows/ci.yml"]);
assert.equal(workflow.lanes.unit.mode, "none");
assert.ok(workflow.staticChecks.includes("workflow-security"));
assert.ok(
  affectedScenarioCandidates([".github/workflows/ci.yml"], workflow).includes(
    "workflow",
  ),
);
const hook = planAffectedImpact([".husky/pre-push"]);
assert.equal(hook.lanes.unit.mode, "none");
assert.ok(hook.staticChecks.includes("hooks-installed"));
const designDoctrine = planAffectedImpact(["design.md"]);
assert.ok(designDoctrine.staticChecks.includes("design-sync"));
assert.equal(designDoctrine.lanes.vrt.mode, "selected");
assert.ok(
  designDoctrine.lanes.vrt.fullPageRoutes.includes(
    "/docs/foundations/typography",
  ),
);
assert.deepEqual(designDoctrine.turboTasks, ["@vegastack/docs#build"]);
const changelog = planAffectedImpact(["CHANGELOG.md"]);
assert.ok(changelog.staticChecks.includes("changelog-sync"));
assert.deepEqual(changelog.lanes.vrt.fullPageRoutes, ["/docs/changelog"]);
for (const generatedPath of [
  "docs/ledger/component-matrix.md",
  "docs/research/design-md-audit/audit-register.json",
  "docs/research/design-md-audit/audits/coverage.json",
]) {
  const generatedPlan = planAffectedImpact([generatedPath]);
  assert.ok(generatedPlan.staticChecks.includes("derived-check"));
  assert.equal(generatedPlan.lanes.unit.mode, "none");
}
const generatedSkillRoster = planAffectedImpact([
  "skills/public/vegastack-design-system/references/components.md",
]);
assert.ok(generatedSkillRoster.staticChecks.includes("derived-check"));
assert.ok(generatedSkillRoster.staticChecks.includes("skill-mirror"));
assert.deepEqual(generatedSkillRoster.turboTasks, ["@vegastack/design#build"]);
const guide = planAffectedImpact([
  "apps/docs/content/docs/guides/quickstart.mdx",
]);
assert.equal(guide.lanes.contracts.mode, "none");
assert.deepEqual(guide.lanes.vrt.fullPageRoutes, ["/docs/guides/quickstart"]);
assert.deepEqual(guide.turboTasks, ["@vegastack/docs#build"]);
const markdownGuide = planAffectedImpact([
  "apps/docs/content/docs/guides/future-markdown.md",
]);
assert.equal(
  markdownGuide.lanes.vrt.mode,
  "full",
  "an untracked rendered Markdown path must widen, never inherit operational prose",
);

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
assert.equal(button.lanes.unit.mode, "full");
assert.equal(button.lanes.contracts.mode, "full");
assert.equal(button.lanes.vrt.mode, "full");
assert.equal(button.oracles.importGraph.comparisons[0].disagreement, true);
assert.ok(
  button.oracles.importGraph.comparisons[0].importOwners.includes(
    "copy-button",
  ),
  "the independent import graph must also reach a Button consumer",
);
const buttonWithFreshSmokeAuthority = planAffectedImpact([
  "packages/ui/registry/ui/button.tsx",
  "packages/ui/smoke-impact.generated.json",
]);
assert.equal(buttonWithFreshSmokeAuthority.lanes.contracts.mode, "full");
assert.equal(buttonWithFreshSmokeAuthority.lanes.vrt.mode, "full");
assert.equal(button.oracles.importGraph.comparisons[0].widenedToFull, true);
assert.equal(
  affectedScenarioCandidates(
    ["packages/ui/registry/ui/button.tsx"],
    button,
  ).includes("foundation"),
  false,
  "a dependency-oracle disagreement cannot count as a bounded foundation sample",
);
const marker = planAffectedImpact(["packages/ui/registry/ui/marker.tsx"]);
assert.equal(marker.lanes.unit.mode, "selected");
assert.ok(
  marker.lanes.unit.files.includes("packages/ui/registry/ui/timeline.test.tsx"),
  "an agreeing registry/import closure must include its dependent unit test",
);
assert.ok(
  marker.lanes.contracts.routes.includes("/docs/components/timeline"),
  "an agreeing registry/import closure must include its dependent contract route",
);
assert.deepEqual(
  affectedScenarioCandidates(
    ["docs/plans/2026-07-29-dynamic-dependency-aware-verification.md"],
    prose,
  ),
  ["prose"],
);
assert.ok(
  affectedScenarioCandidates(["packages/ui/registry/ui/marker.tsx"], marker, {
    failures: [{ id: "unit", status: "fail" }],
  }).includes("unit-failure"),
);
assert.ok(
  marker.lanes.vrt.mode === "selected" &&
    marker.lanes.vrt.routes.includes("/docs/components/timeline"),
  "the complete import/registry closure must bound VRT to the changed component and dependents",
);
assert.deepEqual(
  affectedOracleEscapes(marker, {
    failures: [{ id: "unit", status: "fail" }],
    retryTargets: [
      {
        kind: "vitest",
        lane: "unit",
        file: "packages/ui/registry/ui/timeline.test.tsx",
      },
    ],
  }),
  [],
  "a failure inside the predicted unit closure is not an escape",
);
assert.equal(
  affectedOracleEscapes(marker, {
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
assert.ok(
  affectedScenarioCandidates(["apps/docs/public/_headers"], header).includes(
    "header",
  ),
);
const mixedWorkflow = planAffectedImpact([
  ".github/workflows/ci.yml",
  "packages/ui/registry/ui/marker.tsx",
]);
assert.equal(
  affectedScenarioCandidates(
    mixedWorkflow.changedFiles,
    mixedWorkflow,
  ).includes("workflow"),
  false,
  "a workflow label cannot start a full oracle when product-selected work is mixed in",
);
const mixedHeader = planAffectedImpact([
  "apps/docs/public/_headers",
  "packages/ui/registry/ui/marker.tsx",
]);
assert.equal(
  affectedScenarioCandidates(mixedHeader.changedFiles, mixedHeader).includes(
    "header",
  ),
  false,
  "a header label cannot start a full oracle when product-selected work is mixed in",
);

const registry = planAffectedImpact(["packages/ui/registry/ui/marker.tsx"]);
assert.equal(registry.lanes.consume.mode, "selected-shadow");
assert.ok(registry.lanes.consume.items.includes("timeline"));
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
assert.deepEqual(animatedIcon.lanes.unit.files, [
  "packages/ui/registry/ui/animated-icons.test.tsx",
]);
assert.equal(animatedIcon.lanes.vrt.icons, true);
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
assert.equal(smokeAuthority.lanes.smoke.mode, "none");
assert.ok(smokeAuthority.staticChecks.includes("derived-check"));

const routeAuthority = planAffectedImpact(["tooling/lib/route-scope.mjs"]);
assert.equal(routeAuthority.lanes.contracts.mode, "full");
assert.equal(routeAuthority.lanes.vrt.mode, "full");
assert.equal(routeAuthority.lanes.unit.mode, "none");
assert.equal(
  affectedScenarioCandidates(
    routeAuthority.changedFiles,
    routeAuthority,
  ).includes("global"),
  false,
  "a partial-full lane shape cannot advertise the global checkpoint scenario",
);
const affectedCliSource = readFileSync("tooling/gates-affected.mjs", "utf8");
assert.ok(
  affectedCliSource.indexOf("is not supported by this diff/failure shape") <
    affectedCliSource.indexOf('join(ROOT, "tooling/gates.mjs")'),
  "invalid controlled scenario shapes must fail before the complete oracle can spawn",
);
assert.ok(
  affectedCliSource.indexOf("checkpoint execution is blocked before reports") <
    affectedCliSource.indexOf("atomicWriteJson(options.report, report)") &&
    affectedCliSource.indexOf(
      "checkpoint execution is blocked before reports",
    ) < affectedCliSource.indexOf('join(ROOT, "tooling/gates.mjs")'),
  "an unattainable required checkpoint scenario must fail before reports, selected work, or the complete oracle",
);
const unknownGlobal = planAffectedImpact(["new/unknown/file.ts"]);
assert.ok(
  affectedScenarioCandidates(
    unknownGlobal.changedFiles,
    unknownGlobal,
  ).includes("global"),
  "only an all-lanes-full plan may advertise the global scenario",
);

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
  assert.equal(plan.lanes.vrt.mode, "full", `${global}: VRT full`);
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
assert.equal(modeChange.lanes.vrt.mode, "full");
const binaryChange = planAffectedImpact(
  ["packages/ui/registry/ui/button.tsx"],
  { binaryChanged: new Set(["packages/ui/registry/ui/button.tsx"]) },
);
assert.equal(binaryChange.lanes.unit.mode, "full");
assert.equal(binaryChange.lanes.contracts.mode, "full");
assert.equal(binaryChange.lanes.vrt.mode, "full");
assert.match(binaryChange.reasons.join("\n"), /binary content/);
const missingKnownPath = planAffectedImpact([
  "packages/ui/registry/ui/definitely-deleted.test.tsx",
]);
assert.equal(missingKnownPath.lanes.unit.mode, "full");
assert.equal(missingKnownPath.lanes.vrt.mode, "full");
assert.ok(
  missingKnownPath.unknownPaths.includes(
    "packages/ui/registry/ui/definitely-deleted.test.tsx",
  ),
);

const particle = planAffectedImpact([
  "packages/ui/registry/ui/particle-field.tsx",
]);
assert.ok(
  particle.lanes.vrt.mode === "selected" &&
    particle.lanes.vrt.routes.includes("/docs/components/particle-field"),
  "a leaf component must retain its exact bounded VRT route when the complete import graph resolves the catch-all page",
);
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

const currentCohort = affectedCohortIdentity();
const noneLanes = () =>
  Object.fromEntries(
    ["unit", "smoke", "all-browsers", "contracts", "vrt", "consume"].map(
      (lane) => [lane, { mode: "none" }],
    ),
  );
const scenarioShape = (scenario, index) => {
  const plan = { changedFiles: [], lanes: noneLanes() };
  const selectedExecution = {
    state: "safely-skipped",
    reason: "scenario requires no exact selected product lane",
    results: {},
  };
  const oracle = { status: "pass", failedGateIds: [] };
  if (scenario === "prose")
    plan.changedFiles = ["docs/plans/controlled-prose.md"];
  else if (scenario === "workflow")
    plan.changedFiles = [".github/workflows/ci.yml"];
  else if (scenario === "header") {
    plan.changedFiles = ["apps/docs/public/_headers"];
    plan.boundaryChecks = ["build-public", "deployment-boundaries"];
  } else if (scenario === "global") {
    plan.changedFiles = ["pnpm-lock.yaml"];
    for (const lane of Object.keys(plan.lanes))
      plan.lanes[lane] = { mode: "full" };
  } else {
    const lane =
      scenario === "smoke-failure"
        ? "smoke"
        : scenario === "registry-graph"
          ? "consume"
          : scenario === "one-route" || scenario === "foundation"
            ? "contracts"
            : "unit";
    if (lane === "contracts") {
      plan.lanes.contracts = {
        mode: "selected",
        routes: Array.from(
          { length: scenario === "foundation" ? 7 : 1 },
          (_, routeIndex) => `/docs/components/fixture-${routeIndex}`,
        ),
      };
    } else if (lane === "consume")
      plan.lanes.consume = { mode: "selected-shadow" };
    else
      plan.lanes[lane] = {
        mode: "selected",
        files: [`fixture-${index}.test.tsx`],
      };
    const failed = scenario.endsWith("-failure");
    const executed =
      lane === "contracts"
        ? scenario === "foundation"
          ? 56
          : 8
        : lane === "consume"
          ? 4
          : 1;
    selectedExecution.state = failed ? "executed/fail" : "executed/pass";
    delete selectedExecution.reason;
    selectedExecution.results = {
      [lane]: {
        state: failed ? "executed/fail" : "executed/pass",
        durationMs: 3,
        executed,
        ...(lane === "consume" ? { expected: executed } : {}),
        selectorDigest: (index + 200).toString(16).padStart(64, "0"),
        problems: [],
      },
    };
    if (failed) {
      oracle.status = "fail";
      oracle.failedGateIds = [lane];
    }
  }
  return { plan, selectedExecution, oracle };
};
const samples = Array.from({ length: 30 }, (_, index) => {
  const scenario =
    REQUIRED_AFFECTED_SCENARIOS[index % REQUIRED_AFFECTED_SCENARIOS.length];
  const shape = scenarioShape(scenario, index);
  return {
    schema: 1,
    generation: "affected-shadow-v1",
    sampleId: `sample-${index}`,
    tree: `tree-${index}`,
    cohort: currentCohort,
    scenario,
    scenarioCandidates: [scenario],
    checkpointEligible: true,
    classification: { inventoryDigest: index.toString(16).padStart(64, "0") },
    plan: {
      ...shape.plan,
      selectorDigest: (index + 100).toString(16).padStart(64, "0"),
    },
    measurements: { selectorDurationMs: 1, turboDryRunDurationMs: 2 },
    selectedExecution: shape.selectedExecution,
    oracle: {
      ...shape.oracle,
      profile: "production-full",
      valid: true,
      structuredSummaryVerified: true,
      structuredRunId: `run-${index}`,
      durationMs: 4,
      escapes: [],
      receiptUnchanged: true,
      evidenceUnchanged: true,
      treeUnchanged: true,
    },
  };
});
const attainability = affectedScenarioAttainability();
assert.equal(attainability.foundation.attainable, false);
assert.match(attainability.foundation.blocker, /no current >6-route component/);
assert.equal(
  summarizeAffectedSamples(samples).checkpointReady,
  false,
  "synthetic samples cannot bypass an unattainable real foundation fixture",
);
assert.equal(
  summarizeAffectedSamples(samples.slice(0, 29)).checkpointReady,
  false,
  "29 samples cannot satisfy the checkpoint",
);

const blockedCheckpointParent = join(AFFECTED_SAMPLES_DIR, "..");
mkdirSync(blockedCheckpointParent, { recursive: true });
const blockedCheckpointFixture = mkdtempSync(
  join(blockedCheckpointParent, "blocked-checkpoint-fixture-"),
);
try {
  for (const [label, extraArgs] of [
    ["raw ship oracle", []],
    [
      "selected checkpoint",
      ["--execute-selected", "--scenario", "unit-failure"],
    ],
  ]) {
    const blockedReport = join(blockedCheckpointFixture, `${label}.json`);
    const blockedRun = spawnSync(
      process.execPath,
      [
        "tooling/gates-affected.mjs",
        "--oracle",
        "ship",
        ...extraArgs,
        "--report",
        blockedReport,
      ],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
    );
    assert.equal(blockedRun.status, 2, label);
    assert.match(
      `${blockedRun.stdout}\n${blockedRun.stderr}`,
      /checkpoint execution is blocked before reports, selected work, or the full oracle: .*no current >6-route component.*Resolve the authority\/policy checkpoint with MK first/s,
      label,
    );
    assert.equal(
      existsSync(blockedReport),
      false,
      `${label}: a machine-blocked checkpoint cannot write a report or reach selected/full execution`,
    );
  }
} finally {
  rmSync(blockedCheckpointFixture, { recursive: true, force: true });
}
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
assert.equal(
  summarizeAffectedSamples([
    ...samples,
    {
      ...structuredClone(samples[0]),
      sampleId: "same-tree-rerun",
      oracle: {
        ...samples[0].oracle,
        structuredRunId: "different-run-same-tree",
      },
    },
  ]).checkpointReady,
  false,
  "rerunning the same tree/selector cannot inflate the cohort",
);
const matchedFailure = structuredClone(samples);
const unitFailureIndex = matchedFailure.findIndex(
  ({ scenario }) => scenario === "unit-failure",
);
assert.equal(
  summarizeAffectedSamples(matchedFailure).checkpointReady,
  false,
  "a selected failure can be internally valid while the independent foundation checkpoint remains blocked",
);
const mismatchedFailure = structuredClone(matchedFailure);
mismatchedFailure[unitFailureIndex].oracle.failedGateIds = ["smoke"];
assert.equal(
  summarizeAffectedSamples(mismatchedFailure).checkpointReady,
  false,
  "selected and oracle failure universes must agree",
);
const forgedAggregate = structuredClone(matchedFailure);
forgedAggregate[unitFailureIndex].selectedExecution.state = "executed/pass";
assert.equal(
  summarizeAffectedSamples(forgedAggregate).checkpointReady,
  false,
  "aggregate selected state must be reconstructed from child results",
);
for (const [label, mutate] of [
  ["gate generation", (sample) => (sample.cohort.gateGeneration = "stale")],
  ["toolchain", (sample) => (sample.cohort.toolchainDigest = "0".repeat(64))],
  [
    "authority",
    (sample) => (sample.cohort.authorities.gateImpact = "0".repeat(64)),
  ],
]) {
  const mixed = structuredClone(samples);
  mutate(mixed[0]);
  assert.equal(
    summarizeAffectedSamples(mixed).checkpointReady,
    false,
    `mixed ${label} cohort must not count toward the checkpoint`,
  );
}

const loaderFixtureParent = join(AFFECTED_SAMPLES_DIR, "..");
mkdirSync(loaderFixtureParent, { recursive: true });
const loaderFixture = mkdtempSync(
  join(loaderFixtureParent, "loader-integration-fixture-"),
);
const loaderRootAlias = `${loaderFixture}-root-symlink`;
rmSync(loaderRootAlias, { force: true });
try {
  writeImmutableAffectedSample(join(loaderFixture, "sample.json"), samples[0]);
  const loaded = loadAffectedSamples(loaderFixture);
  assert.equal(loaded.samples.length, 1);
  assert.deepEqual(loaded.errors, []);
  assert.deepEqual(
    readAffectedProtectedFile(join(loaderFixture, "sample.json")),
    Buffer.from(`${JSON.stringify(samples[0], null, 2)}\n`),
  );
  const protectedDigest = fingerprintAffectedProtectedDirectory(loaderFixture);
  assert.match(protectedDigest, /^[a-f0-9]{64}$/);
  symlinkSync(loaderFixture, loaderRootAlias);
  assert.match(
    loadAffectedSamples(loaderRootAlias).errors.join("\n"),
    /root is not a regular directory/,
    "a symlinked retained-sample root must corrupt the cohort",
  );
  assert.throws(
    () => fingerprintAffectedProtectedDirectory(loaderRootAlias),
    /protected affected root is not a regular directory/,
  );
  symlinkSync(loaderFixture, join(loaderFixture, "redirect"));
  assert.throws(
    () =>
      writeImmutableAffectedSample(
        join(loaderFixture, "redirect", "redirected.json"),
        samples[0],
      ),
    /parent is not a regular directory/,
    "immutable sample writes must not traverse a symlinked parent",
  );
  rmSync(join(loaderFixture, "redirect"), { force: true });
  writeFileSync(join(loaderFixture, "partial.json"), "{");
  assert.equal(loadAffectedSamples(loaderFixture).errors.length, 1);
  writeFileSync(
    join(loaderFixture, "duplicate-key.json"),
    '{"checkpointEligible":true,"checkpointEligible":false}\n',
  );
  assert.match(
    loadAffectedSamples(loaderFixture).errors.join("\n"),
    /duplicate key|not canonical/,
    "duplicate/conflicting evidence keys must corrupt the cohort",
  );
  writeFileSync(join(loaderFixture, "tampered.json"), '{"sampleId":"x"}\n ');
  assert.match(
    loadAffectedSamples(loaderFixture).errors.join("\n"),
    /tamper|not canonical/,
    "post-write byte tampering must corrupt the cohort",
  );
  writeFileSync(join(loaderFixture, "interrupted.tmp"), "partial");
  mkdirSync(join(loaderFixture, "directory.json"));
  symlinkSync(
    join(loaderFixture, "sample.json"),
    join(loaderFixture, "symlink.json"),
  );
  assert.throws(
    () => readAffectedProtectedFile(join(loaderFixture, "symlink.json")),
    /not a regular non-symlink/,
  );
  assert.throws(
    () => fingerprintAffectedProtectedDirectory(loaderFixture),
    /unsupported entry/,
  );
  assert.equal(
    loadAffectedSamples(loaderFixture).errors.length,
    6,
    "partial, tampered, duplicate-key, non-JSON, directory, and symlink entries must all corrupt the cohort",
  );
  const immutable = join(loaderFixture, "immutable.json");
  writeImmutableAffectedSample(immutable, samples[0]);
  assert.throws(
    () => writeImmutableAffectedSample(immutable, samples[1]),
    /EEXIST/,
    "a retained sample cannot be overwritten",
  );
  assert.throws(
    () =>
      validateAffectedSummaryPath(join(AFFECTED_SAMPLES_DIR, "collision.json")),
    /cannot target immutable sample/,
  );
  assert.match(
    AFFECTED_SAMPLES_DIR,
    /\.gates\/diagnostics\/affected\/samples$/,
  );
} finally {
  rmSync(loaderRootAlias, { force: true });
  rmSync(loaderFixture, { recursive: true, force: true });
}

console.log(
  "✓ gate impact: prose/workflow/unit/smoke/route/foundation/header/registry/global/unknown cases and Turbo external-input mutations fail closed",
);
