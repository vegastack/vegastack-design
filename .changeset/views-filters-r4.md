---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **Views and filters** (Regent R4). **ViewTabs** (new): a table's saved views as a line tab row — shared views, a divider, then the reader's own under "Mine"; a lock on a locked view; `onCreate(kind, scope)` adds a + menu for a grid or board view, shared or personal; `getViewActions(view)` fills the open view's ⋯ menu; below `@3xl` of its own container the row is one `Select` with the same groups. **filter-bar-managed**: `SortBuilder` (up to three `{ key, dir }` keys on `SortableList`, read-only chips) and `GroupByPicker` (up to two levels); value editors `DateValueEditor` (exact day, Today, This week, Last N days, and `{ from, to }` for a range), `PersonValueEditor` (on `PeoplePicker`, with Me as `FILTER_ME`, several for a list operator), `CheckboxValueEditor` and `LinkValueEditor` (async record search through the field's `search`, stores `{ id, label }`); `FilterField` takes `people` and `search`; an `editors` key `<type>:range` or `<type>:list` wins for that type alone; `describeFilter` and the chips read the new values. [docs](https://design.vegastack.com/docs/components/view-tabs)
