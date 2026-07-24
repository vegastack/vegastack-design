---
version: 1.0
name: VegaStack
description: >
  VegaStack's design system for building agentic-enterprise product UI — Base UI + Tailwind v4,
  OKLCH tokens, light & dark as co-primary themes. Calm neutral chrome (white-on-hairline), two brand
  accents (`action` blue for interactivity, `agent` purple for AI moments), and a strict WCAG 2.1 AA
  contrast contract. Colours are OKLCH (Display-P3-capable) with an sRGB hex fallback.

# ── COLOURS ──────────────────────────────────────────────────────────
# Every neutral (every grey, black, white) resolves to ONE 14-step ramp (chroma 0). Translucent
# neutrals resolve to a 5-step alpha scale (black in light / white in dark). Each chromatic accent is
# one fixed hue, gate-tuned for lightness. Charts are a separate data-viz scale (see §Colours).
colors:
  ramp:                       # neutral ramp — OKLCH L (chroma 0) → sRGB hex. Shared by light & dark.
    neutral-0:    "#ffffff"   # L 1.000
    neutral-50:   "#fafafa"   # L 0.985
    neutral-100:  "#f4f4f4"   # L 0.966
    neutral-200:  "#e4e4e4"   # L 0.920
    neutral-300:  "#bebebe"   # L 0.800
    neutral-400:  "#989898"   # L 0.680
    neutral-500:  "#898989"   # L 0.630
    neutral-550:  "#747474"   # L 0.560
    neutral-600:  "#606060"   # L 0.490
    neutral-700:  "#3b3b3b"   # L 0.353
    neutral-800:  "#2e2e2e"   # L 0.300
    neutral-850:  "#232323"   # L 0.255
    neutral-900:  "#191919"   # L 0.215
    neutral-1000: "#000000"   # L 0.000
  alpha:                      # translucent neutrals — black in light, white in dark. Composite over any surface.
    alpha-100: "5%"           # softest divider (sidebar/region)
    alpha-200: "9%"           # default hairline border
    alpha-300: "12%"          # input / field border
    alpha-400: "16%"          # overlay edge
    scrim:     "28% / 55%"    # modal backdrop (light / dark)

  light:                      # semantic tokens → ramp step (light theme)
    background:               "#ffffff"   # neutral-0
    foreground:               "#191919"   # neutral-900  (ink)
    card:                     "#ffffff"   # neutral-0
    card-foreground:          "#191919"   # neutral-900
    popover:                  "#ffffff"   # neutral-0
    popover-foreground:       "#191919"   # neutral-900
    secondary:                "#fafafa"   # neutral-50   (subtlest inset fill — input bg)
    secondary-foreground:     "#191919"   # neutral-900
    muted:                    "#f4f4f4"   # neutral-100
    muted-foreground:         "#606060"   # neutral-600  (secondary text — the gated workhorse)
    muted-foreground-faint:   "#898989"   # neutral-500  (placeholders/disabled ONLY — intentionally sub-AA)
    accent:                   "#f4f4f4"   # neutral-100  (neutral hover/active fill — NOT a colour)
    accent-foreground:        "#191919"   # neutral-900
    primary:                  "#3b3b3b"   # neutral-700  (charcoal CTA)
    primary-foreground:       "#ffffff"   # neutral-0
    ring:                     "#898989"   # neutral-500  (focus-colour basis — NEUTRAL, never blue)
    border:                   "rgba(0,0,0,.09)"   # alpha-200  (default hairline)
    border-strong:            "rgba(0,0,0,.14)"   # data-dense tables/grids + secondary-control borders
    input:                    "rgba(0,0,0,.12)"   # alpha-300
    overlay-border:           "rgba(0,0,0,.16)"   # alpha-400
    overlay:                  "rgba(0,0,0,.28)"   # scrim
    sidebar:                  "#ffffff"   # neutral-0
    sidebar-foreground:       "#2e2e2e"   # neutral-800
    sidebar-border:           "rgba(0,0,0,.05)"   # alpha-100
  dark:                       # semantic tokens → ramp step (dark theme — co-primary, authored & gate-validated)
    background:               "#191919"   # neutral-900
    foreground:               "#f4f4f4"   # neutral-100
    card:                     "#232323"   # neutral-850
    card-foreground:          "#f4f4f4"   # neutral-100
    popover:                  "#232323"   # neutral-850
    popover-foreground:       "#f4f4f4"   # neutral-100
    secondary:                "#232323"   # neutral-850  (subtlest inset fill — input bg)
    secondary-foreground:     "#f4f4f4"   # neutral-100
    muted:                    "#2e2e2e"   # neutral-800
    muted-foreground:         "#989898"   # neutral-400
    muted-foreground-faint:   "#747474"   # neutral-550
    accent:                   "#2e2e2e"   # neutral-800
    accent-foreground:        "#f4f4f4"   # neutral-100
    primary:                  "#e4e4e4"   # neutral-200
    primary-foreground:       "#191919"   # neutral-900
    ring:                     "#747474"   # neutral-550
    border:                   "rgba(255,255,255,.10)"
    border-strong:            "rgba(255,255,255,.16)"
    input:                    "rgba(255,255,255,.12)"
    overlay-border:           "rgba(255,255,255,.18)"
    overlay:                  "rgba(0,0,0,.55)"
    sidebar:                  "#191919"   # neutral-900
    sidebar-foreground:       "#bebebe"   # neutral-300
    sidebar-border:           "rgba(255,255,255,.06)"

  # chromatic families — each is one fixed hue, six tokens. Values are "light / dark" where they differ;
  # fill/hover/active/foreground are theme-independent. White on-fill text is uniform across all five.
  destructive:                # red · hue 25 · danger / errors
    fill:       "#d72630"      # white-on-fill 4.97:1
    hover:      "#c50220"
    active:     "#ac011a"
    foreground: "#ffffff"
    subtle:     "#fde9e7 / #441715"
    text:       "#c21725 / #f47b74"   # readable colour on page/subtle
  success:                    # green · hue 150 · success / positive
    fill:       "#0c853d"      # 4.74:1
    hover:      "#007433"
    active:     "#00672c"
    foreground: "#ffffff"
    subtle:     "#d8f9dd / #0d3017"
    text:       "#137738 / #5dc879"
  warning:                    # deep orange · hue 42 · warning / caution
    fill:       "#c94d08"      # 4.61:1   (bright amber can't carry white text — yellow is too luminous)
    hover:      "#b54303"
    active:     "#9f3a01"
    foreground: "#ffffff"
    subtle:     "#feeee8 / #441b09"
    text:       "#a8471b / #f7a062"
  action:                     # blue · hue 256 · interactive — links, selection, active, info
    fill:       "#006bd6"      # 5.16:1
    hover:      "#005dbd"
    active:     "#0052a8"
    foreground: "#ffffff"
    subtle:     "#eaf3fe / #122844"
    text:       "#0065cd / #67a6fb"
  agent:                      # purple · hue 295 · AI / agent moments — generative output, agent actions
    fill:       "#774cc9"      # 5.74:1
    hover:      "#6741b1"
    active:     "#5b399d"
    foreground: "#ffffff"
    subtle:     "#f2effe / #2b2243"
    text:       "#7447c8 / #b298f9"

  charts:                     # categorical data-viz — 8 evenly-spaced hues (45° apart), in-gamut,
    chart-1: "#c74b47 / #f2716a"   # red    · hue 25   · ≥3:1 vs bg both themes.  Format "light / dark"
    chart-2: "#a96b00 / #d98b09"   # amber  · hue 70   · (light marks L0.58, dark marks L0.70)
    chart-3: "#5a8b00 / #7db138"   # green  · hue 130
    chart-4: "#009168 / #01ba87"   # teal   · hue 165
    chart-5: "#088a9b / #09b2c7"   # cyan   · hue 210
    chart-6: "#2f79d6 / #569fff"   # blue   · hue 256
    chart-7: "#8a5fc9 / #ae84f2"   # purple · hue 300
    chart-8: "#b94c90 / #e271b5"   # pink   · hue 345

