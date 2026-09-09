---
schemaVersion: 1
version: "2.1"
name: "VegaStack"
description: "Canonical VegaStack design contract. Light and dark are co-primary themes; token values are resolved from the current DTCG sources."
generated:
  command: "node tooling/sync-design-md.mjs"
  check: "node tooling/sync-design-md.mjs --check"
  tokenFormat: "DTCG 2025.10 resolved to CSS values"
  inputs:
    generator:
      path: "tooling/sync-design-md.mjs"
      bytes: 12571
      sha256: "e89e7b952e08607c080e027176a784f27bd2a104c52590a46008e65058bf74ab"
    config:
      path: "tooling/design-md.config.mjs"
      bytes: 3569
      sha256: "613dccee60a24fa29905ea12001cb656d7a3303669edd148de3ccba73569a9dd"
    primitives:
      path: "packages/design-tokens/tokens/primitives.tokens.json"
      bytes: 9953
      sha256: "bade126afb17ad70f251299bce42d2885f4b94e137a88e2e24479cbcbdbd6994"
    light:
      path: "packages/design-tokens/tokens/semantic.tokens.json"
      bytes: 34780
      sha256: "bf0997bdef1c56a426d936b6aaa4d0b8564d9b0c415c7054e641d10cb3504b4f"
    dark:
      path: "packages/design-tokens/tokens/semantic.dark.tokens.json"
      bytes: 11669
      sha256: "64ce2b3b12d670ba613dc03c30a09e38fe89488a7d0d42bdeda0a76129e4e925"
    externalSources:
      path: "docs/research/design-md-audit/source-manifest.json"
      bytes: 3742
      sha256: "746e6f3ca29edf9dfdb0510c13acde145aa9597e4ed8073b7ba3e2b9c1d62782"
