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
      bytes: 14290
      sha256: "6ecea2bf4a2bf6783d1f53da37057218b37d209be9d7aa6d69b569c813fd24d8"
    config:
      path: "tooling/design-md.config.mjs"
      bytes: 3050
      sha256: "007c1c983158ab75c4e4c708fd1c79d43eee7e639a9f12bea138d71598f3f295"
    primitives:
      path: "packages/design-tokens/tokens/primitives.tokens.json"
      bytes: 2974
      sha256: "b1200c778288683d702c27cc4b713aefc6afc075790a16adac428fdc64499748"
    light:
      path: "packages/design-tokens/tokens/semantic.tokens.json"
      bytes: 20115
      sha256: "f2177cf09bfd55252742efa43d0f42f5968b09861253b08ec8192bdb5808f8cd"
    dark:
      path: "packages/design-tokens/tokens/semantic.dark.tokens.json"
      bytes: 11733
      sha256: "9d05d0fe63793e304169db0240048da2dfc9b0213bdf617a77ae4fe99a938791"
    externalSources:
      path: "docs/research/design-md-audit/source-manifest.json"
      bytes: 3742
      sha256: "746e6f3ca29edf9dfdb0510c13acde145aa9597e4ed8073b7ba3e2b9c1d62782"
themes:
  light:
    accent:
      type: "color"
      value: "oklch(0.97 0 0)"
    accent-foreground:
      type: "color"
      value: "oklch(0.205 0 0)"
    background:
      type: "color"
      value: "oklch(1 0 0)"
    border:
      type: "color"
      value: "oklch(0.922 0 0)"
    brand:
      type: "color"
      value: "oklch(0.6 0.17 148)"
      description: "The phosphor-green brand accent, LIGHT half (theme-split): MARKER roles only — a live/AI-state dot, a sparkline endpoint, an eyebrow highlight, a terminal prompt glyph. 3.5:1 on card/background, so a meaningful glyph passes WCAG 1.4.11, and it is NOT a text ink: brand LABELS take `brand-text`. Never a headline colour, never a functional state colour, never a full-strength surface."
    brand-text:
      type: "color"
      value: "oklch(0.46 0.17 148)"
      description: "The PAGE-READABLE brand ink, LIGHT half — the same role every chromatic family ships as `<family>-text`. `brand` itself is a 3.5:1 MARKER value (a live dot, a sparkline endpoint, a terminal prompt glyph) and fails WCAG 1.4.3 as a label, so any brand-coloured TEXT reads through this token instead. Gated at 4.5:1 by contrast-check over background, card, popover, muted, accent, secondary and sidebar."
    card:
      type: "color"
      value: "oklch(1 0 0)"
    card-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    chart-1:
      type: "color"
      value: "oklch(0.546 0.245 262.88)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-2:
      type: "color"
      value: "oklch(0.581 0.118 184.7)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-3:
      type: "color"
      value: "oklch(0.398 0.07 227.39)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-4:
      type: "color"
      value: "oklch(0.623 0.222 41.12)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-5:
      type: "color"
      value: "oklch(0.632 0.246 16.44)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-6:
      type: "color"
      value: "oklch(0.505 0.213 27.52)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-7:
      type: "color"
      value: "oklch(0.598 0.127 104.2)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-8:
      type: "color"
      value: "oklch(0.531 0.182 256)"
      description: "Categorical chart hue (MK 2026-09-18: our 8-hue palette is kept — shadcn's `neutral` base ships a greyscale chart ramp, which cannot carry multi-series data). Light halves retuned for the pure-white page and the 0.97 `muted` ground; every hue clears the WCAG 1.4.11 3:1 floor on background, card and muted in both themes."
    chart-single:
      type: "color"
      value: "oklch(0.145 0 0)"
      description: "Single-series chart ink (D29): one series is drawn in foreground ink; the categorical chart-1…8 hues start at two series."
    destructive:
      type: "color"
      value: "oklch(0.577 0.245 27.325)"
      description: "shadcn base-nova's value, verbatim."
    destructive-foreground:
      type: "color"
      value: "oklch(1 0 0)"
    destructive-text:
      type: "color"
      value: "oklch(0.446 0.182 27.325)"
      description: "COL-12 (ours), the page-readable half of the family. A status FILL is tuned to carry its own `-foreground` on top of it; used AS TEXT on the page or on the family's own 10-20% tint it lands between 3.98 and 4.35:1, which is a live WCAG 1.4.3 failure (measured by the rendered axe lane, 2026-09-18, on Alert, Badge, Toast and the soft Button). This is the ink those surfaces read through, AA-gated by contrast-check on background, card, popover and on the /10, /20 and /30 composites over each. Upstream has no tinted status surface at all, so this token is an addition to shadcn rather than a deviation from it."
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
    font-family-display:
      type: "fontFamily"
      value: "Geist, sans-serif"
      description: "Display tier face — the same family as sans today, split as a token so a consumer can retune large type without moving body copy."
    font-family-mono:
      type: "fontFamily"
      value: "'Geist Mono', monospace"
    font-family-sans:
      type: "fontFamily"
      value: "Geist, sans-serif"
    font-family-serif:
      type: "fontFamily"
      value: "Newsreader, serif"
      description: "Serif accent: display emphasis words and pull-quotes only, never running text. Newsreader (opsz axis) until Geist Serif ships."
    foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    info:
      type: "color"
      value: "oklch(0.55 0.19 256)"
      description: "COL-12 (ours): written in shadcn's destructive shape — one fill, one on-fill foreground. AA-gated as page text and as a fill under its foreground, in both themes."
    info-foreground:
      type: "color"
      value: "oklch(1 0 0)"
    info-text:
      type: "color"
      value: "oklch(0.456 0.156 256)"
    input:
      type: "color"
      value: "oklch(0.922 0 0)"
    media-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
      description: "Theme-invariant media chrome ink: the warm off-white used for every icon, label and track drawn over media-scrim or media-scrim-strong. Labels are allowed on EITHER scrim — both are gated at the AA text floor (4.5:1) against this ink over the white worst case. Not overridden in dark on purpose."
    media-scrim:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.6)"
      description: "THEME-INVARIANT media chrome scrim (B4-01): the gradient/backdrop behind controls laid over video or imagery. Always a warm-black alpha, never a theme token, so the chrome reads dark-scrim + light-ink in both themes (`primary` flips with the theme and inverted the chrome in dark). TEXT IS PERMITTED on this scrim: media-foreground clears 5.2:1 on it over a white worst-case backdrop, and tooling/contrast-check.mjs gates the pair at the AA TEXT floor (4.5:1), not the 3:1 non-text floor — so a retune that thins this scrim under AA fails the build rather than silently demoting its labels."
    media-scrim-strong:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.8)"
      description: "Theme-invariant strong scrim for opaque media pills (volume popover, time badge) — 11:1 for media-foreground over a white worst case. Use it for any block of media text that needs headroom beyond the soft scrim's ~5.2:1, and for text over unusually bright or busy frames."
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
      value: "oklch(0.97 0 0)"
    muted-foreground:
      type: "color"
      value: "oklch(0.539 0 0)"
    popover:
      type: "color"
      value: "oklch(1 0 0)"
    popover-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    primary:
      type: "color"
      value: "oklch(0.205 0 0)"
    primary-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    radius:
      type: "dimension"
      value: "0.625rem"
      description: "shadcn base-nova's radius. `--radius-sm/md/lg/xl/2xl/3xl/4xl` are DERIVED from it in the @theme bridge exactly as upstream derives them (0.6/0.8/1/1.4/1.8/2.2/2.6x), so `rounded-xl` on a card is upstream's 14px. The pre-reset 12px cap and the `rounded-xl` ban are gone (BRD-6/BRD-7 = shadcn)."
    ring:
      type: "color"
      value: "oklch(0.205 0 0)"
      description: "FOC-2 (ours): the focus ring is the near-black/near-white INK, not shadcn's mid-grey (0.708 light / 0.556 dark). FOC-1 paints it as one global 2px `:focus-visible` outline, so it is the whole focus affordance and has to carry real contrast."
    secondary:
      type: "color"
      value: "oklch(0.97 0 0)"
    secondary-foreground:
      type: "color"
      value: "oklch(0.205 0 0)"
    sidebar:
      type: "color"
      value: "oklch(0.985 0 0)"
    sidebar-accent:
      type: "color"
      value: "oklch(0.97 0 0)"
    sidebar-accent-foreground:
      type: "color"
      value: "oklch(0.205 0 0)"
    sidebar-border:
      type: "color"
      value: "oklch(0.922 0 0)"
    sidebar-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    sidebar-primary:
      type: "color"
      value: "oklch(0.205 0 0)"
    sidebar-primary-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    sidebar-ring:
      type: "color"
      value: "oklch(0.205 0 0)"
    success:
      type: "color"
      value: "oklch(0.53 0.15 150)"
      description: "COL-12 (ours): written in shadcn's destructive shape — one fill, one on-fill foreground. AA-gated as page text and as a fill under its foreground, in both themes."
    success-foreground:
      type: "color"
      value: "oklch(1 0 0)"
    success-text:
      type: "color"
      value: "oklch(0.44 0.121 150)"
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
    warning:
      type: "color"
      value: "oklch(0.55 0.12 70)"
      description: "COL-12 (ours): written in shadcn's destructive shape — one fill, one on-fill foreground. AA-gated as page text and as a fill under its foreground, in both themes."
    warning-foreground:
      type: "color"
      value: "oklch(1 0 0)"
    warning-text:
      type: "color"
      value: "oklch(0.462 0.1 70)"
  dark:
    accent:
      type: "color"
      value: "oklch(0.269 0 0)"
    accent-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    background:
      type: "color"
      value: "oklch(0.145 0 0)"
    border:
      type: "color"
      value: "oklch(1 0 0 / 0.1)"
    brand:
      type: "color"
      value: "oklch(0.86 0.21 148)"
      description: "The phosphor-green brand accent, DARK half — MK's pick (13.3:1 on the dark canvas). Marker roles plus the `cta` Button's wash/outline."
    brand-text:
      type: "color"
      value: "oklch(0.86 0.21 148)"
      description: "The page-readable brand ink, DARK half. On the dark ground the marker value already measures 12.2:1 as a label, so brand-text and brand carry the SAME value here — the split exists because the light half cannot."
    card:
      type: "color"
      value: "oklch(0.205 0 0)"
    card-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
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
      value: "oklch(0.985 0 0)"
      description: "Repeated here on purpose: an alias is resolved per run, so a light-only alias would leak the LIGHT ink into `.dark` through the cascade (the contrast gate caught exactly that)."
    destructive:
      type: "color"
      value: "oklch(0.704 0.191 22.216)"
    destructive-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    destructive-text:
      type: "color"
      value: "oklch(0.756 0.146 22.216)"
      description: "COL-12 (ours), the page-readable half of the family. A status FILL is tuned to carry its own `-foreground` on top of it; used AS TEXT on the page or on the family's own 10-20% tint it lands between 3.98 and 4.35:1, which is a live WCAG 1.4.3 failure (measured by the rendered axe lane, 2026-09-18, on Alert, Badge, Toast and the soft Button). This is the ink those surfaces read through, AA-gated by contrast-check on background, card, popover and on the /10, /20 and /30 composites over each. Upstream has no tinted status surface at all, so this token is an addition to shadcn rather than a deviation from it."
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
    font-family-display:
      type: "fontFamily"
      value: "Geist, sans-serif"
      description: "Display tier face — the same family as sans today, split as a token so a consumer can retune large type without moving body copy."
    font-family-mono:
      type: "fontFamily"
      value: "'Geist Mono', monospace"
    font-family-sans:
      type: "fontFamily"
      value: "Geist, sans-serif"
    font-family-serif:
      type: "fontFamily"
      value: "Newsreader, serif"
      description: "Serif accent: display emphasis words and pull-quotes only, never running text. Newsreader (opsz axis) until Geist Serif ships."
    foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    info:
      type: "color"
      value: "oklch(0.72 0.15 256)"
    info-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    info-text:
      type: "color"
      value: "oklch(0.76 0.124 256)"
    input:
      type: "color"
      value: "oklch(1 0 0 / 0.15)"
    media-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
      description: "Theme-invariant media chrome ink: the warm off-white used for every icon, label and track drawn over media-scrim or media-scrim-strong. Labels are allowed on EITHER scrim — both are gated at the AA text floor (4.5:1) against this ink over the white worst case. Not overridden in dark on purpose."
    media-scrim:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.6)"
      description: "THEME-INVARIANT media chrome scrim (B4-01): the gradient/backdrop behind controls laid over video or imagery. Always a warm-black alpha, never a theme token, so the chrome reads dark-scrim + light-ink in both themes (`primary` flips with the theme and inverted the chrome in dark). TEXT IS PERMITTED on this scrim: media-foreground clears 5.2:1 on it over a white worst-case backdrop, and tooling/contrast-check.mjs gates the pair at the AA TEXT floor (4.5:1), not the 3:1 non-text floor — so a retune that thins this scrim under AA fails the build rather than silently demoting its labels."
    media-scrim-strong:
      type: "color"
      value: "oklch(0.13 0.002 75 / 0.8)"
      description: "Theme-invariant strong scrim for opaque media pills (volume popover, time badge) — 11:1 for media-foreground over a white worst case. Use it for any block of media text that needs headroom beyond the soft scrim's ~5.2:1, and for text over unusually bright or busy frames."
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
      value: "oklch(0.269 0 0)"
    muted-foreground:
      type: "color"
      value: "oklch(0.708 0 0)"
    popover:
      type: "color"
      value: "oklch(0.205 0 0)"
    popover-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    primary:
      type: "color"
      value: "oklch(0.922 0 0)"
    primary-foreground:
      type: "color"
      value: "oklch(0.205 0 0)"
    radius:
      type: "dimension"
      value: "0.625rem"
      description: "shadcn base-nova's radius. `--radius-sm/md/lg/xl/2xl/3xl/4xl` are DERIVED from it in the @theme bridge exactly as upstream derives them (0.6/0.8/1/1.4/1.8/2.2/2.6x), so `rounded-xl` on a card is upstream's 14px. The pre-reset 12px cap and the `rounded-xl` ban are gone (BRD-6/BRD-7 = shadcn)."
    ring:
      type: "color"
      value: "oklch(0.922 0 0)"
      description: "FOC-2 (ours) — the dark half of the ink ring."
    secondary:
      type: "color"
      value: "oklch(0.269 0 0)"
    secondary-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    sidebar:
      type: "color"
      value: "oklch(0.205 0 0)"
    sidebar-accent:
      type: "color"
      value: "oklch(0.269 0 0)"
    sidebar-accent-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    sidebar-border:
      type: "color"
      value: "oklch(1 0 0 / 0.1)"
    sidebar-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    sidebar-primary:
      type: "color"
      value: "oklch(0.488 0.243 264.376)"
      description: "shadcn base-nova's dark sidebar-primary, verbatim — the one chromatic value in the neutral base (COL-15 = shadcn)."
    sidebar-primary-foreground:
      type: "color"
      value: "oklch(0.985 0 0)"
    sidebar-ring:
      type: "color"
      value: "oklch(0.922 0 0)"
    success:
      type: "color"
      value: "oklch(0.72 0.17 150)"
    success-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    success-text:
      type: "color"
      value: "oklch(0.748 0.17 150)"
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
    warning:
      type: "color"
      value: "oklch(0.75 0.15 70)"
    warning-foreground:
      type: "color"
      value: "oklch(0.145 0 0)"
    warning-text:
      type: "color"
      value: "oklch(0.776 0.15 70)"
