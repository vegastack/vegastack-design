---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 An embedded **DataGrid** inside a **TextEdit** page (a live table block) keeps its pinned column pinned while it scrolls sideways. The editor's column-resize rule set `position: relative` on every `td`/`th` beneath it, which beat the frozen cells' `sticky`. It now reaches only the editor's own table cells, as does its `table-fixed`. The prose recipe's table rules (borders, padding, header ground) also leave alone anything under `[data-prose="off"]`, which DataGrid's root now carries, so a grid in a page's prose draws exactly as it does on a table page: its pinned header stays opaque and its cells keep their own padding. The read view's pinned column already stayed put. [docs](https://design.vegastack.com/docs/components/data-grid)