# ── TYPOGRAPHY ───────────────────────────────────────────────────────
# Geist Sans for UI & prose; Geist Mono for code, data, and tabular figures. Six role-named sizes.
# Weights: 400 default · 500 labels/badges · 600 headings (cap — nothing above 600).
typography:
  fontFamily: { sans: "Geist Sans", mono: "Geist Mono" }
  text-h1:      { fontSize: 24px, lineHeight: 1.25, fontWeight: 600, letterSpacing: "-0.02em" }
  text-h2:      { fontSize: 20px, lineHeight: 1.30, fontWeight: 600, letterSpacing: "-0.01em" }
  text-h3:      { fontSize: 18px, lineHeight: 1.35, fontWeight: 600 }
  text-h4:      { fontSize: 16px, lineHeight: 1.45, fontWeight: 600 }
  text-body-lg: { fontSize: 16px, lineHeight: 1.50, fontWeight: 400 }
  text-body:    { fontSize: 14px, lineHeight: 1.50, fontWeight: 400 }   # DEFAULT
  text-small:   { fontSize: 12px, lineHeight: 1.45, fontWeight: 400 }   # captions 400 · labels/badges 500
  weights:      { normal: 400, medium: 500, semibold: 600 }

# ── SPACING & LAYOUT ─────────────────────────────────────────────────
spacing:        # 4px base scale (Tailwind v4)
  base: 4px
  1: 4px;  2: 8px;  3: 12px;  4: 16px;  6: 24px;  8: 32px;  10: 40px;  12: 48px;  16: 64px
