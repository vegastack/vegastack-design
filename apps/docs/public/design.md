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
      bytes: 3484
      sha256: "499b05cc1105085f3a5fc4b454ddfda46a69bb4d609171f0f289a9be1ee8739f"
    primitives:
      path: "packages/design-tokens/tokens/primitives.tokens.json"
      bytes: 9520
      sha256: "09b8a97df522e597e7bee71a4ed3c3dd380a6df0402476401566a5f4315682f8"
    light:
      path: "packages/design-tokens/tokens/semantic.tokens.json"
      bytes: 27838
      sha256: "3f77067c3f92ae8a4e00c786492362fbee20f354cb2e6ec428650e8ad9623a40"
    dark:
      path: "packages/design-tokens/tokens/semantic.dark.tokens.json"
      bytes: 10391
      sha256: "7ac090ee3b41a5e3a01fb974e9dce23437f5108359bbe599d0c5dd7976147807"
    externalSources:
      path: "docs/research/design-md-audit/source-manifest.json"
      bytes: 3742
      sha256: "746e6f3ca29edf9dfdb0510c13acde145aa9597e4ed8073b7ba3e2b9c1d62782"
themes:
  light:
    accent:
      type: "color"
      value: "oklch(0.97 0.003 75)"
    accent-foreground:
      type: "color"
      value: "oklch(0.205 0.003 75)"
    alpha-backdrop-soft:
      type: "dimension"
      value: "60%"
      description: "Translucent surface backdrop (bg-background) — pill tab list."
    alpha-border-soft:
      type: "dimension"
      value: "30%"
      description: "Toast (sonner) status border tint (border-<family>)."
    alpha-border-subtle:
      type: "dimension"
      value: "20%"
      description: "Alert variant border tint (border-<family>)."
    alpha-fill-hover:
      type: "dimension"
      value: "80%"
      description: "Hover dim of an interactive solid fill (bg-primary/secondary/muted/accent on chat bubbles, secondary button)."
    alpha-glass:
      type: "dimension"
      value: "90%"
      description: "Glass button surface (bg-background + backdrop-blur)."
    alpha-glass-hover:
      type: "dimension"
      value: "95%"
      description: "Glass button surface on hover."
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
    alpha-input-hover:
      type: "dimension"
      value: "50%"
      description: "Dark-theme input fill tint on hover (bg-input)."
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
    alpha-surface-subtle:
      type: "dimension"
      value: "10%"
      description: "Hover wash of the outline button family (bg-<family>)."
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
      value: "oklch(0.922 0.003 75)"
    brand:
      type: "color"
      value: "oklch(0.6 0.17 148)"
      description: "The phosphor-green brand accent, LIGHT half (theme-split per CX-9): marker roles ONLY (live/AI-state dot, sparkline endpoint, eyebrow highlight, terminal prompt glyph). 3.5:1 on card/background — meaningful glyphs pass WCAG 1.4.11. Never fills, borders-at-rest, headlines, or buttons."
    card:
      type: "color"
      value: "oklch(0.985 0.003 75)"
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
    destructive-subtle-hover:
      type: "color"
      value: "oklch(0.91 0.036 20.4)"
      description: "DERIVED: destructive fill @7.000000000000001% composited over destructive-subtle (soft-hover surface, AA-gated against destructive-text)."
    destructive-text:
      type: "color"
      value: "oklch(0.521 0.2 25)"
    duration-base:
      type: "duration"
      value: "200ms"
    duration-fast:
      type: "duration"
      value: "150ms"
    duration-slow:
      type: "duration"
      value: "300ms"
    effect-blur-glass:
      type: "dimension"
      value: "8px"
      description: "Backdrop blur for the existing glass Button finish. Matches Tailwind v4's shipped blur-sm value while exposing the effect through a semantic contract."
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
    info-subtle-hover:
      type: "color"
      value: "oklch(0.929 0.03 251.1)"
      description: "DERIVED: info fill @7.000000000000001% composited over info-subtle (soft-hover surface, AA-gated against info-text)."
    info-text:
      type: "color"
      value: "oklch(0.52 0.171 256)"
    input:
      type: "color"
      value: "oklch(0.922 0.003 75)"
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
      description: "Modal scrim — the ONE sanctioned alpha-composite literal (a translucent wash has no primitive step; alpha is intrinsic to the role)."
    popover:
      type: "color"
      value: "oklch(0.994 0.002 75)"
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
    secondary-foreground:
      type: "color"
      value: "oklch(0.205 0.003 75)"
    shadow-lit:
      type: "shadow"
      value: "inset 0 1px 0 0 oklch(1 0 0 / 0.12), 0 1px 2px 0 oklch(0.13 0.002 75 / 0.18), 0 2px 6px -2px oklch(0.13 0.002 75 / 0.14)"
      description: "Wave 2 'lit' action finish (MK-approved amendment to flat-by-default): a 1px on-fill top-light + warm-ink ambient pair for PRIMARY actions only. Attio-calibrated, warm-adapted. Never on cards/surfaces — the flat elevation model stands everywhere else."
    shadow-overlay:
      type: "shadow"
      value: "0 4px 14px -4px oklch(0.13 0.002 75 / 0.1), 0 2px 4px -2px oklch(0.13 0.002 75 / 0.06)"
    sidebar:
      type: "color"
      value: "oklch(0.985 0.003 75)"
    sidebar-accent:
      type: "color"
      value: "oklch(0.955 0.003 75)"
    sidebar-accent-foreground:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    sidebar-border:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    sidebar-foreground:
      type: "color"
      value: "oklch(0.269 0.003 75)"
    sidebar-primary:
      type: "color"
      value: "oklch(0.145 0.003 75)"
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
    success-subtle-hover:
      type: "color"
      value: "oklch(0.919 0.059 151.1)"
      description: "DERIVED: success fill @7.000000000000001% composited over success-subtle (soft-hover surface, AA-gated against success-text)."
    success-text:
      type: "color"
      value: "oklch(0.5 0.13 150)"
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
    track:
      type: "color"
      value: "oklch(0.87 0.003 75)"
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
    warning-subtle-hover:
      type: "color"
      value: "oklch(0.929 0.027 48.8)"
      description: "DERIVED: warning fill @7.000000000000001% composited over warning-subtle (soft-hover surface, AA-gated against warning-text)."
    warning-text:
      type: "color"
      value: "oklch(0.52 0.139 42)"
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
      value: "oklch(0.967 0.003 75)"
    alpha-backdrop-soft:
      type: "dimension"
      value: "60%"
      description: "Translucent surface backdrop (bg-background) — pill tab list."
    alpha-border-soft:
      type: "dimension"
      value: "30%"
      description: "Toast (sonner) status border tint (border-<family>)."
    alpha-border-subtle:
      type: "dimension"
      value: "20%"
      description: "Alert variant border tint (border-<family>)."
    alpha-fill-hover:
      type: "dimension"
      value: "80%"
      description: "Hover dim of an interactive solid fill (bg-primary/secondary/muted/accent on chat bubbles, secondary button)."
    alpha-glass:
      type: "dimension"
      value: "90%"
      description: "Glass button surface (bg-background + backdrop-blur)."
    alpha-glass-hover:
      type: "dimension"
      value: "95%"
      description: "Glass button surface on hover."
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
    alpha-input-hover:
      type: "dimension"
      value: "50%"
      description: "Dark-theme input fill tint on hover (bg-input)."
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
    alpha-surface-subtle:
      type: "dimension"
      value: "10%"
      description: "Hover wash of the outline button family (bg-<family>)."
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
      value: "oklch(0.269 0.003 75)"
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
    destructive-subtle-hover:
      type: "color"
      value: "oklch(0.34 0.123 26.3)"
      description: "DERIVED: destructive fill @30% composited over destructive-subtle (soft-hover surface, AA-gated against destructive-text)."
    destructive-text:
      type: "color"
      value: "oklch(0.72 0.16 25)"
    duration-base:
      type: "duration"
      value: "200ms"
    duration-fast:
      type: "duration"
      value: "150ms"
    duration-slow:
      type: "duration"
      value: "300ms"
    effect-blur-glass:
      type: "dimension"
      value: "8px"
      description: "Backdrop blur for the existing glass Button finish. Matches Tailwind v4's shipped blur-sm value while exposing the effect through a semantic contract."
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
    info-subtle-hover:
      type: "color"
      value: "oklch(0.354 0.101 254.3)"
      description: "DERIVED: info fill @30% composited over info-subtle (soft-hover surface, AA-gated against info-text)."
    info-text:
      type: "color"
      value: "oklch(0.72 0.13 256)"
    input:
      type: "color"
      value: "oklch(0.269 0.003 75)"
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
      value: "oklch(0.269 0.003 75)"
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
      value: "oklch(0.269 0.003 75)"
    secondary-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    shadow-lit:
      type: "shadow"
      value: "inset 0 1px 0 0 oklch(1 0 0 / 0.35), 0 2px 6px -2px oklch(0 0 0 / 0.5)"
    shadow-overlay:
      type: "shadow"
      value: "0 8px 28px -6px oklch(0 0 0 / 0.48), 0 2px 8px -2px oklch(0 0 0 / 0.4)"
      description: "DARK overlay shadow, strengthened (Wave 1 — Attio-calibrated): the old single 24px layer was near-invisible on the dark canvas; this two-layer ramp restores the floating cue while staying below Attio's 88px maximal ramp."
    sidebar:
      type: "color"
      value: "oklch(0.145 0.003 75)"
    sidebar-accent:
      type: "color"
      value: "oklch(0.205 0.003 75)"
    sidebar-accent-foreground:
      type: "color"
      value: "oklch(0.922 0.003 75)"
    sidebar-border:
      type: "color"
      value: "oklch(0.269 0.003 75)"
    sidebar-foreground:
      type: "color"
      value: "oklch(0.87 0.003 75)"
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
    success-subtle-hover:
      type: "color"
      value: "oklch(0.348 0.092 148.9)"
      description: "DERIVED: success fill @30% composited over success-subtle (soft-hover surface, AA-gated against success-text)."
    success-text:
      type: "color"
      value: "oklch(0.72 0.17 150)"
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
    track:
      type: "color"
      value: "oklch(0.439 0.003 75)"
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
    shadow: "{shadow-lit}"
    interactionColorTransition: "immediate"
  button-secondary:
    background: "{card}"
    foreground: "{foreground}"
    border: "{border}"
    hover: "{accent}"
    radius: "{radius-md}"
    height: "{size-md}"
    paddingInline: "0.75rem"
    typography: "{text-label}"
    interactionColorTransition: "immediate"
  button-destructive:
    background: "{destructive-subtle}"
    foreground: "{destructive-text}"
    hover: "{destructive-subtle-hover}"
    radius: "{radius-md}"
    height: "{size-md}"
    paddingInline: "0.75rem"
    typography: "{text-label}"
    interactionColorTransition: "immediate"
  input:
    background: "{secondary}"
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
    hover: "{accent}"
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
non-espresso near-black in dark), articulated by a **single solid hairline border**, not heavy fills
or shadows. The **neutral-ink primary does the bulk of the work**; colour is rationed and meaningful.

