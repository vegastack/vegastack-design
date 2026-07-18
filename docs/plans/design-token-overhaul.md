# Design Token Overhaul — "Aster" aesthetic adoption

**Status:** PLAN — awaiting approval. Build LOCAL, stop at publish/deploy.
**Author:** mk@vegastack.com (operator-directed)
**Date:** 2026-06-21
**Reference:** `~/Downloads/design-research-site (1)/` (`design.md` + `globals.css`) — internal codename **"Aster"**.

> This plan re-skins the VegaStack token system to the Aster design language (light-first,
> white-on-white, hairline depth, compact/quiet type) **without** changing our architecture:
> OKLCH pipeline, shadcn-standard semantic vocabulary, DTCG → Style Dictionary → `@theme` bridge,
> and the fail-closed contrast gate all stay. It touches every one of the 64 components, so it is
> split into **two approval-gated phases**.

---

## 1. Decisions locked (from the interview — do not re-open)

| # | Decision | Choice |
|---|---|---|
| 1 | **Adoption strategy** | **Re-skin our tokens.** Keep our semantic vocabulary (`background`/`foreground`/`primary`…) + OKLCH pipeline + contrast gate. Remap Aster's *values, scale & philosophy* onto existing tokens; add new tokens (type scale, extra radii, alpha hairline) where the reference needs them. NO `canvas`/`ink`/`hairline` rename. |
| 2 | **Font family** | **Keep Geist** (already wired via `next/font`). Aster's 11–21px scale is re-tuned to Geist's metrics live in the pilot — not copied blind. |
| 3 | **Type system** | **Full type system.** Add typography tokens (size + line-height + weight + tracking) to the DTCG source, bridge to `@theme`, AND sweep all 64 components onto the named scale + de-bold. |
| 4 | **Color scope** | **Neutral chrome + semantic accents.** Adopt Aster neutral ramp + hairline/fill system; keep our status accents (destructive/success/warning/info) re-tuned to Aster's quiet register; **drop** all product-art gradients (plan/phone/modal/apps/panel, sticky gold, send-blue, model mark). **Override the locked palette** — logged in `docs/ledger/`. |
| 5 | **Dark mode** | **Re-derive algorithmically** — flip/adjust the new neutral ramp's lightness in OKLCH, preserving chroma/hue. No hand-measured Aster dark. |
| 6 | **Rollout** | **Two separate phases** (Phase 1 tokens, Phase 2 component sweep), each approval-gated. |
| 7 | **Skills layer** | **Out of scope for now.** No `skills/**/references/` work in this plan. (Dead-link fix in `design-system/SKILL.md` deferred with it.) |

### 1.1 Judgment calls — where we deliberately diverge from Aster

> Aster is a reference, not scripture. It's a great *product app*; we're a *component library on
> Geist*. These are the places we override it on purpose, with rationale, so future agents don't
> "restore fidelity" by reverting them.

