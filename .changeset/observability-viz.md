---
"@vegastack/ui": minor
---

🐛 **KpiCard + KpiGrid + Chart + Progress**: data reads by meaning, and the right layout is the component's own. `KpiCard` shows a muted "—" with an `empty` reason ("Needs 5 ratings") when `value` is `null`, takes a typed `tone` (`neutral` · `success` · `warning` · `danger`) for the value and sparkline and a `series` hue for a measure, and draws a sparkline only with at least three points of data, as a line over a soft area from zero. `KpiGrid` balances: up to six tiles it takes only column counts that fill every row. `ChartConfig` takes a typed `tone` (`series-1`…`8`, `single`, status tones); a tooltip row is a grid with a gap, a truncating label and a right-aligned `tabular-nums` value, so a long name never runs into its number, with `valueFormatter` for the value cell; legends wrap. `Progress` gains `tone="success"` and `size="lg"` (API-42, API-43).
[docs](https://design.vegastack.com/docs/components/kpi-card)