breakpoints: { sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px }

# ── SHAPES ───────────────────────────────────────────────────────────
rounded:        # four steps; the last is fully round
  sm:   6px     # small inline elements, code chips, tight controls
  md:   8px     # the interactive default — buttons, inputs, nav/menu-item hover & active backgrounds
  lg:   12px    # containers — cards, popovers, modals, sheets
  full: 9999px  # round/tag objects — avatars, switch tracks, badges/chips, status dots, slider thumbs, pill CTAs

# ── ELEVATION ────────────────────────────────────────────────────────
# Flat by default (hairline border, no shadow). Only overlays get one subtle shadow.
shadows:
  shadow-overlay: "0 4px 14px -4px rgba(0,0,0,.10), 0 2px 4px -2px rgba(0,0,0,.06)"   # dropdown/tooltip/popover/menu/select/dialog/sheet

# ── MOTION ───────────────────────────────────────────────────────────
motion:
  duration: { fast: 150ms, base: 200ms, slow: 300ms }   # state · popover/tooltip · overlay/modal
  ease-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  reducedMotion: "honour prefers-reduced-motion — drop non-essential motion"

# ── COMPONENTS (token recipes; full specs in §Components) ────────────
components:
  button-primary:     { background: primary, color: primary-foreground, rounded: md, height: 34px, typography: "text-body / 500" }
  button-action:      { background: action.fill, hover: action.hover, color: action.foreground, rounded: md, height: 34px }
  button-agent:       { background: agent.fill, hover: agent.hover, color: agent.foreground, rounded: md, height: 34px }
  button-secondary:   { background: card, border: border-strong, color: foreground, rounded: md, height: 34px }
  button-ghost:       { background: transparent, hover: accent, color: foreground, rounded: md, height: 34px }
  button-destructive: { background: destructive.fill, hover: destructive.hover, color: destructive.foreground, rounded: md, height: 34px }
  input:              { background: secondary, border: input, focusBorder: ring, rounded: md, height: 36px, typography: text-body }
  card:               { background: card, border: border, rounded: lg, shadow: none }
  badge:              { background: "{status}.subtle", color: "{status}.text", rounded: full, typography: "text-small / 500" }
  alert:              { background: "{status}.subtle", color: "{status}.text", rounded: md, icon: required }
  dialog:             { background: popover, border: overlay-border, rounded: lg, shadow: shadow-overlay, scrim: overlay }
  dropdown:           { background: popover, border: overlay-border, rounded: md, shadow: shadow-overlay, itemHover: accent, itemRadius: sm }
---

# VegaStack Design

## Overview

VegaStack is a design system for building **agentic-enterprise** product interfaces — admin consoles,
dashboards, and AI/agent surfaces (chat, reasoning, tool calls, workflows). It is built on **Base UI**
primitives + **Tailwind v4**, with **OKLCH** design tokens served as a public token layer and a private
shadcn component registry.

**Light and dark are co-primary** — neither is derived; every token is authored and contrast-validated
in both. The aesthetic is **calm neutral chrome**: surfaces are white (or near-black in dark) and
articulated by **hairline alpha borders**, not heavy fills or shadows. Colour is reserved and meaningful.

**Key characteristics**

