---
"@vegastack/ui": minor
---

🧩 `DataListSkeleton`, a DataList and its ListToolbar while they load, in the list's own geometry (table rows or grid cards), importing only `Table` and `Skeleton`, so a route's loading state never loads the list. `DataList` gains `rowOpenGestures`: a ⌘/Ctrl or middle click opens a row through `onRowOpen` with `background: true`, and a double-click calls it with `keep: true` (off by default; `RowOpenDetails` gains the two optional fields).
