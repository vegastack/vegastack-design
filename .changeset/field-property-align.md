---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 **FieldProperty** values sit where a property's value starts. A read-only number, currency, percent or calculated value no longer slides to the far end of the row: `FieldCellDisplay` takes a new `align` prop (`"start" | "end"`; by default a number keeps the grid column's end alignment), and FieldProperty passes `align="start"`. An open editor now fills the value column instead of shrinking to the value, and its box hangs over the line as the resting value's does, so the row keeps its height entering and leaving edit and the text stays put. A long text shows its first line as typed — the editor's Markdown escapes (`\#`, `1\.`) undone and mentions by name — at rest, in a grid cell and in a property row alike; only the editor shows the source. The new `typedFirstLine` and `mentionLabels` helpers in `text-edit-grammar` do it. A date-time editor keeps its date and time on one line where they fit, and the time no longer clips "PM". [docs](https://design.vegastack.com/docs/components/field-cell)
