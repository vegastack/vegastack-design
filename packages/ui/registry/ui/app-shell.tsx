// @vegastack app-shell@0.25.95 sha256-JTbRWr+xWPKBGBfRJadTkaLd2P6nykbcBo+Y0wdrlIU=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, mergeRefs } from "@vegastack/design";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/components/ui/use-media-query";
import { RAIL_COLLAPSED_QUERY, type PageWidth } from "@/lib/page-layout";

/**
 * The id `AppShell`'s skip link points at and `AppShellContent` claims — generated once per
 * shell so a page may hold more than one.
 *
 * It used to be the literal string `"main-content"` in both places. That is a document-global
 * name, so a page rendering two shells published the id twice and EVERY skip link resolved to
 * the first region: measured on this system's own `app-shell` docs page, where four
 * `landmark="region"` previews each carried `id="main-content"` and the documented "Tab once,
 * press Enter" flow landed the reader in the first preview from every frame. Nothing caught it
 * — axe dropped the non-ARIA `duplicate-id` rule, and the geometry lane mounts one fixture at
 * a time.
 *
 * Sharing one generated id between two sibling components is what makes this file a client
 * module: `React.createContext`/`useContext` are `undefined` under the `react-server`
 * condition (`tooling/verify-rsc-safety.mjs`). The boundary is at the shell root, which is
 * already where `SidebarProvider`'s own client context lives, and the consumer's page content
 * still renders on the server and passes through as `children`.
 *
 * The fallback is the historical literal, so an `AppShellContent` composed OUTSIDE an
 * `AppShell` keeps the id its previous users linked to.
 */
const AppShellContentIdContext = React.createContext<string>("main-content");

/** `AppShellSidebar` reports its `collapsible` here, so the rail fold acts on an icon rail only. */
const AppShellRailContext = React.createContext<
  (collapsible: "offcanvas" | "icon" | "none") => void
>(() => {});

/**
 * The page gutter scale — one CSS variable, `--page-gutter`, that the header, the page and the
 * record rail's sticky offset all read, so their edges line up whenever the page fills its area:
 * 16px below 640px, 24px from 640px, 32px from 1024px (viewport breakpoints — the header is outside
 * the content region, so a container query could not reach it). Set on `AppShell` for everything
 * inside it, and again on each part that pads with it so a part rendered on its own keeps it.
 */
export const pageGutterClasses =
  "[--page-gutter:--spacing(4)] sm:[--page-gutter:--spacing(6)] lg:[--page-gutter:--spacing(8)] min-[120rem]:[--page-gutter:--spacing(12)]";

/** Props accepted by `AppShell`. */
export interface AppShellProps extends React.ComponentProps<"div"> {
  /**
   * Initial sidebar open state when uncontrolled — forwarded to `SidebarProvider`.
   * @default true
   */
  defaultOpen?: boolean;
  /**
   * Controlled sidebar open state — forwarded to `SidebarProvider`. Pair with `onOpenChange`.

   * @default undefined
   */
  open?: boolean;
  /** Called whenever the sidebar's open state changes — forwarded to `SidebarProvider`.
   * @default undefined
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * The key that toggles the sidebar with ⌘/Ctrl, or `false` to turn the shortcut off —
   * forwarded to `SidebarProvider`.
   * @default "b"
   */
  keyboardShortcut?: string | false;
  /**
   * Accessible label for the skip-to-content link — the first focusable element in the shell,
   * always present in the DOM (`sr-only` until focused).
   * @default 'Skip to content'
   */
  skipLinkLabel?: string;
  /**
   * The `id` this shell's `AppShellContent` claims and this shell's skip link targets. Generated
   * with `React.useId()` when omitted, so two shells on one page never collide.
   *
   * Pass it when the id has to be stable and known — a documented deep link, an external
   * `aria-controls`, or a test harness. Setting `id` through `{...props}` on `AppShell` or on
   * `AppShellContent` does NOT rewire the skip link; this prop is the one that does.
   * @default undefined
   */
  contentId?: string;
  /**
   * Fold an open icon rail (`AppShellSidebar collapsible="icon"`) when the window narrows into the
   * tablet span (768–1023px, `RAIL_COLLAPSED_QUERY`), and end the fold when it widens out of it.
   * The fold is display only — it writes no cookie and calls no `onOpenChange` — so the person's
   * own choice comes back on the way out, after a reload, and with the first toggle. Only a live
   * change of width folds, never the first paint (`SidebarStateScript`'s `collapsedWhen` decides
   * the start). An off-canvas sidebar is never folded. `false` turns it off.
   * @default true
   */
  collapseRail?: boolean;
}

