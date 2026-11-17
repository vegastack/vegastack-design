// @vegastack shell@0.102.0 sha256-zrRPg/F1E2WOnsLZ1q4J5ELrCQxi8BA2NPo+ue5VHCU=

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@vegastack/design";
import { ChevronRight, MoreHorizontal, PanelRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  ShellColumnResize,
  ShellColumnSwitch,
  ShellController,
  ShellRailIcon,
  ShellSkipLink,
} from "@/components/ui/shell-client";
import type { PageWidth } from "@/lib/page-layout";
import {
  clampColumnWidth,
  clampPanelWidth,
  SHELL_PAGE_MIN,
  type ShellPageMin,
} from "@/lib/shell-layout";

export {
  ShellBottomBar,
  ShellColumnSwitch,
  ShellTitleBarControls,
  lazyAnimatedIcon,
  requestShellPanelOpen,
  toggleShellColumn,
  useShellLayout,
  type ShellBottomBarProps,
  type ShellColumnState,
  type ShellColumnSwitchProps,
  type ShellHistory,
  type ShellLayoutState,
  type ShellTitleBarControlsProps,
} from "@/components/ui/shell-client";

/* ---
WHY THIS FILE IS SERVER-SAFE — the shell lays itself out in CSS, not in JavaScript.

Every screen of the app sits in this frame, so its first paint is the app's first paint. The grid,
the rail, the column and the top bar render on the server, and WHERE things go — the column in the
flow or folded, the panel beside the page or over it, phone or tablet — is decided by container
queries on the shell itself, reading data attributes the server (or `ShellStateScript`, before the
first paint) set. Nothing waits for hydration to lay out, so nothing shifts when it arrives.

The layout rule (LAY-22) needs `pageWidth ≥ pageMin` while the panel is open. A container query
cannot compute `width − panel`, so the shell measures it with boxes: `shell-room` is the shell
minus the open panel's width, and `shell-fit` is that room minus the rail and the column. Each is a
named container, and the column and page ask them: does the page still fit beside the panel with
the column (`shell-fit ≥ pageMin`), without it (`shell-room ≥ pageMin + rail`), or not at all? The
panel itself is anchored to the shell's own edge, so it slides in and out without the room moving
under it. `resolveShellLayout` in `@/lib/shell-layout` is the same rule in TypeScript; the browser
test holds the two in step.

The client islands are small and live in `shell-client.tsx`: the controller (⌘\, F6, hover-peek,
the tablet slide-over, the cookies, the `data-panel-mode` mirror for scripts), the column's resize
handle, the skip link, the title-bar controls and the phone bottom bar.
--- */

const S = '[data-slot="shell"]';
const COL_OPEN = `:is(:root[data-shell-col="open"] ${S}, :root:not([data-shell-col]) ${S}[data-col="open"])[data-has-column]`;
// Open when the app says so, or — with `panelOpen="auto"` — when the device's cookie says so
// (`ShellStateScript`), so a cached page reserves the panel's room before it hydrates.
const PANEL_OPEN = `:is(${S}[data-panel="open"], :root[data-shell-panel="open"] ${S}[data-panel="auto"])`;
// A floating column (slide-over or hover-peek) beats the auto-fold that hid it: the attribute is
// repeated to outrank that rule's selector, which no plain selector here can reach.
const FLOAT = `${S}${'[data-col-float="open"]'.repeat(12)}`;
const RAIL = "var(--shell-rail-width)";
const NO_DRAG =
  ':where(button, a, input, textarea, select, [role="button"], [role="tab"], [role="separator"], [contenteditable="true"])';

/** One block per page minimum: where the column folds, and where the panel stops docking. */
function pageMinRules(min: ShellPageMin): string {
  // The page's 1px hairline counts against it (SHELL_SIZES.divider).
  const fit = `${(min + 1) / 16}rem`;
  const room = `${(min + 1) / 16 + 4}rem`;
  const at = `${PANEL_OPEN}[data-page-min="${min}"]`;
  return `
@container shell (width >= 64rem) {
  @container shell-fit (width < ${fit}) {
    @container shell-room (width >= ${room}) {
      ${COL_OPEN}${PANEL_OPEN}[data-page-min="${min}"] [data-slot="shell-column-area"] { visibility: hidden; opacity: 0; }
      ${COL_OPEN}${PANEL_OPEN}[data-page-min="${min}"] [data-slot="shell-main-area"] { margin-inline-start: calc(-1 * var(--shell-col-room)); --shell-layout-column: folded; }
      ${COL_OPEN}${PANEL_OPEN}[data-page-min="${min}"] [data-slot="shell-topbar-lead"] { display: flex; }
    }
  }
}
@container shell (width >= 40rem) {
  @container shell-room (width < ${room}) {
    ${at} [data-slot="shell-main-area"] { margin-inline-end: calc(-1 * var(--shell-room-cut)); --shell-layout-panel: overlay; }
    ${at} [data-slot="shell-panel-shadow"] { opacity: 1; }
    ${at} [data-slot="shell-main-area"] { --shell-floating-end: calc(var(--shell-room-cut) + 1rem); }
  }
}`;
}

/**
 * The shell's stylesheet. React 19 hoists it into `<head>` once (`href` + `precedence`), however
 * many shells render. Plain CSS because the rule is a handful of nested container queries over
 * data attributes that Tailwind's variants would spell as hundred-character class names.
 */
