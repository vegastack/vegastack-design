# @vegastack/design-tokens

## 0.2.0

### Minor Changes

- [#2](https://github.com/vegastack/vegastack-design/pull/2) [`ae0d024`](https://github.com/vegastack/vegastack-design/commit/ae0d02428b5adb63f5584e2d988d006d1b7c736f) Thanks [@kmanojkumar](https://github.com/kmanojkumar)! - Publish the unified VegaStack design doctrine as generated DTCG-backed `design.md` data, add the
  named strong-type and effect roles, keep dark and marketing themes in exact parity, and normalize
  animated icons to React 19 ref props with intrinsic reduced-motion behavior.

  Add the `@vegastack/design/theme-scope` subpath for the `@internal` portal theme-scope plumbing.
  It is a client module (module-scope `React.createContext`), so it is deliberately NOT re-exported
  from the root entry — the root stays importable from a React Server Component, which is what every
  server-safe component relies on when it imports `cn`.

## 0.1.0 — first release (2026-07-18)

The DTCG → Style Dictionary token layer (OKLCH, light + dark):

- Warm-neutral palette; neutral primary; brand = phosphor accent (`--brand`), info = blue.
- Two-layer type scale (product + doc ladders) with a display tier (32/40/56/72, weight 400).
- 24 alpha/opacity role tokens; two z bands; control/icon/radius/sidebar size scales.
- Motion: duration + ease tokens (incl. a `linear()` spring), `motion-pop-in`/`motion-enter-up`/`motion-shake`
  mount utilities, `scroll-fade-*` affordances; reduced-motion resets baked in (incl. `::view-transition-*`).
- The `.vs-marketing` scope: dark brand ground, Newsreader serif + Geist Pixel font tokens, `text-mono-label` voice.
