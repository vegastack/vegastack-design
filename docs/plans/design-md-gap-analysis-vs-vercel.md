# Gap analysis — VegaStack `design.md` (v2) vs Vercel Geist `design.md`

Compares our `design.md` against `docs/research/design-md-references/Vercel_DESIGN.md` (Geist, light theme).
Purpose: find where Vercel is more complete/rigorous, decide what to close. No fluff.

## Verdict at a glance

| Dimension | Vercel Geist | VegaStack v2 | Status |
|---|---|---|---|
| Token format | `{token.path}` reference syntax (machine-resolvable) | human-readable comments, no refs | **GAP** |
| Wide-gamut P3 | every accent ships `oklch()` P3 + sRGB hex fallback | sRGB hex only (OKLCH-derived but not published) | **GAP** |
| Neutral ramp | 10 steps, intent-encoded (step = UI role) | 14 steps + semantic tokens | divergence (ours is fine) |
| Alpha scale | 10-step `gray-alpha-*` | none (one border + scrim) | divergence (deliberate) |
| Surfaces | `background-100/200` split from gray, hard rule | `card`/`secondary`/`muted` tokens | parity |
| Accent families | 7 scales × 10 steps | 5 families × 6 tokens (brand/info/3 status) | divergence (rationed) |
| Typography | 4 role families (heading/label/copy/button) × many sizes + `-mono` variants | display/h1–h4/text-lg-base-sm/label/code (~10) | **GAP** (granularity) |
| Component recipes | bg + text + typography + **padding** + height, all as refs | bg + hover + height (no padding, no refs) | **GAP** (padding) |
| Elevation | 3 tiered shadow recipes (card/popover/modal) | 1 overlay shadow (flat by default) | divergence (deliberate) |
| Focus | required two-layer ring (`2px #fff, 2px blue`) | **no ring** — mirrors hover; input border → primary | divergence (our decision) |
| Radius / spacing / motion / voice / do-don't | present | present (≥ parity) | parity |
| Data-viz | none | categorical + sequential + diverging | **we exceed** |
| Iconography / AI surfaces / target-size / reduced-motion / dual-theme | none / partial | present | **we exceed** |

---

## Real gaps (close these)

### G1 — No published P3 / wide-gamut OKLCH values  · **Priority: HIGH**
- **Vercel:** every accent ships twice — sRGB hex (fallback) **and** an `oklch()` wide-gamut value for Display-P3 screens (e.g. `blue-700-p3: oklch(57.61% 0.2508 258.23)`).
- **Us:** chromatics are listed as sRGB hex only. Our colours were *computed* in OKLCH then clipped to sRGB, but the P3 (more-saturated) values are never published — even though the locked architecture (AGENTS.md: "custom `color/oklch` transform + P3-capable") intends them.
- **Why it matters:** we implicitly claim OKLCH/P3 capability but ship sRGB only. On P3 displays our brand/status read duller than they could; and the spec doesn't match the stated build.
- **Resolve:** for each chromatic family (`brand`, `info`, `destructive`, `success`, `warning`) and optionally the neutral ramp, add an `oklch()` wide-gamut value beside the hex (push chroma to the P3 boundary at the same L/H), hex as fallback. Generate from the Style-Dictionary `color/oklch` transform so spec == build.
- **Recommended action:** add a `*-p3` (or inline `oklch`) field to each chromatic in the frontmatter; re-run the contrast gate on the sRGB fallback (unchanged). ~½ day.

### G2 — Component recipes omit padding (and any token references) · **Priority: MED**
- **Vercel:** each recipe is complete and resolvable — `button-primary { backgroundColor: {colors.primary}, textColor: {colors.background-100}, typography: {typography.button-14}, rounded: {rounded.sm}, padding: "0 10px", height: 40px }`, with `-small`/`-large` giving the other paddings/heights.
- **Us:** recipes give `background`/`hover`/`height` but **no padding**, and reference tokens by bare name, not resolvable path.
- **Resolve:** add `padding` to button/input recipes at all three sizes (sm/md/lg). We already state heights (28/34/40) and the artifact uses `0 11px` (sm) / `0 14px` (md) / `0 18px` (lg) for buttons, `0 11px`/`0 13px` for inputs — promote those into the recipes.
- **Recommended action:** fill in `padding` per size; pick whether to also adopt reference syntax (see G3). ~1 hr.

### G3 — Frontmatter isn't machine-resolvable · **Priority: MED**
- **Vercel:** tokens are data; components interpolate (`{colors.primary}`, `{typography.button-14}`). An agent/build can resolve the whole graph from the file.
- **Us:** values are inline with `# comment` provenance; component recipes use bare names. Readable, but not a resolvable token graph — and our provenance note says the real source is `@vegastack/tokens`, so the doc is documentation, not data.
- **Resolve — pick one:**
  - **(A, recommended)** Keep `design.md` as the human/agent-readable *spec*, and make `@vegastack/tokens` (DTCG JSON) the machine source — but add **one explicit cross-reference**: state in the frontmatter that component recipe names (`primary`, `brand.fill`) map 1:1 to DTCG token paths, so the mapping is unambiguous. Cheap; preserves readability.
  - **(B)** Adopt Vercel's `{token.path}` interpolation in the recipes for full in-file resolvability. More work, duplicates the DTCG source, risks drift.
