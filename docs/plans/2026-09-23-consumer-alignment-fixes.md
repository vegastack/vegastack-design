# Plan: Consumer-alignment fixes found while rebuilding Regent on the design system

**Status:** approved by MK 23-09-2026: "approve the upstream plan and all briefs, add the pager".
**Origin:** the Regent web app realignment (consumer epic `vegastack/engg-clients-regent-ai-platform-web-app-v2#79`). A full audit of that app against ui 0.12.2 / design 0.7.0 surfaced the gaps below. Every item is either a doc/code contradiction, a consumer need the system cannot express, or tooling that let the consumer drift silently.
**Owner decisions (MK, 23-09-2026, AskUserQuestion):** cards and overlays use a real border instead of the ring (reverses **BRD-1**); Regent list pages must never scroll horizontally; the upstream fixes land and ship before the consumer's foundation step.

## 1. Reverse BRD-1: surfaces get a real border, not a ring

BRD-1 took shadcn's `ring-1 ring-foreground/10` at the reset. `foundations/elevation.mdx:7,18,43` still says resting surfaces separate with `border-border`, so the docs and the code disagree, and consumers read the ring as an "unnecessary outline".

- New decision row **BRD-1 → ours**: "Cards and floating surfaces draw a 1px `border border-border`; no `ring-*` box-shadow outline." Regenerate `decisions.json` (`node tooling/upstream/verify-parity.mjs --sync-decisions`), update `exception-map.json`.
- Patches (swap `ring-1 ring-foreground/10` → `border border-border`, nothing else): `card`, `dialog`, `alert-dialog`, `popover`, `hover-card`, `select`, `dropdown-menu` (content + sub-content), `context-menu`, `menubar` (content + sub-content), `combobox`, `navigation-menu` (×2), `settings-row`. Check `card`'s `overflow-hidden` + image-edge rounding still renders concentric corners with a border instead of an outset ring.
- **Not changed:** `avatar` `ring-2 ring-background` (the stacking separator in avatar groups — a deliberate gap, not an outline).
- `design-lint`: new rule `no-surface-ring` rejecting `ring-1 ring-foreground/…` so the next upstream pull cannot bring it back (the same pattern as `no-focus-ring-glow`).
- Docs: `foundations/elevation.mdx` gains the rule and the reason; the migration guide's ring note is updated.

## 2. DataList: never force horizontal scroll

DataGrid already ships "responsive column revelation" (`minWidth` + `mobile: "visible" | "hidden" | "merge"`, `data-grid.tsx:186-200, 468-545`). DataList (the recommended list component) has none, so a wide list on a laptop scrolls sideways.

- Move the column posture into the shared `DataTableColumnLayout` (`data-table-parts.tsx:43`) and implement it in DataList with the **same prop names and defaults** as DataGrid (`minWidth` default 120, `mobile` default `"merge"`, hidden count reported). DataGrid keeps its behaviour, now reading the shared type.
- Tests: DataList at a narrow container merges overflow into the primary cell; `hidden` is counted; `visible` never hides; no `scrollWidth > clientWidth` on the table container.
- Docs: data-list page gets a "Fitting the width" section.
- **Pager (approved 23-09-2026):** a new registry item `data-list-pager` — composes `pagination` + a page-size `Select` + a "1–15 of 40" range summary (`tabular-nums`), controlled (`page`, `pageSize`, `total`, `onPageChange`, `onPageSizeChange`, `pageSizes` default `[15, 30, 50]`), hides page controls when there is one page, and slots into DataList's `footer`. Source of truth for behaviour: the Regent consumer's `src/components/ui/list-pager.tsx` and its browser test. Goes through the `component` skill (upstream does not ship it → ours, new decision row).

## 3. Accessibility fixes

