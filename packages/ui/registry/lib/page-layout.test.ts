import { expect, test } from "vitest";
import { definePageWidths, matchRoute, PAGE_WIDTHS } from "./page-layout";

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
