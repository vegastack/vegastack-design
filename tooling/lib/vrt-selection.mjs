import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  assertAuthorityFingerprint,
  authorityFingerprint,
} from "./authority-fingerprint.mjs";
import { ROOT } from "./change-set.mjs";

export const VRT_AUTHORITY_PATHS = [
  "apps/docs/vrt/page-routes.generated.ts",
  "apps/docs/vrt/icon-chunks.generated.ts",
  "packages/ui/component-contracts.json",
];

export function readVrtAuthority({ root = ROOT } = {}) {
  const fingerprint = authorityFingerprint(VRT_AUTHORITY_PATHS, { root });
  const source = readFileSync(
    join(root, "apps/docs/vrt/page-routes.generated.ts"),
    "utf8",
  );
  const literals = /VRT_PAGE_ROUTES\s*=\s*\[([\s\S]*?)\]\s+as\s+const;/.exec(
    source,
  );
  const fullPageRoutes = literals
    ? [...literals[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1])
    : [];
  if (fullPageRoutes.length === 0)
    throw new Error("VRT generated page authority has no routable pages");
  if (new Set(fullPageRoutes).size !== fullPageRoutes.length)
    throw new Error("VRT generated page authority contains duplicate routes");
  const contracts = JSON.parse(
    readFileSync(join(root, "packages/ui/component-contracts.json"), "utf8"),
  );
  const components = contracts.components.map((record) => record.docsSlug);
  const missingComponentRoutes = components.filter(
    (route) => !fullPageRoutes.includes(route),
  );
  if (missingComponentRoutes.length > 0)
    throw new Error(
      `VRT page authority omits component route(s): ${missingComponentRoutes.join(", ")}`,
    );
  const iconSource = readFileSync(
    join(root, "apps/docs/vrt/icon-chunks.generated.ts"),
    "utf8",
  );
  const iconChunkCount = Number(
    /ANIMATED_ICON_CHUNK_COUNT = (\d+)/.exec(iconSource)?.[1] ?? 0,
  );
  if (iconChunkCount <= 0)
    throw new Error("VRT icon authority has no generated chunks");
  return {
    fingerprint,
    fullPageRoutes: [...fullPageRoutes].sort(),
    fixtureRoutes: [...new Set(components)].sort(),
    iconsRoute: contracts.animatedIcons.sharedContract.docsSlug,
    iconChunkCount,
    assertCurrent() {
      return assertAuthorityFingerprint(
        VRT_AUTHORITY_PATHS,
        fingerprint,
        "VRT page authority",
        { root },
      );
    },
  };
}

function sorted(values) {
  return [...new Set(values ?? [])].sort();
}

function routeMode(selection) {
  if (selection.routes === null) return "full";
  return selection.routes.size > 0 ||
    selection.fullPageRoutes.size > 0 ||
    selection.icons
    ? "selected"
    : "none";
}

function canonicalSelection(selection) {
  return {
    mode: selection.routes === null ? "full" : routeMode(selection),
    routes: selection.routes === null ? null : sorted(selection.routes),
    fullPageRoutes:
      selection.fullPageRoutes === null
        ? null
        : sorted(selection.fullPageRoutes),
    icons: Boolean(selection.icons),
  };
}

/**
 * Reconcile the shared impact planner with the independently derived VRT route selector.
 * Either oracle may add coverage. Any full result wins; disagreement never narrows.
 */