- Destructive menu items use the fill colour as text on a 10% tint (3.99:1, below AA by our own `foundations/colors` measure): `dropdown-menu.tsx:109`, `context-menu.tsx:118`, `menubar.tsx:106` → `text-destructive-text`. Same for `questionnaire.tsx:209`, `attachment.tsx:58` (contradicts A11Y-13 in its own file at :128).
- Physical direction classes under a shipped DirectionProvider: `page-header.tsx:282` (`ml-auto`), `filter-bar.tsx:346,355` (`ml-auto`), `date-picker.tsx:236` (`border-r`, `max-sm:border-r-0`), `sidebar.tsx:294` (`-right-4`, `left-0`) → `ms-auto`, `border-e`, `-end-4`, `start-0`.
- `terminal.tsx:144` `text-brand` → `text-brand-text`.

## 4. Tooling that let the consumer drift silently

- `tooling/design-lint.mjs:86` defaults to `packages/ui/src` (now only `index.ts` + provider), so a bare run reports "clean" without linting any component → default to `packages/ui/registry`. Rewrite the stale header comment (`:8-24`).
- The `important` rule misses Tailwind's `!` suffix (`tooltip.tsx:65`, `command.tsx:43/76/93`, `sidebar.tsx:480/491`, `menubar.tsx:106`, `badge.tsx:11`, `data-table-parts.tsx:337/387`, `button-group.tsx:18/20`, `media-player-controls.tsx:1176`) → extend the regex; allowlist upstream-verbatim cases with their decision ID, or reword `base.css`'s "sole `!important`" claim.
- **`vegastack-design doctor` gains a retired-vocabulary scan** of the consumer's source: `text-h[1-4]`, `text-label*`, `text-mono-label`, `text-strong`, `text-display-*`, `*-subtle`, `--alpha-*`, `--opacity-*`, `--z-*`, `shadow-overlay`, `backdrop-blur-glass`, retired component imports (`icon-button`, `segmented`, `password-input`, `progress-indicator`, `field-inline`, `floating-surface`, `section-header`, `sonner`). These compile to nothing, so today a consumer's headings silently shrink to body text (Regent had 338 such classes and every check passed). Exit non-zero with file:line.

## 5. Docs and skills that contradict the source

- Toast stacking: `foundations/elevation.mdx:35-40`, `guides/migrating-shadcn-reset.mdx:72,1173` still say there is no `z-60` band; `toast.tsx:56-60` has one since 0.12.0.
- `guides/provider-setup.mdx:69` `<Button size="md">` does not compile → `size="icon"`.
- Migration guide recommends classes the linter rejects: `text-[11px]`, `text-[2rem]/9`, `tracking-tight|tighter|wider`, "uppercase is no longer mono-exclusive" → ramp sizes, no tracking, no uppercase. Its `text-h1 → text-2xl` mapping contradicts typography's page heading `text-3xl` → one mapping.
- Font loading: typography says the `geist` npm package; quickstart/theming say `next/font/google` → state one path (recommend `next/font/google`, which the docs site itself uses for Newsreader).
- Editing copied components: `guides/components.mdx` says edit freely, the migration guide says never, the audit skill calls it high severity → one rule: "don't edit; if you must, it becomes yours and `check-updates` reports drift".
- `foundations/spacing.mdx` "never one-off px" vs 60 arbitrary values in the registry and the audit skill accepting them → "prefer a scale step; arbitrary values only for optical fixes".
- Stale comments: `packages/design/preset.css:16` (`shadow-overlay`, Tailwind 4.3.1), quickstart `:47` and `theming.mdx:36` ("focus rings"), quickstart's duplicate `antialiased`.
- `vegastack-design-system` skill: Don't list gains "no arbitrary text sizes", and the retired-vocabulary list above with its replacements.

## Out of scope

- Any other component redesign; new components beyond item 2's pager (if approved).
- Consumer changes — they happen in the Regent repo after this ships.

## Gates and release

`pnpm verify` (lint incl. new rules, typecheck, tests, registry parity, upstream check, VRT for the ring→border change), changesets: `@vegastack/ui` **minor** (new DataList props, new `data-list-pager`; visual border change), `@vegastack/design` **patch** (doctor scan, skills), `@vegastack/design-tokens` none. Shipping is MK's `ship it`.
