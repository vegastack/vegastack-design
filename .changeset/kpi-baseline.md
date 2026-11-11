---
"@vegastack/ui": patch
---

🐛 **KpiCard + KpiGrid**: values in a row sit on one line whatever the label length. In a `KpiGrid` each tile's label, value, delta and sparkline share the row's tracks (`grid-rows-subgrid`), so a label that wraps to two lines ("Transcription and other services") no longer pushes its value below its neighbours'.
[docs](https://design.vegastack.com/docs/components/kpi-card)
