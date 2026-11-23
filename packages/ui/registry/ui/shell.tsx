// @vegastack shell@0.133.0 sha256-8gf3wtLjMIY/g6POVqJt8Uqm+ty2V3FLDs6A6CKy7NQ=

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@vegastack/design";
import { ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  ShellColumnResize,
  ShellController,
  ShellSkipLink,
} from "@/components/ui/shell-client";
import { RailBadge, railBadgeText } from "@/components/ui/rail";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PageWidth } from "@/lib/page-layout";
import { clampColumnWidth } from "@/lib/shell-layout";

export {
  ShellBottomBar,
  ShellColumnSwitch,
  ShellColumnToggle,
  toggleShellColumn,
  useShellLayout,
  type ShellBottomBarProps,
  type ShellColumnState,
  type ShellColumnSwitchProps,
  type ShellColumnToggleProps,
  type ShellLayoutState,
} from "@/components/ui/shell-client";

/* ---
WHY THIS FILE IS SERVER-SAFE — the shell lays itself out in CSS, not in JavaScript.

Every screen of the app sits in this frame, so its first paint is the app's first paint. The global
bar on top, then the rail, the column and the page under its top bar render on the server, and WHERE things go — the column in the
flow or folded, phone or tablet — is decided by container
queries on the shell itself, reading data attributes the server (or `ShellStateScript`, before the
first paint) set. Nothing waits for hydration to lay out, so nothing shifts when it arrives.

There is no right panel in the frame (layout v2, D11): a record opens in `Peek` inside the page
area, or on its page, where `RecordLayout`'s side panel is part of the page. `resolveShellLayout`
in `@/lib/shell-layout` is the frame's rule in TypeScript; the browser test holds the two in step.

The client islands are small and live in `shell-client.tsx`: the controller (⌘\, F6, hover-peek,
the tablet slide-over, the cookie, the `data-tier`/`data-column` mirror for scripts), the column's resize
handle, the skip link, the column toggle and the phone bottom bar. The global bar (`global-bar`),
the rail (`rail`) and the column's items (`nav-tree`) are their own items, passed in as slots.
--- */

const S = '[data-slot="shell"]';
const COL_OPEN = `:is(:root[data-shell-col="open"] ${S}, :root:not([data-shell-col]) ${S}[data-col="open"])[data-has-column]`;
// A floating column (slide-over or hover-peek) beats the auto-fold that hid it: the attribute is
// repeated to outrank that rule's selector, which no plain selector here can reach.
const FLOAT = `${S}${'[data-col-float="open"]'.repeat(12)}`;
const RAIL = "var(--shell-rail-width)";
const NO_DRAG =
  ':where(button, a, input, textarea, select, [role="button"], [role="tab"], [role="separator"], [contenteditable="true"])';

/**
 * The shell's stylesheet. React 19 hoists it into `<head>` once (`href` + `precedence`), however
 * many shells render. Plain CSS because the rule is a handful of nested container queries over
 * data attributes that Tailwind's variants would spell as hundred-character class names.
 */
