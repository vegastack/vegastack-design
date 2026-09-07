---
title: "Di1 · Display leaves: Progress indeterminate, Badge tiers, server-safe leaves, no restated reduced-motion"
labels: [audit-2026-09, components]
---

## Context

Audit 2026-09-07, `02-batch-02-display-leaves.md` B2-01…B2-11 and `04-cross-cutting.md` §2/§5.
Decisions: D8 (Badge `sm` becomes a real 16px tier; `minimal` stays: no background, no border,
coloured text with a leading dot icon by default, icon configurable), D9 (TruncatedText
`focusable` prop, off inside grids/lists). Depends on F2 (size vocabulary).

## Problem (see the batch file for `file:line`)

- B2-01: indeterminate `Progress` renders as 100% complete. B2-02: Badge carries two looks that
  are not badges and a `sm` that is not a size. B2-03: four presentational leaves are client
  components with no runtime reason; the cross-cutting scan found **12** files with `"use client"`
  and no hook/handler (avatar, button, collapsible, field, progress, resizable, scroll-area,
  separator, slider, switch, tabs, toggle) — a client module turns `buttonVariants` into a client
  reference for RSC importers.
- B2-04: every clipped cell is a tab stop. B2-05: `RelativeTime` renders empty until hydration.
- B2-06: `motion-reduce:` restated 17 times in 11 files while `base.css:82-90` already zeroes
  motion globally. B2-07: three kbd chips. B2-08: `StatusIcon` sizes bypass `--icon-*`. B2-09:
  Skeleton line radius. B2-10: `Kbd` defaults to mac glyphs.

## Do

1. `Progress`: indeterminate renders a sweeping segment (`animate-pulse`-class allowed) with
   `aria-valuenow` omitted; unit test asserts the fill is not 100%.
2. `Badge`: `size: sm (16px) | md | lg`, `variant: solid | soft | outline | minimal`, `minimal` =
   ink + leading dot (`icon` prop replaces the dot); remove the non-badge looks; migrate consumers
   (Board counts, block trend badges, PlanCard).
3. Remove `"use client"` from the 12 files after confirming no hook/handler (Base UI wrappers that
   pass callbacks keep it, with a comment); `verify-rsc-safety` gains the converse check in G1 —
   here just make the tree pass it.
4. `TruncatedText focusable` (default `true` standalone, `false` when inside `DataList`/`DataGrid`
   via context).
5. `RelativeTime`: server-render the absolute formatted date, hydrate to relative (no empty
   frame).
6. Delete all 17 `motion-reduce:` utilities (keep any that change _layout_, not duration — there
   are none by the scan). One kbd chip: `Kbd` used by `CommandShortcut` and `TooltipKbd`; `Kbd os`
   defaults from `usePlatform` at the caller (document) with `"other"` as the SSR default.
7. `StatusIcon` sizes → `--icon-*`; Skeleton line radius `rounded-sm` to match text.
8. Docs per B2-11. Doctrine: `design.md` §Badge tiers; §Motion "reduced motion is global, never
   restated".

## Acceptance

- `grep -rn "motion-reduce:" packages/ui/registry/ui` → 0; `"use client"` count ≤ 72 of 110.
- Progress indeterminate capture shows a partial fill; RelativeTime SSR HTML contains a date.
- Badge fixtures show `sm` at 16px height and `minimal` with dot in both themes.
- `pnpm gates:component progress badge truncated-text relative-time kbd status-icon skeleton`.
