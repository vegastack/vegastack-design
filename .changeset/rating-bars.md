---
"@vegastack/ui": patch
---

🧩 **RatingBars** (new): a short qualitative rating — a label, a row of `max` segments (default 5) of which the first `value` are lit, and a word after them (`valueText`). The root is one `role="meter"` named by `label` with `aria-valuetext` set to `valueText`; the segments are `aria-hidden`. Lit segments take `bg-primary`, unlit ones the `bg-muted` track that `Progress` uses; `value={null}` lights none. `size` is `default` (12×8px segments) or `sm` (10×6px). Server-safe, no motion.
[docs](https://design.vegastack.com/docs/components/rating-bars)
