---
title: "F1 · Surface ladder tokens: hover/pressed steps, alpha borders, media + layout tokens"
labels: [audit-2026-09, tokens, foundation]
---

## Context

Audit 2026-09-07 (`docs/audits/2026-09-07-system-audit/`). This is the first foundation batch:
every later batch consumes these tokens. Decisions: D1 (study → ladder, `00-decisions.md`), D14
(alpha borders), D29 (single-series chart ink); the proposal with reference facts and the scenario
matrix is `03-proposals.md` §P1; reference research is `research-surface-palettes.md`.

## Problem (measured)

- `secondary`, `muted` and `accent` are the **same OKLCH value** in both themes; `card` (L 0.985)
  is darker than the page (0.994) in light, so a card on a page reads as a grey box and a
  `hover:bg-accent`/`hover:bg-muted` wash on a card is invisible. 33 hover sites in 22 files use
  those literals (`04-cross-cutting.md` §2); the state probe found 149 hover-invisible and **268
  pressed-same-as-hover** elements — only the solid primary Button has a pressed step
  (`07-state-probe.md` SP-01, SP-04, SP-06).
- The only real hover step in the system hides in `sidebar-accent` (0.955), a second palette that
  `design.md` claims is an alias (`02-batch-06` B6-01).
- Media chrome uses `primary`/`primary-foreground` and inverts in dark (`02-batch-04` B4-01: scrim
  measured oklab 0.92 in dark, icons near-black).
- Promotion/selection uses `info` in ComparisonMatrix, PlanCard and the block's empty state
  (B5-06, B9-04).
- Layout magic: `h-14` header, `18rem` sidebar fallback, 7× `max-h-[calc(100dvh-var(--spacing)*64)]`,
  fixed panel widths `w-56/w-72/w-80` (B6-08, B8-06, 04 §2).

## Do

1. **Tokens** (`packages/design-tokens/src/*`, DTCG → Style Dictionary, light and dark builds):
   - `surface-1` (page), `surface-2` (raised/hover wash), `surface-3` (pressed/selected chip);
     in light `card` = `surface-1` (page); in dark keep the current card step. Start values in
     `03-proposals.md` §P1 "Recommendation"; eye-tune in both themes with the capture harness.
   - `--alpha-hover`, `--alpha-pressed` for solid fills and inks (Button solid, destructive, etc.).
   - Alpha borders: `border` becomes `foreground/α` so hairlines survive on any surface (D14).
   - Keep `secondary`, `muted`, `accent`, `sidebar-*` as **aliases** of ladder steps (shadcn-shaped
     code keeps working); delete their independent values from the token source.
   - `--media-scrim`, `--media-scrim-strong`, `--media-foreground` — theme-invariant (black alpha /
     warm off-white).
   - `--layout-header-height`, `--sidebar-width-mobile`, `--layout-overlay-max-height`,
     `--panel-width-sm/md/lg`.
   - `--chart-single` = foreground ink (D29); `chart-1…8` unchanged for multi-series.
2. **One hover/pressed recipe** exported from `@vegastack/design` (class strings, not a component):
   `surfaceInteractive` = `hover:bg-surface-2 active:bg-surface-3` for washes; `fillInteractive` =
   `hover:bg-<tone>/(--alpha-hover) active:bg-<tone>/(--alpha-pressed)` for solids. Every control
   uses one of the two; no component writes its own `hover:bg-*` literal.
3. **Migrate** the 33 `hover:bg-accent|muted|secondary|sidebar-accent` sites and the sidebar
   tokens (`sidebar` = card, `sidebar-accent` = surface-2, active row = surface-3 so active+hover
   still moves — SP-06). Text-entry focus tint gets a forced-colours fallback
   (`@media (forced-colors: active) { outline: 2px solid }`) — B1-01.
4. **Doctrine**: `design.md` §Surfaces rewritten around the ladder; §Hover geometry added ("a hover
   wash is inset ≥4px from any container hairline and inherits the container's inner radius; a
   pressed step exists on every control"); `info` is for links/informational only. Run
   `pnpm design:sync`.
5. **Docs**: foundations page for colour updated (ColorPalette specimen shows the ladder + hover/
   pressed swatches in both themes).

## Acceptance

- `node docs/audits/2026-09-07-system-audit/probe-states.mjs --all` reports 0 `hover-invisible`
  on buttons/triggers/rows and 0 `active-same-as-hover` on buttons/toggles/triggers/tabs (light
  and `--dark`).
- `grep -rE "hover:bg-(accent|muted|secondary|sidebar-accent)\b" packages/ui/registry/ui` → 0.
- Dark-lane test asserts the video scrim's computed colour has L < 0.3 (M1 consumes the token; the
  token test lives here).
- `pnpm design:verify`, `pnpm registry:build && git status --porcelain` clean, `pnpm gates:push`.
- Contrast: every ladder step keeps AA for `foreground`/`muted-foreground` text in both themes
  (the token build's WCAG report).

## Out of scope

Button variants (F2), component-local geometry fixes that use the new tokens (N1, Fo1, T1).