const SHELL_CSS = `
@property --shell-room-cut {
  syntax: "<length>";
  inherits: true;
  initial-value: 0px;
}
/* Screen only: printing gets the page alone, with none of the frame's geometry (below). */
@media screen {
${S} {
  container: shell / inline-size;
  position: relative;
  isolation: isolate;
  overflow: clip;
  background: var(--background);
  color: var(--foreground);
  --shell-column-current-width: var(--shell-column-saved, var(--shell-column-width));
  --shell-panel-current-width: var(--shell-panel-saved, var(--shell-panel-width));
}
${S}[data-fill="parent"] { height: 100%; }
[data-slot="shell-room"] {
  container: shell-room / inline-size;
  position: relative;
  display: flex;
  min-height: 100dvh;
  --shell-col-room: 0px;
  --shell-panel-room: 0px;
  /* The open panel's room, never more than leaves the rail: a 720px panel on a 640px tablet. */
  --shell-room-cut: min(var(--shell-panel-room), calc(100cqw - ${RAIL}));
  width: calc(100% - var(--shell-room-cut));
}
${S}[data-fill="parent"] > [data-slot="shell-room"] { min-height: 0; height: 100%; }
[data-slot="shell-rail-area"] { display: none; }
[data-slot="shell-fit"] {
  container: shell-fit / inline-size;
  position: relative;
  flex: 1 1 0%;
  min-width: 0;
  margin-inline-start: var(--shell-col-room);
}
[data-slot="shell-main-area"] {
  --shell-layout-panel: closed;
  --shell-layout-column: none;
  --shell-floating-end: 1rem;
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 100%;
  background: var(--background);
  transition: margin-inline-start var(--duration-state) var(--motion-ease-emphasized);
}
[data-slot="shell-main-area"] > [data-slot="shell-topbar-lead"] { grid-area: 1 / 1; }
[data-slot="shell-main-area"] > [data-slot="shell-topbar"] { grid-area: 1 / 2; }
[data-slot="shell-main-area"] > :not([data-slot="shell-topbar-lead"], [data-slot="shell-topbar"], [data-slot="shell-floating-area"]) { grid-column: 1 / -1; }
[data-slot="shell-topbar-lead"] {
  display: none;
  align-items: center;
  gap: 0.125rem;
  height: var(--shell-topbar-height);
  padding-inline-start: 0.5rem;
}
[data-slot="shell-column-area"] {
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(-1 * var(--shell-col-room));
  z-index: 20;
  display: flex;
  flex-direction: column;
  width: var(--shell-column-current-width);
  background: var(--sidebar);
  color: var(--sidebar-foreground);
  visibility: hidden;
  opacity: 0;
  contain: layout paint;
  transition: opacity var(--duration-quick) var(--motion-ease-standard), visibility 0s linear var(--duration-quick);
}
[data-slot="shell-column-head"] {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.125rem;
  height: var(--shell-topbar-height);
  padding-inline: 0.25rem 0.5rem;
}
[data-slot="shell-panel-slot"] {
  position: absolute;
  inset-block: 0;
  inset-inline-end: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: var(--shell-panel-current-width);
  max-width: 100%;
  background: var(--background);
  border-inline-start: 1px solid var(--border);
  translate: 100% 0;
  visibility: hidden;
  transition: translate var(--duration-quick-exit) var(--motion-ease-exit), visibility 0s linear var(--duration-quick-exit);
}
${PANEL_OPEN} [data-slot="shell-panel-slot"] {
  translate: none;
  visibility: visible;
  transition: translate var(--duration-panel) var(--motion-ease-enter), visibility 0s;
}
[data-slot="shell-panel-shadow"] {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 100%;
  z-index: 25;
  width: var(--shell-room-cut);
  pointer-events: none;
  opacity: 0;
  box-shadow: -0.5rem 0 2rem -0.25rem oklch(0 0 0 / 0.16), -0.0625rem 0 0.125rem oklch(0 0 0 / 0.06);
}
[data-slot="shell-floating-area"] {
  position: absolute;
  inset-inline-end: var(--shell-floating-end);
  bottom: 1rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  pointer-events: none;
}
[data-slot="shell-floating-area"] > * { pointer-events: auto; }
[data-slot="shell-main-area"] > [data-slot="assistant-card"] { inset-inline-end: var(--shell-floating-end); }
[data-slot="shell-scrim"] {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: color-mix(in oklch, var(--scrim) 32%, transparent);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--duration-state) var(--motion-ease-standard), visibility 0s linear var(--duration-state);
}
[data-slot="shell-content"] { min-height: 0; }

/* Phone (under 40rem): no rail, no column in the flow, the page scrolls the document so the
   browser's own toolbars can compact, the bar sits at the bottom, the panel is full screen. */
@container shell (width < 40rem) {
  [data-slot="shell-topbar"] { position: sticky; top: 0; z-index: 10; background: var(--background); }
  ${S}[data-fill="parent"] [data-slot="shell-main-area"] { height: 100%; }
  ${S}[data-fill="parent"] [data-slot="shell-content"] { overflow-y: auto; }
  ${S}[data-has-bottombar] [data-slot="shell-content"] { padding-bottom: calc(var(--shell-bottombar-height) + env(safe-area-inset-bottom)); }
  /* The column has no ▤ here: the page title opens it as a sheet (L13). */
  ${S}[data-has-column] [data-slot="shell-column-switch"] { display: grid; }
  [data-slot="shell-topbar-heading"] > h1 { font-size: var(--text-base); line-height: var(--text-base--line-height); font-weight: 600; }
  /* The column as a sheet takes fingers, not a pointer: rows grow to a 44px target. */
  [data-slot="shell-column-area"] [data-slot="shell-column-item"] { height: 2.75rem; }
  ${S}:not([data-fill="parent"]) [data-slot="shell-floating-area"] {
    position: fixed;
    inset-inline-end: max(1rem, env(safe-area-inset-right));
    bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  ${S}[data-has-bottombar]:not([data-fill="parent"]) [data-slot="shell-floating-area"] {
    bottom: calc(1rem + var(--shell-bottombar-height) + env(safe-area-inset-bottom));
  }
  ${PANEL_OPEN} [data-slot="shell-main-area"] { --shell-layout-panel: full; }
  [data-slot="shell-panel-slot"] {
    position: fixed;
    inset: 0;
    z-index: 50;
    width: auto;
    border-inline-start: 0;
    overscroll-behavior: contain;
    padding-bottom: env(safe-area-inset-bottom);
  }
  ${S}[data-fill="parent"] [data-slot="shell-panel-slot"] { position: absolute; }
  [data-slot="shell-column-area"] {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 50;
    width: auto;
    max-height: 78dvh;
    padding-bottom: env(safe-area-inset-bottom);
    border-start-start-radius: var(--corner-overlay);
    border-start-end-radius: var(--corner-overlay);
    translate: 0 100%;
    transition: translate var(--duration-state-exit) var(--motion-ease-exit), visibility 0s linear var(--duration-state-exit);
    opacity: 1;
  }
  ${FLOAT} [data-slot="shell-column-area"] {
    translate: none;
    visibility: visible;
    transition: translate var(--duration-layout) var(--motion-ease-standard), visibility 0s;
  }
  [data-slot="shell-column-area"]::before {
    content: "";
    flex: none;
    align-self: center;
    width: 2.25rem;
    height: 0.3125rem;
    margin-block: 0.5rem 0.25rem;
    border-radius: var(--corner-chip);
    background: var(--border);
  }
  ${FLOAT} [data-slot="shell-scrim"] { opacity: 1; visibility: visible; transition: opacity var(--duration-state) var(--motion-ease-standard), visibility 0s; }
}

/* Tablet and up: the frame fills its height, the rail shows, the panel takes room. */
@container shell (width >= 40rem) {
  [data-slot="shell-room"] { height: 100dvh; min-height: 0; }
  ${S}[data-fill="parent"] > [data-slot="shell-room"] { height: 100%; }
  [data-slot="shell-rail-area"] {
    display: flex;
    flex: none;
    flex-direction: column;
    width: ${RAIL};
    background: var(--sidebar);
    color: var(--sidebar-foreground);
    border-inline-end: 1px solid var(--sidebar-border);
    contain: layout paint;
  }
  [data-slot="shell-main-area"] {
    height: 100%;
    border-inline-start: 1px solid var(--sidebar-border);
  }
  [data-slot="shell-content"] { overflow-y: auto; overscroll-behavior-y: contain; }
  [data-slot="shell-topbar-lead"] { display: flex; }
  ${PANEL_OPEN} [data-slot="shell-room"] { --shell-panel-room: var(--shell-panel-current-width); }
  ${PANEL_OPEN} [data-slot="shell-main-area"] { --shell-layout-panel: dock; }
  ${FLOAT} [data-slot="shell-column-area"] {
    visibility: visible;
    opacity: 1;
    z-index: 40;
    border-inline-end: 1px solid var(--sidebar-border);
    box-shadow: 0.5rem 0 2rem -0.25rem oklch(0 0 0 / 0.16), 0.0625rem 0 0.125rem oklch(0 0 0 / 0.06);
    transition: opacity var(--duration-quick) var(--motion-ease-standard), visibility 0s;
  }
  [data-slot="shell-bottombar"] { display: none; }
}
@container shell (40rem <= width < 64rem) {
  ${S}[data-has-column] [data-slot="shell-main-area"] { --shell-layout-column: folded; }
}

/* Laptop and up: the column takes room while the person keeps it open. */
@container shell (width >= 64rem) {
  ${S}[data-has-column] [data-slot="shell-room"] { --shell-col-room: var(--shell-column-current-width); }
  ${S}[data-has-column] [data-slot="shell-main-area"] { margin-inline-start: calc(-1 * var(--shell-col-room)); --shell-layout-column: folded; }
  ${COL_OPEN} [data-slot="shell-column-area"] {
    visibility: visible;
    opacity: 1;
    transition: opacity var(--duration-quick) var(--motion-ease-standard), visibility 0s;
  }
  ${COL_OPEN} [data-slot="shell-main-area"] { margin-inline-start: 0; --shell-layout-column: shown; }
  ${COL_OPEN} [data-slot="shell-topbar-lead"] { display: none; }
}
${pageMinRules(SHELL_PAGE_MIN.list)}
${pageMinRules(SHELL_PAGE_MIN.document)}
${pageMinRules(SHELL_PAGE_MIN.chat)}

/* The page makes room for a panel that opens beside it (the controller marks the moment). */
@keyframes vs-shell-make-room { from { margin-inline-end: calc(-1 * var(--shell-room-cut)); } }
${S}[data-panel-anim="open"] [data-slot="shell-main-area"] { animation: vs-shell-make-room var(--duration-panel) var(--motion-ease-enter); }
[dir="rtl"] [data-slot="shell-panel-slot"] { translate: -100% 0; }
[dir="rtl"] ${PANEL_OPEN} [data-slot="shell-panel-slot"] { translate: none; }

/* The desktop app's one title row (L10): the traffic lights sit in the rail's head, the column's
   head and the top bar continue the same 48px row, and the row drags the window. */
:root[data-desktop-titlebar="macos"] [data-slot="shell-rail-head"] > * { visibility: hidden; }
:root[data-desktop-titlebar="macos"] [data-slot="shell-rail-header-below"] { display: flex; }
:root[data-desktop-titlebar="macos"] [data-slot="shell-column-head"],
:root[data-desktop-titlebar="macos"] [data-slot="shell-topbar-lead"] {
  padding-inline-start: calc(var(--shell-titlebar-mac-inset) - ${RAIL});
}
:root[data-desktop-titlebar="windows"] ${S}:not(${PANEL_OPEN}) [data-slot="shell-topbar"],
:root[data-desktop-titlebar="windows"] ${PANEL_OPEN} [data-slot="shell-panel-head"] {
  padding-inline-end: calc(var(--shell-titlebar-win-inset) + 0.5rem);
}
/* A panel with no head of its own yet (loading) keeps its first row clear of the caption buttons. */
:root[data-desktop-titlebar="windows"] ${PANEL_OPEN} [data-slot="shell-panel-slot"]:not(:has([data-slot="shell-panel-head"])) {
  padding-top: var(--shell-topbar-height);
}
:root[data-desktop-titlebar] :is([data-slot="shell-rail-head"], [data-slot="shell-column-head"], [data-slot="shell-topbar-lead"], [data-slot="shell-topbar"], [data-slot="shell-panel-head"]) { -webkit-app-region: drag; }
:root[data-desktop-titlebar] :is([data-slot="shell-rail-head"], [data-slot="shell-column-head"], [data-slot="shell-topbar-lead"], [data-slot="shell-topbar"], [data-slot="shell-panel-head"]) ${NO_DRAG} { -webkit-app-region: no-drag; }

@media (prefers-reduced-motion: reduce) {
  ${S} *, ${S} { transition-duration: 0s; animation: none; }
}
}
@media print {
  ${S} :is([data-slot="shell-rail-area"], [data-slot="shell-column-area"], [data-slot="shell-panel-slot"], [data-slot="shell-panel-shadow"], [data-slot="shell-topbar-lead"], [data-slot="shell-topbar"], [data-slot="shell-floating-area"], [data-slot="shell-bottombar"], [data-slot="shell-scrim"], [data-slot="shell-skip"]) { display: none; }
  ${S}, [data-slot="shell-room"], [data-slot="shell-main-area"] { height: auto; width: auto; overflow: visible; margin: 0; border: 0; display: block; }
  [data-slot="shell-fit"] { margin: 0; }
  [data-slot="shell-content"] { overflow: visible; padding: 0; }
}
`;

