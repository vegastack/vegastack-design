---
version: 2.0
name: VegaStack
description: >
  VegaStack's design system for building agentic-enterprise product UI — Base UI + Tailwind v4,
  OKLCH tokens, light & dark as co-primary themes. Warm-neutral chrome (subtle hue-75 warmth, not pure
  grey), a neutral-ink primary that does the bulk of the work — including the key action, selection, and
  active/value accents — and colour rationed to ONE chromatic: `info` (blue) for links and informational
  UI, plus three status hues. One solid warm border, one neutral focus ring, strict WCAG 2.1 AA.

# ── COLOURS ──────────────────────────────────────────────────────────
# Every neutral resolves to ONE 14-step warm ramp (OKLCH hue 75, chroma ~0.003) shared by both themes.
# There is ONE solid border token plus a scrim — no separate alpha scale. Each chromatic is
# one fixed hue, gate-tuned for lightness. Charts are a separate data-viz scale (see §Colours).
colors:
  ramp:                       # warm neutral ramp — OKLCH hue 75, chroma ~0.003 → sRGB hex. Shared by light & dark.
    neutral-0:    "#fefdfc"   # warm white (canvas)
    neutral-50:   "#fbfaf8"   # subtlest inset fill
    neutral-100:  "#f5f3f2"   # muted surface / neutral hover
    neutral-200:  "#e6e4e2"
    neutral-300:  "#bfbdbc"   # switch/toggle off-track
    neutral-400:  "#999896"
    neutral-500:  "#8a8987"   # faint text (placeholders/disabled only)
    neutral-550:  "#757472"
    neutral-600:  "#61605e"   # muted-foreground (secondary text — the gated workhorse)
    neutral-700:  "#3c3b3a"   # primary (neutral-ink action) — light
    neutral-800:  "#2c2b2a"
    neutral-850:  "#1f1e1d"   # card surface — dark
    neutral-900:  "#131211"   # ink / dark canvas (deep, not espresso)
    neutral-1000: "#000000"

  light:                      # semantic tokens → ramp step (light theme)
    background:               "#fefdfc"   # neutral-0
    foreground:               "#131211"   # neutral-900  (ink)
    card:                     "#fefdfc"   # neutral-0
    card-foreground:          "#131211"   # neutral-900
    popover:                  "#fefdfc"   # neutral-0
    popover-foreground:       "#131211"   # neutral-900
    secondary:                "#fbfaf8"   # neutral-50   (subtlest inset fill — input bg)
    secondary-foreground:     "#131211"   # neutral-900
    muted:                    "#f5f3f2"   # neutral-100
    muted-foreground:         "#61605e"   # neutral-600  (secondary text — AA workhorse)
    muted-foreground-faint:   "#8a8987"   # neutral-500  (placeholders/disabled ONLY — intentionally sub-AA)
    accent:                   "#f5f3f2"   # neutral-100  (neutral hover/selected fill — NOT a colour; shadcn `accent`)
    accent-foreground:        "#131211"   # neutral-900
    primary:                  "#3c3b3a"   # neutral-700  (neutral-ink CTA — the workhorse)
    primary-hover:            "#2c2b2a"   # neutral-800
    primary-active:           "#1f1e1d"   # neutral-850
    primary-foreground:       "#fbfaf8"   # neutral-50 (uniform on-fill text)
    ring:                     "#3c3b3a"   # = primary  (focus border basis — neutral ink, never a colour)
    track:                    "#bfbdbc"   # neutral-300 (switch/toggle off-track)
    border:                   "#e6e4e2"   # neutral-200 — ONE solid warm border (cards/inputs/tables/overlays); input & sidebar-border alias to it
    scrim:                    "rgba(19,18,17,.28)"   # modal backdrop
    sidebar:                  "#fefdfc"   # neutral-0
    sidebar-foreground:       "#2c2b2a"   # neutral-800
  dark:                       # semantic tokens → ramp step (dark theme — co-primary, authored & gate-validated)
    background:               "#131211"   # neutral-900
    foreground:               "#f5f3f2"   # neutral-100
    card:                     "#1f1e1d"   # neutral-850
    card-foreground:          "#f5f3f2"   # neutral-100
    popover:                  "#1f1e1d"   # neutral-850
    popover-foreground:       "#f5f3f2"   # neutral-100
    secondary:                "#1f1e1d"   # neutral-850  (input bg)
    secondary-foreground:     "#f5f3f2"   # neutral-100
    muted:                    "#2c2b2a"   # neutral-800
    muted-foreground:         "#999896"   # neutral-400
    muted-foreground-faint:   "#757472"   # neutral-550
    accent:                   "#2c2b2a"   # neutral-800  (neutral hover/selected fill)
    accent-foreground:        "#f5f3f2"   # neutral-100
    primary:                  "#e6e4e2"   # neutral-200  (light-ink CTA in dark)
    primary-hover:            "#f5f3f2"   # neutral-100
    primary-active:           "#fefdfc"   # neutral-0
    primary-foreground:       "#131211"   # neutral-900
    ring:                     "#e6e4e2"   # = primary
    track:                    "#61605e"   # neutral-600
    border:                   "#2c2b2a"   # neutral-800 (input & sidebar-border alias to it)
    scrim:                    "rgba(0,0,0,.55)"
    sidebar:                  "#131211"   # neutral-900
    sidebar-foreground:       "#bfbdbc"   # neutral-300

  # chromatic families — each is one fixed hue, six tokens. Values are "light / dark" where they differ;
  # fill/hover/active/foreground are theme-independent (identical in light & dark). On-fill text is
  # uniform across all families: neutral-50 (#fbfaf8) — a warm off-white, NOT pure white.
  # `bright` is the lightened mark some families expose for dark data-viz series.
  info:                       # blue · hue 256 · links + informational UI (badges, alerts)
    fill:       "#0068d2"      # 5.13:1
    hover:      "#0059c1"
    active:     "#004cb3"
    foreground: "#fbfaf8"     # neutral-50 — warm off-white
    subtle:     "#eaf3fe / #122844"
    text:       "#0e66c8 / #6aaafe"
    bright:     "#64a6ff"
  destructive:                # red · hue 25 · danger / errors
    fill:       "#c10007"      # 6.15:1
    hover:      "#af0000"
    active:     "#a10000"
    foreground: "#fbfaf8"     # neutral-50 — warm off-white
    subtle:     "#fde9e7 / #441715"
    text:       "#c21725 / #f47b74"
  success:                    # green · hue 150 · success / positive
    fill:       "#007b2a"      # 5.23:1
    hover:      "#006c1a"
    active:     "#00600b"
    foreground: "#fbfaf8"     # neutral-50 — warm off-white
    subtle:     "#d8f9dd / #0d3017"
    text:       "#137738 / #5dc879"
  warning:                    # deep orange · hue 42 · warning / caution
    fill:       "#a74a00"      # 5.56:1  (deep orange — a brighter amber can't carry on-fill text)
    hover:      "#963b00"
    active:     "#892f00"
    foreground: "#fbfaf8"     # neutral-50 — warm off-white
    subtle:     "#feeee8 / #441b09"
    text:       "#a8471b / #f7a062"

  charts:                     # categorical data-viz — series-1 = blue; 2–8 a harmonised
    chart-1: "#2563eb / #3b82f6"   # = blue             · single-series accent. Format "light / dark"
    chart-2: "#c45c51 / #f47c6e"   # red    · hue 28    (light ring L≈0.60, dark L≈0.72)
    chart-3: "#369653 / #53be70"   # green  · hue 150
    chart-4: "#b46e0a / #e38f23"   # amber  · hue 66
    chart-5: "#129297 / #04bbc3"   # teal   · hue 200
    chart-6: "#ba5b8b / #e97ab2"   # magenta· hue 350
    chart-7: "#8d8300 / #b5a80c"   # olive  · hue 104
    chart-8: "#5b6ef0 / #93a4f7"   # indigo · hue 272
  brand:                       # phosphor green · hue 148 · MARKETING marker-roles ONLY, never product UI — additive to `info`, not a replacement (see §Brand & Marketing)
    light: "oklch(0.6 0.17 148)"    # 3.5:1 on card/background
    dark:  "oklch(0.86 0.21 148)"   # 13.3:1 — MK's phosphor pick
  sequential:                 # ordered low→high — derived: color-mix(blue → surface). Re-skins w/ theme.
    recipe: "mix(blue, background) at 12/30/50/72% → blue → mix(blue, foreground) 70%"
  diverging:                  # signed ± around a neutral midpoint — derived from status:
    recipe: "destructive ← mix(destructive,bg) ← muted (centre) → mix(success,bg) → success"

