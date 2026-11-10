---
"@vegastack/ui": minor
---

🧩 **KpiCard + KpiGrid** (new): a dashboard KPI tile — the `lg` `Stat` in `Card` chrome, with an optional `hint` (an `InfoHint` beside the label), a `delta` whose `tone` (`positive`/`negative`/`neutral`) sets the ink separately from its `direction`, a 24px aria-hidden `spark` line in `--chart-single`, and `linkRender`, which stretches your router's link over the whole tile. The tile is named "label: value, delta"; `value={null}` reads "No data"; `loading` shows the `lg` `StatSkeleton`. `KpiGrid` lays tiles out 2 / 3 (`sm`) / 4 (`lg`) / 7 (`xl`) across. **Heatmap** (new): counts over two dimensions as an ARIA grid with row and column headers, five quintile steps of `--chart-single` over `--card` (45–100%, the lowest 3:1 from the `muted` zero cell in both themes), roving focus with arrows and Home/End, a `Tooltip` with each cell's `cellLabel`, an optional legend and an `empty` state.
[docs](https://design.vegastack.com/docs/components/kpi-card) · [docs](https://design.vegastack.com/docs/components/heatmap)
