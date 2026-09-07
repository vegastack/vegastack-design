---
title: "Mk1 · Marketing leaves, hooks and the dashboard block: media-query hook, promotion colour, KPI labels, logo row"
labels: [audit-2026-09, components, hooks]
---

## Context

Audit 2026-09-07, `02-batch-09-marketing-hooks-icons.md` B9-03…B9-07, B9-09…B9-12. Decisions: D29
(single-series chart in foreground ink), D30 (next-themes sanctioned — AGENTS.md edit lands in
**D1**). Depends on F1 (`surface-*`, `--chart-single`), F2 (Button variants in the block), T1
(the block's DataList), M2 (`motion-dock`).

## Problem

- `usePrefersReducedMotion` is defined in `animated-number.tsx`, `message-scroller.tsx`,
  `particle-field.tsx`; `use-mobile.ts` and `use-platform.ts` are two more `matchMedia`
  subscriptions; `mergeRefs` lives in `use-animation-replay.ts` while nine files hand-merge refs.
  `useIsMobile` starts `false`, so SSR renders the desktop layout on a phone until the effect runs.
- `pricing-section.tsx` highlighted plan uses `border-info` + `Badge intent="info"`;
  `dashboard-01/page.tsx` empty state `EmptyMedia intent="info"`.
- Block: `stat-cards.tsx:80` truncates every KPI label at the 2-column width (measured
  "Active agen…", "Tasks compl…"); the 320px header wraps the breadcrumb; the single-series chart
  is `chart-1` blue.
- `logo-row.tsx`: logos are underlined `text-lg` links; `-ml-px border-l` physical (RTL seams
  break); `wallColumns` fixed 2|3|4 with no responsive fallback.
- `particle-field.tsx` reads `--brand` once at mount → dark toggle keeps the light brand until
  remount. `staggered-text-reveal.tsx` animates off-screen. `testimonial.tsx` hard-codes curly
  quotes; `settings-row.tsx` hard-codes `<h3>`; `shortcut-overlay.tsx` `max-w-lg` + `100dvh` magic
  - boxed filter input.
- `use-file-drop` has no unit test; `use-platform` (4) and `use-mobile` (5) are thin; pricing
  (3 tests, 1 preview), ruled-band (3, 1), particle-field (1 preview).

## Do

1. `use-media-query.ts` (registry hook) on `useSyncExternalStore` with `serverFallback`;
   `usePrefersReducedMotion`, `useIsMobile` become one-liners over it; `usePlatform` uses it for
   the touch query. `mergeRefs` moves to `@vegastack/design` and replaces the nine inline merges.
2. PlanCard highlighted → `surface-3` + alpha `primary` border + neutral/primary badge; block
   empty state neutral `EmptyMedia`.
3. Block: KPI label `line-clamp-2` with the trend badge on the value row; `BreadcrumbTrail
maxItems={2}` in the header; chart series on `--chart-single`.
4. LogoRow: marks in `muted-foreground` → `foreground` on hover, no underline; logical
   `-ms-px border-s`; `grid-cols-[repeat(auto-fill,minmax(…))]` wall.
5. ParticleField reads `getComputedStyle(canvas).color` per frame; StaggeredTextReveal gains
   `whenVisible` (default on, IntersectionObserver); Testimonial uses `<q>`/CSS `quotes`;
   `SettingsSection` title `render`/`as`; ShortcutOverlay `DialogContent size="md"`,
   `--layout-overlay-max-height`, `panelSearch` input (O1).
6. Tests: `use-file-drop` unit suite (paste path, `accept`, directory traversal, `maxSize`);
   `use-platform`/`use-mobile` cases; previews per B9-12.
7. Doctrine: `design.md` §Charts (single series = ink), §Marketing leaves (promotion colour).

## Acceptance

- `grep -rn "function usePrefersReducedMotion\|typeof ref === \"function\"" packages/ui/registry/ui`
  → 0.
- 1280 and 320 captures of `dashboard01Demo` show full KPI labels and a one-line header.
- Theme toggle test: ParticleField pixel colour changes without remount.
- `pnpm gates:component` for every touched item; block contract lane green.