# ── TYPOGRAPHY ───────────────────────────────────────────────────────
# Geist Sans for UI & prose; Geist Mono for code, data, tabular figures, and the mono "voice" role.
# Two-layer scale: a tighter PRODUCT ladder (previews + portaled popups, `.vs-type-product`) and a
# roomier DOC ladder (Fumadocs shell, 16px prose) bind through the same text-* utilities via a scoped
# --type-* variable — authoring never differs, only which shell resolves which ladder.
# Weights: 400 default (the discipline) · 500 labels/h4 · 600 rare emphasis only (D3 cap) — not a blanket ban.
typography:
  fontFamily: { sans: "Geist Sans", mono: "Geist Mono", serif: "Newsreader (marketing display emphasis + pull-quotes ONLY)" }
  # Core ladder (product values shown — the CAP is text-3xl; text-4xl+ is off-scale/lint-banned, use display-*)
  text-xs:      { fontSize: 11px, lineHeight: 16px, fontWeight: 400 }
  text-sm:      { fontSize: 12px, lineHeight: 16px, fontWeight: 400 }   # caption/meta
  text-base:    { fontSize: 14px, lineHeight: 21px, fontWeight: 400 }   # DEFAULT body
  text-lg:      { fontSize: 16px, lineHeight: 24px, fontWeight: 400 }   # lead paragraph
  text-xl:      { fontSize: 18px, lineHeight: 26px, fontWeight: 400 }
  text-2xl:     { fontSize: 20px, lineHeight: 28px, fontWeight: 400 }
  text-3xl:     { fontSize: 24px, lineHeight: 32px, fontWeight: 400 }   # scale CAP
  # Display tier (marketing/docs heroes ONLY — see §Brand & Marketing) — weight 400 throughout, tokenized tracking
  text-display-sm: { fontSize: 32px, lineHeight: 36px, fontWeight: 400, letterSpacing: "-0.04em" }
  text-display-md: { fontSize: 40px, lineHeight: 44px, fontWeight: 400, letterSpacing: "-0.045em" }
  text-display-lg: { fontSize: 56px, lineHeight: 60px, fontWeight: 400, letterSpacing: "-0.05em" }
  text-display-xl: { fontSize: 72px, lineHeight: 76px, fontWeight: 400, letterSpacing: "-0.06em" }
  # Heading aliases (functional headings, product + docs)
  text-h1:      { fontSize: 24px, lineHeight: 32px, fontWeight: 400, letterSpacing: "-0.02em" }
  text-h2:      { fontSize: 20px, lineHeight: 28px, fontWeight: 400, letterSpacing: "-0.015em" }
  text-h3:      { fontSize: 18px, lineHeight: 24px, fontWeight: 400, letterSpacing: "-0.01em" }
  text-h4:      { fontSize: 16px, lineHeight: 22px, fontWeight: 500 }
  text-label:   { fontSize: 14px, lineHeight: 20px, fontWeight: 500 }   # UI label, nav, form label
  text-label-sm:{ fontSize: 12px, lineHeight: 16px, fontWeight: 500 }   # table headers, eyebrows, dense metadata
  text-code:    { fontFamily: mono, fontSize: 13px, lineHeight: 20px, fontWeight: 400, tabularNumbers: true }
  text-code-sm: { fontFamily: mono, fontSize: 12px, lineHeight: 16px, fontWeight: 400, tabularNumbers: true }   # compact tabular numbers
  text-mono-label: { fontFamily: mono, fontSize: 12px, lineHeight: 16px, fontWeight: "400/500", letterSpacing: "+0.05em" }   # the "voice" role — eyebrows, FIG captions, terminal, uppercase CTAs; `uppercase` applied at the call site (never baked in), mono-exclusive — see §Brand & Marketing
  weights:      { normal: 400, medium: 500, semibold: 600 }   # 400 = the discipline default · 500 = labels/h4 · 600 = rare deliberate emphasis only (D3 cap), never a UI default