themes:
  light:
    accent:
      type: "color"
      value: "oklch(0.945 0.003 75)"
      description: "ALIAS of surface-2, the hover/highlight rung (shadcn's `accent` — a NEUTRAL, never a hue). Menu/select/command `data-highlighted` rides on it."
    accent-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
      description: "ALIAS of foreground."
    alpha-backdrop-soft:
      type: "dimension"
      value: "60%"
      description: "Translucent surface backdrop (bg-background) — pill tab list."
    alpha-border:
      type: "dimension"
      value: "8%"
      description: "The hairline alpha (D14): `border` is DERIVED as foreground at this alpha, so one hairline reads on page, card, well and dark band. 8% light (L 0.936, Geist gray-400 territory) / 14% dark (L 0.325 over card)."
    alpha-border-soft:
      type: "dimension"
      value: "30%"
      description: "Toast (sonner) status border tint (border-<family>)."
    alpha-border-subtle:
      type: "dimension"
      value: "20%"
      description: "Alert variant border tint (border-<family>)."
    alpha-glass:
      type: "dimension"
      value: "90%"
      description: "Glass button surface (bg-background + backdrop-blur)."
    alpha-glass-hover:
      type: "dimension"
      value: "95%"
      description: "Glass button surface on hover."
    alpha-hover:
      type: "dimension"
      value: "7%"
      description: "The alpha twin of surface-2: `bg-<ink>/(--alpha-hover)` composites the hover rung onto ANY backdrop (a kbd inside a hovered row, a chip on a well, a control over media). foreground at 7% over the page measures L 0.943 light / 0.267 dark over card — within 0.003 of the opaque rung. Theme-invariant."
    alpha-ink-tint:
      type: "dimension"
      value: "10%"
      description: "Neutral pressed/hover ink tint (bg-foreground) — toggle pressed, chip remove hover."
    alpha-ink-tint-strong:
      type: "dimension"
      value: "15%"
      description: "Hovered pressed-state ink tint (bg-foreground)."
    alpha-input:
      type: "dimension"
      value: "30%"
      description: "Dark-theme input fill tint (bg-input) — see the dark-tint scoping note."
    alpha-link-hover:
      type: "dimension"
      value: "80%"
      description: "Hovered link text dim (text-info-text) in rendered rich text."
    alpha-outline-border:
      type: "dimension"
      value: "50%"
      description: "Resting border of the outline button family (border-<family>)."
    alpha-outline-soft:
      type: "dimension"
      value: "50%"
      description: "Soft neutral outline/ring (base outline default, date-picker today ring)."
    alpha-pressed:
      type: "dimension"
      value: "10%"
      description: "The alpha twin of surface-3 (pressed/selected): foreground at 10% measures L 0.921 light / 0.292 dark over card. Theme-invariant."
    alpha-soft-hover:
      type: "dimension"
      value: "20%"
      description: "Hover wash of soft (subtle-filled) status surfaces. Theme-split: 30% in dark."
    alpha-soft-surface:
      type: "dimension"
      value: "10%"
      description: "Resting wash of soft status surfaces (chat destructive bubble). Theme-split: 20% in dark."
    alpha-surface-faint:
      type: "dimension"
      value: "5%"
      description: "Resting wash of the outline button family (bg-<family>)."
    alpha-tint-border:
      type: "dimension"
      value: "70%"
      description: "Border tint for focus (ring) and error (destructive) borders — design.md's ring/70 pattern."
    alpha-wash:
      type: "dimension"
      value: "50%"
      description: "Neutral wash (bg-muted) — card/table footers, ghost dark hover."
    alpha-wash-faint:
      type: "dimension"
      value: "40%"
      description: "Faint neutral wash (bg-muted) — rich-text toolbar."
    alpha-wash-strong:
      type: "dimension"
      value: "60%"
      description: "Stronger neutral wash (bg-muted) — line-tab hover."
    background:
      type: "color"
      value: "oklch(0.994 0.002 75)"
    border:
      type: "color"
      value: "oklch(0.145 0.003 75 / 0.08)"
      description: "DERIVED: foreground at 8% (alpha-border) — the one alpha hairline (D14)."
    brand:
      type: "color"
      value: "oklch(0.6 0.17 148)"
      description: "The phosphor-green brand accent, LIGHT half (theme-split per CX-9): marker roles ONLY (live/AI-state dot, sparkline endpoint, eyebrow highlight, terminal prompt glyph). 3.5:1 on card/background — meaningful glyphs pass WCAG 1.4.11. Never fills, borders-at-rest, headlines, or buttons."
    card:
      type: "color"
      value: "oklch(0.994 0.002 75)"
      description: "Light cards are PAGE-COLOURED and separated by the alpha hairline alone (surface-ladder decision 2026-09-07, P1): no reference system lifts or sinks a light card. Dark keeps the one-step lift (neutral.900)."
    card-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    chart-1:
      type: "color"
      value: "oklch(0.546 0.245 262.88)"
    chart-2:
      type: "color"
      value: "oklch(0.6 0.118 184.7)"
    chart-3:
      type: "color"
      value: "oklch(0.398 0.07 227.39)"
    chart-4:
      type: "color"
      value: "oklch(0.646 0.222 41.12)"
    chart-5:
      type: "color"
      value: "oklch(0.645 0.246 16.44)"
    chart-6:
      type: "color"
      value: "oklch(0.505 0.213 27.52)"
    chart-7:
      type: "color"
      value: "oklch(0.6 0.127 104.2)"
      description: "Olive (hue 104) — reassigned from green.600, which collided with the brand phosphor hue (CX-9)."
    chart-8:
      type: "color"
      value: "oklch(0.531 0.182 256)"
    chart-single:
      type: "color"
      value: "oklch(0.145 0.003 75)"
      description: "Single-series chart ink (D29): one series is drawn in foreground ink; the categorical chart-1…8 hues start at two series."
    destructive:
      type: "color"
      value: "oklch(0.505 0.213 27.52)"
    destructive-active:
      type: "color"
      value: "oklch(0.415 0.213 27.52)"
      description: "DERIVED: destructive fill at L-0.09 (active step)."
    destructive-border:
      type: "color"
      value: "oklch(0.505 0.213 27.52)"
      description: "Invalid-state border ink, composited at --alpha-tint-border. A DEDICATED role because the fill hue cannot serve both: on the dark ground, destructive at 70% measures 1.92:1, far under the 3:1 WCAG 1.4.11 floor for a non-text UI indicator, and lightening `destructive` itself would drop destructive-foreground on the solid button below 4.5:1. Light keeps the fill hue (4.24:1); dark re-grounds to red.400 (4.00:1)."
    destructive-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    destructive-hover:
      type: "color"
      value: "oklch(0.455 0.213 27.52)"
      description: "DERIVED: destructive fill at L-0.05 (hover step)."
    destructive-subtle:
      type: "color"
      value: "oklch(0.949 0.022 24)"
    destructive-subtle-active:
      type: "color"
      value: "oklch(0.883 0.046 19.3)"
      description: "DERIVED: destructive fill @12% composited over destructive-subtle (soft-pressed surface, AA-gated against destructive-text)."
    destructive-subtle-hover:
      type: "color"
      value: "oklch(0.91 0.036 20.4)"
      description: "DERIVED: destructive fill @7.000000000000001% composited over destructive-subtle (soft-hover surface, AA-gated against destructive-text)."
    destructive-text:
      type: "color"
      value: "oklch(0.496 0.2 25)"
      description: "Page-readable red ink (was red.650, L 0.521). Re-tuned -0.025 L on 2026-09-07 so the soft PRESSED rung (`destructive-subtle-active`, fill @12% over subtle) still clears 4.5:1 — at the old ink the soft family sat at the AA edge on hover (4.60:1) and had no room for a pressed step. Every other pair only gains contrast."
    duration-base:
      type: "duration"
      value: "200ms"
    duration-fast:
      type: "duration"
      value: "150ms"
    duration-indeterminate:
      type: "duration"
      value: "1200ms"
      description: "1200ms — the loop cadence of the ONE sanctioned looping utility, `motion-indeterminate` (an indeterminate Progress sweep; audit M-06). Not an interaction duration: interactions use fast/base/slow."
    duration-slow:
      type: "duration"
      value: "300ms"
    effect-blur-glass:
      type: "dimension"
      value: "8px"
      description: "Backdrop blur for chrome that floats over content (the Attachment upload veil). The Button `glass` variant it was introduced for was deleted 2026-09-07 (audit D16)."
    font-family-display:
      type: "fontFamily"
      value: "Geist, sans-serif"
      description: "Display tier face — same family as sans today, split as a token so marketing can retune independently."
    font-family-mono:
      type: "fontFamily"
      value: "'Geist Mono', monospace"
    font-family-pixel:
      type: "fontFamily"
      value: "'Geist Pixel Square', monospace"
      description: "THE single sanctioned Geist Pixel flourish cut (D17: one deliberate hero use per surface, no more)."
    font-family-sans:
      type: "fontFamily"
      value: "Geist, sans-serif"
    font-family-serif:
      type: "fontFamily"
      value: "Newsreader, serif"
      description: "Serif ACCENT (D17): display emphasis words + pull-quotes only, never running text. Newsreader (opsz axis) until Geist Serif ships."
    foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    icon-action:
      type: "dimension"
      value: "1.25rem"
      description: "20px icon — standalone action icons (design.md 'action')."
    icon-compact:
      type: "dimension"
      value: "0.75rem"
      description: "12px icon — inside xs controls only (below design.md's named scale; exists for the kept Button xs tier)."
    icon-default:
      type: "dimension"
      value: "1rem"
      description: "16px icon — the default control icon (design.md 'default')."
    icon-feature:
      type: "dimension"
      value: "1.5rem"
      description: "24px icon — feature/empty-state glyphs (design.md 'feature')."
    icon-inline:
      type: "dimension"
      value: "0.875rem"
      description: "14px icon — inline with body text and sm controls (design.md §Iconography 'inline')."
    info:
      type: "color"
      value: "oklch(0.531 0.182 256)"
    info-active:
      type: "color"
      value: "oklch(0.441 0.182 256)"
      description: "DERIVED: info fill at L-0.09 (active step)."
    info-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    info-hover:
      type: "color"
      value: "oklch(0.481 0.182 256)"
      description: "DERIVED: info fill at L-0.05 (hover step)."
    info-subtle:
      type: "color"
      value: "oklch(0.961 0.018 253)"
    info-subtle-active:
      type: "color"
      value: "oklch(0.906 0.038 250.5)"
      description: "DERIVED: info fill @12% composited over info-subtle (soft-pressed surface, AA-gated against info-text)."
    info-subtle-hover:
      type: "color"
      value: "oklch(0.929 0.03 251.1)"
      description: "DERIVED: info fill @7.000000000000001% composited over info-subtle (soft-hover surface, AA-gated against info-text)."
    info-text:
      type: "color"
      value: "oklch(0.5 0.171 256)"
      description: "Link / informational blue ink (was blue.650, L 0.52); -0.02 L for the soft pressed rung — see destructive-text."
    input:
      type: "color"
      value: "oklch(0.145 0.003 75 / 0.08)"
      description: "ALIAS of border (the alpha hairline). `border` itself is DERIVED by the SD preprocessor: foreground at --alpha-border (D14) so one hairline survives on page, card, well and dark band alike."
    layout-header-height:
      type: "dimension"
      value: "3.5rem"
      description: "56px app-shell header band (was a raw `h-14`, B6-08). Sticky/fixed content below the header offsets by this."
    layout-overlay-max-height:
      type: "dimension"
      value: "calc(100dvh - 16rem)"
      description: "The tallest a scrolling overlay body (Command list, Board column, ShortcutOverlay) may grow: the dynamic viewport minus a 16rem chrome allowance. DTCG 2025.10 has no calc expression type, so this dimension is authored as the CSS string it resolves to and passed through verbatim (the same precedent as the `easing` linear() token)."
    media-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
      description: "Theme-invariant media chrome ink: the warm off-white used for every icon, label and track drawn over media-scrim or media-scrim-strong. Labels are allowed on EITHER scrim — both are gated at the AA text floor (4.5:1) against this ink over the white worst case. Not overridden in dark on purpose."
    media-scrim:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.6)"
      description: "THEME-INVARIANT media chrome scrim (B4-01): the gradient/backdrop behind controls laid over video or imagery. Always a warm-black alpha, never a theme token, so the chrome reads dark-scrim + light-ink in both themes (`primary` flips with the theme and inverted the chrome in dark). TEXT IS PERMITTED on this scrim: media-foreground clears 5.2:1 on it over a white worst-case backdrop, and tooling/contrast-check.mjs gates the pair at the AA TEXT floor (4.5:1), not the 3:1 non-text floor — so a retune that thins this scrim under AA fails the build rather than silently demoting its labels."
    media-scrim-strong:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.8)"
      description: "Theme-invariant strong scrim for opaque media pills (volume popover, time badge) — 11:1 for media-foreground over a white worst case. Use it for any block of media text that needs headroom beyond the soft scrim's ~5.2:1, and for text over unusually bright or busy frames."
    motion-blur:
      type: "dimension"
      value: "2px"
      description: "Motion-blur amount for blur-fade entrances (Phase M text/element reveals)."
    motion-ease-emphasized:
      type: "cubicBezier"
      value: "cubic-bezier(0.3, 0, 0, 1)"
    motion-ease-exit:
      type: "cubicBezier"
      value: "cubic-bezier(0.4, 0, 1, 1)"
    motion-ease-spring:
      type: "easing"
      value: "linear(0, 0.5 60%, 1.05 80%, 0.98 90%, 1)"
      description: "CSS linear() spring with a very small overshoot — the success-bounce/appear curve for state-feedback micro-interactions (Phase M). Subtle by design: dense dev-tool aesthetic, not playful."
    motion-ease-standard:
      type: "cubicBezier"
      value: "cubic-bezier(0.2, 0, 0, 1)"
    muted:
      type: "color"
      value: "oklch(0.97 0.003 75)"
      description: "ALIAS of surface-1 (shadcn name). muted-foreground stays a real text role."
    muted-foreground:
      type: "color"
      value: "oklch(0.439 0.003 75)"
    muted-foreground-faint:
      type: "color"
      value: "oklch(0.63 0.003 75)"
    opacity-dim:
      type: "dimension"
      value: "50%"
      description: "Element opacity for disabled controls and dimmed affordances (outside-month days, decorative chevrons)."
    opacity-hint:
      type: "dimension"
      value: "70%"
      description: "Element opacity for resting secondary controls that reach 100% on hover (e.g. alert close)."
    opacity-hint-soft:
      type: "dimension"
      value: "60%"
      description: "Element opacity for hover-revealed hints (e.g. sort affordance on row hover)."
    opacity-track:
      type: "dimension"
      value: "25%"
      description: "Element opacity of the circular progress track ring."
    overlay:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.28)"
      description: "Modal scrim — an alpha-composite literal (a translucent wash has no primitive step; alpha is intrinsic to the role). Theme-split: the dark scrim is deeper."
    panel-width-lg:
      type: "dimension"
      value: "20rem"
      description: "320px floating panel (rich HoverCard previews)."
    panel-width-md:
      type: "dimension"
      value: "18rem"
      description: "288px floating panel — the default Popover, EmojiPicker, checklist card, range date trigger."
    panel-width-sm:
      type: "dimension"
      value: "14rem"
      description: "224px floating panel (compact popover, small menu, single-value date trigger)."
    popover:
      type: "color"
      value: "oklch(0.994 0.002 75)"
      description: "Every floating surface is the card surface + shadow-overlay; never a lighter or darker rung of its own."
    popover-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    primary:
      type: "color"
      value: "oklch(0.353 0.003 75)"
    primary-active:
      type: "color"
      value: "oklch(0.236 0.003 75)"
    primary-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    primary-hover:
      type: "color"
      value: "oklch(0.269 0.003 75)"
    radius:
      type: "dimension"
      value: "0.75rem"
    radius-lg:
      type: "dimension"
      value: "0.75rem"
    radius-md:
      type: "dimension"
      value: "0.5rem"
    radius-sharp:
      type: "dimension"
      value: "2px"
      description: "The rationed marketing 'sharp' gesture (audit 17/D18): CTAs, chips, figure frames on marketing surfaces. 2px, not 0 — sharp at a glance, kin to the product scale."
    radius-sm:
      type: "dimension"
      value: "0.375rem"
    radius-xs:
      type: "dimension"
      value: "0.125rem"
      description: "Micro radius — caret/arrow triangles and other sub-control geometry (was a silent Tailwind fallback, register P1-10)."
    ring:
      type: "color"
      value: "oklch(0.353 0.003 75)"
    secondary:
      type: "color"
      value: "oklch(0.97 0.003 75)"
      description: "ALIAS of surface-1 (kept so shadcn-shaped code keeps compiling). Never retune independently."
    secondary-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
      description: "ALIAS of foreground — one ink on every neutral rung."
    shadow-overlay:
      type: "shadow"
      value: "0 4px 14px -4px oklch(0.13 0.002 75 / 0.1), 0 2px 4px -2px oklch(0.13 0.002 75 / 0.06)"
    sidebar:
      type: "color"
      value: "oklch(0.994 0.002 75)"
      description: "The sidebar-* family is ALIASES ONLY (B6-01): the rail is a card surface on the ladder, not a second palette. Names kept for shadcn-shaped code."
    sidebar-accent:
      type: "color"
      value: "oklch(0.945 0.003 75)"
      description: "ALIAS of surface-2 — the rail's hover rung; the active row sits one rung higher on surface-3 so active+hover still moves (SP-06)."
    sidebar-accent-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    sidebar-border:
      type: "color"
      value: "oklch(0.145 0.003 75 / 0.08)"
    sidebar-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    sidebar-primary:
      type: "color"
      value: "oklch(0.353 0.003 75)"
    sidebar-primary-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    sidebar-ring:
      type: "color"
      value: "oklch(0.353 0.003 75)"
    sidebar-width:
      type: "dimension"
      value: "15rem"
      description: "Expanded sidebar rail width (was a JS constant invisible to design-lint, register P2-13)."
    sidebar-width-icon:
      type: "dimension"
      value: "3rem"
      description: "Collapsed icon-only rail width."
    sidebar-width-mobile:
      type: "dimension"
      value: "18rem"
      description: "Width of the sidebar when it renders as an off-canvas sheet below the md breakpoint (was an inline `18rem` fallback, B6-08)."
    size-lg:
      type: "dimension"
      value: "2.5rem"
    size-md:
      type: "dimension"
      value: "2rem"
    size-sm:
      type: "dimension"
      value: "1.75rem"
    size-xs:
      type: "dimension"
      value: "1.5rem"
      description: "24px — the compact control tier (Button xs, icon-only affordances like the password eye)."
    success:
      type: "color"
      value: "oklch(0.5 0.16 150)"
    success-active:
      type: "color"
      value: "oklch(0.41 0.16 150)"
      description: "DERIVED: success fill at L-0.09 (active step)."
    success-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    success-hover:
      type: "color"
      value: "oklch(0.45 0.16 150)"
      description: "DERIVED: success fill at L-0.05 (hover step)."
    success-subtle:
      type: "color"
      value: "oklch(0.951 0.051 150)"
    success-subtle-active:
      type: "color"
      value: "oklch(0.896 0.065 151.7)"
      description: "DERIVED: success fill @12% composited over success-subtle (soft-pressed surface, AA-gated against success-text)."
    success-subtle-hover:
      type: "color"
      value: "oklch(0.919 0.059 151.1)"
      description: "DERIVED: success fill @7.000000000000001% composited over success-subtle (soft-hover surface, AA-gated against success-text)."
    success-text:
      type: "color"
      value: "oklch(0.48 0.13 150)"
      description: "Page-readable green ink (was green.650, L 0.5); -0.02 L for the soft pressed rung — see destructive-text."
    surface-1:
      type: "color"
      value: "oklch(0.97 0.003 75)"
      description: "Surface ladder rung 1 — the REST fill of a filled control (secondary/soft button, kbd, chip, segmented rail, tab-list pill) and the sunken well (code block, skeleton, disabled field, slider/progress track). `secondary` and `muted` are aliases of this rung."
    surface-2:
      type: "color"
      value: "oklch(0.945 0.003 75)"
      description: "Surface ladder rung 2 — the HOVER step: a transparent row/item/ghost control hovers to it, a rung-1 control hovers to it. `accent` and `sidebar-accent` are aliases. Alpha twin: bg-foreground/(--alpha-hover)."
    surface-3:
      type: "color"
      value: "oklch(0.922 0.003 75)"
      description: "Surface ladder rung 3 — the PRESSED / SELECTED step (active:, data-selected, the active sidebar row, the switch off-track). Alpha twin: bg-foreground/(--alpha-pressed)."
    tag-blue:
      type: "color"
      value: "oklch(0.6 0.16 256)"
      description: "Tag palette (Attio-teardown Wave 1): 10 chromatic hues x base/subtle/text mirroring the family/family-subtle/family-text shape. base = dots/accents (>=3:1 non-text vs background), subtle = chip fill, text = chip text (>=4.5:1 on subtle AND page). Neutral tags use muted/muted-foreground. AA-validated fail-closed in contrast-check.mjs."
    tag-blue-subtle:
      type: "color"
      value: "oklch(0.955 0.02 256)"
    tag-blue-text:
      type: "color"
      value: "oklch(0.51 0.15 256)"
    tag-cyan:
      type: "color"
      value: "oklch(0.6 0.11 226)"
    tag-cyan-subtle:
      type: "color"
      value: "oklch(0.955 0.028 226)"
    tag-cyan-text:
      type: "color"
      value: "oklch(0.51 0.09 226)"
    tag-green:
      type: "color"
      value: "oklch(0.6 0.16 150)"
    tag-green-subtle:
      type: "color"
      value: "oklch(0.955 0.028 150)"
    tag-green-text:
      type: "color"
      value: "oklch(0.51 0.14 150)"
    tag-lime:
      type: "color"
      value: "oklch(0.6 0.13 117)"
    tag-lime-subtle:
      type: "color"
      value: "oklch(0.955 0.028 117)"
    tag-lime-text:
      type: "color"
      value: "oklch(0.51 0.11 117)"
    tag-magenta:
      type: "color"
      value: "oklch(0.6 0.16 323)"
    tag-magenta-subtle:
      type: "color"
      value: "oklch(0.955 0.028 323)"
    tag-magenta-text:
      type: "color"
      value: "oklch(0.51 0.15 323)"
    tag-orange:
      type: "color"
      value: "oklch(0.6 0.15 52)"
    tag-orange-subtle:
      type: "color"
      value: "oklch(0.955 0.02 52)"
    tag-orange-text:
      type: "color"
      value: "oklch(0.51 0.13 52)"
    tag-pink:
      type: "color"
      value: "oklch(0.6 0.16 356)"
    tag-pink-subtle:
      type: "color"
      value: "oklch(0.955 0.02 356)"
    tag-pink-text:
      type: "color"
      value: "oklch(0.51 0.15 356)"
    tag-purple:
      type: "color"
      value: "oklch(0.6 0.16 295)"
    tag-purple-subtle:
      type: "color"
      value: "oklch(0.955 0.02 295)"
    tag-purple-text:
      type: "color"
      value: "oklch(0.51 0.15 295)"
    tag-red:
      type: "color"
      value: "oklch(0.6 0.16 25)"
    tag-red-subtle:
      type: "color"
      value: "oklch(0.955 0.02 25)"
    tag-red-text:
      type: "color"
      value: "oklch(0.51 0.15 25)"
    tag-yellow:
      type: "color"
      value: "oklch(0.6 0.12 86)"
    tag-yellow-subtle:
      type: "color"
      value: "oklch(0.955 0.028 86)"
    tag-yellow-text:
      type: "color"
      value: "oklch(0.51 0.1 86)"
    text-code:
      type: "typography"
      value:
        fontSize: "0.8125rem"
        lineHeight: "1.25rem"
        fontWeight: "400"
        letterSpacing: "0em"
    text-code-sm:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "1rem"
        fontWeight: "400"
        letterSpacing: "0em"
    text-display-lg:
      type: "typography"
      value:
        fontSize: "3.5rem"
        lineHeight: "3.75rem"
        fontWeight: "400"
        letterSpacing: "-0.05em"
    text-display-md:
      type: "typography"
      value:
        fontSize: "2.5rem"
        lineHeight: "2.75rem"
        fontWeight: "400"
        letterSpacing: "-0.045em"
    text-display-sm:
      type: "typography"
      value:
        fontSize: "2rem"
        lineHeight: "2.25rem"
        fontWeight: "400"
        letterSpacing: "-0.04em"
    text-display-xl:
      type: "typography"
      value:
        fontSize: "4.5rem"
        lineHeight: "4.75rem"
        fontWeight: "400"
        letterSpacing: "-0.06em"
    text-h1:
      type: "typography"
      value:
        fontSize: "1.5rem"
        lineHeight: "2rem"
        fontWeight: "400"
        letterSpacing: "-0.02em"
    text-h2:
      type: "typography"
      value:
        fontSize: "1.25rem"
        lineHeight: "1.75rem"
        fontWeight: "400"
        letterSpacing: "-0.015em"
    text-h3:
      type: "typography"
      value:
        fontSize: "1.125rem"
        lineHeight: "1.5rem"
        fontWeight: "400"
        letterSpacing: "-0.01em"
    text-h4:
      type: "typography"
      value:
        fontSize: "1rem"
        lineHeight: "1.375rem"
        fontWeight: "500"
        letterSpacing: "0em"
    text-label:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "1.25rem"
        fontWeight: "500"
        letterSpacing: "-0.01em"
      description: "Label voice tracking -1% (Wave 1, T3 final): chrome text only, never prose — matches the app-teardown 14/500 chrome standard."
    text-label-sm:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "1rem"
        fontWeight: "500"
        letterSpacing: "-0.01em"
    text-mono-label:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "1rem"
        fontWeight: "400"
        letterSpacing: "0.05em"
      description: "The mono VOICE layer (audit 17/D20): uppercase Geist Mono eyebrows, section numbers, live-state labels, terminal annotations. 12px floor; uppercase is applied at the call site and is mono-exclusive (lint)."
    text-strong:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "1.25rem"
        fontWeight: "600"
        letterSpacing: "-0.01em"
      description: "Rare 600-weight emphasis role. Use text-strong only when 500 cannot carry the hierarchy; raw font-semibold/font-bold utilities remain forbidden."
    type-doc-2xl:
      type: "typography"
      value:
        fontSize: "1.5rem"
        lineHeight: "calc(2 / 1.5)"
    type-doc-3xl:
      type: "typography"
      value:
        fontSize: "1.875rem"
        lineHeight: "calc(2.25 / 1.875)"
    type-doc-base:
      type: "typography"
      value:
        fontSize: "1rem"
        lineHeight: "calc(1.5 / 1)"
    type-doc-lg:
      type: "typography"
      value:
        fontSize: "1.125rem"
        lineHeight: "calc(1.75 / 1.125)"
    type-doc-sm:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "calc(1.25 / 0.875)"
    type-doc-xl:
      type: "typography"
      value:
        fontSize: "1.25rem"
        lineHeight: "calc(1.75 / 1.25)"
    type-doc-xs:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "calc(1 / 0.75)"
    type-product-2xl:
      type: "typography"
      value:
        fontSize: "1.25rem"
        lineHeight: "calc(28 / 20)"
    type-product-3xl:
      type: "typography"
      value:
        fontSize: "1.5rem"
        lineHeight: "calc(32 / 24)"
    type-product-base:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "calc(21 / 14)"
    type-product-lg:
      type: "typography"
      value:
        fontSize: "1rem"
        lineHeight: "calc(24 / 16)"
    type-product-sm:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "calc(16 / 12)"
    type-product-xl:
      type: "typography"
      value:
        fontSize: "1.125rem"
        lineHeight: "calc(26 / 18)"
    type-product-xs:
      type: "typography"
      value:
        fontSize: "0.6875rem"
        lineHeight: "calc(16 / 11)"
    warning:
      type: "color"
      value: "oklch(0.52 0.145 52)"
    warning-active:
      type: "color"
      value: "oklch(0.43 0.145 52)"
      description: "DERIVED: warning fill at L-0.09 (active step)."
    warning-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    warning-hover:
      type: "color"
      value: "oklch(0.47 0.145 52)"
      description: "DERIVED: warning fill at L-0.05 (hover step)."
    warning-subtle:
      type: "color"
      value: "oklch(0.96 0.019 42)"
    warning-subtle-active:
      type: "color"
      value: "oklch(0.906 0.034 51.5)"
      description: "DERIVED: warning fill @12% composited over warning-subtle (soft-pressed surface, AA-gated against warning-text)."
    warning-subtle-hover:
      type: "color"
      value: "oklch(0.929 0.027 48.8)"
      description: "DERIVED: warning fill @7.000000000000001% composited over warning-subtle (soft-hover surface, AA-gated against warning-text)."
    warning-text:
      type: "color"
      value: "oklch(0.505 0.139 42)"
      description: "Page-readable amber ink (was amber.650, L 0.52); -0.015 L for the soft pressed rung — see destructive-text."
    z-overlay:
      type: "number"
      value: 50
      description: "The single portal band: every portaled floating surface (dialog, sheet, popover, menu, select, tooltip, hover-card). Nesting resolves by DOM order — Base UI appends portals to <body>, so a Select inside a Dialog mounts later and stacks above within the same band. Toasts (sonner) are the documented exemption ABOVE this band (library-managed z; a toast must outrank a modal regardless of mount order)."
    z-raised:
      type: "number"
      value: 10
      description: "Local raise WITHIN a component's own stacking context (focused OTP slot / segmented item, floating label, bubble reactions, select scroll arrows). Never for portaled surfaces."
  dark:
    accent:
      type: "color"
      value: "oklch(0.269 0.003 75)"
    accent-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    alpha-backdrop-soft:
      type: "dimension"
      value: "60%"
      description: "Translucent surface backdrop (bg-background) — pill tab list."
    alpha-border:
      type: "dimension"
      value: "14%"
      description: "Dark half of the hairline alpha (D14): near-white ink needs more alpha than near-black to read as a line — foreground at 14% over card measures L 0.325, over the page 0.302."
    alpha-border-soft:
      type: "dimension"
      value: "30%"
      description: "Toast (sonner) status border tint (border-<family>)."
    alpha-border-subtle:
      type: "dimension"
      value: "20%"
      description: "Alert variant border tint (border-<family>)."
    alpha-glass:
      type: "dimension"
      value: "90%"
      description: "Glass button surface (bg-background + backdrop-blur)."
    alpha-glass-hover:
      type: "dimension"
      value: "95%"
      description: "Glass button surface on hover."
    alpha-hover:
      type: "dimension"
      value: "7%"
      description: "The alpha twin of surface-2: `bg-<ink>/(--alpha-hover)` composites the hover rung onto ANY backdrop (a kbd inside a hovered row, a chip on a well, a control over media). foreground at 7% over the page measures L 0.943 light / 0.267 dark over card — within 0.003 of the opaque rung. Theme-invariant."
    alpha-ink-tint:
      type: "dimension"
      value: "10%"
      description: "Neutral pressed/hover ink tint (bg-foreground) — toggle pressed, chip remove hover."
    alpha-ink-tint-strong:
      type: "dimension"
      value: "15%"
      description: "Hovered pressed-state ink tint (bg-foreground)."
    alpha-input:
      type: "dimension"
      value: "30%"
      description: "Dark-theme input fill tint (bg-input) — see the dark-tint scoping note."
    alpha-link-hover:
      type: "dimension"
      value: "80%"
      description: "Hovered link text dim (text-info-text) in rendered rich text."
    alpha-outline-border:
      type: "dimension"
      value: "50%"
      description: "Resting border of the outline button family (border-<family>)."
    alpha-outline-soft:
      type: "dimension"
      value: "50%"
      description: "Soft neutral outline/ring (base outline default, date-picker today ring)."
    alpha-pressed:
      type: "dimension"
      value: "10%"
      description: "The alpha twin of surface-3 (pressed/selected): foreground at 10% measures L 0.921 light / 0.292 dark over card. Theme-invariant."
    alpha-soft-hover:
      type: "dimension"
      value: "30%"
      description: "Dark half of the theme-split soft-surface hover wash."
    alpha-soft-surface:
      type: "dimension"
      value: "20%"
      description: "Dark half of the theme-split soft-surface resting wash."
    alpha-surface-faint:
      type: "dimension"
      value: "5%"
      description: "Resting wash of the outline button family (bg-<family>)."
    alpha-tint-border:
      type: "dimension"
      value: "70%"
      description: "Border tint for focus (ring) and error (destructive) borders — design.md's ring/70 pattern."
    alpha-wash:
      type: "dimension"
      value: "50%"
      description: "Neutral wash (bg-muted) — card/table footers, ghost dark hover."
    alpha-wash-faint:
      type: "dimension"
      value: "40%"
      description: "Faint neutral wash (bg-muted) — rich-text toolbar."
    alpha-wash-strong:
      type: "dimension"
      value: "60%"
      description: "Stronger neutral wash (bg-muted) — line-tab hover."
    background:
      type: "color"
      value: "oklch(0.175 0.003 75)"
    border:
      type: "color"
      value: "oklch(0.922 0.003 75 / 0.14)"
      description: "DERIVED: foreground at 14% (alpha-border) — the one alpha hairline (D14)."
    brand:
      type: "color"
      value: "oklch(0.86 0.21 148)"
      description: "The phosphor-green brand accent, DARK half — MK's pick (13.3:1 on the dark canvas). Marker roles only."
    card:
      type: "color"
      value: "oklch(0.205 0.003 75)"
    card-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    chart-1:
      type: "color"
      value: "oklch(0.623 0.214 259.81)"
    chart-2:
      type: "color"
      value: "oklch(0.696 0.17 162.48)"
    chart-3:
      type: "color"
      value: "oklch(0.769 0.188 70.08)"
    chart-4:
      type: "color"
      value: "oklch(0.75 0.183 55.93)"
    chart-5:
      type: "color"
      value: "oklch(0.645 0.246 16.44)"
    chart-6:
      type: "color"
      value: "oklch(0.69 0.21 25)"
    chart-7:
      type: "color"
      value: "oklch(0.72 0.15 103.9)"
    chart-8:
      type: "color"
      value: "oklch(0.72 0.13 256)"
    chart-single:
      type: "color"
      value: "oklch(0.922 0.003 75)"
      description: "Repeated here on purpose: an alias is resolved per run, so a light-only alias would leak the LIGHT ink into `.dark` through the cascade (the contrast gate caught exactly that)."
    destructive:
      type: "color"
      value: "oklch(0.505 0.213 27.52)"
    destructive-active:
      type: "color"
      value: "oklch(0.415 0.213 27.52)"
      description: "DERIVED: destructive fill at L-0.09 (active step)."
    destructive-border:
      type: "color"
      value: "oklch(0.72 0.16 25)"
      description: "Dark-ground invalid-state border ink. red.400 at --alpha-tint-border measures 4.00:1 on background and 3.86:1 on card, clearing the 3:1 WCAG 1.4.11 floor the shared destructive fill misses (1.92:1)."
    destructive-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    destructive-hover:
      type: "color"
      value: "oklch(0.455 0.213 27.52)"
      description: "DERIVED: destructive fill at L-0.05 (hover step)."
    destructive-subtle:
      type: "color"
      value: "oklch(0.275 0.07 25)"
    destructive-subtle-active:
      type: "color"
      value: "oklch(0.364 0.137 26.9)"
      description: "DERIVED: destructive fill @40% composited over destructive-subtle (soft-pressed surface, AA-gated against destructive-text)."
    destructive-subtle-hover:
      type: "color"
      value: "oklch(0.34 0.123 26.3)"
      description: "DERIVED: destructive fill @30% composited over destructive-subtle (soft-hover surface, AA-gated against destructive-text)."
    destructive-text:
      type: "color"
      value: "oklch(0.74 0.16 25)"
      description: "Dark red ink (was red.400, L 0.72); +0.02 L so the soft pressed rung (fill @40% over subtle) clears 4.5:1 — see the light destructive-text note."
    duration-base:
      type: "duration"
      value: "200ms"
    duration-fast:
      type: "duration"
      value: "150ms"
    duration-indeterminate:
      type: "duration"
      value: "1200ms"
      description: "1200ms — the loop cadence of the ONE sanctioned looping utility, `motion-indeterminate` (an indeterminate Progress sweep; audit M-06). Not an interaction duration: interactions use fast/base/slow."
    duration-slow:
      type: "duration"
      value: "300ms"
    effect-blur-glass:
      type: "dimension"
      value: "8px"
      description: "Backdrop blur for chrome that floats over content (the Attachment upload veil). The Button `glass` variant it was introduced for was deleted 2026-09-07 (audit D16)."
    font-family-display:
      type: "fontFamily"
      value: "Geist, sans-serif"
      description: "Display tier face — same family as sans today, split as a token so marketing can retune independently."
    font-family-mono:
      type: "fontFamily"
      value: "'Geist Mono', monospace"
    font-family-pixel:
      type: "fontFamily"
      value: "'Geist Pixel Square', monospace"
      description: "THE single sanctioned Geist Pixel flourish cut (D17: one deliberate hero use per surface, no more)."
    font-family-sans:
      type: "fontFamily"
      value: "Geist, sans-serif"
    font-family-serif:
      type: "fontFamily"
      value: "Newsreader, serif"
      description: "Serif ACCENT (D17): display emphasis words + pull-quotes only, never running text. Newsreader (opsz axis) until Geist Serif ships."
    foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    icon-action:
      type: "dimension"
      value: "1.25rem"
      description: "20px icon — standalone action icons (design.md 'action')."
    icon-compact:
      type: "dimension"
      value: "0.75rem"
      description: "12px icon — inside xs controls only (below design.md's named scale; exists for the kept Button xs tier)."
    icon-default:
      type: "dimension"
      value: "1rem"
      description: "16px icon — the default control icon (design.md 'default')."
    icon-feature:
      type: "dimension"
      value: "1.5rem"
      description: "24px icon — feature/empty-state glyphs (design.md 'feature')."
    icon-inline:
      type: "dimension"
      value: "0.875rem"
      description: "14px icon — inline with body text and sm controls (design.md §Iconography 'inline')."
    info:
      type: "color"
      value: "oklch(0.531 0.182 256)"
    info-active:
      type: "color"
      value: "oklch(0.441 0.182 256)"
      description: "DERIVED: info fill at L-0.09 (active step)."
    info-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    info-hover:
      type: "color"
      value: "oklch(0.481 0.182 256)"
      description: "DERIVED: info fill at L-0.05 (hover step)."
    info-subtle:
      type: "color"
      value: "oklch(0.275 0.059 255)"
    info-subtle-active:
      type: "color"
      value: "oklch(0.38 0.114 254.5)"
      description: "DERIVED: info fill @40% composited over info-subtle (soft-pressed surface, AA-gated against info-text)."
    info-subtle-hover:
      type: "color"
      value: "oklch(0.354 0.101 254.3)"
      description: "DERIVED: info fill @30% composited over info-subtle (soft-hover surface, AA-gated against info-text)."
    info-text:
      type: "color"
      value: "oklch(0.76 0.13 256)"
      description: "Dark link / informational blue ink (was blue.400, L 0.72); +0.04 L for the soft pressed rung — blue had the least headroom (4.50:1 at hover)."
    input:
      type: "color"
      value: "oklch(0.922 0.003 75 / 0.14)"
    layout-header-height:
      type: "dimension"
      value: "3.5rem"
      description: "56px app-shell header band (was a raw `h-14`, B6-08). Sticky/fixed content below the header offsets by this."
    layout-overlay-max-height:
      type: "dimension"
      value: "calc(100dvh - 16rem)"
      description: "The tallest a scrolling overlay body (Command list, Board column, ShortcutOverlay) may grow: the dynamic viewport minus a 16rem chrome allowance. DTCG 2025.10 has no calc expression type, so this dimension is authored as the CSS string it resolves to and passed through verbatim (the same precedent as the `easing` linear() token)."
    media-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
      description: "Theme-invariant media chrome ink: the warm off-white used for every icon, label and track drawn over media-scrim or media-scrim-strong. Labels are allowed on EITHER scrim — both are gated at the AA text floor (4.5:1) against this ink over the white worst case. Not overridden in dark on purpose."
    media-scrim:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.6)"
      description: "THEME-INVARIANT media chrome scrim (B4-01): the gradient/backdrop behind controls laid over video or imagery. Always a warm-black alpha, never a theme token, so the chrome reads dark-scrim + light-ink in both themes (`primary` flips with the theme and inverted the chrome in dark). TEXT IS PERMITTED on this scrim: media-foreground clears 5.2:1 on it over a white worst-case backdrop, and tooling/contrast-check.mjs gates the pair at the AA TEXT floor (4.5:1), not the 3:1 non-text floor — so a retune that thins this scrim under AA fails the build rather than silently demoting its labels."
    media-scrim-strong:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.8)"
      description: "Theme-invariant strong scrim for opaque media pills (volume popover, time badge) — 11:1 for media-foreground over a white worst case. Use it for any block of media text that needs headroom beyond the soft scrim's ~5.2:1, and for text over unusually bright or busy frames."
    motion-blur:
      type: "dimension"
      value: "2px"
      description: "Motion-blur amount for blur-fade entrances (Phase M text/element reveals)."
    motion-ease-emphasized:
      type: "cubicBezier"
      value: "cubic-bezier(0.3, 0, 0, 1)"
    motion-ease-exit:
      type: "cubicBezier"
      value: "cubic-bezier(0.4, 0, 1, 1)"
    motion-ease-spring:
      type: "easing"
      value: "linear(0, 0.5 60%, 1.05 80%, 0.98 90%, 1)"
      description: "CSS linear() spring with a very small overshoot — the success-bounce/appear curve for state-feedback micro-interactions (Phase M). Subtle by design: dense dev-tool aesthetic, not playful."
    motion-ease-standard:
      type: "cubicBezier"
      value: "cubic-bezier(0.2, 0, 0, 1)"
    muted:
      type: "color"
      value: "oklch(0.236 0.003 75)"
    muted-foreground:
      type: "color"
      value: "oklch(0.66 0.003 75)"
    muted-foreground-faint:
      type: "color"
      value: "oklch(0.559 0.003 75)"
    opacity-dim:
      type: "dimension"
      value: "50%"
      description: "Element opacity for disabled controls and dimmed affordances (outside-month days, decorative chevrons)."
    opacity-hint:
      type: "dimension"
      value: "70%"
      description: "Element opacity for resting secondary controls that reach 100% on hover (e.g. alert close)."
    opacity-hint-soft:
      type: "dimension"
      value: "60%"
      description: "Element opacity for hover-revealed hints (e.g. sort affordance on row hover)."
    opacity-track:
      type: "dimension"
      value: "25%"
      description: "Element opacity of the circular progress track ring."
    overlay:
      type: "color"
      value: "oklch(0 0 0 / 0.55)"
    panel-width-lg:
      type: "dimension"
      value: "20rem"
      description: "320px floating panel (rich HoverCard previews)."
    panel-width-md:
      type: "dimension"
      value: "18rem"
      description: "288px floating panel — the default Popover, EmojiPicker, checklist card, range date trigger."
    panel-width-sm:
      type: "dimension"
      value: "14rem"
      description: "224px floating panel (compact popover, small menu, single-value date trigger)."
    popover:
      type: "color"
      value: "oklch(0.205 0.003 75)"
    popover-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    primary:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    primary-active:
      type: "color"
      value: "oklch(0.994 0.002 75)"
    primary-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    primary-hover:
      type: "color"
      value: "oklch(0.97 0.003 75)"
    radius:
      type: "dimension"
      value: "0.75rem"
    radius-lg:
      type: "dimension"
      value: "0.75rem"
    radius-md:
      type: "dimension"
      value: "0.5rem"
    radius-sharp:
      type: "dimension"
      value: "2px"
      description: "The rationed marketing 'sharp' gesture (audit 17/D18): CTAs, chips, figure frames on marketing surfaces. 2px, not 0 — sharp at a glance, kin to the product scale."
    radius-sm:
      type: "dimension"
      value: "0.375rem"
    radius-xs:
      type: "dimension"
      value: "0.125rem"
      description: "Micro radius — caret/arrow triangles and other sub-control geometry (was a silent Tailwind fallback, register P1-10)."
    ring:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    secondary:
      type: "color"
      value: "oklch(0.236 0.003 75)"
    secondary-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    shadow-overlay:
      type: "shadow"
      value: "0 8px 28px -6px oklch(0 0 0 / 0.48), 0 2px 8px -2px oklch(0 0 0 / 0.4)"
      description: "DARK overlay shadow, strengthened (Wave 1 — Attio-calibrated): the old single 24px layer was near-invisible on the dark canvas; this two-layer ramp restores the floating cue while staying below Attio's 88px maximal ramp."
    sidebar:
      type: "color"
      value: "oklch(0.205 0.003 75)"
    sidebar-accent:
      type: "color"
      value: "oklch(0.269 0.003 75)"
    sidebar-accent-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    sidebar-border:
      type: "color"
      value: "oklch(0.922 0.003 75 / 0.14)"
    sidebar-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    sidebar-primary:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    sidebar-primary-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    sidebar-ring:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    sidebar-width:
      type: "dimension"
      value: "15rem"
      description: "Expanded sidebar rail width (was a JS constant invisible to design-lint, register P2-13)."
    sidebar-width-icon:
      type: "dimension"
      value: "3rem"
      description: "Collapsed icon-only rail width."
    sidebar-width-mobile:
      type: "dimension"
      value: "18rem"
      description: "Width of the sidebar when it renders as an off-canvas sheet below the md breakpoint (was an inline `18rem` fallback, B6-08)."
    size-lg:
      type: "dimension"
      value: "2.5rem"
    size-md:
      type: "dimension"
      value: "2rem"
    size-sm:
      type: "dimension"
      value: "1.75rem"
    size-xs:
      type: "dimension"
      value: "1.5rem"
      description: "24px — the compact control tier (Button xs, icon-only affordances like the password eye)."
    success:
      type: "color"
      value: "oklch(0.5 0.16 150)"
    success-active:
      type: "color"
      value: "oklch(0.41 0.16 150)"
      description: "DERIVED: success fill at L-0.09 (active step)."
    success-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    success-hover:
      type: "color"
      value: "oklch(0.45 0.16 150)"
      description: "DERIVED: success fill at L-0.05 (hover step)."
    success-subtle:
      type: "color"
      value: "oklch(0.276 0.061 150)"
    success-subtle-active:
      type: "color"
      value: "oklch(0.371 0.101 148.5)"
      description: "DERIVED: success fill @40% composited over success-subtle (soft-pressed surface, AA-gated against success-text)."
    success-subtle-hover:
      type: "color"
      value: "oklch(0.348 0.092 148.9)"
      description: "DERIVED: success fill @30% composited over success-subtle (soft-hover surface, AA-gated against success-text)."
    success-text:
      type: "color"
      value: "oklch(0.74 0.17 150)"
      description: "Dark green ink (was green.500, L 0.72); +0.02 L for the soft pressed rung."
    surface-1:
      type: "color"
      value: "oklch(0.236 0.003 75)"
      description: "Dark ladder: card 0.205 -> surface-1 0.236 -> surface-2 0.269 -> surface-3 0.29 (lighter = higher, ~0.03 L per rung, the Radix/Linear dark step)."
    surface-2:
      type: "color"
      value: "oklch(0.269 0.003 75)"
    surface-3:
      type: "color"
      value: "oklch(0.29 0.003 75)"
    tag-blue:
      type: "color"
      value: "oklch(0.72 0.14 256)"
    tag-blue-subtle:
      type: "color"
      value: "oklch(0.275 0.05 256)"
    tag-blue-text:
      type: "color"
      value: "oklch(0.75 0.13 256)"
    tag-cyan:
      type: "color"
      value: "oklch(0.72 0.13 226)"
    tag-cyan-subtle:
      type: "color"
      value: "oklch(0.275 0.05 226)"
    tag-cyan-text:
      type: "color"
      value: "oklch(0.75 0.13 226)"
    tag-green:
      type: "color"
      value: "oklch(0.72 0.15 150)"
    tag-green-subtle:
      type: "color"
      value: "oklch(0.275 0.05 150)"
    tag-green-text:
      type: "color"
      value: "oklch(0.75 0.13 150)"
    tag-lime:
      type: "color"
      value: "oklch(0.72 0.15 117)"
    tag-lime-subtle:
      type: "color"
      value: "oklch(0.275 0.05 117)"
    tag-lime-text:
      type: "color"
      value: "oklch(0.75 0.13 117)"
    tag-magenta:
      type: "color"
      value: "oklch(0.72 0.15 323)"
    tag-magenta-subtle:
      type: "color"
      value: "oklch(0.275 0.05 323)"
    tag-magenta-text:
      type: "color"
      value: "oklch(0.75 0.13 323)"
    tag-orange:
      type: "color"
      value: "oklch(0.72 0.15 52)"
    tag-orange-subtle:
      type: "color"
      value: "oklch(0.275 0.05 52)"
    tag-orange-text:
      type: "color"
      value: "oklch(0.75 0.13 52)"
    tag-pink:
      type: "color"
      value: "oklch(0.72 0.15 356)"
    tag-pink-subtle:
      type: "color"
      value: "oklch(0.275 0.05 356)"
    tag-pink-text:
      type: "color"
      value: "oklch(0.75 0.13 356)"
    tag-purple:
      type: "color"
      value: "oklch(0.72 0.15 295)"
    tag-purple-subtle:
      type: "color"
      value: "oklch(0.275 0.05 295)"
    tag-purple-text:
      type: "color"
      value: "oklch(0.75 0.13 295)"
    tag-red:
      type: "color"
      value: "oklch(0.72 0.15 25)"
    tag-red-subtle:
      type: "color"
      value: "oklch(0.275 0.05 25)"
    tag-red-text:
      type: "color"
      value: "oklch(0.75 0.13 25)"
    tag-yellow:
      type: "color"
      value: "oklch(0.72 0.14 86)"
    tag-yellow-subtle:
      type: "color"
      value: "oklch(0.275 0.05 86)"
    tag-yellow-text:
      type: "color"
      value: "oklch(0.75 0.13 86)"
    text-code:
      type: "typography"
      value:
        fontSize: "0.8125rem"
        lineHeight: "1.25rem"
        fontWeight: "400"
        letterSpacing: "0em"
    text-code-sm:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "1rem"
        fontWeight: "400"
        letterSpacing: "0em"
    text-display-lg:
      type: "typography"
      value:
        fontSize: "3.5rem"
        lineHeight: "3.75rem"
        fontWeight: "400"
        letterSpacing: "-0.05em"
    text-display-md:
      type: "typography"
      value:
        fontSize: "2.5rem"
        lineHeight: "2.75rem"
        fontWeight: "400"
        letterSpacing: "-0.045em"
    text-display-sm:
      type: "typography"
      value:
        fontSize: "2rem"
        lineHeight: "2.25rem"
        fontWeight: "400"
        letterSpacing: "-0.04em"
    text-display-xl:
      type: "typography"
      value:
        fontSize: "4.5rem"
        lineHeight: "4.75rem"
        fontWeight: "400"
        letterSpacing: "-0.06em"
    text-h1:
      type: "typography"
      value:
        fontSize: "1.5rem"
        lineHeight: "2rem"
        fontWeight: "400"
        letterSpacing: "-0.02em"
    text-h2:
      type: "typography"
      value:
        fontSize: "1.25rem"
        lineHeight: "1.75rem"
        fontWeight: "400"
        letterSpacing: "-0.015em"
    text-h3:
      type: "typography"
      value:
        fontSize: "1.125rem"
        lineHeight: "1.5rem"
        fontWeight: "400"
        letterSpacing: "-0.01em"
    text-h4:
      type: "typography"
      value:
        fontSize: "1rem"
        lineHeight: "1.375rem"
        fontWeight: "500"
        letterSpacing: "0em"
    text-label:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "1.25rem"
        fontWeight: "500"
        letterSpacing: "-0.01em"
      description: "Label voice tracking -1% (Wave 1, T3 final): chrome text only, never prose — matches the app-teardown 14/500 chrome standard."
    text-label-sm:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "1rem"
        fontWeight: "500"
        letterSpacing: "-0.01em"
    text-mono-label:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "1rem"
        fontWeight: "400"
        letterSpacing: "0.05em"
      description: "The mono VOICE layer (audit 17/D20): uppercase Geist Mono eyebrows, section numbers, live-state labels, terminal annotations. 12px floor; uppercase is applied at the call site and is mono-exclusive (lint)."
    text-strong:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "1.25rem"
        fontWeight: "600"
        letterSpacing: "-0.01em"
      description: "Rare 600-weight emphasis role. Use text-strong only when 500 cannot carry the hierarchy; raw font-semibold/font-bold utilities remain forbidden."
    type-doc-2xl:
      type: "typography"
      value:
        fontSize: "1.5rem"
        lineHeight: "calc(2 / 1.5)"
    type-doc-3xl:
      type: "typography"
      value:
        fontSize: "1.875rem"
        lineHeight: "calc(2.25 / 1.875)"
    type-doc-base:
      type: "typography"
      value:
        fontSize: "1rem"
        lineHeight: "calc(1.5 / 1)"
    type-doc-lg:
      type: "typography"
      value:
        fontSize: "1.125rem"
        lineHeight: "calc(1.75 / 1.125)"
    type-doc-sm:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "calc(1.25 / 0.875)"
    type-doc-xl:
      type: "typography"
      value:
        fontSize: "1.25rem"
        lineHeight: "calc(1.75 / 1.25)"
    type-doc-xs:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "calc(1 / 0.75)"
    type-product-2xl:
      type: "typography"
      value:
        fontSize: "1.25rem"
        lineHeight: "calc(28 / 20)"
    type-product-3xl:
      type: "typography"
      value:
        fontSize: "1.5rem"
        lineHeight: "calc(32 / 24)"
    type-product-base:
      type: "typography"
      value:
        fontSize: "0.875rem"
        lineHeight: "calc(21 / 14)"
    type-product-lg:
      type: "typography"
      value:
        fontSize: "1rem"
        lineHeight: "calc(24 / 16)"
    type-product-sm:
      type: "typography"
      value:
        fontSize: "0.75rem"
        lineHeight: "calc(16 / 12)"
    type-product-xl:
      type: "typography"
      value:
        fontSize: "1.125rem"
        lineHeight: "calc(26 / 18)"
    type-product-xs:
      type: "typography"
      value:
        fontSize: "0.6875rem"
        lineHeight: "calc(16 / 11)"
    warning:
      type: "color"
      value: "oklch(0.52 0.145 52)"
    warning-active:
      type: "color"
      value: "oklch(0.43 0.145 52)"
      description: "DERIVED: warning fill at L-0.09 (active step)."
    warning-foreground:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    warning-hover:
      type: "color"
      value: "oklch(0.47 0.145 52)"
      description: "DERIVED: warning fill at L-0.05 (hover step)."
    warning-subtle:
      type: "color"
      value: "oklch(0.28 0.069 42)"
    warning-subtle-active:
      type: "color"
      value: "oklch(0.381 0.1 47.3)"
      description: "DERIVED: warning fill @40% composited over warning-subtle (soft-pressed surface, AA-gated against warning-text)."
    warning-subtle-hover:
      type: "color"
      value: "oklch(0.356 0.093 46.6)"
      description: "DERIVED: warning fill @30% composited over warning-subtle (soft-hover surface, AA-gated against warning-text)."
    warning-text:
      type: "color"
      value: "oklch(0.769 0.188 70.08)"
    z-overlay:
      type: "number"
      value: 50
      description: "The single portal band: every portaled floating surface (dialog, sheet, popover, menu, select, tooltip, hover-card). Nesting resolves by DOM order — Base UI appends portals to <body>, so a Select inside a Dialog mounts later and stacks above within the same band. Toasts (sonner) are the documented exemption ABOVE this band (library-managed z; a toast must outrank a modal regardless of mount order)."
    z-raised:
      type: "number"
      value: 10
      description: "Local raise WITHIN a component's own stacking context (focused OTP slot / segmented item, floating label, bubble reactions, select scroll arrows). Never for portaled surfaces."
