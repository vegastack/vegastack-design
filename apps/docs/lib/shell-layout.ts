// @vegastack shell-layout@0.93.0 sha256-dloEsU93NBbd49/rA0117wUJwXDYfenLW1FICsWrWh4=

/**
 * The shell's layout rule (LAY-22) as one pure function, plus the sizes, cookies and clamps the
 * shell's parts share.
 *
 * `Shell` lays itself out in CSS — container queries on the shell, no JavaScript — so a server
 * render paints the right layout before hydration. `resolveShellLayout` is the same rule in
 * TypeScript, for code that has to know the outcome without a DOM: a server deciding whether a
 * record opens beside the page, a test, the docs' layout table. The shell's browser test holds the
 * two in step at every tier.
 *
 * The rule (decisions L5 and L14 of the shell layout overhaul):
 * - **Phone** (under 40rem): no rail and no column; the panel, when open, is full screen.
 * - **Tablet** (40–64rem): the rail shows; the column never takes room — it slides over the page.
 * - **Laptop and wide**: the column sits in the flow when the person keeps it open.
 * - With the panel open, it docks beside the page while the page keeps its minimum width
 *   (`pageMin`: list 640, document 560, chat 520). Otherwise the column folds first, and if that is
 *   still not enough the panel slides over the page instead — and the column comes back, because
 *   the page no longer has to share the room.
 */
import { layoutTierOf, type LayoutTier } from "@/lib/page-layout";

/** The shell's widths and heights in CSS pixels at a 16px root — the `--shell-*` tokens. */
export const SHELL_SIZES = Object.freeze({
  rail: 64,
  column: 240,
  columnMin: 200,
  columnMax: 360,
  topBar: 48,
  panel: 420,
  panelMin: 360,
  panelMax: 720,
  bottomBar: 56,
  /** The hairline between the rail (or column) and the page, counted against the page. */
  divider: 1,
  macInset: 78,
  winInset: 138,
} as const);

/** The narrowest a page may get before the panel stops docking beside it. */
export type ShellPageMin = 520 | 560 | 640;

/** The page minimums by kind: a list, a document, a chat. */
export const SHELL_PAGE_MIN = Object.freeze({
  list: 640,
  document: 560,
  chat: 520,
} as const satisfies Record<string, ShellPageMin>);

/** Where the panel is: not shown, beside the page, over the page, or full screen (phones). */
export type ShellPanelMode = "closed" | "dock" | "overlay" | "full";

/** The cookies `ShellStateScript` reads before the first paint. */
export const SHELL_COOKIES = Object.freeze({
  /** `open:<width>` or `closed:<width>`: whether the person keeps the column open, and its width. */
  column: "vs_shell_col",
  /** `open:<width>` or `closed:<width>`: whether the panel was open, and its width. */
  panel: "vs_shell_panel",
} as const);

/** A year: how long a shell cookie keeps the person's choice. */
export const SHELL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** What the layout rule reads. */
export interface ShellLayoutInput {
  /** The shell's own width in CSS pixels (the window, in an app that fills it). */
  width: number;
  /** The tier, when the caller already knows it; otherwise derived from `width`. */
  tier?: LayoutTier;
  /** Whether this screen has a column at all (Home has none). @default true */
  hasColumn?: boolean;
  /** Whether the person keeps the column open. */
  columnOpen: boolean;
  /** The column's width. @default SHELL_SIZES.column */
  columnWidth?: number;
  /** Whether the panel is open. */
  panelOpen: boolean;
  /** The panel's width. @default SHELL_SIZES.panel */
  panelWidth?: number;
  /** The page's minimum width. @default 640 */
  pageMin?: ShellPageMin;
  /** The hairline before the page, in pixels. @default SHELL_SIZES.divider */
  dividerWidth?: number;
}

/** What the layout rule decides. */
export interface ShellLayout {
  tier: LayoutTier;
  /** The rail shows (every tier but phone). */
  railShown: boolean;
  /** The column takes room in the flow. */
  columnShown: boolean;
  /** The column is folded only to make room for the panel; it returns when the panel closes. */
  columnAutoFolded: boolean;
  /** The column can only slide over the page here (tablet), from ▤, an edge swipe or a hover. */
  columnSlidesOver: boolean;
  panelMode: ShellPanelMode;
  /** The width left for the page, in CSS pixels. */
  pageWidth: number;
}