**Key characteristics**

- **One warm neutral ramp.** Every grey/black/white comes from the shared OKLCH neutral primitives
  (hue 75, chroma ~0.003 — barely warm), identical in both themes.
- **OKLCH-authored.** All colours are authored in OKLCH in the DTCG source; the hex shown is the sRGB render — P3-ready notation, sRGB-faithful chroma (no wide-gamut push, by restraint).
- **Scales are tokens.** Colour, control sizes (`--size-*`), radius (`--radius-*`), the two sanctioned shadows (`--shadow-overlay` / `--shadow-lit`), motion, and type (`--text-*`) are all DTCG tokens — change one, every component re-skins.
- **Neutral-ink primary.** The default action is a charcoal/near-white neutral (Vercel-style), not a colour. Almost every button is `primary`.
- **One rationed chromatic.** `info` (blue) = links and informational UI — the whole colour budget beyond status. The neutral-ink `primary` carries the key action, AI/agent surfaces, and selected/active state.
- **One border, flat by default.** A single solid warm-neutral border carries all separation. Only overlays get `shadow-overlay`; only primary actions get the restrained `shadow-lit` finish.
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

### Surfaces, text & lines

- **`background`** is the page; **`card`/`popover`** are surfaces (`neutral-50`/`white` in light;
  lifted to `neutral-900` in dark).