recipes:
  button-primary:
    background: "{primary}"
    foreground: "{primary-foreground}"
    hover: "{primary-hover}"
    active: "{primary-active}"
    radius: "{radius-md}"
    height: "{size-md}"
    paddingInline: "0.75rem"
    typography: "{text-label}"
    interactionColorTransition: "immediate"
  button-secondary:
    background: "{surface-1}"
    foreground: "{secondary-foreground}"
    hover: "{surface-2}"
    active: "{surface-3}"
    radius: "{radius-md}"
    height: "{size-md}"
    paddingInline: "0.75rem"
    typography: "{text-label}"
    interactionColorTransition: "immediate"
  button-destructive:
    background: "{destructive-subtle}"
    foreground: "{destructive-text}"
    hover: "{destructive-subtle-hover}"
    active: "{destructive-subtle-active}"
    radius: "{radius-md}"
    height: "{size-md}"
    paddingInline: "0.75rem"
    typography: "{text-label}"
    interactionColorTransition: "immediate"
  input:
    background: "{surface-1}"
    foreground: "{foreground}"
    border: "{input}"
    focusBorder: "{ring}"
    radius: "{radius-md}"
    height: "{size-md}"
    paddingInline: "0.75rem"
    typography: "{type-product-base}"
  card:
    background: "{card}"
    foreground: "{card-foreground}"
    border: "{border}"
    radius: "{radius-lg}"
    shadow: "none"
  overlay:
    background: "{popover}"
    foreground: "{popover-foreground}"
    border: "{border}"
    radius: "{radius-lg}"
    shadow: "{shadow-overlay}"
  menu-item:
    foreground: "{foreground}"
    hover: "{surface-2}"
    active: "{surface-3}"
    selected: "{surface-3}"
    radius: "{radius-sm}"
    height: "{size-md}"
    paddingInline: "0.5rem"
    typography: "{type-product-base}"
    interactionColorTransition: "immediate"
