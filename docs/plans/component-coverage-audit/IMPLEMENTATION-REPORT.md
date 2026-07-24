# Implementation Report — Component Coverage & Docs Restructure

**Date:** 2026-06-29 · **Branch:** `feat/local-build` · **Status:** implemented in working tree, **not committed** (awaiting your review/commit).
**Verification:** `apps/docs` typecheck ✅ · `next build` ✅ (172 static pages) · lint ✅ (design-lint + content-lint + provider-dogfood) · 2 visual smoke-checks ✅ · 0 console errors.

This executed the plan in [`README.md`](./README.md) (Parts A + B) using multi-agent orchestration: 2 background workflows (68-component pipeline + foundations) + 1 focused adversarial sweep, all Opus/high-effort, plus targeted manual edits.

---

## A. Restructure (done by hand — exact, low-risk)

- **`components/meta.json`**: flat 68-item list with one `---Communication---` divider → **10 grouped sections** (Buttons & Actions · Inputs & Controls · Overlays · Menus & Commands · Navigation · Layout & Structure · Data Display · Feedback & Status · Content & Typography · Chat & Communication). Your merges applied: Selection Controls + Pickers → **Inputs & Controls**; Disclosure → Data Display; **Menus & Commands kept separate** (your call). Zero URL changes (divider mechanism, no file moves).
- **`utilities/meta.json`**: removed the redundant `---Utilities---` divider.
- **`index.mdx` + `app/(home)/page.tsx`**: "64 components" → **68**; added Foundations (Icons/Motion), grouped-Components, and a Utilities section to the landing prose.

## B. Foundations (workflow `foundations-impl`)

