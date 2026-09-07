# 01 — System pass (running document)

Audits the shared layer so per-component findings share one ruler. Companion files:
`01-class-histogram.md` (every utility value in use), `01-deps.md` (dependency currency and unused
modern features — produced by the research pass), `00-register.md` (inventory and graph).

Decisions locked in the 2026-09-07 interview that this pass applies: flat + one overlay shadow; motion
subtle/functional; light and dark equal; Vercel/Linear/Raycast as the bar; `design.md` is on trial.

## S-01 · Token layer

- **Three names, one value** — `secondary`, `muted`, `accent` resolve identically in both themes
  (`theme.css`). The doctrine's five-rung surface ladder collapses to four in practice. Detail and
  options: `02-batch-01-form-leaves.md` B1-02 / Doubt D1.
- **`card` is darker than the page in light** (`card` 0.985 vs `background` 0.994; `popover` = page).
  So a Card on the canvas reads as a faint grey slab, while a Popover reads white. Geist/Linear cards are
  the same white as the page, separated by border only. **Doubt S-D1:** set `card = background` (border
  does the work) or keep the grey step. Recommend `card = background`; dark keeps its lift (0.205 vs 0.175)
  because dark needs surface contrast where light has ink.
- **`shadow-lit` retired** (decision). Exactly one shadow role remains: `shadow-overlay`. Token, Button
  `finish`, docs section, and `design.md` §Elevation all change (B1-04).
- **`--radius: 0.75rem` is a dead root token** next to the role tokens; nothing should read it — verify
  in Phase 3 and delete.
- **Type roles are sound**; the drift is in _usage_ (form labels at 12px, B1-06). `text-2xl`/`text-3xl`
  appear only in Stat/PricingSection/ProgressIndicator; `text-xl` in four files — all reviewed in their
  batches for whether a display/heading role should replace them.
- **Spacing** — the histogram shows a healthy core (`gap-2` 105 uses, `px-3` 35, `p-4` 17) and a long
  tail of one-offs (`px-7`, `pt-16`, `pe-12`, `py-24`, `p-px`, `gap-px`). Each one-off is checked in its
  component's batch; Phase 3 decides the rule. Suspect list: `date-picker` `px-7`, `dialog` `pt-16`/`pe-10`,
  `sheet` `pe-12`, `empty` `py-8/12/16` ladder, `marketing-surface` `py-24`.

## S-02 · Global CSS (base.css, utilities.css, docs global.css)

- **Forced-colours focus gap on every text-entry control** — B1-01. Root fix is `outline-hidden`
  instead of `outline-none` plus a lint rule; the contract suite's focus check must become a real gate.
- **Duplication:** `apps/docs/app/global.css:131-150` restates base.css's `:focus-visible` and
  forced-colours rules. The docs app should import `@vegastack/design-tokens/base.css` and add nothing.
  (Docs-chrome pass will confirm what else is duplicated.)
- Reduced-motion reset is correct and complete (incl. view-transition pseudo tree).

## S-03 · API conventions (cross-component)

- **Size vocabulary** `default → md` (B1-05); IconButton is the only icon-only path.
- **`data-slot` everywhere** — consistent, good; keep as the styling hook contract.
- **`render` prop** — Base UI composition is respected across the batch; the lint rule guards it.
- **Client boundary** — 100 of 117 items are `'use client'`; only 17 are server-safe (Card, Label,
  Textarea, Kbd, Separator, Skeleton …). Correct given Base UI, but each presentational wrapper is
  re-checked in its batch for an unnecessary boundary.

## S-04 · Lint and gate gaps surfaced so far

| gap                                   | rule to add                                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `outline-none` on text-entry controls | ban; require `outline-hidden`                                                                          |
| forced-colours focus                  | contract assertion under `forcedColors: "active"` that `outline-style !== none` on the focused element |
| one hover token                       | `hover:bg-muted` on interactive rows/items → `hover:bg-accent` (after D1)                              |
| size vocabulary                       | `size="default"` banned in registry source                                                             |

## S-05 · Dependencies

See `01-deps.md` when the research pass lands. Known from `pnpm outdated`: only patch bumps are
outstanding (Tailwind 4.3.3, @types/react, postcss, prettier, style-dictionary, sonner, react-virtual).

## S-06 · Docs chrome and tooling

Pending (Phase 1, after the component batches start): site shell, navigation, search, theme switch,
code blocks, preview frame, and fail-open paths in the gate scripts.
