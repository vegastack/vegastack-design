// Change → route scoping, shared by the two lanes that need it.
//
// WHO CONSUMES THIS
//   tooling/contracts-run.mjs   the behaviour-contract lane (320px reflow, RTL containment,
//                               forced-colors focus, effective 24px pointer targets)
//   tooling/vrt-review.mjs      the before/after pixel review
//
// WHY IT IS SHARED
//   Both answer the same question — "which showcase routes can this diff have moved?" — and both
//   need the same transitive `registryDependencies` closure to answer it. One implementation, two
//   configurations.
//
// WHY THE CONFIGURATIONS DIFFER, AND WHY THAT IS THE DANGEROUS PART
//   The two lanes disagree about several paths, and in one case they disagree in OPPOSITE
//   directions. `apps/docs/vrt/contracts.spec.ts` cannot move a pixel, so the pixel lane treats it
//   as non-visual — but it IS the contract lane's assertions, so the contract lane must treat it as
//   global. Getting that backwards produces a scope that silently runs nothing relevant, which reads
//   as a pass. `tooling/verify-route-scope.mjs` asserts both directions.
//
// THE SCOPING CONTRACT, IN ONE LINE
//   Over-capturing costs minutes. Under-capturing ships an unverified change. So anything
//   unrecognised forces a full sweep, and `routes === null` means exactly that.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const CONTRACTS = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/component-contracts.json"), "utf8"),
);

export const COMPONENTS = CONTRACTS.components;
export const BLOCKS = CONTRACTS.blocks;

export const ICONS_ROUTE = CONTRACTS.animatedIcons.sharedContract.docsSlug;
export const ICON_SOURCE_PREFIX = "packages/ui/registry/ui/icons/";
export const ICON_CHUNK_COUNT = Number(
  /ANIMATED_ICON_CHUNK_COUNT = (\d+)/.exec(
    readFileSync(join(ROOT, "apps/docs/vrt/icon-chunks.generated.ts"), "utf8"),
  )?.[1] ?? 0,
);

/** Every component page. This is exactly the set `contracts.spec.ts` iterates. */
export const COMPONENT_ROUTES = COMPONENTS.map((record) => record.docsSlug);

/** Component pages only — the pixel lane's fixture tests do not reach block pages. */
export const FIXTURE_ROUTES = new Set(
  [...COMPONENTS, ...BLOCKS]
    .map((record) => record.docsSlug)
    .filter((route) => route.startsWith("/docs/components/")),
);

/** name → docsSlug, keyed by both the registry name and the docs preview module name. */
export const routeByName = new Map();
for (const record of [...COMPONENTS, ...BLOCKS]) {
  routeByName.set(record.name, record.docsSlug);
  if (record.previewModule)
    routeByName.set(record.previewModule, record.docsSlug);
}

/**
 * docsSlug → the routes that must be rechecked when it changes: itself plus every route whose
 * component composes it, transitively. `registryDependencies` is the right authority —
 * `tooling/verify-registry-deps.mjs` proves it matches the actual imports.
 */
export const dependentsByRoute = (() => {
  const routeByItem = new Map(
    [...COMPONENTS, ...BLOCKS].map((record) => [
      `@vegastack/${record.name}`,
      record.docsSlug,
    ]),
  );
  const directDependents = new Map();
  for (const record of [...COMPONENTS, ...BLOCKS])
    for (const dependency of record.registryDependencies ?? []) {
      const dependencyRoute = routeByItem.get(dependency);
      if (!dependencyRoute) continue;
      if (!directDependents.has(dependencyRoute))
        directDependents.set(dependencyRoute, new Set());
      directDependents.get(dependencyRoute).add(record.docsSlug);
    }
  const closure = new Map();
  for (const route of routeByItem.values()) {
    const reached = new Set([route]);
    const queue = [route];
    while (queue.length > 0)
      for (const dependent of directDependents.get(queue.pop()) ?? []) {
        if (reached.has(dependent)) continue;
        reached.add(dependent);
        queue.push(dependent);
      }
    closure.set(route, reached);
  }
  return closure;
})();

// ── the pixel lane's configuration ───────────────────────────────────────────────────────────────

/**
 * Paths that cannot change a rendered pixel. Checked first.
 *
 * `package.json` is here because a dependency change always moves `pnpm-lock.yaml`, which is
 * global — so nothing is lost. The generated route files are here because they only SELECT routes
 * for this lane; a new one shows up as a `new` entry rather than needing a full recapture.
 */
export const PIXEL_NON_VISUAL = [
  /\.test\.tsx?$/,
  /^docs\//,
  /^skills\//,
  /^tooling\//,
  /^\.github\//,
  /^\.changeset\//,
  /^\.husky\//,
  /^\.gates\//,
  /\.md$/,
  /(^|\/)package\.json$/,
  /(^|\/)tsconfig(\.\w+)?\.json$/,
  /(^|\/)(\.gitignore|\.prettierrc|\.prettierignore|turbo\.json)$/,
  /(^|\/)eslint\.config\.[cm]?js$/,
  /(^|\/)vitest[.\w]*\.config\.ts$/,
  /^apps\/docs\/public\/r\//,
  /^apps\/docs\/vrt\/[^/]*-snapshots\//,
  /^apps\/docs\/vrt\/(contract-routes\.generated|icon-chunks\.generated|page-routes|contracts\.spec)\.ts$/,
  /^packages\/ui\/(component-contracts|registry)\.json$/,
];

