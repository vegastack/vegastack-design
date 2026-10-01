// @vegastack page-layout@0.23.104 sha256-64sPHzQZD/xWR4Wtc8kGm0+E/C+AVkE3vB4LGbqRLcg=

/**
 * The page-layout contract — how wide each route's page is, declared once. `AppShellPage` takes a
 * `size`; this module is where an app keeps the route → size map, so a page and its loading
 * skeleton read the same answer and cannot drift. Plain functions with no React in them: server
 * pages, client skeletons and tests all import it.
 *
 * - `prose` — 720px of content, centred: forms, settings, a create or edit flow.
 * - `default` — 1280px, centred: lists, dashboards, record pages with a rail.
 * - `full` — edge to edge, fills the height: boards, canvases, chat.
 *
 * Route keys are the app's route patterns in Next.js spelling — `[id]` one segment, `[...rest]`
 * one or more, `[[...rest]]` zero or more — with no route groups: `/tasks/[taskId]`,
 * `/products/new/[[...step]]`.
 */

/** A page's width. */
export type PageWidth = "prose" | "default" | "full";

/** Every page width, widest last. */
export const PAGE_WIDTHS: readonly PageWidth[] = ["prose", "default", "full"];

/** The route map `definePageWidths` returns. */
export interface PageWidths<Route extends string = string> {
  /** The map as declared. */
  readonly routes: Readonly<Record<Route, PageWidth>>;
  /** The width of a route pattern — `default` when the map does not list it. */
  widthOf(route: string): PageWidth;
  /** The width for a concrete pathname (`/tasks/4f1…`) — for skeletons and other pathname readers. */
  widthOfPath(pathname: string): PageWidth;
  /** The listed route pattern a pathname resolves to, the most specific one when several match. */
  routeOf(pathname: string): Route | undefined;
}

type Segment =
  | { kind: "static"; value: string }
  | { kind: "dynamic" }
  | { kind: "catch-all" }
  | { kind: "optional-catch-all" };

/** Lower ranks win: a static segment beats `[id]`, which beats `[...rest]`, which beats `[[...rest]]`. */
const RANK = {
  static: 0,
  dynamic: 1,
  "catch-all": 2,
  "optional-catch-all": 3,
} as const;

function segmentsOf(path: string): string[] {
  return path
    .split("?")[0]!
    .split("#")[0]!
    .split("/")
    .filter((s) => s !== "" && !/^\(.*\)$/.test(s) && !s.startsWith("@"));
}

function parse(route: string): Segment[] {
  return segmentsOf(route).map((s): Segment => {
    if (/^\[\[\.\.\.[^\]]+\]\]$/.test(s)) return { kind: "optional-catch-all" };
    if (/^\[\.\.\.[^\]]+\]$/.test(s)) return { kind: "catch-all" };
    if (/^\[[^\]]+\]$/.test(s)) return { kind: "dynamic" };
    return { kind: "static", value: s };
  });
}

/**
 * Whether a concrete pathname is served by a route pattern.
 *
 * @example
 * matchRoute("/tasks/[taskId]", "/tasks/4f1c") // true
 * matchRoute("/products/new/[[...step]]", "/products/new") // true
 */
export function matchRoute(route: string, pathname: string): boolean {
  const pattern = parse(route);
  const path = segmentsOf(pathname);
  for (let i = 0; i < pattern.length; i += 1) {
    const seg = pattern[i]!;
    if (seg.kind === "optional-catch-all") return true;
    if (seg.kind === "catch-all") return path.length > i;
    if (i >= path.length) return false;
    if (seg.kind === "static" && seg.value !== path[i]) return false;
  }
  return path.length === pattern.length;
}

/** Negative when `a` is the more specific pattern (Next.js's own precedence). */
function bySpecificity(a: string, b: string): number {
  const [ra, rb] = [parse(a), parse(b)];
  for (let i = 0; i < Math.min(ra.length, rb.length); i += 1) {
    const d = RANK[ra[i]!.kind] - RANK[rb[i]!.kind];
    if (d !== 0) return d;
  }
  return rb.length - ra.length;
}

/**
 * Declare the app's route → page-width map once. List every signed-in route — a route the map
 * does not name is `default`, but an exhaustive map is what lets `widthOfPath` tell `/tasks/new`
 * from `/tasks/[taskId]` and lets a test hold every page to it.
 *
 * @example
 * export const pageWidths = definePageWidths({
 *   "/": "default",
 *   "/settings/profile": "prose",
 *   "/tasks/[taskId]": "default",
 *   "/ask": "full",
 * });
 * <AppShellPage size="prose">…</AppShellPage> // on /settings/profile — a test compares it to the map
 * <AppShellPage size={pageWidths.widthOfPath(usePathname())}>…</AppShellPage> // a route skeleton
 */
export function definePageWidths<const Route extends string>(
  routes: Record<Route, PageWidth>,
): PageWidths<Route> {
  const frozen = Object.freeze({ ...routes }) as Readonly<
    Record<Route, PageWidth>
  >;
  const patterns = (Object.keys(frozen) as Route[]).sort(bySpecificity);
  const routeOf = (pathname: string) =>
    patterns.find((r) => matchRoute(r, pathname));
  return {
    routes: frozen,
    widthOf: (route) =>
      (frozen as Record<string, PageWidth>)[route] ?? "default",
    widthOfPath: (pathname) => {
      const route = routeOf(pathname);
      return route ? frozen[route] : "default";
    },
    routeOf,
  };
}
