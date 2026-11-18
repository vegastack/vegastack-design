// @vegastack shell-layout@0.114.0 sha256-2O16utvjPrfG6aUYkp/VUN8cGUgv8DBE+jGDb7pkEVQ=

/**
 * The shell's layout rule (LAY-22) as one pure function, plus the sizes, cookie and clamp the
 * shell's parts share.
 *
 * `Shell` lays itself out in CSS — container queries on the shell, no JavaScript — so a server
 * render paints the right layout before hydration. `resolveShellLayout` is the same rule in
 * TypeScript, for code that has to know the outcome without a DOM: a server render, a test, the
 * docs' layout table. The shell's browser test holds the
 * two in step at every tier.
 *
 * The rule (decisions L5 and L14 of the shell layout overhaul):
 * - **Phone** (under 40rem): no rail and no column in the flow.
 * - **Tablet** (40–64rem): the rail shows; the column never takes room — it slides over the page.
 * - **Laptop and wide**: the column sits in the flow when the person keeps it open.
 *
 * There is no shell-level right panel (layout v2, D11): a record opens in `Peek` over the page area,
 * or on its page, where `RecordLayout`'s side panel lives inside the page.
 */
import { layoutTierOf, type LayoutTier } from "@/lib/page-layout";

/** The shell's widths and heights in CSS pixels at a 16px root — the `--shell-*` tokens. */
export const SHELL_SIZES = Object.freeze({
  rail: 64,
  column: 240,
  columnMin: 200,
  columnMax: 360,
  topBar: 48,
  bottomBar: 56,
  /** The narrowest the page gets when a person widens the column. */
  pageMin: 560,
  /** The page card's hairline edge (LAY-26), one on each side, counted against the page. */
  divider: 1,
  /** The gap between the page card and the window's end edge (`--shell-card-inset`, LAY-26). */
  cardInset: 8,
  /** The assistant docked beside the page (`--shell-assistant-width`, LAY-26). */
  assistant: 400,
  macInset: 78,
  winInset: 138,
} as const);

/** The cookie `ShellStateScript` reads before the first paint. */
export const SHELL_COOKIES = Object.freeze({
  /** `open:<width>` or `closed:<width>`: whether the person keeps the column open, and its width. */
  column: "vs_shell_col",
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
  /** The page card's hairline edge, in pixels. @default SHELL_SIZES.divider */
  dividerWidth?: number;
  /**
   * Whether the assistant is docked beside the page (LAY-26): a second card at most 400px wide
   * (45% of the window under that) with its own inset, taken from the page. @default false
   */
  assistantDocked?: boolean;
}

/** What the layout rule decides. */
export interface ShellLayout {
  tier: LayoutTier;
  /** The rail shows (every tier but phone). */
  railShown: boolean;
  /** The column takes room in the flow. */
  columnShown: boolean;
  /** The column can only slide over the page here (tablet), from ▤, an edge swipe or a hover. */
  columnSlidesOver: boolean;
  /** The width left for the page, in CSS pixels. */
  pageWidth: number;
}

/** A column width kept inside its range. */
export function clampColumnWidth(width: number): number {
  return Math.round(
    Math.min(SHELL_SIZES.columnMax, Math.max(SHELL_SIZES.columnMin, width)),
  );
}

/**
 * Where everything goes at this width — the same answer the shell's CSS gives.
 *
 * @example
 * resolveShellLayout({ width: 1280, columnOpen: true });
 * // → { tier: "laptop", railShown: true, columnShown: true, columnSlidesOver: false, pageWidth: 966 }
 */
export function resolveShellLayout(input: ShellLayoutInput): ShellLayout {
  const tier = input.tier ?? layoutTierOf(input.width);
  const hasColumn = input.hasColumn ?? true;
  const column = clampColumnWidth(input.columnWidth ?? SHELL_SIZES.column);

  if (tier === "phone") {
    return {
      tier,
      railShown: false,
      columnShown: false,
      columnSlidesOver: false,
      pageWidth: input.width,
    };
  }

  // The rail, then the page card (LAY-26): its hairline on both sides and its inset at the end.
  const rail =
    SHELL_SIZES.rail +
    SHELL_SIZES.cardInset +
    2 * (input.dividerWidth ?? SHELL_SIZES.divider);
  const columnShown = tier !== "tablet" && hasColumn && input.columnOpen;
  const dock = input.assistantDocked
    ? Math.min(SHELL_SIZES.assistant, 0.45 * input.width) +
      SHELL_SIZES.cardInset
    : 0;
  return {
    tier,
    railShown: true,
    columnShown,
    columnSlidesOver: tier === "tablet" && hasColumn,
    pageWidth: input.width - rail - (columnShown ? column : 0) - dock,
  };
}

/** One saved shell choice: open or closed, at a width. */
export interface ShellCookieValue {
  open: boolean;
  /** The saved width in pixels, clamped to its range; `undefined` when none was saved. */
  width?: number;
}

/**
 * Reads a `vs_shell_col` value (`open:240`, `closed:200`, or a bare `open`); `undefined` for
 * anything else, so a stale or tampered cookie falls back to defaults.
 *
 * @example
 * parseShellCookie(cookies().get("vs_shell_col")?.value) // { open: true, width: 240 }
 */
export function parseShellCookie(
  value: string | undefined,
): ShellCookieValue | undefined {
  const match = /^(open|closed)(?::(\d{2,4}))?$/.exec(value ?? "");
  if (!match) return undefined;
  return {
    open: match[1] === "open",
    width: match[2] ? clampColumnWidth(Number(match[2])) : undefined,
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