- **`secondary`** and **`muted`** (`neutral-100` / `neutral-800`) carry inset/control fills.
  **`accent`** is the **neutral** hover/selected fill (it is _not_ a colour — `bg-accent` must never be
  blue or any other hue; this is shadcn's `accent`).
- **Text ramp:** `foreground` (ink) → `muted-foreground` (secondary text, the AA workhorse) → `muted-foreground-faint` (placeholders & disabled **only** — intentionally below AA; never for content, including captions).
- **`primary`** is a charcoal (`neutral-700`) in light / near-white (`neutral-200`) in dark — the neutral-ink workhorse action, with `primary-hover`/`primary-active` one step further.
- **One border.** A single **solid warm-neutral** `border` (`neutral-200` light / `neutral-800` dark) on **every** card, input, table, and overlay. The shadcn token names `input` and `sidebar-border` **alias** to it — same appearance, names kept so registry components keep working. Plus the `overlay` token for the modal scrim. No `border-strong` / `overlay-border` / ad-hoc line token; overlays separate via the shadow, not a heavier border.
- **`ring`** is the focus basis and equals **`primary`** (neutral ink) — see Accessibility.
- **`track`** (`neutral-300` / `neutral-600`) is the switch/toggle off-track — a theme-flipping neutral so a disabled toggle never glows bright in dark.
- **The sidebar** is a self-contained surface (`sidebar` / `sidebar-foreground`, border = the one `border`). Its active/hover/focus reuse the main `primary` / `accent` / `ring`.

### Chromatic colour — rationed

The chrome is warm-neutral; colour carries meaning and is **rationed to one chromatic accent (blue) + three
status hues**. Each family is a seven-token ramp (`fill` / `hover` / `active` / `foreground` / `subtle` /
`subtle-hover` / `text`). All use **warm-off-white on-fill text** uniformly; `hover`/`active` darken so contrast only rises. `subtle`
(soft tinted background) and `text` (readable colour for page/alert) adapt per theme.

| Family        | Role                                      | Fill (sRGB render of the shipped OKLCH) | On-fill                           | Hue             |
| ------------- | ----------------------------------------- | --------------------------------------- | --------------------------------- | --------------- |
| **`info`**    | **links** · informational badges & alerts | `#0068d2`                               | warm off-white `#fbfaf8` (5.13:1) | blue, 256       |
| `destructive` | danger, errors, destructive actions       | `#c10007`                               | warm off-white (6.15:1)           | red, 27.5       |
| `success`     | success, positive state                   | `#007b2a`                               | warm off-white (5.23:1)           | green, 150      |
| `warning`     | warning, caution                          | `#a74a00`                               | warm off-white (5.56:1)           | deep orange, 52 |

**Usage rules**

- **`primary` (neutral) is the default AND the accent** — it carries almost every action plus the value/selection accents: the single most important action, AI/agent surfaces, active tab underline, current page, slider/progress fill, selected date, and checked switch/checkbox/radio and the select checkmark. There is no separate accent hue.
- **`info` (blue) is for links and informational UI** — text links, info alerts/badges. This is the conventional "blue = link/info," and the only chromatic accent.
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
  lint-banned, use a display-tier utility instead.
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
`shadow-overlay`. The only other sanctioned shadow is `shadow-lit`, a restrained inset top-light plus
ambient pair for the neutral primary action. It is an action finish, never surface elevation.

- There are exactly **two named shadow roles** (`shadow-overlay` and `shadow-lit`); no generic elevation
  ladder and no raw shadow values.
- **Dialogs** rely on the **`overlay` scrim** + `shadow-overlay`, not a dramatic drop.
- **In dark**, the overlay shadow is strengthened but remains subordinate to the **lifted surface**
  (`popover`/`card` a step above `background`) and the border.

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
`AnimatedNumber`) lives in `foundations/motion` and `skills/internal/component/SKILL.md` §2 — this section is
the token reference, not the mechanism matrix. **Hover, active, and focus colour changes are immediate**;
never transition colour on a fast interaction and never use `transition: all`. Animate explicit
transform/opacity properties where possible; when a disclosure must animate size, preserve the inner
content's intrinsic size throughout close so text does not reflow. Avoid long, looping, or attention-grabbing animation, and
**honour `prefers-reduced-motion`**: the global reset collapses `motion-*` keyframes to their resting end
state, spinners freeze, skeletons go solid, transitions drop to 0 — and a dedicated
`::view-transition-group/old/new(*)` kill switch covers route-change snapshots the universal `*` reset
can't reach (they live outside normal element matching, on the root's snapshot layer). AI surfaces define
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