/**
 * `AppShell` — the root of the shared dashboard layout. Wraps `SidebarProvider` (forwarding
 * `defaultOpen`/`open`/`onOpenChange` — everything the sidebar's expand/collapse and mobile-Sheet
 * behavior needs) and renders the flex row that
 * `AppShellSidebar` and your content column sit in, plus a skip-to-content link
 * (`sr-only focus:not-sr-only`, targeting THIS shell's `AppShellContent`) as the very first
 * focusable element in the shell. The target id is generated per shell with `React.useId()` and
 * shared down, so a page may hold several shells and each skip link lands in its own region;
 * `contentId` pins it when the id has to be known.
 *
 * **No extra wrapper `<div>`.** `SidebarProvider` already renders exactly the flex row a shell
 * needs (`sidebar.tsx`'s internal `sidebar-wrapper` div — `flex min-h-svh w-full`) and forwards
 * `className`/other div props onto it. `AppShell` reuses that same element — overriding its
 * `data-slot` from `"sidebar-wrapper"` to `"app-shell"` — instead of nesting a second flex row
 * around it.
 *
 * **Router-agnostic, by design.** `AppShell` never imports a router and has no opinion on route
 * changes. Moving focus on client-side navigation (to the page's `<h1>`, or to
 * `AppShellContent`'s `<main>` itself) is the DOWNSTREAM app's responsibility — typically a
 * `useEffect` keyed on the router's pathname, in the routed layout/page. See the "Route-change
 * focus" section of this component's docs page for the pattern.
 *
 * **Composition contract.** Render `AppShellSidebar` as one child, then your OWN flex-column
 * `<div>` wrapping `AppShellHeader` + `AppShellContent` as the other. `AppShell` deliberately does
 * NOT render that column for you: it keeps `AppShellHeader`'s `<header>` a true sibling of
 * `AppShellContent`'s `<main>` — never nested inside it, which is what lets `AppShellHeader` keep
 * the `banner` landmark role (a `<header>` descending from `<main>` loses it). See
 * `AppShellContent`'s doc for the rest of that reasoning.
 *
 * @example
 * <AppShell defaultOpen>
 *   <AppShellSidebar>
 *     <SidebarHeader>…logo…</SidebarHeader>
 *     <SidebarContent>…nav…</SidebarContent>
 *   </AppShellSidebar>
 *   <div className="flex h-svh min-w-0 flex-1 flex-col">
 *     <AppShellHeader actions={<Button size="sm">New agent</Button>}>
 *       <Breadcrumb>…</Breadcrumb>
 *     </AppShellHeader>
 *     <AppShellContent>…page content…</AppShellContent>
 *   </div>
 * </AppShell>
 *
 * @example
 * // A static or cached shell: `<SidebarStateScript collapsible="icon" />` goes in the root
 * // layout's <head>, and the shell is controlled from the cookie hook (LAY-13).
 * const [open, setOpen] = useSidebarCookieOpen();
 * <AppShell open={open} onOpenChange={setOpen}>…</AppShell>
 */
export function AppShell({
  defaultOpen,
  open,
  onOpenChange,
  keyboardShortcut,
  skipLinkLabel = "Skip to content",
  contentId,
  collapseRail = true,
  className,
  children,
  ...props
}: AppShellProps) {
  const generatedId = React.useId();
  const resolvedContentId = contentId ?? generatedId;
  // The fold is a display state, never the person's choice: while folded the provider is held
  // shut (controlled, so it writes no cookie), and the first toggle ends the fold — the rail
  // returns to whatever the person had chosen.
  const [folded, setFolded] = React.useState(false);
  const [rail, setRail] = React.useState<"offcanvas" | "icon" | "none">(
    "offcanvas",
  );
  const unfold = React.useCallback(() => setFolded(false), []);
  // A fold only lasts while it may happen at all: turning `collapseRail` off or the rail into an
  // off-canvas one ends it.
  const canFold = collapseRail && rail === "icon";
  if (folded && !canFold) setFolded(false);
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={folded ? false : open}
      onOpenChange={folded ? unfold : onOpenChange}
      keyboardShortcut={keyboardShortcut}
      data-slot="app-shell"
      data-rail-folded={folded ? "" : undefined}
      className={cn(pageGutterClasses, className)}
      {...props}
    >
      <a
        href={`#${resolvedContentId}`}
        data-slot="app-shell-skip-link"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        {skipLinkLabel}
      </a>
      {canFold ? (
        <AppShellRailFold folded={folded} setFolded={setFolded} />
      ) : null}
      <AppShellRailContext.Provider value={setRail}>
        <AppShellContentIdContext.Provider value={resolvedContentId}>
          {children}
        </AppShellContentIdContext.Provider>
      </AppShellRailContext.Provider>
    </SidebarProvider>
  );
}

/**
 * Folds an open icon rail when the window narrows into `RAIL_COLLAPSED_QUERY` and ends the fold
 * when it widens out of it. Only a change of width does this: each run compares the window's
 * live answer with the last one it saw (the first run only records it), so hydration's server
 * answer and an effect replay are never mistaken for a resize.
 */
function AppShellRailFold({
  folded,
  setFolded,
}: {
  folded: boolean;
  setFolded: (folded: boolean) => void;
}) {
  const { open } = useSidebar();
  const narrow = useMediaQuery(RAIL_COLLAPSED_QUERY);
  const previous = React.useRef<boolean | null>(null);
  const state = React.useRef({ open, folded });
  state.current = { open, folded };
  React.useEffect(() => {
    const live = window.matchMedia(RAIL_COLLAPSED_QUERY).matches;
    if (previous.current === null || live === previous.current) {
      previous.current = live;
      return;
    }
    previous.current = live;
    if (live && state.current.open) setFolded(true);
    else if (!live && state.current.folded) setFolded(false);
  }, [narrow, setFolded]);
  return null;
}

/** Props accepted by `AppShellSidebar`. */
export interface AppShellSidebarProps extends React.ComponentProps<
  typeof Sidebar
> {
  /**
   * In the collapsed icon rail, rule a hairline between consecutive `SidebarGroup`s (in the 8px
   * gap their padding already leaves), so the rail's icons read in their groups once the group
   * labels have folded away. The expanded sidebar and the phone drawer are unchanged.
   * @default false
   */
  railSeparators?: boolean;
}