---

# VegaStack design

## Overview

VegaStack is a design system for building **agentic-enterprise** product interfaces — admin consoles,
dashboards, and AI/agent surfaces (chat, reasoning, tool calls, workflows). It is built on **Base UI**
primitives + **Tailwind v4**, with **OKLCH** design tokens served as a public token layer and a private
shadcn component registry.

**Light and dark are co-primary** — neither is derived; every token is authored and contrast-validated in
both. The aesthetic is **warm-neutral, restrained, futuristic**: surfaces are a barely-warm white (deep,
non-espresso near-black in dark), articulated by a **single derived alpha hairline** (`foreground` at
`--alpha-border` — 8% light / 14% dark), not heavy fills
or shadows. The **neutral-ink primary does the bulk of the work**; colour is rationed and meaningful.

**Key characteristics**

- **One warm neutral ramp.** Every grey/black/white comes from the shared OKLCH neutral primitives
  (hue 75, chroma ~0.003 — barely warm), identical in both themes.
- **OKLCH-authored.** All colours are authored in OKLCH in the DTCG source; the hex shown is the sRGB render — P3-ready notation, sRGB-faithful chroma (no wide-gamut push, by restraint).
- **Scales are tokens.** Colour, control sizes (`--size-*`), radius (`--radius-*`), the one sanctioned shadow (`--shadow-overlay`), motion, and type (`--text-*`) are all DTCG tokens — change one, every component re-skins.
- **Neutral-ink primary.** The default action is a charcoal/near-white neutral (Vercel-style), not a colour. Almost every button is `primary`.
- **One rationed chromatic.** `info` (blue) = links and informational UI — the whole colour budget beyond status. The neutral-ink `primary` carries the key action, AI/agent surfaces, and selected/active state.
- **One border, flat by default.** A single warm-neutral hairline carries all separation, and it is an **alpha**: `border` is DERIVED as `foreground` at `--alpha-border` (8% light / 14% dark), so the same line reads on the page, on a card, in a well and on a dark band. Overlays get `shadow-overlay`; nothing else gets a shadow at all.
- **Restrained headlines, crisp body.** Functional headings and the display hero both render at weight 400; 14px body; weight tops out at a rare 600 emphasis (D3), never a UI default.
- **One neutral focus outline.** A 2px `:focus-visible` outline in the `ring` token (= primary ink), centralized — never a colour or glow, so the accent stays free.
- **AA by contract.** Every gated foreground/background pair clears WCAG 2.2 AA in both themes, enforced by a fail-closed build gate.