# ── SPACING & LAYOUT ─────────────────────────────────────────────────
spacing:        # 4px base scale (Tailwind v4)
  base: 4px
  1: 4px;  2: 8px;  3: 12px;  4: 16px;  5: 20px;  6: 24px;  8: 32px;  10: 40px;  12: 48px;  16: 64px;  24: 96px
breakpoints: { sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px }

# ── SHAPES ───────────────────────────────────────────────────────────
rounded:        # six steps; the last is fully round. `xl` was REMOVED (silent Tailwind-fallback trap,
                # lint-banned `removed-radius-xl`) — containers cap at `lg`.
  xs:     2px   # micro radius — caret/arrow triangles, sub-control geometry (a floor, not a design choice)
  sharp:  2px   # the rationed MARKETING "sharp" gesture (cta Button, chips, FigureFrame) — same value as xs today, a distinct role; see §Brand & Marketing
  sm:     6px   # code chips, tight inline controls
  md:     8px   # interactive default — buttons, inputs, menu/nav hover & active backgrounds
  lg:     12px  # containers — cards, popovers, modals, sheets — the scale's CAP
  full:   9999px  # round/tag objects — avatars, switch tracks, badges, status dots, slider thumbs, pill CTAs

# ── ELEVATION ────────────────────────────────────────────────────────
# Flat by default (hairline border, no shadow). Only overlays get one subtle shadow.
shadows:
  shadow-overlay: "0 4px 14px -4px rgba(19,18,17,.10), 0 2px 4px -2px rgba(19,18,17,.06)"   # light
  shadow-overlay-dark: "0 8px 24px -8px rgba(0,0,0,.55)"                                     # dark

# ── OPACITY & ALPHA ──────────────────────────────────────────────────
# Two distinct token classes (never a raw /NN alpha step or a raw opacity-NN — lint-banned raw-alpha/raw-opacity).
opacityAlpha:
  opacity:  { dim: 50%, hintSoft: 60%, hint: 70%, track: 25% }   # --opacity-* — ELEMENT opacity: disabled/dimmed controls (dim — NOT the old 45%), hover-revealed hints, resting-secondary-reaches-100-on-hover, progress track ring. opacity-0/100 are exempt structural endpoints.
  alpha:    { tintBorder: 70%, outlineBorder: 50%, surfaceFaint: 5%, surfaceSubtle: 10%, wash: "40–60%", inkTint: "10–15%" }   # --alpha-* — color-mix MODIFIERS via Tailwind's /(--var) syntax: focus/error border tint, outline-button family, hover washes, pressed-ink tints. Not exhaustive — see packages/design-tokens/dist/theme.css.

# ── MOTION ───────────────────────────────────────────────────────────
motion:
  duration: { fast: 150ms, base: 200ms, slow: 300ms }   # state · popover/tooltip · overlay/modal — 3-step, deliberately not 4
  ease:
    standard:   "cubic-bezier(0.2, 0, 0, 1)"     # snappy decelerate — the default for nearly everything
    emphasized: "cubic-bezier(0.3, 0, 0, 1)"     # entrances that should read more deliberate
    exit:       "cubic-bezier(0.4, 0, 1, 1)"     # accelerate-out
    spring:     "linear(0, 0.5 60%, 1.05 80%, 0.98 90%, 1)"   # small-overshoot spring — motion-pop-in + state-feedback micro-interactions
  blur: 2px   # motion-blur amount for blur-fade entrances
  utilities: { motion-pop-in: "scale .9→1 + fade, ease-spring", motion-enter-up: "fade + 4px rise, ease-standard", motion-shake: "decaying ±4px, duration-slow" }   # tokens/utilities.css keyed-presence mechanism; full mechanism matrix (Base UI lifecycle / keyed presence / replay APIs / AnimatedNumber) in foundations/motion + skills/add-component/SKILL.md §2
  reducedMotion: "honour prefers-reduced-motion — spinners freeze, skeletons go solid, transitions → 0; a dedicated ::view-transition-group/old/new(*) kill switch covers route-change snapshots the universal * reset can't reach"

# ── INTERACTION ──────────────────────────────────────────────────────
interaction:
  # Tailwind v4 Preflight drops the button cursor and native <button> is an arrow, so the hand
  # cursor is set ONCE in base.css for every enabled interactive control — never per component.
  cursor: "pointer on every ENABLED interactive control — button, icon-button, menu item, select option, tab, toggle, switch, checkbox, radio (set globally in base.css via interactive roles + <button>, NOT in any component)"
  cursorExceptions: "disabled → arrow (pointer-events-none / excluded); text fields → text; select scroll-arrows → default; only non-standard clickables (a clickable table row, a label bound to a control) set their own pointer"

# ── ICONOGRAPHY ──────────────────────────────────────────────────────
icons:
  library: "lucide"           # functional line icons ONLY; lucide-animated for motion; thesvg for brand
  sizes: { compact: 12px, inline: 14px, default: 16px, action: 20px, feature: 24px }   # compact exists only for the kept Button `xs` control tier
  stroke: "1.5–2px"
  colour: "currentColor"      # icons inherit text colour & every state — never a hardcoded fill

