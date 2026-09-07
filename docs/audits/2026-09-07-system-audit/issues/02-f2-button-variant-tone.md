---
title: "F2 · Button `variant × tone`, size vocabulary `xs·sm·md·lg`, IconButton everywhere"
labels: [audit-2026-09, components, foundation]
---

## Context

Audit 2026-09-07. Depends on **F1** (hover/pressed recipe, `--alpha-*`). Decisions: D2 (variant
deletion conditional on tone), D7 (disabled keeps pointer events, tooltips allowed), D16 (delete
`glass`), B1-04 (retire `shadow-lit`/`finish`, decided 2026-09-07). The full matrix and the
per-usage migration table are in `03-proposals.md` §P2.

## Problem

- `button.tsx` ships 15 variants; seven (`success`, `warning`, `info`, `glass`, …) have zero
  consumers and encode colour into the variant name (`02-batch-01` B1-03). MK's requirement: a
  success button must still be expressible → `tone`.
- Size vocabulary says `default` where tokens say `md`: 31 cva size maps use `default`, 10 call
  sites (`04-cross-cutting.md`); `icon` sizes are named separately.
- 18 hand-rolled `<button>` icon controls in 11 files (alert, announcement-banner, attachment,
  data-grid ×2, data-list ×5, filter-bar, onboarding-checklist ×2, pagination ×2, password-input,
  tag-group ×2, dialog close) and 48 `rounded-full` overrides in 22 files re-implement `IconButton`
  (B3-05, B4-07, B6-05, B7-06, B8-08).
- Loading shifts width (B1-08); disabled uses `pointer-events-none` so it cannot carry a tooltip
  (B1-09); SplitButton hard-codes a size map keyed on Button sizes (B8-10).

## Do

1. `buttonVariants`: `variant: solid | soft | outline | ghost | link | cta` × `tone: neutral |
destructive | success | warning | info`; `size: xs | sm | md | lg` and `icon-xs | icon-sm |
icon-md | icon-lg` (or `IconButton size` mirrors). Solid uses `fillInteractive`, the rest
   `surfaceInteractive` (F1). Delete `glass`, `finish`, `shadow-lit`.
2. Migrate every consumer per the P2 table (`03-proposals.md`), including docs previews and the
   dashboard block. `variant="default"` → `solid`, `secondary` → `soft`, `destructive` →
   `solid tone=destructive`, etc.
3. Rename `default` → `md` in all 31 cva size maps across the registry (Badge, Input, Select,
   Avatar, Card, Item, Empty, Kbd, …) and at the 10 call sites; keep a `size="default"` TypeScript
   deprecation alias for one release if cheap, otherwise a clean rename (no breaking-change
   concern, MK).
4. `IconButton` gets `shape: square | round`; replace the 18 hand-rolled icon buttons and the 48
   `rounded-full` overrides; the close/dismiss controls in Dialog, Sheet, Alert, Banner, Onboarding,
   Tag, FilterChip, PasswordInput become `IconButton variant="ghost" size="xs|sm"`.
5. Loading: reserve width (`min-w` from the measured label, or overlay spinner over the label with
   `invisible`); disabled: `aria-disabled` styling without `pointer-events-none`, so a Tooltip can
   explain why (D7) — apply uniformly (Button, IconButton, Toggle, Tabs).
6. SplitButton: chevron half is `IconButton` of the same `size` with `rounded-s-none`; delete the
   size map; loading half is `aria-disabled`.
7. Doctrine: `design.md` §Button rewritten (matrix, `cta` the only marketing variant, no glass, no
   lit); §Sizes vocabulary `xs·sm·md·lg`. Changelog `⚠️` entry for the renames.

## Acceptance

- `grep -rn 'size="default"\|default:' packages/ui/registry/ui/*.tsx` shows no size key named
  `default`; `grep -rn "<button\b"` in registry components only inside Base UI `render` defaults
  and the react-day-picker day button; `rounded-full` only on avatars/dots/progress.
- Button page previews show the full `variant × tone × size` matrix in both themes; the state
  probe shows hover and pressed steps on every variant.
- `pnpm gates:component button icon-button split-button`, `pnpm gates:push`, registry build
  idempotent, `design:derived:check` clean.

## Out of scope

Chip primitive (T2), selected-chip recipe (N1), media round controls beyond `shape` (M1).