## Colours

### The warm neutral ramp

Every neutral — every grey, black, and white — resolves from the single OKLCH primitive family (hue 75,
chroma ~0.003), shared by both themes. The warmth is a whisper toward paper, not parchment; `white` is a
warm near-white and `neutral-925` a barely-warm deep canvas (genuinely dark, not espresso). Light and dark
are semantic references into that family. The generated frontmatter exposes the resolved semantic values;
`packages/design-tokens/tokens/primitives.tokens.json` owns the ramp itself.

### Surfaces — the ladder

**One neutral ladder carries every surface and every interaction step.** Three rungs sit above the
page; each rung is one even step (~0.025 L light, ~0.03 L dark — the Geist/Radix/Linear step size),
and each has an **alpha twin** so the same rung composites onto any backdrop.

| role                             | token                          | light L | dark L | what sits on it                                                                          |
| -------------------------------- | ------------------------------ | ------: | -----: | ---------------------------------------------------------------------------------------- |
| Page                             | `background`                   |   0.994 |  0.175 | the canvas                                                                               |
| Surface                          | `card` = `popover` = `sidebar` |   0.994 |  0.205 | cards, panels, every floating surface, the rail                                          |
| Rung 1 — rest fill / sunken well | `surface-1`                    |   0.970 |  0.236 | the rest fill of a filled control (soft button, kbd, chip, tab-list rail) and every well |
| Rung 2 — **hover**               | `surface-2`                    |   0.945 |  0.269 | a transparent row/item/ghost control on hover; a rung-1 control on hover                 |
| Rung 3 — **pressed / selected**  | `surface-3`                    |   0.922 |  0.290 | `active:`, `data-selected`, the current sidebar row                                      |

- **Light surfaces are page-coloured**; a light card is separated by the hairline alone. No
  reference system lifts or sinks a light card, and neither do we. **Dark keeps the one-step lift**
  (0.175 → 0.205), which is how dark UIs read depth.
- **`popover` and `sidebar` are the card surface.** A floating surface is card + `shadow-overlay`,
  never a lighter or darker rung of its own; the rail is not a second palette.
- **The alpha twins** are `--alpha-hover` (7%) and `--alpha-pressed` (10%) on an ink. Painted over
  the page they land within 0.003 L of the opaque rungs, so `bg-foreground/(--alpha-hover)` and
  `bg-surface-2` are interchangeable by eye — use the alpha form when the backdrop is _not_ a ladder
  surface (a kbd inside a hovered row, a chip on a well, chrome over media) or when a control hovers
  in its own hue. Both alphas are theme-invariant.
- **`secondary`, `muted`, `accent` and the whole `sidebar-*` family are ALIASES**, kept so
  shadcn-shaped code keeps compiling: `secondary` = `muted` = `surface-1`, `accent` =
  `sidebar-accent` = `surface-2`, `sidebar` = `card`, `sidebar-border` = `border`, `sidebar-ring` =
  `ring`. They have no independent values in the token source and must never be retuned on their
  own. `accent` is a **neutral** — `bg-accent` is never blue or any other hue.
- **Text ramp:** `foreground` (ink) → `muted-foreground` (secondary text, the AA workhorse) →
  `muted-foreground-faint` (placeholders & disabled **only** — intentionally below AA; never for
  content, including captions). Both real inks clear AA on **every** rung in both themes; that is a
  build gate, not a guideline.
- **`primary`** is a charcoal (`neutral-700`) in light / near-white (`neutral-200`) in dark — the
  neutral-ink workhorse action, with `primary-hover`/`primary-active` one step further.
- **One border, and it is an alpha.** `border` is **derived** as `foreground` at `--alpha-border`
  (8% light / 14% dark), so a single hairline reads on the page, on a card, in a well and on a dark
  band without ever drifting from the ink it tints. `input` and `sidebar-border` alias it. Plus
  `overlay` for the modal scrim. No `border-strong` / `overlay-border` / ad-hoc line token; overlays
  separate via the shadow, not a heavier border.
- **`ring`** is the focus basis and equals **`primary`** (neutral ink) — see Accessibility.
- **Tracks and wells are `surface-1`** — slider rail, progress track, skeleton, code block,
  disabled field. The **switch off-track is the exception: `surface-3`**, because it is a pressed /
  selected-weight affordance rather than a well, and it must read against the thumb. There is no
  separate `track` token; it was deleted into the ladder.

### Hover geometry

- **A hover wash is inset ≥4px from any container hairline** and **inherits the container's inner
  radius**. A wash that runs flush into the border reads as a rendering bug, not a state.
- **A pressed step exists on every control.** Hover moves one rung; pressing moves one more. A
  control that changes nothing on `:active` is unfinished.
- **Selected is the pressed rung**, not a fourth step (`data-selected:bg-surface-3`) — which is why
  an active row must still visibly move when hovered.
- **One hover mechanism.** Every wash comes from the two recipes exported by `@vegastack/design`:
  `surfaceInteractive` (`hover:bg-surface-2 active:bg-surface-3`) for a control on a known surface,
  and `fillInteractive.<tone>` (`hover:bg-<tone>/(--alpha-hover) active:bg-<tone>/(--alpha-pressed)`)
  for one on an unknown backdrop or in its own hue. No component writes its own `hover:bg-*`
  literal, and **an opacity dim (`/80`) is never a hover state** — it thins the fill instead of
  moving it.
- **A control with no surface signals in ink, both ways.** An accordion header, a link-like trigger
  or an icon-only ink button whose hover is an underline or a brighter ink takes its _pressed_ step
  in ink as well (`active:text-muted-foreground`). This is the one sanctioned alternative to the
  wash, and it exists because those controls sit flush against a container hairline, where a wash
  would violate the inset rule above. When such a control is later given padding and an inner
  radius, it moves to the recipes — both steps together.
- **A solid fill does not use the alpha twins.** A solid already owns darker `-hover`/`-active`
  steps; an alpha over a solid only thins it. Soft (tinted) fills step through their precomposed
  `<family>-subtle-hover` / `<family>-subtle-active`.

### Chromatic colour — rationed

The chrome is warm-neutral; colour carries meaning and is **rationed to one chromatic accent (blue) + three
status hues**. Each family is an eight-token ramp (`fill` / `hover` / `active` / `foreground` / `subtle` /
`subtle-hover` / `subtle-active` / `text`) — `subtle-active` is the soft fill's PRESSED step, precomposed
like `subtle-hover` because an `active:bg-<fam>/(--alpha-pressed)` would replace the tint instead of
stepping it. All use **warm-off-white on-fill text** uniformly; `hover`/`active` darken so contrast only rises. `subtle`
(soft tinted background) and `text` (readable colour for page/alert) adapt per theme.

| Family        | Role                                      | Fill (sRGB render of the shipped OKLCH) | On-fill                           | Hue             |
| ------------- | ----------------------------------------- | --------------------------------------- | --------------------------------- | --------------- |
| **`info`**    | **links** · informational badges & alerts | `#0068d2`                               | warm off-white `#fbfaf8` (5.13:1) | blue, 256       |
| `destructive` | danger, errors, destructive actions       | `#c10007`                               | warm off-white (6.15:1)           | red, 27.5       |
| `success`     | success, positive state                   | `#007b2a`                               | warm off-white (5.23:1)           | green, 150      |
| `warning`     | warning, caution                          | `#a74a00`                               | warm off-white (5.56:1)           | deep orange, 52 |

**Usage rules**

- **`primary` (neutral) is the default AND the accent** — it carries almost every action plus the value/selection accents: the single most important action, AI/agent surfaces, active tab underline, current page, slider/progress fill, selected date, and checked switch/checkbox/radio and the select checkmark. There is no separate accent hue.
- **`info` (blue) is for links and informational UI ONLY** — text links, info alerts and badges. This is the conventional "blue = link/info," and the only chromatic accent. It is **never** promotion, selection or emphasis: a highlighted pricing plan, a promoted comparison column, a selected row and a neutral empty state all take a ladder rung (`surface-2`/`surface-3`) or `primary`, never `info`.
- **Keep blue out of action clusters.** `info` (≈256°) is link/info **text** only. Actions are neutral `primary`, so a blue link never competes with an action for "which is clickable?"
- For a solid button use `{family}.fill` + white text; for an alert/badge use `{family}.subtle` + `{family}.text`; for hover/active step to `.hover` / `.active`.

### Charts & data-viz

Three scales, a **separate** system from UI colour (data needs distinction, not meaning):

- **Categorical** (`chart-1…8`) — qualitative series tuned for separation in each theme. The series intentionally vary in lightness and chroma; direct OKLCH values may exceed sRGB and the build reports clipping used for WCAG calculation. Assign in order, pair hue with labels/patterns, and do not publish duplicate `*-p3` tokens.
- **Sequential** (`sequential`) — ordered low→high (heatmaps, density). One hue: the **blue** mixed into the surface via `color-mix(in oklch …)`, so it re-skins with the blue and the theme (dark inverts dark→light automatically), with zero hand-picked values.
- **Diverging** (`diverging`) — signed ± around a neutral midpoint: `destructive` ← `muted` (centre) → `success`. The one place reusing status is correct, because the ends genuinely mean negative/positive.

As with all state, never rely on colour alone — label series directly or via a legend + icon/dash.

## Typography

