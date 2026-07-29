#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertVrtSelectionAvailableOnEitherTree,
  expectedVrtLeaves,
  filterVrtSelectionForAuthority,
  readVrtAuthority,
  reconcileVrtLeaves,
  reconcileVrtSelection,
} from "./lib/vrt-selection.mjs";
import {
  assertVrtPageRoutesCurrent,
  generatedVrtPageRoutes,
} from "./sync-vrt-page-routes.mjs";

const route = (routes = [], fullPageRoutes = [], icons = false) => ({
  routes: new Set(routes),
  fullPageRoutes: new Set(fullPageRoutes),
  icons,
  reason: "independent route authority",
});

const none = reconcileVrtSelection({
  routeSelection: route(),
  impactLane: { mode: "none" },
  impactDigest: "a".repeat(64),
});
assert.equal(none.mode, "none");
assert.equal(none.state, "safely-skipped");
assert.equal(none.reasonCode, "no-vrt-impact");
assert.equal(none.disagreement, false);
assert.match(none.selectorDigest, /^[a-f0-9]{64}$/);

const union = reconcileVrtSelection({
  routeSelection: route(["/docs/components/button"]),
  impactLane: {
    mode: "selected",
    routes: ["/docs/components/copy-button"],
    fullPageRoutes: ["/docs/blocks/dashboard-01"],
  },
  impactDigest: "b".repeat(64),
});
assert.equal(union.mode, "selected");
assert.deepEqual(
  [...union.routes],
  ["/docs/components/button", "/docs/components/copy-button"],
);
assert.deepEqual([...union.fullPageRoutes], ["/docs/blocks/dashboard-01"]);
assert.equal(union.disagreement, true);
assert.match(union.reason, /disagreement widened/);

const full = reconcileVrtSelection({
  routeSelection: route(),
  impactLane: { mode: "full" },
  impactDigest: "c".repeat(64),
});
assert.equal(full.mode, "full");
assert.equal(full.routes, null);
assert.equal(full.state, "not-reached");
assert.equal(full.disagreement, true);

const explicit = reconcileVrtSelection({
  routeSelection: route(["/docs/components/button"]),
  impactLane: {
    mode: "selected",
    routes: ["/docs/components/copy-button"],
  },
  impactDigest: "d".repeat(64),
  explicitOverride: true,
});
assert.equal(explicit.mode, "selected");
assert.deepEqual([...explicit.routes], ["/docs/components/button"]);
assert.equal(explicit.disagreement, false);

const explicitCannotNarrowFull = reconcileVrtSelection({
  routeSelection: route(["/docs/components/button"]),
  impactLane: { mode: "full" },
  impactDigest: "f".repeat(64),
  explicitOverride: true,
});
assert.equal(explicitCannotNarrowFull.mode, "full");
assert.equal(explicitCannotNarrowFull.routes, null);

const fullPages = reconcileVrtSelection({
  routeSelection: route(["/docs/components/button"]),
  impactLane: {
    mode: "selected",
    routes: ["/docs/components/button"],
  },
  impactDigest: "e".repeat(64),
  includeSelectedFullPages: true,
});
assert.deepEqual([...fullPages.fullPageRoutes], ["/docs/components/button"]);
assert.notEqual(fullPages.selectorDigest, explicit.selectorDigest);

const expectedLeaves = expectedVrtLeaves({
  selection: union,
  allFullPageRoutes: ["/all"],
  allFixtureRoutes: ["/fixture"],
  projects: ["chromium", "chromium-dark"],
});
assert.equal(expectedLeaves.length, 6);
assert.equal(
  reconcileVrtLeaves(expectedLeaves, expectedLeaves).executed,
  expectedLeaves.length,
);
for (const [label, actual, expected] of [
  ["zero", [], /zero/],
  ["partial project", expectedLeaves.slice(0, -1), /mismatch/],
  ["duplicate", [...expectedLeaves, expectedLeaves[0]], /duplicate/],
  [
    "unexpected",
    [...expectedLeaves, { title: "VRT /extra", project: "chromium" }],
    /mismatch/,
  ],
])
  assert.throws(
    () => reconcileVrtLeaves(expectedLeaves, actual),
    expected,
    label,
  );