recipes:
  button-primary:
    background: "{primary}"
    foreground: "{primary-foreground}"
    radius: "{radius}"
    typography: "text-sm/500"
  button-secondary:
    background: "{secondary}"
    foreground: "{secondary-foreground}"
    hover: "{accent}"
    radius: "{radius}"
    typography: "text-sm/500"
  button-destructive:
    background: "{destructive}"
    foreground: "{destructive-foreground}"
    radius: "{radius}"
    typography: "text-sm/500"
  input:
    background: "transparent"
    foreground: "{foreground}"
    border: "{input}"
    focusBorder: "{ring}"
    radius: "{radius}"
    typography: "text-sm"
  card:
    background: "{card}"
    foreground: "{card-foreground}"
    border: "{border}"
    radius: "{radius}"
    shadow: "none"
  overlay:
    background: "{popover}"
    foreground: "{popover-foreground}"
    border: "{border}"
    radius: "{radius}"
    shadow: "shadow-md"
  menu-item:
    foreground: "{foreground}"
    hover: "{accent}"
    selected: "{accent}"
    radius: "{radius}"
    typography: "text-sm"
---

# VegaStack design

This system **is** shadcn `base-nova`, plus ninety-eight recorded exceptions. Every component we share with
shadcn is upstream's own file with an approved patch applied; every difference traces to a decision
ID; and three offline gates prove both claims on every pull request. That is the whole doctrine, and
this document is deliberately thin because most of what used to be written here is now upstream's
answer rather than ours.