/** Props accepted by `Shell`. */
export interface ShellProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /** The module rail: a `ShellRail`. Hidden on phones, where `bottomBar` takes over. */
  rail: React.ReactNode;
  /**
   * The rail's head, on the 48px title row above the rail — the workspace's mark. In the desktop
   * app on macOS the traffic lights take that cell, so the mark moves to the top of the rail.
   * @default undefined
   */
  railHeader?: React.ReactNode;
  /** The current module's column: a `ShellColumn`, or `null` for a screen without one (Home). @default undefined */
  column?: React.ReactNode;
  /** The column's head row, beside the title-bar controls — the workspace switcher. @default undefined */
  columnHead?: React.ReactNode;
  /**
   * `ShellTitleBarControls`. The shell places it: in the column's head row while the column is
   * open, otherwise at the start of the top bar.
   * @default undefined
   */
  titleBarControls?: React.ReactNode;
  /** The panel host (`ShellPanel`). The shell positions it; the panel only fills its box. @default undefined */
  panel?: React.ReactNode;
  /**
   * Whether the panel is open. `auto` follows the device's saved state (`ShellStateScript`'s
   * mark) until the app knows better — pass it when no `?panel=` decides, so a cached page
   * reserves the panel's room before its tabs hydrate. `off` removes it on screens that have none
   * (Settings, setup).
   * @default false
   */
  panelOpen?: boolean | "auto" | "off";
  /** The panel's width in pixels (the person's saved width). @default 420 */
  panelWidth?: number;
  /** The column's width in pixels (the person's saved width). @default 240 */
  columnWidth?: number;
  /**
   * Whether the person keeps the column open, from the `vs_shell_col` cookie on the server.
   * `ShellStateScript`'s mark wins when it is there, so a cached page still paints right.
   * @default true
   */
  defaultColumnOpen?: boolean;
  /** The page's minimum width while the panel docks beside it: list 640, document 560, chat 520. @default 640 */
  pageMin?: ShellPageMin;
  /** The phone bottom tab bar: a `ShellBottomBar`. @default undefined */
  bottomBar?: React.ReactNode;
  /** Floating items at the page's bottom-right: a `ShellFloatingArea`. @default undefined */
  floating?: React.ReactNode;
  /**
   * What the shell fills: the window (`viewport`; the page scrolls the document on phones so the
   * browser's toolbars can compact) or its parent (`parent`; a preview or an embedded frame).
   * @default 'viewport'
   */
  fill?: "viewport" | "parent";
  /** The top bar and the page: a `ShellTopBar` and a `ShellMain`. */
  children: React.ReactNode;
}