assert.equal(reconcileVrtLeaves([], []).status, "not-applicable");
const executedLeaves = expectedLeaves.map((leaf) => ({
  ...leaf,
  outcome: "passed",
}));
assert.equal(
  reconcileVrtLeaves(expectedLeaves, executedLeaves, { execution: true })
    .executed,
  expectedLeaves.length,
);
assert.doesNotThrow(
  () =>
    reconcileVrtLeaves(
      expectedLeaves,
      executedLeaves.map((leaf, index) =>
        index === 0 ? { ...leaf, outcome: "failed" } : leaf,
      ),
      { execution: true },
    ),
  "a screenshot-difference failure remains classifiable by the report assembler",
);
for (const outcome of [
  "skipped",
  "interrupted",
  "timedOut",
  "not-run",
  undefined,
])
  assert.throws(
    () =>
      reconcileVrtLeaves(
        expectedLeaves,
        executedLeaves.map((leaf, index) =>
          index === 0 ? { ...leaf, outcome } : leaf,
        ),
        { execution: true },
      ),
    /runtime leaves/,
    `${outcome ?? "missing"} runtime outcome must fail closed`,
  );
assert.throws(
  () =>
    reconcileVrtLeaves(
      expectedLeaves,
      executedLeaves.map((leaf, index) =>
        index === 0 ? { ...leaf, outcome: "failed" } : leaf,
      ),
      { execution: true, requirePassed: true },
    ),
  /runtime leaves/,
  "the base capture requires every runtime leaf to pass",
);

const routeAdditionPlan = {
  mode: "selected",
  routes: new Set(["/docs/components/new-component"]),
  fullPageRoutes: new Set(["/docs/components/new-component"]),
  icons: false,
};
const baseFiltered = filterVrtSelectionForAuthority(
  routeAdditionPlan,
  {
    fixtureRoutes: [],
    fullPageRoutes: [],
    iconChunkCount: 1,
  },
  { allowUnavailable: true },
);
const headFiltered = filterVrtSelectionForAuthority(routeAdditionPlan, {
  fixtureRoutes: ["/docs/components/new-component"],
  fullPageRoutes: ["/docs/components/new-component"],
  iconChunkCount: 1,
});
assert.equal(
  assertVrtSelectionAvailableOnEitherTree(
    routeAdditionPlan,
    baseFiltered,
    headFiltered,
  ),
  true,
);
assert.equal(
  expectedVrtLeaves({
    selection: baseFiltered,
    allFullPageRoutes: [],
    allFixtureRoutes: [],
    projects: ["chromium"],
  }).length,
  0,
  "a route added on HEAD must not be required from the base authority",
);
assert.equal(
  expectedVrtLeaves({
    selection: headFiltered,
    allFullPageRoutes: headFiltered.fullPageRoutes,
    allFixtureRoutes: headFiltered.routes,
    projects: ["chromium"],
  }).length,
  2,
  "a route added on HEAD must be captured as new in both selected lanes",
);
const removedHeadFiltered = filterVrtSelectionForAuthority(
  routeAdditionPlan,
  {
    fixtureRoutes: [],
    fullPageRoutes: [],
    iconChunkCount: 1,
  },
  { allowUnavailable: true },
);
assert.equal(
  assertVrtSelectionAvailableOnEitherTree(
    routeAdditionPlan,
    headFiltered,
    removedHeadFiltered,
  ),
  true,
  "a removed route remains represented by the base tree",
);
assert.equal(
  expectedVrtLeaves({
    selection: removedHeadFiltered,
    allFullPageRoutes: [],
    allFixtureRoutes: [],
    projects: ["chromium"],
  }).length,
  0,
  "a route removed on HEAD must be absent from the HEAD universe so base snapshots become removed entries",
);
assert.throws(
  () =>
    filterVrtSelectionForAuthority(routeAdditionPlan, {
      fixtureRoutes: [],
      fullPageRoutes: [],
      iconChunkCount: 1,
    }),
  /selected route is absent from authority/,
  "an explicitly selected route must never be silently filtered",
);
assert.throws(
  () =>
    assertVrtSelectionAvailableOnEitherTree(
      routeAdditionPlan,
      baseFiltered,
      removedHeadFiltered,
    ),
  /unavailable on both trees/,
  "an unknown route absent on both trees must fail rather than skip",
);