- **One neutral ramp.** Every grey, black, and white resolves to a single 14-step OKLCH scale; translucent neutrals to a 5-step alpha scale (black in light, white in dark).
- **Hairline depth, flat by default.** 1px alpha borders carry separation; only overlays get a single subtle shadow.
- **Two brand accents with distinct jobs.** `action` (blue) = interactive (links, selection, active, info); `agent` (purple) = AI/agent moments. Neither is the focus colour.
- **Quiet, compact type.** 14px body, a six-step role scale, weight 400 default and never above 600.
- **AA by contract.** Every gated foreground/background pair clears WCAG 2.1 AA, enforced by a fail-closed build gate.

## Colours

### The neutral ramp

Every neutral — every grey, black, and white — is one of 14 steps on a single OKLCH (chroma 0) ramp,
shared by both themes. Light and dark are **mirror references** into it (e.g. `foreground` is
`neutral-900` in light and `neutral-100` in dark). See the frontmatter `colors.ramp` for exact values.

### Surfaces, text & lines

- **`background`** is the page; **`card`/`popover`** are surfaces (white in light; lifted to `neutral-850` in dark).
- **`secondary`** (`neutral-50` light / `neutral-850` dark) is the _subtlest_ inset fill — used for input/control backgrounds. **`muted`** is one step stronger. **`accent`** is the neutral hover/active fill (it is _not_ a colour — `bg-accent` must never be blue).
- **Text ramp:** `foreground` (ink) → `muted-foreground` (secondary text, the gated workhorse, AA) → `muted-foreground-faint` (placeholders & disabled **only** — intentionally below AA; never use it for content, including captions).
- **`primary`** is a charcoal (`neutral-700`), deliberately softer than ink, for the single most important action.
- **Borders are alpha hairlines:** `border` 9% · `border-strong` 14% (data-dense tables/grids, where many faint lines would otherwise mush) · `input` 12% · `sidebar-border` 5% · `overlay-border` 16% — black in light, white in dark, so they composite over any surface. (`ring` is the neutral focus-colour basis — see Accessibility.)
- **The sidebar** is a self-contained surface: `sidebar` / `sidebar-foreground` / `sidebar-border` (above). Its active, hover, and focus states **reuse the main `primary` / `accent` / `ring`** — there is no separate `sidebar-primary` / `sidebar-accent` / `sidebar-ring`.

### Chromatic accents

The chrome is neutral; colour carries meaning. Five hue families, each a six-token ramp
(`fill` / `hover` / `active` / `foreground` / `subtle` / `text`). **All five use white on-fill text**
uniformly; `hover`/`active` darken away from the white so contrast only rises. `subtle` (soft tinted
background) and `text` (the readable colour for the page/alert) adapt per theme.

| Family        | Role                                        | Fill      | On-fill        | Notes                                                         |
| ------------- | ------------------------------------------- | --------- | -------------- | ------------------------------------------------------------- |
| `destructive` | danger, errors, destructive actions         | `#d72630` | white (4.97:1) | red, hue 25                                                   |
| `success`     | success, positive state                     | `#0c853d` | white (4.74:1) | green, hue 150                                                |
| `warning`     | warning, caution                            | `#c94d08` | white (4.61:1) | **deep orange**, hue 42 — bright amber can't carry white text |
| `action`      | interactive: links, selection, active, info | `#006bd6` | white (5.16:1) | blue, hue 256                                                 |
| `agent`       | AI / agent moments                          | `#774cc9` | white (5.74:1) | purple, hue 295                                               |

**Usage rules**

- `action` is for _interactivity_ (links, selection, active nav, info alerts) — **not** the focus colour (focus is the neutral `ring`).
- `agent` is reserved for _AI/agent_ surfaces (generative output, agent actions, "the AI did this") so they're instantly distinct from ordinary controls.
- `info` is **not** a token name — informational UI uses `action`.
- For a solid button use `{family}.fill` + white text; for an alert/badge use `{family}.subtle` background + `{family}.text`; for hover/active step to `{family}.hover` / `.active`.

### Charts & data-viz

A separate **8-hue categorical palette** (`chart-1…8`) for data series — intentionally outside the
quiet-chrome discipline, because data needs hue separation. The hues are evenly spaced (45° apart) at a
consistent lightness/chroma register, so a chart reads as one family yet every series stays distinct.
Each token has a **light** mark (L 0.58) and a brighter **dark** mark (L 0.70). All are in sRGB gamut and
clear the WCAG 1.4.11 non-text bar against their background — light marks ≥4.0:1 on white, dark marks
≥6:1 on the dark canvas. Assign in order (`chart-1` first); for more than 8 series, encode with pattern
or texture rather than reuse a hue. This palette **supersedes the old `showcase-*` tokens.** As with all
state, never rely on colour alone — label series directly, or via a legend plus an icon/dash pattern.