export function reconcileVrtSelection({
  routeSelection,
  impactLane,
  impactDigest,
  explicitOverride = false,
  includeSelectedFullPages = false,
}) {
  const route = canonicalSelection(routeSelection);
  const impact = {
    mode: impactLane.mode,
    routes: impactLane.mode === "full" ? null : sorted(impactLane.routes),
    fullPageRoutes:
      impactLane.mode === "full" ? null : sorted(impactLane.fullPageRoutes),
    icons: Boolean(impactLane.icons),
  };

  let reconciled;
  let disagreement = false;
  if (route.mode === "full" || impact.mode === "full") {
    reconciled = {
      mode: "full",
      routes: null,
      fullPageRoutes: null,
      icons: true,
    };
    disagreement = route.mode !== impact.mode;
  } else if (explicitOverride) {
    // An explicit diagnostic may focus an already-bounded plan, but it may never narrow a full
    // common impact result. The full branch above deliberately wins first.
    reconciled = route;
  } else {
    reconciled = {
      mode: "none",
      routes: sorted([...(route.routes ?? []), ...(impact.routes ?? [])]),
      fullPageRoutes: sorted([
        ...(route.fullPageRoutes ?? []),
        ...(impact.fullPageRoutes ?? []),
      ]),
      icons: route.icons || impact.icons,
    };
    if (
      reconciled.routes.length > 0 ||
      reconciled.fullPageRoutes.length > 0 ||
      reconciled.icons
    )
      reconciled.mode = "selected";
    disagreement = JSON.stringify(route) !== JSON.stringify(impact);
  }

  if (
    includeSelectedFullPages &&
    reconciled.mode === "selected" &&
    reconciled.routes !== null
  )
    reconciled.fullPageRoutes = sorted([
      ...(reconciled.fullPageRoutes ?? []),
      ...reconciled.routes,
    ]);

  const reasonCode =
    reconciled.mode === "full"
      ? "vrt-full-impact"
      : reconciled.mode === "selected"
        ? "vrt-selected-impact"
        : "no-vrt-impact";
  const digestInput = {
    generation: "vrt-selection-v1",
    explicitOverride,
    includeSelectedFullPages,
    impactDigest,
    route,
    impact,
    reconciled,
    disagreement,
  };
  const selectorDigest = createHash("sha256")
    .update(JSON.stringify(digestInput))
    .digest("hex");

  return {
    routes:
      reconciled.routes === null ? null : new Set(reconciled.routes ?? []),
    fullPageRoutes:
      reconciled.fullPageRoutes === null
        ? null
        : new Set(reconciled.fullPageRoutes ?? []),
    icons: reconciled.icons,
    mode: reconciled.mode,
    state: reconciled.mode === "none" ? "safely-skipped" : "not-reached",
    reasonCode,
    reason: explicitOverride
      ? `explicit VRT ${routeSelection.reason}`
      : disagreement
        ? `common impact and route-scope disagreement widened to ${reconciled.mode}`
        : routeSelection.reason,
    selectorDigest,
    disagreement,
    oracles: { impact, route },
  };
}

/**
 * Replace automatic VRT work with an exact rendered-page diagnostic selector. Explicit fixture
 * routes may be retained when the caller also supplied `--routes`; inferred fixtures and icon work
 * must never leak into a focused page rerun. The independent impact oracle is reconciled later and
 * still widens this selection to full when required.
 */
export function addExplicitVrtFullPageRoutes(
  routeSelection,
  pageRoutes,
  { retainExplicitFixtures = false } = {},
) {
  if (pageRoutes === null) return routeSelection;
  if (!Array.isArray(pageRoutes) || pageRoutes.length === 0)
    throw new Error("VRT --page-routes requires a nonempty exact route list");
  if (new Set(pageRoutes).size !== pageRoutes.length)
    throw new Error("VRT --page-routes rejects duplicate routes");
  for (const route of pageRoutes)
    if (
      typeof route !== "string" ||
      !/^\/(?:[^/\s]+(?:\/[^/\s]+)*)?$/.test(route)
    )
      throw new Error(`VRT --page-routes rejects malformed route: ${route}`);
  return {
    ...routeSelection,
    routes: retainExplicitFixtures ? routeSelection.routes : new Set(),
    fullPageRoutes: new Set(pageRoutes),
    icons: false,
    reason: `${retainExplicitFixtures ? `${routeSelection.reason}; ` : ""}--page-routes`,
  };
}

const leafKey = (leaf) => `${leaf.title}\0${leaf.project}`;

export function expectedVrtLeaves({
  selection,
  allFullPageRoutes,
  allFixtureRoutes,
  projects,
  iconChunkCount = 1,
}) {
  const fullPageRoutes =
    selection.mode === "full"
      ? sorted(allFullPageRoutes)
      : sorted(selection.fullPageRoutes);
  const fixtureRoutes =
    selection.mode === "full"
      ? sorted(allFixtureRoutes)
      : sorted(selection.routes);
  const leaves = [];
  for (const project of projects) {
    for (const route of fullPageRoutes)
      leaves.push({ title: `VRT ${route}`, project });
    for (const route of fixtureRoutes)
      leaves.push({ title: `VRT state ${route}`, project });
    if (selection.icons)
      for (let index = 1; index <= iconChunkCount; index++)
        leaves.push({
          title: `VRT icon chunk ${index}`,
          project,
          chunk: index,
        });
  }
  return leaves.sort((a, b) => leafKey(a).localeCompare(leafKey(b)));
}