const SHELL_CSS = `
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
  --shell-globalbar-room: 0px;
}
${S}[data-fill="parent"] { height: 100%; }
${S}[data-has-global-bar] { --shell-globalbar-room: var(--shell-globalbar-height); }
[data-slot="shell-room"] {
  position: relative;
  display: flex;
  min-height: 100dvh;
  --shell-col-room: 0px;
}
${S}[data-fill="parent"] > [data-slot="shell-room"] { min-height: 0; height: 100%; }
[data-slot="shell-rail-area"] { display: none; }
/* The page card (LAY-26): on a phone it is no box of its own; from 40rem it is the rounded card. */
[data-slot="shell-card"] { display: contents; }
/* The assistant's box: no box of its own, so a docked card is the room's flex item. */
[data-slot="shell-assistant-area"] { display: contents; }
[data-slot="shell-fit"] {
  position: relative;
  flex: 1 1 0%;
  min-width: 0;
  margin-inline-start: var(--shell-col-room);
}
[data-slot="shell-main-area"] {
  --shell-layout-column: none;
  --shell-floating-end: 1rem;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 100%;
  background: var(--background);
  transition: margin-inline-start var(--duration-state) var(--motion-ease-emphasized);
}
[data-slot="shell-main-area"] > [data-slot="shell-topbar"] { grid-row: 1; }
[data-slot="shell-main-area"] > :not([data-slot="shell-topbar"], [data-slot="shell-floating-area"]) { grid-row: 2; }
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
/* The assistant (LAY-26) shows only while open, and only from 40rem: a phone puts its parts in a
   bottom sheet instead. */
[data-slot="shell-assistant-area"] > [data-slot="assistant-card"] { display: none; }
[data-slot="shell-scrim"] {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: color-mix(in oklch, var(--scrim) 32%, transparent);
  opacity: 0;
  visibility: hidden;
  transition: opacity var(--duration-state) var(--motion-ease-standard), visibility 0s linear var(--duration-state);
}
/* The page's one vertical scroller, and the containing block of everything in it: an absolute
   descendant (a screen-reader-only label) can't reach past it to the document (BRD-SCR). */
[data-slot="shell-content"] { min-height: 0; position: relative; }

/* Phone (under 40rem): no rail, no column in the flow, the page scrolls the document so the
   browser's own toolbars can compact, the bar sits at the bottom. */
@container shell (width < 40rem) {
  [data-slot="shell-topbar"] { position: sticky; top: 0; z-index: 10; background: var(--background); }
  ${S}[data-fill="parent"] [data-slot="shell-main-area"] { height: 100%; }
  ${S}[data-fill="parent"] [data-slot="shell-content"] { overflow-y: auto; }
  ${S}[data-has-bottombar] [data-slot="shell-content"] { padding-bottom: calc(var(--shell-bottombar-height) + env(safe-area-inset-bottom)); }
  /* The column has no ▤ here: the bar's places button opens it as a sheet (L13). */
  ${S}[data-has-column] [data-slot="shell-column-switch"] { display: inline-flex; }
  [data-slot="shell-topbar-heading"] > h1 { font-size: var(--text-base); line-height: var(--text-base--line-height); font-weight: 600; }
  ${S}:not([data-fill="parent"]) [data-slot="shell-floating-area"] {
    position: fixed;
    inset-inline-end: max(1rem, env(safe-area-inset-right));
    bottom: calc(1rem + env(safe-area-inset-bottom));
  }
  ${S}[data-has-bottombar]:not([data-fill="parent"]) [data-slot="shell-floating-area"] {
    bottom: calc(1rem + var(--shell-bottombar-height) + env(safe-area-inset-bottom));
  }
  [data-slot="shell-column-area"] {
    /* The phone's sheet is the column too: the side surface, as in the frame (LAY-26). */
    --sidebar: var(--shell-column);
    --color-sidebar: var(--shell-column);
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
  /* The sheet's list scrolls on its own: its ends never chain to the page behind. */
  [data-slot="shell-column-area"] [data-slot="shell-column"] { overscroll-behavior-y: contain; }
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

/* Tablet and up: the frame fills its height and the rail shows. */
@container shell (width >= 40rem) {
  /* The global bar takes its 44px row; the rail, column and page share the rest. */
  [data-slot="shell-room"] { height: calc(100dvh - var(--shell-globalbar-room)); min-height: 0; }
  ${S}[data-fill="parent"] > [data-slot="shell-room"] { height: calc(100% - var(--shell-globalbar-room)); }
  /* The rounded-card frame (LAY-26): the global bar and the rail sit on the window's canvas, and
     the column and the page share one card, inset from the window's end and bottom edges. Inside
     the card the page's ground is the card's and the column's is its own, so every surface that
     paints bg-background or bg-sidebar follows without knowing about the frame. */
  [data-slot="shell-room"] { background: var(--shell-canvas); }
  [data-slot="shell-rail-area"] {
    display: flex;
    flex: none;
    flex-direction: column;
    width: ${RAIL};
    --sidebar: var(--shell-canvas);
    --color-sidebar: var(--shell-canvas);
    background: var(--shell-canvas);
    color: var(--sidebar-foreground);
    contain: layout paint;
  }
  [data-slot="shell-card"] {
    --background: var(--shell-card);
    --color-background: var(--shell-card);
    position: relative;
    display: flex;
    flex: 1 1 0%;
    min-width: 0;
    margin-block: 0 var(--shell-card-inset);
    margin-inline: 0 var(--shell-card-inset);
    border: 1px solid var(--border);
    border-radius: var(--shell-card-radius);
    background: var(--shell-card);
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.04);
    overflow: clip;
  }
  [data-slot="shell-column-area"] {
    --sidebar: var(--shell-column);
    --color-sidebar: var(--shell-column);
    border-inline-end: 1px solid var(--border);
  }
  [data-slot="shell-main-area"] { height: 100%; }
  /* The assistant docked beside the page: a second card with the same inset and corners (split
     view). */
  [data-slot="shell-assistant-area"] > [data-slot="assistant-card"][data-open] {
    --background: var(--shell-card);
    --color-background: var(--shell-card);
    display: flex;
    flex: none;
    width: min(var(--shell-assistant-width), 45cqw);
    height: auto;
    margin-block: 0 var(--shell-card-inset);
    margin-inline: 0 var(--shell-card-inset);
    border-radius: var(--shell-card-radius);
    background: var(--shell-card);
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.04);
  }
  [data-slot="shell-content"] { overflow-y: auto; overscroll-behavior-y: contain; }
  ${FLOAT} [data-slot="shell-column-area"] {
    visibility: visible;
    opacity: 1;
    z-index: 40;
    border-inline-end: 1px solid var(--border);
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
}
/* The desktop app's title row is the global bar's (\`global-bar\`): it drags the window and clears
   the window's own buttons, so nothing below it does. */

@media (prefers-reduced-motion: reduce) {
  ${S} *, ${S} { transition-duration: 0s; animation: none; }
}
}
@media print {
  ${S} :is([data-slot="shell-rail-area"], [data-slot="shell-column-area"], [data-slot="assistant-card"], [data-slot="global-bar"], [data-slot="shell-topbar"], [data-slot="shell-floating-area"], [data-slot="shell-bottombar"], [data-slot="shell-scrim"], [data-slot="shell-skip"]) { display: none; }
  ${S}, [data-slot="shell-room"], [data-slot="shell-card"], [data-slot="shell-main-area"] { height: auto; width: auto; overflow: visible; margin: 0; border: 0; display: block; }
  [data-slot="shell-fit"] { margin: 0; }
  [data-slot="shell-content"] { overflow: visible; padding: 0; }
}
`;

