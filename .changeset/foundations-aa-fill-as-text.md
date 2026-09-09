---
"@vegastack/design-tokens": minor
"@vegastack/design": patch
"@vegastack/ui": minor
---

🐛 **Two shipped WCAG 1.4.3 failures in brand and status colour, and the three gates that could not
see them.** The `destructive` `Bubble` was the only place in the registry that used a solid FILL
token as body text — `text-destructive` over `bg-destructive/(--alpha-soft-surface)` measured
5.24 / 4.31 / 4.44:1 in light and 2.56 / 2.37 / 1.78:1 in dark across rest/hover/pressed, and its
light ladder inverted (hover L 0.874, pressed L 0.883) because the pressed step jumped to a
precomposed token sitting on a different ground. It is now the same soft recipe the four soft
Buttons use — `bg-destructive-subtle` / `-hover` / `-active` with `destructive-text` ink — measuring
5.80 / 5.13 / 4.69 light and 6.14 / 5.02 / 4.61 dark, monotone in both. The `tinted` variant's
pressed step, which composited to L 0.921 against a `surface-3` hover at 0.922, moves to
`--alpha-ink-tint-strong` so a press is visible. The `cta` Button painted its 0.75rem/400 mono label
in `text-brand`, a 3.5:1 MARKER value, measuring 3.41 / 3.33 / 3.21:1 in light on the public docs
playground; the family now ships **`brand-text`**, the page-readable half every chromatic family
already has, and the label re-measures 5.93 / 5.80 / 5.59 light and 11.41 / 10.90 / 10.13 dark. The
hovered-link dim (`--alpha-link-hover`, on the `link` Button, every rendered rich-text link through
`prose`, and PropertyList) composited `success`/`info`/`warning` ink to 4.03–4.11:1 in light at 80%
and is now 88%, re-measured 4.74–4.83:1. `--alpha-soft-hover` and `--alpha-soft-surface` are
**removed**: their only consumer was that Bubble line, and `--alpha-soft-hover` was a second, 13pp
different answer to the role `sd-hooks.mjs`'s `SUBTLE_HOVER_ALPHA` already owns.
`--font-display` / `--font-pixel` are now bridged into `@theme inline`, so D17's sanctioned Geist
Pixel flourish is reachable. Gates: `contrast-check.mjs` measures `brand-text` and the link-hover
composite (both observed failing on the pre-fix theme); `design-lint` gains `fill-token-as-text` and
`field-group-pairing`, both with negative fixtures; `verify-token-references` and `design-lint` now
cover `packages/design/src`, where every shared recipe lives and where a bogus token previously
exited 0; and `verify-docs-base-mirror` now mirrors the `::view-transition-*` reduced-motion
companion rule the docs copy had silently lost.
[docs](https://design.vegastack.com/docs/components/button)
