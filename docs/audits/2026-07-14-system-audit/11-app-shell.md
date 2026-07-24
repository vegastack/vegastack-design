# App-Shell (Sidebar + Header + Content) — Design Research — 2026-07-14

Scope: read-only research for a reusable **DASHBOARD APP-SHELL** shared by all downstream VegaStack
apps. Files read in full: `packages/ui/registry/ui/sidebar.tsx` (430 lines), `page-header.tsx` (232),
`skeleton.tsx` (130), `breadcrumb.tsx` (201), `scroll-area.tsx` (126), `sheet.tsx` (270),
`truncated-text.tsx` (256). Plus targeted greps across the other 61 registry components, `docs/requirements.md`,
`docs/plans/detail/04-registry-and-cloudflare.md`, `apps/docs/components.json`, and live fetches of
`ui.shadcn.com` (sidebar docs, `registry-item.json` schema, `dashboard-01.json`). **No source file was
modified.**

---

## (a) Existing-assets inventory

### `sidebar.tsx` — what's already there vs. missing

**Present (verified by full read):**

| Capability                                                                                                                                                                                                               | Evidence                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `SidebarProvider` owns expanded/collapsed state, controlled (`open`/`onOpenChange`) or uncontrolled (`defaultOpen`)                                                                                                      | `sidebar.tsx:68-130`                                                                                                                        |
| CSS-var-driven widths — `--sidebar-width` (15rem), `--sidebar-width-icon` (3rem)                                                                                                                                         | `sidebar.tsx:13-15,116-122` — routes through a var + arbitrary-value class, matching the inline-style contract (`docs/requirements.md:214`) |
| Keyboard shortcut, Cmd/Ctrl+B, customizable key or disable                                                                                                                                                               | `sidebar.tsx:92-103` (`keyboardShortcut` prop)                                                                                              |
| `Sidebar` is a `<nav>` landmark, exposes `data-state`/`data-collapsible`/`data-side`                                                                                                                                     | `sidebar.tsx:148-167`                                                                                                                       |
| Compound parts: `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarMenuBadge`, `SidebarSeparator`, `SidebarTrigger` | `sidebar.tsx:175-430`                                                                                                                       |
| `SidebarMenuButton` supports Base UI `render` composition (for router `<a>`) and `isActive` → `aria-current="page"`                                                                                                      | `sidebar.tsx:338-359`                                                                                                                       |
| Label truncation on collapse is CSS-only (`[&>span:last-child]:truncate`) and the label is hidden entirely (not just clipped) when collapsed                                                                             | `sidebar.tsx:301`                                                                                                                           |

**Missing (confirmed absent — file is 430 lines, no other exports; zero hits for `mobile`/`isMobile`/`Sheet`/`breakpoint` in `sidebar.tsx` or `sidebar.test.tsx`):**

