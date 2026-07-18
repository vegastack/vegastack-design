# Plan: Remove purple system-wide → neutral `primary`

**Status:** ✅ executed 2026-07-03 — all phases done, all gates green (typecheck 10/10 · lint 10/10, contrast 52/52 AA · build 6/6, 172 pages · tests 689/689 · registry parity + headers OK). Local only; changeset + commit/publish pending user action.
**Owner decision (MK, 2026-07-03):** eliminate `purple` as a design-system accent. Started from a broken Slider (clipped thumb + "why is it purple"). Scope expanded on request: **"switch to primary for everything, no purple anywhere — be thorough."**

This **reverses a shipped `design.md` v2 decision** (the "two rationed chromatics: purple + blue" model → now "one chromatic accent = blue (info) + neutral `primary`"). It is not pre-made in `docs/requirements.md`, so it is an explicit, owner-approved spec change.

## Locked sub-decisions (AskUserQuestion, 2026-07-03)
1. **Subtle purple tints** (`purple-subtle`/`purple-text`) → **neutral** (`accent` / `accent-foreground`). AI bubbles + selected rows become neutral (accepted trade-off: they lose the color cue vs. hover).
2. **Named `purple` variants** (Button `variant="purple"`, Badge `color="purple"`) → **removed entirely** (breaking API; treat as a minor/major changeset).
3. **Data-viz** (`chart-1`, `sequential`) → **re-anchored to blue/indigo** (charts need a hue; neutral won't encode a series).

## Token mapping (the single source of the swap)
| Purple token (delete) | Usage replacement | Notes |
|---|---|---|
| `purple` | `primary` | solid active/value/selection fill |
| `purple-foreground` | `primary-foreground` | on-fill text |
| `purple-hover` | `primary-hover` | |
| `purple-active` | `primary-active` | |
| `purple-subtle` | `accent` | subtle tint bg |
| `purple-text` | `accent-foreground` | tint text; value-indicator arcs → `primary` |
| `chart-1 = {purple}` | re-anchor → indigo/blue (light + dark) | keep token, change value; must pass ≥3:1 chart gate + stay distinct from chart-2 teal / chart-3 cyan / chart-8 blue |
| primitive `color.purple.*` ramp | **keep** | only the color-picker swatch content needs it; see Phase 2 note |

## Phase 1 — Tokens (`packages/tokens`)
- `tokens/semantic.tokens.json` + `tokens/semantic.dark.tokens.json`: delete the 6 `purple*` entries; re-anchor `chart-1` to the chosen indigo/blue (both themes).
- `src/tokens.ts`: mirror the same deletions / chart-1 change (this file is the typed export; keep in sync).
- Decide `color-picker` swatch source (Phase 2) BEFORE deleting the `--purple` bridge, or the swatch `var(--color-purple)` breaks.
- Rebuild: `pnpm --filter @vegastack/tokens build` → regenerates `dist/theme.css` (`--purple`, `--color-purple`, `--purple-subtle`… disappear; `--chart-1` changes). Confirm the **contrast gate** still passes.

## Phase 2 — Canonical components (`packages/ui/registry/ui/*.tsx`, EDIT CANONICAL ONLY)
Solid fill → primary:
- **slider.tsx** — (a) **BUG FIX:** move the `Thumb` loop **out of** `<BaseSlider.Track>` (it's clipped by the track's `overflow-hidden` at `h-1.5`); make it a sibling inside `<BaseSlider.Control>` and add `relative` to Control. (b) `bg-purple`→`bg-primary` (indicator), `border-purple`→`border-primary` (thumb, keep 1px ring). Update JSDoc.
- **tabs.tsx** — active underline `bg-purple`→`bg-primary` + comments.
- **progress.tsx** — indicator `bg-purple`→`bg-primary`.
- **pagination.tsx** — active `bg-purple text-purple-foreground`→`bg-primary text-primary-foreground` (hover too).
- **date-picker.tsx** — `data-[selected-single|range-start|range-end]` `bg-purple text-purple-foreground hover:bg-purple`→primary set (3 lines) + comments.
- **progress-indicator.tsx** — radial arc `text-purple-text`→`text-primary`.

Subtle tint → neutral:
- **badge.tsx** — **remove** `color="purple"`: drop cva compound rows (subtle/solid/minimal), the `dot` map entry `purple: "bg-purple"`, and `"purple"` from the `color` type union.
- **alert.tsx** — **remove** the `purple` variant (`border-purple/20 bg-purple-subtle text-purple-text`) + its `Sparkles` icon mapping + type union.
- **filter-bar.tsx** — active chip `border-purple bg-purple-subtle text-purple-text`→`border-border bg-accent text-accent-foreground`; `text-purple-text`→`text-foreground` (2×); `hover:bg-purple/15`→`hover:bg-accent`. Verify active vs. inactive stays visually distinct.
- **data-list.tsx** — selected row `bg-purple-subtle hover:bg-purple-subtle data-selected:bg-purple-subtle`→`bg-accent …`.
- **bubble.tsx** — AI content `bg-purple-subtle`→`bg-accent` (accepted: AI surface goes neutral).
- **button.tsx** — **remove** the `purple` variant line + type union.
- **color-picker.tsx** — selected swatch `border-purple`→`border-primary`. The purple **swatch option** (`color: "var(--color-purple)"`) is content: back it with a **literal `oklch(0.53 0.189 295)`** so it survives token deletion (or drop the swatch — TBD, default = literal).
- **emoji-picker.tsx** — 💜 "purple heart": **leave** (unicode content).

## Phase 3 — Doc previews (`apps/docs/components/preview/*.tsx`) — compose only, don't restyle
Remove/repoint the showcases of deleted variants:
- **badge.tsx** (7 spots), **card.tsx**, **settings-row.tsx** — Badge `color="purple"` → drop or switch to `info`.
- **button.tsx** (2), **icon-button.tsx**, **split-button.tsx** — `variant="purple"` → drop or switch to `variant="default"` (primary). ("Ask AI" example loses its purple; keep as primary.)
- **alert.tsx** — `variant="purple"` example → remove or switch to `info`.

## Phase 4 — Docs prose + spec + memory
- `apps/docs/content/docs/foundations/{colors,theming,design-principles}.mdx` — rewrite the color-model prose (drop "purple = AI/key-action/selection"; state one chromatic = blue + neutral primary).
- Component MDX describing purple: `slider, progress, progress-indicator, alert, date-picker` (+ `changelog.mdx` entry, `utilities/shimmer.mdx` if it cites purple).
- `design.md` — rewrite the ~29 purple mentions (color budget §, component list line 368, data-viz §, dos/don'ts). This is the authoritative spec update.
- Memory `token-overhaul-status.md` — update "brand=purple" → "no purple; primary neutral does active/value/selection; blue = links/info + chart-1".

## Phase 5 — Rebuild + verify (all LOCAL; stop before publish/deploy)
1. `pnpm --filter @vegastack/tokens build` (theme.css) — contrast gate green.
2. `pnpm run registry:build` — regenerates every copy-in + `public/r/*.json` + re-stamps integrity (the change signal). Never hand-edit copies.
3. Typecheck / `pnpm build` (docs) — no broken `variant="purple"` / `color="purple"` refs, no dangling `--purple` var.
4. **VRT + `vitest-axe`** on touched components (slider, badge, alert, button, tabs, progress, pagination, date-picker, filter-bar, data-list, bubble, color-picker, progress-indicator) — update snapshots intentionally; confirm AA contrast for new neutral pairs (esp. `accent-foreground` on `accent`, primary fills).
5. Manual preview pass on `/docs/components/slider` — thumb renders as a full circle (bug fixed), fill is neutral `primary`.
6. `pnpm changeset` — bump `@vegastack/ui` (list all touched components; **flag removed `purple` variants as breaking**) + `@vegastack/tokens` (removed tokens + chart-1).

## Risks / call-outs
- **Breaking API:** removing `variant="purple"` / `color="purple"` breaks downstream consumers — changeset must say so.
- **AI-surface identity:** bubbles/agent surfaces go neutral (design.md §AI previously leaned on purple) — owner-accepted.
- **Chart re-anchor:** must keep 8 distinct, in-gamut, ≥3:1 hues; verify chart-1's new hue vs. teal/cyan/blue neighbours in both themes.
- **`color-picker` swatch / `--color-purple`:** delete the semantic token only after the swatch is switched to a literal, else the demo breaks.
- Single-source-of-truth: **edit canonical `packages/ui/registry/ui/` only, then `registry:build`** — do not touch `apps/docs/components/ui/*` by hand.

## Sequencing
Phase 2 (components, incl. slider bug) can land first as a **standalone slider PR** if you want the visible bug fixed immediately, with the token/spec/docs sweep following. Otherwise do 1→5 as one coherent change. Recommend: **one change** for consistency (a half-swept purple is worse than either end state).
