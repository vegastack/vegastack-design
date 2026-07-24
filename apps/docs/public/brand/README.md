# VegaStack brand assets

The logo geometry in this directory is sourced from the private
`vegastack/mktg-vegastack-website-2026` repository at commit
`a6a6abc5e1c1585ba82dd94a603d6e87f2739f4a`.

Authoritative source files:

- `src/assets/vegastack-wordmark.svg`
- `src/assets/vegastack-logo.svg`
- `public/favicon.svg`

The SVGs preserve the original paths. Generated PNG/ICO files only add the VegaStack Design
surface colors and icon padding needed by browser, manifest, Apple, and Open Graph contexts.

SHA-256 provenance:

| Asset             | Authoritative source                                               | Normalized docs asset                                              |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Wordmark          | `c3a7ce1f09ca855c38c8eb1d8c87cd4a97516947fdf576a07e4141961249b36c` | `38e893431431bf0a92e10bbdac3495293b29d4e824beb67d5c4484cc5e5cef28` |
| V mark            | `4b151bf7438f0e199b833143e962a82dd9569ed4c6bd0b8739fd8bc6ef9de039` | `ac6ecae3efb0fe0b7072f0cf5ca1e0faf2226f3e39dbbd14f99ae707b3c92319` |
| Marketing favicon | `98710d5ea97961bac6097128e8db3666bc4249dce8a48440db3f0d18227ed706` | Used as a visual reference for browser surfaces                    |

Normalization removes the Illustrator XML declaration, generator comment, redundant groups,
inline black fills, and editor-only attributes. The `viewBox` values are unchanged, and the SVG
path command/coordinate sequences remain geometrically identical after insignificant whitespace
normalization (the serialized `d` strings are not claimed to be byte-for-byte identical).
Theme-aware consumers apply color outside the geometry; `app/icon.svg` adds only light/dark fill
rules. The built-output metadata verifier compares normalized V-mark geometry and the complete
wordmark path count so normalization drift fails the build.