**Geist Sans** sets UI and prose; **Geist Mono** sets code, data, tabular figures, and the mono "voice"
role (eyebrows, FIG captions, terminal, uppercase CTAs — see §Brand & marketing). The scale is
**two-layer**: a tighter **product** ladder (previews, portaled popups — `.vs-type-product`) and a
roomier **doc** ladder (the Fumadocs shell, 16px prose); both compile through the same `text-*`
utilities via a scoped `--type-*` binding, so component authoring never changes — only which shell it
renders inside does.

- **Body** `text-base`(14/21, **default**) — chosen for the reading-heavy surfaces of an agentic-
  enterprise product (logs, descriptions, agent output). `text-lg`(16/24) for leads.
- **Core scale** `text-xs`(11) → `text-3xl`(24) — the CAP; `text-4xl` and above is off-scale and
  lint-banned, use a display-tier utility instead. **`text-xs` is mono-only** (TD-3, 2026-09-07):
  11px is reserved for the code/data roles, and sans copy floors at `text-sm`(12). Seven sites
  across four components were reaching 11px in Geist Sans for density; they now sit at 12. If a
  surface still feels too loud at 12, the answer is hierarchy — weight, colour, spacing — not a
  smaller size the type scale does not offer.
- **Display tier** `text-display-sm/md/lg/xl` (32/40/56/72), weight **400** throughout, tokenized
  tracking tightening −0.04em → −0.06em as size grows — marketing/docs heroes only (§Brand & marketing).
- **Functional headings** `text-h1`(24) → `text-h3`(18) at **400**; `text-h4`(16) at **500**.
- **Label** `text-label`(14/500) for UI labels, nav, form labels; `text-label-sm`(12/500) for table
  headers, eyebrows, dense metadata.
- **Code/data** `text-code` (Geist Mono 13, **tabular figures**); `text-code-sm` (Geist Mono 12, tabular)
  for compact numbers.
- **Voice** `text-mono-label` (Geist Mono 12/16, +0.05em tracking) — the marketing/brand-voice role;
  `uppercase` is applied at the call site (never baked into the token) and is **mono-exclusive** —
  uppercase Geist Sans is lint-banned (`uppercase-mono`, D20). 12px is the floor.

**Principles**

- **14px is the default**, chosen for the reading-heavy surfaces of an agentic-enterprise product (logs, descriptions, agent output). A 13px _compact_ density is a documented per-surface allowance, not a separate token.
- **Weight rule:** 400 is the discipline — almost everything renders at 400. 500 for labels/h4. **600 is
  a rare, deliberate emphasis** (D3 cap), not a UI default — reach for size/colour hierarchy before
  weight. At most two weights in one view.
- **Tracking is role-owned:** body/copy stays at the font default; `text-label` uses its named −0.01em
  chrome adjustment, display roles own their negative tracking, and `text-mono-label` owns +0.05em.
  Never add an ad-hoc `tracking-*` utility to compensate locally.
- **Colour + size do hierarchy work:** `foreground` heading over `muted-foreground` body reads as clear levels even at one weight.
- **Apply the type tokens** — never hand-set font-size, line-height, weight, or tracking.

## Layout

- **Spacing** uses Tailwind v4’s 4px base scale. Rhythm: 8px inside a group, 16px between groups, 32–40px between sections. Cards use 16px padding (12px compact via `size="sm"`; there is no separate "hero" size).
- **Breakpoints** use the Tailwind v4 `sm`–`2xl` scale; every layout must work on mobile and desktop.
- **Density:** chrome is compact (28–40px control heights, 14px type) while the canvas around the working column stays open. Container max-width 1080–1200px, side padding grows at wider breakpoints.
- **Responsive content:** prefer flex/grid and container queries over JavaScript measurement. Truncating
  flex children require `min-w-0`; put `truncate`/`line-clamp-*` on an inner non-flex text span, and
  test empty, short, and very long content without introducing horizontal scroll.
- **Touch and safe areas:** interactive hit areas are at least 24×24px; use an invisible hit-area to
  enlarge a smaller visual control, and prefer 44×44px for primary mobile actions when density permits.
  Full-bleed fixed or sticky regions consume `env(safe-area-inset-*)`; sheets and dialogs contain
  overscroll and never disable browser zoom.
- **RTL:** use logical properties and start/end alignment, keep directional icons semantic, and test
  mirrored navigation, mixed-script content, numbers, and long localized labels.

## Elevation & depth

**Flat by default.** Cards, inputs, panels, tables, and the sidebar are **one hairline border, no shadow.**
Only true **overlays** — `dropdown` · `tooltip` · `popover` · `menu` · `select` · `dialog` · `sheet` — get
`shadow-overlay`. Nothing else casts a shadow — the `shadow-lit` action finish and the Button `finish`
prop that carried it were retired 2026-09-07 (audit B1-04), so flat-by-default has no exception left.

- There is exactly **one named shadow role** (`shadow-overlay`); no generic elevation ladder, no
  action finish, and no raw shadow values.
- **Dialogs** rely on the **`overlay` scrim** + `shadow-overlay`, not a dramatic drop.
- **In dark**, the overlay shadow is strengthened but remains subordinate to the **lifted surface**
  (`popover`/`card` a step above `background`) and the border.

### Surfaces — the stacking ladder

Depth comes from surface contrast, not shadow. The rungs and their values are defined once in
§Colours → Surfaces — the ladder; here is only how they **stack**: **Page** (`background`) →
**Surface** (`card`/`popover`/`sidebar`, page-coloured in light, one step lifted in dark) →
**Overlay** (the same surface + `shadow-overlay`). Insets go the other way onto **`surface-1`**
(wells, code blocks, tracks). `surface-2` and `surface-3` are interaction rungs, not elevation —
never build a static panel out of them.

## Motion

Use motion only to clarify a change. Most interactions feel instant. Durations (measured against
Vercel and Linear, 2026-09-07, audit D11): **150ms** state changes **and every floating surface**
(menus, select, combobox, popover, hover-card, tooltip — Geist's menu/popover animations run 150ms
and Linear's transitions sit at 120–250ms), **200ms** modal surfaces and their backdrops (dialog,
alert-dialog, sheet — 150ms reads abrupt for a panel plus a scrim, and 300ms is slow for 2026),
**300ms** reserved for large sheets and page-level transitions. The one floating exception is
NavigationMenu, which takes 200ms because it resizes between items instead of simply appearing. Four eases: **`standard`** (the default,
snappy-decelerate) for nearly everything, **`emphasized`** for entrances that should read more
deliberate, **`exit`** for accelerate-out, **`spring`** (a small-overshoot `linear()` curve) for
state-feedback micro-interactions (`motion-pop-in`). Three keyed-presence utilities cover mount-triggered
one-shot arrivals — `motion-pop-in` (scale+fade), `motion-enter-up` (fade+rise), `motion-shake` (a
decaying shake, replayed via `useAnimationReplay`/`useShakeOnInvalid` without remounting so focus/caret
survive). Full choice-of-mechanism guidance (Base UI lifecycle vs. keyed presence vs. replay APIs vs.
`AnimatedNumber`) lives in `foundations/motion` and `skills/internal/component/SKILL.md` §2 — this section is
the token reference, not the mechanism matrix. **Hover, active, and focus colour changes are immediate**;
never transition colour on a fast interaction and never use `transition: all`. Animate explicit
transform/opacity properties where possible; when a disclosure must animate size, preserve the inner
content's intrinsic size throughout close so text does not reflow. Avoid long, looping, or attention-grabbing animation, and
**honour `prefers-reduced-motion`**: the global reset collapses `motion-*` keyframes to their resting end
state, spinners freeze, skeletons go solid, transitions drop to 0 — and a dedicated
`::view-transition-group/old/new(*)` kill switch covers route-change snapshots the universal `*` reset
can't reach (they live outside normal element matching, on the root's snapshot layer).
**Reduced motion is global and is never restated in a component** (audit B2-06, 2026-09-07). The
`base.css` block owns it with the one sanctioned `!important`, so it already wins over any authored
duration; a per-component `motion-reduce:animate-none` / `motion-reduce:transition-none` adds nothing
and is a second copy of a rule that can then drift. Every such copy was deleted — the repo now contains
**zero** `motion-reduce:` utilities, and that is the enforceable statement of the rule. The one case that
looked like a genuine exception forced a fix to the reset instead of an exception to the doctrine: the
block zeroed `animation-duration` and `iteration-count` but not `animation-delay`, so a staggered
entrance still played out over its full real-time delay window (each word popping instantly, one after
another) — a moving sequence, not the static end state reduced motion promises. The reset now also zeros
`animation-delay` and `transition-delay`, `staggered-text-reveal` restates nothing, and the rule holds
without a carve-out. When a component appears to need its own `motion-reduce:` variant, the reset is
missing a property; fix the reset. The `data-drag-pending` pulses in
`board` and `sortable-list` are NOT such a case and went with the rest: `animate-pulse` resolves to
`opacity: 1` at both ends, so a 0.01ms single iteration already lands on the same resting frame
`animate-none` would. Anything else is banned.
A looping animation is likewise banned with one exception: `motion-indeterminate`, the sweeping segment
of an indeterminate `Progress`, whose keyframes start and end on the same resting frame so the reset
leaves a static 35% segment rather than a bar that reads as complete. AI surfaces define
streaming reveal, a "thinking" pulse, and tool-progress.

## Shapes

Five radius values: the generated DTCG roles expose `xs` 2 · `sharp` 2 (marketing-only) · `sm` 6 ·
`md` 8 · `lg` 12; Tailwind’s `rounded-full` supplies the reserved fully-round role.
`lg` is the product scale's **cap** — containers never exceed it. **`rounded-xl` was removed** (it
silently fell back to Tailwind's unthemed default) and is lint-banned (`removed-radius-xl`); reach for `lg`.

Nested corners must be **concentric** when their gap is 8px or less: `outer radius = inner radius +
padding`. Choose the nearest named 2/6/8/12/full role that preserves that relationship; do not repeat the
same radius on both layers.

**The `rounded-full` rule** — `full` is for inherently round / tag-like objects (avatars, switch tracks,
badges/chips, status dots, slider thumbs) and _deliberate_ pill CTAs. **Container highlights echo their
container's geometry** — sidebar/nav-row hover & active backgrounds, menu-item highlights, and cards use
`md`/`lg`, **never** `full`. `xs` is sub-control geometry (carets/arrows), not a design choice; `sharp` is
the rationed marketing gesture (§Brand & marketing) — don't reach for it on product surfaces. Keep one
radius family per view.

## Iconography

One library: **lucide** (functional line icons), lucide-animated for motion, `thesvg` for brand glyphs —
via `Icon` / `BrandIcon`. Sizes 12 (compact, the `xs` control tier only) / 14 (inline) / 16 (default) / 20
(actions) / 24 (feature), 1.5–2px stroke, always **`currentColor`** so icons inherit text colour and every
state. Never inline an ad-hoc `<svg>` as an icon; never mix icon libraries.

With text that can wrap, align the icon to the **first line**, not the block midpoint: use an
`items-start` row and a line-height-sized icon wrapper. Keep the icon optically equal to the text size.

**The factory owns the controller; icons are data.** Every mirrored lucide-animated icon is a
`createAnimatedIcon({ … })` call describing only its geometry, its Motion variants, and — where
upstream choreography is not a plain play/rest pair — its start/stop steps. The controller lives once
in `@vegastack/design/create-animated-icon`: the animation controls, the reduced-motion gate, the
imperative `startAnimation`/`stopAnimation` handle, and the multi-input trigger rules (hover plays on
a fine pointer, a tap plays on touch, focus plays and blur rests, and every one of them stands down
once a consumer attaches a ref — including the tap driver, so a ref-controlled icon that omits its
own `pointerdown` handler is dead on touch). The host is an **`inline-flex` `<span>`** — an icon sits
inside a line of text, so a block-level box there is a layout bug. Reduced motion is a **live
subscription** to `prefers-reduced-motion`, not a one-shot read: turning the preference on settles
every icon already on screen. `<MotionConfig reducedMotion="always">` adds reduction on top; the
override is **one-way**, because Motion's default context value is `reducedMotion: "never"` and is
indistinguishable from an explicit one, so honouring it would disable reduced motion for every
consumer who mounts no `MotionConfig`.
A behaviour that belongs to every icon belongs in the factory; a generated icon module that contains
a hook, an event handler, or any JSX is a defect the gate rejects — and each generated module is
pinned by SHA-256 in the mirror manifest, so a hand-edited path or timing value is rejected too.

## Components

Each component composes from tokens (frontmatter `recipes` gives the compact machine recipes). One control-height scale —
**xs 24 (Button only) / sm 28 / md 32 (the default tier) / lg 40** (`h-6`/`h-7`/`h-8`/`h-10`), shared by
buttons, inputs, and selects (inputs/selects use sm–lg only) so they line up; padding-x xs 8 / sm 10 /
md 12 / lg 16 (buttons), 12 (inputs). Tokenised as `--size-{xs,sm,md,lg}`. **Every component's `size`
prop uses exactly these four names** — `xs · sm · md · lg`, with `md` the default. There is no tier
called `default` anywhere in the system (renamed 2026-09-07, audit B1-05), and no component owns a
private size vocabulary.