- **No mobile behavior at all.** No `useIsMobile` hook, no breakpoint, no `Sheet` import. The rail is a static `<nav>` regardless of viewport — on a phone it either eats the whole screen or has to be hidden by the consumer with ad-hoc CSS. This is the single biggest gap vs. shadcn's sidebar, which swaps to a `Sheet` drawer under `md` (768px).
- **No cookie/localStorage persistence** of the open/collapsed state across reloads (shadcn's `SidebarProvider` writes a cookie so SSR can render the correct initial state without a flash).
- **No `collapsible` modes.** Only one behavior exists (shrink to `--sidebar-width-icon`). shadcn ships `offcanvas` (slides fully off-screen), `icon` (what we have), and `none` (never collapses) as a per-`Sidebar` prop.
- **No `SidebarRail`** (the thin edge strip that's both a resize handle and a click-to-toggle target).
- **No `SidebarInset`** (the main-content wrapper variant that insets/rounds when the sidebar floats).
- **No `SidebarMenuSkeleton`** — nothing to show while nav items are loading (relevant since the owner explicitly wants per-region skeletons).
- **No `SidebarMenuAction`, `SidebarMenuSub(Button/Item)`, `SidebarGroupAction`, `SidebarGroupContent`** — the compound vocabulary stops one level shallower than shadcn's ~15-part system.
- **No `variant` prop** (`sidebar` / `floating` / `inset`) — only the default docked style exists.

### Other building blocks

- **`page-header.tsx`** — fully presentational (`title`, `description`, `breadcrumb` slot, `backHref`/`onBack`, `actions`, `secondaryMenu`, `favorite`). Good flex discipline on the title block (`min-w-0` at `page-header.tsx:179`, `actions` row is `shrink-0` at `:220`). **Gap:** the root renders a bare `<div data-slot="page-header">` (`:174`), not a semantic `<header>` — no `banner` landmark today. **Gap:** the `<h1>` title truncates with a hardcoded `truncate` class (`:205`) instead of the system's own `TruncatedText`, so a long title clips silently with no tooltip reveal — inconsistent with the component the system already built for exactly this problem.
- **`skeleton.tsx`** — solid foundation: `shape` variants (`line`/`circle`/`rect`/`card`, `skeleton.tsx:17-26`), `count` for stacked multi-line placeholders with a shortened last line (`:106-129`), and a `motion-reduce:animate-none` guard already applied (`:14`). Server-safe (no hooks). This is enough primitive to compose every shell-region skeleton without new primitives.
- **`breadcrumb.tsx`** — `<nav aria-label="breadcrumb">` landmark (`:36`), full compound API (`List`/`Item`/`Link`/`Page`/`Separator`/`Ellipsis`). **Gap:** `BreadcrumbList` uses `flex-wrap` (`:54-57`) — on a narrow header it wraps to multiple lines rather than collapsing. `Breadcrumb.Ellipsis` exists but is purely decorative (`:161-176`, `aria-hidden`, no click handler) — there's no logic anywhere that measures available width and swaps overflow segments for the ellipsis automatically. Long breadcrumb trails on mobile will wrap, not truncate.
- **`scroll-area.tsx`** — Base UI wrapper, `vertical`/`horizontal`/`both` orientation, auto-hiding custom scrollbar, keyboard-focusable viewport (`tabIndex={0}`, `:108`). Ready to use for the sidebar-content and main-content scroll regions.
- **`sheet.tsx`** — Base UI `Dialog`-based slide-in panel, `side: top|right|bottom|left` (`:39-60`), focus-trapped + scroll-locked (per its own docstring), close button with `aria-label` (`:124`). **This is the exact primitive the mobile sidebar needs and doesn't yet use** — `sidebar.tsx` never imports it.
- **`truncated-text.tsx`** — the dynamic-truncation primitive the owner is asking for shell-wide: `TruncatedText` (ResizeObserver-driven overflow detection, Tooltip appears **only when actually clipped**, no hardcoded character counts — `:68-121`); `IconText` (icon + truncating label + fixed trailing slot, exactly the shape of a sidebar nav row or breadcrumb item — `:176-207`, not currently used by `SidebarMenuButton`); `TableCellText` (width-constrained cell truncation, `mono` option for IDs, width passed as a CSS var not a literal — `:242-256`, matching the inline-style contract).

### Truncation/flex-discipline grep across the other 61 components

- **Hardcoded `truncate` outside `truncated-text.tsx`** (no ResizeObserver, no tooltip reveal): `country-select.tsx:312,316,349`, `filter-bar.tsx:222`, `page-header.tsx:205`, `sidebar.tsx:301`, `state-select.tsx:1552`. These are fine for combobox option rows (rarely need a tooltip) but `page-header.tsx`'s `<h1>` and `sidebar.tsx`'s nav label are exactly the two places the owner's "no hardcoded truncation" requirement bites — page titles and sidebar labels are unbounded user/tenant content.
- **`min-w-0` usage**: present in 16 files (`alert`, `bubble`, `field-inline`, `filter-bar`, `input`, `marker`, `message-scroller`, `message`, `page-header`, `settings-row`, `sidebar`, `state-select`, `textarea`, `text-edit`, `toggle-group`, `truncated-text`). **Absent** in `table.tsx`, `data-list.tsx`, `card.tsx`, `tabs.tsx`, `command.tsx`, `dropdown-menu.tsx`, `select.tsx` — zero hits. `Table`/`TableCell`/`TableHead` use `whitespace-nowrap` with no truncation at all (`table.tsx`); the table's own overflow strategy is a horizontal-scroll container (`data-slot="table-container"`, `overflow-x-auto`), not clipping — truncation inside a cell only happens if the consumer explicitly wraps the cell content in `TableCellText`. `Card` has no `min-w-0` anywhere in its header/title parts, so a `Card.Title` inside a flex row with a fixed-width sibling (e.g. a stat-card's trailing badge) will **not** shrink/truncate unless the consumer adds `min-w-0` manually — a footgun for the stat-card layout this shell needs.

---

## (b) shadcn blocks mechanics (2026)

Verified live against `ui.shadcn.com` (docs fetch + the actual `dashboard-01.json` registry item).

- **Registry item `type`** is a discriminated union (`registry-item.json` schema): `registry:block` = "complex components with multiple files"; `registry:component` = "simple components"; `registry:ui` = single-file primitives; `registry:page` = page/file-based routes (its `files[].target` field is **required**, since it must land at a specific app route); `registry:file` = misc file, also requires `target`; `registry:lib`/`registry:hook`/`registry:theme`/`registry:style`/`registry:item`/`registry:base`/`registry:font` round out the set.
- **Multi-file blocks**: each entry in `files[]` carries `path` (source in the registry), `type`, and optional `target` (destination in the consumer's project; supports `@ui/`, `@components/`, `@lib/`, `@hooks/` placeholders). Files without an explicit `target` resolve into the consumer's configured `components` dir; files that _need_ a fixed location (a page, a data fixture) declare `target` explicitly.
- **`dashboard-01.json`** (fetched directly): top-level `"type": "registry:block"`, `"name": "dashboard-01"`. File list:

  | path                                        | type                 | target                    |
  | ------------------------------------------- | -------------------- | ------------------------- |
  | `blocks/dashboard-01/page.tsx`              | `registry:page`      | `app/dashboard/page.tsx`  |
  | `blocks/dashboard-01/data.json`             | `registry:file`      | `app/dashboard/data.json` |
  | `.../components/app-sidebar.tsx`            | `registry:component` | —                         |
  | `.../components/chart-area-interactive.tsx` | `registry:component` | —                         |
  | `.../components/data-table.tsx`             | `registry:component` | —                         |
  | `.../components/nav-documents.tsx`          | `registry:component` | —                         |
  | `.../components/nav-main.tsx`               | `registry:component` | —                         |
  | `.../components/nav-secondary.tsx`          | `registry:component` | —                         |
  | `.../components/nav-user.tsx`               | `registry:component` | —                         |
  | `.../components/section-cards.tsx`          | `registry:component` | —                         |
  | `.../components/site-header.tsx`            | `registry:component` | —                         |

  `registryDependencies`: `sidebar, breadcrumb, separator, label, chart, card, select, tabs, table, toggle-group, badge, button, checkbox, dropdown-menu, drawer, input, avatar, sheet, sonner`. `dependencies`: `@dnd-kit/*`, `@tabler/icons-react`, `@tanstack/react-table`, `zod`.

- **Consumer pull**: `npx shadcn add dashboard-01` (or our equivalent, `shadcn add @vegastack/<name>`) resolves the block, installs its `registryDependencies` first (transitively pulling `sidebar`, `chart`, `card`, etc. as normal `registry:component`/`registry:ui` items), then writes every `files[]` entry to its `target` (or the default components path). It is **copied**, not referenced — the block becomes local, editable, app-owned code from that point on.
- **Sidebar block catalog (`sidebar-01`…`sidebar-16`)**: demonstrates the _variants_ the primitive supports — static, collapsible-sections, icon-collapsed (`sidebar-07`), floating (`sidebar-04`), inset (`sidebar-08`, `sidebar-16`), right-side (`sidebar-14`), dual left+right (`sidebar-15`), popover-triggered (`sidebar-10`, `sidebar-13`), nested-collapsible (`sidebar-09`), file-tree (`sidebar-11`), calendar (`sidebar-12`). These are all thin compositions over one `SidebarProvider`/`Sidebar` component — the variety lives in how `app-sidebar.tsx` is authored, not in the primitive itself.
- **Mobile**: shadcn's `SidebarProvider` renders the desktop `<Sidebar>` under `md:` and a `Sheet`-based drawer below it, gated by a `useIsMobile()` hook (matchMedia against the mobile breakpoint), with a separate `--sidebar-width-mobile` CSS var for the drawer's width. Confirmed present in shadcn's docs; **confirmed absent** in ours (§a).

Sources: [shadcn/ui sidebar docs](https://ui.shadcn.com/docs/components/sidebar), [registry-item.json schema](https://ui.shadcn.com/docs/registry/registry-item-json), [dashboard-01 view](https://ui.shadcn.com/view/new-york-v4/dashboard-01), [blocks catalog](https://ui.shadcn.com/blocks).

---

## (c) Recommended architecture: component primitive + a block (option "both")

**Recommendation: (c) — a hash-tracked `AppShell` component primitive in `packages/ui`, plus a `registry:block` that composes it into a sample AI-platform dashboard page.** Not (a) alone, not (b) alone.

**Why not a block alone (a):** A block is copy-once starter code — the moment `shadcn add` runs, it's the consumer's file, and our integrity-hash update mechanism (`docs/RELEASING.md`, `check-updates`/`shadcn add --diff --overwrite`) stops applying to it. The one thing the owner explicitly asked for — "shipped as a reusable thing so ALL downstream VegaStack apps share the same layout" — is precisely the thing that must **not** fork per app: the collapse/expand behavior, the mobile breakpoint, the focus management, the landmark structure, the keyboard shortcut. If that logic only exists inside a block, every app forks it on day one, and a future fix (e.g. "the mobile Sheet breakpoint is wrong") has to be hand-applied N times across N apps instead of pulled once via `check-updates`.

**Why not a primitive alone (b):** A composable `AppShell`/`AppShellHeader`/`AppShellSidebar`/`AppShellContent` set is necessary but not sufficient — it proves the pieces fit together but gives a new downstream app nothing to start from. Every team would independently reinvent the same nav-item list, the same stat-card row, the same "how do I wire `SidebarProvider` + `PageHeader` + a route" boilerplate. shadcn itself doesn't ship `dashboard-01` as documentation prose — it ships it as pullable starter code precisely because the primitive alone leaves a blank-page problem.

**Why both, mirroring shadcn's own relationship between `sidebar` (component) and `dashboard-01` (block):** the primitive owns the cross-app-consistent mechanics (hash-tracked, pulled/updated forever); the block owns the app-specific starting point (nav items, stat cards, page route) that is _expected_ to diverge and is never meant to be re-pulled after the initial `shadcn add`.

### File manifest sketch

**Primitive — extend existing canonical `packages/ui/registry/ui/sidebar.tsx`** (single-source-of-truth rule: edit canonical, run `registry:build`) to close the gaps in §(a):

- `useIsMobile()` hook (matchMedia, SSR-safe via `useEffect`, default breakpoint 768px to match Tailwind's `md`).
- Mobile-mode render path: under the breakpoint, `Sidebar`'s children render inside `Sheet`/`SheetContent side="left"` (already-built primitive, §a) instead of the static `<nav>`; `SidebarTrigger` opens it.
- `SidebarRail`, `SidebarInset`, `SidebarMenuSkeleton`, `collapsible` prop (`offcanvas | icon | none`), optional cookie persistence for `open`.

**New canonical `packages/ui/registry/ui/app-shell.tsx`** — the three-part composition layer sitting above `Sidebar`/`PageHeader`/`ScrollArea`:

- `AppShell` — root; wraps `SidebarProvider`, renders the flex row, owns the skip-to-content link.
- `AppShellSidebar` — thin, opinionated wrapper around `Sidebar` (fixes `aria-label`, wires the shell's nav-item shape).
- `AppShellHeader` — renders a real `<header>` (`banner` landmark, fixing the gap in `page-header.tsx:174`); composes `SidebarTrigger` + responsive `Breadcrumb`/`PageHeader` + `actions` slot; handles the mobile collapse (hide breadcrumb, show trigger only).
- `AppShellContent` — renders `<main id="main-content">`, wraps children in `ScrollArea`, is the skip-link's target.
- `AppShellSkeleton` (or documented composition guidance) — region-shaped `Skeleton` stacks for header/sidebar/content, for use in Next `loading.tsx`.

**New `registry:block`** (e.g. `apps/docs` registry entry `ai-platform-dashboard`, modeled 1:1 on `dashboard-01`'s shape): `page.tsx` (`registry:page`, target `app/(dashboard)/page.tsx`) composing `AppShell*` + the sample content; `nav-main.tsx`, `nav-user.tsx` (`registry:component`, no target); `stat-cards.tsx`, `recent-activity-table.tsx`, `dashboard-chart.tsx` (`registry:component`, no target). `registryDependencies`: `app-shell, sidebar, page-header, breadcrumb, card, table, data-list, empty-state, skeleton, badge, avatar, dropdown-menu`.

Our registry tooling **already supports `registry:block`** — the 14-value discriminated union (including `block`/`page`/`file` with `target` resolution) is documented at `docs/plans/detail/04-registry-and-cloudflare.md:29`, so this is additive scope, not new plumbing. Note: no `AppShell`/dashboard block exists yet in the component inventory (`docs/requirements.md` §12's 64-component table has no such row) — this would be a net-new addition to that table, worth flagging to the owner rather than silently assumed.

---

## (d) Responsive, truncation, a11y, skeleton specs

### Responsive strategy

- **Sidebar → Sheet on mobile**: not implemented today (§a) — build per shadcn's pattern: `useIsMobile()` + conditional render into `Sheet`/`SheetContent side="left"`, using our own already-built `sheet.tsx` (focus-trapped, scroll-locked, `Escape`-to-close for free via Base UI `Dialog`).
- **Container queries over viewport breakpoints for shell _regions_**: confirmed **zero** `@container`/`container-type` usage anywhere in the repo today (`grep -rl "@container|container-type"` = no hits) — responsive behavior is 100% viewport-breakpoint-driven currently. Tailwind v4 ships `@container` and `@min-*`/`@max-*` variants natively (no plugin). Recommend `AppShellContent` sets `@container` and stat-card/chart grids use `grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4` instead of `sm:`/`lg:` viewport variants — this matters specifically _because_ the sidebar's expand/collapse changes the content area's actual width independent of the viewport width; a viewport-breakpoint grid will misjudge available space right after a collapse/expand toggle, a container-query grid won't.
- **Header collapse pattern**: on mobile, `AppShellHeader` hides the breadcrumb trail (or collapses to "‹ Back" + current page only) and shows just the `SidebarTrigger` + title; the title continues to truncate via `TruncatedText` (once wired in, replacing the hardcoded `truncate` at `page-header.tsx:205`).
- **Safe-area insets**: no `env(safe-area-inset-*)` usage anywhere today. Recommend routing it the same way the inline-style contract already mandates for runtime sizing (`docs/requirements.md:214` — CSS var + arbitrary-value class, e.g. `pb-[env(safe-area-inset-bottom)]` is a function call, not a literal, so it's compatible with the existing hex/px ban) on the mobile `SheetContent` and the header's top edge.
- **Touch targets (44px)**: `SidebarTrigger` is `size-7` (28px, `sidebar.tsx:422`) — under 44px. WCAG 2.1 AA itself doesn't mandate 44px (that's 2.5.5 Target Size, AAA in 2.1 / "Enhanced" at 24px minimum in 2.2), but the owner explicitly asked for 44px as a product requirement layered on top. Recommend a touch-target pass on shell interactive controls specifically in the mobile/coarse-pointer context (`SidebarTrigger`, `SidebarMenuButton` in icon mode, breadcrumb links) rather than globally resizing the desktop-density controls.
- **Responsive tables**: `Table`'s existing strategy is a horizontal-scroll container (`table.tsx`, `overflow-x-auto`), not reflow/collapse. Acceptable as-is for the sample "recent activity" `DataList` in v1 (reuses an existing, tested pattern); a card-list fallback under a container-query threshold is a reasonable future enhancement, not required for the shell's first cut.
- **Chart responsiveness**: **no `Chart` primitive exists in the registry yet** (confirmed — only `lucide-react` chart _icons_ under `registry/ui/icons/chart-*.tsx`, no chart-rendering component). shadcn's own `dashboard-01` depends on a `chart` registry item (a Recharts wrapper) that we don't have an equivalent of. This is a real gap for the sample page's "usage over time" card — flagged explicitly in §(e) rather than assumed away.

### Dynamic truncation (no hardcoded character counts)

Apply `TruncatedText`/`IconText`/`TableCellText` (already built, §a) shell-wide instead of the ad-hoc `truncate` class:

| Shell region                     | Current state                                                                                                                                        | Recommendation                                                                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sidebar nav labels               | CSS `truncate`, no tooltip (`sidebar.tsx:301`)                                                                                                       | Swap `SidebarMenuButton`'s label `<span>` for `IconText`'s label pattern (or compose `TruncatedText` directly) so a clipped label reveals its full text via `Tooltip` — the exact shape `IconText` was already built for |
| Breadcrumb trail                 | `flex-wrap` (`breadcrumb.tsx:54-57`), decorative `Ellipsis` with no measurement logic                                                                | Needs new logic: measure available width, collapse middle segments into the existing `Breadcrumb.Ellipsis`, expose the collapsed segments via a small menu (Ellipsis is presentation-only today per its own docstring)   |
| Page title (`PageHeader` `<h1>`) | hardcoded `truncate` (`page-header.tsx:205`)                                                                                                         | Swap for `TruncatedText` so an overlong title (e.g. a long tenant/workspace name) gets a tooltip instead of silent clipping                                                                                              |
| Table/DataList cells             | `whitespace-nowrap`, no clipping — relies on consumer wrapping cells in `TableCellText` (confirmed: `table.tsx`/`data-list.tsx` have zero `min-w-0`) | Already correct pattern — just requires the sample page's `recent-activity-table.tsx` to actually use `TableCellText` per column, not raw strings                                                                        |
| Card titles (stat cards)         | `card.tsx` has no `min-w-0` anywhere                                                                                                                 | Stat-card layout must add `min-w-0` on the flex row wrapping the label + trailing badge, or the badge will force overflow instead of letting the label truncate                                                          |

### A11y

- **Landmarks**: `Sidebar` is already `<nav>` (good). `PageHeader`/`AppShellHeader` should render `<header>` (currently a bare `<div>`, `page-header.tsx:174` — gap). `AppShellContent` needs a `<main>` (doesn't exist anywhere in the registry today — new).
- **Skip-to-content link**: not present anywhere in the registry — add as the first focusable element in `AppShell`, `sr-only focus:not-sr-only` pattern, targeting `#main-content` on `AppShellContent`'s `<main>`.
- **Focus management on collapse**: verified non-issue — `SidebarTrigger`'s `onClick` only flips context state (`sidebar.tsx:408-430`); the DOM stays mounted, so focus never gets orphaned on desktop collapse/expand. On mobile, opening the `Sheet` auto-focuses inside the popup via Base UI `Dialog`'s built-in focus trap (verified pattern in `05-a11y-states.md`'s architecture notes) — no extra work needed.
- **Focus management on route change**: nothing router-aware exists in the layout layer (correct — `AppShell` shouldn't know about the router). Document as the _downstream app's_ responsibility: move focus to the page `<h1>` (`PageHeader`'s title, given a `tabIndex={-1}`) on pathname change, a standard SPA a11y pattern; flag the hook point rather than build it into a router-agnostic primitive.
- **`aria-current` for nav**: already correct — `SidebarMenuButton`'s `isActive` sets `aria-current="page"` (`sidebar.tsx:354`), verified.
- **Keyboard shortcut**: already correct — Cmd/Ctrl+B, customizable/disableable (`sidebar.tsx:92-103`), verified.
- **Reduced motion for collapse animation**: no local guard on the sidebar's `transition-[width]` (`sidebar.tsx:157`), but per the existing a11y audit (`05-a11y-states.md`, architecture fact #3) there's a global `!important` `prefers-reduced-motion` block in `packages/tokens/src/base.css:59-68` that covers **all CSS transitions/animations** system-wide — so this is already handled globally, not a shell-specific gap. Same applies to the `Sheet` backdrop/slide transitions.

### Skeleton strategy

- **Foundation is solid**: `Skeleton`'s `shape`/`count` API (§a) is sufficient to compose every shell-region skeleton with zero new primitives, and it's already `motion-reduce`-safe and server-safe.
- **Missing piece**: `SidebarMenuSkeleton` (shadcn has one; ours doesn't) — add to the extended `sidebar.tsx`, composing `Skeleton shape="circle"` (icon) + a `Skeleton` line at a randomized-but-stable width per row (shadcn seeds this with `useMemo` so skeleton rows don't look uniformly identical).
- **Region-composed skeleton for the whole shell** (`AppShellSkeleton` or documented composition): header skeleton (breadcrumb-dot + title-width line + action-rect placeholders), sidebar skeleton (logo circle + N `SidebarMenuSkeleton` rows), content skeleton (4× `shape="card"` for the stat-card row + one tall `shape="rect"` for the chart + the table's _own_ `loading` state).
- **`DataList` already has a built-in loading state** — confirmed `loading`/`loadingRows` props wired to render `Skeleton` rows (`data-list.tsx`). The sample page's recent-activity table gets a correctly-shaped loading state for free; no new skeleton needed there.
- **Next App Router `loading.tsx` pattern**: each downstream route should ship a colocated `loading.tsx` rendering the matching region skeleton. `Skeleton` is server-safe (no hooks, no `'use client'` per its own docstring) so this composes cleanly as a server component, and Suspense-driven streaming/navigation shows the correct shape automatically.

---

## (e) Sample-page content proposal — AI-platform dashboard

Composed entirely from existing (or newly-extended) primitives except where flagged.

1. **`AppShellHeader`**: `Breadcrumb` (Home › Dashboard) + `PageHeader` (`title="Dashboard"`, `description="Overview of your workspace"`, `actions={<Button>New agent</Button>}`).
2. **Stat-card row** (`@container` grid, `grid-cols-1 @sm:grid-cols-2 @lg:grid-cols-4 gap-4`): four `Card`s — "Active agents", "Tasks completed today", "API calls (24h)", "Avg. response time" — each: label (`text-label-sm text-muted-foreground`), value (`font-mono text-2xl`, per numeric-value convention), a delta `Badge` (`ArrowUp`/`ArrowDown` + semantic `success`/`destructive` token). Requires `min-w-0` on the label+badge flex row (gap noted in §d).
3. **Chart card**: "Usage over time" — **flagged gap**: no `Chart` primitive exists in the registry yet (§d). v1 options: (i) ship a static/placeholder responsive block reserving the space, deferring the real chart to a future `chart` registry component (mirroring shadcn's own `chart` dependency for `dashboard-01`); (ii) treat charting as out-of-scope for this shell audit and hand off as a separate build item. Recommend (i) so the sample page's layout is complete and the chart slot is a drop-in replacement later.
4. **Recent activity**: `DataList` — columns: task/agent name (`IconText`, icon + truncating name), status (`StatusIcon`, already exists in registry), started (`RelativeTime`, already exists in registry), duration (`TableCellText` with `mono`). States: `loading` (uses `DataList`'s built-in skeleton rows), `emptyState` (`EmptyState` — "No activity yet" + a CTA), populated (normal rows).
5. **Full-page empty state**: if the workspace has zero agents/tasks at all, the block's `page.tsx` should conditionally render a full-page `EmptyState` instead of the stat-card row — a standard SaaS zero-state pattern, left as the block's (app-specific) responsibility, not the `AppShell` primitive's.

---

## Summary (10 lines)

`sidebar.tsx` already provides a solid desktop-only expand/collapse primitive (provider, CSS-var widths, Cmd/Ctrl+B shortcut, `aria-current` nav) but has **zero mobile behavior** — no `Sheet` integration, no breakpoint hook, no cookie persistence, no `SidebarRail`/`SidebarInset`/`SidebarMenuSkeleton`/collapsible modes. `page-header.tsx` and `breadcrumb.tsx` are presentational but lack real landmark elements (`<header>`) and dynamic overflow collapsing. `sheet.tsx`, `scroll-area.tsx`, and `truncated-text.tsx` are exactly the primitives needed to close these gaps and already exist, unused by the shell. shadcn ships dashboards as a `registry:block` (`dashboard-01`, verified via its live JSON) that composes a stable `sidebar` **component** plus app-specific nav/chart/table files targeted straight into `app/dashboard/page.tsx` — our own registry tooling already supports `registry:block`/`registry:page` with `target` resolution, so this is additive, not new plumbing. **Recommendation: build both** — extend `sidebar.tsx` + add a new canonical `app-shell.tsx` (hash-tracked, pulled/updated across every downstream app) as the source of shared-layout truth, then ship a `registry:block` starter dashboard on top of it, mirroring shadcn's own `sidebar` ↔ `dashboard-01` split. Responsive strategy should move shell regions from viewport breakpoints to Tailwind v4's native `@container` queries (repo-wide, zero current usage) since sidebar collapse changes content width independent of the viewport. Truncation should route sidebar labels, breadcrumbs, and page titles through the already-built `TruncatedText`/`IconText` (currently unused by any of them) instead of the hardcoded `truncate` classes found at `sidebar.tsx:301` and `page-header.tsx:205`. The one real content gap for the proposed AI-platform sample page is that **no `Chart` component exists in the registry yet** — flagged as an explicit follow-up, not assumed away.
