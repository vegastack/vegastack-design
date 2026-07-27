#!/usr/bin/env node
// Prove the change → route scoping in both directions, for both lanes.
//
// WHY THIS EXISTS
//   Scoping is the one optimisation in this repository that can make a gate PASS while checking
//   nothing. An under-capturing scope produces a green run over an empty or irrelevant test set,
//   which reads exactly like success. Nothing else catches that: the contract suite cannot know it
//   was asked the wrong question, and a reviewer reading `selectRoutes` cannot see a missing branch.
//
//   So this verifier asserts the mapping as a table of concrete inputs → exact expected outputs,
//   and it asserts the OPPOSITE direction too: files that must NOT widen the scope, and files that
//   must widen it to everything.
//
//   The sharpest case is the inversion. `apps/docs/vrt/contracts.spec.ts` is non-visual for the
//   pixel lane (editing a spec cannot move a pixel) and GLOBAL for the contract lane (that spec IS
//   the assertions). `apps/docs/vrt/components.spec.ts` is the mirror image. Reusing one lane's list
//   for the other is a silent fail-open, and these are the assertions that stop it.

import assert from "node:assert/strict";

import {
  COMPONENT_ROUTES,
  CONTRACT_SCOPE,
  dependentsByRoute,
  FIXTURE_ROUTES,
  ICONS_ROUTE,
  PIXEL_SCOPE,
  selectRoutes,
} from "./lib/route-scope.mjs";

let checks = 0;

/**
 * A path must be global BY DECLARATION, not by accident.
 *
 * Behavioural assertion alone is not enough here, and that was proven by mutation: deleting
 * `contracts.spec.ts` from CONTRACT_GLOBAL_SURFACE leaves it global anyway, because it then falls
 * through to the unrecognised-is-global branch — so an `expectGlobal` check passed a mapping that had
 * lost its explicit intent. Two structural facts are what actually matter:
 *
 *   (a) the NON-VISUAL list must not match it. `selectRoutes` tests non-visual FIRST, so a path in
 *       both lists is silently skipped — this is the copy-paste failure the inversion invites, and it
 *       is a fail-open, not a fail-closed.
 *   (b) the GLOBAL list must match it, so the behaviour survives any future narrowing of the
 *       fall-through branch.
 */
function expectDeclaredGlobal(lane, config, file, label) {
  assert.ok(
    !config.nonVisual.some((pattern) => pattern.test(file)),
    `${lane}: ${label} is matched by the NON-VISUAL list — non-visual is tested first, so this ` +
      `path would be skipped entirely rather than forcing a sweep`,
  );
  assert.ok(
    config.globalSurface.some((pattern) => pattern.test(file)),
    `${lane}: ${label} must be matched by the GLOBAL list explicitly, not left to the ` +
      `unrecognised-is-global fall-through`,
  );
  expectGlobal(lane, config, [file], label);
  checks += 2;
}

/** Full sweep: `routes === null` is the only encoding of "everything". */
function expectGlobal(lane, config, files, label) {
  const selection = selectRoutes(files, {}, config);
  assert.equal(
    selection.routes,
    null,
    `${lane}: ${label} must force a FULL sweep (routes === null), got ${
      selection.routes && [...selection.routes].join(",")
    }`,
  );
  assert.equal(
    selection.fullPageRoutes,
    null,
    `${lane}: ${label} forced a full sweep but left fullPageRoutes non-null — a partial "everything" is not everything`,
  );
  checks++;
}

/** No effect at all: the lane must not run a single test for this change. */
function expectEmpty(lane, config, files, label) {
  const selection = selectRoutes(files, {}, config);
  assert.notEqual(
    selection.routes,
    null,
    `${lane}: ${label} must NOT force a full sweep`,
  );
  assert.deepEqual(
    [...selection.routes],
    [],
    `${lane}: ${label} must select no fixture routes`,
  );
  assert.deepEqual(
    [...selection.fullPageRoutes],
    [],
    `${lane}: ${label} must select no full-page routes`,
  );
  assert.equal(
    selection.icons,
    false,
    `${lane}: ${label} must not select the icon lane`,
  );
  checks++;
}

