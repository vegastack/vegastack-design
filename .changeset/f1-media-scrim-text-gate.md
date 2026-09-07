---
"@vegastack/design-tokens": patch
---

Gate `media-foreground` on `media-scrim` at the AA **text** floor (4.5:1) instead of the 3:1
non-text floor. The token contract already permitted labels on the soft media scrim while the
contrast gate only checked it as a graphic; the pair measures 5.22:1 over the white worst case, so
the stricter floor holds today and now fails the build if a future scrim retune thins it under AA.
The `media-scrim`, `media-scrim-strong` and `media-foreground` descriptions state where text is
allowed and which floor enforces it. No token value changes.
