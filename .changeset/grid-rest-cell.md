---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **DataGrid**: a horizontal scroll tick at 150 columns now stays under 8 ms of main-thread time. A cell whose column has a `custom` editor rests as `EditableCellRest` — the same button, name, description, box and activation as `EditableCell`'s display, in one element with no state or effects — and becomes the full `EditableCell` once it edits or the host reports a save status (and stays one while mounted, so a save in flight keeps its optimistic value). A header's menu mounts its machinery once the header is pointed at, focused or opened. The row window overscans two rows. The observer that keeps cell content out of the tab order looks only at what each change added instead of searching the whole table. [docs](https://design.vegastack.com/docs/components/editable-cell)