Rebuilt 2026-09-18 by the shadcn reset (`docs/plans/2026-09-18-shadcn-reset/`). Before it, this file
described a fork: a warm neutral ramp, a three-rung surface ladder, a 22-entry alpha ladder with an
"alpha twin" for every rung, a 14px product type scale with named role utilities, a 400/500 weight
ladder, a 12px radius cap, one sanctioned shadow, named z-index bands, a ban on colour transitions, a
mandatory pressed step on every control, and a marketing layer with its own tokens and scope
mechanism. **None of that exists.** It was not deprecated; it was deleted, with no compatibility
layer — see `docs/MIGRATING-SHADCN-RESET.md`.

## How to read this document

The **frontmatter is generated** from the live DTCG sources by `pnpm design:sync`, and
`pnpm design:sync:check` fails the build if it drifts: the resolved token values and the component
recipes there are machine-true. The **prose below is hand-written doctrine**, and it is the weaker
authority. When prose and an enforcing script disagree, the script wins and the prose is the bug —
`tooling/design-lint.mjs`, `tooling/contrast-check.mjs`, `tooling/upstream/*` and the browser lanes
under `packages/ui/test/` are what actually hold the line.

Three things this document deliberately does **not** contain:

- **A component catalogue.** A component's live contract is its docs page, which mirrors upstream's
  own section list and closes with a `## Deviations` list of the decision IDs its patch implements.
- **Counts.** `packages/ui/component-contracts.json` is the machine authority; AGENTS.md § Numbers is
  generated from it.
- **Values.** They are in the frontmatter, and in `packages/design-tokens/dist/theme.css`.

## The baseline — shadcn `base-nova`, used as-is

| Thing        | Value                                                              | Where it is checked                                                   |
| ------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| shadcn CLI   | 4.21.0                                                             | `vendor/shadcn/4.21.0/manifest.json`; `upstream:pull` refuses another |
| Style / base | `base-nova` (`-b base` + `-p nova`), i.e. Base UI                  | `components.json`, the pull manifest                                  |
| CLI flags    | `--pointer` (INT-1), `--rtl` (logical properties throughout)       | the pull manifest                                                     |
| Colour base  | `neutral`, shadcn's own values                                     | the token sources, `verify-theme-parity`                              |
| Fonts        | Geist Sans + Geist Mono (TYP-10)                                   | the preset                                                            |
| Runtime      | Next 16 · React 19 · Tailwind v4 · Node 24.20.0 · TypeScript 6.0.3 | `package.json`, the pnpm catalog                                      |

`vendor/shadcn/4.21.0/` is the pristine upstream tree — components, blocks, CSS, `components.json`
and a per-component docs cache — committed, hashed file by file in its own `manifest.json`, and
never hand-edited. Everything the system shares with shadcn is derived from it.

**Canonical = upstream + patch.** `packages/ui/registry/ui/<name>.tsx` is the file we edit, and it
must equal `vendor/shadcn/4.21.0/ui/<name>.tsx` with `packages/ui/upstream/patches/<name>.patch`
applied, byte for byte. A patch header names the decision IDs its hunks implement; a hunk that
implements nothing on that list has no right to exist. Components we have that shadcn does not are
recorded in `packages/ui/upstream/ours.json`; names that DO NOT SHIP here whatever upstream does —
both the ones we deleted in favour of an upstream replacement and the ones upstream ships that this
system does not want — are in `packages/ui/upstream/excluded.json`. **There is no third category** — a file that is neither
upstream-backed nor a recorded extra fails the gate.

Three offline gates carry that, in `pnpm upstream:check`, inside `pnpm lint`:

1. **`upstream:integrity`** — every committed file under `vendor/shadcn/4.21.0/` is re-hashed against
   the manifest. A tampered vendor file, a recorded file that is gone, or a file no pull produced all
   fail.
2. **`upstream:parity`** — patch-onto-upstream reproduces each canonical file byte for byte; a
   component with no patch must equal upstream exactly; a patch may only name an ID that
   `packages/ui/upstream/decisions.json` marks **ours**; a retired name must stay absent; an
   exception the map assigns to a component must appear in that component's patch header.
3. **`upstream:variants`** — every section on upstream's own docs page exists on ours, in order,
   each with a live `<ComponentPreview>` whose name the preview barrel actually exports, and no two
   required sections may answer with the same preview.

All four scripts under `tooling/upstream/` carry a `--self-test` that observes them failing
(`pnpm upstream:selftest`), because a gate nobody has seen fail is an assumption.

## What we add — the ninety-eight exceptions

`docs/plans/2026-09-18-shadcn-reset/decisions.md` is the register: 206 rows, 108 resolved as
**shadcn** (upstream ships unchanged) and 98 as **ours**. `packages/ui/upstream/decisions.json` is
its machine copy and the only thing a gate reads; `packages/ui/upstream/exception-map.json` records
which shared component each exception is assigned to. Re-opening a row is MK's decision. The ninety-eight
group into six themes.

### 1. Focus — one outline, and no glow anywhere

`FOC-1 · FOC-2 · FOC-3 · FOC-4 · FOC-5 · FOC-6 · FOC-7 · FOC-8 · FOC-9 · FOC-10 · FOC-12`

`base.css` owns one rule: `:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px }`,
with `ring` bound to the near-black / near-white ink rather than upstream's mid-grey (FOC-1, FOC-2).
Text entry shows a border tint instead — `focus:border-ring/70`, on plain `:focus` so a click and a
Tab read identically, with `outline-hidden` rather than `outline-none` so forced colours can repaint
it (FOC-3, FOC-8); a button-style trigger combines the tint with the outline (FOC-4). Focus outranks
the invalid tint (`not-focus:aria-invalid:…`, FOC-5). Inside a clipping ancestor the outline is
pulled in with `-outline-offset-2`, the one permitted local deviation (FOC-9). A forced-colours
block paints `outline: 2px solid Highlight` on focused text entry (FOC-7). The focus tint is
contrast-gated as a composite at 3:1 in both themes (FOC-10). A checkbox, radio or switch inside a
field label gets the global outline on the control; upstream rings the whole choice card, and we do
not (FOC-12).

**Upstream's `ring-3 ring-ring/50` halo is removed everywhere** — button, badge, input, checkbox,
switch, slider, scroll-area, tabs, toast, field cards, all of it (FOC-6). This is the exception most
likely to creep back on a future pull, so it has a machine check:
`design-lint`'s **`no-focus-ring-glow`** rejects `ring-3`, `ring-[3px]`, `ring-ring/NN`,
`focus-visible:ring-*` and a focus-variant `shadow-[0_0_0_…]` anywhere in `packages/ui/registry/**`.
A **resting** `0 0 0 1px` hairline — upstream's outline `SidebarMenuButton` draws one — is not a
glow and is accepted; the structural self-test observes both halves.

### 2. Cursor and touch

`INT-1 · INT-7 · INT-9 · INT-11`

A global `cursor: pointer` on every control, delivered by upstream's own `--pointer` flag plus a
wider selector list (INT-1) — which also means upstream's explicit `cursor-default` on menu, select
and command rows is patched out. `touch-action: manipulation` and no tap-highlight colour, so there
is no 300ms delay and no grey flash on mobile (INT-7). The grab cursor appears only where a pointer
drag can actually start — never under `readOnly`, `dragDisabled`, or below the breakpoint where the
"Move to…" menu is the only path (INT-9). A global shortcut ignores an editable target (input,
textarea, select, contenteditable) and an event already `defaultPrevented`, and can be switched off:
the sidebar's Mod+B reads `isEditableTarget` from `use-platform` and takes `keyboardShortcut`
(default `"b"`, `false` disables it) (INT-11).

