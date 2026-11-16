import { expect, test } from "vitest";
import {
  clampColumnWidth,
  clampPanelWidth,
  parseShellCookie,
  resolveShellLayout,
  SHELL_SIZES,
  shellCookie,
} from "./shell-layout";

test("phones get no rail and a full-screen panel", () => {
  const layout = resolveShellLayout({
    width: 390,
    columnOpen: true,
    panelOpen: true,
  });
  expect(layout).toMatchObject({
    tier: "phone",
    railShown: false,
    columnShown: false,
    panelMode: "full",
    pageWidth: 390,
  });
});

test("tablets keep the column out of the flow, so it slides over", () => {
  const layout = resolveShellLayout({
    width: 820,
    columnOpen: true,
    panelOpen: false,
  });
  expect(layout).toMatchObject({
    tier: "tablet",
    columnShown: false,
    columnSlidesOver: true,
    panelMode: "closed",
  });
});

test.each([
  // width, pageMin, column shown, auto-folded, panel mode
  [1440, 640, true, false, "dock"],
  [1280, 640, false, true, "dock"],
  [1024, 640, true, false, "overlay"],
  [1280, 520, true, false, "dock"],
  [1100, 520, false, true, "dock"],
  [1024, 560, true, false, "overlay"],
] as const)(
  "%ipx with a %ipx page: column shown %s (auto-folded %s), panel %s",
  (width, pageMin, shown, folded, mode) => {
    const layout = resolveShellLayout({
      width,
      pageMin,
      columnOpen: true,
      panelOpen: true,
    });
    expect(layout.columnShown).toBe(shown);
    expect(layout.columnAutoFolded).toBe(folded);
    expect(layout.panelMode).toBe(mode);
  },
);

test("a docked panel always leaves the page its minimum, hairline included", () => {
  for (let width = 640; width <= 2400; width += 7) {
    for (const pageMin of [520, 560, 640] as const) {
      const layout = resolveShellLayout({
        width,
        pageMin,
        columnOpen: true,
        panelOpen: true,
        panelWidth: 500,
        columnWidth: 300,
      });
      if (layout.panelMode === "dock")
        expect(layout.pageWidth).toBeGreaterThanOrEqual(pageMin);
    }
  }
});

test("a column the person folded never comes back for the panel", () => {
  const layout = resolveShellLayout({
    width: 1440,
    columnOpen: false,
    panelOpen: true,
  });
  expect(layout).toMatchObject({
    columnShown: false,
    columnAutoFolded: false,
  });
});

test("widths are clamped to their ranges", () => {
  expect(clampColumnWidth(100)).toBe(SHELL_SIZES.columnMin);
  expect(clampColumnWidth(999)).toBe(SHELL_SIZES.columnMax);
  expect(clampPanelWidth(100)).toBe(SHELL_SIZES.panelMin);
  expect(clampPanelWidth(999)).toBe(SHELL_SIZES.panelMax);
});

test("the cookie round-trips, and a bad one falls back to nothing", () => {
  expect(shellCookie("vs_shell_col", true, 260)).toMatch(
    /^vs_shell_col=open:260; path=\/; max-age=\d+; SameSite=Lax$/,
  );
  expect(parseShellCookie("column", "open:260")).toEqual({
    open: true,
    width: 260,
  });
  expect(parseShellCookie("panel", "closed:9000")).toEqual({
    open: false,
    width: SHELL_SIZES.panelMax,
  });
  expect(parseShellCookie("column", "open")).toEqual({
    open: true,
    width: undefined,
  });
  expect(parseShellCookie("column", "maybe:2")).toBeUndefined();
  expect(parseShellCookie("column", undefined)).toBeUndefined();
});
