---
"@vegastack/design-tokens": patch
---

🐛 **Text on the soft media scrim is gated at AA** — `media-foreground` on `media-scrim` was
checked only against the 3:1 non-text floor while the token contract permitted labels on it, so the
contract was wider than its enforcement. The pair is now gated at 4.5:1; it measures 5.22:1 over the
white worst case, so nothing moves today and a future scrim retune that thins it under AA fails the
build instead of silently demoting its labels. The `media-scrim`, `media-scrim-strong` and
`media-foreground` descriptions state where text is allowed and which floor enforces it. No token
value changes.
[docs](https://design.vegastack.com/docs/foundations/colors)
