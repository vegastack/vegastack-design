// @vegastack app-shell@0.23.16 sha256-CHkHPtTVO+Uge6+if7qYzrK0/Ca4N2JNgQs3tc5AVSQ=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

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
  className,
  children,
  ...props
}: AppShellProps) {
  const generatedId = React.useId();
  const resolvedContentId = contentId ?? generatedId;
  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={onOpenChange}
      keyboardShortcut={keyboardShortcut}
      data-slot="app-shell"
      className={className}
      {...props}
    >
      <a
        href={`#${resolvedContentId}`}
        data-slot="app-shell-skip-link"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-xs focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        {skipLinkLabel}
      </a>
      <AppShellContentIdContext.Provider value={resolvedContentId}>
        {children}
      </AppShellContentIdContext.Provider>
    </SidebarProvider>
  );
}

/** Props accepted by `AppShellSidebar`. */
export interface AppShellSidebarProps extends React.ComponentProps<
  typeof Sidebar
> {}

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
  children,
  ...props
}: AppShellSidebarProps) {
  return (
    <Sidebar {...props}>
      <nav
        data-slot="app-shell-sidebar"
        aria-label={ariaLabel}
        className="flex h-full min-h-0 w-full flex-col"
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
 * @example
 * <AppShellHeader actions={<Button size="sm">New agent</Button>}>
 *   <Breadcrumb>
 *     <BreadcrumbList>…</BreadcrumbList>
 *   </Breadcrumb>
 * </AppShellHeader>
 */
export function AppShellHeader({
  className,
  actions,
  children,
  ...props
}: AppShellHeaderProps) {
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        "flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4",
        className,
      )}
      {...props}
    >
      <SidebarTrigger />
      <div
        data-slot="app-shell-header-middle"
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        {children}
      </div>
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
 * The page container's measure: `narrow` (`max-w-3xl`, 768px) for forms and settings, `default`
 * (`max-w-7xl`, 1280px) for lists and dashboards, `full` (no max) for boards and split views that
 * use the whole content region. The gutters are the page-rhythm recipe on the stock scale —
 * `px-4 py-6`, `md:px-8 md:py-8` — and `gap-6` separates the page's direct children (the
 * PageHeader, then each section).
 */
export const appShellPageVariants = cva(
  "mx-auto flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-8 md:py-8",
  {
    variants: {
      size: {
        narrow: "max-w-3xl",
        default: "max-w-7xl",
        // A bounded page (a board, a split view) fills the height the content region gives it.
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
    VariantProps<typeof appShellPageVariants> {
  /**
   * The page's measure — `narrow` (768px) for forms and settings, `default` (1280px) for lists
   * and dashboards, `full` (no max width, fills the height) for boards and split views.
   * @default 'default'
   */
  size?: "narrow" | "default" | "full";
}

/**
 * `AppShellPage` — the one page container inside `AppShellContent`: a centred column with the
 * system's page gutters and a `gap-6` rhythm between its children, capped at the measure `size`
 * picks. Put the `PageHeader` and the page's sections inside it, and nothing else decides a
 * page's width or gutters.
 *
 * It renders a plain `<div>` — `AppShellContent` is already the `main` landmark — and never
 * scrolls sideways: `min-w-0` lets a long unbroken child shrink inside the column.
 *
 * @example
 * <AppShellContent>
 *   <AppShellPage size="narrow">
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
  return (
    <div
      data-slot="app-shell-page"
      data-size={size}
      className={cn(appShellPageVariants({ size }), className)}
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
      className={cn("flex min-h-svh w-full", className)}
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
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <Skeleton className="rounded-full size-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        {/* The same gutters as `AppShellPage`, so the loaded page does not jump. */}
        <div className="@container/app-shell-content flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
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
