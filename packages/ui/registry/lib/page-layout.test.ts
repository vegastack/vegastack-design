import { expect, test } from "vitest";
import {
  definePageWidths,
  LAYOUT_TIERS,
  layoutTierOf,
  layoutTierQuery,
  matchRoute,
  PAGE_WIDTHS,
  pageGutterOf,
  RAIL_COLLAPSED_QUERY,
} from "./page-layout";

test("the three widths, and nothing else", () => {
  expect(PAGE_WIDTHS).toEqual(["prose", "default", "full"]);
});

test("matchRoute reads Next.js route patterns", () => {
  expect(matchRoute("/", "/")).toBe(true);
  expect(matchRoute("/tasks/[taskId]", "/tasks/4f1c")).toBe(true);
  expect(matchRoute("/tasks/[taskId]", "/tasks")).toBe(false);
  expect(matchRoute("/tasks/[taskId]", "/tasks/4f1c/edit")).toBe(false);
  expect(matchRoute("/docs/[...slug]", "/docs")).toBe(false);
  expect(matchRoute("/docs/[...slug]", "/docs/a/b")).toBe(true);
  expect(matchRoute("/products/new/[[...step]]", "/products/new")).toBe(true);
  expect(matchRoute("/products/new/[[...step]]", "/products/new/2")).toBe(true);
  expect(matchRoute("/(app)/settings", "/settings/")).toBe(true);
  expect(matchRoute("/settings", "/settings?tab=a#b")).toBe(true);
});

const widths = definePageWidths({
  "/": "default",
  "/tasks": "default",
  "/tasks/new": "prose",
  "/tasks/[taskId]": "default",
  "/products/[productId]": "default",
  "/products/new/[[...step]]": "prose",
  "/board/[...view]": "full",
});

test("a static segment beats a dynamic one, which beats a catch-all", () => {
  expect(widths.routeOf("/tasks/new")).toBe("/tasks/new");
  expect(widths.routeOf("/tasks/4f1c")).toBe("/tasks/[taskId]");
  expect(widths.routeOf("/products/new")).toBe("/products/new/[[...step]]");
  expect(widths.routeOf("/products/4f1c")).toBe("/products/[productId]");
  expect(widths.widthOfPath("/products/new/3")).toBe("prose");
  expect(widths.widthOfPath("/board/week/2")).toBe("full");
});

test("an unlisted route or path is default", () => {
  expect(widths.widthOf("/elsewhere")).toBe("default");
  expect(widths.widthOf("/tasks/new")).toBe("prose");
  expect(widths.widthOfPath("/elsewhere/1")).toBe("default");
  expect(widths.routeOf("/elsewhere")).toBeUndefined();
});

test("the declared map is frozen", () => {
  expect(Object.isFrozen(widths.routes)).toBe(true);
});

// The tier set lives twice — as Tailwind theme sizes for classes and here for scripts — and the
// components spell its values literally so a copied-in component needs no token release.
const raw = (files: Record<string, string>) => Object.values(files)[0] ?? "";
const tokensCss = raw(
  import.meta.glob<string>("../../../design-tokens/src/utilities.css", {
    query: "?raw",
    import: "default",
    eager: true,
  } as { eager: true }),
);
const documentLayoutSource = raw(
  import.meta.glob<string>("../ui/document-layout.tsx", {
    query: "?raw",
    import: "default",
    eager: true,
  } as { eager: true }),
);

test("LAYOUT_TIERS equals the design-tokens container and breakpoint sizes", () => {
  for (const tier of ["tablet", "laptop", "wide"] as const) {
    expect(tokensCss).toContain(
      `--container-${tier}: ${LAYOUT_TIERS[tier]}rem;`,
    );
    expect(tokensCss).toContain(
      `--breakpoint-${tier}: ${LAYOUT_TIERS[tier]}rem;`,
    );
  }
});

test("DocumentLayout's tiers start at the layout tiers", () => {
  for (const rem of [
    LAYOUT_TIERS.tablet,
    LAYOUT_TIERS.laptop,
    LAYOUT_TIERS.wide,
  ]) {
    expect(documentLayoutSource).toContain(`@min-[${rem}rem]/document-layout:`);
  }
  expect(documentLayoutSource).not.toContain("@min-[60rem]/document-layout:");
});

test("layoutTierOf, layoutTierQuery, pageGutterOf", () => {
  expect(
    [390, 640, 768, 1023, 1024, 1439, 1440, 2560].map((w) => layoutTierOf(w)),
  ).toEqual([
    "phone",
    "tablet",
    "tablet",
    "tablet",
    "laptop",
    "laptop",
    "wide",
    "wide",
  ]);
  expect(layoutTierQuery("tablet", "laptop")).toBe(
    "(min-width: 40rem) and (max-width: 63.99rem)",
  );
  expect(layoutTierQuery(undefined, "tablet")).toBe("(max-width: 39.99rem)");
  expect(layoutTierQuery("phone")).toBe("all");
  expect(RAIL_COLLAPSED_QUERY).toBe(
    "(min-width: 48rem) and (max-width: 63.99rem)",
  );
  expect([390, 640, 1024, 1919, 1920].map(pageGutterOf)).toEqual([
    16, 24, 32, 32, 48,
  ]);
});
