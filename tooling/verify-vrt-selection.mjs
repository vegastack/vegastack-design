#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  addExplicitVrtFullPageRoutes,
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

const unknownExplicitPage = addExplicitVrtFullPageRoutes(route(), [
  "/docs/not-a-real-page",
]);
const unknownExplicitWithMode = {
  ...unknownExplicitPage,
  mode: "selected",
};
const authorityWithoutExplicitPage = {
  fixtureRoutes: ["/docs/components/button"],
  fullPageRoutes: ["/docs/components/button"],
  iconChunkCount: 1,
};
const filteredUnknownExplicit = filterVrtSelectionForAuthority(
  unknownExplicitWithMode,
  authorityWithoutExplicitPage,
  { allowUnavailable: true },
);
assert.throws(
  () =>
    assertVrtSelectionAvailableOnEitherTree(
      unknownExplicitWithMode,
      filteredUnknownExplicit,
      filteredUnknownExplicit,
    ),
  /unavailable on both trees.*not-a-real-page/,
  "a full impact result must not erase validation of an unknown explicit page",
);

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

const exactRenderedPages = addExplicitVrtFullPageRoutes(
  route(
    ["/docs/components/automatic-fixture"],
    ["/docs/guides/automatic-page"],
    true,
  ),
  ["/docs/foundations/elevation", "/internal/internal-projects"],
);
assert.deepEqual([...exactRenderedPages.routes], []);
assert.deepEqual(
  [...exactRenderedPages.fullPageRoutes],
  ["/docs/foundations/elevation", "/internal/internal-projects"],
);
assert.equal(exactRenderedPages.icons, false);
assert.equal(exactRenderedPages.reason, "--page-routes");
const exactFixturesAndPages = addExplicitVrtFullPageRoutes(
  route(["/docs/components/button"], ["/docs/guides/automatic-page"], true),
  ["/docs/guides/quickstart"],
  { retainExplicitFixtures: true },
);
assert.deepEqual(
  [...exactFixturesAndPages.routes],
  ["/docs/components/button"],
);
assert.deepEqual(
  [...exactFixturesAndPages.fullPageRoutes],
  ["/docs/guides/quickstart"],
);
assert.equal(exactFixturesAndPages.icons, false);
assert.equal(
  exactFixturesAndPages.reason,
  "independent route authority; --page-routes",
);
for (const [label, args, expected] of [
  [
    "ambiguous all plus exact page",
    ["--all", "--page-routes", "/docs/guides/quickstart", "--dry-run"],
    /--all cannot be combined/,
  ],
  [
    "trailing whitespace",
    ["--page-routes", "/docs/guides/quickstart ", "--dry-run"],
    /page-routes rejects empty, whitespace, or malformed routes/,
  ],
  [
    "empty fixture selector",
    ["--routes", ",", "--dry-run"],
    /--routes rejects empty, whitespace, or malformed routes/,
  ],
  [
    "duplicate fixture selector",
    [
      "--routes",
      "/docs/components/button,/docs/components/button",
      "--dry-run",
    ],
    /--routes rejects duplicate routes/,
  ],
]) {
  const result = spawnSync(
    process.execPath,
    ["tooling/vrt-review.mjs", ...args],
    { cwd: process.cwd(), encoding: "utf8", timeout: 30_000 },
  );
  assert.equal(result.status, 2, `${label} must fail before capture`);
  assert.match(`${result.stdout}\n${result.stderr}`, expected);
}
for (const invalid of [
  [],
  ["/docs/foundations/elevation", "/docs/foundations/elevation"],
  ["docs/foundations/elevation"],
  ["/docs/foundations/elevation "],
])
  assert.throws(
    () => addExplicitVrtFullPageRoutes(route([], []), invalid),
    /page-routes/,
  );

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
  if (!/explicitSelectors/.test(source))
    problems.push(
      "[explicit-selectors] VRT reports must retain exact requested selectors even when impact widens",
    );
  if (
    !/assertVrtSelectionAvailableOnEitherTree\(\s*explicitRouteSelectionWithMode/.test(
      source,
    )
  )
    problems.push(
      "[explicit-validation] exact requested selectors must be validated independently from widened execution",
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
explicitSelectors;
assertVrtSelectionAvailableOnEitherTree(explicitRouteSelectionWithMode);
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
    "missing explicit selector report",
    validSource.replace("explicitSelectors;", ""),
    /explicit-selectors/,
  ],
  [
    "missing independent explicit validation",
    validSource.replace(
      "assertVrtSelectionAvailableOnEitherTree(explicitRouteSelectionWithMode);",
      "",
    ),
    /explicit-validation/,
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

export function vrtHarnessProblems(source) {
  const problems = [];
  if (!/if \(path !== "\/docs\/components\/otp-input"\) return;/.test(source))
    problems.push(
      "[fixture-route] OTP readiness must apply to the exact OTP fixture route",
    );
  if (!/\.toHaveCount\(5\)/.test(source))
    problems.push(
      "[fixture-count] OTP readiness must require exactly five hydrated roots",
    );
  if (!/\.toBe\(5\)/.test(source))
    problems.push(
      "[fixture-layout-count] OTP readiness must require five laid-out roots",
    );
  for (const [label, expected] of [
    ["width", /box\.width > 0/],
    ["height", /box\.height > 0/],
    ["display", /style\.display !== "none"/],
    ["visibility", /style\.visibility !== "hidden"/],
  ])
    if (!expected.test(source))
      problems.push(
        `[fixture-${label}] OTP readiness must reject hidden or zero-layout roots`,
      );
  if (!/element\.scrollTop = 0/.test(source))
    problems.push(
      "[fixture-scroll-reset] OTP capture must reset nested vertical scroll",
    );
  if (!/await states\.first\(\)\.scrollIntoViewIfNeeded\(\)/.test(source))
    problems.push(
      "[fixture-scroll-anchor] OTP capture must anchor its first state row",
    );
  if (
    !/box\.top >= fixtureBox\.y/.test(source) ||
    !/box\.bottom <= fixtureBox\.y \+ fixtureBox\.height/.test(source)
  )
    problems.push(
      "[fixture-containment] every OTP row must remain inside the screenshot target",
    );
  if (!/if \(path === "\/docs\/components\/otp-input"\)/.test(source))
    problems.push(
      "[fixture-page-clip-route] page clipping must apply only to the exact OTP fixture route",
    );
  if (!/const clip = await fixture\.boundingBox\(\);/.test(source))
    problems.push(
      "[fixture-page-clip-box] OTP page clipping must derive its rectangle from the verified fixture",
    );
  if (!/if \(clip === null\)\s+throw new Error\(/.test(source))
    problems.push(
      "[fixture-page-clip-null] a missing OTP fixture rectangle must fail closed",
    );
  if (
    !/await expect\(page\)\.toHaveScreenshot\(snapshotName, \{[\s\S]*?clip,[\s\S]*?\}\);/.test(
      source,
    )
  )
    problems.push(
      "[fixture-page-clip-capture] OTP must use a page screenshot clipped to the verified fixture rectangle",
    );
  if (!/else\s+await expect\(fixture\)\.toHaveScreenshot\(/.test(source))
    problems.push(
      "[fixture-locator-default] non-OTP fixtures must retain locator screenshot coverage",
    );
  const readiness = source.indexOf(
    "await stabilizeComponentFixture(path, fixture);",
  );
  const pageScreenshot = source.indexOf(
    "await expect(page).toHaveScreenshot(snapshotName,",
  );
  const fixtureScreenshot = source.indexOf(
    "await expect(fixture).toHaveScreenshot(",
  );
  if (
    readiness < 0 ||
    pageScreenshot < 0 ||
    fixtureScreenshot < 0 ||
    readiness > pageScreenshot ||
    readiness > fixtureScreenshot
  )
    problems.push(
      "[fixture-order] complete fixture readiness must run before the screenshot",
    );
  return problems;
}

const harnessSource = readFileSync("apps/docs/vrt/components.spec.ts", "utf8");
assert.deepEqual(vrtHarnessProblems(harnessSource), []);
for (const [label, source, expected] of [
  [
    "wrong readiness route",
    harnessSource.replace(
      'path !== "/docs/components/otp-input"',
      'path !== "/docs/components/button"',
    ),
    /fixture-route/,
  ],
  [
    "OTP readiness returns on OTP",
    harnessSource.replace(
      'path !== "/docs/components/otp-input"',
      'path === "/docs/components/otp-input"',
    ),
    /fixture-route/,
  ],
  [
    "three hydrated roots accepted",
    harnessSource.replace(".toHaveCount(5)", ".toHaveCount(3)"),
    /fixture-count/,
  ],
  [
    "three laid-out roots accepted",
    harnessSource.replace(".toBe(5);", ".toBe(3);"),
    /fixture-layout-count/,
  ],
  [
    "zero width accepted",
    harnessSource.replace("box.width > 0 &&", "true &&"),
    /fixture-width/,
  ],
  [
    "zero height accepted",
    harnessSource.replace("box.height > 0 &&", "true &&"),
    /fixture-height/,
  ],
  [
    "display none accepted",
    harnessSource.replace('style.display !== "none" &&', "true &&"),
    /fixture-display/,
  ],
  [
    "visibility hidden accepted",
    harnessSource.replace('style.visibility !== "hidden"', "true"),
    /fixture-visibility/,
  ],
  [
    "readiness moved after screenshot",
    `${harnessSource.replace("await stabilizeComponentFixture(path, fixture);", "")}\nawait stabilizeComponentFixture(path, fixture);`,
    /fixture-order/,
  ],
  [
    "nested vertical scroll retained",
    harnessSource.replace("element.scrollTop = 0;", "void element.scrollTop;"),
    /fixture-scroll-reset/,
  ],
  [
    "first row not anchored",
    harnessSource.replace("await states.first().scrollIntoViewIfNeeded();", ""),
    /fixture-scroll-anchor/,
  ],
  [
    "top containment removed",
    harnessSource.replace("box.top >= fixtureBox.y &&", "true &&"),
    /fixture-containment/,
  ],
  [
    "bottom containment removed",
    harnessSource.replace(
      "box.bottom <= fixtureBox.y + fixtureBox.height,",
      "true,",
    ),
    /fixture-containment/,
  ],
  [
    "page clip widened to every fixture",
    harnessSource.replace(
      'if (path === "/docs/components/otp-input")',
      'if (path !== "/docs/components/otp-input")',
    ),
    /fixture-page-clip-route/,
  ],
  [
    "page clip no longer derives from fixture",
    harnessSource.replace(
      "const clip = await fixture.boundingBox();",
      "const clip = { x: 0, y: 0, width: 1, height: 1 };",
    ),
    /fixture-page-clip-box/,
  ],
  [
    "missing fixture rectangle accepted",
    harnessSource.replace(
      'if (clip === null)\n          throw new Error("OTP VRT fixture has no screenshot rectangle");',
      "void clip;",
    ),
    /fixture-page-clip-null/,
  ],
  [
    "OTP reverted to locator screenshot",
    harnessSource.replace(
      "await expect(page).toHaveScreenshot(snapshotName,",
      "await expect(fixture).toHaveScreenshot(snapshotName,",
    ),
    /fixture-page-clip-capture/,
  ],
  [
    "OTP clip omitted",
    harnessSource.replace("          clip,", ""),
    /fixture-page-clip-capture/,
  ],
  [
    "non-OTP locator capture removed",
    harnessSource.replace(
      "else\n        await expect(fixture).toHaveScreenshot(",
      "if (false)\n        await expect(fixture).toHaveScreenshot(",
    ),
    /fixture-locator-default/,
  ],
])
  assert.match(vrtHarnessProblems(source).join("\n"), expected, label);

console.log(
  "✓ VRT selection: exact diagnostics, 7 report mutations, and 19 fixture-readiness/clip mutations verified",
);