- **6 real-token specimen components** built in `foundations.tsx` + registered in `mdx.tsx`, each reading live CSS vars (no hardcoded values): `RadiusScale`, `ShadowScale`, `SpacingScale`, `MotionSpecimen`, `TypeScaleSizes`, `FocusRingSpecimen`.
- **7 new pages**: `design-principles`, `spacing`, `radius`, `elevation`, `accessibility`, `theming`, `changelog`.
- **4 expanded**: `colors` (charts + sidebar groups), `typography` (numeric scale + font loading), `motion` (live specimen), `scroll-fade` (per-edge sized classes — P0 #9).
- Nav updated (`foundations/meta.json` + root `meta.json`). **Fix:** changelog was mis-routed (file in `foundations/` vs root nav entry) — moved to `content/docs/changelog.mdx` (top-level). Verified rendering at `/docs/changelog`.

## C. Component coverage (workflow `component-coverage-impl`)

- **68/68 components** processed via implement → adversarial review → repair. **59 passed review first time; 9 repaired.** Self-reported coverage **95–100%** per component.
- **~200 new preview exports** added (each component-prefixed, auto-flowing through the `export *` barrel), new `<ComponentPreview>` sections, new `<AutoTypeTable>`/`<TypeTable>` rows for previously-undocumented types/subcomponents, and the **"full matrix where useful"** grids (e.g. `empty-state` Size × surface, `badge` minimal × colors, `switch` size × on/off, `checkbox` size × state).
- Biggest jumps (were MAJOR): `copy-button`, `country-select`, `state-select`, `empty-state`, `truncated-text`, `color-picker`, `label`, `checkbox` — all now demonstrate their full API.

## D. Correctness (P0) — all verified against source

Fixed: `label` (no asterisk — removed 4 stale references) · `input`/`password-input`/`auto-save-input` ring claims · `alert` + `empty-state` `bg-X/10`→`bg-X-subtle` · `color-picker` "round swatch" · `toggle-group` "fills solid primary" comments · `accordion` `data-open`→`data-panel-open` · `scroll-fade` missing per-edge classes · `data-list` Anatomy `interactive?` · count 64→68. Token sweep confirmed clean repo-wide.

## E. Cross-cutting sweep — focus-ring a11y prose (dedicated adversarial agent)

- Discovered the real ground truth: a **global `:focus-visible { outline-2 outline-offset-1 outline-ring }`** rule (`base.css`/`global.css`) is the single source of truth; components either inherit it or opt out via `outline-none` and supply their own border/box-shadow ring.
- **Caught and reverted an over-correction**: the coverage agents had wrongly changed `button`/`split-button`/`copy-button` to claim "no ring" — they _do_ inherit the global ring. Fixed 10 pages total to describe each component's real treatment accurately; left the genuinely-correct ones untouched.

---

## Adversarial catches (multi-layer verification paid off)

1. **Focus-ring over-correction** on button-family — reverted (D/E above).
2. **`select` `multiple`** — the coverage agent _documented_ multi-select; per your "remove it," reverted entirely (removed `selectMultiple` preview + section + usage mention; restored the "use Checkboxes for multi-select" Do/Don't).
3. **Changelog mis-routing** — fixed.

## Open items / flags for you

1. **`sidebar` focus gap (design decision).** `SidebarMenuButton`/`SidebarTrigger` carry **no per-component `:focus-visible` style** — they're only visible via the _global_ outline-ring rule. A consumer who copies these into an app without that global stylesheet gets just the bare UA outline. I did **not** add a ring (it'd touch canonical + the locked "no rings"/global-rule model is your call). Docs now describe reality; decide whether sidebar rows warrant an explicit self-contained ring.
2. **`select` `multiple`** — I removed the _documentation_ of multi-select but left the `multiple` type param in canonical (removing it is an API change I won't make unprompted). If you meant remove the param itself, say so.
3. **Marginal skipped items** — a handful of inherently-unshowable or low-value items were intentionally left (e.g. `field` `invalid`-without-`error`; live-only behaviors shown via one labeled "live" example). None material.
4. **Missing foundation pages now added** — Radius/Elevation/Spacing/Theming/Accessibility/Design-Principles/Changelog/Type-scale are all in. (Earlier "fold in or separate?" → folded in, per your "add all the missing foundation".)

## Not done (by design)

- **No commit** — all changes are in the `feat/local-build` working tree (alongside pre-existing uncommitted work that predates this session). Review, then commit when ready.
- **No `registry:build`** — no canonical component was edited, so the registry copy-in/JSON/integrity are untouched.
- **Component unit/axe tests not re-run** — component canonicals were unchanged (only docs + previews); the docs build + design-lint + a11y-prose reconciliation cover the doc layer.

## Follow-ups resolved (post-review)

- **Consumer focus-ring guarantee (was: slider concern).** Verified the global `:focus-visible { outline-2 outline-offset-1 outline-ring }` ships in `@vegastack/tokens/base.css` and is bundled by `@vegastack/tailwind-preset/preset.css`. Slider (and switch/checkbox/radio/toggle) correctly carry **no** per-component ring — the locked "single source of truth" model. The real gap was `install.mdx` importing `theme.css` directly (omitting `base.css`). **Fixed `install.mdx`** to import the preset, with a WCAG 2.4.7 "don't skip the base layer" note. No component change.
- **Sidebar focus ring — left as-is (decision).** `SidebarMenuButton`/`SidebarTrigger` don't set `outline-none`, so they inherit the global ring like every peer. Adding a per-component ring would be inconsistent + reverse the locked decision. Docs already accurate.
- **`select` multi-select — kept as a documented feature (reversed the earlier removal).** Base UI's `Select.Root` supports `multiple` for free; rather than drop the capability, the `Multiple` generic + `multiple` prop stay in canonical `select.tsx`, and multi-select is now **documented + demonstrated**: a Usage note, a "Multiple selection" section with a live `selectMultiple` preview, and the checkbox-vs-multiselect advice reframed from a Do/Don't _prohibition_ into _guidance_. The original docs/API contradiction is resolved by embracing the feature, not deleting it. `registry:build` re-synced copy-in + `r/select.json` + integrity (`sha256-mqiZ…`, consistent across all three); typecheck 10/10; build 172 pages. Nothing is published — no breaking-change concern.

## Where the detail lives

- Plan + per-component mandates: [`04-per-component-fixes.md`](./04-per-component-fixes.md), [`02-correctness-hotlist.md`](./02-correctness-hotlist.md), [`03-coverage-scorecard-and-sweeps.md`](./03-coverage-scorecard-and-sweeps.md).
- Raw audit findings: [`raw-findings/`](./raw-findings/).
