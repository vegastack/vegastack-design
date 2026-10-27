---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **FilterBuilder**, **GroupByPicker**: "Add group" no longer means two things. `FilterBuilder`'s nested-condition button reads "Add condition group" (new `labels.addGroup`), and `GroupByPicker`'s add button reads "Group by" while no level is set and "Add level" once one is (new `labels` prop, `GroupByPickerLabels`: `groupBy`, `addLevel`). [docs](https://design.vegastack.com/docs/components/filter-bar-managed)