function expectRoutes(lane, config, files, expected, label) {
  const selection = selectRoutes(files, {}, config);
  assert.notEqual(
    selection.routes,
    null,
    `${lane}: ${label} must NOT force a full sweep`,
  );
  assert.deepEqual(
    [...selection.routes].sort(),
    [...expected].sort(),
    `${lane}: ${label} selected the wrong fixture routes`,
  );
  checks++;
}

function expectFullPageRoutes(lane, config, files, expected, label) {
  const selection = selectRoutes(files, {}, config);
  assert.notEqual(
    selection.routes,
    null,
    `${lane}: ${label} must not be global`,
  );
  assert.deepEqual(
    [...selection.fullPageRoutes].sort(),
    [...expected].sort(),
    `${lane}: ${label} selected the wrong full-page routes`,
  );
  checks++;
}

// ── the inversion, asserted in both directions ───────────────────────────────────────────────────

expectEmpty(
  "pixel",
  PIXEL_SCOPE,
  ["apps/docs/vrt/contracts.spec.ts"],
  "the contract spec (cannot move a pixel)",
);
expectDeclaredGlobal(
  "contract",
  CONTRACT_SCOPE,
  "apps/docs/vrt/contracts.spec.ts",
  "the contract spec (it IS the assertions)",
);

expectEmpty(
  "pixel",
  PIXEL_SCOPE,
  ["apps/docs/vrt/contract-routes.generated.ts"],
  "the generated route list (only selects routes for this lane)",
);
expectDeclaredGlobal(
  "contract",
  CONTRACT_SCOPE,
  "apps/docs/vrt/contract-routes.generated.ts",
  "the generated route list (it IS the route set)",
);

expectDeclaredGlobal(
  "pixel",
  PIXEL_SCOPE,
  "apps/docs/vrt/components.spec.ts",
  "the pixel spec",
);
expectEmpty(
  "contract",
  CONTRACT_SCOPE,
  ["apps/docs/vrt/components.spec.ts"],
  "the pixel spec (this lane never loads it)",
);

// The JSON authorities are non-visual for BOTH lanes, and the reasoning is a chain that has to hold:
// neither can change what a component page renders, a route-set change necessarily rewrites
// `contract-routes.generated.ts` (which IS contract-global), and `pnpm design:derived:check` fails
// closed if those two drift. Marking `registry.json` global instead would make every pure version
// bump demand the full 108-route sweep, since it carries each item's `meta.version` — the exact waste
// docs/ledger/operator-review.md records removing. The version-bump end of this is asserted for real
// in tooling/verify-classify-change.mjs against a historical Version Packages commit.
for (const [lane, config] of [
  ["pixel", PIXEL_SCOPE],
  ["contract", CONTRACT_SCOPE],
]) {
  expectEmpty(
    lane,
    config,
    ["packages/ui/component-contracts.json"],
    "the contract JSON (the generated route file is the trigger)",
  );
  expectEmpty(
    lane,
    config,
    ["packages/ui/registry.json"],
    "the registry JSON (carries meta.version for every item)",
  );
}

// ── global surfaces ──────────────────────────────────────────────────────────────────────────────

for (const [lane, config] of [
  ["pixel", PIXEL_SCOPE],
  ["contract", CONTRACT_SCOPE],
]) {
  // Declared global, and asserted as such: every one of these must be matched by the lane's global
  // list and must NOT be shadowed by its non-visual list.
  for (const file of [
    "packages/design-tokens/src/color.json",
    "packages/design/src/cn.ts",
    "apps/docs/app/layout.tsx",
    "apps/docs/components/ui/index.ts",
    "apps/docs/components/preview/wrapper.tsx",
    "apps/docs/playwright.config.ts",
    "apps/docs/next.config.ts",
    "pnpm-lock.yaml",
  ])
    expectDeclaredGlobal(lane, config, file, file);

  // Unrecognised is global. This is the branch that keeps every future path safe by default.
  for (const file of [
    "some/new/directory/thing.ts",
    "apps/docs/components/not-a-known-shape.tsx",
    "packages/ui/src/index.ts",
  ])
    expectGlobal(lane, config, [file], `unrecognised path ${file}`);

  // One global file among many scoped ones still forces everything.
  expectGlobal(
    lane,
    config,
    ["packages/ui/registry/ui/button.tsx", "pnpm-lock.yaml"],
    "a scoped change accompanied by a global one",
  );

  // Non-visual for both lanes.
  for (const file of [
    "packages/ui/registry/ui/button.test.tsx",
    "docs/plans/whatever.md",
    "skills/internal/ship/SKILL.md",
    "tooling/design-lint.mjs",
    ".github/workflows/ci.yml",
    ".changeset/some-name.md",
    ".husky/pre-push",
    ".gates/receipt.json",
    "README.md",
    "apps/docs/package.json",
    "packages/ui/tsconfig.json",
    "turbo.json",
    "apps/docs/eslint.config.mjs",
    "packages/ui/vitest.smoke.config.ts",
    "apps/docs/public/r/button.json",
  ])
    expectEmpty(lane, config, [file], `non-visual ${file}`);
}