## Components

Each component composes from tokens (frontmatter `recipes` gives the compact machine recipes). One control-height scale —
**xs 24 (Button only) / sm 28 / md 32 (default) / lg 40** (`h-6`/`h-7`/`h-8`/`h-10`), shared by buttons,
inputs, and selects (inputs/selects use sm–lg only) so they line up; padding-x xs 8 / sm 10 / md 12 / lg 16
(buttons), 12 (inputs). Tokenised as `--size-{xs,sm,md,lg}`.

- **Button** — the CORE variants: `primary` (neutral-ink fill, the default for everything, including the single key action or an AI moment); `secondary` (card fill + the one border) and `ghost` (transparent, neutral `accent` hover) for lower emphasis; `destructive` for danger — **soft-only** (`destructive.subtle` fill + `.text`; D4 — the destructive Button never uses the solid fill). The SHIPPED surface is wider (15 variants × 8 sizes): `outline`, `link`, `glass`, the soft `success`/`warning`/`info` family mirrors of `destructive`, the four `{family}-outline` tints, the marketing `cta`, and the `icon`/`icon-*` size tiers — all documented per-variant in the Button docs page; this section names only the canonical core. Sizes `xs`(24, icon affordances)/`sm`(28)/`default`(32)/`lg`(40). Radius `md`; `text-base`/500 label. **Hover/active darken within the button's own colour** — nothing borrows a hue.
- **States** (every button) — default · hover · focus · active · disabled (`opacity-(--opacity-dim)`, 50% + `not-allowed`) · loading (spinner honouring reduced-motion). **Focus = the neutral 2px `:focus-visible` outline (`ring` token = primary ink)** — never a box-shadow glow.
- **Input / Select / Textarea** — `secondary` fill, the one `border`, radius `md`, 32px. **Consistent border scale (one alpha step, no per-mode opacity hacks): rest = `border`/`input`; focus/active = `ring/70`; error = `destructive-border/70`.** The error ink is the ONE deliberate per-theme exception in this scale: `destructive` is tuned as a solid button fill carrying light text, and at 70% on the dark ground it measures **1.92:1** — under the 3:1 WCAG 1.4.11 floor for a non-text indicator — while lightening `destructive` itself would drop `destructive-foreground` on the solid button below 4.5:1. So the border has its own role, `destructive-border` (light `red.700` → 4.24:1, dark `red.400` → 4.00:1). The _alpha_ stays identical across themes; only the ink re-grounds. `tooling/contrast-check.mjs` gates this pair composited over background/card/popover/muted/secondary in both themes. Text-entry fields (Input, Textarea, Field control, OTP slots) use the darkened `ring/70` border as their _sole_ focus indicator — no outline (a raw text input can't distinguish mouse from keyboard, so the border is the one consistent cue for both click and Tab). Button-style triggers (Select, date-picker, country-select, color-picker — built on the `outline` Button variant) darken the border to `ring/70` on focus AND add the neutral 2px outline for keyboard nav (`:focus-visible` only). Never a colour, never a glow. Error = `destructive/70` border + `destructive.text` helper. Disabled = reduced opacity + `not-allowed`.
- **Card / Panel** — `card` surface, the one `border`, radius `lg`, **flat (no shadow)**.
- **Badge / Chip / Tag** — radius `full`; status/info badges use `{family}.subtle` + `{family}.text` (+ a 6px dot); neutral badge uses `muted`.
- **Alert** — `{family}.subtle` background + `{family}.text`, radius `md`, **always paired with an icon** (never colour alone). Info alerts use `info` (blue).
- **Dialog / Modal** — `popover` surface, the one `border`, radius `lg`, `shadow-overlay`, over the `overlay` scrim. Title `text-h3`/`h4`; actions right-aligned (`ghost` Cancel + intent button).
- **Dropdown / Menu / Popover / Tooltip / Command palette** — `popover` surface, the one `border`, `shadow-overlay`; items use neutral `accent` hover at radius `sm`; destructive items use `destructive.text`; the selected command row uses `accent`.
- **Tabs / Segmented** — underline or pill; the **active** tab underline / segment uses `primary` (selection).
- **Switch / Checkbox / Radio** — neutral **`primary`** ink when on/checked, off-track = `track`; **Slider** fill = **`primary`**; radius `full` (switch/radio/thumb) or `sm` (checkbox).
- **Navigation** — breadcrumb (`muted-foreground`, current = `foreground`), pagination (active = `primary`).
- **Avatars · progress · skeleton** — avatar = `accent` fill + initials; progress/ring fill = `primary`; skeleton shimmer = neutral.
- **Content links** — `info` (blue), underlined at rest, and still protected by the global neutral
  focus-visible outline. Navigation and button-like anchors may use their spatial/control affordance
  instead, but must not lose the focus outline.
- **AI / agent surfaces** — reasoning, tool calls, streaming, and the composer send read in the neutral `primary` / `accent` register (distinguished by layout + iconography, not a brand hue).
- **Status indicators** — running dot `info`, succeeded `success`, failed `destructive`, queued/idle neutral; reasoning/streaming `primary`.

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
- Use the **one border** everywhere; stay flat — overlays get `shadow-overlay`, and primary actions alone
  may use `shadow-lit`.
- Keep hover/active/focus colour changes immediate; reserve tokenized motion for geometry, opacity, and
  lifecycle changes that clarify state.
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

- **WCAG 2.2 AA.** Every canonical foreground/background pair clears **4.5:1** (normal text), in **both** themes, enforced by a **fail-closed** contrast gate in CI (computed from OKLCH). All status/info fills pass warm-off-white-on-fill AA; `muted-foreground` passes; `muted-foreground-faint` is deliberately sub-AA and scoped to placeholders/disabled only.
- **Focus = a border-tint or the native outline — never a box-shadow ring/glow.** Text-entry fields (Input, Textarea, Field control, OTP slots) show ONLY a border-tint (`border-ring/(--alpha-tint-border)`, on plain `focus` not `focus-visible` — a raw text field can't distinguish mouse from keyboard, so the border is the one cue for both). Every other interactive element — buttons, button-style triggers, menu items, portaled overlay surfaces — shows the centralized **2px `:focus-visible` outline** in the `ring` token (= `primary` ink), defined once in `base.css`. Components carry no focus style of their own beyond this. Mouse clicks show nothing outside text fields. The `ring` token is one value, so it re-skins globally — change `ring`, every focus state follows.
- **Never signal by colour alone** (1.4.1) — pair status colour with an icon or label.
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

---

> **Provenance.** This is the canonical v2 specification for the finalized token system (v1, the pre-overhaul
> grey/`action`+`agent` system, is preserved at `design-v1.md`). Values are intended to be **generated from
> `@vegastack/design-tokens`** (DTCG → OKLCH) with a CI drift-check, so the spec can't diverge from the shipped
> tokens; the prose layer (Overview, Voice, Do/Don't, Accessibility) is hand-authored. An early single-accent
> exploration is archived at `docs/research/design-comparison/proposed-design-system.html` (superseded — it
> predates the locked decisions: solid border, neutral 2px ring, separate `info`=blue; not current). The live
> showcase is the Fumadocs site under `apps/docs/`; decision history, the build plan, and the v2 rollout
> ledger live in `docs/plans/`. Append-only normative `VS-*` rule IDs and external-source dispositions live
> in `docs/research/design-md-audit/unified-reference.md`.
