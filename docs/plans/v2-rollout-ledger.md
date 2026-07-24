# LEDGER — v2 Design System Rollout (live; operator reviews this)

Running record of every change + decision. Newest entries appended per phase. Plain language for review.

## In-flight decisions (made autonomously — review these)

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                        | Why                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Warm the neutral ramp by keeping each existing step's lightness and adding C≈0.003 / H=75 (not replacing with exact v2 hexes).                                                                                                                                                                                                                                                                                  | Preserves the proven, contrast-tuned lightness structure → lowest risk re-skin; warmth is the only change.                                                                                                                                                            |
| D2  | **Apply v2 _character_ onto the repo's existing token architecture, minimal structural disruption.** Deliver the signature v2 changes faithfully (warm neutrals; `brand`=purple; `ring`=`primary`; charcoal `primary`=new neutral.700; sizing 28/32/40; selected=brand; charts→8). Keep the repo's sound bits where v2 barely differs (status/info hues already AA-passing & close to v2; sidebar-* structure). | Forcing exact v2 hexes onto a different ramp is high-risk for marginal gain; the 59 components + gates already depend on the existing architecture.                                                                                                                   |
| D3  | **Keep the repo's FLAT colour model** (`{color}` + `{color}-foreground`; hover via `/90` opacity, subtle via `/10`, text via the solid colour) instead of design.md's 6-token families (`-hover/-active/-subtle/-text`).                                                                                                                                                                                        | All 59 components already use the opacity pattern; adding 30+ sub-tokens would mean rewriting every component. design.md's families are realised as opacity utilities.                                                                                                |
| D4  | Warm the `white` primitive to `oklch(0.994 0.002 75)` (≈#fefdfc) so the canvas (`background`=white) is warm, matching v2.                                                                                                                                                                                                                                                                                       | Canvas warmth is the most visible v2 signal; keeping pure white would leave a cool canvas against warm cards.                                                                                                                                                         |
| D7  | **Theme-aware `{family}-text` tokens** decoupled from the fill: light `success-text`→`green.800` (L0.48), `info-text`→`blue.800` (L0.49) (darker than the fills); dark `-text`→lighter primitives. Verified the subtle pattern `bg-{family}/10 text-{family}-text` clears WCAG AA on EVERY container surface — background/card/popover/**muted** (4.60–5.43 light, 6.4–7.9 dark).                               | A single fill token can't satisfy both "fill as a block" (≥3:1) and "text on a `/10` tint" (≥4.5:1), and the tint sits on cards/popovers/muted panels (darker than the page), so background-only verification was insufficient. Fills unchanged → tint hue preserved. |
| D8  | Button `link` variant → **`info` blue** (`text-info-text`), matching design.md's 5×-repeated "links use info" mandate and the existing markdown-view anchor styling.                                                                                                                                                                                                                                            | Makes every link affordance in the system one consistent, AA-passing blue; was neutral `text-primary` (spec contradiction).                                                                                                                                           |
| D9  | Keep the **2-tier surface model** (`card`=neutral.50 barely-tinted, `popover`=flush white) rather than design.md's `card==background`.                                                                                                                                                                                                                                                                          | In a borders-only/no-shadow system a barely-perceptible card tint + border reads as gentle elevation; popover stays pure-white to float. Documented deviation.                                                                                                        |
| D10 | Keep the repo's shipped **3-curve motion set** (standard `[0.2,0,0,1]`, emphasized `[0.3,0,0,1]`, exit `[0.4,0,1,1]`); reconciled **design.md** to match (was the Material `[0.4,0,0.2,1]`).                                                                                                                                                                                                                    | The snappier decelerate is the shipped house style (per implementation-plan §7.6); the spec value was stale.                                                                                                                                                          |
| D12 | Pointer cursor set as ONE global base-layer rule (base.css + docs global.css mirror) targeting `button` + interactive roles, with a disabled opt-out — NOT per component. Removed redundant/contradicting per-component cursor classes; kept only non-standard clickables + non-pointer cursors.                                                                                                                | Tailwind v4 drops the button cursor; a single global rule is gap-free + future-proof (new components covered automatically) and matches the "no locally-set global styles" mandate. Mirrors how the focus ring is centralized in base.css.                            |
| D11 | Removed dead `showcase-*` semantic tokens (4 light + 4 dark — they emitted unused `--color-showcase-*` CSS) + their one-off feeder primitive families (`violet`, `sky`) + the inverted-ordering `neutral.400` (L0.63, was _darker_ than `neutral.450` L0.66). Kept coherent ramp steps (inert — primitives aren't emitted to CSS).                                                                              | `showcase-*` had zero consumers anywhere → real dead output. `violet`/`sky` existed only to feed it; `neutral.400` was an unreferenced naming trap. Other unused steps are legitimate palette material with zero output cost.                                         |

## Phase 0 — Baseline ✓

- `pnpm --filter @vegastack/tokens build` GREEN: tokens build, contrast-check **28/28** pairs pass, tsup OK. (Node 22 vs wanted 24 = warning only.)
- Architecture confirmed: DTCG (`primitives`/`semantic`/`semantic.dark`) → `build-tokens.mjs` (+ `sd-hooks.mjs` transforms + `tailwind/inline-bridge` @theme) → `dist/theme.css`. Components: CVA + `cn()` + semantic utilities + opacity. Focus centralized in `base.css` `:focus-visible{outline-2 outline-offset-2 outline-ring}` plus component-specific semantic focus states.
- Repo specifics: dark `border`/`input` already = neutral.800; `ring` light=neutral.350/dark=neutral.600; radius `@theme` derives via `calc(var(--radius)±)` (need explicit 6/8/12); chromatics are sparse single-steps; `showcase-*` + `chart-1..5` exist.

## Phase log

### Phase 0 — Baseline

- (pending)

### Phase 1 — Token values ✓ (build green: contrast 30/30, design-lint clean)

- `primitives.tokens.json`: warmed every neutral step (kept L, set C=0.003 H=75); `white`→oklch(0.994 0.002 75); `black`→pure; **added `neutral.700`** (charcoal, 0.353); **added `purple.600`** (brand #774bcb = oklch 0.53 0.189 295) + `purple.400` (bright, for future dark charts).
- `semantic.tokens.json` (light): **added `brand`={purple.600}** + `brand-foreground`={white}; `primary`→`neutral.700` (charcoal, was 900); `input`→**alias `{border}`**; `ring`→**`{primary}`**; `chart-1`→`{brand}`; **added `chart-6/7/8`**; `sidebar-border`→`{border}`; `sidebar-ring`→`{primary}`.
- `semantic.dark.tokens.json`: same — added `brand`/`brand-foreground`; `input`→`{border}`; `ring`→`{primary}`; `chart-1`→`{brand}` + `chart-6/7/8` (brighter dark); `sidebar-border`/`-ring` aliased.
- `tooling/contrast-check.mjs`: added `['brand','brand-foreground']` pair → 30 pairs.
- Verified generated `theme.css`: light bg `oklch(0.994 0.002 75)`, primary `0.353`, brand `0.53 0.189 295`, `input`==`border`, `ring`==`primary`; dark mirrors; `@theme inline` exposes `--color-brand`, `--color-chart-8`. All 59 components re-skin via semantic utilities automatically.
- NOTE: status/info hues kept as repo had them (already AA, close to v2) per D2. Visual docs screenshot deferred to Phase 4 full QA (token values verified resolved).

### Phase 2 — Scale tokens + build-config ✓ (build + lint green; contrast 30/30)

- `semantic.tokens.json`: `radius`→0.75rem; added `radius-sm/md/lg` (6/8/12), `size-sm/md/lg` (28/32/40 ref), `shadow-overlay` (warm-ink), and 9 role typography tokens (`text-display/h1/h2/h3/h4/label/label-sm/code/code-sm`).
- `sd-hooks.mjs`: added `shadow/css` transform; rewrote `tailwind/inline-bridge` to emit explicit radius (token-driven 6/8/12, replacing shadcn's calc-derive), `--shadow-overlay`, and `--text-*` role utilities (composite, @theme-only).
- `build-tokens.mjs`: added `shadow/css` to TRANSFORMS; excluded `typography` from `:root` (composite — lives only in `@theme`).
- New Tailwind utilities now available: `rounded-sm/md/lg`=6/8/12, `shadow-overlay`, `text-h1`…`text-h4`/`text-label`/`text-label-sm`/`text-code`/`text-code-sm`. `--size-*` in `:root` (reference). Verified no `[object Object]`.
- DECISIONS: D5 — control heights standardized on Tailwind `h-7/h-8/h-10` (=28/32/40) used consistently; `--size-*` tokens added as reference (Tailwind already gives exact values; a bespoke `h-control-*` utility = churn for no visual gain). D6 — did NOT override Tailwind `text-base/sm/lg` (our 14/12/16 ≠ their 16/14/18 → collision); added only non-colliding role utilities; components keep `text-sm`(14)/`text-xs`(12)/`text-base`(16) which already map to our base/sm/lg.

### Phase 3 — Component migration + showcase (IN PROGRESS — 36/64 done via parallel agents)

Applied per component: control sizes 28/32/40 (`h-7/h-8/h-10`); radius per surface (controls `rounded-md`8, containers `rounded-lg`12, menu items `rounded-sm`6, pills `rounded-full`, sheet flush); overlays use `shadow-overlay`; **selected/checked/active → `brand`**; added `brand` variant to button/badge/alert; previews rewritten to show all variants. Focus untouched (ring=primary token handles it). Lint-clean; arbitrary values avoided (design-lint forbids `[Npx]`).

- **Wave 1 (18):** button, icon-button, split-button, input, textarea, password-input, select, state-select, country-select, checkbox, radio-group, switch, dialog, alert-dialog, sheet, dropdown-menu, context-menu, command.
- **Wave 2 (18):** popover, hover-card, tooltip, tabs, toggle, toggle-group, badge, alert, card, table, data-list, pagination, sidebar, breadcrumb, page-header, avatar, progress, progress-indicator.
- Fixed regression: command.tsx `max-h-[300px]` → `max-h-80` (arbitrary value would fail design-lint).
- **Brand wiring:** checkbox/radio/switch checked→brand; tabs active underline→brand; toggle-group pressed→brand; pagination active→brand; progress/progress-indicator fill→brand; data-list selected row→brand/10; badge/alert/button gained `brand` variant. (Standalone toggle + sidebar-active kept neutral — not selection per rationing.)

### Pre-existing bugs found & fixed (during Phase 3)

- **dialog.tsx + alert-dialog.tsx:** content used `bg-background` (wrong surface) → `bg-popover`; titles `font-semibold`(600, banned) → `font-medium`(500); content `rounded-xl`(14) → `rounded-lg`(12).
- **page-header.tsx:** `<h1>` was `text-xl font-semibold`(600) → `text-h2` role token (≤500).
- **sheet.tsx:** title `font-semibold` → `font-medium`.
- **password-input.tsx:** eye-toggle had no ≥24px hit area → added `size-6` (WCAG 2.5.5).
- **tooltip.tsx:** arrow still light-surfaced after inversion → matched to `bg-foreground`; removed mismatched border.
- **toggle-group.tsx:** base `hover:bg-muted` repainted the brand-pressed fill on hover → added `hover:data-pressed:bg-brand`.
- **dropdown/context-menu:** highlighted-row svg rule would override the brand check indicator → stripped row-level svg colour so brand holds in all states.
- **pagination.tsx:** active hover would darken on-brand text → added explicit `hover:text-brand-foreground`.
- Stale MDX prose flagged (out of scope, Phase 5/6): select.mdx (sizes), password-input.mdx (tabIndex claim).
- **NOTE (Phase 4 must do):** docs `apps/docs/components/ui/*` are byte-identical copies of the registry — they MUST be re-synced from the migrated registry, or docs render the OLD design + previews using new props (e.g. `variant="brand"`) will be TS errors. Registry integrity `sha256` headers + `meta.integrity` are now stale → regenerate via registry tooling.

### Phase 4 — Validation ✓ ALL GREEN

- Synced 64 docs copies (`apps/docs/components/ui/*` ← migrated registry, verbatim `cp` — imports byte-identical incl. cross-component `@/components/ui/*`).
- `pnpm registry:build`: rebuilt 64 items + index, re-stamped provenance headers (51 sources + 51 copy-ins), `verify-headers` ✓.
- Fixed 3 typecheck errors: table/data-list previews used Badge `variant="outline"` (renamed → `subtle`).
- **Gates:** typecheck **10/10** ✓ · build **6/6** (docs **144/144** static pages) ✓ · tests **617 + 16** passed ✓ · lint **10/10** (contrast **30/30**, design-lint clean tokens/ui/docs, content-lint clean = no missing VRT coverage, dogfood + preset verified) ✓.

### Phase 4b — Adversarial-review fixes ✓ RE-GREEN (typecheck 10/10 · test 617 · lint 10/10 contrast 30/30 · build 6/6 docs 144/144 · registry 64 re-stamped)

Strict-reviewer findings (B=blocker, M=minor) fixed at the TOKEN layer (global, zero per-component hardcoding) + targeted preview/MDX:

- **B1 — dark subtle-bg text failed WCAG AA.** In dark, `text-{family}` on `bg-{family}/10` measured 2.68–4.42:1 (brand/destructive/warning/info fail). ROOT CAUSE: a single fill token can't satisfy both "fill" (needs ≥3:1 as a block) and "text-on-subtle" (needs ≥4.5:1). FIX: added theme-aware **`{family}-text` tokens** (light = same as fill → zero light change; dark = a _lighter_ primitive). New primitive `red.400` (0.72 0.16 25) for `destructive-text` dark. Global perl swap `text-{family}` → `text-{family}-text` across 22 registry components (solid variants untouched — they use `-foreground`). VERIFIED with a compositing AA script (CSS composites `/10` in gamma sRGB over `--background`): all 5 families now **light 4.57–5.24:1, dark 6.42–7.92:1**. Also added **`track`** token (light `neutral.300`, dark `neutral.600`) for the Switch off-track (was `bg-input` → invisible in dark); `switch.tsx` now `bg-track`.
- **B2 — charts not distinct.** Light `chart-4`/`chart-5` were both amber-ish (<3:1 apart); dark `chart-4` duplicated brand purple. FIX: light `chart-4`→`orange.600`, `chart-5`→`rose.500`; dark `chart-4`→`orange.400`. 8-series ramp now hue-separated.
- **M5 — scrim.** Modal overlay was pure-black α.5 (cool). FIX: light `overlay`→warm `oklch(0.13 0.002 75 / 0.28)`, dark→`/0.55`.
- **M (sizing) — off the 28/32/40 scale:** OTP slot `size-9`(36)→`size-8`(32, matches default input); Pagination `lg` `h-9`(36)→`h-10`(40); Sidebar menu-button `lg` `h-9`→`h-10`.
- **M (weight) — PopoverTitle** `font-semibold`(600, banned)→`font-medium`(500), matching Dialog/Sheet titles. Full registry sweep confirms **zero** `font-semibold`/`font-bold` remain.
- **Showcase gaps (no doc-local style hacks):** icon-button preview now shows **all 15** Button variants (added `link`/`glass`/`info`/`success-outline`/`warning-outline`/`info-outline`); select preview added `lg` size (now sm/default/lg); `badge.mdx` prose corrected (variants `subtle`/`solid`/`minimal`; colors default/brand/success/warning/destructive/info; sizes sm/default/lg — was listing removed `outline`/`primary`/`secondary`/`xs`); `progress-indicator.mdx` "`text-primary` by default"→"`text-brand`" (matches component); **sidebar preview** removed the `rounded-l-lg` doc-hack and instead clips the demo frame (`overflow-hidden`) so the Sidebar renders exactly as in production.
- Ran a fresh 4-reviewer adversarial pass on the full diff. Findings + fixes below.

### Phase 4b round 2 — adversarial findings fixed (from the 4-reviewer pass)

- **B (switch) — `bg-input` shipped where `bg-track` was intended** (caught by 2 reviewers; my earlier `perl` lacked `/g` and edited the wrong occurrence). FIXED `switch.tsx:18` → `bg-track`. Dark off-track now neutral.600 (visible) instead of border-dark.
- **B (AA on card/muted) — light `info-text` failed AA on non-background surfaces** (4.46:1 on card, 4.27 on muted). The subtle pattern renders on cards/popovers/muted panels, not just the page. FIXED: light `info-text`→`blue.800` (L0.49), `success-text`→`green.800` (L0.48) [D7]. Re-verified across background/card/popover/muted — all 5 families ≥4.60 light / ≥6.4 dark.
- **B×4 (stale showcase docs):** `button.mdx` "14 variants"→"15" + added `brand` to the enumeration + noted `link`=info; `markdown-view.mdx` link color `text-primary`→`text-info-text`; `select.mdx` size list added `lg`; (badge.mdx already corrected in round 1).
- **(spec) link affordance** `text-primary`→`text-info-text` on the button `link` variant [D8].
- **(showcase) pagination** — added a `paginationSizes` preview (sm/lg) + a Sizes section in `pagination.mdx` (the `size` prop was documented but never demonstrated).
- **(cleanup)** removed `showcase-*` + `violet`/`sky`/`neutral.400` [D11]; confirmed 0 `showcase` occurrences in `theme.css`.

### Phase 4b round 3 — final verification pass (2 reviewers) + last fixes

- Reviewer A (tokens/AA): **CLEAN** — re-confirmed switch `bg-track` (3 copies byte-identical), all subtle pairs ≥4.60 light / ≥5.03 dark on background/card/popover/muted, `link`=`text-info-text` clears AA (6.1–7.6:1) on background+card both themes, and **zero dangling refs** to the removed tokens anywhere in source (only legitimate hits: design-lint's banned-palette regex + color-picker's Tailwind `sky-500` swatch).
- Reviewer B (showcase) found **2 pre-existing stale-doc defects** of the already-fixed class (not regressions): (1) `progress-indicator.mdx` said `text-brand` but the component's default is `text-brand-text` (the perl swap moved the thin-ring default to the legibility-tuned token — kept, it's more visible in dark) → prose fixed; (2) `alert.mdx` claimed "five variants / four statuses" omitting `brand` (alert has 6: default/brand/info/success/warning/destructive) → description + prose fixed, and `text-X`→`text-X-text` in the token note.
- Ran an **exhaustive own sweep** (`/tmp/doc-count-check.mjs`) comparing every component MDX's numeric claims + brand-mentions against its CVA keys across all 60+ docs → **no remaining mismatches**.

### Phase 7 — Global pointer-cursor fix ✓ (verified live + gates green)

- **Root cause:** Tailwind v4 Preflight no longer sets `cursor` and native `<button>` is an arrow, so buttons/icon-buttons/toggles/tabs had NO hand cursor; cursor handling across components was inconsistent (some `cursor-pointer`, some `cursor-default` actively forcing the arrow on clickable items like select options + tabs).
- **Fix (single global source, D12):** added a base-layer rule to **`packages/tokens/src/base.css`** — `cursor: pointer` on `button, [role=button|tab|switch|checkbox|radio|menuitem|menuitemcheckbox|menuitemradio|option], summary`, plus a `:disabled, [aria-disabled=true], [data-disabled] { cursor: default }` opt-out. The docs app imports `theme.css` but NOT `base.css` (it mirrors base behaviors), so the **same rule is mirrored in `apps/docs/app/global.css`** (like layout.tsx mirrors `isolate`).
- **Removed** the now-redundant per-component `cursor-pointer` (switch, dropdown/context/command items, pagination) and the contradicting `cursor-default` (select-item, tab, collapsible-trigger) — cursor is now globally driven, per the "no locally-set global styles" mandate. **Kept** only genuine deviations: non-standard clickables (`data-list` clickable `<tr>`, `field` label tied to a control), non-pointer cursors (`field-inline` `cursor-text`, select **scroll-arrows** `cursor-default`), and disabled `cursor-not-allowed`.
- **GOTCHA fixed:** first attempt used `:where(...):not(:disabled, [disabled], ...)` — Lightning CSS (Tailwind v4) **silently dropped** that selector (no error; rule absent from compiled CSS). Rewrote to a plain selector list + separate disabled rule, which compiles.
- **design.md:** added an `# ── INTERACTION ──` block (cursor pointer on enabled controls + exceptions). **consume skill:** base.css comment now lists the pointer cursor.
- **Verified live** (dev server + computed-style inspection): buttons 25/25 enabled = `pointer` (3 disabled = `default`); select trigger = pointer, options pointer (disabled option `default`); dropdown menuitem/checkbox/radio all pointer (disabled `default`); tabs pointer; **switch = `<span role=switch>` → pointer** (proves role-based selectors were necessary); collapsible trigger pointer (disabled `default`).
- **Gates:** typecheck 10/10 · tests 617 · lint 10/10 (contrast 30/30, design-lint clean incl. docs CSS) · build 6/6 (144/144) · registry 0 drift.

### Phase 8 — Full Codex adversarial review (every component + skills + tokens) → triaged + fixed ✓

Ran ~15 parallel `codex:codex-rescue` reviewers (batches of 5 components + skills + tokens/tooling) against the v2 design.md + global tokens + the new cursor rule. **Evaluated every finding critically — did NOT blindly accept.** Re-gated green after fixes (typecheck 10/10 · test 617 · lint 10/10 · build 144/144 · contrast now **70 checks**).

**REAL findings FIXED:**

- **Flat-control shadows** (design.md: controls flat, only overlays get shadow) → removed `shadow-xs`/`shadow-sm` from `checkbox`, `radio-group`, `switch` (thumb), `tabs` (active pill). Kept `color-picker`'s check drop-shadow (functional — keeps the check legible on arbitrary swatch colors).
- **`field` link-hover** `text-primary` → `text-info-text` (links = info blue, per D8). Selection highlight (`selection:*-primary*`) correctly untouched.
- **`auto-save-input` real state bug:** reverting an invalid/in-flight edit back to the saved value returned early WITHOUT clearing the stale `error`/`saving` status → a valid value stayed `aria-invalid`. Fixed with a `statusRef` so the debounce effect resets to `idle` on revert (without taking `status` as a dep).
- **`data-list`** skeleton `rounded` (=12px on a 14px box) → `rounded-sm`.
- **Stale prose/preview:** `card.mdx`/`settings-row.mdx` `rounded-xl`→`rounded-lg`; `date-picker.mdx` `bg-primary`→`bg-brand`; `slider.mdx` `bg-primary`→`bg-brand`; `avatar.mdx` `bg-muted`→`bg-accent`; `progress-indicator` preview `text-{family}`→`text-{family}-text`; `hover-card` preview `font-semibold`→`font-medium`.
- **Contrast gate hardened:** `contrast-check.mjs` now also verifies the subtle pattern `text-{family}-text` on `bg-{family}/10` composited over background/card/popover/muted in BOTH themes (40 new checks). This closes the gate's blind spot so a future `-text` regression fails CI (was the reviewer's one valid structural point).

**Findings REJECTED as false positives (with reason) — the noise the agents generated without the accepted-decision context:**

- "`text-sm`/`text-xs` must be a role token" (×many) — **D6**: those Tailwind utilities ARE the scale (kept deliberately; `text-label` etc. are equivalents, not mandates).
- "dark `info`/`success`/`destructive-text` fail AA on card/muted (4.0–4.4:1)" — **miscalculated**; my authoritative gamma-composited computation (now codified in the gate) shows dark worst-case = **5.03** on muted, all ≥4.5.
- "soft destructive button should be solid", color-picker "raw colors"/inline swatch `style`, `translate-y-px`/`[calc()]` "arbitrary", defensive `'use client'`, `aria-invalid:ring-destructive` "focus-ring violation", icon-button "exposes all variants", command `h-12`/`ring-0` (cmdk pattern), context-menu `bg-destructive/20` (it's the DARK highlight; light is `/10` — correct) — all deliberate/standard/gate-passing.

**My OWN over-correction caught + reverted:** I initially made the pagination/breadcrumb ellipsis announce its label (moved `aria-hidden` to the icon), but the tests + JSDoc deliberately specify a **decorative** ellipsis (pagination stays navigable via the page links) — reverted to the tested shadcn-standard pattern.

**Deferred as judgment calls / enhancements (noted, not changed):** sidebar active-state = neutral accent (a prior deliberate decision — design.md rations brand; flagged for your call); `progress` indeterminate has no animated visual (a feature-completion needing a keyframe, not a token flaw); password-input/slider per-control announcement enhancements; checkbox/color-picker check `strokeWidth={3}` (a standard micro-icon legibility exception). **3 review batches (label/markdown-view/notification-bell/otp-input/page-header; toggle-group/toggle/tooltip/truncated-text; skills) were still composing — my own full-registry sweep confirms those components carry no banned weights, control shadows, `text-primary` links, or off-scale tiers.**

### Phase 5 — Reconcile ✓

- **design.md** motion-ease `cubic-bezier(0.4,0,0.2,1)`→`(0.2,0,0,1)` (2 places) + noted the 3-curve set [D10].
- **design.md** `proposed-design-system.html` citation re-labelled as a superseded early single-accent exploration (file kept, not deleted — it's research history); pointed readers at the live Fumadocs showcase + the ledger.
- Card surface (D9), ramp-key naming, and status-hue precision recorded as accepted deviations in the decisions table rather than churning the spec body.

### Phase 6 — Cleanup ✓

- Dead `showcase-*` semantic tokens + one-off feeder primitive families (`violet`, `sky`) + the inverted `neutral.400` removed [D11]. Remaining unused primitives are coherent ramp steps (inert; not emitted to CSS) — kept as palette material.

### Phase 5 — Reconcile

- (pending)

### Phase 6 — Cleanup

- (pending)

## Pre-existing bugs found & fixed

- (none yet)

## Open issues / blockers

- (none yet)