// ── the dependency closure ───────────────────────────────────────────────────────────────────────

// A component change must reach every route that COMPOSES it, transitively. Under-reaching here is
// the quiet failure mode: `button.tsx` changes, only `/docs/components/button` is checked, and
// `split-button` ships broken.
const buttonClosure = dependentsByRoute.get("/docs/components/button");
assert.ok(
  buttonClosure.size > 1,
  "the fixture for this assertion requires button to have dependents",
);
const buttonFixtureRoutes = [...buttonClosure].filter((route) =>
  FIXTURE_ROUTES.has(route),
);
const buttonBlockRoutes = [...buttonClosure].filter(
  (route) => !FIXTURE_ROUTES.has(route),
);
assert.ok(
  buttonBlockRoutes.length > 0,
  "the fixture for this assertion requires button to reach at least one block route",
);

expectRoutes(
  "pixel",
  PIXEL_SCOPE,
  ["packages/ui/registry/ui/button.tsx"],
  buttonFixtureRoutes,
  "canonical button source → the full fixture closure",
);
// Blocks have no isolated fixture, so the pixel lane routes them to its full-page capture.
expectFullPageRoutes(
  "pixel",
  PIXEL_SCOPE,
  ["packages/ui/registry/ui/button.tsx"],
  buttonBlockRoutes,
  "canonical button source → block routes go to the full-page lane",
);
// The contract lane has no full-page concept and no block assertions, so it selects the component
// routes only. That is precision: a full sweep would not check a block page either.
expectRoutes(
  "contract",
  CONTRACT_SCOPE,
  ["packages/ui/registry/ui/button.tsx"],
  buttonFixtureRoutes.filter((route) =>
    CONTRACT_SCOPE.selectableRoutes.has(route),
  ),
  "canonical button source → the full contract closure",
);
expectFullPageRoutes(
  "contract",
  CONTRACT_SCOPE,
  ["packages/ui/registry/ui/button.tsx"],
  [],
  "canonical button source → no full-page lane exists here",
);

// The generated docs copy-in is the same component and must scope identically. If these two ever
// disagree, a change committed only as a copy-in would be checked differently from its source.
for (const [lane, config] of [
  ["pixel", PIXEL_SCOPE],
  ["contract", CONTRACT_SCOPE],
]) {
  const fromSource = selectRoutes(
    ["packages/ui/registry/ui/button.tsx"],
    {},
    config,
  );
  const fromCopyIn = selectRoutes(
    ["apps/docs/components/ui/button.tsx"],
    {},
    config,
  );
  assert.deepEqual(
    [...fromCopyIn.routes].sort(),
    [...fromSource.routes].sort(),
    `${lane}: the generated docs copy-in must scope identically to the canonical source`,
  );
  checks++;
}

// A preview file changes exactly one page.
expectRoutes(
  "contract",
  CONTRACT_SCOPE,
  ["apps/docs/components/preview/button.tsx"],
  ["/docs/components/button"],
  "a preview file → only its own route",
);

// ── content pages ────────────────────────────────────────────────────────────────────────────────