/**
 * `Shell` — the frame every screen sits in: a 64px module rail, the module's 240px column, the
 * page under a 48px top bar, and a right panel (LAY-22). It lays itself out in CSS before
 * hydration, from the data attributes it renders and the marks `ShellStateScript` leaves.
 *
 * @example
 * <Shell
 *   rail={<ShellRail label="Modules">…</ShellRail>}
 *   railHeader={<WorkspaceMark />}
 *   column={<ShellColumn label="Tasks">…</ShellColumn>}
 *   columnHead={<WorkspaceSwitcher />}
 *   titleBarControls={<ShellTitleBarControls />}
 *   panel={<ShellPanel …/>}
 *   panelOpen={tabs.length > 0}
 *   pageMin={640}
 *   bottomBar={<ShellBottomBar>…</ShellBottomBar>}
 * >
 *   <ShellTopBar>…</ShellTopBar>
 *   <ShellMain><ShellPage>…</ShellPage></ShellMain>
 * </Shell>
 */
export function Shell({
  rail,
  railHeader,
  column,
  columnHead,
  titleBarControls,
  panel,
  panelOpen = false,
  panelWidth,
  columnWidth,
  defaultColumnOpen = true,
  pageMin = SHELL_PAGE_MIN.list,
  bottomBar,
  floating,
  fill = "viewport",
  className,
  style,
  children,
  ...props
}: ShellProps) {
  const hasColumn = column != null;
  // The person's saved widths; `ShellStateScript` sets the same names on `<html>` for a cached page.
  const vars = {
    ...(panelWidth !== undefined
      ? { "--shell-panel-saved": `${clampPanelWidth(panelWidth)}px` }
      : {}),
    ...(columnWidth !== undefined
      ? { "--shell-column-saved": `${clampColumnWidth(columnWidth)}px` }
      : {}),
  };
  return (
    <div
      data-slot="shell"
      data-col={defaultColumnOpen ? "open" : "closed"}
      data-panel={
        panelOpen === "off" || panelOpen === "auto"
          ? panelOpen
          : panelOpen
            ? "open"
            : "closed"
      }
      data-page-min={pageMin}
      data-fill={fill}
      data-has-column={hasColumn ? "" : undefined}
      data-has-bottombar={bottomBar ? "" : undefined}
      className={cn("group/shell font-sans", className)}
      style={{ ...vars, ...style } as React.CSSProperties}
      {...props}
    >
      <style href="vegastack-shell" precedence="vegastack">
        {SHELL_CSS}
      </style>
      <ShellSkipLink />
      <div data-slot="shell-room">
        <div data-slot="shell-rail-area">
          <div
            data-slot="shell-rail-head"
            className="flex h-(--shell-topbar-height) flex-none items-center justify-center"
          >
            {railHeader}
          </div>
          {railHeader ? (
            <div
              data-slot="shell-rail-header-below"
              className="hidden flex-none justify-center pb-1.5"
            >
              {railHeader}
            </div>
          ) : null}
          {rail}
        </div>
        <div data-slot="shell-fit">
          {hasColumn ? (
            <div
              data-slot="shell-column-area"
              data-shell-region="column"
              tabIndex={-1}
              className="outline-none"
            >
              <div data-slot="shell-column-head">
                <div className="flex min-w-0 flex-1 items-center">
                  {columnHead}
                </div>
                {titleBarControls}
              </div>
              {column}
              <ShellColumnResize />
            </div>
          ) : null}
          <div data-slot="shell-main-area">
            <div data-slot="shell-topbar-lead">{titleBarControls}</div>
            {children}
            {floating}
          </div>
        </div>
        <div data-slot="shell-panel-shadow" aria-hidden="true" />
      </div>
      {panelOpen === "off" ? null : (
        <div
          data-slot="shell-panel-slot"
          data-shell-region="panel"
          tabIndex={-1}
          className="outline-none"
        >
          {panel}
        </div>
      )}
      {hasColumn ? <div data-slot="shell-scrim" aria-hidden="true" /> : null}
      {bottomBar}
      <ShellController />
    </div>
  );
}

/** A link or button for a shell item: the app's own `render` element, an `<a>`, or a button. */
function itemElement(
  render: React.ReactElement | undefined,
  href: string | undefined,
): React.ReactElement {
  if (render) return render;
  if (href) return <a href={href} />;
  return <ButtonPrimitive />;
}

type ItemElementProps = Record<string, unknown> & {
  className?: string;
  children?: React.ReactNode;
};

function renderItem(
  element: React.ReactElement,
  props: ItemElementProps,
): React.ReactElement {
  const own = element.props as ItemElementProps;
  return React.cloneElement(element, {
    ...props,
    ...own,
    className: cn(props.className, own.className),
    children: props.children,
  } as ItemElementProps);
}

/** Props accepted by `ShellRail`. */
export interface ShellRailProps extends React.ComponentProps<"nav"> {
  /** The navigation landmark's name. @default 'Modules' */
  label?: string;
}

/**
 * `ShellRail` — the 64px rail of modules, each an icon with a short label under it (L2). It
 * scrolls on its own when a short window cannot fit every module; `ShellRailFooter` keeps Help,
 * Settings and the person at the bottom.
 *
 * @example
 * <ShellRail>
 *   <ShellRailItem icon={<Home />} label="Home" href="/" active />
 *   <ShellRailMore>…</ShellRailMore>
 *   <ShellRailFooter>…</ShellRailFooter>
 * </ShellRail>
 */