/** A column width kept inside its range. */
export function clampColumnWidth(width: number): number {
  return Math.round(
    Math.min(SHELL_SIZES.columnMax, Math.max(SHELL_SIZES.columnMin, width)),
  );
}

/** A panel width kept inside its range. */
export function clampPanelWidth(width: number): number {
  return Math.round(
    Math.min(SHELL_SIZES.panelMax, Math.max(SHELL_SIZES.panelMin, width)),
  );
}

/**
 * Where everything goes at this width — the same answer the shell's CSS gives.
 *
 * @example
 * resolveShellLayout({ width: 1280, columnOpen: true, panelOpen: true, pageMin: 640 });
 * // → { tier: "laptop", columnShown: false, columnAutoFolded: true, panelMode: "dock", pageWidth: 796, … }
 */
export function resolveShellLayout(input: ShellLayoutInput): ShellLayout {
  const tier = input.tier ?? layoutTierOf(input.width);
  const hasColumn = input.hasColumn ?? true;
  const pageMin = input.pageMin ?? SHELL_PAGE_MIN.list;
  const column = clampColumnWidth(input.columnWidth ?? SHELL_SIZES.column);
  const panel = clampPanelWidth(input.panelWidth ?? SHELL_SIZES.panel);

  if (tier === "phone") {
    return {
      tier,
      railShown: false,
      columnShown: false,
      columnAutoFolded: false,
      columnSlidesOver: false,
      panelMode: input.panelOpen ? "full" : "closed",
      pageWidth: input.width,
    };
  }

  const rail = SHELL_SIZES.rail + (input.dividerWidth ?? SHELL_SIZES.divider);
  const columnInFlow = tier !== "tablet" && hasColumn && input.columnOpen;
  let columnShown = columnInFlow;
  let columnAutoFolded = false;
  let panelMode: ShellPanelMode = "closed";

  if (input.panelOpen) {
    const room = input.width - rail - panel;
    if (room - (columnInFlow ? column : 0) >= pageMin) panelMode = "dock";
    else if (columnInFlow && room >= pageMin) {
      panelMode = "dock";
      columnShown = false;
      columnAutoFolded = true;
    } else panelMode = "overlay";
  }

  return {
    tier,
    railShown: true,
    columnShown,
    columnAutoFolded,
    columnSlidesOver: tier === "tablet" && hasColumn,
    panelMode,
    pageWidth:
      input.width -
      rail -
      (columnShown ? column : 0) -
      (panelMode === "dock" ? panel : 0),
  };
}

/** One saved shell choice: open or closed, at a width. */
export interface ShellCookieValue {
  open: boolean;
  /** The saved width in pixels, clamped to its range; `undefined` when none was saved. */
  width?: number;
}

/**
 * Reads a `vs_shell_col` or `vs_shell_panel` value (`open:240`, `closed:420`, or a bare
 * `open`); `undefined` for anything else, so a stale or tampered cookie falls back to defaults.
 *
 * @example
 * parseShellCookie("column", cookies().get("vs_shell_col")?.value) // { open: true, width: 240 }
 */
export function parseShellCookie(
  kind: "column" | "panel",
  value: string | undefined,
): ShellCookieValue | undefined {
  const match = /^(open|closed)(?::(\d{2,4}))?$/.exec(value ?? "");
  if (!match) return undefined;
  const clamp = kind === "column" ? clampColumnWidth : clampPanelWidth;
  return {
    open: match[1] === "open",
    width: match[2] ? clamp(Number(match[2])) : undefined,
  };
}

/** A `document.cookie` assignment that keeps one shell choice, with its width, for a year. */
export function shellCookie(
  name: string,
  open: boolean,
  width: number,
): string {
  return `${name}=${open ? "open" : "closed"}:${Math.round(width)}; path=/; max-age=${SHELL_COOKIE_MAX_AGE}; SameSite=Lax`;
}