/** Props accepted by `Shell`. */
export interface ShellProps extends Omit<
  React.ComponentProps<"div">,
  "children"
> {
  /**
   * The 44px bar over everything: a `GlobalBar` (column toggle, back and forward, workspace
   * switcher · search · Ask, Help, account). It is the desktop app's title row; hidden on phones.
   * @default undefined
   */
  globalBar?: React.ReactNode;
  /** The module rail: a `Rail`. Hidden on phones, where `bottomBar` takes over. */
  rail: React.ReactNode;
  /** The current module's column: a `ShellColumn`, or `null` for a screen without one. @default undefined */
  column?: React.ReactNode;
  /** The column's width in pixels (the person's saved width). @default 240 */
  columnWidth?: number;
  /**
   * Whether the person keeps the column open, from the `vs_shell_col` cookie on the server.
   * `ShellStateScript`'s mark wins when it is there, so a cached page still paints right.
   * @default true
   */
  defaultColumnOpen?: boolean;
  /** The phone bottom tab bar: a `ShellBottomBar`. @default undefined */
  bottomBar?: React.ReactNode;
  /** Floating items at the page's bottom-right: a `ShellFloatingArea`. @default undefined */
  floating?: React.ReactNode;
  /**
   * The assistant: an `AssistantCard`, docked beside the page card as a second card while open
   * (the split view, LAY-26). From 40rem only: a phone puts the card's parts in a bottom sheet.
   * @default undefined
   */
  assistant?: React.ReactNode;
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
 * `Shell` — the frame every screen sits in: a 44px global bar across the top, then a 64px module
 * rail, the module's 240px column and the page under its 48px top bar (LAY-22). From 40rem the
 * bar and the rail sit on the window's canvas and the column and the page share one rounded card
 * inset from the window's end and bottom edges, with the assistant docked as a second card beside
 * it (LAY-26). It
 * lays itself out in CSS before hydration, from the data attributes it renders and the marks
 * `ShellStateScript` leaves.
 *
 * @example
 * <Shell
 *   globalBar={<GlobalBar>…</GlobalBar>}
 *   rail={<Rail>…</Rail>}
 *   column={<ShellColumn label="Tasks">…</ShellColumn>}
 *   bottomBar={<ShellBottomBar>…</ShellBottomBar>}
 * >
 *   <ShellTopBar>…</ShellTopBar>
 *   <ShellMain><ShellPage>…</ShellPage></ShellMain>
 * </Shell>
 */
export function Shell({
  globalBar,
  rail,
  column,
  columnWidth,
  defaultColumnOpen = true,
  bottomBar,
  floating,
  assistant,
  fill = "viewport",
  className,
  style,
  children,
  ...props
}: ShellProps) {
  const hasColumn = column != null;
  // The person's saved width; `ShellStateScript` sets the same name on `<html>` for a cached page.
  const vars = {
    ...(columnWidth !== undefined
      ? { "--shell-column-saved": `${clampColumnWidth(columnWidth)}px` }
      : {}),
  };
  return (
    <div
      data-slot="shell"
      data-col={defaultColumnOpen ? "open" : "closed"}
      data-fill={fill}
      data-has-column={hasColumn ? "" : undefined}
      data-has-global-bar={globalBar ? "" : undefined}
      data-has-bottombar={bottomBar ? "" : undefined}
      className={cn("group/shell font-sans", className)}
      style={{ ...vars, ...style } as React.CSSProperties}
      {...props}
    >
      <style href="vegastack-shell" precedence="vegastack">
        {SHELL_CSS}
      </style>
      <ShellSkipLink />
      {globalBar}
      <div data-slot="shell-room">
        <div data-slot="shell-rail-area">{rail}</div>
        <div data-slot="shell-card">
          <div data-slot="shell-fit">
            {hasColumn ? (
              <div
                data-slot="shell-column-area"
                data-shell-region="column"
                tabIndex={-1}
                className="outline-none"
              >
                {column}
                <ShellColumnResize />
              </div>
            ) : null}
            <div data-slot="shell-main-area">
              {children}
              {floating}
            </div>
          </div>
        </div>
        {/* A stable box for the assistant: the phone sheet makes it inert as a whole. */}
        <div data-slot="shell-assistant-area">{assistant}</div>
      </div>
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

/** Props accepted by `ShellColumn`. */
export interface ShellColumnProps extends React.ComponentProps<"nav"> {
  /** The navigation landmark's name — the module's name. */
  label: string;
}

/**
 * `ShellColumn` — the current module's own navigation: its title row (`ShellColumnHeader`), then
 * its views, saved filters, folders, spaces or chats as a `NavTree` (L1, D4, D9). 240px,
 * resizable from 200 to 360 at its end edge, folded with ⌘\.
 *
 * @example
 * <ShellColumn label="Tasks">
 *   <ShellColumnHeader title="Tasks" actions={<NewTaskButton />} />
 *   <NavTree><NavTreeSection label="Views">…</NavTreeSection></NavTree>
 * </ShellColumn>
 */
export function ShellColumn({
  label,
  className,
  children,
  ...props
}: ShellColumnProps) {
  // The column scrolls in a `ScrollArea` (BRD-SCR): an overlay bar that takes no width and shows
  // while the pointer is over the list. The `<nav>` is the scroller itself, so it keeps the
  // `shell-column` slot the shell's sheet and focus code read.
  return (
    <ScrollArea
      data-slot="shell-column-scroll"
      className="flex min-h-0 flex-1 flex-col"
      viewportRender={<nav />}
      viewportProps={{
        "data-slot": "shell-column",
        "aria-label": label,
        ...props,
      }}
      viewportClassName={cn(
        "flex min-h-0 flex-1 flex-col px-2 pb-3.5",
        className,
      )}
    >
      {children}
    </ScrollArea>
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
 * `ShellColumnHeader` — the column's first row, on every module (D4): the module's name and one or
 * two actions, 48px and level with the page's top bar. It stays put while the column scrolls.
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
        "sticky top-0 z-10 -mx-2 flex h-(--shell-topbar-height) flex-none items-center justify-between gap-2 bg-sidebar ps-4 pe-2.5",
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

/** Props accepted by `ShellTopBar`. */
export type ShellTopBarProps = React.ComponentProps<"header">;

/**
 * `ShellTopBar` — the 48px bar over the page. Its slots keep one order whatever order a page
 * writes them in (UI ground rules P1): the title, then at the end `[members] · [Share] ·
 * [Watch] · [☆] · [⋯]`, with ⋯ last but for a record page's ▥ (`ShellTopBarPanel`) and, on a
 * phone, Help and the avatar (`ShellTopBarAccount`), which wider screens keep in the global bar. Every
 * control is ghost and 28px: no primary, no
 * outline, no other tools — a list's primary is its toolbar's last control. Narrow, Share shows
 * its icon alone and the members leave. There is no save status: saving is silent, and a failed
 * save is an alert in the page.
 *
 * @example
 * <ShellTopBar>
 *   <ShellTopBarTitle parents={<a href="/spaces/general">General</a>}>Q3 pricing</ShellTopBarTitle>
 *   <ShellTopBarMembers><MembersStack people={members} /></ShellTopBarMembers>
 *   <ShellTopBarShare><Button variant="ghost" size="sm"><Lock /><ShellTopBarLabel>Share</ShellTopBarLabel></Button></ShellTopBarShare>
 *   <ShellTopBarFavorite><Button variant="ghost" size="icon-sm" aria-label="Favourite"><Star /></Button></ShellTopBarFavorite>
 *   <ShellTopBarMore><MoreMenu /></ShellTopBarMore>
 * </ShellTopBar>
 */
export function ShellTopBar({ className, ...props }: ShellTopBarProps) {
  return (
    <header
      data-slot="shell-topbar"
      data-shell-region="topbar"
      tabIndex={-1}
      className={cn(
        "@container/shell-topbar flex h-(--shell-topbar-height) min-w-0 items-center gap-1 border-b ps-3.5 pe-2.5 outline-none",
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
}

/**
 * `ShellTopBarTitle` — the page's title, its `<h1>`, rendered on the server with the page (never
 * portalled), after the breadcrumb of its parents. A phone's way to the module's places is
 * `ShellColumnSwitch`, beside it.
 *
 * @example
 * <ShellTopBarTitle parents={<><a href="/library">Library</a><a href="/library/f">Pricing</a></>}>Q3 review</ShellTopBarTitle>
 */
export function ShellTopBarTitle({
  parents,
  className,
  children,
  ...props
}: ShellTopBarTitleProps) {
  const crumbs = React.Children.toArray(parents);
  return (
    <div
      data-slot="shell-topbar-title"
      className={cn(
        "order-1 flex min-w-0 flex-1 items-center gap-1 pe-1 text-sm",
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
      </div>
    </div>
  );
}

/** Props accepted by the top bar's slot parts. */
export interface ShellTopBarSlotProps extends React.ComponentProps<"div"> {
  /** Width to hold in rem while the slot's content streams in, so the bar never shifts. @default undefined */
  reserve?: number;
}

// Every control in the bar is one ghost shape, 28px tall (UI ground rules P1, C1): the members
// stack, Share (icon and label), the Watch and ☆ toggles (the same 28px circle) and ⋯.
const BUTTON_SHAPE =
  "*:data-[slot=button]:h-7 *:[&[aria-pressed]]:size-7 *:[&[aria-pressed]]:min-w-7 *:[&[aria-pressed]]:px-0";

/**
 * One type size for the bar's controls: a `size="sm"` Share or Toggle would otherwise read 12px
 * with a 14px icon beside a 14px breadcrumb and the 16px icons of ⋯ and ▥. Every label is 14px
 * and every icon without its own size 16px, whichever button size a page passes — matched on the
 * element, not its slot name, since a menu or popover trigger renames a Button's slot. `PeekActions`
 * carries the same rule, so a record's controls look alike in the bar and in the peek's header.
 */
const CONTROL_TYPE =
  "[&_:is(button,a,[role=button])]:text-sm [&_:is(button,a,[role=button])_svg:not([class*='size-'])]:size-4";

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
        className={cn(
          // An empty slot, or one whose only child is empty (an app's portal target), takes no
          // room and no gap, so the controls that are there keep one 4px rhythm.
          "flex flex-none items-center empty:hidden has-[>:only-child:empty]:hidden",
          order,
          extra,
          className,
        )}
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

/*
 * The bar's end holds five slots in one fixed order, whatever order a page declares them in:
 * members · Share · Watch · ☆ · ⋯ (UI ground rules P1). Nothing else goes in the bar: a list's
 * primary button is the last control of its `ListToolbar` (`primary`), and a record's or a
 * form's main action sits in the content, beside the work (P1a).
 */

/**
 * `ShellTopBarMembers` — who has access, first at the bar's end: one `MembersStack`.
 *
 * @example
 * <ShellTopBarMembers><MembersStack people={members} total={23} /></ShellTopBarMembers>
 */
export const ShellTopBarMembers = topBarSlot(
  "shell-topbar-members",
  "order-2",
  cn("@max-md/shell-topbar:hidden", BUTTON_SHAPE),
);

/**
 * `ShellTopBarShare` — Share, a ghost button with its icon and label. Wrap its word in
 * `ShellTopBarLabel` and a narrow bar shows its icon alone.
 *
 * @example
 * <ShellTopBarShare><Button variant="ghost" size="sm"><Lock /><ShellTopBarLabel>Share</ShellTopBarLabel></Button></ShellTopBarShare>
 */
export const ShellTopBarShare = topBarSlot(
  "shell-topbar-share",
  "order-3",
  cn(BUTTON_SHAPE, CONTROL_TYPE),
);

/**
 * `ShellTopBarWatch` — the Watch bell, where the record has one: a ghost icon toggle beside ☆.
 *
 * @example
 * <ShellTopBarWatch><Button variant="ghost" size="icon-sm" aria-label="Watch" aria-pressed={watching}><Bell /></Button></ShellTopBarWatch>
 */
export const ShellTopBarWatch = topBarSlot(
  "shell-topbar-watch",
  "order-4",
  cn(BUTTON_SHAPE, CONTROL_TYPE),
);

/**
 * `ShellTopBarFavorite` — ☆, immediately before ⋯: one ghost icon toggle.
 *
 * @example
 * <ShellTopBarFavorite><Button variant="ghost" size="icon-sm" aria-label="Favourite" aria-pressed={starred}><Star /></Button></ShellTopBarFavorite>
 */
export const ShellTopBarFavorite = topBarSlot(
  "shell-topbar-favorite",
  "order-5",
  cn(BUTTON_SHAPE, CONTROL_TYPE),
);

/**
 * `ShellTopBarMore` — ⋯, always the bar's last control: the record's menu. Render it only when it
 * holds two or more actions (P3); one action is its own button, and Copy link belongs in Share.
 *
 * @example
 * <ShellTopBarMore><DropdownMenu>…</DropdownMenu></ShellTopBarMore>
 */
export const ShellTopBarMore = topBarSlot(
  "shell-topbar-more",
  "order-6",
  cn(BUTTON_SHAPE, CONTROL_TYPE),
);

/**
 * `ShellTopBarPanel` — a record page's ▥ (`RecordPanelToggle`), after ⋯ and a hairline divider:
 * the one control that follows the record's menu (record side panel R2). Empty, it takes no room.
 *
 * @example
 * <ShellTopBarPanel><RecordPanelToggle /></ShellTopBarPanel>
 */
export const ShellTopBarPanel = topBarSlot(
  "shell-topbar-panel",
  "order-7",
  cn(
    // A phone's bar has no ▥ (the page's Details button opens the panel), so no divider either.
    "gap-1 max-sm:hidden before:mx-1 before:h-4.5 before:w-px before:bg-border",
    BUTTON_SHAPE,
    CONTROL_TYPE,
  ),
);

/**
 * `ShellTopBarAccount` — on a phone only, the bar's last controls: Help (a 36px ghost icon
 * button) and the person's 30px avatar, which the hidden global bar holds on wider screens. Above
 * a phone it takes no room. Each control sits in its own box 8px from the next, so each keeps a
 * 44px touch target of its own.
 *
 * @example
 * <ShellTopBarAccount><HelpMenu … /><AccountMenu … /></ShellTopBarAccount>
 */
export function ShellTopBarAccount({
  className,
  children,
  ...props
}: ShellTopBarSlotProps) {
  return (
    <AccountSlot className={className} {...props}>
      {/* Its own box: a control right after another clamps its touch target on that side. */}
      {React.Children.map(children, (child) =>
        child == null || child === false ? null : (
          <span className="flex">{child}</span>
        ),
      )}
    </AccountSlot>
  );
}
const AccountSlot = topBarSlot(
  "shell-topbar-account",
  "order-8",
  "ms-1 hidden gap-2 @max-[40rem]/shell:flex",
);

/**
 * `ShellTopBarLabel` — a top-bar button's words, read out always but shown only while the bar
 * has room; below it the button shows its icon alone.
 *
 * @example
 * <Button variant="ghost" size="sm"><Lock /><ShellTopBarLabel>Share</ShellTopBarLabel></Button>
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
 * `ShellFloatingArea` — the one stack of floating items at the page's bottom-right: the audio
 * player, upload progress. It lifts over the phone bar and the home indicator, and is left out of
 * print. Toasts stay bottom-centre.
 *
 * @example
 * <Shell floating={<ShellFloatingArea><UploadProgress /></ShellFloatingArea>} …>
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
  /** A count on the icon: the rail's compact badge (`RailBadge`, "99+" past 99). @default undefined */
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
  const count = railBadgeText(badge);
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
          <span className="relative grid size-5 place-items-center">
            {icon}
            <RailBadge
              count={count}
              className="shadow-[0_0_0_1.5px_var(--background)]"
            />
          </span>
        </span>
        <span className="max-w-full truncate">{label}</span>
      </>
    ),
  });
}