Note what is **not** here, because it used to be: there is no disabled-cursor rule (INT-2 is
shadcn), no press translate of our own (INT-3 is shadcn — upstream's own `translate-y-px` ships),
and **no mandatory pressed step** (INT-4 is shadcn). A hover with no `active:` rung is legal now.

### 3. Accessibility beyond upstream

`A11Y-1 · A11Y-2 · A11Y-3 · A11Y-4 · A11Y-5 · A11Y-6 · A11Y-7 · A11Y-8 · A11Y-9 · A11Y-11 ·
A11Y-12 · A11Y-13 · A11Y-16 · A11Y-17 · A11Y-18 · A11Y-19 · A11Y-20 · A11Y-22 · A11Y-23 · FRM-4 ·
FRM-15`

- **A11Y-1** — WCAG 2.2 AA for every gated foreground/background pair in both themes, as a
  fail-closed gate (`tooling/contrast-check.mjs`, with its own `--self-test`).
- **A11Y-2** — target size ≥24px through an **invisible** hit area, verified with a real
  `elementFromPoint` probe rather than `getComputedStyle`. Measured per case, at every width:
  upstream grows `SidebarMenuAction` with `after:-inset-2` and then switches it off again at `md`,
  which a 320px-only sweep cannot see.
- **A11Y-3 / A11Y-4** — live regions are polite `status` by default; `alert` only for destructive or
  warning content rendered after mount; page chrome present at load gets no live role at all.
  `useAnnouncer` is the one implementation: one region per component, mounted empty from first paint,
  keyed by a monotonic sequence. Where an engine already ships the region (Base UI's toast,
  `@shadcn/react`'s message-scroller and questionnaire), the row resolves as **no hunk** with a test
  pinning the engine's shape, so it fails the day the engine drops it.
- **A11Y-5** — an `sr-only ", "` separator between sibling name parts laid out with `gap`. Its one
  live call site is a deliberate **non**-application: `ToolCallChip`'s parts are flex children, CSS
  blockifies them, and accname already inserts the spaces — adding a comma would name the control
  `Search files , 1.2s`. `accessible-name.browser.test.tsx` measures that with the theme loaded.
- **A11Y-6** — a scroll viewport is a tab stop only while it can actually scroll; a named viewport is
  `role="region"`. Base UI's `ScrollArea.Viewport` implements this itself, so the row is a no-hunk
  with a test. **It is not implemented for tables**: upstream's `Table` wraps itself in a plain
  container, `table-scroll-region.tsx` is the orphaned implementation, and the gap is pinned by
  `data-list.test.tsx` rather than hidden. Open, and recorded on the `ours.json` entry.
- **A11Y-7** — a role that requires a parent is licensed by a **context**, never by a default.
  `Item` takes `listitem` only inside `ItemGroup`; cmdk's empty palette takes its roles the same way.
  An `Item` that renders a link or a button inside `ItemGroup` moves `listitem` to a wrapper
  (`data-slot="item-listitem"`), so the control keeps its own role.
- **A11Y-8** — never signal by colour alone: an alert always carries an icon, a field error a leading
  glyph.
- **A11Y-9** — what is hidden from assistive technology must not be reachable by keyboard. Native
  `inert` mirroring for modal backgrounds (`use-modal-inert`) on dialog, alert-dialog, sheet and
  drawer; plus two engine defects fixed under the same invariant — Base UI's high-priority toast
  (`aria-hidden` on a tabbable root) and its `aria-hidden` combobox addon (a tabbable toggle inside
  it). Both are pinned to the engine's exact shape, so the hunk fails as stale the day upstream fixes
  it, and **neither is carried as an axe suppression**.
- **A11Y-11** — a stepper is an ordered list with `aria-current="step"`, never tab semantics.
- **A11Y-12** — a loading button keeps its label at `opacity-0` under the spinner, never
  `visibility: hidden`, so the box and the accessible name both survive. **The label wrapper has
  to generate a box for that to mean anything**: `display: contents` generates none, so it
  accepts no `opacity` and the label paints at full strength under the spinner — which is how
  Toggle shipped for a release while a unit assertion on the `opacity-0` CLASS stayed green. Live
  at Button and Toggle, measured in `test/control-paint.browser.test.tsx` and
  `test/button-states.browser.test.tsx`.
- **A11Y-13** — **a soft status surface takes the family's `-text` ink, never the fill as ink.**
  `bg-<family>/10 text-<family>-text`. The row is the rule, not a roster: it reaches a tinted status
  surface whenever the pair **measures** under the AA floor A11Y-1 enforces. Upstream's
  `text-destructive` on its own `/10` is 3.987:1 in light; the `-text` ink is 6.966:1 on the same
  composite. Live at Button's `destructive` variant, Badge's tinted variants, Alert's status
  variants, Field's error copy, Bubble's `destructive` variant and Attachment's error description.
  What measures **over** the floor stays upstream verbatim — Attachment's error icon at 3.973:1
  against the 3:1 non-text floor does.
- **A11Y-16** — every interactive control carries an accessible name. Where upstream ships one that
  does not — Base UI's Slider keeps the real `<input type=range>` visually hidden, so `role="slider"`
  is anonymous in every composition; Combobox's toggle, clear and chip-remove are icon-only buttons —
  the patch supplies it.
- **A11Y-17** — a sidebar count is part of its control's name: `SidebarMenuButton` takes
  `badge`/`badgeLabel`, the name reads "{label} {badgeLabel}" through a comma-free `sr-only` suffix
  (in the collapsed tooltip too), and the visual `SidebarMenuBadge` is `aria-hidden`. The A11Y-5
  separator is not used here, because accname would read "{label} , {badgeLabel}".
- **A11Y-18** — an active nav link carries `aria-current="page"`: `SidebarMenuButton` sets it when
  `isActive` and it renders a link; a button never gets it.
- **A11Y-19** — Checkbox's mixed state has its own glyph: a minus replaces the check.
- **A11Y-20** — `orientation` reaches the Base UI root on Tabs and ToggleGroup, so
  `aria-orientation` and the arrow keys follow a vertical list.
- **A11Y-22** — ScrollArea exposes `viewportRef`, a ref to the focusable viewport, for programmatic
  scrolling.
- **A11Y-23** — pagination links render as `<a className={buttonVariants()}>` and keep the link
  role; `aria-current="page"` marks the current page.
- **FRM-4** — a disabled control renders `aria-disabled` and **keeps its pointer events**, so a
  tooltip can explain why it is unavailable. Upstream's `disabled:pointer-events-none` is patched out
  wherever it appears.
- **FRM-15** — disabled styles key on `data-disabled` where the Base UI root is not a native control
  (Checkbox and RadioGroupItem render a `<span>`), so a disabled checkbox or radio dims outside a
  `Field` too.

### 4. Tokens and semantics we add

`COL-12 · COL-18 · COL-20 · COL-22 · COL-23 · TYP-10 · TYP-14 · TYP-15 · TYP-16 · TYP-17 · TYP-18 ·
ICO-1 · ICO-3 · ICO-6 · ICO-8`

Four status families written in upstream's own `destructive` shape (COL-12); a status hue means
status, not sentiment — a favourite star is `foreground`, not `warning` (COL-18); semantic tokens
only, no authored hex and no numbered Tailwind palette (COL-20); `color-scheme` set per theme
(COL-22); a toast's first text line carries the default ink even when Base UI renders no title
(COL-23). Geist Sans and Geist Mono (TYP-10): numbers — counts, dates, amounts, quantities — are Geist Sans with tabular digits (`tabular-nums`), and Geist Mono is for code and identifiers only; the heading tier
(`text-lg` and up) takes Geist's line-height and letter-spacing from the `@theme inline` bridge, with
sizes and the copy tier untouched (TYP-15); smoothed font rendering on `body` (TYP-16); a declared
14px body size on `body`, never on `html` (TYP-17); no arbitrary font size, so upstream's 12.8px `sm`
half-step resolves down to `text-xs` (TYP-18); Avatar's fallback initials are `text-xs` at every
size (TYP-14). Icons are lucide,
the lucide-animated mirrors and `thesvg` brand glyphs through `Icon`/`BrandIcon` and nothing else
(ICO-1); no inline `<svg>` as an icon (ICO-3); the animated-icon factory owns the trigger and
reduced-motion rules (ICO-6); **the indeterminate loading mark is lucide `Loader`, never
`Loader2`/`LoaderCircle`** (ICO-8). The token additions themselves are the next section.

**COL-20 is narrower than it was.** `bg-black/10` and `bg-white` pass — they are upstream's own scrim
vocabulary — and a raw `/NN` alpha or an `opacity-50` is ordinary Tailwind now, because the alpha and
opacity ladders are deleted. What is still rejected is an **authored** hex and a numbered palette
class. A hex appearing inside an attribute selector is masked by position, not by a file allowlist,
because upstream's `chart.tsx` matches recharts' own `stroke='#ccc'` in order to replace it with a
token — that is COL-20 being enforced, not broken.

### 5. Our own recipes and behaviours

`MOT-5 · MOT-6 · MOT-7 · MOT-13 · TYP-13 · BRD-1 · LAY-9 · LAY-10 · LAY-11 · LAY-12 · LAY-13 · LAY-14 ·
LAY-15 · LAY-16 · FRM-9 · FRM-10 · FRM-12 · FRM-13 · OVL-10 · OVL-11 · OVL-13 · OVL-14 · OVL-15 ·
OVL-16 · OVL-17 · OVL-18 · API-5 · API-9 · API-17 · API-18 · API-19 · API-20 · API-21 · API-22 · API-23 ·
API-24 · API-26 · API-27 · API-28 · VOI-1`

- **Motion.** The global reduced-motion reset in `base.css` is the one sanctioned `!important`, and a
  `motion-reduce:` restatement of it is a violation (MOT-5). Keyed-presence utilities
  `motion-pop-in` / `motion-enter-up` / `motion-shake` / `motion-flash` plus `useAnimationReplay`
  (MOT-6); docked-presence `motion-dock-in` / `motion-dock-out`, 150ms in on `emphasized` and 100ms
  out on `exit`, no scale, an exit never slower than its enter (MOT-7). Excluded by design and not to
  be added speculatively: avatar hover-lift, card tilt, FAB morph (MOT-13).
- **Prose** (TYP-13) — one recipe, `proseClassName` from `@vegastack/design`, expressed as descendant
  variants, with no `@tailwindcss/typography`. `MarkdownView` and `TextEdit` both wear it, so rendered
  rich text is identical in both. Because it is descendant-expressed, an element-level class on a
  child **loses** to it; restyle by composing the recipe, never by classing the rendered element.
- **Surfaces** (BRD-1) — cards and floating surfaces draw a real 1px `border border-border`, never
  upstream's `ring-1 ring-foreground/10` box-shadow outline; the floating sidebar draws
  `border border-sidebar-border` (MK, 23-09-2026). Avatar's `ring-2 ring-background` is a stacking
  gap, not an outline, and stays. `design-lint`'s `no-surface-ring` keeps the ring from returning.
- **Layout** (LAY-9…LAY-16) — container queries first, then viewport breakpoints, then
  `useMediaQuery` last, and a JS branch must declare its `serverFallback`; safe-area insets on
  edge-pinned surfaces, `dvh` over `vh`, `svh` only for the sidebar; truncation is `min-w-0` on the
  flex child with `truncate` on an inner span, never both on one element; `AppShell` owns the landmark
  trio, the skip link and the content container. **The `<nav>` landmark lives inside the rail**:
  upstream's `Sidebar` is divs by design and renders two different trees, so there is no single
  element a role can ride through both. The collapsed state survives a static first paint:
  `SidebarStateScript` in `<head>` reads the cookie, marks `<html>` with `data-sidebar-state` and
  gives the desktop panel its collapsed `data-state` before hydration, and `useSidebarCookieOpen`
  reads and writes the cookie for a controlled provider (LAY-13). A line tab list scrolls inside
  itself, with edge fades and the active trigger kept in view — `TabsList overflow="scroll"`, the
  default for `variant="line"` (LAY-14). `AlertAction` takes its own top-aligned grid column and
  drops below the text under `@md`, so it never overlaps the title (LAY-15). Skeleton widths cycle by
  index, never `Math.random()`, so server and client markup agree (LAY-16).
- **Forms** (FRM-9…FRM-13, API-26) — `Field` wires its control through Base UI Field (API-26): the label, the
  description and error ids, and `aria-invalid` from the Field's `data-invalid`, on every control
  including the composite ones (Select, Combobox, RadioGroup, NumberField, DatePicker, TextEdit). Pass
  ids only to override; an explicit `aria-*` prop merges with the Field's. The invalid shake is the field's, not the control's, and fires only on a
  live valid→invalid transition (FRM-9; no canonical component calls it today, because `field.tsx` is
  upstream's file and upstream's Field has no validation motion — the hook ships for consumers).
  `SearchableSelect` is the one combobox-shaped select, and its clear control is a sibling of the
  trigger, never a child (FRM-10). One async-write vocabulary, `idle | saving | saved | error`, shared
  by every field that persists; a rejected commit reverts and announces (FRM-12). NumberField's
  steppers are full-height flanking buttons, measured against real CSS at ≥24px inside a 32px group
  (FRM-13). Reusable clearable search fields compose `InputGroup` through `SearchInput`: the native
  search-cancel paint is suppressed, a token-colored 24px clear button owns the action, and generic
  `Input` keeps its single-input DOM and behavior contract. A Select trigger is `w-full` by default
  and takes `variant="ghost"` for an inline row (API-24).
- **Overlays** (OVL-10, OVL-11, OVL-13…OVL-18) — Toast is the one notification engine;
  `sonner` is retired (OVL-10), and it keeps one store: the provider passes the module manager and
  `Toaster` reuses a provider above it, so `toast()` and `useToastManager()` feed one queue (OVL-17). Toast adds a logical `position` prop, the anchored
  `ToastPositioner`/`ToastArrow` parts, and a `z-60` viewport band — the one surface above the single
  `z-50` overlay band, so a toast fired over a Dialog is not behind its scrim (OVL-15). A portaled
  tooltip or dropdown accepts a `container`, so chrome over a fullscreen surface portals into it
  (OVL-14). `DialogContent` takes a `size` prop — `sm`, `default` (upstream's `sm:max-w-sm`), `lg`,
  `xl` — reflected as `data-size`, the axis `AlertDialogContent` already carries; `CommandDialog`
  and a side `SheetContent` take the same scale (OVL-16). Overlay footers are as plain as their headers — no muted band, no top border — with actions right-aligned and secondary actions (Cancel, Back, Keep editing) on `variant="secondary"`; a Sheet's Cancel may take the start edge with `data-slot="sheet-cancel"` (OVL-18). A panel's search is a sticky header row with no nested bordered
  input, and it has exactly one owner, the `panel-search` shared-internal item (OVL-11). Every portal
  re-applies the theme scope so a popup opened from inside a scoped subtree paints in that scope
  (OVL-13); `verify-portal-theme-scope` discovers every Base UI portal host and requires its owner to
  attach the scope, so an added, missing or unscoped portal fails.
- **API** (API-5, API-9, API-17…API-24, API-27, API-28) — `loading` holds a committing control's box and sets `aria-busy`
  (API-5; audited per component, and a tab does not commit anything, so it has none). Chip/Tag is one
  primitive with a real 24px remove control (API-9). `intent` is the name for a hue-only axis on a
  component that is **ours**; never `color` or `status` (API-17). A component reset onto upstream does
  **not** get an `intent` axis — it takes upstream's flat `variant` list, and our status families
  surface as extra `variant` values in upstream's own `destructive` shape. Parts added to upstream
  components: Command's `CommandLoading` and a `CommandFooter` outside the listbox (API-18); a
  two-line option or menu row composes `ItemTitle` + `ItemDescription`, and the row links the
  description as its accessible description (API-19); `ItemGroupLabel`, a heading (default `h3`)
  that names the `ItemGroup` after it (API-20); `SheetBody` and `DialogBody` scroll between a fixed
  header and footer, `SheetAction` is an end seat in `SheetHeader`, and `closeLabel` renames the
  close control (API-21); `CardTitle` and `EmptyTitle` take `render`, so the heading level is set on
  the part (API-22); ToggleGroup's `deselectable` (default `true`) and `wrap` (API-23); Combobox's
  `ComboboxStatus`, Base UI's own polite region, kept mounted beside the list (API-27); and
  Attachment's `AttachmentGroup layout="scroll" | "grid"`, `AttachmentProgress` with
  `aria-valuetext` "{n}%", `muted`, and nested-image styling (API-28).
- **Voice** (VOI-1) — upstream's default English copy is rewritten to sentence case with the ellipsis
  character, and every built-in string can be overridden: through an `<action>Label` prop on a part
  we add, and through the prop upstream already names where it has one (`PaginationPrevious` /
  `PaginationNext` `text`, `CommandLoading` `label`), which is not renamed. § Voice & content has
  the rules.

### 6. Engineering conventions

`API-15 · API-16 · API-25 · DOC-1 · DOC-2 · DOC-7 · DOC-9`

Flat exports, React 19 ref-as-prop (never `React.forwardRef`), CVA plus `cn()`, `data-slot` on every
part, and Base UI's `render` prop never `Omit`ed from a single-polymorphic-root component (API-15).
`'use client'` at the lowest interactive leaf only — a runtime claim, enforced by
`tooling/verify-rsc-safety.mjs` under the `react-server` condition, which is why the client-only
theme-scope plumbing lives at the `@vegastack/design/theme-scope` subpath and is never re-exported
from the root (API-16). Variant unions and class recipes are exported from upstream components too
(`BadgeVariant`, `tabsTriggerVariants`), so a consumer types a status map from the system's own
recipe (API-25). Three synced copies per component with `meta.integrity` and a Sigstore-signed
manifest (DOC-1); hybrid distribution — public npm for the runtime and tokens, a private registry for
components, model "own it" with no `Vega*` prefix (DOC-2). The engine list is closed, and everything
upstream itself depends on was pre-approved with it; anything else is a new MK decision (DOC-7).
TypeScript is pinned (DOC-9, and the reason is in § Toolchain).

## Conventions for components we own

A component shadcn ships takes upstream's names verbatim. A component that is **ours** has no
upstream to copy, so these are the spellings it uses — one per concern. A new prop follows the table;
a shipped component that still differs is listed under **Known deviations in components we own** below and is brought in
line when its file is next touched, never in a drive-by rename.

| Concern                 | One spelling                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Axis words              | `size` is a tier, `xs · sm · default · lg` (+ `icon-*`); an overlay width is `sm · default · lg · xl`; never `md`. `variant` is the look. `intent` is a hue-only axis (API-17). `state` is a lifecycle enum. `orientation` is upstream's word. `layout` is an arrangement.                                                                                                                                               |
| Identity accessors      | The combobox family uses Base UI's names — `itemToStringLabel`, `itemToStringValue`, `isItemEqualToValue`, and `itemToDescription` / `itemToDisabledReason` for new ones. The table and board family spells them `getRowId`, `getRowHref`, `getRowLabel` and `getItemId`, `getItemHref`, `getItemLabel`; `getRowId` (DataList, DataGrid) and `getItemId` (Board) ship today, and a new accessor takes the matching name. |
| Second-line option text | Compose `ItemTitle` + `ItemDescription` inside the row; a preset exposes an `itemToDescription` accessor. No per-component title and description props.                                                                                                                                                                                                                                                                  |
| Why unavailable         | `disabled` plus a description line saying why. The prop is `<noun>Reason: string` (`lockedReason`). A disabled control stays focusable (FRM-4).                                                                                                                                                                                                                                                                          |
| Empty-state copy        | A region takes `emptyState: ReactNode`; a popup list takes `emptyMessage: string`.                                                                                                                                                                                                                                                                                                                                       |
| In flight               | `loading`, never `pending`. `error?: ReactNode` renders a `role="alert"` line in the `-text` ink with the retry "Try again".                                                                                                                                                                                                                                                                                             |
| Paging                  | One `loadMore` object on a collection — `{ hasMore, onLoadMore, loading? }`, as `DataGrid`'s `loadMore` is today, plus an `error?` when a collection shows its own load failure. No page numbers on a keyset list.                                                                                                                                                                                                       |
| Element choice          | `render` on parts. A props-API component takes a `<slot>Render` element prop — a slot named `back` takes `backRender`. No new `as` or `titleAs`.                                                                                                                                                                                                                                                                         |
| Default copy            | Every rendered string is an overridable `<action>Label` (or `…Message`) prop with a sentence-case default; a `labels` object only past about six strings. Progress text and search placeholders end with the ellipsis character; a one-line state has no full stop.                                                                                                                                                      |
| Settled value           | `onValueCommitted` — Base UI's word.                                                                                                                                                                                                                                                                                                                                                                                     |
| Counts in controls      | The visible count plus an `sr-only` suffix inside the control's accessible name; the visual badge is `aria-hidden`. A new prop that supplies the host noun is `countLabel?: (n) => string` (or `badgeLabel` for a fixed string). A `Badge` shows a count only for unread or attention.                                                                                                                                   |
| Headings                | Page: `font-heading text-2xl font-semibold`, through `PageHeader`. Section `h2`: `font-heading text-base font-medium` (a plain `h2` with those utilities, or `CardTitle`; the `SettingsSection` title is the same size and weight). Group label: `text-xs font-medium text-muted-foreground` (table section rows, Board lanes; `SidebarGroupLabel` keeps the sidebar's own ink).                                         |
| Numbers                 | Counts, dates, amounts and quantities are the regular font with `tabular-nums`; `font-mono` is for code and identifiers only (TYP-10).                                                                                                                                                                                                                                                                                   |
| Announcements           | `useAnnouncer` for events; the engine's own region where it ships one (Base UI's `Combobox.Status`, the toast viewport); a persistent status that is the component's own content may be `role="status"`.                                                                                                                                                                                                                 |
| Slots                   | `data-slot` on every part, prefixed with the exported component's kebab-case name; a container-query name is the slot name.                                                                                                                                                                                                                                                                                              |
| Exports                 | `XProps` for every component that is ours; `XVariant` / `XSize` unions and the class recipe for every CVA'd component.                                                                                                                                                                                                                                                                                                   |
| Tones                   | success · info (in flight) · warning · destructive · neutral, mapped the same way across `Badge`, `Alert`, `StatusIcon`, `Stepper` and `Attachment`'s `state`.                                                                                                                                                                                                                                                           |

**Known deviations in components we own**, each fixed when its file is next touched: `md` on
`Stat`, `StatusIcon` and `Chip` (add `default`, keep `md` as an alias); `SettingsSection`'s `titleAs`
and `TruncatedText`'s `as` (→ `render`); `dismissable` on `AnnouncementBanner` (→ `dismissible`);
`ActionBar`'s `pending` (→ `loading`); `MultiStepForm`'s `Back`, `Next`, `Skip` and `Exit` parts,
which export no `…Props` type; `AppShellPage`'s `size` (`narrow · default · full`, a page measure off
the size ladder); `DataList`'s "Loading rows" status (→ "Loading rows…");
`PanelSearch`'s look differing from `SearchableSelect`'s in-popup search; and per-component
async-write status (→ one shared shape).

**Differences in upstream components** do not follow this table — each would need its own decision
row, so they are listed only so nobody copies them into a component we own: `md` on
`SidebarMenuSubButton`, a physical `side` on `Sheet` and `Sidebar`, three option-row recipes across
`Select`, `Combobox` and `Command`, and `ComboboxChip` rendering Base UI's own chip rather than
`Chip`.

## Tokens we add

shadcn's `neutral` base is adopted verbatim — `background`, `foreground`, `card`, `popover`,
`primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius` and the
seven `sidebar-*` tokens all carry upstream's values. On top of it:

| Family                                                     | Why it exists                                                                                                                                                                                                          | Gate                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `info` · `success` · `warning`, each `-foreground`/`-text` | Upstream ships only `destructive`. A product surface needs four status families, written in upstream's own shape (COL-12)                                                                                              | `contrast-check.mjs`, both themes, on every surface and tint       |
| `destructive-text`                                         | The page-readable half of upstream's own family. `destructive` is tuned to carry `-foreground` on top of it, not to be read as ink (A11Y-13)                                                                           | same                                                               |
| `chart-1 … chart-8`, `chart-single`                        | shadcn's `neutral` base ships a **greyscale** chart ramp, which cannot carry a two-series chart. Kept and retuned; `chart-1…5` keep upstream's names so upstream's own chart blocks resolve unchanged (MK, 2026-09-18) | 3:1 (WCAG 1.4.11) on `background`, `card` and `muted`, both themes |
| `tag-<hue>` × 10, each `-subtle`/`-text`                   | The decorative label palette behind `Chip`/`Tag` — categorical identity, never status                                                                                                                                  | `contrast-check.mjs`                                               |
| `brand`, `brand-text`                                      | The phosphor-green marker accent and its page-readable ink. A marker role only — never a functional state colour, and `brand` is not a text ink                                                                        | `contrast-check.mjs`                                               |
| `media-scrim`, `media-scrim-strong`, `media-foreground`    | Chrome laid over video must not flip with the page theme. Dark scrim, light ink, identically in both themes                                                                                                            | `media-chrome.browser.test.tsx` on compiled CSS                    |
| `duration-*`, `motion-ease-*`                              | The values the `motion-*` utilities consume (MOT-6, MOT-7)                                                                                                                                                             | `verify-token-references`                                          |
| `font-family-*`                                            | Geist Sans / Geist Mono (TYP-10)                                                                                                                                                                                       | `verify-theme-parity`                                              |

**Status colour has two inks, and this is the rule most often got wrong.** `-foreground` is the ink
**on the solid fill**. `-text` is the ink **on the page and on the family's own `/10`–`/30` tint**.
Using the fill itself as text on its own tint measures 3.98–4.35:1, which is a live AA failure
(A11Y-13).

**There is no surface ladder.** The surfaces are `background` → `card` (= `popover` = `sidebar`) →
`muted` (well, track, skeleton) → `accent` (hover). `muted`, `accent` and `secondary` share one value
in this base and all three are kept, so name the one whose **role** you mean and a consumer can
retune one without moving the others. Hover and pressed values are written per component, the way
upstream writes them; `surfaceInteractive`, `fillInteractive`, `fieldControl`, `fieldControlGroup`
and `selectedChipVariants` were deleted from `@vegastack/design` with no alias.

**Overriding a token** is one runtime variable in a consumer's global CSS — `:root { --primary: … }`
— and every component repaints in both themes. Never override a `--color-*` variable: that is the
build-inlined Tailwind bridge, not the runtime contract.

## Size, radius, shadow, z-index, alpha, type, motion — upstream's vocabulary

There is almost no doctrine in this section, and that is the point. These are plain Tailwind
utilities: `h-8`, `size-4`, `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`,
`font-semibold`, `text-4xl`, `transition-all duration-100 ease-in-out`. Radius derives from one
`--radius` (0.625rem) exactly as upstream derives it. Type SIZES are Tailwind's stock scale —
`text-sm` is 14px and `text-base` is 16px, everywhere, including the docs shell.

**Type metrics are the one exception, and they are global** (TYP-15/16/17/18, MK 2026-09-22).
Geist's own spec splits a COPY tier from a HEADING tier, and so does this system:

- **The copy tier — `text-xs` / `text-sm` / `text-base` — is untouched stock**, with zero
  letter-spacing, exactly as Geist's `copy-*` scale specifies. Nothing in the `@theme` bridge
  declares it.
- **The heading tier — `text-lg` and above — carries optical metrics**, declared once in the
  `@theme inline` bridge as per-size `--text-*--line-height` and `--text-*--letter-spacing`.
  Tracking runs -0.012em at 18px to -0.06em at 72px, and leading is a designed ramp rather than
  Tailwind's stock ratios (which are non-monotonic — stock `text-lg` is looser than `text-base` —
  and collapse toward 1.0 at display sizes, clipping Geist's descenders under negative tracking).
  Sizes do not move, so TYP-1 stays **shadcn** and a pasted shadcn snippet still renders at
  upstream's size.
- **A component never writes its own `tracking-*`.** `design-lint`'s `raw-tracking` rejects it,
  because Tailwind compiles the ramp as `letter-spacing: var(--tw-tracking, …)` and a local class
  silently wins. `tracking-widest` is the one allowance — the keyboard-shortcut hint idiom, a role
  the ramp does not cover.
- **No arbitrary font size.** `arbitrary-text-size` rejects `text-[13px]` and friends: an arbitrary
  value bypasses the `--text-*` namespace and receives neither half of the ramp. Upstream's
  ladder — which genuinely does scale type with control size — is kept, with its half-steps
  resolved onto the ramp rather than flattened.
- **Rendering and default size are global too.** `body` carries
  `-webkit-font-smoothing: antialiased` (Geist is drawn for it) and a declared 14px default, set on
  `body` and never on `html` — `rem` resolves against the root, so an `html` size would rescale
  every token and override the reader's own browser preference (WCAG 1.4.4). The docs shell keeps
  its 16px reading size and is the deliberate exception.

Deleted with their rules, and with the lint rules that enforced them: `--surface-1/2/3`,
`--surface-raised`, the alpha ladder and its "alpha twin" doctrine, the opacity ladder, `--size-*`,
`--icon-*`, `--panel-width-*`, `--layout-*`, `--z-*`, `--shadow-overlay`, `--radius-xs`,
`--radius-sharp`, `--overlay`, `--font-family-pixel`, `--muted-foreground-faint`, the whole role /
display / product / doc type scale, and the `<family>-subtle`/`-hover`/`-active` steps. Seventeen
design-lint rules went with them — the radius cap, the shadow ban, the weight ladder, the
`transition-colors` ban, `hover-without-pressed`, the uppercase-mono rule, the off-scale-text rule,
the alpha/opacity role rules and the z-band rules among them. The complete rule-by-rule state is
`skills/internal/review/references/lint-rules.md`, and the token vocabulary is
`skills/internal/component/references/tokens.md`; both are gated against the script by
`tooling/skill-lint.mjs`.

**The marketing layer is gone, not deprecated.** Ten components, the `MarketingSurface` theme scope
and its `.vs-marketing` selectors, the marketing tokens and every marketing lint rule were deleted on
2026-09-18. `announcement-banner`, `terminal` and `code-block` were explicitly kept and moved to
Feedback and Content. The portal half of the theme scope stays — OVL-13 depends on it.

## Iconography

One library: **lucide** (functional line icons), the lucide-animated mirrors for motion, and `thesvg`
for brand glyphs — through `Icon` / `BrandIcon`. Icon sizes are ordinary utilities (`size-3`,
`size-3.5`, `size-4`) sitting on the control tier that carries them; never pass `size`/`width`/
`height` to a lucide component. Stroke 1.5–2px, always `currentColor`, so an icon inherits text
colour and every state. Never inline an ad-hoc `<svg>` as an icon, and never mix icon libraries.

With text that can wrap, align the icon to the **first line**, not the block midpoint: an
`items-start` row with a line-height-sized icon wrapper.

**The factory owns the controller; icons are data** (ICO-6). Every mirrored lucide-animated icon is a
`createAnimatedIcon({ … })` call describing only its geometry, its Motion variants and — where
upstream choreography is not a plain play/rest pair — its start/stop steps. The controller lives once
in `@vegastack/design/create-animated-icon`: the animation controls, the reduced-motion gate, the
imperative `startAnimation`/`stopAnimation` handle, and the multi-input trigger rules (hover plays on
a fine pointer, a tap plays on touch, focus plays and blur rests, and every one of them stands down
once a consumer attaches a ref — including the tap driver, so a ref-controlled icon that omits its own
`pointerdown` handler is dead on touch). The host is an **`inline-flex` `<span>`**. Reduced motion is
a **live subscription**, not a one-shot read, so turning the preference on settles every icon already
on screen.

## Components and blocks

**A component is reusable, prop-configured, imported in several places and tracked for updates**
(`registry:ui`). **A block is a screen or section someone copies once and then owns** (`registry:block`)
— sample data inline, no primitive invented inside it, never updated after install. When a thing is
both, it ships as both: `board` is a component and `board-01` is a block, exactly as `app-shell` pairs
with `app-shell-01`. Two narrower types exist: `registry:hook` for a pure hook, and
`registry:lib` for a module with no React in it at all.

**Where a new thing goes — the decision tree.** Ask in order and stop at the first yes:

1. **An existing component already owns the job** → a `variant` or a prop on it.
2. **It is a new named region of an existing compound** → a part (a new flat export).
3. **It is reused, configured through props and tracked for updates** → a component.
4. **It is a page composition copied once that composes at least two components in a way no single
   docs example shows** → a block. A block uses `PageHeader`, `FilterBar`, `DataList`, `Empty` and
   `ActionBar` wherever the page has that region, never an `href="#"`, container queries rather than
   viewport breakpoints for its own layout, `dvh` for viewport heights, and sentence case.
5. **Otherwise** → a docs example on the owning component's page.

Rules that survive the reset, because they are ours and not upstream's:

- **A keeper that wraps an upstream component imports it**, never a copy of it. `date-picker` mounts
  upstream's `calendar`; `number-field`, `chip-input` and `region-select` are upstream's `input-group`;
  `settings-row` is upstream's `Card`; `tool-call-chip` is upstream's `Badge`; `app-shell` is
  upstream's `sidebar` primitives plus the landmarks LAY-12 asks for. A re-derived box is drift with a
  different spelling.
- **A form control never owns its width.** Every one is `w-full`; the parent decides. A fixed `w-56`
  reads fine on the page it was tuned for and overflows at 320px.
- **One engine, one file.** A sanctioned outside engine is imported by exactly one registry item, so
  swapping it touches one file; everything a user sees or reaches — tokens, chrome, focus order,
  keyboard model, announcements — stays ours. The list is closed and each entry is a named MK
  decision (AGENTS.md § Sanctioned dependency exceptions). An engine that starts rendering, owning
  focus, or spreading past its one file has outgrown its sanction, and the decision is reopened rather
  than stretched.
- **A shared internal is not a catalogue entry.** `data-table-parts` and `panel-search` are installed
  as dependencies of the components that need them and documented where those components are
  documented (`coverage.navigation: "exempt"` + `docs: "shared-guide-only"`), the way `geo-data` and
  `drag-item` are. The contract gate asserts the whole shape, so the exemption cannot be
  half-declared.

## Voice & content

Copy is part of the design — precise, no filler. The built-in strings follow the same rules:
upstream's Title Case defaults ("Toggle Sidebar") and three-dot ellipses are rewritten, and each one
can be overridden — an `<action>Label` prop where we add the string, upstream's own prop where it
already has one (VOI-1).

- **Case:** sentence case for everything (buttons, headings, labels, body, toasts). Enforced
  by `design-lint`'s `uppercase-transform` since 2026-09-22 — the rule bans the CSS
  transform, not uppercase text. A transform rewrites whatever it is handed, which is how
  the docs home page came to render the token name `--text-lg` as `--TEXT-LG`. If a string
  is uppercase, write it uppercase in the string.
- **Actions** name a verb + noun (`Deploy project`, `Delete member`) — never `Confirm`, `OK`, or a
  bare verb.
- **Errors** state what happened plus what to do: `Bundle exceeds the 50 MB limit. Remove unused
assets or raise the limit in Settings.` — never just "Something went wrong."
- **Toasts** name the specific thing, drop the trailing period, never say "successfully":
  `main@a1f7c2 deployed`, not `Successfully deployed.`
- **Empty states** point to the first action: `No deployments yet. Deploy your first project →`.
- **In-progress** uses the present participle + ellipsis: `Deploying…`, `Reasoning…`.
- Use numerals (`3 projects`), tabular figures, curly quotes, and the ellipsis character; skip
  "please" and superlatives.

## Accessibility

WCAG 2.2 AA, preserving every 2.1 assertion that was already true. The rules are the A11Y rows above;
what follows is where each one is **proved**, because an accessibility claim with no lane behind it
is a wish.

- **Contrast** — `tooling/contrast-check.mjs` computes every gated pair from OKLCH and fails closed,
  in both themes, including alpha composites. `contrast.browser.test.tsx` measures the same claims on
  **compiled** CSS, which is what catches a class that reads correctly and resolves to nothing.
- **Axe** — one `expectNoA11yViolations(...)` per meaningfully different state (rest, open, disabled,
  invalid, loading), not one smoke test at rest. **There is no suppression list in the registry
  suites**: the two engine defects that used to need one are fixed under A11Y-9, each with a test
  pinning the engine's shape so the fix fails as stale rather than silently rotting.
- **Geometry** — `packages/ui/test/geometry.browser.test.tsx` is the blocking visual-surface gate:
  320px reflow, RTL containment, the effective 24px pointer target through a real `elementFromPoint`
  probe, and the owned focus contract, which rejects the user agent's own ring
  (`outline-style: auto`) by name. It always runs its compiled-CSS/token sentinel, so no assertion can
  pass vacuously over an unstyled fixture, and every exclusion is per assertion and still executed in
  expect-failure mode, so a fixed exclusion turns red instead of rotting.
- **Keyboard** — every interactive affordance reachable and operable by keyboard alone. Base UI gives
  this for its own interaction model; anything hand-rolled (a roving-tabindex group, a hit-area
  expansion, a grid navigation layer) carries its own keyboard test.
- **States** — default, hover, focus, loading, empty, error, success, disabled, wherever applicable.

Two open accessibility gaps are recorded rather than hidden, each pinned by a test that fails the day
it closes: a wide table scrolls in upstream's plain container and is **not** a tab stop (A11Y-6's
second clause, see above), and `@shadcn/react`'s message-scroller viewport is an unconditional tab
stop even when the transcript does not scroll.

## Docs canon

A component's documentation page is part of the component, and it serves humans and agents from the
same source. `tooling/content-lint.mjs` enforces the shape, with a `--self-test` that observes each
rule failing; `tooling/upstream/verify-variant-coverage.mjs` enforces the **content** of row 5 for a
component that is upstream-backed; `tooling/verify-docs-export.mjs` owns the Explorer policy and the
markdown export.

| #   | Section                          | Required content                                                                                                                                                                         | Source of truth                                                                               |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 0   | **Frontmatter**                  | `title`, `description`, `preview`, `registry` (required, never inferred from the slug), `status`, `since`, `a11y`                                                                        | shape validated by `apps/docs/source.config.ts`; `status`/`since` GENERATED from the contract |
| 1   | **Install**                      | one `<InstallSteps>` block — the `shadcn add` command, the item's `registryDependencies` and the engines it pulls in. Never a hand-typed `shadcn add` fence                              | generated from `registry.json`                                                                |
| 2   | **Usage**                        | the minimal import plus one canonical snippet, ≤12 lines                                                                                                                                 | hand-written                                                                                  |
| 3   | **Scope** _(composites)_         | at most three bullets: owns / does not own / compose with                                                                                                                                | hand-written                                                                                  |
| 4   | **Anatomy** _(compounds)_        | every exported part with the `data-slot` names it renders                                                                                                                                | generated from the contract                                                                   |
| 5   | **Examples**                     | **for an upstream-backed component, one `###` per section on upstream's own docs page, in upstream's order**, each with its own live `<ComponentPreview>`; for one of ours, our own list | `vendor/shadcn/<cli>/docs/<name>.json` + `components/preview/<name>.tsx`                      |
| 6   | **Playground** _(where curated)_ | the curated `PropsPlayground`, or the Story explorer where none exists, or neither — never both                                                                                          | `components/*-playground.tsx`                                                                 |
| 7   | **API Reference**                | one flat, expanded table per exported part — name · literal union · default · description. Own props only; a part with no own props gets one sentence, never placeholder rows            | `fumadocs-typescript` + the contract                                                          |
| 8   | **Accessibility**                | the pattern name, the keyboard table, announcements, and `<StatesTested>`                                                                                                                | keyboard table hand-written; states generated                                                 |
| 9   | **Do / Don't**                   | at least two pairs. Closes a page for a component that is **ours**                                                                                                                       | `DoDont`                                                                                      |
| 10  | **Deviations** _(reset pages)_   | one bullet per decision ID the component's patch implements, in the patch header's order. Closes the page, and nothing follows it                                                        | `packages/ui/upstream/patches/<name>.patch`                                                   |

Row 10 is what makes the third success sentence of the reset — "every difference traces to a decision
ID" — checkable by a reader rather than only by a gate.

**A block page is not under this canon.** A block has no prop surface to document, so it lives in
`apps/docs/content/docs/blocks/`, carries `registry`/`preview` frontmatter and a free section list.
The 68 ported chart blocks share seven family gallery pages rather than a page each — the same
shared-surface exemption the animated icons carry, reconciled member by member by
`verify-component-contracts.mjs`.

**Humans and agents read the same page.** Every MDX component renders to markdown for the per-page
`.md` route and `llms-full.txt`; a browser-only surface is replaced by an explicit one-line note
rather than dropped silently. `verify-docs-export.mjs` fails the build on any JSX tag surviving
outside a code fence, any unresolved placeholder, and any empty API table.

**The docs shell obeys this system end to end.** Fumadocs' chrome and the typography plugin are
compiled against Tailwind's stock theme, so their values are remapped once in
`apps/docs/app/global.css`, and `design-lint --docs-shell --emitted-css` reads the **built**
stylesheet to prove it — source linting cannot see a value this repo never wrote.
`tooling/verify-docs-shell.mjs` asserts the rest in a real browser against the built public export,
inside `pnpm verify:distribution`, and its `--self-test` injects, per assertion, the defect that
assertion exists to catch.

## Toolchain — two pinned decisions

Both taken by MK on 2026-09-09, and both are decisions to **hold a version** — the kind that rots
quietly unless the reason is written beside it.

### TypeScript stays at 6.0.3 (DOC-9)

`typescript@7.0.2` is the latest release; this repo pins `6.0.3` through the pnpm catalog.
**Nothing downstream forces the upgrade** — `next@16` declares no `typescript` peer and `react@19`
declares no peers at all, so a consumer's own version is unconstrained by anything we publish.
**The lint toolchain forbids it** — `typescript-eslint@8.70.0`, the latest release, declares
`typescript: ">=4.8.4 <6.1.0"` wherever it declares the peer; no shipped typescript-eslint supports
TypeScript 7, so upgrading would run every type-aware rule on a compiler its authors have not
validated. **fumadocs at 7.0.2 is not drift**: `@fumadocs/story` and `fumadocs-typescript` take their
own copy as a direct dependency for type-table generation, and nothing here type-checks against it.
Revisit when typescript-eslint ships TypeScript 7 support — one
`npm view typescript-eslint peerDependencies` away.

### `tw-animate-css` stays in the public preset

`packages/design/preset.css` opens with `@import "tw-animate-css"`, and the package is a regular
dependency of `@vegastack/design`. It was once argued to be dead weight, on a measurement of zero
`animate-in` / `fade-in` / `zoom-in` / `slide-in-from-*` usages in this repo. **That measurement no
longer holds either way**: since the reset adopted upstream's overlay files verbatim, eleven registry
components use those utilities directly, because that is how shadcn writes an overlay's enter and
exit. And the original reason still stands — the preset is consumer-facing API, `guides/quickstart`
and `guides/troubleshooting` both document that it bundles the package, and `@vegastack/design` older
than 0.1.1 marked it an optional peer pnpm never installed. Removing it would reopen that defect in a
subtler form: a consumer's `animate-in` would compile to nothing and their UI would silently stop
animating. `tooling/verify-test-css-layers.mjs` takes the `@import` **specifier** as its unit, so
every compiled-CSS test lane imports exactly what production imports.

---

> **Provenance.** This is the canonical design contract, rebuilt on shadcn `base-nova` by the shadcn
> reset (`docs/plans/2026-09-18-shadcn-reset/`, approved by MK 2026-09-18) and shipping as a MINOR
> bump, not a 1.0. The decision register is `decisions.md` there, with its machine copy at
> `packages/ui/upstream/decisions.json`; the consumer-facing break is
> `docs/MIGRATING-SHADCN-RESET.md`. The pre-reset v2 fork is history: read
> `docs/ledger/`, `docs/audits/` and `docs/plans/` for **why** something was once decided, never as
> evidence of what is true now. v1, the pre-overhaul grey/`action`+`agent` system, is preserved at
> `design-v1.md`. Append-only normative `VS-*` rule IDs and external-source dispositions live in
> `docs/research/design-md-audit/unified-reference.md`.