const currentAuthority = readVrtAuthority();
assert.ok(
  currentAuthority.fullPageRoutes.includes("/docs/foundations/elevation"),
  "the actual authority must retain a real formerly unlisted rendered MDX route",
);
assert.ok(
  currentAuthority.fullPageRoutes.includes("/docs/guides/multi-step-form"),
);
currentAuthority.assertCurrent();
const realMdxSelection = filterVrtSelectionForAuthority(
  {
    mode: "selected",
    routes: new Set(),
    fullPageRoutes: new Set(["/docs/foundations/elevation"]),
    icons: false,
  },
  currentAuthority,
);
assert.equal(
  expectedVrtLeaves({
    selection: realMdxSelection,
    allFullPageRoutes: currentAuthority.fullPageRoutes,
    allFixtureRoutes: currentAuthority.fixtureRoutes,
    projects: ["chromium", "chromium-dark", "webkit", "webkit-dark"],
    iconChunkCount: currentAuthority.iconChunkCount,
  }).length,
  4,
  "a real non-component MDX route must produce nonzero exact VRT leaves",
);

const routeFixture = mkdtempSync(join(tmpdir(), "vrt-page-routes-"));
try {
  const content = join(routeFixture, "apps/docs/content");
  mkdirSync(join(content, "docs/foundations"), { recursive: true });
  mkdirSync(join(content, "internal"), { recursive: true });
  writeFileSync(
    join(content, "docs/foundations/elevation.mdx"),
    "---\ntitle: Elevation\n---\n",
  );
  writeFileSync(
    join(content, "internal/runbook.mdx"),
    "---\ntitle: Runbook\n---\n",
  );
  const before = generatedVrtPageRoutes({ root: routeFixture });
  assert.deepEqual(before.routes, [
    "/",
    "/docs/foundations/elevation",
    "/internal/runbook",
  ]);
  mkdirSync(join(routeFixture, "apps/docs/vrt"), { recursive: true });
  const generatedPath = join(
    routeFixture,
    "apps/docs/vrt/page-routes.generated.ts",
  );
  writeFileSync(generatedPath, before.source);
  assert.equal(
    assertVrtPageRoutesCurrent({ root: routeFixture }).routes.length,
    3,
  );
  writeFileSync(generatedPath, `${before.source}// tampered\n`);
  assert.throws(
    () => assertVrtPageRoutesCurrent({ root: routeFixture }),
    /missing or stale/,
  );
  rmSync(generatedPath);
  assert.throws(
    () => assertVrtPageRoutesCurrent({ root: routeFixture }),
    /missing or stale/,
  );
  writeFileSync(generatedPath, before.source);
  writeFileSync(
    join(content, "docs/foundations/radius.mdx"),
    "---\ntitle: Radius\n---\n",
  );
  const added = generatedVrtPageRoutes({ root: routeFixture });
  assert.ok(added.routes.includes("/docs/foundations/radius"));
  rmSync(join(content, "docs/foundations/elevation.mdx"));
  const removed = generatedVrtPageRoutes({ root: routeFixture });
  assert.ok(!removed.routes.includes("/docs/foundations/elevation"));
  mkdirSync(join(content, "docs/[slug]"), { recursive: true });
  writeFileSync(join(content, "docs/[slug]/page.mdx"), "dynamic\n");
  assert.throws(
    () => generatedVrtPageRoutes({ root: routeFixture }),
    /dynamic MDX route/,
  );
  rmSync(join(content, "docs/[slug]"), { recursive: true, force: true });
  symlinkSync(
    join(content, "internal/runbook.mdx"),
    join(content, "docs/symlink.mdx"),
  );
  assert.throws(
    () => generatedVrtPageRoutes({ root: routeFixture }),
    /rejects symlink/,
  );
  rmSync(join(content, "docs/symlink.mdx"), { force: true });
  mkdirSync(join(content, "docs/duplicate"), { recursive: true });
  writeFileSync(join(content, "docs/duplicate.mdx"), "duplicate\n");
  writeFileSync(join(content, "docs/duplicate/index.mdx"), "duplicate\n");
  assert.throws(
    () => generatedVrtPageRoutes({ root: routeFixture }),
    /duplicate routable MDX route/,
  );
} finally {
  rmSync(routeFixture, { recursive: true, force: true });
}
const iconPlan = {
  mode: "selected",
  routes: new Set(),
  fullPageRoutes: new Set(),
  icons: true,
};
for (const [chunks, expected] of [
  [2, 2],
  [3, 3],
  [1, 1],
])
  assert.equal(
    expectedVrtLeaves({
      selection: filterVrtSelectionForAuthority(iconPlan, {
        fixtureRoutes: [],
        fullPageRoutes: [],
        iconChunkCount: chunks,
      }),
      allFullPageRoutes: [],
      allFixtureRoutes: [],
      projects: ["chromium"],
      iconChunkCount: chunks,
    }).length,
    expected,
    "every icon chunk must be an independent exact leaf",
  );

