# @vegastack/design-tokens

## 0.1.0 — first release (2026-07-18)

The DTCG → Style Dictionary token layer (OKLCH, light + dark):

- Warm-neutral palette; neutral primary; brand = phosphor accent (`--brand`), info = blue.
- Two-layer type scale (product + doc ladders) with a display tier (32/40/56/72, weight 400).
- 24 alpha/opacity role tokens; two z bands; control/icon/radius/sidebar size scales.
- Motion: duration + ease tokens (incl. a `linear()` spring), `motion-pop-in`/`motion-enter-up`/`motion-shake`
  mount utilities, `scroll-fade-*` affordances; reduced-motion resets baked in (incl. `::view-transition-*`).
- The `.vs-marketing` scope: dark brand ground, Newsreader serif + Geist Pixel font tokens, `text-mono-label` voice.
