---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **KpiCard + KpiGrid**: labels and text values now wrap instead of truncating ("Not enough ratings" no longer reads "Not e…"), with the `hint` kept on the label's first line. `KpiGrid` sizes tiles to its own width rather than the viewport — as many 10rem-or-wider tiles per row as fit, two on a phone — so it works inside a settings column instead of squeezing 7 tiles into it.
[docs](https://design.vegastack.com/docs/components/kpi-card)