# ── COMPONENTS (token recipes; full specs in §Components) ────────────
# Control heights: xs 24 (Button only, kept per CX-12) · sm 28 · md 32 (default) · lg 40 — tokenised
# --size-{xs,sm,md,lg}, shared by buttons + inputs + selects (inputs/selects use sm–lg only).
# Control padding-x: xs 8 · sm 10 · md 12 · lg 16 (buttons) / 12 (inputs). Focus: text-entry fields get a
# border-tint only (ring/70, no outline); every other interactive element gets the native 2px
# :focus-visible outline (ring=primary) — never a box-shadow "glow" ring anywhere; see §Accessibility.
components:
  button-primary:     { background: primary, hover: primary-hover, active: primary-active, color: primary-foreground, rounded: md, height: 32px, padding: "0 12px", typography: "text-base / 500" }   # the default AND the key/AI action — neutral ink
  button-secondary:   { background: card, border: border, color: foreground, hover: accent, rounded: md, height: 32px, padding: "0 12px" }
  button-ghost:       { background: transparent, hover: accent, color: foreground, rounded: md, height: 32px, padding: "0 12px" }
  button-destructive: { background: destructive.subtle, color: destructive.text, rounded: md, height: 32px, padding: "0 12px" }   # SOFT-only (D4) — there is no solid destructive fill in this system; danger reads via a warm-red tint, never a heavy block competing with `primary`
  button-sm / button-xs / button-lg: { height: "28px / 24px / 40px", padding: "0 10px / 0 8px / 0 16px" }   # xs is a Button-only tier (icon affordances like the password eye); inputs/selects don't have an xs size
  button-cta:         { rounded: sharp, typography: "text-mono-label uppercase", accent: brand }   # MARKETING-only — full recipe in §Brand & Marketing, not duplicated here
  link:               { color: info.text, hover: underline }   # focus = underline, no ring
  input:              { background: secondary, border: border, focusBorder: "ring/(--alpha-tint-border)", rounded: md, height: 32px, padding: "0 12px", typography: text-base }   # focus = border-tint ONLY, no outline (a raw text field can't distinguish mouse from keyboard)
  card:               { background: card, border: border, rounded: lg, padding: 16px, shadow: none }
  badge:              { background: "{family}.subtle", color: "{family}.text", rounded: full, height: 20px, padding: "0 8px", typography: "text-sm / 500" }
  alert:              { background: "{family}.subtle", color: "{family}.text", rounded: md, padding: "12px 14px", icon: required }
  dialog:             { background: popover, border: border, rounded: lg, padding: 20px, shadow: shadow-overlay, scrim: scrim }
  sheet:              { background: popover, border: border, rounded: 0, padding: 16px, shadow: shadow-overlay }   # full-height side panel
  toast:              { background: popover, border: border, rounded: lg, padding: 16px, shadow: shadow-overlay }   # sonner — wire --normal-bg/border/radius
  dropdown:           { background: popover, border: border, rounded: lg, padding: 4px, shadow: shadow-overlay, itemHeight: 32px, itemPadding: "0 8px", itemRadius: sm, itemHover: accent }
  sidebar:            { width: "240px (--sidebar-width)", widthIcon: "48px (--sidebar-width-icon, collapsed)", itemHeight: 32px, itemPadding: 8px, itemRadius: md, itemHover: sidebar-accent, groupPadding: 8px }
  switch/checkbox/radio: { selected: primary }  ·  tab/slider/progress/pagination: { active: primary }   # binary form selections AND active/value accents = neutral primary ink
---

# VegaStack Design

## Overview

VegaStack is a design system for building **agentic-enterprise** product interfaces — admin consoles,
dashboards, and AI/agent surfaces (chat, reasoning, tool calls, workflows). It is built on **Base UI**
primitives + **Tailwind v4**, with **OKLCH** design tokens served as a public token layer and a private
shadcn component registry.

**Light and dark are co-primary** — neither is derived; every token is authored and contrast-validated in
both. The aesthetic is **warm-neutral, restrained, futuristic**: surfaces are a barely-warm white (deep,
non-espresso near-black in dark), articulated by a **single solid hairline border**, not heavy fills
or shadows. The **neutral-ink primary does the bulk of the work**; colour is rationed and meaningful.

**Key characteristics**
- **One warm neutral ramp.** Every grey/black/white is one of 14 steps on a single OKLCH ramp (hue 75, chroma ~0.003 — barely warm), identical in both themes.
- **OKLCH-authored.** All colours are authored in OKLCH in the DTCG source; the hex shown is the sRGB render — P3-ready notation, sRGB-faithful chroma (no wide-gamut push, by restraint).
- **Scales are tokens.** Colour, control sizes (`--size-*`), radius (`--radius-*`), shadow (`--shadow-overlay`), motion, and type (`--text-*`) are all DTCG tokens — change one, every component re-skins.
- **Neutral-ink primary.** The default action is a charcoal/near-white neutral (Vercel-style), not a colour. Almost every button is `primary`.
- **One rationed chromatic.** `info` (blue) = links and informational UI — the whole colour budget beyond status. The neutral-ink `primary` carries the key action, AI/agent surfaces, and selected/active state.
- **One border, flat by default.** A single solid warm-neutral border carries all separation; only overlays get one subtle shadow.
- **Restrained headlines, crisp body.** Functional headings and the display hero both render at weight 400; 14px body; weight tops out at a rare 600 emphasis (D3), never a UI default.
- **One neutral focus ring.** A 2px `:focus-visible` ring in the `ring` token (= primary ink), centralized — never a colour or glow, so the accent stays free.
- **AA by contract.** Every gated foreground/background pair clears WCAG 2.1 AA in both themes, enforced by a fail-closed build gate.

## Colours

### The warm neutral ramp
Every neutral — every grey, black, and white — is one of 14 steps on a single OKLCH ramp (hue 75, chroma
~0.003), shared by both themes. The warmth is a whisper toward paper, not parchment; `neutral-0` is a warm
white `#fefdfc`, `neutral-900` a barely-warm deep `#131211` (genuinely dark, not espresso). Light and dark
are **mirror references** into the ramp (e.g. `foreground` is `neutral-900` in light, `neutral-100` in
dark). See the frontmatter `colors.ramp` for exact values.