/**
 * Paths that change how EVERY page renders — tokens, the shared runtime, the docs shell, the preview
 * infrastructure, the capture itself. Anything matching forces a full capture, because
 * per-component scoping cannot bound the blast radius of a token or layout change.
 */
export const PIXEL_GLOBAL_SURFACE = [
  /^packages\/design-tokens\//,
  /^packages\/design\//,
  /^apps\/docs\/app\//,
  /^apps\/docs\/components\/ui\/index\.ts$/,
  /^apps\/docs\/components\/preview\/(index|utilities|wrapper)\.tsx$/,
  /^apps\/docs\/playwright\.config\.ts$/,
  /^apps\/docs\/vrt\/components\.spec\.ts$/,
  /^apps\/docs\/(next\.config|postcss\.config|source\.config)/,
  /^pnpm-lock\.yaml$/,
];

export const PIXEL_SCOPE = {
  lane: "pixel",
  nonVisual: PIXEL_NON_VISUAL,
  globalSurface: PIXEL_GLOBAL_SURFACE,
  selectableRoutes: FIXTURE_ROUTES,
  // A docs page changes only its own full-page capture — its fixture is unaffected.
  contentPageLane: "full-page",
  iconsSupported: true,
};

// ── the contract lane's configuration ────────────────────────────────────────────────────────────

/**
 * Non-visual FOR CONTRACTS. Diverges from the pixel list in three places, each deliberate:
 *
 *   components.spec.ts / page-routes.ts / icon-chunks.generated.ts
 *     Pixel-lane machinery. The contract lane never loads them.
 *
 *   the icon source tree
 *     Animated icons are documented at `/docs/foundations/icons`, which is NOT a component route,
 *     so no contract assertion reaches them. Marking this non-visual is precision, not laxity — a
 *     full sweep would not check them either.
 *
 *   the two machine-authority JSONs
 *     `component-contracts.json` and `registry.json`. Neither can change what a component page
 *     RENDERS — the markup comes from the component sources and previews. `registry.json` in
 *     particular carries every item's `meta.version`, so treating it as global would make a pure
 *     version bump demand the full 108-route sweep, which is precisely the waste
 *     `docs/ledger/operator-review.md` records removing. And a route-set change cannot hide here:
 *     it necessarily rewrites `contract-routes.generated.ts`, which IS global below, and
 *     `pnpm design:derived:check` fails closed if the two ever drift apart. So the conservative
 *     reading is already covered by a different trigger, and paying for it twice buys nothing.
 *
 *   contracts.spec.ts and contract-routes.generated.ts are ABSENT here on purpose
 *     They are global instead. See CONTRACT_GLOBAL_SURFACE.
 */
export const CONTRACT_NON_VISUAL = [
  /\.test\.tsx?$/,
  /^docs\//,
  /^skills\//,
  /^tooling\//,
  /^\.github\//,
  /^\.changeset\//,
  /^\.husky\//,
  /^\.gates\//,
  /\.md$/,
  /(^|\/)package\.json$/,
  /(^|\/)tsconfig(\.\w+)?\.json$/,
  /(^|\/)(\.gitignore|\.prettierrc|\.prettierignore|turbo\.json)$/,
  /(^|\/)eslint\.config\.[cm]?js$/,
  /(^|\/)vitest[.\w]*\.config\.ts$/,
  /^apps\/docs\/public\/r\//,
  /^apps\/docs\/vrt\/[^/]*-snapshots\//,
  /^apps\/docs\/vrt\/(icon-chunks\.generated|page-routes|components\.spec)\.ts$/,
  /^packages\/ui\/(component-contracts|registry)\.json$/,
  new RegExp(`^${ICON_SOURCE_PREFIX.replace(/\//g, "\\/")}`),
];

/**
 * Global FOR CONTRACTS. Everything the pixel lane calls global, minus its own spec, plus the three
 * authorities that decide what the contract lane asserts and over which routes:
 *
 *   contracts.spec.ts                 the assertions themselves
 *   contract-routes.generated.ts      the route set
 *
 * The JSON authorities those two are generated FROM are deliberately NOT here — see
 * CONTRACT_NON_VISUAL for why the generated file is the correct and sufficient trigger.
 */