export function filterVrtSelectionForAuthority(
  selection,
  authority,
  { allowUnavailable = false } = {},
) {
  if (selection.mode === "full")
    return {
      ...selection,
      routes: new Set(authority.fixtureRoutes),
      fullPageRoutes: new Set(authority.fullPageRoutes),
      icons: true,
    };
  const fixtures = new Set(authority.fixtureRoutes);
  const fullPages = new Set(authority.fullPageRoutes);
  const unavailableRoutes = [...selection.routes].filter(
    (route) => !fixtures.has(route),
  );
  const unavailableFullPageRoutes = [...selection.fullPageRoutes].filter(
    (route) => !fullPages.has(route),
  );
  const unavailableIcons = selection.icons && authority.iconChunkCount <= 0;
  if (
    !allowUnavailable &&
    (unavailableRoutes.length > 0 ||
      unavailableFullPageRoutes.length > 0 ||
      unavailableIcons)
  )
    throw new Error(
      `VRT selected route is absent from authority: ${[
        ...unavailableRoutes,
        ...unavailableFullPageRoutes,
        ...(unavailableIcons ? ["animated-icons"] : []),
      ].join(", ")}`,
    );
  return {
    ...selection,
    routes: new Set(
      [...selection.routes].filter((route) => fixtures.has(route)),
    ),
    fullPageRoutes: new Set(
      [...selection.fullPageRoutes].filter((route) => fullPages.has(route)),
    ),
    icons: selection.icons && authority.iconChunkCount > 0,
    unavailable: {
      routes: unavailableRoutes,
      fullPageRoutes: unavailableFullPageRoutes,
      icons: unavailableIcons,
    },
  };
}

export function assertVrtSelectionAvailableOnEitherTree(
  selection,
  baseSelection,
  headSelection,
) {
  if (selection.mode === "full") return true;
  const absent = [];
  for (const route of selection.routes)
    if (!baseSelection.routes.has(route) && !headSelection.routes.has(route))
      absent.push(`fixture:${route}`);
  for (const route of selection.fullPageRoutes)
    if (
      !baseSelection.fullPageRoutes.has(route) &&
      !headSelection.fullPageRoutes.has(route)
    )
      absent.push(`full-page:${route}`);
  if (selection.icons && !baseSelection.icons && !headSelection.icons)
    absent.push("animated-icons");
  if (absent.length > 0)
    throw new Error(
      `VRT selected work is unavailable on both trees: ${absent.join(", ")}`,
    );
  return true;
}

export function reconcileVrtLeaves(
  expected,
  actual,
  { execution = false, requirePassed = false } = {},
) {
  if (!Array.isArray(expected))
    throw new Error("VRT expected leaf universe is malformed");
  if (!Array.isArray(actual))
    throw new Error("VRT actual leaf universe is malformed");
  if (expected.length === 0 && actual.length === 0)
    return { status: "not-applicable", expected: 0, executed: 0, projects: [] };
  if (expected.length === 0)
    throw new Error(
      "VRT executed unexpected leaves for an empty authority universe",
    );
  if (actual.length === 0) throw new Error("VRT executed zero test leaves");
  const expectedKeys = expected.map(leafKey);
  const actualKeys = actual.map(leafKey);
  if (new Set(actualKeys).size !== actualKeys.length)
    throw new Error("VRT report contains duplicate test leaves");
  const missing = expectedKeys.filter((key) => !actualKeys.includes(key));
  const extra = actualKeys.filter((key) => !expectedKeys.includes(key));
  if (missing.length > 0 || extra.length > 0)
    throw new Error(
      `VRT planned/executed leaf mismatch: missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}`,
    );
  if (execution) {
    const invalid = actual.filter(
      (leaf) =>
        !new Set(requirePassed ? ["passed"] : ["passed", "failed"]).has(
          leaf.outcome,
        ),
    );
    if (invalid.length > 0)
      throw new Error(
        `VRT runtime leaves are skipped, interrupted, timed out, or unknown: ${invalid
          .map(
            (leaf) =>
              `${leaf.title}[${leaf.project}]=${leaf.outcome ?? "unknown"}`,
          )
          .join(",")}`,
      );
  }
  return {
    status: "pass",
    expected: expectedKeys.length,
    executed: actualKeys.length,
    projects: sorted(actual.map((leaf) => leaf.project)),
  };
}