## Typography

**Geist Sans** sets UI and prose; **Geist Mono** sets code, data, and tabular figures. Six role-named
sizes (the frontmatter carries exact `fontSize`/`lineHeight`/`fontWeight`/`letterSpacing`):

- **Headings** `text-h1`(24) → `text-h4`(16), all **600**, tracking tightens as size grows.
- **Body** `text-body`(14, **default**) and `text-body-lg`(16) for leads.
- **Small** `text-small`(12) — captions at 400; section labels and badges at 500.

**Principles**

- **14px is the default**, chosen for the reading-heavy surfaces of an agentic-enterprise product (logs, descriptions, agent output). Dense product surfaces (e.g. an agent console) may drop body to a 13px _compact_ density where warranted — this is a documented allowance, applied per-surface, not a separate token.
- **Weight rule:** 400 body · 500 labels/badges · **600 headings**. Nothing above 600. At most two weights in one view.
- **Colour does hierarchy work:** `foreground` title over `muted-foreground` subtitle at the same size reads as two clear levels.
- **Apply the type tokens** — never hand-set font-size, line-height, or weight.

## Layout

- **Spacing** is a 4px scale (frontmatter `spacing`). Rhythm: 8px inside a group, 16px between groups, 32–40px between sections. Cards use 16px padding (24px roomy, 12px compact).
- **Breakpoints** `sm`–`2xl` per the frontmatter; every layout must work on mobile and desktop.
- **Density:** chrome is compact (28–36px control heights, 14px type) while the canvas around the working column stays open.

## Elevation & Depth

**Flat by default.** Cards, inputs, panels, tables, and the sidebar are **hairline border, no shadow.**
Only true **overlays** — `dropdown` · `tooltip` · `popover` · `menu` · `select` · `dialog` · `sheet` —
get **one subtle shadow** (`shadow-overlay`) plus the stronger `overlay-border`.

- There is **one** shadow token; no multi-tier shadow system.
- **Dialogs** rely on the **scrim** + `shadow-overlay`, not a dramatic drop.
- **In dark**, shadows are near-invisible on a dark canvas — the floating cue is the **lifted surface** (`popover`/`card` a step above `background`) plus the border.

## Motion

Use motion only to clarify a change. Most interactions feel instant. Durations: **150ms** state changes,
**200ms** popovers/tooltips, **300ms** overlays/modals; easing **`cubic-bezier(0.4, 0, 0.2, 1)`**. Avoid
long, looping, or attention-grabbing animation, and **honour `prefers-reduced-motion`** (drop non-essential motion).

## Shapes

Four radii (frontmatter `rounded`): `sm` 6 · `md` 8 · `lg` 12 · `full`.

**The `rounded-full` rule** — `full` is for inherently round / tag-like objects (avatars, switch tracks,
badges/chips, status dots, slider thumbs) and _deliberate_ pill CTAs. **Container highlights echo their
container's geometry** — sidebar/nav-row hover & active backgrounds, menu-item highlights, and cards use
`md`/`lg`, **never** `full` (a pill behind a left-aligned row reads as a lozenge and breaks the rhythm).
Keep one radius family per view.

## Components

Each component composes from tokens (frontmatter `components` gives the recipe). Defaults below are the
medium size; control heights step **sm 28 / md 34 / lg 40**.

