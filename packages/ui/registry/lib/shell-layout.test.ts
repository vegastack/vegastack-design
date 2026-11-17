import { expect, test } from "vitest";
import {
  clampColumnWidth,
  parseShellCookie,
  resolveShellLayout,
  SHELL_SIZES,
  shellCookie,
} from "./shell-layout";

test("phones get no rail and no column in the flow", () => {
  const layout = resolveShellLayout({ width: 390, columnOpen: true });
  expect(layout).toMatchObject({
    tier: "phone",
    railShown: false,
    columnShown: false,
    pageWidth: 390,
  });
});

test("tablets keep the column out of the flow, so it slides over", () => {
  const layout = resolveShellLayout({ width: 820, columnOpen: true });
  expect(layout).toMatchObject({
    tier: "tablet",
    columnShown: false,
    columnSlidesOver: true,
  });
});

test("laptops keep the column in the flow while the person keeps it open", () => {
  expect(resolveShellLayout({ width: 1280, columnOpen: true })).toMatchObject({
    columnShown: true,
    pageWidth: 1280 - SHELL_SIZES.rail - SHELL_SIZES.divider - 240,
  });
  expect(
    resolveShellLayout({ width: 1280, columnOpen: false }).columnShown,
  ).toBe(false);
  expect(
    resolveShellLayout({ width: 1280, columnOpen: true, hasColumn: false })
      .columnShown,
  ).toBe(false);
});

test("column widths are clamped to their range", () => {
  expect(clampColumnWidth(100)).toBe(SHELL_SIZES.columnMin);
  expect(clampColumnWidth(999)).toBe(SHELL_SIZES.columnMax);
});

test("the cookie round-trips, and a bad one falls back to nothing", () => {
  expect(shellCookie("vs_shell_col", true, 260)).toMatch(
    /^vs_shell_col=open:260; path=\/; max-age=\d+; SameSite=Lax$/,
  );
  expect(parseShellCookie("open:260")).toEqual({ open: true, width: 260 });
  expect(parseShellCookie("closed:9000")).toEqual({
    open: false,
    width: SHELL_SIZES.columnMax,
  });
  expect(parseShellCookie("open")).toEqual({ open: true, width: undefined });
  expect(parseShellCookie("maybe:2")).toBeUndefined();
  expect(parseShellCookie(undefined)).toBeUndefined();
});