### Surfaces, text & lines
- **`background`** is the page; **`card`/`popover`** are surfaces (warm-white in light; lifted to `neutral-850` in dark).
- **`secondary`** (`neutral-50` / `neutral-850`) is the *subtlest* inset fill — input/control backgrounds. **`muted`** is one step stronger. **`accent`** is the **neutral** hover/selected fill (it is *not* a colour — `bg-accent` must never be blue or any other hue; this is shadcn's `accent`).
- **Text ramp:** `foreground` (ink) → `muted-foreground` (secondary text, the AA workhorse) → `muted-foreground-faint` (placeholders & disabled **only** — intentionally below AA; never for content, including captions).
- **`primary`** is a charcoal (`neutral-700`) in light / near-white (`neutral-200`) in dark — the neutral-ink workhorse action, with `primary-hover`/`primary-active` one step further.
- **One border.** A single **solid warm-neutral** `border` (`neutral-200` light / `neutral-800` dark) on **every** card, input, table, and overlay. The shadcn token names `input` and `sidebar-border` **alias** to it — same appearance, names kept so registry components keep working. Plus a `scrim` for the modal backdrop. No `border-strong` / `overlay-border` / alpha scale — one line token; overlays separate via the shadow, not a heavier border.
- **`ring`** is the focus basis and equals **`primary`** (neutral ink) — see Accessibility.
- **`track`** (`neutral-300` / `neutral-600`) is the switch/toggle off-track — a theme-flipping neutral so a disabled toggle never glows bright in dark.
- **The sidebar** is a self-contained surface (`sidebar` / `sidebar-foreground`, border = the one `border`). Its active/hover/focus reuse the main `primary` / `accent` / `ring`.

### Chromatic colour — rationed
The chrome is warm-neutral; colour carries meaning and is **rationed to one chromatic accent (blue) + three
status hues**. Each family is a six-token ramp (`fill` / `hover` / `active` / `foreground` / `subtle` /
`text`). All use **white on-fill text** uniformly; `hover`/`active` darken so contrast only rises. `subtle`
(soft tinted background) and `text` (readable colour for page/alert) adapt per theme.

| Family | Role | Fill | On-fill | Hue |
|---|---|---|---|---|
| **`info`** | **links** · informational badges & alerts | `#0068d2` | white (5.37:1) | blue, 256 |
| `destructive` | danger, errors, destructive actions | `#d72630` | white (4.99:1) | red, 25 |
| `success` | success, positive state | `#0c853d` | white (4.73:1) | green, 150 |
| `warning` | warning, caution | `#c94d08` | white (4.62:1) | deep orange, 42 |

**Usage rules**
- **`primary` (neutral) is the default AND the accent** — it carries almost every action plus the value/selection accents: the single most important action, AI/agent surfaces, active tab underline, current page, slider/progress fill, selected date, and checked switch/checkbox/radio and the select checkmark. There is no separate accent hue.
- **`info` (blue) is for links and informational UI** — text links, info alerts/badges. This is the conventional "blue = link/info," and the only chromatic accent.
- **Keep blue out of action clusters.** `info` (≈256°) is link/info **text** only. Actions are neutral `primary`, so a blue link never competes with an action for "which is clickable?"
- For a solid button use `{family}.fill` + white text; for an alert/badge use `{family}.subtle` + `{family}.text`; for hover/active step to `.hover` / `.active`.

### Charts & data-viz
Three scales, a **separate** system from UI colour (data needs distinction, not meaning):
- **Categorical** (`chart-1…8`) — qualitative series. **`chart-1` = `blue`** so single-series charts use the blue accent; `chart-2…8` are a harmonised equiluminant ring (~45° apart, L≈0.60 light / 0.72 dark), in gamut, each ≥3:1 vs its background (WCAG 1.4.11). Assign in order; beyond 8 series, encode with pattern, not a reused hue.
- **Sequential** (`sequential`) — ordered low→high (heatmaps, density). One hue: the **blue** mixed into the surface via `color-mix(in oklch …)`, so it re-skins with the blue and the theme (dark inverts dark→light automatically), with zero hand-picked values.
- **Diverging** (`diverging`) — signed ± around a neutral midpoint: `destructive` ← `muted` (centre) → `success`. The one place reusing status is correct, because the ends genuinely mean negative/positive.

As with all state, never rely on colour alone — label series directly or via a legend + icon/dash.

## Typography

**Geist Sans** sets UI and prose; **Geist Mono** sets code, data, tabular figures, and the mono "voice"
role (eyebrows, FIG captions, terminal, uppercase CTAs — see §Brand & Marketing). The scale is
**two-layer**: a tighter **product** ladder (previews, portaled popups — `.vs-type-product`) and a
roomier **doc** ladder (the Fumadocs shell, 16px prose); both compile through the same `text-*`
utilities via a scoped `--type-*` binding, so component authoring never changes — only which shell it
renders inside does.

- **Body** `text-base`(14/21, **default**) — chosen for the reading-heavy surfaces of an agentic-
  enterprise product (logs, descriptions, agent output). `text-lg`(16/24) for leads.
- **Core scale** `text-xs`(11) → `text-3xl`(24) — the CAP; `text-4xl` and above is off-scale and
  lint-banned, use a display-tier utility instead.
- **Display tier** `text-display-sm/md/lg/xl` (32/40/56/72), weight **400** throughout, tokenized
  tracking tightening −0.04em → −0.06em as size grows — marketing/docs heroes only (§Brand & Marketing).
- **Functional headings** `text-h1`(24) → `text-h3`(18) at **400**; `text-h4`(16) at **500**.
- **Label** `text-label`(14/500) for UI labels, nav, form labels; `text-label-sm`(12/500) for table
  headers, eyebrows, dense metadata.
- **Code/data** `text-code` (Geist Mono 13, **tabular figures**); `text-code-sm` (Geist Mono 12, tabular)
  for compact numbers.
- **Voice** `text-mono-label` (Geist Mono 12/16, +0.05em tracking) — the marketing/brand-voice role;
  `uppercase` is applied at the call site (never baked into the token) and is **mono-exclusive** —
  uppercase Geist Sans is lint-banned (`uppercase-mono`, D20). 12px is the floor.

**Principles**
- **14px is the default**, chosen for the reading-heavy surfaces of an agentic-enterprise product (logs, descriptions, agent output). A 13px *compact* density is a documented per-surface allowance, not a separate token.
- **Weight rule:** 400 is the discipline — almost everything renders at 400. 500 for labels/h4. **600 is
  a rare, deliberate emphasis** (D3 cap), not a UI default — reach for size/colour hierarchy before
  weight. At most two weights in one view.
- **Colour + size do hierarchy work:** `foreground` heading over `muted-foreground` body reads as clear levels even at one weight.
- **Apply the type tokens** — never hand-set font-size, line-height, weight, or tracking.

## Layout

- **Spacing** is a 4px scale (frontmatter `spacing`). Rhythm: 8px inside a group, 16px between groups, 32–40px between sections. Cards use 16px padding (12px compact via `size="sm"`; there is no separate "hero" size).
- **Breakpoints** `sm`–`2xl` per the frontmatter; every layout must work on mobile and desktop.
- **Density:** chrome is compact (28–40px control heights, 14px type) while the canvas around the working column stays open. Container max-width 1080–1200px, side padding grows at wider breakpoints.

## Elevation & Depth

**Flat by default.** Cards, inputs, panels, tables, and the sidebar are **one hairline border, no shadow.**
Only true **overlays** — `dropdown` · `tooltip` · `popover` · `menu` · `select` · `dialog` · `sheet` — get
**one subtle shadow** (`shadow-overlay`).

- There is **one** shadow token (one per theme); no multi-tier shadow system.
- **Dialogs** rely on the **scrim** + `shadow-overlay`, not a dramatic drop.
- **In dark**, shadows are near-invisible on a dark canvas — the floating cue is the **lifted surface** (`popover`/`card` a step above `background`) plus the border.

### Surfaces — the stacking ladder
Depth comes from surface contrast, not shadow. Five rungs, no more: **Canvas** (`background`) → **Subtle**
(`secondary`) → **Card** (`card`) → **Overlay** (`card` + shadow); and **Sunken** (`muted`) for insets
(wells, code blocks, track fills). Up = a different surface token (+ border); down = `muted` inset.

## Motion

Use motion only to clarify a change. Most interactions feel instant. Durations: **150ms** state changes,
**200ms** popovers/tooltips, **300ms** overlays/modals. Four eases: **`standard`** (the default,
snappy-decelerate) for nearly everything, **`emphasized`** for entrances that should read more
deliberate, **`exit`** for accelerate-out, **`spring`** (a small-overshoot `linear()` curve) for
state-feedback micro-interactions (`motion-pop-in`). Three keyed-presence utilities cover mount-triggered
one-shot arrivals — `motion-pop-in` (scale+fade), `motion-enter-up` (fade+rise), `motion-shake` (a
decaying shake, replayed via `useAnimationReplay`/`useShakeOnInvalid` without remounting so focus/caret
survive). Full choice-of-mechanism guidance (Base UI lifecycle vs. keyed presence vs. replay APIs vs.
`AnimatedNumber`) lives in `foundations/motion` and `skills/add-component/SKILL.md` §2 — this section is
the token reference, not the mechanism matrix. Avoid long, looping, or attention-grabbing animation, and
**honour `prefers-reduced-motion`**: the global reset collapses `motion-*` keyframes to their resting end
state, spinners freeze, skeletons go solid, transitions drop to 0 — and a dedicated
`::view-transition-group/old/new(*)` kill switch covers route-change snapshots the universal `*` reset
can't reach (they live outside normal element matching, on the root's snapshot layer). AI surfaces define
streaming reveal, a "thinking" pulse, and tool-progress.

