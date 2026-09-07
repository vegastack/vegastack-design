---
title: "N1 · Navigation and layout: selected-chip recipe, tab hover inset, sidebar persist prop, scroll-region focus"
labels: [audit-2026-09, components, navigation, a11y]
---

## Context

Audit 2026-09-07, `02-batch-06-navigation-layout.md` B6-02…B6-11, `07-state-probe.md` SP-02
(tabs), SP-03 (clipped rings on scroll viewports), SP-06 (active rows). Depends on F1 (sidebar
aliases, `surface-3`, `--layout-*` tokens) and F2 (`IconButton`). Decisions: D20 (**keep all three
Tabs variants**; fix the hover wash touching the rail and every similar micro-defect), D21 (neutral
filled star), D22 (sidebar cookie stays behind a `persist` prop, **on by default**, can be turned
off).

## Problem

- `tabs.tsx:84,220-226` pill/chip and `segmented.tsx:30-61` are the same raised-chip formula;
  `toggle.tsx:22` pressed adds a fourth selected look (`bg-foreground/10`).
- Underline tabs: the trigger hover wash ends exactly on the `tabs-list` bottom border; vertical
  tabs on the left rail (`captures/_states/tabs/p0-0__hover.png`, `p1-0__hover.png`).
- `sidebar.tsx:140-143` writes `document.cookie` unconditionally.
- `breadcrumb.tsx:149-151` `BreadcrumbPage` is `<span role="link" aria-disabled>`.
- `sidebar.tsx:785-790` and `page-header.tsx:236-247` hand-roll icon buttons; `page-header.tsx:229,243`
  `-ml-2` physical margins.
- `scroll-area.tsx:115` viewport always `tabIndex=0`; its focus ring (and MessageScroller's,
  Board's, the sidebar rail's) is clipped by the `overflow-hidden` root (19 hits).
- axe `landmark-no-duplicate-main` on every shell/sidebar fixture (preview `<main>` inside the
  docs `<main>`); `app-shell.tsx:194` `h-14`, `sidebar.tsx:292` `18rem` inline.
- `page-header.tsx:151` warning-yellow star; `tabs.tsx:271`, `breadcrumb.tsx:297` restate the
  focus outline; `sidebar-menu-button[data-active]` has no hover step (rest = hover).

## Do

1. `selectedChipVariants` (shared recipe: muted track → `surface-2`, raised chip → `surface-3`
   with alpha hairline) used by Tabs `pill` and `chip`, Segmented, Toggle pressed, ToggleGroup
   pressed. Keep Tabs `line | pill | chip`.
2. Tabs `line`: the trigger's hover wash is an inner pill inset 4px from the indicator rail
   (`mb-1` gap or a `::before` wash with `inset-y-1`), rounded; vertical variant mirrors on the
   inline-start rail. Add the geometry to the tabs contract fixture.
3. Sidebar `persist: boolean` (default `true`) around the cookie write; document the cookie name
   and how to turn it off; `onOpenChange` unchanged.
4. `BreadcrumbPage` → `<span aria-current="page">`.
5. `SidebarTrigger` and the page-header back link → `IconButton` (`render={<a/>}`); logical
   margins.
6. ScrollArea viewport focusable only when scrollable (share `useOverflow`), inset ring
   (`focus-visible:-outline-offset-2`); same for MessageScroller viewport, Board column viewports,
   `sidebar-rail`.
7. Shell previews render `AppShellContent`/`SidebarInset` with `render={<div role="region"/>}`
   (or the preview frame sandboxes them) so the docs page keeps one `<main>`; add the
   `landmark` escape to the components' API.
8. `--layout-header-height`, `--sidebar-width-mobile` (F1) replace the literals; neutral star
   (`fill-current text-foreground`); delete restated focus utilities; active row = `surface-3`,
   hover = `surface-2`.
9. Docs/tests per B6-11 (navigation-menu keyboard/RTL/mobile fixtures, segmented sizes/disabled/
   icon fixture + dark capture, toggle previews; rename "SSR persistence" section).
10. Doctrine: `design.md` §Selection (one raised-chip recipe), §Hover geometry (from F1) cited in
    §Tabs.

## Acceptance

- `probe-states.mjs --routes tabs,segmented,toggle,toggle-group,sidebar,scroll-area,
message-scroller,board,breadcrumb,page-header` → 0 `hover-touches-border`, 0 `focus-clipped`,
  0 `active-same-as-hover`.
- axe: no `landmark-no-duplicate-main` on app-shell/sidebar routes; no `role="link"` on
  BreadcrumbPage.
- `pnpm gates:component` for every touched component; cross-engine smoke for sidebar/tabs.
