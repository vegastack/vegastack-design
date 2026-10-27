---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **FilterBuilder**, **GroupByPicker**, **DataGrid**: "Add group" no longer means two things — `FilterBuilder`'s nested-condition button reads "Add condition group" (`labels.addGroup`), and `GroupByPicker`'s add button reads "Group by" while no level is set and "Add level" once one is (new `labels` prop: `groupBy`, `addLevel`). A selected row's frozen cells now take the row's selected wash instead of staying white (the frozen cell and phone card matched the tokens' `data-selected` variant, which reads `[data-selected="true"]`, against the row's empty attribute). Phone cards (`phoneLayout="cards"`) leave out a field with no value instead of printing its label over a blank line, and a row whose primary value is empty reads a muted "Untitled" in its primary cell and as its card title (new `emptyPrimaryLabel`, default "Untitled"). [docs](https://design.vegastack.com/docs/components/data-grid)