- **Recommended action:** (A) — add a one-paragraph "token-path mapping" note; do **not** duplicate the graph.

### G4 — Typography granularity: one label size, no copy/label split, one mono · **Priority: MED**
- **Vercel:** separates **label** (single-line: nav, form labels, table headers, metadata — tight line-height) from **copy** (multi-line body — taller line-height), each at 4–5 sizes, plus `-mono` at 12/13/14 for tabular data.
- **Us:** one `label` (14/500), body as `text-lg`/`text-base`, one `code` (mono 13). No `label-sm` for dense table headers/metadata; no `mono-sm` for compact tabular numbers.
- **Why it matters:** data-dense surfaces (tables, logs, agent consoles — our core use case) want a 12px label and a 12/13px mono for aligned numbers. We have neither at the small end.
- **Resolve:** add **`label-sm`** (12/16/500) and **`code-sm`** (Geist Mono 12/16/400, tabular). Keep the rest as-is — full Vercel breadth (heading-72…14, copy×5) is overkill for our restrained system and the operator chose simplicity.
- **Recommended action:** add the two small tokens; document line-height intent (label = tight, body = 1.5). ~30 min.

### G5 — Single overlay shadow vs Vercel's tiered set · **Priority: LOW**
- **Vercel:** distinct recipes for raised card / popover-menu / modal-dialog (modal heavier); tooltip takes the lightest.
- **Us:** one `shadow-overlay` for every overlay (cards stay flat — deliberate).
- **Resolve (optional):** add a second, heavier `shadow-modal` so dialogs read deeper than dropdowns. Keep cards flat. Only if dialogs feel under-weighted in testing.
- **Recommended action:** defer; revisit after the component build. Our flat-by-default is intentional and should not become a 3-tier system.

---

## Deliberate divergences (NOT gaps — documented so they aren't "fixed" by mistake)

| Divergence | Vercel | Us | Rationale |
|---|---|---|---|
| **No focus ring** | required two-layer blue ring | focus mirrors hover; input border → primary ink | operator decision; still WCAG 2.4.7 (visible focus), calmer, frees the accent. Note: this is the riskiest divergence — keep the hover-as-focus delta perceivable. |
| **One border, no alpha scale** | 10-step `gray-alpha-*` | single translucent `border` + `scrim` | restraint; one border reads on any surface. Trade-off: no alpha hover for media/coloured tiles — re-add 1 alpha token only if that case appears. |
| **Semantic tokens, not intent-encoded steps** | step = UI role | `background`/`muted`/`border`/… | explicit > positional; cleaner for shadcn/Base UI. |
| **Sentence case everywhere** | Title Case for labels/buttons/tabs | sentence case for all | operator voice choice. |
| **Both themes in one file** | dark in separate `/design.dark.md` | light + dark inline | single source, both authored & gate-validated. |
| **Tighter radius** (md 8 vs 12) | sm6/md12/lg16 | sm6/md8/lg12 | denser, more "developer-tool". |

---

## Where we exceed Vercel (keep)

- **Data-viz** — 3 scales (categorical/sequential/diverging). Vercel has none.
- **Iconography** — library, sizes, stroke, currentColor. Vercel has none.
- **AI/agent surfaces + AI motion** — streaming/thinking/tool-progress. Vercel has none.
- **Accessibility breadth** — dual-theme contrast contract, target sizes (24/44), reduced-motion, colour-never-alone, fail-closed gate. Vercel states 4.5:1 + focus only.
- **Component breadth** — tabs, segmented, nav/pagination, avatars, progress, skeleton, accordion, command palette, switch/checkbox/radio/slider, surfaces ladder. Vercel tokenizes only button + input.
- **Live contrast proof** — the artifact computes every pair from rendered tokens (14/14 AA both themes).

---

## Prioritized action list

1. **G1 (HIGH)** — publish P3 `oklch()` variants for the 5 chromatic families (hex fallback stays). Spec must match the OKLCH/P3 build.
2. **G2 (MED)** — add `padding` to button/input recipes (sm/md/lg).
3. **G4 (MED)** — add `label-sm` (12) + `code-sm` (12, tabular) for data-dense surfaces.
4. **G3 (MED)** — add a one-paragraph token-path mapping note (option A); don't duplicate the graph.
5. **G5 (LOW)** — defer tiered shadows; revisit post-build.

Net: VegaStack v2 is **at or above Geist on coverage** (data-viz, icons, AI, a11y breadth, dual-theme) and **behind on two concrete things** — published P3 values (G1) and recipe padding/resolvability (G2/G3). G1 is the only one that touches a stated capability claim; the rest are polish.