/**
 * `AppShellSidebar` — a thin, opinionated wrapper over `Sidebar`: defaults `aria-label` to
 * `"Main navigation"` (override it for a differently-named rail) and passes every other prop
 * straight through (`variant`, `collapsible`, `side`, …). Compose your own `SidebarHeader` /
 * `SidebarContent` / `SidebarFooter` as children — exactly as you would with `Sidebar` directly.
 *
 * **It supplies the `<nav>` landmark, and that is the reason it exists** (LAY-12). Upstream's
 * `Sidebar` is divs all the way down — deliberately, because upstream leaves landmarks to the
 * page. The landmark goes INSIDE the rail, around the children, stamped
 * `data-slot="app-shell-sidebar"`: that is the one position that works in both of the trees
 * upstream renders, and it is the one that keeps the landmark honest. Below the mobile breakpoint
 * upstream moves the rail into a `Sheet`, so a landmark placed OUTSIDE would sit in the document
 * with nothing in it whenever that sheet is closed; placed inside, it appears exactly when the
 * navigation does. The rail's own state stays where upstream puts it, on `[data-slot="sidebar"]`.
 *
 * @example
 * <AppShellSidebar variant="inset">
 *   <SidebarHeader>…</SidebarHeader>
 *   <SidebarContent>…</SidebarContent>
 * </AppShellSidebar>
 */
export function AppShellSidebar({
  "aria-label": ariaLabel = "Main navigation",
  collapsible = "offcanvas",
  railSeparators = false,
  children,
  ...props
}: AppShellSidebarProps) {
  const reportRail = React.useContext(AppShellRailContext);
  React.useEffect(() => reportRail(collapsible), [reportRail, collapsible]);
  return (
    <Sidebar collapsible={collapsible} {...props}>
      <nav
        data-slot="app-shell-sidebar"
        aria-label={ariaLabel}
        data-rail-separators={railSeparators ? "" : undefined}
        className={cn(
          "flex h-full min-h-0 w-full flex-col",
          railSeparators &&
            "group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:pointer-events-none group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:absolute group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:inset-x-2 group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:top-0 group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:h-px group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:bg-sidebar-border group-data-[collapsible=icon]:[&_[data-slot=sidebar-group]+[data-slot=sidebar-group]]:before:content-['']",
        )}
      >
        {children}
      </nav>
    </Sidebar>
  );
}

/** Props accepted by `AppShellHeader`. */
export interface AppShellHeaderProps extends React.ComponentProps<"header"> {
  /**
   * Right-aligned, `shrink-0` end slot — page-level actions (typically one or more `Button`s or
   * a menu trigger). Omit to hide the slot entirely.

   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * The phone's own tools, before `actions` (so the page's primary stays rightmost): Search and
   * the Inbox with its count, each an `AppShellHeaderMobileAction`. Shown only below 768px, where
   * the sidebar — which holds them at every other width — is a drawer; with it the sidebar
   * trigger is a 40px target on a phone too. Omit to keep the bar as it is.
   * @default undefined
   */
  mobileActions?: React.ReactNode;
}

/**
 * `AppShellHeader` — the shell's top row: a real `<header>` (a `banner` landmark — it's always a
 * sibling of `AppShellContent`'s `<main>`, never nested inside it; see the placement note on
 * `AppShell`). Composes `SidebarTrigger` (ALWAYS visible — on mobile it's the only way to open the
 * sidebar, not just a desktop collapse control) + a `min-w-0` middle slot for `children` (a
 * `Breadcrumb` or a `PageHeader`) + a `shrink-0` `actions` end slot.
 *
 * **Mobile discipline.** The middle slot is `min-w-0 flex-1` so a long breadcrumb trail or title
 * shrinks/truncates instead of pushing `actions` off-screen. Collapse the middle of a long trail
 * yourself with `BreadcrumbEllipsis`, or use `PageHeader`'s `TruncatedText`-backed title — don't
 * let raw, unbounded text wrap the header onto a second line.
 *
 * **A width container.** The header is an inline-size container named `app-shell-header`, so
 * its tools can compact by the header's own width — which counts the sidebar's state — with
 * container queries instead of a JS measure or a viewport breakpoint:
 * `hidden @2xl/app-shell-header:inline-flex`.
 *
 * **The phone bar.** `mobileActions` puts what the drawer hides one tap away on a phone — Search
 * and the Inbox with its count — between the title and the page's actions, at 40px each.
 *
 * @example
 * <AppShellHeader actions={<Button size="sm">New agent</Button>}>
 *   <Breadcrumb>
 *     <BreadcrumbList>…</BreadcrumbList>
 *   </Breadcrumb>
 * </AppShellHeader>
 *
 * @example
 * <AppShellHeader
 *   mobileActions={
 *     <>
 *       <AppShellHeaderMobileAction label="Search" icon={<Search />} onClick={openSearch} />
 *       <AppShellHeaderMobileAction label="Inbox" icon={<Inbox />} count={15} countLabel="unread" onClick={openInbox} />
 *     </>
 *   }
 *   actions={<PageActions />}
 * >
 *   <Breadcrumb>…</Breadcrumb>
 * </AppShellHeader>
 */