## Shapes

Six radii (frontmatter `rounded`): `xs` 2 · `sharp` 2 (marketing-only) · `sm` 6 · `md` 8 · `lg` 12 · `full`.
`lg` is the product scale's **cap** — containers never exceed it. **`rounded-xl` was removed** (it
silently fell back to Tailwind's unthemed default) and is lint-banned (`removed-radius-xl`); reach for `lg`.

**The `rounded-full` rule** — `full` is for inherently round / tag-like objects (avatars, switch tracks,
badges/chips, status dots, slider thumbs) and *deliberate* pill CTAs. **Container highlights echo their
container's geometry** — sidebar/nav-row hover & active backgrounds, menu-item highlights, and cards use
`md`/`lg`, **never** `full`. `xs` is sub-control geometry (carets/arrows), not a design choice; `sharp` is
the rationed marketing gesture (§Brand & Marketing) — don't reach for it on product surfaces. Keep one
radius family per view.

## Iconography

One library: **lucide** (functional line icons), lucide-animated for motion, `thesvg` for brand glyphs —
via `Icon` / `BrandIcon`. Sizes 12 (compact, the `xs` control tier only) / 14 (inline) / 16 (default) / 20
(actions) / 24 (feature), 1.5–2px stroke, always **`currentColor`** so icons inherit text colour and every
state. Never inline an ad-hoc `<svg>` as an icon; never mix icon libraries.

## Components

Each component composes from tokens (frontmatter `components` gives the recipe). One control-height scale —
**xs 24 (Button only) / sm 28 / md 32 (default) / lg 40** (`h-6`/`h-7`/`h-8`/`h-10`), shared by buttons,
inputs, and selects (inputs/selects use sm–lg only) so they line up; padding-x xs 8 / sm 10 / md 12 / lg 16
(buttons), 12 (inputs). Tokenised as `--size-{xs,sm,md,lg}`.