- **Button — two axes, not a list of variants** (audit P2, 2026-09-07). `variant` is the SHAPE: `solid` (the workhorse — a filled action, including the single key action or an AI moment) · `soft` (a tinted fill, the standard lower-emphasis and the ONLY destructive action) · `outline` (a bordered face) · `ghost` (transparent until hovered) · `link` (a text link) · `cta` (the one marketing recipe, brand-locked and tone-less; see Marketing). `tone` is the HUE: `neutral` (default) · `destructive` · `success` · `warning` · `info`. The two compose freely with ONE forbidden cell: **`tone="destructive"` never takes `variant="solid"`** (D4 — a destructive action is soft, outline, ghost or link, never a solid red button). That rule is enforced by the type, not by review. Each variant is written once and reads its hue from `--btn-*` custom properties the tone sets, so all thirty cells share one hover/pressed grammar: solids step to their own darker `-hover`/`-active`, everything else climbs the surface ladder (rung 2 hover, rung 3 pressed) in its own family. Retired the same day: `glass` (D16), the `finish="lit"` prop (B1-04), and the seven colour-in-the-name variants (`success`/`warning`/`info`/`*-outline`) the tone axis replaces. Sizes `xs`(24)/`sm`(28)/`md`(32)/`lg`(40); Button has **no icon size tier** — an icon-only action is `IconButton`, which makes the missing `aria-label` a type error and owns `shape="square" | "round"`. Radius `md`; `text-base`/500 label. **Hover/active darken within the button's own colour** — nothing borrows a hue.
- **Loading and disabled are one contract across Button, IconButton, SplitButton, Toggle and Tabs.** `loading` stacks the spinner OVER the label and keeps the label's box with `opacity-0` — never `visibility: hidden`, which would drop the label out of the accessibility tree and leave a pending button with no accessible name — so a button never changes width when a request starts (B1-08). `disabled` renders `aria-disabled`, **not** the native attribute, and never `pointer-events: none` — an unavailable control must stay focusable and hoverable so a Tooltip can say why (D7). Base UI suppresses activation either way. A disabled control dims; a pending one does not.
- **States** (every button) — default · hover · focus · active · disabled (`opacity-(--opacity-dim)`, 50% + `not-allowed`) · loading (spinner honouring reduced-motion). **Focus = the neutral 2px `:focus-visible` outline (`ring` token = primary ink)** — never a box-shadow glow.
- **Input / Select / Textarea** — transparent fill on the page (dark adds `bg-input/(--alpha-input)` so the field reads as a well against the dark ground), the one `border`, radius `md`, 32px. **Consistent border scale (one alpha step, no per-mode opacity hacks): rest = `border`/`input`; focus/active = `ring/70`; error = `destructive-border/70`.** The error ink is the ONE deliberate per-theme exception in this scale: `destructive` is tuned as a solid button fill carrying light text, and at 70% on the dark ground it measures **1.92:1** — under the 3:1 WCAG 1.4.11 floor for a non-text indicator — while lightening `destructive` itself would drop `destructive-foreground` on the solid button below 4.5:1. So the border has its own role, `destructive-border` (light `red.700` → 4.24:1, dark `red.400` → 4.00:1). The _alpha_ stays identical across themes; only the ink re-grounds. `tooling/contrast-check.mjs` gates this pair composited over background/card/popover/muted/secondary in both themes. Text-entry fields (Input, Textarea, Field control, OTP slots) use the darkened `ring/70` border as their _sole_ focus indicator — no outline (a raw text input can't distinguish mouse from keyboard, so the border is the one consistent cue for both click and Tab). Button-style triggers (Select, date-picker, country-select, color-picker — built on the `outline` Button variant) darken the border to `ring/70` on focus AND add the neutral 2px outline for keyboard nav (`:focus-visible` only). Never a colour, never a glow. Error = `destructive/70` border + `destructive.text` helper. Disabled = reduced opacity + `not-allowed`.
- **Card / Panel** — `card` surface, the one `border`, radius `lg`, **flat (no shadow)**.
- **Badge** — the SAME variant vocabulary as Button: `solid` (family fill + on-colour ink) · `soft` (`{family}.subtle` + `{family}.text`, the default) · `outline` (hairline, no fill — the Attio tag chip, also reachable as `bordered` on `soft`) · `minimal`. Radius `full`, except `minimal`, which has no container at all. Neutral resolves to `muted`. **Three REAL size tiers — `sm` 16px · `md` 20px · `lg` 24px** (D8, 2026-09-07): `sm` used to be `md` with 2px less horizontal padding, which is a padding value, not a size; it is now the dense-table chip. **`minimal` is ink only** — no background, no border, and no horizontal padding, so it aligns flush in a table cell instead of faking a pill — and it carries a **leading dot by default**, because a badge with no container has nothing but colour left to signal status with (1.4.1). An `icon` takes the dot's place; `dot={false}` opts out. The dot is 6px (8px at `lg`).
- **Chip** — the LABEL/SELECTION voice, and there is exactly **one** of it (audit B5-03, 2026-09-07): `hue` (the 10 decorative `--tag-*` trios, or neutral) × `size` (`sm` 28px inline tier · `md` 32px control tier) × `active` (the neutral chip's promotion to the selection rung `surface-2`). `Tag`, `FilterChip`, `ComboboxChip` and ChipInput's chips are all that one primitive composed through Base UI `render` — nothing re-derives a pill's height, radius or rest fill. **A chip's root is not interactive and therefore has no hover and no pressed step**; clicking one does nothing, and the ladder is reserved for controls. **Its remove control is a round ghost `IconButton size="xs"` whose REAL border box is 24×24** — the WCAG 2.5.8 target is the button, never an invisible `::before` (Preflight's `appearance: button` clips a nested `<button>`'s generated content to its own border box, so a pseudo hit area there is measurable and un-hittable). At the `sm` tier that 24px control inside a 28px pill leaves a 2px inset rather than the ≥4px §Hover geometry asks for: 24px is a floor and 28px is the tier, so the two cannot both be honoured, and the target wins.
- **Alert** — `{family}.subtle` background + `{family}.text`, radius `md`, **always paired with an icon** (never colour alone). Info alerts use `info` (blue).
- **Overlays are one module, not eight lookalikes** (audit B3, 2026-09-07). Every anchored surface — popover, hover-card, tooltip, dropdown menu, context menu, select, combobox, navigation menu — composes `floating-surface`: one `Portal → Positioner → Popup (→ Viewport)` composer, one theme-scope hand-off across the portal boundary, one arrow, and four painted surfaces. `panel` is the bordered popover face at the 16px tier; `menu` is the same face at list density with a 4px inset floor; `tooltip` is the inverted ink chip; `navigation` is the morphing mega-menu panel. A component that restates the plumbing has drifted by definition. `DropdownMenu` and `ContextMenu` differ ONLY in how they open: Base UI's `ContextMenu` namespace re-exports `Menu`'s item, checkbox-item, radio-item, group-label, submenu-trigger and separator parts verbatim, so one implementation is bound to both slot prefixes rather than copied.
- **Padding has two tiers, not per-surface literals** (D14). Modal family — dialog, alert-dialog, sheet — is **24px** (`p-6`); the floating family — popover, hover-card, toast — is **16px** (`p-4`); menus keep list density (`p-1` on the list, rows at `px-2 py-1.5`). Panel widths come from `--panel-width-{sm,md,lg}`, never a `w-*` literal, and a popup capped to the viewport uses Base UI's `--available-height`, never a hand-written `100dvh` calc.
- **Dialog / Modal** — `popover` surface, the one `border`, radius `lg`, `shadow-overlay`, over the `overlay` scrim. Title `text-h3`/`h4`; actions right-aligned (`ghost` Cancel + intent button). `DialogContent` sizes through `size` (`xs · sm · md · lg · full`); `AlertDialogAction` is the single owner of a confirmation's `intent` — the popup carries none.
- **Modality is a decision, not an accident** (D12). Popover and Select are **modal by default**: the page holds still under an open anchored panel instead of scrolling out from under it, which is what every popover-based picker wants. Pass `modal={false}` for a lightweight panel. Combobox stays non-modal for its own measured reason and says so in its source.
- **One list-item recipe** — menu items, checkbox/radio items, submenu triggers, select options, combobox options and command rows are `menuItemVariants`. The highlight climbs the surface ladder (`data-highlighted` → rung 2, pressed/selected → rung 3) at radius `md`, which inside the list's 4px padding keeps every wash inset from the popup hairline and concentric with the popup's `lg` corner. Destructive rows use `destructive.text` over a destructive alpha wash.
- **Search inside a panel is a header row, never a nested box** (B8-04/B9-11). A bordered `Input` inside a bordered popup draws two borders. `PanelSearchFrame` is the recipe: sticky, full-bleed, a leading `Search` glyph, no box of its own, a hairline below, at `--size-md` (or `--size-lg` for a palette in a dialog). Command, the Combobox popup input, EmojiPicker and ShortcutOverlay all use it.
- **Sheet is a Drawer** (D15). It runs on Base UI's `Drawer` — swipe-to-dismiss, snap points, and a virtual-keyboard provider for sheets containing fields — because Base UI's own guidance is that a positioned Dialog is the right answer only when you need none of those, and an edge panel needs all three. `side` lives on the root (it picks the dismiss gesture as well as the edge); `size` (`sm · md · lg · full`) reads as a width for a left/right sheet and a height for a top/bottom one, from the same `--panel-width-*` vocabulary.
- **Tabs / Segmented** — underline or pill; the **active** tab underline / segment uses `primary` (selection).
- **Switch / Checkbox / Radio** — neutral **`primary`** ink when on/checked, switch off-track = **`surface-3`** (the pressed rung; there is no `track` token); **Slider** fill = **`primary`**; radius `full` (switch/radio/thumb) or `sm` (checkbox).
- **Navigation** — breadcrumb (`muted-foreground`, current = `foreground`), pagination (active = `primary`). `Pagination` renders a plain `<nav>`: `<nav>` IS the navigation landmark, so no `role="navigation"`, and its `aria-label` defaults to "Pagination" but MUST be overridden when a page carries more than one pager — two identically named landmarks are an axe `landmark-unique` failure (audit B5-08).
- **Avatars · progress · skeleton** — avatar = `accent` fill + initials; progress/ring fill = `primary`; skeleton shimmer = neutral, at the **text radius** (`sm`) on a line placeholder, since an 8px radius on a 16px bar reads as a pill rather than as text. **An indeterminate `Progress` is a distinct visual, never a full bar**: Base UI writes no width when `value` is `null`, so a bar styled only for the determinate case reads as 100% complete. It renders a 35% segment sweeping the track (`motion-indeterminate`), and `aria-valuenow` is omitted.
- **Content links** — `info` (blue), underlined at rest, and still protected by the global neutral
  focus-visible outline. Navigation and button-like anchors may use their spatial/control affordance
  instead, but must not lose the focus outline.
- **AI / agent surfaces** — reasoning, tool calls, streaming, and the composer send read in the neutral `primary` / `accent` register (distinguished by layout + iconography, not a brand hue).
- **Status indicators** — running dot `info`, succeeded `success`, failed `destructive`, queued/idle neutral; reasoning/streaming `primary`.

- **Inline editing (EditableCell · FieldInline · AutoSaveInput)** — ONE async-write vocabulary, `idle | saving | saved | error` (`AutoSaveStatus`), shared by every field that persists: the indicator is inline (Spinner → success Check → destructive X, keyed remounts), a rejected commit **reverts the value and announces it politely**, and grid hosts consume the same cell with `focusMode="managed"` (no per-cell tab stop — the grid's roving model owns reachability).
- **NumberField** — Base UI NumberField in Input's exact addon-group chrome. Money/percent/units are `Intl.NumberFormatOptions` via `format` — never a separate money component; minor-units conversion is the app's field layer. Steppers are full-height flanking buttons ([−] input [+]) so pointer targets meet the 24px floor without hit-area expansion.
- **ChipInput** — free-token entry in the Combobox input-group chrome with real `Tag` chips. Validation is per-chip and non-destructive: invalid entries stay visible and flagged (`data-invalid` + destructive outline-border + text description) rather than silently dropped; duplicates are the only rejected class.
- **ActionBar** — the floating contextual bar (bulk selection, unsaved changes, batch progress). `raised` band, FLAT surface (bg-background + the one border — a floating bar is not an overlay and gets no shadow); CSS-only enter/exit (`ease-emphasized` in, `ease-exit` out); it consumes a selection count and never owns selection.
- **Stepper** — a bounded linear process is an ordered list with `aria-current="step"`, never tab semantics. Step states complete/current/upcoming/**error** map 1:1 onto StatusIcon's vocabulary, always icon + text; the current glyph is pinned `animate-none` — current is a position, not activity. Focus follows the process: the new current step's label is focused on change, never on mount.
- **Timeline** — rail geometry only: an `aria-hidden` node + connector column beside rows that compose `Item` parts (`role="none"` on a non-interactive row — the `<li>` is the list item); group headers render through `Marker variant="separator"`. Long feeds use `content-visibility` render skipping, not a virtualizer.
- **ShortcutOverlay** — the `?` dialog renders from a shortcut declaration registry (keys, label, category), never hand-listed; `Kbd` modifier glyphs follow the user's platform via `use-platform` (`Kbd` itself stays server-safe — detection is caller-side).
- **FilterBuilder** — the stateful nested and/or builder. The grammar is host-injected (field vocabulary + per-type value editors); the tree is nested `fieldset`/`legend`, deliberately not `role="tree"`; caps disable their add affordances with readable reasons.
- **Reordering (useDragReorder · SortableList · Board)** — ONE drag vocabulary over the sanctioned Pragmatic engine. Pointer drags use the native preview and a 2px `primary` closest-edge hairline as the only drop affordance — the lifted row dims flat, never a shadow. The keyboard path is commit-per-step move mode (Space/Enter lifts, arrows commit one step each, Escape or blur ends) with a polite per-step announcement, and every pointer-reorderable surface also carries a lossless Move menu. Moves are requests: the host owns the order and may refuse — a refused move reverts and announces, exactly the inline-editing revert contract. Board adds the cross-container tier: columns are labeled groups on one horizontal scroller (the container scrolls, never the page), cards rove with RTL-aware arrows, and a locked destination states its reason rather than disappearing.
- **Dropzone (useFileDrop · Dropzone)** — file ingestion is drop + paste + browse, always all three, under ONE constraint set — accept/size/count apply to every path, paste included. The drop surface is the named focusable control (`role="button"`); the real `<input type="file">` behind it is the display:none picker bridge, never a tab stop. Rejections are typed and non-destructive (too-many/too-large/wrong-type are announced WITH their reason and stay listed, sub-AA copy banned); `data-dragging`/`data-drag-invalid` drive the only visual states — a dashed border tint, no scale theatrics. The missed-drop guard is document-level, ref-counted across instances, and scoped to FILE-bearing drags — text dragged into unrelated inputs keeps working, and one surface's opt-out is never silently re-armed by another.
- **DataGrid** — the full-parity tier above DataList, and the boundary is doctrinal: DataList stays the presentational default; DataGrid earns its engines (TanStack row model + windowing — they compute, never touch DOM or focus) only when grouping, inline editing, multi-key sort, column management, or 10k+ rows demand it. The APG grid layer is ours: one roving tab stop over real `role="grid"` table semantics, Enter/F2 suspends grid nav into the shared EditableCell contract, Escape restores the cell. Grouping renders per-value `tbody` sections (valid HTML, no div theatre); responsive revelation hides or merges columns by declared budget — data is never silently lost; paging is keyboard-continuous (ArrowDown past the last row fetches).

## Voice & content

Copy is part of the design — precise, no filler.

- **Case:** sentence case for everything (buttons, headings, labels, body, toasts).
- **Actions** name a verb + noun (`Deploy project`, `Delete member`) — never `Confirm`, `OK`, or a bare verb.
- **Errors** state what happened plus what to do: `Bundle exceeds the 50 MB limit. Remove unused assets or raise the limit in Settings.` — never just "Something went wrong."
- **Toasts** name the specific thing, drop the trailing period, never say "successfully": `main@a1f7c2 deployed`, not `Successfully deployed.`
- **Empty states** point to the first action: `No deployments yet. Deploy your first project →`.
- **In-progress** uses the present participle + ellipsis: `Deploying…`, `Reasoning…`.
- Use numerals (`3 projects`), tabular figures, curly quotes, and the ellipsis character; skip "please" and superlatives.

## Do's and don'ts

**Do**

- Use **semantic tokens only** — `bg-primary`, `text-muted-foreground`, `border-border`. Apply **type tokens** instead of hand-set size/weight.
- Keep `primary` (neutral) as the workhorse — it also carries the one key action / AI moment / selection; **ration `info` (blue)** to links and informational UI.
- Use `info` (blue) for links and informational UI; pair every state colour with an icon + text.
- Use the **one border** everywhere; stay flat — overlays get `shadow-overlay`, and nothing else gets
  a shadow.
- Keep hover/active/focus colour changes immediate; reserve tokenized motion for geometry, opacity, and
  lifecycle changes that clarify state.
- Use the one neutral `:focus-visible` outline (2px, `ring` = primary ink) on every interactive element except text-entry fields, which use a border-tint instead (see Accessibility).
- Hold **WCAG AA** (4.5:1 body text), authored in **both** themes. Use lucide at `currentColor`; tabular figures for numbers.

**Don't**

- Don't hardcode hex/px, use raw palettes (`bg-neutral-900`), or off-scale values.
- Don't make `accent` (the neutral hover) a colour, or use `info` (links) for anything that isn't a link or informational.
- Don't add a decorative brand hue or a fourth status hue "just this once"; don't sit a blue link inside a neutral action cluster where "which is clickable?" becomes ambiguous.
- Don't make focus a **colour** or a **box-shadow glow** — it's the neutral `ring` (= primary ink), either a border-tint (text fields) or a 2px `:focus-visible` outline (everything else, inset via `-outline-offset-2` where an ancestor or a mask would clip it). Don't remove focus without a visible replacement, and don't use a border-tint outside text-entry fields — forced colours erase it.
- Don't go bold (600+) as a default — it's a rare, deliberate emphasis (D3), not a UI weight; don't use more than two weights in a view; don't use `rounded-full` for container highlights.
- Don't add shadows to flat surfaces; don't signal state with colour alone; don't ship a token that resolves in only one theme.

## Accessibility

- **WCAG 2.2 AA.** Every canonical foreground/background pair clears **4.5:1** (normal text), in **both** themes, enforced by a **fail-closed** contrast gate in CI (computed from OKLCH). All status/info fills pass warm-off-white-on-fill AA; `muted-foreground` passes; `muted-foreground-faint` is deliberately sub-AA and scoped to placeholders/disabled only.
- **Focus = a border-tint or the native outline — never a box-shadow ring/glow.** Text-entry fields (Input, Textarea, Field control, OTP slots) show ONLY a border-tint (`border-ring/(--alpha-tint-border)`, on plain `focus` not `focus-visible` — a raw text field can't distinguish mouse from keyboard, so the border is the one cue for both). Every other interactive element — buttons, button-style triggers, menu items, portaled overlay surfaces — shows the centralized **2px `:focus-visible` outline** in the `ring` token (= `primary` ink), defined once in `base.css`. Mouse clicks show nothing outside text fields. The `ring` token is one value, so it re-skins globally — change `ring`, every focus state follows.
- **The one permitted component-local focus deviation: the offset, and only when the outline would not be painted at all.** A focusable element whose outline cannot render outside its border box — an `overflow-hidden` ancestor, or a mask utility such as `scroll-fade-x` (a `mask-image` clips everything the element paints to that box) — keeps the same outline pulled inside with `focus-visible:-outline-offset-2`. Width, colour, and token stay centralized; only the offset inverts. A border-tint is **not** an alternative here: `forced-colors: active` replaces `border-color` outright, so a tint on a non-text-entry control leaves the forced palette with no indicator at all. Terminal's scrollable command pane is the reference case (`docs/ledger/bugs.md`, 2026-07-25).
- **Never signal by colour alone** (1.4.1) — pair status colour with an icon or label.
- **Live regions — one hook, one node, one policy** (audit B5-05 / amendment 8, 2026-09-07). Politeness is decided first: `role="status"` `aria-live="polite"` by **default**, and `role="alert"` only for destructive or warning content rendered after mount (D23). Every polite announcement then goes through **`useAnnouncer`** — `const { announce, Announcer } = useAnnouncer()` — and a component renders **exactly one** `<Announcer />`, for its whole life. Three properties are non-negotiable and are why this is a hook rather than a snippet: the region is **mounted empty from first paint** (a region inserted at the moment it gains text is frequently never announced, because the platform was not observing it); its child is **keyed by a monotonic sequence**, so announcing the identical string twice in a row still mutates the DOM and is still spoken (a same-value `setState` is a React bail-out); and the state lives in the hook's own store, so an announcement re-renders the region, not the host. Announce the **destination**, never every intermediate frame — "Moved Design to position 3 of 7", not one message per pointer move. A live region is never also a visible status slot: a slot that renders icons would announce its own icon swaps.
- **Target size** (2.5.8) — every interactive target has a ≥24×24px hit area or the permitted spacing;
  prefer ≥44×44px for primary mobile actions. Validate invisible hit areas with an actual hit-test boundary
  probe, not computed styles alone.
- Respect **`prefers-reduced-motion`**.
- Preserve zoom, keyboard order, logical reading order, and meaning in RTL; safe-area padding must not
  reduce or cover a target.

## Brand & marketing

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

Marketing surfaces build text hierarchy from ONE ink, never a second gray token: full
`text-foreground` for primary copy and `text-muted-foreground` for secondary, tertiary, and
resting roles — `Terminal` output lines and `LogoRow`'s resting wordmarks both use it. Because
`MarketingSurface` re-grounds the theme, `muted-foreground` resolves against the marketing ground
rather than the page's, so one token covers the whole ramp without a marketing-only scale.

> **Do not** express this as `text-foreground/(--opacity-hint|-soft|-dim)`. `--opacity-*` roles are
> for whole-ELEMENT opacity; colour compositing takes an `--alpha-*` role. Mixing them is a lint
> error (`alpha-opacity-role`), so that form fails the build — and no component uses it. Its
> contrast is also below AA: `foreground` at 50% measures 3.70:1 on the marketing ground.

### Marketing ground + scope mechanism

Marketing surfaces render the warm ramp's **dark end** (not pure black) — the same `.dark`-half
token values, but scoped to work **independent of the page's `.dark` class**, because the product
default is light and a marketing page needs to be dark-first regardless. The mechanism is the
`.vs-marketing` class (`packages/design-tokens/src/utilities.css`) plus the `MarketingSurface` primitive
that applies it: every semantic token utility inside a `MarketingSurface` (`bg-background`,
`text-foreground`, `border-border`, `bg-brand`, and any composed product component) resolves to
the dark values with zero code changes. `Terminal` self-scopes the same way, so an install snippet
reads dark even embedded in a light docs page. Base UI portals
(Dialog/Popover/Menu/Select/Tooltip) mount to `<body>`, OUTSIDE any `MarketingSurface` subtree, so
a portaled surface opened from inside one would inherit the PAGE theme rather than the marketing
ground. That is handled: `MarketingSurface` publishes its ground through the theme-scope context
(`@vegastack/design/theme-scope`) and all 12 portal-owning components re-apply it at the portal
root, which `tooling/verify-portal-theme-scope.mjs` enforces as a 12/12 inventory. A portal opened
from inside a marketing surface therefore carries the marketing ground with it, with no per-call
styling. The docs-home page (`apps/docs/app/(home)/page.tsx`) is the reference implementation: one
outer `MarketingSurface` wraps the entire page, and the rest of `/docs` stays the light-primary
product surface — a single, deliberate temperature boundary at the home→docs navigation, not an
alternating pattern within one page.

## Docs canon

A component's documentation page is part of the component, not a follow-up, and it serves humans
and agents from the same source. The table below is **the standard every component page is
written to** — the shape, the order, and the authority each section is generated from. Approved
2026-09-07 (audit `08-docs-structure.md` §2; decisions D19, D26, DD-1…DD-5).

**It is the target, not a report on the current tree.** The generated sections shipped as MDX
components in 0.7.0 and are placed on three reference pages (button, dialog, data-grid); the
remaining pages are migrated to this shape in the following release, and the section headings move
from `## Installation` to `## Install` in that same atomic change. What already holds everywhere is
the API Reference (row 7, rendered flat and expanded on all 110 pages) and the markdown export
below. Read this table when writing or changing a page; do not read it as a description of what
every page contains today.

| #   | Section                          | Required content                                                                                                                                                                                                                                                         | Source of truth                                                 |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| 0   | **Frontmatter**                  | `title`, `description`, `preview` (hero fixture), `registry` (item name), `status` (`stable \| preview \| deprecated`), `since` (version), `a11y` (pattern name)                                                                                                         | validated by `apps/docs/source.config.ts`                       |
| 1   | **Install**                      | one `Steps` block: the `shadcn add` command, the item's `registryDependencies`, and the sanctioned engines it pulls in. The registry-auth notice is a site `Banner`, shown ONCE, never per page                                                                          | generated from `registry.json`                                  |
| 2   | **Usage**                        | the minimal import plus one canonical snippet — the "if you copy one thing" example, ≤12 lines                                                                                                                                                                           | hand-written                                                    |
| 3   | **Scope** _(composites)_         | three bullets at most: owns / does not own / compose with                                                                                                                                                                                                                | hand-written; required when the contract marks it composite     |
| 4   | **Anatomy** _(compounds)_        | every exported part with the `data-slot` names it renders                                                                                                                                                                                                                | generated from the contract's `dataAttributes`                  |
| 5   | **Examples**                     | one `ComponentPreview` per fixture, each a contract-lane route; the fixture source appears in the markdown export                                                                                                                                                        | `components/preview/<name>.tsx`                                 |
| 6   | **Playground** _(where curated)_ | the curated `PropsPlayground`. The Story explorer is sanctioned ONLY where no curated playground exists — never both on one page (DD-3)                                                                                                                                  | `components/*-playground.tsx`                                   |
| 7   | **API Reference**                | one flat, expanded table per exported part — name · the literal union · default · description. Own props only; a part with no own props gets ONE sentence, never placeholder rows. A second small table lists the `data-*` attributes and CSS variables the part exposes | `fumadocs-typescript` + the contract's `dataAttributes`         |
| 8   | **Accessibility**                | the pattern name, the keyboard table, screen-reader announcements, and the states the lanes exercise                                                                                                                                                                     | keyboard table hand-written; states generated from the contract |
| 9   | **Do / Don't**                   | at least two pairs                                                                                                                                                                                                                                                       | `DoDont`                                                        |
| 10  | **Changelog** _(generated)_      | the item's entries, filtered by name                                                                                                                                                                                                                                     | `/CHANGELOG.md`                                                 |

Nothing follows Do / Don't except the generated Changelog. "Notes", "Voice" and "How it works"
fold into Usage or Scope. Marketing-only leaves skip Scope, Anatomy and Playground and keep the
rest.

Row 6 is a permission, not a requirement: a page carries a curated playground, or the Story
explorer where none exists, or **neither** — and `tooling/verify-docs-export.mjs` enforces only
"never both, and an Explorer always wrapped". Measured 2026-09-07: 45 curated · 6 Explorer ·
59 neither · 0 both.

**Humans and agents read the same page.** Every MDX component renders to markdown for the per-page
`.md` route and `llms-full.txt`: the fixture source, the flat prop tables, the install steps and
the do/don't pairs are all there, and a browser-only surface is replaced by an explicit one-line
note rather than dropped silently. `tooling/verify-docs-export.mjs` fails the build on any JSX tag
that survives outside a code fence, any unresolved placeholder, and any empty API table.
`llms.txt` additionally carries the registry roster — every installable item with its page and its
`shadcn add` target — and the public skill roster.

**The docs shell obeys this system end to end (DD-1).** Fumadocs' chrome and the typography plugin
are compiled against Tailwind's stock theme, so their weights, radii and shadows are remapped to
system values once in `apps/docs/app/global.css`, and `design-lint --docs-shell --emitted-css`
reads the BUILT stylesheet to prove it — source linting cannot see a value this repo never wrote.
`tooling/verify-docs-shell.mjs` asserts the rest in a real browser against the built public export,
in `pnpm verify:release`: the product type scope (including inside a portal), the weight ladder as
computed, the fullscreen preview's background isolation and Escape, the skip link as the first tab
stop, and named tab stops. Its `--self-test` runs in the same stage and injects, per assertion, the
defect that assertion exists to catch — so none of them can quietly go fail-open. **One half of
DC-03 is a known open defect and is deliberately NOT asserted:** the fullscreen focus trap does not
hold — focus leaves the dialog and reaches the docs navigation — and the script prints a
`NOT ASSERTED` line for it on every run rather than claiming coverage it does not have. Measurement,
four-run trace and reproduction: `docs/ledger/bugs.md`, 2026-09-09.

---

> **Provenance.** This is the canonical v2 specification for the finalized token system (v1, the pre-overhaul
> grey/`action`+`agent` system, is preserved at `design-v1.md`). Values are intended to be **generated from
> `@vegastack/design-tokens`** (DTCG → OKLCH) with a CI drift-check, so the spec can't diverge from the shipped
> tokens; the prose layer (Overview, Voice, Do/Don't, Accessibility) is hand-authored. An early single-accent
> exploration is archived at `docs/research/design-comparison/proposed-design-system.html` (superseded — it
> predates the locked decisions: the one derived alpha hairline, neutral 2px ring, separate `info`=blue; not current). The live
> showcase is the Fumadocs site under `apps/docs/`; decision history, the build plan, and the v2 rollout
> ledger live in `docs/plans/`. Append-only normative `VS-*` rule IDs and external-source dispositions live
> in `docs/research/design-md-audit/unified-reference.md`.