export function AppShellHeader({
  className,
  actions,
  mobileActions,
  children,
  ...props
}: AppShellHeaderProps) {
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        "@container/app-shell-header flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-(--page-gutter)",
        pageGutterClasses,
        className,
      )}
      {...props}
    >
      <SidebarTrigger
        className={mobileActions ? "max-md:size-10" : undefined}
      />
      <div
        data-slot="app-shell-header-middle"
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {children}
      </div>
      {mobileActions ? (
        <div
          data-slot="app-shell-header-mobile-actions"
          className="flex shrink-0 items-center md:hidden"
        >
          {mobileActions}
        </div>
      ) : null}
      {actions ? (
        <div
          data-slot="app-shell-header-actions"
          className="flex shrink-0 items-center gap-2"
        >
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/** Props accepted by `AppShellHeaderMobileAction`. */
export interface AppShellHeaderMobileActionProps extends Omit<
  React.ComponentProps<typeof Button>,
  "children" | "size" | "variant"
> {
  /** The tool's name ("Search", "Inbox") — its accessible name; the button shows the icon alone. */
  label: string;
  /** The tool's icon. */
  icon: React.ReactNode;
  /**
   * A count at the icon's top-end corner ("15"); nothing at 0 or below.
   * @default undefined
   */
  count?: number;
  /**
   * The highest count shown as a number; above it the pill reads "99+".
   * @default 99
   */
  countMax?: number;
  /**
   * The count's words in the name: "Inbox 15 unread".
   * @default undefined
   */
  countLabel?: string;
  /**
   * A dot at the corner instead of a number — something new, uncounted. A `count` wins.
   * @default false
   */
  dot?: boolean;
}

/**
 * `AppShellHeaderMobileAction` — one of the phone bar's tools: a 40px ghost icon button with an
 * optional count pill (or a dot) at its top-end corner. The count is part of its name ("Inbox 15
 * unread") and the pill is decorative. A link renders through `render`.
 *
 * @example
 * <AppShellHeaderMobileAction label="Inbox" icon={<Inbox />} count={15} countLabel="unread" onClick={openInbox} />
 */
export function AppShellHeaderMobileAction({
  label,
  icon,
  count,
  countMax = 99,
  countLabel,
  dot = false,
  className,
  ...props
}: AppShellHeaderMobileActionProps) {
  const counted = count !== undefined && count > 0;
  const shown = counted
    ? count > countMax
      ? `${countMax}+`
      : String(count)
    : null;
  return (
    <Button
      data-slot="app-shell-header-mobile-action"
      variant="ghost"
      size="icon-lg"
      className={cn("relative size-10", className)}
      {...props}
    >
      {icon}
      <span className="sr-only">
        {label}
        {shown ? ` ${shown}${countLabel ? ` ${countLabel}` : ""}` : ""}
      </span>
      {shown ? (
        <span
          data-slot="app-shell-header-mobile-action-count"
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs leading-4 font-medium text-primary-foreground tabular-nums"
        >
          {shown}
        </span>
      ) : dot ? (
        <span
          data-slot="app-shell-header-mobile-action-dot"
          aria-hidden="true"
          className="pointer-events-none absolute top-2 end-2 size-2 rounded-full bg-primary"
        />
      ) : null}
    </Button>
  );
}

/** Props accepted by `AppShellFold`. */
export interface AppShellFoldProps {
  /**
   * Which copy this is: `sidebar` — the entries' place in the sidebar, left out of the phone
   * drawer; `menu` — their place in the profile menu, rendered only while the sidebar is the phone
   * drawer.
   */
  place: "sidebar" | "menu";
  /** The entries, in the shape their place needs (sidebar rows, or menu items). */
  children: React.ReactNode;
}

/**
 * `AppShellFold` — folds a set of sidebar entries (Docs · Trash · Settings) into the profile menu
 * on a phone, where the drawer is short and its footer would sit under the fold: wrap the sidebar
 * copy in `place="sidebar"` and the profile menu's copy in `place="menu"`. Exactly one of the two
 * renders — the sidebar's on a tablet or a desktop, the menu's in the phone drawer — so nothing is
 * ever unreachable. The shell supplies the mechanism; the entries are the host's.
 *
 * @example
 * <AppShellFold place="sidebar"><SidebarGroup>…Docs · Trash · Settings…</SidebarGroup></AppShellFold>
 * // …and inside the profile menu's DropdownMenuContent:
 * <AppShellFold place="menu">
 *   <DropdownMenuItem render={<Link href="/settings" />}><Settings />Settings</DropdownMenuItem>
 * </AppShellFold>
 */
export function AppShellFold({ place, children }: AppShellFoldProps) {
  const { isMobile } = useSidebar();
  return (place === "menu") === isMobile ? <>{children}</> : null;
}

/** Props accepted by `AppShellHeaderSlot`. */
export type AppShellHeaderSlotProps = React.ComponentPropsWithRef<"span">;

/**
 * `AppShellHeaderSlot` — a fixed 32px place in the top bar's actions for something that arrives
 * late or changes shape (a save status, a connection icon): reserved from the first paint, so the
 * buttons beside it never move. Wider content grows it. A tooltip trigger can render as it.
 *
 * @example
 * <AppShellHeaderSlot><AutoSaveIndicator variant="icon" status={status} /></AppShellHeaderSlot>
 */
export function AppShellHeaderSlot({
  className,
  ...props
}: AppShellHeaderSlotProps) {
  return (
    <span
      data-slot="app-shell-header-slot"
      className={cn(
        "flex h-8 min-w-8 shrink-0 items-center justify-center",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `AppShellHeaderShow`. */
export interface AppShellHeaderShowProps extends React.ComponentPropsWithRef<"span"> {
  /**
   * When its content shows: `narrow` — only while the top bar is under 40rem (its own width, so a
   * collapsed sidebar or a split view counts); `wide` — only from 40rem.
   */
  when: "narrow" | "wide";
}

/**
 * `AppShellHeaderShow` — shows its content in the top bar by the bar's own width: the people
 * stack's faces of their own in a narrow bar, say, where the wide bar shows them elsewhere.
 *
 * @example
 * <AppShellHeaderShow when="narrow"><AvatarStack people={here} max={2} /></AppShellHeaderShow>
 */
export function AppShellHeaderShow({
  when,
  className,
  ...props
}: AppShellHeaderShowProps) {
  return (
    <span
      data-slot="app-shell-header-show"
      data-when={when}
      className={cn(
        when === "narrow"
          ? "hidden items-center @max-[40rem]/app-shell-header:inline-flex"
          : "inline-flex items-center @max-[40rem]/app-shell-header:hidden",
        className,
      )}
      {...props}
    />
  );
}

/** One action in `AppShellHeaderActions`. */
export interface AppShellHeaderAction {
  /** Stable key. */
  id: string;
  /** The visible label while the bar has room, and the accessible name everywhere. */
  label: string;
  /** The icon — shown alone when the bar is narrow, and beside the label in the ⋮ menu. */
  icon?: React.ReactNode;
  /** Runs on click or menu selection. */
  onSelect?: (event: React.MouseEvent<HTMLElement>) => void;
  /**
   * The element to render as — a router link (`<Link href="/x" />`) — for the button and for its
   * ⋮ menu item alike.
   */
  render?: React.ReactElement;
  /** Button variant while it is in the bar. @default "ghost" */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Shown but unavailable. */
  disabled?: boolean;
  /**
   * When the bar narrows below this width it moves into the ⋮ menu: `laptop` (55rem — the bar
   * beside an open sidebar on a laptop), `tablet` (40rem). `never` keeps it in the bar (the
   * page's one primary action), icon-only below 40rem.
   * @default "tablet"
   */
  overflow?: "laptop" | "tablet" | "never";
  /** A destructive menu entry (Move to Trash) — the menu's `destructive` variant. */
  destructive?: boolean;
}

/** Props accepted by `AppShellHeaderActions`. */
export interface AppShellHeaderActionsProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * The bar's actions, start to end; each moves into ⋮ when the bar is narrower than its `overflow`.
   * @default []
   */
  actions?: AppShellHeaderAction[];
  /**
   * Entries that live only in the ⋮ menu, after the ones that overflowed.
   * @default []
   */
  menu?: AppShellHeaderAction[];
  /** The ⋮ trigger's accessible name. @default "More actions" */
  menuLabel?: string;
  /**
   * Content kept in the bar before the actions (a presence stack, a save status).
   * @default undefined
   */
  leading?: React.ReactNode;
}

const OVERFLOW_AT = { laptop: 55 * 16, tablet: 40 * 16 } as const;
const MENU_TRIGGER = "\u22ee";

/**
 * `AppShellHeaderActions` — a page's actions in the top bar that give way as the bar narrows: each
 * action moves into one ⋮ menu below its `overflow` width (the BAR's own width, so an open sidebar
 * counts), labels drop to icons below 40rem, and `menu` entries always live in the ⋮. Nothing is
 * ever hidden without a way to reach it, and the page writes no container queries of its own.
 * Measured once per resize with the system's shared observer pattern; the first paint assumes a
 * wide bar on the server and settles before the browser paints on the client.
 *
 * @example
 * <AppShellHeaderActions
 *   leading={<AvatarStack people={here} max={3} />}
 *   actions={[
 *     { id: "share", label: "Share", icon: <Share2 />, onSelect: openShare, overflow: "never", variant: "outline" },
 *     { id: "watch", label: "Watch", icon: <Bell />, onSelect: toggleWatch, overflow: "laptop" },
 *   ]}
 *   menu={[{ id: "copy", label: "Copy link", icon: <Link2 />, onSelect: copy }]}
 *   menuLabel="Task actions"
 * />
 */
export function AppShellHeaderActions({
  actions = [],
  menu = [],
  menuLabel = "More actions",
  leading,
  className,
  ref,
  onFocus,
  onBlur,
  ...props
}: AppShellHeaderActionsProps) {
  const [width, setWidth] = React.useState<number>(Number.POSITIVE_INFINITY);
  const local = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(local, ref),
    [ref],
  );
  React.useLayoutEffect(() => {
    const bar =
      local.current?.closest<HTMLElement>("[data-slot=app-shell-header]") ??
      local.current?.parentElement;
    if (!bar) return;
    const read = () => setWidth(bar.getBoundingClientRect().width);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);
  const fits = (action: AppShellHeaderAction) => {
    const at = action.overflow ?? "tablet";
    return at === "never" || width >= OVERFLOW_AT[at];
  };
  const inBar = actions.filter(fits);
  const overflowed = actions.filter((action) => !fits(action));
  const compact = width < OVERFLOW_AT.tablet;
  const inMenu = [...overflowed, ...menu];

  // Focus never falls to the page when the bar re-lays out: an action that moves into ⋮ hands
  // focus to the ⋮ trigger, and a ⋮ that goes away hands it to the last action in the bar.
  const trigger = React.useRef<HTMLButtonElement | null>(null);
  const focused = React.useRef<string | null>(null);
  const hasMenu = inMenu.length > 0;
  const barIds = inBar.map((action) => action.id).join("\n");
  const previous = React.useRef({ barIds, hasMenu });
  React.useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { barIds, hasMenu };
    const group = local.current;
    const was = focused.current;
    const lost =
      document.activeElement === null ||
      document.activeElement === document.body;
    if (!group || !lost || was === null) return;
    const wasInBar = before.barIds.split("\n").includes(was);
    if (was === MENU_TRIGGER && before.hasMenu && !hasMenu) {
      const bar = group.querySelectorAll<HTMLElement>("[data-action]");
      bar[bar.length - 1]?.focus();
    } else if (wasInBar && !barIds.split("\n").includes(was) && hasMenu) {
      trigger.current?.focus();
    }
  }, [barIds, hasMenu]);
  return (
    <div
      ref={setRef}
      data-slot="app-shell-header-actions-group"
      data-compact={compact ? "" : undefined}
      onFocus={(event) => {
        onFocus?.(event);
        const target = event.target as HTMLElement;
        focused.current =
          target.getAttribute("data-action") ??
          (target === trigger.current ? MENU_TRIGGER : null);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        // Moving within the group keeps tracking; leaving it for elsewhere forgets.
        if (
          event.relatedTarget instanceof Node &&
          !event.currentTarget.contains(event.relatedTarget)
        )
          focused.current = null;
      }}
      className={cn("flex shrink-0 items-center gap-2", className)}
      {...props}
    >
      {leading}
      {inBar.map((action) => (
        <Button
          key={action.id}
          data-action={action.id}
          variant={action.variant ?? "ghost"}
          size={compact && action.icon ? "icon" : "default"}
          aria-label={compact && action.icon ? action.label : undefined}
          disabled={action.disabled}
          render={action.render}
          nativeButton={action.render ? false : undefined}
          onClick={action.onSelect}
        >
          {action.icon}
          {compact && action.icon ? null : action.label}
        </Button>
      ))}
      {inMenu.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                ref={trigger}
                variant="ghost"
                size="icon"
                aria-label={menuLabel}
                data-slot="app-shell-header-actions-menu"
              />
            }
          >
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {inMenu.map((action, index) => (
              <React.Fragment key={action.id}>
                {index === overflowed.length && overflowed.length > 0 ? (
                  <DropdownMenuSeparator />
                ) : null}
                <DropdownMenuItem
                  data-action={action.id}
                  disabled={action.disabled}
                  variant={action.destructive ? "destructive" : "default"}
                  render={action.render}
                  onClick={action.onSelect}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

/** Props accepted by `AppShellProgress`. */
export interface AppShellProgressProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The progress bar's accessible name.
   * @default "Loading"
   */
  label?: string;
}

/**
 * `AppShellProgress` — the page is loading: a 2px indeterminate bar along the top of
 * `AppShellContent`, shown at once. Render it with the route's skeleton wrapped in
 * `motion-reveal`, so a fast load shows no skeleton at all and a slow one is never a blank page
 * while the skeleton waits to fade in.
 *
 * @example
 * // app/(app)/tasks/loading.tsx
 * export default function Loading() {
 *   return (
 *     <>
 *       <AppShellProgress />
 *       <div className="motion-reveal"><TasksSkeleton /></div>
 *     </>
 *   );
 * }
 */
export function AppShellProgress({
  label = "Loading",
  className,
  ...props
}: AppShellProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      data-slot="app-shell-progress"
      className={cn(
        // Sticky in the scrolling content region, so it stays at the top however far the
        // page was scrolled; the negative margin gives back its 2px, so nothing moves.
        "pointer-events-none sticky top-0 z-10 -mb-0.5 h-0.5 w-full shrink-0 overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-y-0 w-[35%] rounded-full bg-primary motion-indeterminate" />
    </div>
  );
}

/** Props accepted by `AppShellContent`. */
// Typed off `div`, not `main`: `landmark` decides which of the two is actually rendered, and a
// `div` ref narrows to either element while a `main` (HTMLElement) ref does not.
export interface AppShellContentProps extends React.ComponentProps<"div"> {
  /**
   * Panel treatment mirroring the sibling `Sidebar`/`AppShellSidebar`'s `variant` — pass the SAME
   * value on both so the shell reads as one consistent layout. Applied directly as a prop here
   * (not shadcn's `SidebarInset` + CSS `peer` selector) — see the component doc for why.
   * @default 'sidebar'
   */
  variant?: "sidebar" | "floating" | "inset";
  /**
   * Which landmark this region claims. `main` (the default) is what a real application wants —
   * one `<main>` per document, and the skip link's target.
   *
   * `region` renders a `<div role="region">` instead, for the case where the shell is EMBEDDED in
   * a page that already owns a `<main>`: a docs preview, a design gallery, a shell shown inside a
   * larger document. Two `<main>` elements in one document is a real defect (axe
   * `landmark-no-duplicate-main`), and it was one this system's own showcase kept hitting. A
   * `region` needs an accessible name to be exposed as a landmark at all, so pass `aria-label`
   * with it; without one it is simply a plain container, which is also a correct outcome here.
   * @default 'main'
   */
  landmark?: "main" | "region";
}

/**
 * `AppShellContent` — the shell's main region: a real `<main tabIndex={-1}>` carrying the id the
 * enclosing `AppShell` generated, which is what that shell's skip link points at (`tabIndex={-1}`
 * makes it programmatically focusable without joining the normal Tab order). To pin the id, pass
 * `contentId` to `AppShell` — an `id` set here alone moves the element but not the link.
 *
 * **Container queries, not viewport breakpoints.** Carries `@container/app-shell-content`
 * (Tailwind v4 native `@container`) — the sidebar's expand/collapse changes THIS region's actual
 * width independent of the viewport, so a `sm:`/`lg:` grid would misjudge available space right
 * after a collapse/expand toggle. Write `@sm/app-shell-content:grid-cols-2` (etc.) for any
 * stat-card/grid layout inside it, instead of viewport variants.
 *
 * **Scroll strategy: plain `overflow-y-auto`, not `ScrollArea` — a deliberate choice.** `ScrollArea`
 * was evaluated for this region and rejected: its `Viewport` is itself a second
 * `tabIndex={0}` scrollable landmark, nested inside `<main>` — that fights the skip link's own
 * focus target and adds a second scroll container browsers must apply native scroll-restoration/
 * anchoring semantics to. Plain `overflow-y-auto` keeps `<main>` a single simple scrollable
 * element with native browser back/forward scroll-restoration. Reach for `ScrollArea` yourself,
 * INSIDE `AppShellContent`'s children, only for a nested panel that specifically wants the custom
 * auto-hiding scrollbar treatment — not for the page's own scroll.
 *
 * **Bounded height is the consumer's job.** `AppShellContent` is `flex-1 min-h-0`, so it scrolls
 * internally WHEN its ancestor chain gives it a bounded height — the usage examples wrap
 * `AppShellHeader` + `AppShellContent` in a `flex h-svh flex-col` column for exactly this. Without
 * that bound, `overflow-y-auto` is simply inert and the whole page scrolls instead; both are
 * valid layouts, nothing here forces one over the other.
 *
 * **Don't pair with `SidebarInset`.** `SidebarInset` (`sidebar.tsx`) also renders a `<main>` —
 * composing it alongside `AppShellContent` would produce a SECOND main landmark. For the `inset`
 * panel look inside `AppShell`, pass `variant="inset"` to `AppShellContent` itself instead: it
 * paints exactly what upstream's `SidebarInset` paints under that variant — `m-2 ms-0 rounded-xl
 * shadow-sm` from `md` up, no border — applied directly via this prop rather than through
 * `SidebarInset`'s `peer-data-[variant=inset]` selector, which requires being a DIRECT sibling of
 * `Sidebar`'s element and is incompatible with also keeping `AppShellHeader` a true sibling
 * banner. The one thing the prop form cannot reproduce is upstream's
 * `peer-data-[state=collapsed]:ms-2` nudge, which is a sibling selector by construction.
 * Reach for `SidebarInset` only when composing `Sidebar` standalone, outside `AppShell`.
 *
 * @example
 * <AppShellContent variant="inset">
 *   <div className="grid grid-cols-1 gap-4 p-4 @sm/app-shell-content:grid-cols-2 @lg/app-shell-content:grid-cols-4">
 *     …stat cards…
 *   </div>
 * </AppShellContent>
 */
export function AppShellContent({
  className,
  variant = "sidebar",
  landmark = "main",
  ...props
}: AppShellContentProps) {
  const Element = landmark === "main" ? "main" : "div";
  // The id comes from the enclosing `AppShell`, which is the only place that also knows what the
  // skip link points at. A raw `id` in `{...props}` still wins — it is spread after — but it
  // rewires nothing, which is why `AppShell`'s `contentId` is the supported override.
  const contentId = React.useContext(AppShellContentIdContext);
  return (
    <Element
      // The skip-link target moves with the region either way; `tabIndex={-1}` keeps it
      // programmatically focusable without joining the Tab order.
      id={contentId}
      tabIndex={-1}
      role={landmark === "region" ? "region" : undefined}
      data-slot="app-shell-content"
      data-variant={variant}
      className={cn(
        "@container/app-shell-content relative flex min-h-0 outline-none min-w-0 flex-1 flex-col overflow-y-auto bg-background",
        variant === "inset" && "md:m-2 md:ms-0 md:rounded-xl md:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The page container: centred, padded by the page gutter (`--page-gutter`: 16px, 24px from
 * 640px, 32px from 1024px, 48px from 1920px — the header's own padding) on every side, with `gap-6` between the
 * page's direct children (the PageHeader, then each section). `size` picks the measure:
 * `prose` (45rem — 720px — of content) for forms and settings, `default` (`max-w-7xl`, 1280px)
 * for lists, dashboards and record pages, `full` (no max) for boards and canvases that use the
 * whole content region.
 */
export const appShellPageVariants = cva(
  `mx-auto flex w-full min-w-0 flex-1 flex-col gap-6 p-(--page-gutter) ${pageGutterClasses}`,
  {
    variants: {
      size: {
        prose: "max-w-[calc(45rem+2*var(--page-gutter))]",
        default: "max-w-7xl",
        // A bounded page (a board, a canvas) fills the height the content region gives it.
        full: "min-h-0",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** Props accepted by `AppShellPage`. */
export interface AppShellPageProps
  extends
    React.ComponentProps<"div">,
    Omit<VariantProps<typeof appShellPageVariants>, "size"> {
  /**
   * The page's width — `prose` (720px of content, centred) for forms and settings, `default`
   * (1280px, centred) for lists, dashboards and record pages, `full` (edge to edge, fills the
   * height) for boards and canvases. `narrow` is the deprecated old name of `prose` — it renders
   * `prose` and reports `data-size="prose"`; it goes in the next minor.
   * @default 'default'
   */
  size?: PageWidth | "narrow";
}

/**
 * `AppShellPage` — the one page container inside `AppShellContent`: a centred column with the
 * page gutter on every side and a `gap-6` rhythm between its children, capped at the width `size`
 * picks. Put the `PageHeader` and the page's sections inside it, and nothing else decides a
 * page's width or gutters — no `max-w-*`, `mx-auto` or padding class on it or on a wrapper
 * (`vegastack-design doctor` reports one). Pick the width per route from one map with
 * `definePageWidths` (`@/lib/page-layout`), so a page and its loading skeleton cannot drift.
 *
 * It renders a plain `<div>` — `AppShellContent` is already the `main` landmark — and never
 * scrolls sideways: `min-w-0` lets a long unbroken child shrink inside the column.
 *
 * @example
 * <AppShellContent>
 *   <AppShellPage size="prose">
 *     <PageHeader title="Profile" />
 *     <ProfileForm />
 *   </AppShellPage>
 * </AppShellContent>
 */
export function AppShellPage({
  size = "default",
  className,
  ...props
}: AppShellPageProps) {
  const width: PageWidth = size === "narrow" ? "prose" : (size ?? "default");
  return (
    <div
      data-slot="app-shell-page"
      data-size={width}
      className={cn(appShellPageVariants({ size: width }), className)}
      {...props}
    />
  );
}

/** Props accepted by `AppShellSection`. */
export interface AppShellSectionProps extends React.ComponentProps<"section"> {
  /**
   * The section's measure inside the page. `prose` caps it at 720px (45rem) — a settings tab
   * under a 1280px page header. `default` caps it at the content width of a `default` page
   * (1280px less the gutters), so a list inside a `full` frame — a folder in a frame that also
   * hosts documents and grids — lines up with every other list. `full` takes the page's whole
   * width.
   * @default 'full'
   */
  measure?: "prose" | "default" | "full";
  /**
   * Where a narrower measure sits in the page: `start` under the header's start edge, or
   * `center` in the middle of the page. Ignored at `full`.
   * @default 'center' for `default`, 'start' for `prose`
   */
  align?: "start" | "center";
}

/**
 * `AppShellSection` — one region of an `AppShellPage` with its own measure. Width follows the
 * content, not the route: a `full` page can hold a list at `measure="default"`, a document in
 * `DocumentLayout` and a grid at full width, and a `default` page can hold a settings column at
 * `measure="prose"` — with no `max-w-*` class of its own.
 *
 * @example
 * <AppShellPage size="full">
 *   <AppShellSection measure="default">
 *     <PageHeader title="Contracts" />
 *     <DataList … />
 *   </AppShellSection>
 * </AppShellPage>
 *
 * @example
 * <AppShellPage>
 *   <PageHeader title="Product" tabs={tabs} />
 *   <AppShellSection measure="prose" align="center">
 *     <SettingsSection title="General">…</SettingsSection>
 *   </AppShellSection>
 * </AppShellPage>
 */
export function AppShellSection({
  measure = "full",
  align,
  className,
  ...props
}: AppShellSectionProps) {
  const placed = align ?? (measure === "default" ? "center" : "start");
  return (
    <section
      data-slot="app-shell-section"
      data-measure={measure}
      data-align={placed}
      className={cn(
        "flex w-full min-w-0 flex-col gap-6",
        measure === "prose" && "max-w-[45rem]",
        measure === "default" && "max-w-[calc(80rem-2*var(--page-gutter))]",
        measure !== "full" && placed === "center" && "mx-auto",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Nav-row widths for `AppShellSkeleton`, cycled by index — the same 50–90% band upstream's
 * `SidebarMenuSkeleton` draws from, without its per-mount `Math.random()`.
 */
const NAV_ROW_WIDTHS = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-3/5"] as const;

/** Props accepted by `AppShellSkeleton`. */
export interface AppShellSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * Number of nav-row placeholders in the sidebar column.
   * @default 5
   */
  navItemCount?: number;
  /**
   * Number of stat-card placeholders in the content region.
   * @default 4
   */
  statCardCount?: number;
}

/**
 * `AppShellSkeleton` — a full-shell loading composition: a sidebar column (logo circle + N
 * nav-row placeholders), a header line, and a content region (a stat-card row plus one tall
 * placeholder below it). Decorative (`aria-hidden`) and `aria-busy`, matching `Skeleton`'s own
 * convention.
 *
 * **Deterministic and server-safe.** The nav rows draw the same shape as upstream's
 * `SidebarMenuSkeleton` but take their widths from a fixed cycle, by index. Upstream's row picks a
 * random width in `useState`, so a server render and the client's hydration draw different widths
 * and React reports a hydration mismatch in every `loading.tsx` that used this composition (review
 * round 2, 2026-09-23). With no hooks and no randomness it renders identically on server and
 * client, and a Server Component such as a Next.js `loading.tsx` renders it directly.
 *
 * @example
 * // app/(dashboard)/loading.tsx — a Server Component, no 'use client' needed.
 * export default function Loading() {
 *   return <AppShellSkeleton navItemCount={6} statCardCount={4} />;
 * }
 */
export function AppShellSkeleton({
  className,
  navItemCount = 5,
  statCardCount = 4,
  ...props
}: AppShellSkeletonProps) {
  return (
    <div
      data-slot="app-shell-skeleton"
      role="presentation"
      aria-hidden="true"
      aria-busy="true"
      className={cn("flex min-h-svh w-full", pageGutterClasses, className)}
      {...props}
    >
      {/* hidden md:flex mirrors the real shell: below the mobile breakpoint (SidebarProvider's
          default 768px = Tailwind `md`) the rail collapses into an off-screen Sheet, so the
          skeleton must not paint a sidebar column the loaded shell won't have. `w-64` is
          upstream's `SIDEBAR_WIDTH` (16rem) spelled as a utility — this column used to be `w-60`,
          left behind when Batch 1 of the shadcn reset deleted the `--sidebar-width` token, so the
          rail jumped a whole rem the moment the real shell replaced the placeholder. */}
      <div className="hidden h-svh w-64 shrink-0 flex-col gap-2 border-e border-border bg-sidebar p-2 md:flex">
        <div className="flex items-center gap-2 p-2">
          <Skeleton className="rounded-full size-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          {Array.from({ length: Math.max(0, navItemCount) }, (_, i) => (
            <div
              key={i}
              data-slot="app-shell-skeleton-nav-row"
              className="flex h-8 items-center gap-2 rounded-md px-2"
            >
              <Skeleton
                className={cn("h-4", NAV_ROW_WIDTHS[i % NAV_ROW_WIDTHS.length])}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-svh min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-(--page-gutter)">
          <Skeleton className="rounded-full size-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        {/* The same gutter as `AppShellPage`, so the loaded page does not jump. */}
        <div className="@container/app-shell-content flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-(--page-gutter)">
          <div
            data-slot="app-shell-skeleton-stats"
            className="grid grid-cols-1 gap-4 @sm/app-shell-content:grid-cols-2 @lg/app-shell-content:grid-cols-4"
          >
            {Array.from({ length: Math.max(0, statCardCount) }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64 flex-1" />
        </div>
      </div>
    </div>
  );
}