- **Button** — `primary` (neutral-ink fill, the default for everything, including the single key action or an AI moment); `secondary` (card fill + the one border) and `ghost` (transparent, neutral `accent` hover) for lower emphasis; `destructive` for danger — **soft-only** (`destructive.subtle` fill + `.text`; D4 — there is no solid destructive fill in this system). Sizes `xs`(24, icon affordances)/`sm`(28)/`default`(32)/`lg`(40). Radius `md`; `text-base`/500 label. **Hover/active darken within the button's own colour** — nothing borrows a hue. The marketing-only `cta` variant (accent-outline, sharp corners, mono-uppercase) is documented in §Brand & Marketing, not duplicated here.
- **States** (every button) — default · hover · focus · active · disabled (`opacity-(--opacity-dim)`, 50% + `not-allowed`) · loading (spinner honouring reduced-motion). **Focus = the neutral 2px `:focus-visible` outline (`ring` token = primary ink)** — never a box-shadow glow.
- **Input / Select / Textarea** — `secondary` fill, the one `border`, radius `md`, 32px. **Consistent border scale (identical in light & dark, no per-mode opacity hacks): rest = `border`/`input`; focus/active = `ring/70`; error = `destructive/70`.** Text-entry fields (Input, Textarea, Field control, OTP slots) use the darkened `ring/70` border as their *sole* focus indicator — no outline (a raw text input can't distinguish mouse from keyboard, so the border is the one consistent cue for both click and Tab). Button-style triggers (Select, date-picker, country-select, color-picker — built on the `outline` Button variant) darken the border to `ring/70` on focus AND add the neutral 2px outline for keyboard nav (`:focus-visible` only). Never a colour, never a glow. Error = `destructive/70` border + `destructive.text` helper. Disabled = reduced opacity + `not-allowed`.
- **Card / Panel** — `card` surface, the one `border`, radius `lg`, **flat (no shadow)**.
- **Badge / Chip / Tag** — radius `full`; status/info badges use `{family}.subtle` + `{family}.text` (+ a 6px dot); neutral badge uses `muted`.
- **Alert** — `{family}.subtle` background + `{family}.text`, radius `md`, **always paired with an icon** (never colour alone). Info alerts use `info` (blue).
- **Dialog / Modal** — `popover` surface, the one `border`, radius `lg`, `shadow-overlay`, over the `scrim`. Title `text-h3`/`h4`; actions right-aligned (`ghost` Cancel + intent button).
- **Dropdown / Menu / Popover / Tooltip / Command palette** — `popover` surface, the one `border`, `shadow-overlay`; items use neutral `accent` hover at radius `sm`; destructive items use `destructive.text`; the selected command row uses `accent`.
- **Tabs / Segmented** — underline or pill; the **active** tab underline / segment uses `primary` (selection).
- **Switch / Checkbox / Radio** — neutral **`primary`** ink when on/checked, off-track = `track`; **Slider** fill = **`primary`**; radius `full` (switch/radio/thumb) or `sm` (checkbox).
- **Navigation** — breadcrumb (`muted-foreground`, current = `foreground`), pagination (active = `primary`).
- **Avatars · progress · skeleton** — avatar = `accent` fill + initials; progress/ring fill = `primary`; skeleton shimmer = neutral.
- **Links** — `info` (blue); hover/focus underline.
- **AI / agent surfaces** — reasoning, tool calls, streaming, and the composer send read in the neutral `primary` / `accent` register (distinguished by layout + iconography, not a brand hue).
- **Status indicators** — running dot `info`, succeeded `success`, failed `destructive`, queued/idle neutral; reasoning/streaming `primary`.

## Voice & Content

Copy is part of the design — precise, no filler.

- **Case:** sentence case for everything (buttons, headings, labels, body, toasts).
- **Actions** name a verb + noun (`Deploy project`, `Delete member`) — never `Confirm`, `OK`, or a bare verb.
- **Errors** state what happened plus what to do: `Bundle exceeds the 50 MB limit. Remove unused assets or raise the limit in Settings.` — never just "Something went wrong."
- **Toasts** name the specific thing, drop the trailing period, never say "successfully": `main@a1f7c2 deployed`, not `Successfully deployed.`
- **Empty states** point to the first action: `No deployments yet. Deploy your first project →`.
- **In-progress** uses the present participle + ellipsis: `Deploying…`, `Reasoning…`.
- Use numerals (`3 projects`), tabular figures, curly quotes, and the ellipsis character; skip "please" and superlatives.

## Do's and Don'ts

**Do**
- Use **semantic tokens only** — `bg-primary`, `text-muted-foreground`, `border-border`. Apply **type tokens** instead of hand-set size/weight.
- Keep `primary` (neutral) as the workhorse — it also carries the one key action / AI moment / selection; **ration `info` (blue)** to links and informational UI.
- Use `info` (blue) for links and informational UI; pair every state colour with an icon + text.
- Use the **one border** everywhere; stay flat — only overlays get the one shadow.
- Use the one neutral `:focus-visible` outline (2px, `ring` = primary ink) on every interactive element except text-entry fields, which use a border-tint instead (see Accessibility).
- Hold **WCAG AA** (4.5:1 body text), authored in **both** themes. Use lucide at `currentColor`; tabular figures for numbers.

**Don't**
- Don't hardcode hex/px, use raw palettes (`bg-neutral-900`), or off-scale values.
- Don't make `accent` (the neutral hover) a colour, or use `info` (links) for anything that isn't a link or informational.
- Don't add a decorative brand hue or a fourth status hue "just this once"; don't sit a blue link inside a neutral action cluster where "which is clickable?" becomes ambiguous.
- Don't make focus a **colour** or a **box-shadow glow** — it's the neutral `ring` (= primary ink), either a border-tint (text fields) or a 2px `:focus-visible` outline (everything else). Don't remove focus without a visible replacement.
- Don't go bold (600+) as a default — it's a rare, deliberate emphasis (D3), not a UI weight; don't use more than two weights in a view; don't use `rounded-full` for container highlights.
- Don't add shadows to flat surfaces; don't signal state with colour alone; don't ship a token that resolves in only one theme.

## Accessibility

- **WCAG 2.1 AA.** Every canonical foreground/background pair clears **4.5:1** (normal text), in **both** themes, enforced by a **fail-closed** contrast gate in CI (computed from OKLCH). All status/info fills pass white-on-fill AA; `muted-foreground` passes; `muted-foreground-faint` is deliberately sub-AA and scoped to placeholders/disabled only.
- **Focus = a border-tint or the native outline — never a box-shadow ring/glow.** Text-entry fields (Input, Textarea, Field control, OTP slots) show ONLY a border-tint (`border-ring/(--alpha-tint-border)`, on plain `focus` not `focus-visible` — a raw text field can't distinguish mouse from keyboard, so the border is the one cue for both). Every other interactive element — buttons, button-style triggers, menu items, portaled overlay surfaces — shows the centralized **2px `:focus-visible` outline** in the `ring` token (= `primary` ink), defined once in `base.css`. Components carry no focus style of their own beyond this. Mouse clicks show nothing outside text fields. The `ring` token is one value, so it re-skins globally — change `ring`, every focus state follows.
- **Never signal by colour alone** (1.4.1) — pair status colour with an icon or label.
- **Target size** (2.5.5) — icon buttons get a ≥24px hit area; primary touch targets ≥44px.
- Respect **`prefers-reduced-motion`**.

## Brand & Marketing

Everything above is the **product** system (light/dark co-primary, warm-neutral, one rationed
`info` accent). Marketing surfaces — the docs-home hero, future landing pages — layer a small,
strictly-rationed set of ADDITIONAL rules on top of the same tokens (evidence-based synthesis:
`docs/audits/2026-07-14-system-audit/17-brand-direction.md`, D17/D18/D20). They do not replace or
loosen anything above; a marketing surface still uses `bg-background` / `text-foreground` / the
one `border` token — only the VALUES underneath change (see Scope mechanism, below).

### Accent — marker roles only, not a wash

The `--brand` phosphor accent (light `oklch(0.6 0.17 148)`, 3.5:1 on card/background; dark
`oklch(0.86 0.21 148)`, 13.3:1 — MK's phosphor pick) is additive to the product's `info` accent, **not**
a replacement — `info` still means link/informational UI everywhere; `brand` is the marketing-only
signature.
Marker roles ONLY: a live/AI-state dot, a sparkline endpoint, an eyebrow highlight (the small
dot before a mono eyebrow), a terminal prompt glyph, and the **one** exception —
the `cta` Button variant's accent-outline treatment. Never a fill, a border-at-rest, a headline
color, or a decorative wash beyond one radial. Budget: **guidance, not lint** — aim for ≤~10
accent elements on any one marketing page (a `ParticleField` counts as ONE atmospheric accent
instance, not per-particle, since it reads as a single texture, not N marks).

### Sharp gesture — rationed to CTAs, chips, figure frames

`rounded-(--radius-sharp)` (2px) is the marketing "sharp" signature — rationed to the `cta` Button
variant, chips, and `FigureFrame`. **Product radii are unchanged** everywhere else (the 6/8/12
scale above stays the product's own). Don't reach for `radius-sharp` outside those three roles, and
don't apply it wholesale across a marketing page — it's a deliberate accent, not a new default.

### Mono voice — uppercase is mono-exclusive, 12px floor

Geist Mono, uppercase, `+0.04–0.06em` tracking (baked into the `text-mono-label` token), weight
400/500, `tabular-nums` for any numeral content — eyebrows, section numbers, FIG-style captions,
terminal annotations, the `cta` button label. **Uppercase Geist Sans is banned** — uppercase type
must ALWAYS carry `font-mono`/`text-mono-label` in the same class literal (lint-enforced in
`packages/ui`, design-lint rule `uppercase-mono`). The mono voice never appears in headlines or
long-form body copy. 12px (`text-mono-label`) is the floor; the spec permits an optional 10px
minimum for FIG-style annotations specifically, but no token below 12px ships today —
`FigureFrame`'s caption intentionally stays at the 12px floor rather than hand-rolling a one-off
size (see the component's own note).

### Serif accent — Newsreader, display emphasis + pull-quotes ONLY

`font-serif` (Newsreader italic) is reserved for two roles: a single emphasis word/phrase inside a
`SectionHeader` title, and the `Testimonial` pull-quote. **Never running body text**, never a
whole headline, never non-italic. Both sanctioned uses live in this Phase B component set —
extending the serif accent to a third role should re-open the decision, not silently spread it.

### Geist Pixel — exactly ONE hero flourish

`font-family-pixel` (Geist Pixel Square, `geist/font/pixel`'s `GeistPixelSquare`) is a single
deliberate decorative glyph, used ONCE per surface — see the docs-home hero's `▪` flourish before
the eyebrow. It is never a headline face, never running text, and never repeated within the same
page. Adding a second use anywhere re-opens D17's "one sanctioned hero flourish" decision; don't
do it without that conversation.

### Alpha-ramp text hierarchy

Marketing surfaces build text hierarchy from ONE ink (`foreground`) at tokenized alpha steps,
never a second gray token: full `text-foreground` for primary copy, `text-foreground/(--opacity-hint)`
(70%) for secondary/description copy, `text-foreground/(--opacity-hint-soft)` (60%) for tertiary
(e.g. `Terminal` output lines), `text-foreground/(--opacity-dim)` (50%) for the most muted role
(e.g. `LogoRow`'s resting wordmarks). These reuse the SAME `--opacity-*` tokens the product system
already ships (Elevation/Motion sections above) rather than a bespoke marketing-only scale —
"the `--alpha-*`/`--opacity-*` tokens from T2," per the audit.

### Marketing ground + scope mechanism

Marketing surfaces render the warm ramp's **dark end** (not pure black) — the same `.dark`-half
token values, but scoped to work **independent of the page's `.dark` class**, because the product
default is light and a marketing page needs to be dark-first regardless. The mechanism is the
`.vs-marketing` class (`packages/design-tokens/src/utilities.css`) plus the `MarketingSurface` primitive
that applies it: every semantic token utility inside a `MarketingSurface` (`bg-background`,
`text-foreground`, `border-border`, `bg-brand`, and any composed product component) resolves to
the dark values with zero code changes. `Terminal` self-scopes the same way, so an install snippet
reads dark even embedded in a light docs page. The one documented limitation: Base UI portals
(Dialog/Popover/Menu/Select/Tooltip) mount to `<body>`, OUTSIDE any `MarketingSurface` subtree, so
a portaled surface opened from inside one inherits the PAGE theme, not the marketing ground —
marketing surfaces rarely need portals, but style one explicitly at the portal root if one ever
does. The docs-home page (`apps/docs/app/(home)/page.tsx`) is the reference implementation: one
outer `MarketingSurface` wraps the entire page, and the rest of `/docs` stays the light-primary
product surface — a single, deliberate temperature boundary at the home→docs navigation, not an
alternating pattern within one page.

---

> **Provenance.** This is the canonical v2 specification for the finalized token system (v1, the pre-overhaul
> grey/`action`+`agent` system, is preserved at `design-v1.md`). Values are intended to be **generated from
> `@vegastack/design-tokens`** (DTCG → OKLCH) with a CI drift-check, so the spec can't diverge from the shipped
> tokens; the prose layer (Overview, Voice, Do/Don't, Accessibility) is hand-authored. An early single-accent
> exploration is archived at `docs/research/design-comparison/proposed-design-system.html` (superseded — it
> predates the locked decisions: solid border, neutral 2px ring, separate `info`=blue; not current). The live
> showcase is the Fumadocs site under `apps/docs/`; decision history, the build plan, and the v2 rollout
> ledger live in `docs/plans/`.