- **Button** — `primary` (charcoal `primary` fill, white label) for the single most important action; `action` (blue) and `agent` (purple) for interactive and AI actions; `secondary` (card fill + stronger border) and `ghost` (transparent, `accent` hover) for lower emphasis; `destructive` (solid red) and _soft_ variants (`{status}.subtle` fill + `{status}.text`) for status actions. Radius `md`; `text-body`/500 label. Hover steps the fill colour; **focus is a neutral border/colour shift, never a ring**.
- **Input / Select / Textarea** — `secondary` fill (the subtlest, so it reads active not greyed), `input` hairline border, radius `md`, 36px. **On focus the border darkens to `ring` (neutral)** — not blue. Error uses a `destructive` border + `destructive.text` helper. Disabled uses `muted` fill + `muted-foreground-faint`.
- **Card / Panel** — `card` surface, `border` hairline, radius `lg`, **flat (no shadow)**.
- **Badge / Chip / Tag** — radius `full`; status badges use `{status}.subtle` + `{status}.text` (+ a 6px status dot); neutral badge uses `muted`.
- **Alert** — `{status}.subtle` background + `{status}.text`, radius `md`, **always paired with an icon** (never colour alone).
- **Dialog / Modal** — `popover` surface, `overlay-border`, radius `lg`, `shadow-overlay`, over the `overlay` scrim. Title `text-h3`; actions right-aligned (`ghost` Cancel + intent button).
- **Dropdown / Menu / Popover / Tooltip** — `popover` surface, `overlay-border`, `shadow-overlay`; menu items use `accent` hover at radius `sm`; destructive items use `destructive.text`.
- **Tabs** — underline tabs; the active tab's underline is `action`.
- **Switch / Checkbox / Radio** — `action` when on/checked; radius `full` (switch/radio) or `sm` (checkbox).
- **Status indicators** — running dot `action`, succeeded `success`, failed `destructive`, queued/idle a `ring` ring; reasoning/streaming use `agent`.

## Voice & Content

Copy is part of the design — precise, no filler.

- **Case:** Title Case for labels, buttons, titles, and tabs; sentence case for body, helper text, and toasts.
- **Actions** name a verb + noun (`Deploy Project`, `Delete Member`) — never `Confirm`, `OK`, or a bare verb.
- **Errors** state what happened plus what to do: `Build failed. Bundle exceeds 50 MB. Reduce it or raise the limit.`
- **Toasts** name the specific thing, drop the trailing period, and never say "successfully": `Project deleted`, not `Successfully deleted the project.`
- **Empty states** point to the first action: `No deployments yet. Push to your Git repository to create one.`
- **In-progress** uses the present participle + ellipsis: `Deploying…`, `Reasoning…`.
- Use numerals (`3 projects`), curly quotes, and the ellipsis character; skip "please" and marketing superlatives.

## Do's and Don'ts

**Do**

- Use **semantic tokens only** — `bg-primary`, `text-muted-foreground`, `border-border`. Apply **type tokens** instead of hand-set size/weight.
- Rank information with the neutral ramp: `foreground` primary text, `muted-foreground` secondary, `muted-foreground-faint` disabled.
- Keep colour for state and the single most important action. Pair every state colour with an icon or text label.
- Hold **WCAG AA** (4.5:1 body text). Show a **neutral focus state** on every interactive element at `:focus-visible`.
- Use `action` for interactivity, `agent` for AI moments, `accent`(neutral) for hover fills.

**Don't**

- Don't hardcode hex/px, use raw palettes (`bg-neutral-900`), or off-scale arbitrary values.
- Don't make `accent` (the neutral hover fill) a colour, or use `action`/`agent`/`info` interchangeably.
- Don't put a **blue (or any coloured) focus ring** on anything — focus is the neutral `ring` shift. Don't remove focus without a visible replacement.
- Don't add shadows to flat surfaces (cards/inputs/panels) — only overlays.
- Don't use `rounded-full` for container highlights (nav hover, menu item, card); don't mix radius families or use more than two font weights in one view.
- Don't signal state with colour alone.

## Accessibility

- **WCAG 2.1 AA.** Every canonical foreground/background pair clears **4.5:1** (normal text), enforced by a **fail-closed** contrast gate in CI (computed from OKLCH); a missing pair fails the build. All five status/accent fills pass white-on-fill AA; `muted-foreground` passes; `muted-foreground-faint` is deliberately sub-AA and scoped to non-essential text only.
- **Focus is keyboard-only and neutral.** No focus indicator on mouse click (`:focus-visible`); keyboard focus is a neutral `ring` border/colour shift — visible and compliant, never a blue halo, never removed.
- **Form controls** are perceivable via a `secondary` fill + border (and, for strict 1.4.11/VPAT, an opt-in stronger input border).
- **Never signal by colour alone** (WCAG 1.4.1) — pair status colour with an icon or label.
- Respect **`prefers-reduced-motion`**.

---

> **Provenance.** This document is the canonical specification for the finalized token system. The values
> here are intended to be **generated from `@vegastack/tokens`** (DTCG → OKLCH) with a CI drift-check, so the
> spec can never diverge from the shipped tokens; the prose sections (Overview, Voice, Do/Don't,
> Accessibility) are the hand-authored layer. Decision history and the implementation plan live in
> `docs/plans/design-token-overhaul.md`.