export function vrtReportProblems(source) {
  const problems = [];
  if (!/atomicWriteJson\(join\(OUTPUT_DIR, "report\.json"\)/.test(source))
    problems.push("[atomic-report] VRT reports must use the atomic writer");
  if (!/state: "safely-skipped"/.test(source))
    problems.push("[skip-state] an empty VRT scope must report safely-skipped");
  if (!/"executed\/fail"[\s\S]{0,80}"executed\/pass"/.test(source))
    problems.push(
      "[execution-state] captures must report executed/pass or executed/fail",
    );
  if (!/reconcileVrtLeaves\(baseExpectedLeaves, baseTests/.test(source))
    problems.push("[base-leaves] base VRT leaves must reconcile exactly");
  if (!/reconcileVrtLeaves\(headExpectedLeaves, headTests/.test(source))
    problems.push(
      "[head-leaves] working-tree VRT leaves must reconcile exactly",
    );
  if (!/outcome: result\?\.status \?\? "not-run"/.test(source))
    problems.push(
      "[runtime-outcome] VRT must retain Playwright runtime status",
    );
  if (!/has no readable baseline snapshot/.test(source))
    problems.push(
      "[unchanged-snapshot] unchanged VRT leaves require a readable baseline",
    );
  if (!/state: "unknown"/.test(source))
    problems.push(
      "[unknown-state] incomplete VRT execution must report unknown",
    );
  if (!/selectorDigest: selection\.selectorDigest/.test(source))
    problems.push(
      "[selector-digest] VRT reports must retain the reconciled selector digest",
    );
  if (
    !/receiptWritten: false/.test(source) ||
    !/evidenceEligibility: "human-review-only"/.test(source)
  )
    problems.push(
      "[evidence-boundary] VRT review must never become receipt evidence",
    );
  return problems;
}

const validSource = `
atomicWriteJson(join(OUTPUT_DIR, "report.json"), payload);
state: "safely-skipped";
state: broken ? "executed/fail" : "executed/pass";
reconcileVrtLeaves(baseExpectedLeaves, baseTests);
reconcileVrtLeaves(headExpectedLeaves, headTests);
outcome: result?.status ?? "not-run";
throw new Error("has no readable baseline snapshot");
state: "unknown";
selectorDigest: selection.selectorDigest;
receiptWritten: false;
evidenceEligibility: "human-review-only";
`;
assert.deepEqual(vrtReportProblems(validSource), []);
for (const [label, source, expected] of [
  [
    "non-atomic report",
    validSource.replace("atomicWriteJson", "writeFileSync"),
    /atomic-report/,
  ],
  [
    "unstructured skip",
    validSource.replace('state: "safely-skipped";', ""),
    /skip-state/,
  ],
  [
    "missing execution outcome",
    validSource.replace(
      'state: broken ? "executed\/fail" : "executed\/pass";',
      "",
    ),
    /execution-state/,
  ],
  [
    "missing base reconciliation",
    validSource.replace(
      "reconcileVrtLeaves(baseExpectedLeaves, baseTests);",
      "",
    ),
    /base-leaves/,
  ],
  [
    "missing head reconciliation",
    validSource.replace(
      "reconcileVrtLeaves(headExpectedLeaves, headTests);",
      "",
    ),
    /head-leaves/,
  ],
  [
    "discarded runtime outcome",
    validSource.replace('outcome: result?.status ?? "not-run";', ""),
    /runtime-outcome/,
  ],
  [
    "missing unchanged baseline check",
    validSource.replace(
      'throw new Error("has no readable baseline snapshot");',
      "",
    ),
    /unchanged-snapshot/,
  ],
  [
    "missing digest",
    validSource.replace("selectorDigest: selection.selectorDigest;", ""),
    /selector-digest/,
  ],
  [
    "receipt promotion",
    validSource.replace("receiptWritten: false;", "receiptWritten: true;"),
    /evidence-boundary/,
  ],
])
  assert.match(vrtReportProblems(source).join("\n"), expected, label);

assert.deepEqual(
  vrtReportProblems(readFileSync("tooling/vrt-review.mjs", "utf8")),
  [],
);

console.log(
  "✓ VRT selection: route/common-plan disagreement widens; exact diagnostics and 5 structured-report mutations verified",
);