| Aster says | We do | Why |
|---|---|---|
| 13px universal base | **14px base** (revised) — simplified 6-size scale `h1`–`h4`/`body`/`small` | First locked 13px (Aster purism), then revised: 14px is more readable, the shadcn/Vercel default, and right for the reading-heavy surfaces of an agentic-enterprise product (logs, descriptions, agent output). Dense tables can still drop a specific surface to 13px; the *default* is 14. No global `body` override — components self-size. |
| Hairline-only depth, no shadows | **Flat hairline for inline surfaces + a soft-shadow OVERLAY tier** | A 7% border on a scrim is invisible; we have 8 floating components that must read as elevated. Aster itself keeps a shadow on its one floating layer (the modal) — same principle. |
| Border = black @ 7% | **Border = black @ ~9%** (overlay tier stronger) | 7% vanishes in dense tables and on non-white surfaces; 9% stays legible while still reading as a hairline. |
| Weight 400 default, **never 600** | **Cap body/UI at 500; allow 600 for top-level headings only** | In Geist (not SF), 400 is lighter and 500 subtle; a 21px/400 heading reads unanchored. 600 stays a scoped hierarchy tool for display/dialog titles. *(Asserted as judge's call — operator may veto for strict never-600.)* |
| Faint text via low-alpha grays | **Faint text as a real token**, not opacity-over-arbitrary-bg | Opacity on unknown backgrounds is unreliable for placeholders/disabled; a named token is deterministic. |
| `card` = pure white = `background` | **Kept** (pure white + hairline) | Acceptable now that the *overlay* tier carries the floating cue via shadow; inline cards reading flat-on-white is the intended modern aesthetic. |
| Neutral 1px focus ring (no accent) | **NO focus rings at all** — keyboard focus is a **colour/border shift** (operator directive) | Rings are visual noise we don't want. We remove the Tailwind `ring-2`/`outline` everywhere and show **nothing on mouse click** (`:focus-visible` only). But keyboard focus must stay *visible* — WCAG 2.4.7 + enterprise VPAT/508 procurement gates. A ring-free colour/border shift (the language approved for hover, a step stronger so focus≠hover) satisfies both. Overrides Aster's neutral-ring rule **and** the current `base.css` `:focus-visible { outline … outline-ring }`. |
| One neutral system + scoped accents | **Add 2 brand accents: `action` (blue) + `agent` (purple)** | A grayscale-only system has no identity and can't signal "the agent did this." Agentic-enterprise needs an `action` blue (links/selection/info) and a distinct `agent` purple (generative/agent moments). `accent` stays shadcn-neutral. See §1.2 + §3.1.2. |

---

## 1.2 Codex adversarial review — accepted corrections (post-review)

A strict adversarial review (Codex GPT-5) was run against the plan + artifacts. Findings triaged below.
Independently verified where flagged. **These corrections supersede earlier sections where they conflict.**

### Decisions taken (operator)
1. **Blue is renamed `action`** (not `accent`, not `info`). Codex confirmed `accent` is already
   shadcn's *neutral* hover-fill (`bg-accent` across 64 components) and that my "accent blue" both
   collided with it and duplicated `info`. Resolution: `accent` stays neutral; the blue (links,
   selection, active, focus-colour-basis, info alerts) is one token named **`action`** (the colour of
   interactive actions). `info` is retired as a name; info-styled components use `action`.
2. **Form controls get a subtle `secondary` fill** (input/select/textarea) — `neutral-50` (`#fafafa`),
   the whisper-quiet inset fill, so the control reads as active without a heavy gray box; disabled stays
   on `muted`. *Note:* at this subtlety the fill is aesthetic, not a 1.4.11 boundary on its own — the
   input border + neutral focus carry the affordance. If strict 1.4.11 is required for VPAT, strengthen
   the input border (~30%) — flagged. Hairlines stay for cards/dividers.
3. **Dark is co-primary, not derived.** Drops the "re-derive algorithmically" approach (§3.7): both
   themes are designed and gate-validated as equals. (Addresses H13 under-specified derivation + M11
   light-first-not-argued.)

### Confirmed bugs to fix (verified)
- **Gamut (B2):** 8 proposed values clip sRGB — `action`(blue)/`agent`(purple) **fills + hovers +
  actives** at chroma 0.20, `destructive` active at 0.21, and 4 light subtles. Corrected (chroma to
  gamut, AA re-verified): `action` fill `oklch(0.54 0.185 256)` `#006bd6` (was `#0069df`), hover
  `0.49 0.17`, active `0.45 0.155`; `agent` fill `0.53 0.185 295` `#774cc9`, hover `0.48 0.17`, active
  `0.44 0.155`; `destructive` active chroma → 0.19; subtles → chroma ≤0.022.
- **Contrast gate coverage (B6):** `contrast-check.mjs` `PAIRS` still the old 14 — must add every new
  fill/hover/active/text pair (status + `action` + `agent` + faint) **and fail-closed on a missing
  pair** (currently silently skipped).
- **Dark inheritance ships light tokens silently (B8):** `{...light, ...dark}` lets a per-theme token
  (e.g. `agent-subtle`) omitted in dark inherit the *light* value with no error. Add a check: every
  theme-varying token (subtle/text) must be explicitly present in BOTH light and dark.
- **"Phase 1 = zero component edits" is false (H16/H17):** true only for the colour repaint.
  Typography, focus, radius (`rounded-xl` removal), and shadow adoption **require component edits** —
  reframe Phase 1 as "colour repaints free; type/focus/radius/shadow are component-touching."
- **`faint` must not cover captions (H9):** `muted-foreground-faint` is intentionally sub-AA — scope it
  to placeholders/disabled ONLY; captions use `muted-foreground` (AA).
- **`destructive` hex inconsistent (H7):** §3.1 says `#e5484d`/`oklch(0.555 0.205 23)` (=`#d02334`);
  ramp says `#d72630`. Canonical = the ramp `#d72630` (`oklch(0.57 0.21 25)`); reconcile §3.1.
- **`border-strong` missing from deliverables (H15):** add it (data-dense separators, ~14–18%).
- **Focus resolved (M13):** neutral border/colour shift via the `ring` token — never blue, never a halo.
  Per-component focus area + state must be specified in the Phase-2 sweep (B4).
- Minor: `#3b82f6` is 3.68:1 not 3.3:1 (H8, conclusion unchanged); stale `design-md-comparison` outline
  (H6, says 13px/old radius); scorecard "8 new tokens" undercount (N3); ledger reversal entry still
  unwritten (L1).

### Dismissed (planning-phase artifacts, not real blockers)
- **B1/H1** "tokens don't implement the overhaul" / **B7** "sd-hooks can't emit the new vars yet" —
  correct, but that *is* the unstarted Phase-1 work; we are explicitly pre-implementation.
- **H4/M10** "44 existing chart/showcase values out of gamut" — **RESOLVED:** replaced with a new
  in-gamut **8-hue categorical chart palette** (`chart-1…8`, 45°-spaced, light+dark, ≥3:1 vs bg);
  `showcase-*` folded in. See `design.md` §Charts.
- **H2** "ramp perceptually lumpy" — acknowledged; it is a *functional* ramp (steps where used), not an
  even display ramp. Can be evened if we later expose it as a public scale.

---

## 2. What changes, conceptually

Aster is a **product app**; VegaStack is a **64-component library**. We port the *aesthetic* (values
+ scale + philosophy), not the *app* (its shell geometry and art). Three systemic shifts:

1. **Borders become hairlines.** `border`/`input` move from a solid light gray (`oklch 0.922`) to a
   true alpha hairline (`oklch(0 0 0 / 0.07)` light, white-alpha dark). This is the single biggest
   visual change — every card/input/divider in all 64 components gets quieter.
2. **A named, simple type scale arrives.** Today there are **zero** size/weight/line-height tokens;
   components use raw Tailwind (`text-sm`, `font-semibold`). We add a 6-size role-named scale
   (`h1`–`h4`/`body`/`small`), **14px base**, with **body 400, labels/badges 500, headings 600**
   (nothing above 600). §3.2.
3. **The neutral chrome quiets down.** `primary` softens from near-black (`0.205`) to Aster's
   charcoal `#333` (`~0.353`); surfaces flatten toward white; the fainter text grays arrive as
   opacity steps rather than gated tokens.

---

## 3. PHASE 1 — Token system overhaul (no component edits)

**Goal:** new token values + new token categories land; all 64 components repaint automatically via
Tailwind classes; build + contrast gate + typecheck green; live preview shows the new palette.
**No component source is edited in Phase 1.** New type utilities are *additive* (non-breaking).

### 3.0 Palette foundation — the canonical ramp (audit result)

**Every neutral — every gray, black and white — resolves to ONE 14-step ramp** (chroma 0, OKLCH). No
off-ramp one-offs. Translucent neutrals resolve to a **5-step alpha scale** (black in light / white in
dark, like Vercel's `gray-alpha`). Each chromatic accent is **one fixed hue, gate-tuned for lightness**
(its own family — §3.1.1/§3.1.2), not pulled from Tailwind. `chart-1…8` is a new in-gamut 8-hue
categorical palette (design.md §Charts); the old `showcase-*` are folded into it.

**Neutral ramp (`color.neutral.*` primitives, OKLCH L · chroma 0):**

| Step | L | hex | Step | L | hex |
|---|---|---|---|---|---|
| `neutral-0` | 1.000 | `#ffffff` | `neutral-500` | 0.630 | `#898989` |
| `neutral-50` | 0.985 | `#fafafa` | `neutral-550` | 0.560 | `#747474` |
| `neutral-100` | 0.966 | `#f4f4f4` | `neutral-600` | 0.490 | `#606060` |
| `neutral-200` | 0.920 | `#e4e4e4` | `neutral-700` | 0.353 | `#3b3b3b` |
| `neutral-300` | 0.800 | `#bebebe` | `neutral-800` | 0.300 | `#2e2e2e` |
| `neutral-400` | 0.680 | `#989898` | `neutral-850` | 0.255 | `#232323` |
| | | | `neutral-900` | 0.215 | `#191919` |
| | | | `neutral-1000` | 0.000 | `#000000` |

**Alpha scale** (composite over any surface): `alpha-100` 5% · `alpha-200` 9% · `alpha-300` 12% ·
`alpha-400` 16% · `scrim` 28% (light) / 55% (dark).

**Token → ramp map (opaque neutrals):**

| Token | Light | Dark | Used for | Contrast L/D |
|---|---|---|---|---|
| `background` | neutral-0 | neutral-900 | app / page surface | — |
| `foreground` | neutral-900 | neutral-100 | primary text (ink) | 17.5 / 15.9 |
| `card` · `popover` | neutral-0 | neutral-850 | card & overlay surface | — |
| `secondary` | neutral-50 | neutral-800 | subtle inset fill | — |
| `muted` | neutral-100 | neutral-800 | muted fill | — |
| `muted-foreground` | neutral-600 | neutral-400 | secondary text (gated workhorse) | 5.68 / 4.73 |
| `muted-foreground-faint` | neutral-500 | neutral-550 | placeholders / disabled (non-gated) | ~3.5 |
| `accent` | neutral-100 | neutral-800 | hover / active fill | — |
| `primary` | neutral-700 | neutral-200 | primary button (charcoal) | — |
| `primary-foreground` | neutral-0 | neutral-900 | text on primary | 11.2 / 13.8 |
| `ring` | neutral-500 | neutral-550 | focus-colour basis (ring removed → colour shift) | — |
| `sidebar-foreground` | neutral-800 | neutral-300 | sidebar text | 13.6 / 9.4 |

**Token → alpha map (translucent):** `border` alpha-200 (black 9% / white 10%) · `input` alpha-300
(12%) · `sidebar-border` alpha-100 (5% / 6%) · `overlay-border` alpha-400 (16% / 18%) · `overlay`
scrim (28% / 55%).

**Chromatic families (one gate-tuned hue each):** `destructive` red·25 `#d72630` · `success` green·150
`#0c853d` · `warning` orange·42 `#c94d08` · `action` blue·256 `#006bd6` · `agent` purple·295 `#774cc9`
(gamut-corrected, §1.2). Full ramps (fill/hover/active/subtle/text) in §3.1.1–§3.1.2.

### 3.1 Color re-skin — `packages/tokens/tokens/semantic.tokens.json` (light)

Mapping (Aster light → our token → target OKLCH). **Gate-safety notes are binding.**

| Our token | Aster source | Hex | Target OKLCH | Notes |
|---|---|---|---|---|
| `background` | canvas | `#ffffff` | `oklch(1 0 0)` | unchanged |
| `card`, `popover` | surface-card | `#ffffff` | `oklch(1 0 0)` | **was `0.985`** — cards go pure white, hairline-separated |
| `secondary` | surface-strip | `#fafafa` | `oklch(0.985 0 0)` | inset/strip fill |
| `muted` | surface-strip/tile | `#fafafa`/`#f5f5f5` | `oklch(0.97 0 0)` | quiet fill |
| `accent` | fill-active | `#f5f5f5` | `oklch(0.967 0 0)` | active/hover pill |
| `foreground` | ink | `#1a1a1a` | `oklch(0.215 0 0)` | **softens from `0.145`** |
| `primary` | fill-cta | `#333333` | `oklch(0.353 0 0)` | **softens from `0.205`** — charcoal CTA, not ink |
| `primary-foreground` | — | `#ffffff` | `oklch(1 0 0)` | white |
| `secondary-foreground`, `accent-foreground`, `card-foreground`, `popover-foreground` | ink | `#1a1a1a` | `oklch(0.215 0 0)` | |
| `muted-foreground` | **text-secondary** | `#555555` | `oklch(0.49 0 0)` | ⚠ **gate-critical: map to `#555`, NOT `#8a`.** `#8a` on `muted` = ~3:1 → FAILS AA. `#555` ≈ 6.9:1 ✓ |
| `muted-foreground-faint` *(NEW, non-gated)* | text-muted/faint | `#8a8a8a` | `oklch(0.643 0 0)` | placeholders, disabled, captions — the faint step as a real token (§1.1). NOT in the AA pair list (decorative/non-essential text). |
| `border`, `input` | hairline | `rgba(0,0,0,.07)` | `oklch(0 0 0 / 0.09)` | **alpha hairline** — the signature change. **~9%, not Aster's 7%** (§1.1). Overlay tier uses a stronger border — see §3.5. |
| `ring` | text-muted | `#8a8a8a` | `oklch(0.62 0 0)` | neutral focus ring (no accent blue — Aster rule) |
| `overlay` | scrim | `rgba(0,0,0,.28)` | `oklch(0 0 0 / 0.28)` | lighter scrim (was `0.5`) |
| `destructive` | accent-danger | `#d72630` | `oklch(0.57 0.21 25)` | canonical (§3.1.1 ramp); white-fg 4.97:1 ✓ — reconciled (Codex H7) |
| `action` (was `info`/`accent`) | accent-info | `#006bd6` | `oklch(0.54 0.185 256)` | the blue; gamut-corrected (§1.2). Aster's exact `#3b82f6` was only 3.68:1 on white → darkened + de-chroma'd to pass |
| `success` | (none in Aster) | — | retune toward quiet register, L kept AA-safe with white fg |
| `warning` | (none in Aster) | — | retune toward quiet register, L kept AA-safe with white fg |
| `sidebar` | canvas | `#ffffff` | `oklch(1 0 0)` | sidebar = canvas, hairline-only |
| `sidebar-border` | hairline-soft | `rgba(0,0,0,.04)` | `oklch(0 0 0 / 0.04)` | softer than card hairline |
| `sidebar-*` rest | ink/fill ramp | — | mirror the chrome ramp above | |
| `chart-1…8` (NEW) | — | — | **new in-gamut 8-hue categorical palette** (45°-spaced, light+dark, ≥3:1 vs bg); replaces old `chart-*`/`showcase-*`. design.md §Charts |

**New light primitives** (`primitives.tokens.json`): add the measured neutral steps Aster relies on
(`#fafafa 0.985`, `#f5f5f5 0.967`, `#f0f0f0 0.952`, `#333 0.353`, `#555 0.49`, `#8a 0.643`,
`#a9 0.737`) and an alpha-hairline primitive family. Existing OKLCH neutral ramp is extended, not
replaced.

**Dropped (product art, not library tokens):** send-blue, model red-orange, sticky gold, avatar
gradient, tile/plan/modal/apps/panel gradients, traffic lights, run cyan, price-blue pair.

#### 3.1.1 Status color ramps (destructive · success · warning · info)

Each status is a small **functional ramp**, not one value — so the same hue serves a solid button, its
hover/active, a soft alert background, and readable colored text, all AA-clean. Two rules keep it coherent:
(1) the solid **fill is theme-independent** (one identity in light & dark — this fixes the light/dark
misalignment, where light fills had drifted to a muddy ochre/dark green); (2) **every fill carries WHITE
on-fill text** (uniform across red/green/orange/blue/purple), so hover/active simply *darken* away from the
white and contrast only ever rises. Green & orange are deepened so white text clears AA — bright amber can't
carry white (yellow is too luminous), so **warning is a deep orange**. Only `subtle` + `text` adapt per theme.

Tokens per status `{s}`: `{s}` (fill) · `{s}-hover` · `{s}-active` · `{s}-foreground` (on-fill text) —
**theme-independent**; plus `{s}-subtle` (soft bg) · `{s}-text` (readable colour) — **per-theme**. This grows
status from 2 tokens each to 6 (×4 = 24 status tokens). Locked, gate-verified fills (hex):

| Status | fill | hover | active | on-fill | text (light/dark) |
|---|---|---|---|---|---|
| `destructive` | `#d72630` | `#c50220` | `#ac011a` | white | `#c21725` / `#f47b74` |
| `success` | `#0c853d` | `#007433` | `#00672c` | **white** | `#137738` / `#5dc879` |
| `warning` (vivid orange) | `#c94d08` | `#b54303` | `#9f3a01` | **white** | `#a8471b` / `#f7a062` |
| `action` (blue, §3.1.2) | `#006bd6` | `#005dbd` | `#0052a8` | white | `#0065cd` / `#67a6fb` |

All 28 shade/foreground pairs pass AA (verified). Component mapping examples: solid danger button →
`bg-destructive hover:bg-destructive-hover text-destructive-foreground`; error alert →
`bg-destructive-subtle text-destructive-text`. Full visual + live demos in
`docs/research/design-comparison/token-comparison.html` §3.

#### 3.1.2 Accent & AI/agent colours (NEW — brand identity)

The chrome is neutral, but the system gets **two chromatic accents** (each a full ramp like §3.1.1) so it
has identity and can speak the agentic-enterprise language:

- **`action` (blue)** — interactive surfaces: links, selection, active nav, info alerts. (Focus is a
  *neutral* `ring` shift, NOT this blue — §1.2.) `accent` stays shadcn's neutral hover-fill; `info` is
  retired. **Gamut-corrected (Codex B2):** fill `#006bd6` `oklch(0.54 0.185 256)` / hover `#005dbd`
  `0.49 0.17` / active `#0052a8` `0.45 0.155` / white on-fill · subtle+text per theme.
- **`agent` (purple)** — **AI / agent moments**: generative output, agent actions, "the AI did this."
  Distinct from blue so agent surfaces read instantly. **Gamut-corrected:** fill `#774cc9`
  `oklch(0.53 0.185 295)` / hover `#6741b1` `0.48 0.17` / active `#5b399d` `0.44 0.155` / white on-fill ·
  subtle `#f2effe`(l)/`#2b2243`(d) · text `#7447c8`(l)/`#b298f9`(d).

Each is the 6-token ramp shape (`fill`/`-hover`/`-active`/`-foreground`/`-subtle`/`-text`). The `agent`
purple replaces the old orphaned `showcase-purple` (now folded into the chart palette). Open question for
a later pass (logged, not blocking): whether to also add **agent-state semantics** (running/queued/
paused) + streaming/thinking motion tokens — the AI-native layer.

### 3.2 Typography scale — NEW token category (simplified)

Add to `semantic.tokens.json` (theme-invariant → light source only). **Simplified to 6 role-named
sizes** (was 8 cryptic tokens with 1px gaps) — `h1`–`h4` + `body` + `small`, mapping to how people
think. Base body = **14px** (revised from the earlier 13px purism — see §1.1).

| Token | Size | Line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `text-h1` | 24px | 1.25 | **600** | -0.02em | page titles |
| `text-h2` | 20px | 1.3 | **600** | -0.01em | section headings |
| `text-h3` | 18px | 1.35 | **600** | — | subsection & card titles |
| `text-h4` | 16px | 1.45 | **600** | — | minor headings |
| `text-body-lg` | 16px | 1.5 | 400 | — | lead paragraphs (16px @ 400 — h4 size, lighter) |
| `text-body` | **14px** | 1.5 | 400 | — | **default** — body, controls, inputs |
| `text-small` | 12px | 1.45 | 400 | — | captions (400); section labels & badges (use 500) |
| `font-weight-normal` | — | — | 400 | — | default body |
| `font-weight-medium` | — | — | 500 | — | labels, badges, UI emphasis |
| `font-weight-semibold` | — | — | **600** | — | headings (h1–h4). Cap — nothing above 600. |

DTCG types: `dimension` for size/tracking, `number` for line-height/weight. New SD transforms may be
needed for `number`/unitless line-height — verified during impl.

**Binding notes:**
- **No global `body` font-size override** in `base.css` — components self-size via `text-body`; a
  downstream consumer keeps their own document base.
- **Weight rule:** body 400 · labels/badges 500 · **headings (h1–h4) 600**. Nothing above 600.

### 3.3 Radius scale — explicit, **4 steps** (was a 7-step proliferation)

Drop the rarely-used `xl/2xl/3xl` (app-shell scale). Four tokens cover a component library:

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | small inline elements, code chips, tight controls |
| `radius-md` | 8px | **the interactive default** — buttons, inputs, **nav/menu-item hover & active bg** |
| `radius-lg` | 12px | containers — cards, popovers, modals, sheets |
| `radius-full` | 9999px | **round/tag objects** — avatars, switch tracks, badges/chips, status dots, slider thumbs, + deliberate pill CTAs |

**Usage rule (the `rounded-full` question):** `full` is for inherently-round or tag-like objects (+ a
few intentional pill CTAs) — **never** for container highlights. Sidebar/nav row hover & active
backgrounds, menu-item highlights, cards → echo the container with `md`/`lg`. A pill behind a
left-aligned nav row reads as a lozenge and breaks the list rhythm — which is exactly why apps don't
do it.

### 3.4 Motion — minor alignment (optional)

Align `motion-ease-standard` to Aster's `cubic-bezier(.4,0,.2,1)` (currently `(.2,0,0,1)`);
`duration-fast` already 150ms ✓. Low-risk, include for fidelity.

### 3.5 Elevation — flat by default, one subtle overlay shadow

**Flat everywhere by default:** `card`, inputs, panels, table, sidebar — **hairline border, no
shadow**. Only true **overlays** get **one subtle soft shadow** so they read as floating: `dropdown-menu`,
`tooltip`, `popover`, `menu`, `select` (+ `hover-card`, `command`, `context-menu`).

- **One** shadow token — `--shadow-overlay`: `0 4px 14px -4px oklch(0 0 0 / 0.10), 0 2px 4px -2px
  oklch(0 0 0 / 0.06)` (subtle, soft). No multi-tier shadow system; no `shadow-card`.
- **No dramatic modal/dialog drop** — `dialog`/`alert-dialog`/`sheet` use the same subtle
  `shadow-overlay`; the **scrim** carries the separation, keeping the system flat.
- Dark: shadow is near-useless on a dark canvas, so the floating cue in dark is the **lifted surface**
  (`popover`/`card` a step lighter than `background`) + the hairline border — the re-derived dark ramp
  already produces this.

### 3.6 Bridge + build changes

- **`sd-hooks.mjs` `tailwind/inline-bridge`:** extend the hand-coded format to emit
  - the type scale as Tailwind v4 font-size theme vars: `--text-h1…h4`, `--text-body-lg`, `--text-body`,
    `--text-small`, each with `--text-*--line-height` / `--text-*--font-weight` (+ `--tracking-*` where set);
  - `--font-weight-normal/medium/semibold` (400/500/600);
  - the 4 explicit `--radius-*` vars (`sm/md/lg/full`, replacing the hard-coded `calc` lines);
  - the single elevation var `--shadow-overlay` (§3.5).
- **`build-tokens.mjs`:** no structural change; the new tokens flow through the existing 3 SD runs.
  Verify the light/dark symmetric-keyset assertions still hold (type/radius are light-only and
  inherited into the dark model — already handled by `darkModel = {...light, ...dark}`).
- **`tokens.ts` / `tokens.json`:** auto-regenerate; new `TokenName` union picks up the type/radius
  tokens (typecheck must stay green).

### 3.7 Dark mode — co-primary (designed, not derived) — `semantic.dark.tokens.json`

**Dark is co-primary** (§1.2): every token is authored AND gate-validated in dark as an equal to light,
not auto-derived. The neutral ramp is shared (light/dark are mirror references into the same 14-step
ramp); status/`action`/`agent`/subtle/text values are explicit per-theme. The lightness *mirroring* is a
useful starting heuristic, but each dark value is reviewed in the preview, not shipped from a formula.
Borders/inputs become white-alpha hairlines. **Build assertion (Codex B8):** every theme-varying token
(all `*-subtle` / `*-text`) MUST be present in BOTH light and dark sources — the build fails if a dark
value is missing (not silently inherited from light).

### 3.8 Phase 1 verification (gates, in CI order)

```bash
pnpm --filter @vegastack/tokens build      # SD build + contrast gate + tsup
#   → contrast-check.mjs MUST pass all 14 canonical pairs (see §3.1 gate notes)
pnpm --filter @vegastack/ui typecheck      # TokenName union picks up new tokens
pnpm --filter docs dev                     # live preview on :3000
#   → preview_screenshot: confirm hairlines, white cards, charcoal primary, quiet type
```

**Phase 1 exit criteria:** build green, contrast gate green, preview shows the new palette on the
showcase, **zero component files edited**. → STOP, get approval before Phase 2.

---

## 4. PHASE 2 — Component adoption sweep (the 64)

**Goal:** move components off raw Tailwind type/weight onto the named scale, and apply the
"weight-400 default, 500 emphasis, never bold" philosophy. Repainting (color/border/radius) already
happened in Phase 1 via tokens; Phase 2 is **typography + weight + any per-component radius intent**.

### 4.1 The mechanical transform (per component)

- `font-bold`(700) → at most 600; body/UI emphasis → `font-medium` (500); **headings (h1–h4) = 600**.
  Validated case-by-case in the live preview (Geist 500 must still read as emphasis; if not, the size
  step carries hierarchy).
- raw size classes → role utilities: `text-sm`(14)→`text-body`, `text-xs`(12)→`text-small`, heading
  sizes → `text-h1…h4` per role; 16px lead → `text-body-lg`.
- confirm `rounded-*` intent matches the 4-step scale (cards → `rounded-lg` = 12px; nav/menu hover bg →
  `rounded-md`, never `full`; avatars/switches/badges → `rounded-full`).
- no hardcoded values introduced; `design-lint.mjs` stays green.

### 4.2 Wave plan (each wave = author → typecheck → vitest+axe → preview screenshot)

- **Wave 0 — Pilot (5):** `button`, `card`, `input`, `badge`, `dialog`. **Hard stop for your review
  in the live preview** — this is where the Geist type-scale + de-bold is dialed in and ratified.
  Any scale/weight adjustment discovered here flows back into the Phase 1 tokens before Wave 1.
- **Wave 1 — Form (≈18):** textarea, field(+inline), label, checkbox, switch, radio-group, slider,
  select, country/state-select, date/color/emoji-picker, password/otp/auto-save-input.
- **Wave 2 — Display (≈17):** avatar, empty-state, kbd, status-icon, progress(+indicator), skeleton,
  spinner, truncated-text, separator, collapsible, accordion, relative-time, table, markdown-view.
- **Wave 3 — Overlay/Nav (≈16):** alert-dialog, sheet, popover, tooltip, hover-card, dropdown/
  context-menu, tabs, breadcrumb, pagination, page-header, sidebar, command.
- **Wave 4 — Data/Feedback/Misc (≈8):** data-list, filter-bar, alert, sonner, settings-row, image,
  notification-bell, text-edit.

`markdown-view` and `alert-dialog` carry the most `font-semibold` (per grep) — extra care there.

### 4.3 Phase 2 verification (every wave)

```bash
node tooling/design-lint.mjs packages/ui/registry     # token-only, no hardcoded values
cd packages/ui && pnpm exec tsc --noEmit && pnpm exec vitest run   # types + behavior + axe
# live preview: screenshot each converted component's docs page
```

End of Phase 2: full `pnpm build`; **regenerate VRT baselines** (`apps/docs/vrt/components.spec.ts`
— every screenshot changes by design); `pnpm registry:build` + stale-check; add a Changeset
(MINOR — additive token bump per the release skill; the de-bold is a visual refinement, not an API
break).

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Contrast gate fails** on quiet grays / bright accents | §3.1 mapping pre-solved the two known collisions (`muted-foreground`→`#555`; `action`/blue darkened). Gate runs in Phase 1 before any component work. |
| **Geist ≠ SF metrics** — Aster px sizes read wrong | Sizes are *provisional*; ratified live in the Pilot wave before the sweep. |
| **`font-medium` too light in Geist** to carry emphasis | Validated in Pilot; fall back to size-step hierarchy if 500 doesn't read. |
| **Alpha hairlines too faint** on some surfaces | Default `border` set at ~9% (not Aster's 7%); overlay tier uses a stronger border + soft shadow (§3.5); `sidebar-border` stays softer (0.04). Final alpha picked in preview. |
| **Hairlines mush in data-dense UIs** (tables/grids/logs) | A 9% line is fine for one card but loses legibility when dozens repeat close together (and dips under the 3:1 non-text-contrast comfort zone). Data-dense surfaces use a **stronger separator** (a `border-strong` ~14–18% token) and/or zebra striping + a firmer header rule — keep the quiet 9% for cards/sparse chrome only. Matters for us specifically (agentic-enterprise = dense data). |
| **Overlays read flat** in light mode | Resolved by design: overlays (dropdown/tooltip/popover/menu/select) get one subtle `shadow-overlay` + hairline border; everything else stays flat (§3.5). |
| **VRT baseline churn** masks a real regression | Rebaseline only at end of Phase 2, after visual sign-off, so diffs are reviewed once intentionally. |
| **Overriding locked palette** confuses future agents | Write a decision-reversal entry in `docs/ledger/` (Phase 1, task 0). |
| **Downstream consumers** on old tokens | Additive MINOR bump; no token *removed* or *renamed* (re-skin only) → no break. |

## 6. Out of scope (explicit)

- Skills `references/` layer + `design-system/SKILL.md` dead-link fix (decision 7).
- Aster product-app surfaces (app-shell, composer, plans/phone/modal/apps pages) and their art.
- `canvas`/`ink`/`hairline` vocabulary alias layer.
- Spacing tokens (Tailwind v4's 4px scale already covers Aster's numeric spacing; semantic layout
  widths are product-app, dropped).
- npm publish / Cloudflare deploy (operator-triggered, post-review).

## 7. Deliverables checklist

**Phase 1:** `docs/ledger/` reversal entry · re-skinned `semantic.tokens.json` + extended
`primitives.tokens.json` · new typography (6-size `h1`–`h4`/`body`/`small`, 14px base, 400/500/600) +
radius (4-step `sm/md/lg/full`) + elevation (`shadow-overlay`) + faint-text tokens · extended `sd-hooks.mjs` bridge ·
algorithmic `semantic.dark.tokens.json` · green build + contrast gate + typecheck · preview proof.
**Phase 2:** 64 components swept in 5 waves · green lint/types/vitest/axe per wave · rebaselined VRT ·
`registry:build` + stale-check · Changeset.

## 8. Open items to confirm at Phase 1 kickoff (not blockers)

1. Final `action`/`success`/`warning`/`destructive` OKLCH lightness — dialed to the AA floor in impl.
2. Exact hairline alpha (0.07 vs 0.08) — picked in preview.
3. Whether to align `motion-ease-standard` (§3.4) or leave as-is.