// A component's MDX page HOSTS the `[data-vrt-preview]` fixture the contract lane probes, so an edit
// there can break that route's contract. The pixel lane treats it as prose: its own full-page
// capture only.
expectRoutes(
  "contract",
  CONTRACT_SCOPE,
  ["apps/docs/content/docs/components/button.mdx"],
  ["/docs/components/button"],
  "a component MDX page → that route's contract",
);
expectRoutes(
  "pixel",
  PIXEL_SCOPE,
  ["apps/docs/content/docs/components/button.mdx"],
  [],
  "a component MDX page → no fixture recapture",
);
expectFullPageRoutes(
  "pixel",
  PIXEL_SCOPE,
  ["apps/docs/content/docs/components/button.mdx"],
  ["/docs/components/button"],
  "a component MDX page → its own full-page capture",
);

// A guides page is not a component route, so the contract lane has nothing to run for it.
expectEmpty(
  "contract",
  CONTRACT_SCOPE,
  ["apps/docs/content/docs/guides/quickstart.mdx"],
  "a guides MDX page (not a contract route)",
);
expectFullPageRoutes(
  "pixel",
  PIXEL_SCOPE,
  ["apps/docs/content/docs/guides/quickstart.mdx"],
  ["/docs/guides/quickstart"],
  "a guides MDX page → its own full-page capture",
);

// ── icons ────────────────────────────────────────────────────────────────────────────────────────

const iconFile = "packages/ui/registry/ui/icons/activity.tsx";
const pixelIcons = selectRoutes([iconFile], {}, PIXEL_SCOPE);
assert.equal(
  pixelIcons.icons,
  true,
  "pixel: an icon source change must select the icon lane",
);
assert.deepEqual(
  [...pixelIcons.fullPageRoutes],
  [ICONS_ROUTE],
  "pixel: an icon source change must capture the icons page",
);
checks++;
// Animated icons live at /docs/foundations/icons, which is not a component route, so NO contract
// assertion reaches them. Non-visual here is precision rather than laxity.
assert.ok(
  !COMPONENT_ROUTES.includes(ICONS_ROUTE),
  "the icons page must not be a contract route, or this assertion is wrong",
);
expectEmpty("contract", CONTRACT_SCOPE, [iconFile], "an icon source change");

// ── explicit overrides ───────────────────────────────────────────────────────────────────────────

for (const [lane, config] of [
  ["pixel", PIXEL_SCOPE],
  ["contract", CONTRACT_SCOPE],
]) {
  const all = selectRoutes(["anything"], { all: true }, config);
  assert.equal(all.routes, null, `${lane}: --all must be a full sweep`);
  assert.equal(
    all.reason,
    "--all",
    `${lane}: --all must report itself as the reason`,
  );
  checks++;

  const explicit = selectRoutes(
    ["packages/design-tokens/src/color.json"],
    { routes: ["/docs/components/button"] },
    config,
  );
  assert.deepEqual(
    [...explicit.routes],
    ["/docs/components/button"],
    `${lane}: --routes must override change detection, even a global change`,
  );
  checks++;

  assert.throws(
    () =>
      selectRoutes([], { routes: ["/docs/components/does-not-exist"] }, config),
    /unknown .* route/,
    `${lane}: --routes must reject a route this lane cannot run`,
  );
  checks++;
}

// A route the pixel lane can capture but the contract lane cannot must be rejected by the contract
// lane rather than silently accepted and then matched by nothing.
const blockRoute = [...FIXTURE_ROUTES].find(
  (route) => !CONTRACT_SCOPE.selectableRoutes.has(route),
);
if (blockRoute)
  assert.throws(
    () => selectRoutes([], { routes: [blockRoute] }, CONTRACT_SCOPE),
    /unknown contract route/,
    "contract: --routes must reject a route with no contract assertions",
  );

// ── the selectable sets themselves ───────────────────────────────────────────────────────────────

assert.equal(
  CONTRACT_SCOPE.selectableRoutes.size,
  COMPONENT_ROUTES.length,
  "the contract lane's selectable set must be exactly the generated component routes",
);
assert.ok(
  COMPONENT_ROUTES.every((route) => CONTRACT_SCOPE.selectableRoutes.has(route)),
  "every generated component route must be selectable by the contract lane",
);
checks += 2;

console.log(
  `✓ route-scope: ${checks} scope assertions — the contracts.spec.ts inversion proven in BOTH ` +
    `directions, unrecognised paths fail open to a full sweep, and the ${buttonClosure.size}-route ` +
    `button dependency closure is reached from source and copy-in alike`,
);
