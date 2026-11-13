# VegaStack brand assets

## The V mark (canonical)

`vegastack-mark.svg` is the canonical VegaStack V for every VegaStack surface: web, mobile, desktop
and this site. Its geometry is the high-precision master from the private
`vegastack/engg-clients-regent-ai-platform-mobile-app` repository, `tool/branding/source/vegastack-v.svg`
at commit `830cd00ce2e9dc30820dee848e72b007d103c1b3` (the same path the web app's `icon.svg` uses).
It replaced the earlier 60-unit mark from the marketing site, whose coordinates were rounded to two
decimals at 1/40 of this scale (operator decision, 14-11-2026).

The ink is `#0A0A0A`, the same as the mobile and desktop app icons. Theme-aware consumers recolour it
outside the geometry; `app/icon.svg` adds only light/dark fill rules.

## The wordmark

The wordmark is sourced from the private `vegastack/mktg-vegastack-website-2026` repository at commit
`a6a6abc5e1c1585ba82dd94a603d6e87f2739f4a`, file `src/assets/vegastack-wordmark.svg`. The marketing
favicon (`public/favicon.svg`) is a visual reference for browser surfaces.

## Provenance

| Asset             | Authoritative source                                               | Normalized docs asset                                              |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| V mark            | `6cef7a23b34288ceb266f849b0f71f6498b1195981b6de27341ea76c556f0014` | `c292ec84ae7e0fbc41825ddad6eb6709e4825f52761e83c61ce3a09f713dd127` |
| Wordmark          | `c3a7ce1f09ca855c38c8eb1d8c87cd4a97516947fdf576a07e4141961249b36c` | `38e893431431bf0a92e10bbdac3495293b29d4e824beb67d5c4484cc5e5cef28` |
| Marketing favicon | `98710d5ea97961bac6097128e8db3666bc4249dce8a48440db3f0d18227ed706` | Used as a visual reference for browser surfaces                    |

Normalization removes the Illustrator XML declaration, generator comment, `<style>` class and
editor-only attributes, and collapses whitespace in the path data. The `viewBox` values are
unchanged, and the path's command and coordinate sequence is identical to the source. The mark sets
its ink as `fill="#0A0A0A"` on the root element. The built-output metadata verifier compares the
normalized V-mark geometry with `app/icon.svg` and the complete wordmark path count, so
normalization drift fails the build.

## Raster icons

`favicon.ico` (16, 32, 48), `apple-icon.png` (180) and `icon-192.png` / `icon-512.png` are rendered
from `vegastack-mark.svg` with only the VegaStack Design surface colours and padding added: the V
spans 76% of the tile width (75% in the favicon frames), centred on its bounding box, `#e6e5e3` on
`#11100f` for the app icons and `#11100f` on `#fdfdfc` for the favicon.