export function ShellRail({
  label = "Modules",
  className,
  ...props
}: ShellRailProps) {
  return (
    <nav
      data-slot="shell-rail"
      data-shell-region="rail"
      tabIndex={-1}
      aria-label={label}
      className={cn(
        "scroll-fade-y flex min-h-0 flex-1 flex-col items-center gap-0.5 overflow-y-auto pt-0.5 pb-2.5 outline-none [scrollbar-width:none]",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ShellRailItem`. */
export interface ShellRailItemProps extends Omit<
  React.ComponentProps<"a">,
  "children"
> {
  /** The module's icon, 18px. */
  icon: React.ReactNode;
  /**
   * The same icon, animated (L23): an element of a `lazyAnimatedIcon`. The static `icon` paints
   * first; this loads once the browser is idle and plays on hover and when the item becomes the
   * current module.
   * @default undefined
   */
  animatedIcon?: React.ReactElement;
  /** The short label under the icon. */
  label: string;
  /** A count on the icon (99+ past 99); a neutral chip (INT-15). @default undefined */
  badge?: number | string;
  /**
   * A dot on the icon for something new to see that has no count — Help's What's new. Pass the
   * words it means ("new updates"); they are read after the label.
   * @default undefined
   */
  dot?: string;
  /** Whether this is the current module. @default false */
  active?: boolean;
  /** The app's own link or button element (`<Link href="/tasks" />`); its props win. @default undefined */
  render?: React.ReactElement;
}

function badgeText(badge: number | string | undefined): string | undefined {
  if (badge === undefined || badge === 0 || badge === "") return undefined;
  return typeof badge === "number" && badge > 99 ? "99+" : String(badge);
}

/**
 * `ShellRailItem` — one module on the rail: its icon in a 36×28 tile with the label under it.
 * The current module's tile is filled; hovering it while the column is folded peeks the column.
 *
 * @example
 * <ShellRailItem icon={<ListChecks />} label="Tasks" badge={17} render={<Link href="/tasks" />} active />
 */
export function ShellRailItem({
  icon,
  animatedIcon,
  label,
  badge,
  dot,
  active = false,
  render,
  href,
  className,
  "aria-label": ariaLabel,
  ...props
}: ShellRailItemProps) {
  const count = badgeText(badge);
  // An explicit name wins (the account item reads "<name>, account"); else the label carries the
  // count or the dot's meaning.
  const name =
    ariaLabel ??
    (count ? `${label}, ${count}` : dot ? `${label} (${dot})` : undefined);
  return renderItem(itemElement(render, href), {
    ...props,
    "data-slot": "shell-rail-item",
    "data-active": active ? "" : undefined,
    "aria-current": active ? "page" : undefined,
    "aria-label": name,
    className: cn(
      "group/rail-item flex w-16 flex-none flex-col items-center gap-0.5 rounded-item pt-1 pb-1.5 text-xs font-medium text-muted-foreground no-underline outline-none data-active:text-foreground",
      className,
    ),
    children: (
      <>
        <span
          aria-hidden="true"
          className="relative grid h-7 w-9 place-items-center rounded-item transition-colors duration-instant group-hover/rail-item:bg-state-hover group-hover/rail-item:text-foreground group-focus-visible/rail-item:bg-state-hover group-data-active/rail-item:bg-state-selected [&_svg:not([class*='size-'])]:size-4.5"
        >
          {animatedIcon ? (
            <ShellRailIcon icon={icon} animated={animatedIcon} />
          ) : (
            icon
          )}
          {count ? (
            <span
              data-slot="shell-rail-badge"
              className="absolute -top-1 -end-1.5 grid h-4 min-w-4 place-items-center rounded-chip bg-foreground px-1 text-xs leading-none font-semibold text-background tabular-nums shadow-[0_0_0_2px_var(--sidebar)]"
            >
              {count}
            </span>
          ) : dot ? (
            <span
              data-slot="shell-rail-dot"
              className="absolute -top-0.5 end-0.5 size-2 rounded-chip bg-info shadow-[0_0_0_2px_var(--sidebar)]"
            />
          ) : null}
        </span>
        <span className="max-w-full truncate">{label}</span>
      </>
    ),
  });
}

/** Props accepted by `ShellRailMore`. */
export interface ShellRailMoreProps {
  /** The menu's items: `DropdownMenuItem`s for the modules the rail has no room for. */
  children: React.ReactNode;
  /** The label under the icon. @default 'More' */
  label?: string;
  /** The icon. @default a horizontal ellipsis */
  icon?: React.ReactNode;
  /** Whether the current module lives in this menu. @default false */
  active?: boolean;
}

/**
 * `ShellRailMore` — the rail's More item: a menu of the modules that are not on the rail.
 *
 * @example
 * <ShellRailMore icon={<MoreHorizontal />}>
 *   <DropdownMenuItem render={<Link href="/products" />}>Products</DropdownMenuItem>
 * </ShellRailMore>
 */
export function ShellRailMore({
  children,
  label = "More",
  icon,
  active = false,
}: ShellRailMoreProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <ShellRailItem
            icon={icon ?? <MoreHorizontal />}
            label={label}
            active={active}
            render={<ButtonPrimitive />}
          />
        }
      />
      <DropdownMenuContent side="right" align="start" className="min-w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * `ShellRailFooter` — the rail's foot: Help, Settings and the person, pinned to the bottom.
 *
 * @example
 * <ShellRailFooter>
 *   <ShellRailItem icon={<CircleHelp />} label="Help" href="/docs" />
 *   <PersonMenu />
 * </ShellRailFooter>
 */
export function ShellRailFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="shell-rail-footer"
      className={cn(
        "mt-auto flex flex-col items-center gap-0.5 pt-2",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ShellColumn`. */
export interface ShellColumnProps extends React.ComponentProps<"nav"> {
  /** The navigation landmark's name — the module's name. */
  label: string;
}

/**
 * `ShellColumn` — the current module's own navigation: its views, saved filters, folders, spaces
 * or chats (L1). 240px, resizable from 200 to 360 at its end edge, folded with ⌘\.
 *
 * @example
 * <ShellColumn label="Tasks">
 *   <ShellColumnHeader title="Tasks" actions={<NewTaskButton />} />
 *   <ShellColumnSection label="Views">…</ShellColumnSection>
 * </ShellColumn>
 */
export function ShellColumn({ label, className, ...props }: ShellColumnProps) {
  return (
    <nav
      data-slot="shell-column"
      aria-label={label}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 pt-0.5 pb-3.5 [scrollbar-width:thin]",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ShellColumnHeader`. */
export interface ShellColumnHeaderProps extends Omit<
  React.ComponentProps<"div">,
  "title"
> {
  /** The module's name. */
  title: React.ReactNode;
  /** Its actions: "+ New" and the like, as `icon-sm` buttons. @default undefined */
  actions?: React.ReactNode;
}

/**
 * `ShellColumnHeader` — the column's title row: the module's name and its actions.
 *
 * @example
 * <ShellColumnHeader title="Agents" actions={<Button size="icon-sm" variant="ghost" aria-label="New chat"><SquarePen /></Button>} />
 */
export function ShellColumnHeader({
  title,
  actions,
  className,
  ...props
}: ShellColumnHeaderProps) {
  return (
    <div
      data-slot="shell-column-header"
      className={cn(
        "flex h-9 flex-none items-center justify-between gap-2 ps-2 pe-0.5",
        className,
      )}
      {...props}
    >
      <h2 className="min-w-0 truncate text-base font-semibold">{title}</h2>
      {actions ? (
        <div className="flex flex-none items-center gap-0.5">{actions}</div>
      ) : null}
    </div>
  );
}

/** Props accepted by `ShellColumnSearch`. */
export interface ShellColumnSearchProps extends React.ComponentProps<
  typeof InputGroupInput
> {
  /** The search field's accessible name. @default the placeholder */
  label?: string;
}

/**
 * `ShellColumnSearch` — a filter field for the column's own list (chats, spaces, folders).
 *
 * @example
 * <ShellColumnSearch placeholder="Find a chat" value={q} onChange={(e) => setQ(e.target.value)} />
 */
export function ShellColumnSearch({
  label,
  placeholder = "Search",
  className,
  ...props
}: ShellColumnSearchProps) {
  return (
    <InputGroup
      data-slot="shell-column-search"
      className={cn("my-1 flex-none", className)}
    >
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        aria-label={label ?? String(placeholder)}
        placeholder={placeholder}
        {...props}
      />
    </InputGroup>
  );
}

/** Props accepted by `ShellColumnSection`. */
export interface ShellColumnSectionProps extends React.ComponentProps<"section"> {
  /** The section's label, above its items. @default undefined */
  label?: React.ReactNode;
  /** An action beside the label (a + button). @default undefined */
  action?: React.ReactNode;
}

/**
 * `ShellColumnSection` — a labelled group of column items.
 *
 * @example
 * <ShellColumnSection label="Pinned">…</ShellColumnSection>
 */
export function ShellColumnSection({
  label,
  action,
  className,
  children,
  ...props
}: ShellColumnSectionProps) {
  const id = React.useId();
  return (
    <section
      data-slot="shell-column-section"
      aria-labelledby={label ? id : undefined}
      className={cn("flex flex-col gap-px", className)}
      {...props}
    >
      {label ? (
        <div className="flex items-center justify-between gap-2 ps-2 pe-0.5 pt-3.5 pb-1">
          <h3 id={id} className="text-xs font-medium text-muted-foreground">
            {label}
          </h3>
          {action}
        </div>
      ) : null}
      <ul role="list" className="flex flex-col gap-px">
        {children}
      </ul>
    </section>
  );
}

/** Props accepted by `ShellColumnItem`. */
export interface ShellColumnItemProps extends Omit<
  React.ComponentProps<"a">,
  "children"
> {
  /** The item's name. */
  label: React.ReactNode;
  /** Its icon, 16px. @default undefined */
  icon?: React.ReactNode;
  /** A count at the end, muted and tabular. @default undefined */
  count?: number | string;
  /** Whether this is the current view. @default false */
  active?: boolean;
  /** How deep it sits in a tree; each level indents by the chevron (26px). @default 0 */
  depth?: number;
  /** An action shown on hover in the count's place (a ⋯ menu). @default undefined */
  action?: React.ReactNode;
  /** Child items: the item becomes a branch that opens and closes. @default undefined */
  children?: React.ReactNode;
  /** Whether a branch starts open. @default false, or true when `active` */
  defaultOpen?: boolean;
  /** The app's own link or button element; its props win. @default undefined */
  render?: React.ReactElement;
}

/**
 * `ShellColumnItem` — one row of the column: icon, name and count, 32px tall. With children it
 * is a branch of a `ShellColumnTree`, opened and closed by its chevron.
 *
 * @example
 * <ShellColumnItem icon={<Inbox />} label="Assigned to me" count={12} render={<Link href="/tasks/assigned" />} active />
 */
export function ShellColumnItem({
  label,
  icon,
  count,
  active = false,
  depth = 0,
  action,
  children,
  defaultOpen,
  render,
  href,
  className,
  ...props
}: ShellColumnItemProps) {
  const row = renderItem(itemElement(render, href), {
    ...props,
    "data-slot": "shell-column-item",
    "data-active": active ? "" : undefined,
    "aria-current": active ? "page" : undefined,
    className: cn(
      "state-layer flex h-8 w-full min-w-0 flex-1 items-center gap-2 rounded-item px-2 text-start text-sm text-foreground no-underline outline-none data-active:layer-selected data-active:font-medium [&_svg:not([class*='size-'])]:size-4 [&>svg]:text-muted-foreground",
      className,
    ),
    children: (
      <>
        {icon}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined && count !== "" ? (
          <span
            className={cn(
              "flex-none text-xs text-muted-foreground tabular-nums",
              action && "group-hover/column-item:hidden",
            )}
          >
            {count}
          </span>
        ) : null}
      </>
    ),
  });
  // A level indents by the chevron's width, so a child lines up under its parent's icon.
  const indent = {
    paddingInlineStart: `${depth * 1.625}rem`,
  } as React.CSSProperties;
  const actionNode = action ? (
    <span className="absolute end-1 top-1 hidden group-focus-within/column-item:flex group-hover/column-item:flex">
      {action}
    </span>
  ) : null;
  if (!children) {
    return (
      <li
        data-slot="shell-column-row"
        className="group/column-item relative flex"
        style={indent}
      >
        {row}
        {actionNode}
      </li>
    );
  }
  return (
    <li
      data-slot="shell-column-row"
      className="group/column-item"
      style={indent}
    >
      <Collapsible defaultOpen={defaultOpen ?? active}>
        <div className="relative flex items-center">
          <CollapsibleTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Show or hide ${typeof label === "string" ? label : "items"}`}
                className="me-0.5 aria-expanded:bg-transparent [&_svg]:transition-transform [&_svg]:duration-state data-panel-open:[&_svg]:rotate-90"
              />
            }
          >
            <ChevronRight aria-hidden="true" />
          </CollapsibleTrigger>
          {row}
          {actionNode}
        </div>
        <CollapsibleContent>
          <ul role="list" className="flex flex-col gap-px pt-px">
            {children}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/**
 * `ShellColumnTree` — a list of `ShellColumnItem` branches: spaces with their sections, a folder
 * tree. Inside a `ShellColumnSection`, put the items straight in the section: it is a list already.
 *
 * @example
 * <ShellColumnTree aria-label="Spaces">
 *   <ShellColumnItem label="General" defaultOpen>
 *     <ShellColumnItem label="Tasks" depth={1} href="/spaces/general/tasks" />
 *   </ShellColumnItem>
 * </ShellColumnTree>
 */
export function ShellColumnTree({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="shell-column-tree"
      role="list"
      className={cn("flex flex-col gap-px", className)}
      {...props}
    />
  );
}

/** Props accepted by `ShellTopBar`. */
export type ShellTopBarProps = React.ComponentProps<"header">;

/**
 * `ShellTopBar` — the 48px bar over the page, its slots in one fixed order whatever order they
 * are written in (L9): title, presence, tools, actions, primary, panel toggle. The shell puts the
 * title-bar controls before it while the column is folded. Narrow, text actions turn into their
 * icons, then items marked `data-shell-fold` leave for the ⋯ menu.
 *
 * @example
 * <ShellTopBar>
 *   <ShellTopBarTitle parents={<a href="/spaces/general">General</a>}>Q3 pricing</ShellTopBarTitle>
 *   <ShellTopBarTools>…</ShellTopBarTools>
 *   <ShellTopBarActions><Button variant="outline" size="sm">Share</Button></ShellTopBarActions>
 *   <ShellPanelToggle pressed={open} onClick={toggle} />
 * </ShellTopBar>
 */
export function ShellTopBar({ className, ...props }: ShellTopBarProps) {
  return (
    <header
      data-slot="shell-topbar"
      data-shell-region="topbar"
      tabIndex={-1}
      className={cn(
        "@container/shell-topbar flex h-(--shell-topbar-height) min-w-0 items-center gap-2 ps-3.5 pe-2.5 outline-none",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ShellTopBarTitle`. */
export interface ShellTopBarTitleProps extends React.ComponentProps<"div"> {
  /** The breadcrumb before the title: links to the parents, separated for you. @default undefined */
  parents?: React.ReactNode;
  /**
   * On a phone with a column, the title opens the column as a sheet; this names that button
   * (e.g. "Switch Tasks view"). @default 'Switch view'
   */
  switchLabel?: string;
}

/**
 * `ShellTopBarTitle` — the page's title, its `<h1>`, rendered on the server with the page (never
 * portalled), after the breadcrumb of its parents. On a phone with a column, a tap on the title
 * opens the column as a sheet (`ShellColumnSwitch`, L13).
 *
 * @example
 * <ShellTopBarTitle parents={<><a href="/library">Library</a><a href="/library/f">Pricing</a></>}>Q3 review</ShellTopBarTitle>
 */
export function ShellTopBarTitle({
  parents,
  switchLabel,
  className,
  children,
  ...props
}: ShellTopBarTitleProps) {
  const crumbs = React.Children.toArray(parents);
  return (
    <div
      data-slot="shell-topbar-title"
      className={cn(
        "order-1 flex min-w-0 flex-1 items-center gap-1 text-sm",
        className,
      )}
      {...props}
    >
      {crumbs.length ? (
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-none">
          <ol className="flex items-center gap-1">
            {crumbs.map((crumb, i) => (
              <li
                key={i}
                className="flex flex-none items-center gap-1 text-muted-foreground @max-lg/shell-topbar:not-last:hidden [&_a]:inline-flex [&_a]:min-h-6 [&_a]:items-center [&_a]:no-underline [&_a]:hover:text-foreground"
              >
                {crumb}
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 text-muted-foreground/70 rtl:-scale-x-100"
                />
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div
        data-slot="shell-topbar-heading"
        className="relative flex min-w-0 items-center gap-0.5"
      >
        <h1 className="min-w-0 truncate text-sm font-medium">{children}</h1>
        <ShellColumnSwitch label={switchLabel} />
      </div>
    </div>
  );
}

/** Props accepted by the top bar's slot parts. */
export interface ShellTopBarSlotProps extends React.ComponentProps<"div"> {
  /** Width to hold in rem while the slot's content streams in, so the bar never shifts. @default undefined */
  reserve?: number;
}

function topBarSlot(slot: string, order: string, extra = "") {
  return function ShellTopBarSlot({
    reserve,
    className,
    style,
    ...props
  }: ShellTopBarSlotProps) {
    return (
      <div
        data-slot={slot}
        className={cn("flex flex-none items-center", order, extra, className)}
        style={
          reserve
            ? {
                minInlineSize: `${reserve}rem`,
                justifyContent: "flex-end",
                ...style,
              }
            : style
        }
        {...props}
      />
    );
  };
}

/**
 * `ShellTopBarLead` — the top bar's start: a back button on a phone, or a tool that belongs
 * before the title. The shell's own title-bar controls sit before it.
 *
 * @example
 * <ShellTopBarLead><Button variant="ghost" size="icon-sm" aria-label="Back"><ChevronLeft /></Button></ShellTopBarLead>
 */
export const ShellTopBarLead = topBarSlot(
  "shell-topbar-lead-slot",
  "order-0",
  "gap-0.5",
);

/**
 * `ShellTopBarPresence` — who else is here: one `AvatarGroup` with `max={3}`.
 *
 * @example
 * <ShellTopBarPresence><AvatarGroup max={3}>…</AvatarGroup></ShellTopBarPresence>
 */
export const ShellTopBarPresence = topBarSlot(
  "shell-topbar-presence",
  "order-2",
  "@max-md/shell-topbar:hidden",
);

/**
 * `ShellTopBarTools` — the page's icon tools: 28px ghost buttons, 2px apart, `MoreHorizontal`
 * last. Mark a tool `data-shell-fold` and include it in the ⋯ menu too: a narrow bar keeps only
 * the menu.
 *
 * @example
 * <ShellTopBarTools reserve={5.75}>
 *   <Button variant="ghost" size="icon-sm" aria-label="Watch" data-shell-fold><Bell /></Button>
 *   <MoreMenu />
 * </ShellTopBarTools>
 */
export const ShellTopBarTools = topBarSlot(
  "shell-topbar-tools",
  "order-3",
  "gap-0.5 @max-md/shell-topbar:[&>[data-shell-fold]]:hidden",
);

/**
 * `ShellTopBarActions` — text buttons, Share first (outline). Wrap a button's words in
 * `ShellTopBarLabel` and a narrow bar shows only its icon.
 *
 * @example
 * <ShellTopBarActions><Button variant="outline" size="sm"><Share2 /><ShellTopBarLabel>Share</ShellTopBarLabel></Button></ShellTopBarActions>
 */
export const ShellTopBarActions = topBarSlot(
  "shell-topbar-actions",
  "order-4",
  "gap-2",
);

/**
 * `ShellTopBarPrimary` — the page's one primary action.
 *
 * @example
 * <ShellTopBarPrimary><Button size="sm">Approve</Button></ShellTopBarPrimary>
 */
export const ShellTopBarPrimary = topBarSlot("shell-topbar-primary", "order-5");

/**
 * `ShellTopBarLabel` — a top-bar button's words, read out always but shown only while the bar
 * has room; below it the button shows its icon alone.
 *
 * @example
 * <Button variant="outline" size="sm"><Share2 /><ShellTopBarLabel>Share</ShellTopBarLabel></Button>
 */
export function ShellTopBarLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="shell-topbar-label"
      className={cn("@max-xl/shell-topbar:sr-only", className)}
      {...props}
    />
  );
}

/** Props accepted by `ShellPanelToggle`. */
export interface ShellPanelToggleProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children"
> {
  /** Whether the panel is open. */
  pressed: boolean;
  /** The accessible name. @default 'Panel' */
  label?: string;
}

/**
 * `ShellPanelToggle` — the top bar's last control: opens and closes the panel (⌘.). Hidden on
 * screens without a panel (Settings, setup).
 *
 * @example
 * <ShellPanelToggle pressed={open} onClick={() => setOpen(!open)} />
 */
export function ShellPanelToggle({
  pressed,
  label = "Panel",
  className,
  ...props
}: ShellPanelToggleProps) {
  return (
    <Button
      data-slot="shell-panel-toggle"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={pressed}
      aria-keyshortcuts="Meta+Period"
      className={cn(
        "order-6 aria-pressed:bg-state-selected aria-pressed:text-foreground",
        className,
      )}
      {...props}
    >
      <PanelRight aria-hidden="true" />
    </Button>
  );
}

/** Props accepted by `ShellMain`. */
export type ShellMainProps = React.ComponentProps<"main">;

/**
 * `ShellMain` — the page's scrolling region and the document's `<main>`: the skip link lands
 * here, F6 cycles to it, and printing prints only it.
 *
 * @example
 * <ShellMain><ShellPage>…</ShellPage></ShellMain>
 */
export function ShellMain({
  id = "shell-main",
  className,
  ...props
}: ShellMainProps) {
  return (
    <main
      id={id}
      data-slot="shell-content"
      data-shell-region="main"
      data-print-root=""
      tabIndex={-1}
      className={cn(
        "@container/shell-content relative flex min-w-0 flex-col outline-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The page gutter in the shell — one CSS variable, `--page-gutter`, set by `ShellPage` from the
 * page's own width (`ShellMain` is the container): 16px, 24px from a 640px page, 32px from 1024px,
 * 48px from 1920px. Put it on a part that pads with the gutter outside a `ShellPage`.
 */
export const shellGutterClasses =
  "[--page-gutter:--spacing(4)] @min-[40rem]/shell-content:[--page-gutter:--spacing(6)] @min-[64rem]/shell-content:[--page-gutter:--spacing(8)] @min-[120rem]/shell-content:[--page-gutter:--spacing(12)]";

/** A page's width in the shell: the registry's `PageWidth`. */
export type ShellPageSize = PageWidth;

/** Props accepted by `ShellPage`. */
export interface ShellPageProps extends React.ComponentProps<"div"> {
  /**
   * `prose` (720px of text, centred) for documents and chats, `default` (1200px, centred) for
   * lists, dashboards and records, `full` (edge to edge, filling the height) for boards, tables
   * and canvases, `form` (720px, centred, sections further apart) for settings and forms.
   * @default 'default'
   */
  size?: ShellPageSize;
}

/**
 * `ShellPage` — the page inside `ShellMain`, padded by the page gutter (16px, 24px from a 640px
 * page, 32px from 1024px — the page's own width, not the window's).
 *
 * @example
 * <ShellPage size="form"><PageHeader title="Profile" />…</ShellPage>
 */
export function ShellPage({
  size = "default",
  className,
  ...props
}: ShellPageProps) {
  return (
    <div
      data-slot="shell-page"
      data-size={size}
      className={cn(
        "mx-auto flex w-full min-w-0 flex-1 flex-col gap-6 p-(--page-gutter)",
        shellGutterClasses,
        size === "prose" && "max-w-[calc(45rem+2*var(--page-gutter))]",
        size === "form" && "max-w-[calc(45rem+2*var(--page-gutter))] gap-8",
        size === "default" && "max-w-[calc(75rem+2*var(--page-gutter))]",
        size === "full" && "min-h-0",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ShellSection`. */
export interface ShellSectionProps extends React.ComponentProps<"section"> {
  /**
   * The section's measure inside the page: `prose` 720px, `default` the content width of a
   * `default` page (1200px), `full` the page's whole width. A `full` page can hold a list at
   * `default`, a document and a grid at full width.
   * @default 'full'
   */
  measure?: "prose" | "default" | "full";
  /**
   * Where a narrower measure sits: `start` under the title's edge or `center`. Ignored at `full`.
   * @default 'center' for `default`, 'start' for `prose`
   */
  align?: "start" | "center";
}

/**
 * `ShellSection` — one region of a `ShellPage` with its own measure, so width follows the
 * content, not the route.
 *
 * @example
 * <ShellPage size="full">
 *   <ShellSection measure="default"><DataList … /></ShellSection>
 * </ShellPage>
 */
export function ShellSection({
  measure = "full",
  align,
  className,
  ...props
}: ShellSectionProps) {
  const placed = align ?? (measure === "default" ? "center" : "start");
  return (
    <section
      data-slot="shell-section"
      data-measure={measure}
      data-align={placed}
      className={cn(
        "flex w-full min-w-0 flex-col gap-6",
        measure === "prose" && "max-w-[45rem]",
        measure === "default" && "max-w-[75rem]",
        measure !== "full" && placed === "center" && "mx-auto",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `ShellBleed`. */
export interface ShellBleedProps extends React.ComponentProps<"div"> {
  /**
   * Whether the content reaches the page's edges. Off, it keeps the gutter.
   * @default true
   */
  active?: boolean;
}

/**
 * `ShellBleed` — a region of a `ShellPage` that reaches its side and bottom edges past the
 * gutter: a grid or canvas whose scroll bars should rest at the page's edge.
 *
 * @example
 * <ShellPage size="full">
 *   <ShellBleed><DataGrid fill … /></ShellBleed>
 * </ShellPage>
 */
export function ShellBleed({
  active = true,
  className,
  ...props
}: ShellBleedProps) {
  return (
    <div
      data-slot="shell-bleed"
      data-active={active ? "true" : "false"}
      className={cn(
        "flex min-h-0 min-w-0 flex-col",
        active && "-mx-(--page-gutter) -mb-(--page-gutter)",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `ShellFloatingArea` — the one stack of floating items at the page's bottom-right: the
 * assistant pill, the audio player, upload progress. It never covers the panel, lifts over the
 * phone bar and the home indicator, and is left out of print. Toasts stay bottom-centre.
 *
 * @example
 * <Shell floating={<ShellFloatingArea><UploadProgress /><AssistantPill /></ShellFloatingArea>} …>
 */
export function ShellFloatingArea({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div data-slot="shell-floating-area" className={className} {...props} />
  );
}

/** Props accepted by `ShellBottomBarItem`. */
export interface ShellBottomBarItemProps extends Omit<
  React.ComponentProps<"a">,
  "children"
> {
  /** The tab's icon, 20px. */
  icon: React.ReactNode;
  /** The short label under the icon. */
  label: string;
  /** A count on the icon (99+ past 99). @default undefined */
  badge?: number | string;
  /** Whether this is the current tab. @default false */
  active?: boolean;
  /** The app's own link or button element; its props win. @default undefined */
  render?: React.ReactElement;
}

/**
 * `ShellBottomBarItem` — one tab of the phone bar: icon over a short label, a 44px target.
 *
 * @example
 * <ShellBottomBarItem icon={<Home />} label="Home" render={<Link href="/" />} active />
 */
export function ShellBottomBarItem({
  icon,
  label,
  badge,
  active = false,
  render,
  href,
  className,
  ...props
}: ShellBottomBarItemProps) {
  const count = badgeText(badge);
  return renderItem(itemElement(render, href), {
    ...props,
    "data-slot": "shell-bottombar-item",
    "data-active": active ? "" : undefined,
    "aria-current": active ? "page" : undefined,
    "aria-label": count ? `${label}, ${count}` : undefined,
    className: cn(
      "group/bottom-item relative flex min-h-11 min-w-0 flex-1 flex-col items-center gap-0.5 pt-0.5 text-xs font-medium text-muted-foreground no-underline outline-none data-active:text-foreground",
      className,
    ),
    children: (
      <>
        <span
          aria-hidden="true"
          className="relative grid h-6.5 w-11 place-items-center rounded-chip transition-colors duration-instant group-focus-visible/bottom-item:bg-state-hover group-data-active/bottom-item:bg-state-selected [&_svg:not([class*='size-'])]:size-5"
        >
          {icon}
          {count ? (
            <span className="absolute -top-0.5 start-[calc(50%+0.375rem)] grid h-4 min-w-4 place-items-center rounded-chip bg-foreground px-1 text-xs leading-none font-semibold text-background tabular-nums">
              {count}
            </span>
          ) : null}
        </span>
        <span className="max-w-full truncate">{label}</span>
      </>
    ),
  });
}