export const CONTRACT_GLOBAL_SURFACE = [
  /^packages\/design-tokens\//,
  /^packages\/design\//,
  /^apps\/docs\/app\//,
  /^apps\/docs\/components\/ui\/index\.ts$/,
  /^apps\/docs\/components\/preview\/(index|utilities|wrapper)\.tsx$/,
  /^apps\/docs\/playwright\.config\.ts$/,
  /^apps\/docs\/vrt\/contracts\.spec\.ts$/,
  /^apps\/docs\/vrt\/contract-routes\.generated\.ts$/,
  /^apps\/docs\/(next\.config|postcss\.config|source\.config)/,
  /^pnpm-lock\.yaml$/,
];

export const CONTRACT_SCOPE = {
  lane: "contract",
  nonVisual: CONTRACT_NON_VISUAL,
  globalSurface: CONTRACT_GLOBAL_SURFACE,
  selectableRoutes: new Set(COMPONENT_ROUTES),
  // A component's MDX page HOSTS the fixture the contract lane probes (`[data-vrt-preview]`), so an
  // edit there can break the contract for that route. It is a fixture concern here, not a
  // full-page one — and a docs page that is not a component route is simply out of scope.
  contentPageLane: "fixture-if-selectable",
  iconsSupported: false,
};

// ── selection ────────────────────────────────────────────────────────────────────────────────────

/**
 * Map changed files to the routes worth rechecking, for one lane.
 *
 * Returns `{ routes, fullPageRoutes, icons, reason }`. `routes === null` means "everything" and
 * `fullPageRoutes === null` with it. `options.routes` and `options.all` are explicit overrides.
 */
export function selectRoutes(changedFiles, options = {}, config = PIXEL_SCOPE) {
  const {
    nonVisual,
    globalSurface,
    selectableRoutes,
    contentPageLane,
    iconsSupported,
  } = config;

  if (options.routes) {
    const unknown = options.routes.filter(
      (route) => !selectableRoutes.has(route),
    );
    if (unknown.length > 0)
      throw new Error(`unknown ${config.lane} route(s): ${unknown.join(", ")}`);
    return {
      routes: new Set(options.routes),
      fullPageRoutes: new Set(),
      icons: false,
      reason: "--routes",
    };
  }
  if (options.all)
    return {
      routes: null,
      fullPageRoutes: null,
      icons: iconsSupported,
      reason: "--all",
    };

  const routes = new Set();
  const fullPageRoutes = new Set();
  const globalTriggers = [];
  let icons = false;

  for (const file of changedFiles) {
    if (nonVisual.some((pattern) => pattern.test(file))) continue;
    if (globalSurface.some((pattern) => pattern.test(file))) {
      globalTriggers.push(file);
      continue;
    }
    if (iconsSupported && file.startsWith(ICON_SOURCE_PREFIX)) {
      icons = true;
      fullPageRoutes.add(ICONS_ROUTE);
      continue;
    }
    const content = /^apps\/docs\/content\/(.+)\.mdx$/.exec(file);
    if (content) {
      const route = `/${content[1].replace(/\/index$/, "")}`;
      if (contentPageLane === "full-page") fullPageRoutes.add(route);
      else if (contentPageLane === "fixture-if-selectable") {
        if (selectableRoutes.has(route)) routes.add(route);
      }
      continue;
    }
    // A preview file changes only the page it renders on.
    const preview = /^apps\/docs\/components\/preview\/([^/]+)\.tsx$/.exec(
      file,
    );
    if (preview) {
      const route = routeByName.get(preview[1]);
      if (route) addRoute(route);
      else globalTriggers.push(file);
      continue;
    }
    // Component or block source, canonical or the generated docs copy-in.
    const source =
      /^(?:packages\/ui\/registry\/(?:ui|blocks)|apps\/docs\/components\/ui)\/([^/]+)/.exec(
        file,
      );
    if (source) {
      const route = routeByName.get(source[1].replace(/\.tsx?$/, ""));
      if (route)
        for (const dependent of dependentsByRoute.get(route) ?? [route])
          addRoute(dependent);
      else globalTriggers.push(file);
      continue;
    }
    // Anything unrecognised is treated as global. Over-capturing costs minutes; under-capturing
    // means shipping an unverified change.
    globalTriggers.push(file);
  }

  if (globalTriggers.length > 0) {
    const shown = globalTriggers.slice(0, 3).join(", ");
    const rest =
      globalTriggers.length > 3 ? `, +${globalTriggers.length - 3} more` : "";
    return {
      routes: null,
      fullPageRoutes: null,
      icons: iconsSupported,
      reason: `global surface changed (${shown}${rest})`,
    };
  }
  return { routes, fullPageRoutes, icons, reason: "changed component sources" };

  /**
   * Blocks have no isolated fixture — only a full-page capture reaches them, so a block reached
   * through the dependency closure has to go to that lane or be dropped. A lane with no full-page
   * concept (`fixture-if-selectable`) drops it, because no assertion there could cover it anyway.
   */
  function addRoute(route) {
    if (selectableRoutes.has(route)) routes.add(route);
    else if (contentPageLane === "full-page") fullPageRoutes.add(route);
  }
}

/** Escape a string for literal use inside a RegExp. */
export const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
